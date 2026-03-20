import csv
import io

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from django.db import IntegrityError
from django.utils import timezone
from rest_framework import mixins, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    inline_serializer,
    OpenApiParameter,
)
from rest_framework import serializers as drf_serializers
from rest_framework.request import Request
from .models import (
    ApiKey,
    Project,
    Tag,
    AudienceMember,
    SESConfiguration,
    Campaign,
    VerifiedDomain,
)
from .serializers import (
    ApiKeySerializer,
    ProjectSerializer,
    PublicAudienceMemberSerializer,
    TagSerializer,
    AudienceMemberSerializer,
    AudienceMemberCsvUploadSerializer,
    SESConfigurationSerializer,
    CampaignSerializer,
    VerifiedDomainSerializer,
    UnsubscribeSerializer,
)


def _get_ses_client():
    config = SESConfiguration.get_solo()
    if not config.aws_access_key_id:
        raise ValidationError({"detail": "SES configuration has not been set up."})
    return boto3.client(
        "ses",
        aws_access_key_id=config.aws_access_key_id,
        aws_secret_access_key=config.aws_secret_access_key,
        region_name=config.aws_region,
    )


@extend_schema_view(
    list=extend_schema(tags=["Projects"]),
    create=extend_schema(tags=["Projects"]),
    retrieve=extend_schema(tags=["Projects"]),
    update=extend_schema(tags=["Projects"]),
    destroy=extend_schema(tags=["Projects"]),
)
class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "put", "delete", "head", "options", "trace"]

    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user)


@extend_schema_view(
    list=extend_schema(tags=["Tags"]),
    create=extend_schema(tags=["Tags"]),
    retrieve=extend_schema(tags=["Tags"]),
    update=extend_schema(tags=["Tags"]),
    destroy=extend_schema(tags=["Tags"]),
)
class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "put", "delete", "head", "options", "trace"]

    def _get_project(self):
        project = Project.objects.filter(
            pk=self.kwargs["project_pk"],
            owner=self.request.user,
        ).first()
        if not project:
            raise PermissionDenied()
        return project

    def get_queryset(self):
        return Tag.objects.filter(project=self._get_project())

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["project"] = self._get_project()
        return context


class AudienceMemberPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


@extend_schema_view(
    list=extend_schema(tags=["Audience Members"]),
    create=extend_schema(tags=["Audience Members"]),
    retrieve=extend_schema(tags=["Audience Members"]),
    update=extend_schema(tags=["Audience Members"]),
    destroy=extend_schema(tags=["Audience Members"]),
)
class AudienceMemberViewSet(viewsets.ModelViewSet):
    serializer_class = AudienceMemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = AudienceMemberPagination
    http_method_names = ["get", "post", "put", "delete", "head", "options", "trace"]

    def _get_project(self):
        project = Project.objects.filter(
            pk=self.kwargs["project_pk"],
            owner=self.request.user,
        ).first()
        if not project:
            raise PermissionDenied()
        return project

    def get_queryset(self):
        return AudienceMember.objects.filter(
            project=self._get_project()
        ).prefetch_related("tags")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["project"] = self._get_project()
        return context

    @extend_schema(
        tags=["Audience Members"],
        request={"multipart/form-data": AudienceMemberCsvUploadSerializer},
        responses={
            200: {
                "type": "object",
                "properties": {
                    "created": {"type": "integer"},
                    "skipped": {"type": "integer"},
                    "total_rows": {"type": "integer"},
                },
            }
        },
    )
    @action(detail=False, methods=["post"], url_path="upload-csv")
    def upload_csv(self, request, project_pk=None):
        project = self._get_project()

        serializer = AudienceMemberCsvUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        csv_file = serializer.validated_data["file"]

        raw = csv_file.read()
        try:
            content = raw.decode("utf-8-sig")
        except UnicodeDecodeError:
            content = raw.decode("latin-1")

        reader = csv.DictReader(io.StringIO(content))
        if not reader.fieldnames or "email" not in reader.fieldnames:
            return Response(
                {
                    "detail": "CSV must contain an email column. first_name, last_name, and tags are optional."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        fieldnames = set(reader.fieldnames)
        has_tags_column = "tags" in fieldnames
        has_first_name = "first_name" in fieldnames
        has_last_name = "last_name" in fieldnames
        members_to_create = []
        email_tags_map = {}  # email -> list of tag name strings

        for row in reader:
            email = row["email"].strip()
            if not email:
                continue
            if has_tags_column and row["tags"].strip():
                email_tags_map[email] = [
                    t.strip() for t in row["tags"].split(",") if t.strip()
                ]
            members_to_create.append(
                AudienceMember(
                    project=project,
                    email=email,
                    first_name=row["first_name"].strip() if has_first_name else "",
                    last_name=row["last_name"].strip() if has_last_name else "",
                )
            )

        total_rows = len(members_to_create)
        created_count = 0
        chunk_size = 1000
        for i in range(0, total_rows, chunk_size):
            chunk = members_to_create[i : i + chunk_size]
            inserted = AudienceMember.objects.bulk_create(chunk, ignore_conflicts=True)
            created_count += len(inserted)

        if email_tags_map:
            all_tag_names = {name for names in email_tags_map.values() for name in names}
            tag_objects = {}
            for tag_name in all_tag_names:
                tag, _ = Tag.objects.get_or_create(project=project, name=tag_name)
                tag_objects[tag_name] = tag

            members_with_tags = AudienceMember.objects.filter(
                project=project, email__in=email_tags_map.keys()
            )
            for member in members_with_tags:
                tags_for_member = [
                    tag_objects[name] for name in email_tags_map[member.email]
                ]
                member.tags.add(*tags_for_member)

        return Response(
            {
                "created": created_count,
                "skipped": total_rows - created_count,
                "total_rows": total_rows,
            }
        )


def _sync_ses_config(config):
    """
    Calls AWS SES to validate credentials and refresh production_status and
    max_sending_rate.  Updates and saves the config in-place.
    """
    if not config.aws_access_key_id:
        config.config_valid = False
        config.production_status = SESConfiguration.PRODUCTION_STATUS_UNKNOWN
        config.max_sending_rate = None
        config.save(
            update_fields=["config_valid", "production_status", "max_sending_rate"]
        )
        return

    client = boto3.client(
        "sesv2",
        aws_access_key_id=config.aws_access_key_id,
        aws_secret_access_key=config.aws_secret_access_key,
        region_name=config.aws_region,
    )
    try:
        response = client.get_account()
        config.config_valid = True
        config.production_status = (
            SESConfiguration.PRODUCTION_STATUS_PRODUCTION
            if response.get("ProductionAccessEnabled")
            else SESConfiguration.PRODUCTION_STATUS_SANDBOX
        )
        send_quota = response.get("SendQuota", {})
        config.max_sending_rate = send_quota.get("MaxSendRate")
    except (BotoCoreError, ClientError):
        config.config_valid = False
        config.production_status = SESConfiguration.PRODUCTION_STATUS_UNKNOWN
        config.max_sending_rate = None

    update_fields = ["config_valid", "production_status", "max_sending_rate"]
    if (
        config.max_sending_rate is not None
        and config.sending_rate > config.max_sending_rate
    ):
        config.sending_rate = config.max_sending_rate
        update_fields.append("sending_rate")
    config.save(update_fields=update_fields)


class SESConfigurationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["SES Configuration"],
        responses={200: SESConfigurationSerializer},
    )
    def get(self, request):
        config = SESConfiguration.get_solo()
        _sync_ses_config(config)
        return Response(SESConfigurationSerializer(config).data)

    @extend_schema(
        tags=["SES Configuration"],
        request=SESConfigurationSerializer,
        responses={200: SESConfigurationSerializer},
    )
    def put(self, request):
        config = SESConfiguration.get_solo()
        serializer = SESConfigurationSerializer(config, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        _sync_ses_config(config)
        return Response(SESConfigurationSerializer(config).data)

    @extend_schema(
        tags=["SES Configuration"],
        responses={204: None},
    )
    def delete(self, request):
        SESConfiguration.objects.filter(
            pk=SESConfiguration.singleton_instance_id
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectDomainView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_project(self, request, project_pk):
        project = Project.objects.filter(pk=project_pk, owner=request.user).first()
        if not project:
            raise PermissionDenied()
        return project

    @extend_schema(tags=["Verified Domains"], responses={200: VerifiedDomainSerializer})
    def get(self, request, project_pk):
        project = self._get_project(request, project_pk)
        try:
            instance = project.domain
        except VerifiedDomain.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        dns_records, domain_status, mail_from_status = instance.check_dns()
        instance.status = domain_status
        instance.mail_from_status = mail_from_status
        instance.last_checked_at = timezone.now()
        instance.save(update_fields=["status", "mail_from_status", "last_checked_at"])
        return Response(
            VerifiedDomainSerializer(
                instance, context={"dns_check_records": dns_records}
            ).data
        )

    @extend_schema(
        tags=["Verified Domains"],
        request=VerifiedDomainSerializer,
        responses={
            201: VerifiedDomainSerializer,
            400: OpenApiTypes.OBJECT,
        },
    )
    def post(self, request, project_pk):
        project = self._get_project(request, project_pk)

        config = SESConfiguration.get_solo()
        if not config.config_valid:
            raise ValidationError(
                {
                    "detail": "SES configuration is not valid. Please configure and validate AWS SES credentials before adding a domain."
                }
            )

        if VerifiedDomain.objects.filter(project=project).exists():
            raise ValidationError(
                {"detail": "This project already has a verified domain."}
            )

        serializer = VerifiedDomainSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        domain = serializer.validated_data["domain"]

        if VerifiedDomain.objects.filter(domain=domain).exists():
            raise ValidationError({"domain": "This domain is already registered."})

        client = _get_ses_client()
        mail_from_domain = f"sesy.{domain}"
        try:
            verify_resp = client.verify_domain_identity(Domain=domain)
            dkim_resp = client.verify_domain_dkim(Domain=domain)
            client.set_identity_mail_from_domain(
                Identity=domain,
                MailFromDomain=mail_from_domain,
                BehaviorOnMXFailure="UseDefaultValue",
            )
        except (BotoCoreError, ClientError) as exc:
            raise ValidationError({"detail": str(exc)})

        instance = VerifiedDomain.objects.create(
            project=project,
            domain=domain,
            verification_token=verify_resp["VerificationToken"],
            dkim_tokens=dkim_resp["DkimTokens"],
            mail_from_domain=mail_from_domain,
            aws_region=config.aws_region,
        )
        dns_records, domain_status, mail_from_status = instance.check_dns()
        instance.status = domain_status
        instance.mail_from_status = mail_from_status
        instance.last_checked_at = timezone.now()
        instance.save(update_fields=["status", "mail_from_status", "last_checked_at"])
        return Response(
            VerifiedDomainSerializer(
                instance, context={"dns_check_records": dns_records}
            ).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(tags=["Verified Domains"], responses={204: None})
    def delete(self, request, project_pk):
        project = self._get_project(request, project_pk)
        try:
            instance = project.domain
        except VerifiedDomain.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        client = _get_ses_client()
        try:
            client.delete_identity(Identity=instance.domain)
        except (BotoCoreError, ClientError):
            pass  # best-effort; delete locally regardless
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    list=extend_schema(tags=["Campaigns"]),
    create=extend_schema(tags=["Campaigns"]),
    retrieve=extend_schema(tags=["Campaigns"]),
    update=extend_schema(tags=["Campaigns"]),
    destroy=extend_schema(tags=["Campaigns"]),
)
class CampaignViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "put", "delete", "head", "options", "trace"]

    def _get_project(self):
        project = Project.objects.filter(
            pk=self.kwargs["project_pk"],
            owner=self.request.user,
        ).first()
        if not project:
            raise PermissionDenied()
        return project

    def get_queryset(self):
        return Campaign.objects.filter(project=self._get_project()).prefetch_related(
            "tags"
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["project"] = self._get_project()
        return context

    @extend_schema(
        tags=["Campaigns"], request=None, responses={200: CampaignSerializer}
    )
    @action(detail=True, methods=["post"])
    def send(self, request, project_pk=None, pk=None):
        from .tasks import send_campaign_task

        campaign = self.get_object()
        if campaign.status != Campaign.STATUS_DRAFT:
            return Response(
                {"detail": "Only draft campaigns can be sent."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not SESConfiguration.get_solo().aws_access_key_id:
            return Response(
                {"detail": "SES configuration has not been set up."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        send_campaign_task.delay(campaign.pk)
        return Response({"detail": "Campaign send initiated."})


class UnsubscribeView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        tags=["Unsubscribe"],
        request=UnsubscribeSerializer,
        responses={200: None},
    )
    def post(self, request, project_pk):
        project = Project.objects.filter(pk=project_pk).first()
        if not project:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = UnsubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        AudienceMember.objects.filter(project=project, email=email).update(
            subscribed=False
        )
        return Response({"detail": "You have been unsubscribed successfully."})


@extend_schema_view(
    list=extend_schema(
        tags=["API Key"], description="List all API keys in the application."
    ),
    create=extend_schema(tags=["API Key"], description="Create a new named API key."),
    destroy=extend_schema(tags=["API Key"], description="Delete an API key."),
)
class ApiKeyViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ApiKeySerializer

    def get_queryset(self):
        return ApiKey.objects.select_related("user").all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, key=ApiKey.generate_key())


class PublicAudienceMemberView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    @extend_schema(
        tags=["Public API"],
        request=PublicAudienceMemberSerializer,
        responses={
            201: AudienceMemberSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        },
        parameters=[
            OpenApiParameter(
                name="X-API-Key",
                type=str,
                location=OpenApiParameter.HEADER,
                required=True,
                description="Your API key",
            )
        ],
        description="Create an audience member in a project. Tags are created automatically if they don't exist.",
    )
    def post(self, request):
        raw_key = request.headers.get("X-API-Key")
        if not raw_key:
            return Response(
                {"detail": "API key is required."}, status=status.HTTP_401_UNAUTHORIZED
            )

        if not ApiKey.objects.filter(key=raw_key).exists():
            return Response(
                {"detail": "Invalid API key."}, status=status.HTTP_401_UNAUTHORIZED
            )

        serializer = PublicAudienceMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        project = Project.objects.filter(pk=data["project_pk"]).first()
        if not project:
            return Response(
                {"detail": "Project not found."}, status=status.HTTP_404_NOT_FOUND
            )

        tags = []
        for tag_name in data.get("tags", []):
            tag, _ = Tag.objects.get_or_create(project=project, name=tag_name)
            tags.append(tag)

        try:
            member = AudienceMember.objects.create(
                project=project,
                email=data["email"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                subscribed=data["subscribed"],
            )
        except IntegrityError:
            return Response(
                {
                    "detail": "An audience member with this email already exists in this project."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        member.tags.set(tags)
        return Response(
            AudienceMemberSerializer(member, context={"project": project}).data,
            status=status.HTTP_201_CREATED,
        )


_onboarding_response = inline_serializer(
    name="OnboardingResponse",
    fields={
        "username_changed": drf_serializers.BooleanField(),
        "password_changed": drf_serializers.BooleanField(),
        "project_created": drf_serializers.BooleanField(),
        "ses_configured": drf_serializers.BooleanField(),
        "domain_configured": drf_serializers.BooleanField(),
    },
)


class OnboardingView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(tags=["Onboarding"], responses={200: _onboarding_response})
    def get(self, request: Request) -> Response:
        user = request.user

        username_changed = user.username != "admin"
        password_changed = not user.check_password("admin")
        project_created = Project.objects.filter(owner=user).exists()
        ses_configured = SESConfiguration.objects.filter(config_valid=True).exists()
        domain_configured = VerifiedDomain.objects.filter(
            project__owner=user
        ).exists()

        return Response(
            {
                "username_changed": username_changed,
                "password_changed": password_changed,
                "project_created": project_created,
                "ses_configured": ses_configured,
                "domain_configured": domain_configured,
            },
            status=status.HTTP_200_OK,
        )
