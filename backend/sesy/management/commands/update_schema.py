from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand

DEFAULT_SCHEMA_PATH = (
    Path(settings.BASE_DIR).parent / "frontend" / "src" / "api" / "schemas" / "django" / "schema.yaml"
)


class Command(BaseCommand):
    help = "Regenerate the OpenAPI schema used by the frontend (Orval) with drf-spectacular."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            default=str(DEFAULT_SCHEMA_PATH),
            help=f"Output path for the schema (default: {DEFAULT_SCHEMA_PATH}).",
        )

    def handle(self, *args, **options):
        output = Path(options["file"])
        output.parent.mkdir(parents=True, exist_ok=True)

        call_command("spectacular", file=str(output), validate=True)

        self.stdout.write(self.style.SUCCESS(f"Schema written to {output}"))
