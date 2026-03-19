import csv
import io

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import Project, Tag, AudienceMember, SESConfiguration, Campaign, VerifiedDomain
from .serializers import (
    ProjectSerializer,
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
        return AudienceMember.objects.filter(project=self._get_project()).prefetch_related("tags")

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
        required_headers = {"email", "first_name", "last_name"}
        if not reader.fieldnames or not required_headers.issubset(set(reader.fieldnames)):
            return Response(
                {"detail": "CSV must contain exactly these headers: email, first_name, last_name."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        members_to_create = []
        for row in reader:
            email = row["email"].strip()
            if not email:
                continue
            members_to_create.append(
                AudienceMember(
                    project=project,
                    email=email,
                    first_name=row["first_name"].strip(),
                    last_name=row["last_name"].strip(),
                )
            )

        total_rows = len(members_to_create)
        created_count = 0
        chunk_size = 1000
        for i in range(0, total_rows, chunk_size):
            chunk = members_to_create[i : i + chunk_size]
            inserted = AudienceMember.objects.bulk_create(chunk, ignore_conflicts=True)
            created_count += len(inserted)

        return Response(
            {
                "created": created_count,
                "skipped": total_rows - created_count,
                "total_rows": total_rows,
            }
        )


class SESConfigurationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["SES Configuration"],
        responses={200: SESConfigurationSerializer},
    )
    def get(self, request):
        config = SESConfiguration.get_solo()
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
        return Response(serializer.data)

    @extend_schema(
        tags=["SES Configuration"],
        responses={204: None},
    )
    def delete(self, request):
        SESConfiguration.objects.filter(pk=SESConfiguration.singleton_instance_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SESConfigurationCheckProductionStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["SES Configuration"],
        request=None,
        responses={200: SESConfigurationSerializer},
    )
    def post(self, request):
        config = SESConfiguration.get_solo()
        if not config.aws_access_key_id:
            raise ValidationError({"detail": "SES configuration has not been set up."})

        client = boto3.client(
            "sesv2",
            aws_access_key_id=config.aws_access_key_id,
            aws_secret_access_key=config.aws_secret_access_key,
            region_name=config.aws_region,
        )
        try:
            response = client.get_account()
        except (BotoCoreError, ClientError) as exc:
            raise ValidationError({"detail": str(exc)})

        if response.get("ProductionAccessEnabled"):
            config.production_status = SESConfiguration.PRODUCTION_STATUS_PRODUCTION
        else:
            config.production_status = SESConfiguration.PRODUCTION_STATUS_SANDBOX
        config.save(update_fields=["production_status"])
        return Response(SESConfigurationSerializer(config).data)


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
        return Response(VerifiedDomainSerializer(instance).data)

    @extend_schema(tags=["Verified Domains"], request=VerifiedDomainSerializer, responses={201: VerifiedDomainSerializer})
    def post(self, request, project_pk):
        project = self._get_project(request, project_pk)

        if VerifiedDomain.objects.filter(project=project).exists():
            raise ValidationError({"detail": "This project already has a verified domain."})

        serializer = VerifiedDomainSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        domain = serializer.validated_data["domain"]

        if VerifiedDomain.objects.filter(domain=domain).exists():
            raise ValidationError({"domain": "This domain is already registered."})

        config = SESConfiguration.get_solo()
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
        return Response(VerifiedDomainSerializer(instance).data, status=status.HTTP_201_CREATED)

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


class ProjectDomainCheckView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Verified Domains"], request=None, responses={200: VerifiedDomainSerializer})
    def post(self, request, project_pk):
        project = Project.objects.filter(pk=project_pk, owner=request.user).first()
        if not project:
            raise PermissionDenied()
        try:
            instance = project.domain
        except VerifiedDomain.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        dns_records, domain_status, mail_from_status = instance.check_dns()
        instance.status = domain_status
        instance.mail_from_status = mail_from_status
        instance.last_checked_at = timezone.now()
        instance.save(update_fields=["status", "mail_from_status", "last_checked_at"])
        return Response(VerifiedDomainSerializer(instance, context={"dns_check_records": dns_records}).data)


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
        return Campaign.objects.filter(project=self._get_project()).prefetch_related("tags")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["project"] = self._get_project()
        return context

    @extend_schema(tags=["Campaigns"], request=None, responses={200: CampaignSerializer})
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

        AudienceMember.objects.filter(project=project, email=email).update(subscribed=False)
        return Response({"detail": "You have been unsubscribed successfully."})
