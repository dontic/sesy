from django.contrib.postgres.operations import UnaccentExtension
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("sesy", "0002_apikey_name_alter_apikey_user"),
    ]

    operations = [
        UnaccentExtension(),
    ]
