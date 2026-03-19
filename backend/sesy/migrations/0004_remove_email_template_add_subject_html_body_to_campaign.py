from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("sesy", "0003_add_subscribed_to_audience_member"),
    ]

    operations = [
        # Remove template FK from Campaign
        migrations.RemoveField(
            model_name="campaign",
            name="template",
        ),
        # Add subject and html_body directly to Campaign
        migrations.AddField(
            model_name="campaign",
            name="subject",
            field=models.CharField(max_length=998, default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="campaign",
            name="html_body",
            field=models.TextField(
                help_text="HTML body. Use {{first_name}} and {{last_name}} for personalization.",
                default="",
            ),
            preserve_default=False,
        ),
        # Drop the EmailTemplate model
        migrations.DeleteModel(
            name="EmailTemplate",
        ),
    ]
