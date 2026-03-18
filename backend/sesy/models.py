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
        ordering = ["-created_at"]

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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    last_checked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.domain


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
    tags = models.ManyToManyField(Tag, blank=True, related_name="audience_members")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["email"]
        unique_together = [("project", "email")]

    def __str__(self):
        return f"{self.email} ({self.project.name})"


class EmailTemplate(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="email_templates",
    )
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=998)
    html_body = models.TextField(
        help_text="HTML body. Use {{first_name}} and {{last_name}} for personalization."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = [("project", "name")]

    def __str__(self):
        return f"{self.name} ({self.project.name})"


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
    template = models.ForeignKey(
        EmailTemplate,
        on_delete=models.PROTECT,
        related_name="campaigns",
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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.project.name})"
