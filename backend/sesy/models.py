import dns.exception
import dns.resolver
from django.db import models
from django.conf import settings
from solo.models import SingletonModel


class SESConfiguration(SingletonModel):
    PRODUCTION_STATUS_UNKNOWN = "unknown"
    PRODUCTION_STATUS_SANDBOX = "sandbox"
    PRODUCTION_STATUS_PRODUCTION = "production"
    PRODUCTION_STATUS_CHOICES = [
        (PRODUCTION_STATUS_UNKNOWN, "Unknown"),
        (PRODUCTION_STATUS_SANDBOX, "Sandbox"),
        (PRODUCTION_STATUS_PRODUCTION, "Production"),
    ]

    aws_access_key_id = models.CharField(max_length=255)
    aws_secret_access_key = models.CharField(max_length=255)
    aws_region = models.CharField(max_length=50, default="us-east-1")
    sending_rate = models.FloatField(default=14.0, help_text="Max emails per second")
    production_status = models.CharField(
        max_length=20,
        choices=PRODUCTION_STATUS_CHOICES,
        default=PRODUCTION_STATUS_UNKNOWN,
    )
    max_sending_rate = models.FloatField(
        null=True,
        blank=True,
        help_text="Max sending rate (emails/sec) retrieved from AWS SES",
    )
    config_valid = models.BooleanField(
        default=False,
        help_text="Indicates whether the AWS credentials are valid and reachable",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"SES Configuration ({self.aws_region})"


class Project(models.Model):

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return self.name


class VerifiedDomain(models.Model):
    STATUS_PENDING = "pending"
    STATUS_VERIFIED = "verified"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_VERIFIED, "Verified"),
        (STATUS_FAILED, "Failed"),
    ]

    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name="domain",
    )
    domain = models.CharField(max_length=255, unique=True)
    verification_token = models.CharField(max_length=255, blank=True)
    dkim_tokens = models.JSONField(default=list, blank=True)
    mail_from_domain = models.CharField(max_length=255, blank=True)
    mail_from_status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    aws_region = models.CharField(max_length=50, blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    last_checked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.domain

    def check_dns(self):
        """
        Performs live DNS lookups for all expected records.
        Returns (records, domain_status, mail_from_status) where records is a list of
        {type, name, value, status} dicts with status "present" or "missing".
        """
        resolver = dns.resolver.Resolver()
        resolver.nameservers = ["1.1.1.1", "8.8.8.8"]

        records = []

        # TXT verification record
        txt_present = False
        if self.verification_token:
            try:
                answers = resolver.resolve(f"_amazonses.{self.domain}", "TXT")
                for rdata in answers:
                    if self.verification_token in [s.decode() for s in rdata.strings]:
                        txt_present = True
                        break
            except (
                dns.resolver.NXDOMAIN,
                dns.resolver.NoAnswer,
                dns.exception.DNSException,
            ):
                pass
            records.append(
                {
                    "type": "TXT",
                    "name": f"_amazonses.{self.domain}",
                    "value": self.verification_token,
                    "status": "present" if txt_present else "missing",
                }
            )

        # DKIM CNAME records
        dkim_results = []
        for token in self.dkim_tokens:
            present = False
            try:
                answers = resolver.resolve(
                    f"{token}._domainkey.{self.domain}", "CNAME"
                )
                expected = f"{token}.dkim.amazonses.com"
                for rdata in answers:
                    if str(rdata.target).rstrip(".") == expected:
                        present = True
                        break
            except (
                dns.resolver.NXDOMAIN,
                dns.resolver.NoAnswer,
                dns.exception.DNSException,
            ):
                pass
            dkim_results.append(present)
            records.append(
                {
                    "type": "CNAME",
                    "name": f"{token}._domainkey.{self.domain}",
                    "value": f"{token}.dkim.amazonses.com",
                    "status": "present" if present else "missing",
                }
            )

        domain_status = (
            self.STATUS_VERIFIED
            if (txt_present and all(dkim_results))
            else self.STATUS_PENDING
        )

        # MAIL FROM: MX + SPF TXT
        mail_from_status = self.STATUS_PENDING
        if self.mail_from_domain and self.aws_region:
            expected_mx = f"feedback-smtp.{self.aws_region}.amazonses.com"
            mx_ok = False
            try:
                answers = resolver.resolve(self.mail_from_domain, "MX")
                for rdata in answers:
                    if str(rdata.exchange).rstrip(".") == expected_mx:
                        mx_ok = True
                        break
            except (
                dns.resolver.NXDOMAIN,
                dns.resolver.NoAnswer,
                dns.exception.DNSException,
            ):
                pass
            records.append(
                {
                    "type": "MX",
                    "name": self.mail_from_domain,
                    "value": f"feedback-smtp.{self.aws_region}.amazonses.com",
                    "priority": 10,
                    "status": "present" if mx_ok else "missing",
                }
            )

            spf_ok = False
            try:
                answers = resolver.resolve(self.mail_from_domain, "TXT")
                for rdata in answers:
                    for s in rdata.strings:
                        if b"v=spf1 include:amazonses.com" in s:
                            spf_ok = True
                            break
            except (
                dns.resolver.NXDOMAIN,
                dns.resolver.NoAnswer,
                dns.exception.DNSException,
            ):
                pass
            records.append(
                {
                    "type": "TXT",
                    "name": self.mail_from_domain,
                    "value": "v=spf1 include:amazonses.com ~all",
                    "status": "present" if spf_ok else "missing",
                }
            )

            mail_from_status = (
                self.STATUS_VERIFIED if (mx_ok and spf_ok) else self.STATUS_PENDING
            )

        # DMARC TXT record
        dmarc_ok = False
        try:
            answers = resolver.resolve(f"_dmarc.{self.domain}", "TXT")
            for rdata in answers:
                for s in rdata.strings:
                    if b"v=DMARC1" in s:
                        dmarc_ok = True
                        break
        except (
            dns.resolver.NXDOMAIN,
            dns.resolver.NoAnswer,
            dns.exception.DNSException,
        ):
            pass
        records.append(
            {
                "type": "TXT",
                "name": f"_dmarc.{self.domain}",
                "value": "v=DMARC1; p=none;",
                "status": "present" if dmarc_ok else "missing",
            }
        )

        return records, domain_status, mail_from_status


class Tag(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="tags",
    )
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        unique_together = [("project", "name")]

    def __str__(self):
        return self.name


class AudienceMember(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="audience_members",
    )
    email = models.EmailField()
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    subscribed = models.BooleanField(default=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name="audience_members")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = [("project", "email")]

    def __str__(self):
        return f"{self.email} ({self.project.name})"


class Campaign(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_SENDING = "sending"
    STATUS_SENT = "sent"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_SENDING, "Sending"),
        (STATUS_SENT, "Sent"),
        (STATUS_FAILED, "Failed"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="campaigns",
    )
    name = models.CharField(max_length=255)
    from_email = models.EmailField()
    from_name = models.CharField(max_length=255, blank=True)
    subject = models.CharField(max_length=998)
    html_body = models.TextField(
        help_text="HTML body. Use {{first_name}} and {{last_name}} for personalization."
    )
    send_to_all = models.BooleanField(
        default=True,
        help_text="Send to all audience members. If False, only send to members with the specified tags.",
    )
    tags = models.ManyToManyField(
        Tag,
        blank=True,
        related_name="campaigns",
        help_text="Audience filter tags. Only used when send_to_all is False.",
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT
    )
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.project.name})"
