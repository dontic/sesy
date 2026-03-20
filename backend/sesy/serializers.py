from rest_framework import serializers
from .models import (
    ApiKey,
    Project,
    Tag,
    AudienceMember,
    SESConfiguration,
    Campaign,
    VerifiedDomain,
)


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["pk", "name", "created_at"]
        read_only_fields = ["pk", "created_at"]

    def validate_name(self, value):
        project = self.context["project"]
        qs = Tag.objects.filter(project=project, name=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A tag with this name already exists in this project.",
                code="conflict",
            )
        return value

    def create(self, validated_data):
        project = self.context["project"]
        return Tag.objects.create(project=project, **validated_data)


class AudienceMemberSerializer(serializers.ModelSerializer):
    tags = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.none(), required=False
    )
    tags_detail = TagSerializer(source="tags", many=True, read_only=True)

    class Meta:
        model = AudienceMember
        fields = [
            "pk",
            "email",
            "first_name",
            "last_name",
            "subscribed",
            "tags",
            "tags_detail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["pk", "created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        project = self.context.get("project")
        if project:
            self.fields["tags"].child_relation.queryset = Tag.objects.filter(
                project=project
            )

    def create(self, validated_data):
        project = self.context["project"]
        tags = validated_data.pop("tags", [])
        member = AudienceMember.objects.create(project=project, **validated_data)
        member.tags.set(tags)
        return member

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags is not None:
            instance.tags.set(tags)
        return instance


class VerifiedDomainSerializer(serializers.ModelSerializer):
    dns_records = serializers.SerializerMethodField()

    class Meta:
        model = VerifiedDomain
        fields = [
            "pk",
            "domain",
            "verification_token",
            "dkim_tokens",
            "mail_from_domain",
            "mail_from_status",
            "dns_records",
            "status",
            "last_checked_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "pk",
            "verification_token",
            "dkim_tokens",
            "mail_from_domain",
            "mail_from_status",
            "dns_records",
            "status",
            "last_checked_at",
            "created_at",
            "updated_at",
        ]

    def get_dns_records(self, obj):
        dns_check_records = self.context.get("dns_check_records")
        if dns_check_records is not None:
            return dns_check_records

        records = []
        if obj.verification_token:
            records.append(
                {
                    "type": "TXT",
                    "name": f"_amazonses.{obj.domain}",
                    "value": obj.verification_token,
                }
            )
        for token in obj.dkim_tokens:
            records.append(
                {
                    "type": "CNAME",
                    "name": f"{token}._domainkey.{obj.domain}",
                    "value": f"{token}.dkim.amazonses.com",
                }
            )
        if obj.mail_from_domain and obj.aws_region:
            records.append(
                {
                    "type": "MX",
                    "name": obj.mail_from_domain,
                    "value": f"feedback-smtp.{obj.aws_region}.amazonses.com",
                    "priority": 10,
                }
            )
            records.append(
                {
                    "type": "TXT",
                    "name": obj.mail_from_domain,
                    "value": "v=spf1 include:amazonses.com ~all",
                }
            )
        records.append(
            {
                "type": "TXT",
                "name": f"_dmarc.{obj.domain}",
                "value": "v=DMARC1; p=none;",
            }
        )
        return records


class ProjectSerializer(serializers.ModelSerializer):
    domain = VerifiedDomainSerializer(read_only=True)

    class Meta:
        model = Project
        fields = ["pk", "name", "description", "domain", "created_at", "updated_at"]
        read_only_fields = ["pk", "created_at", "updated_at"]

    def create(self, validated_data):
        owner = self.context["request"].user
        return Project.objects.create(owner=owner, **validated_data)


class SESConfigurationSerializer(serializers.ModelSerializer):
    aws_secret_access_key = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )

    class Meta:
        model = SESConfiguration
        fields = [
            "pk",
            "aws_access_key_id",
            "aws_secret_access_key",
            "aws_region",
            "sending_rate",
            "production_status",
            "max_sending_rate",
            "config_valid",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "pk",
            "production_status",
            "max_sending_rate",
            "config_valid",
            "created_at",
            "updated_at",
        ]

    def update(self, instance, validated_data):
        if not validated_data.get("aws_secret_access_key"):
            validated_data.pop("aws_secret_access_key", None)
        return super().update(instance, validated_data)


class CampaignSerializer(serializers.ModelSerializer):
    tags = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.none(), required=False
    )
    tags_detail = TagSerializer(source="tags", many=True, read_only=True)

    class Meta:
        model = Campaign
        fields = [
            "pk",
            "name",
            "from_email",
            "from_name",
            "subject",
            "html_body",
            "send_to_all",
            "tags",
            "tags_detail",
            "status",
            "sent_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["pk", "status", "sent_at", "created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        project = self.context.get("project")
        if project:
            self.fields["tags"].child_relation.queryset = Tag.objects.filter(
                project=project
            )

    def create(self, validated_data):
        project = self.context["project"]
        tags = validated_data.pop("tags", [])
        campaign = Campaign.objects.create(project=project, **validated_data)
        campaign.tags.set(tags)
        return campaign

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags is not None:
            instance.tags.set(tags)
        return instance


class UnsubscribeSerializer(serializers.Serializer):
    email = serializers.EmailField()


class AudienceMemberCsvUploadSerializer(serializers.Serializer):
    file = serializers.FileField()


class ApiKeySerializer(serializers.ModelSerializer):
    created_by = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = ApiKey
        fields = ["pk", "name", "key", "created_by", "created_at", "updated_at"]
        read_only_fields = ["pk", "key", "created_by", "created_at", "updated_at"]


class PublicAudienceMemberSerializer(serializers.Serializer):
    project_pk = serializers.IntegerField()
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    tags = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        default=list,
    )
