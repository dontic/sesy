import logging
import time

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from celery import shared_task
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger("sesy")


def _ses_client_from_config(config):
    return boto3.client(
        "ses",
        aws_access_key_id=config.aws_access_key_id,
        aws_secret_access_key=config.aws_secret_access_key,
        region_name=config.aws_region,
    )


def _build_unsubscribe_footer(unsubscribe_url: str) -> str:
    return (
        '<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e0e0e0;'
        'text-align:center;font-size:12px;color:#888888;font-family:sans-serif;">'
        "You are receiving this email because you are subscribed to our mailing list.<br>"
        f'<a href="{unsubscribe_url}" style="color:#888888;">Unsubscribe</a>'
        "</div>"
    )


def _inject_footer(html: str, footer: str) -> str:
    lower = html.lower()
    idx = lower.rfind("</body>")
    if idx != -1:
        return html[:idx] + footer + html[idx:]
    return html + footer


@shared_task
def send_campaign_task(campaign_pk: int) -> None:
    from .models import AudienceMember, Campaign, SESConfiguration

    campaign = (
        Campaign.objects.select_related("project")
        .prefetch_related("tags")
        .get(pk=campaign_pk)
    )

    ses_config = SESConfiguration.get_solo()
    if not ses_config.aws_access_key_id:
        logger.error("Campaign %s: SES configuration is not set up.", campaign_pk)
        campaign.status = Campaign.STATUS_FAILED
        campaign.save(update_fields=["status"])
        return

    if campaign.send_to_all:
        recipients = list(AudienceMember.objects.filter(project=campaign.project, subscribed=True))
    else:
        recipients = list(
            AudienceMember.objects.filter(
                project=campaign.project,
                subscribed=True,
                tags__in=campaign.tags.all(),
            ).distinct()
        )

    client = _ses_client_from_config(ses_config)

    from_address = (
        f"{campaign.from_name} <{campaign.from_email}>"
        if campaign.from_name
        else campaign.from_email
    )

    campaign.status = Campaign.STATUS_SENDING
    campaign.save(update_fields=["status"])

    try:
        for i, member in enumerate(recipients):
            if i > 0 and ses_config.sending_rate > 0:
                time.sleep(1.0 / ses_config.sending_rate)

            html = campaign.html_body.replace(
                "{{first_name}}", member.first_name
            ).replace("{{last_name}}", member.last_name)

            subject = campaign.subject.replace(
                "{{first_name}}", member.first_name
            ).replace("{{last_name}}", member.last_name)

            unsubscribe_url = (
                f"{settings.FRONTEND_URL}/unsubscribe"
                f"?email={member.email}&project={campaign.project.pk}"
            )
            footer = _build_unsubscribe_footer(unsubscribe_url)
            html = _inject_footer(html, footer)

            client.send_email(
                Source=from_address,
                Destination={"ToAddresses": [member.email]},
                Message={
                    "Subject": {"Data": subject, "Charset": "UTF-8"},
                    "Body": {"Html": {"Data": html, "Charset": "UTF-8"}},
                },
            )
            logger.info("Campaign %s: sent to %s", campaign_pk, member.email)

        campaign.status = Campaign.STATUS_SENT
        campaign.sent_at = timezone.now()
        campaign.save(update_fields=["status", "sent_at"])
        logger.info(
            "Campaign %s sent successfully to %d recipients.",
            campaign_pk,
            len(recipients),
        )
    except (BotoCoreError, ClientError) as exc:
        logger.error("Campaign %s failed: %s", campaign_pk, exc)
        campaign.status = Campaign.STATUS_FAILED
        campaign.save(update_fields=["status"])
        raise


@shared_task
def check_pending_identities_task() -> None:
    from .models import VerifiedDomain

    pending_domains = list(VerifiedDomain.objects.filter(status=VerifiedDomain.STATUS_PENDING))
    if not pending_domains:
        return

    now = timezone.now()
    for domain in pending_domains:
        try:
            _, domain.status, domain.mail_from_status = domain.check_dns()
        except Exception as exc:
            logger.error("check_pending_identities_task: DNS check failed for %s: %s", domain.domain, exc)
            continue
        domain.last_checked_at = now
        domain.save(update_fields=["status", "mail_from_status", "last_checked_at"])
