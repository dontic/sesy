from rest_framework import serializers
from .models import Project, Tag, AudienceMember, SESConfiguration, EmailTemplate, Campaign, VerifiedDomain


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["pk", "name", "created_at"]
        read_only_fields = ["pk", "created_at"]

    def create(self, validated_data):
        project = self.context["project"]
        return Tag.objects.create(project=project, **validated_data)


class AudienceMemberSerializer(serializers.ModelSerializer):
    tags = serializers.PrimaryKeyRelatedField(many=True, queryset=Tag.objects.none(), required=False)
    tags_detail = TagSerializer(source="tags", many=True, read_only=True)

    class Meta:
        model = AudienceMember
        fields = ["pk", "email", "first_name", "last_name", "tags", "tags_detail", "created_at", "updated_at"]
        read_only_fields = ["pk", "created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        project = self.context.get("project")
        if project:
            self.fields["tags"].child_relation.queryset = Tag.objects.filter(project=project)

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
            "dns_records",
            "status",
            "last_checked_at",
            "created_at",
            "updated_at",
        ]

    def get_dns_records(self, obj):
        records = []
        if obj.verification_token:
            records.append({
                "type": "TXT",
                "name": f"_amazonses.{obj.domain}",
                "value": obj.verification_token,
            })
        for token in obj.dkim_tokens:
            records.append({
                "type": "CNAME",
                "name": f"{token}._domainkey.{obj.domain}",
                "value": f"{token}.dkim.amazonses.com",
            })
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
    aws_secret_access_key = serializers.CharField(write_only=True)

    class Meta:
        model = SESConfiguration
        fields = [
            "pk",
            "aws_access_key_id",
            "aws_secret_access_key",
            "aws_region",
            "sending_rate",
            "production_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["pk", "production_status", "created_at", "updated_at"]


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = ["pk", "name", "subject", "html_body", "created_at", "updated_at"]
        read_only_fields = ["pk", "created_at", "updated_at"]

    def create(self, validated_data):
        project = self.context["project"]
        return EmailTemplate.objects.create(project=project, **validated_data)


class CampaignSerializer(serializers.ModelSerializer):
    tags = serializers.PrimaryKeyRelatedField(many=True, queryset=Tag.objects.none(), required=False)
    tags_detail = TagSerializer(source="tags", many=True, read_only=True)
    template_detail = EmailTemplateSerializer(source="template", read_only=True)

    class Meta:
        model = Campaign
        fields = [
            "pk",
            "name",
            "from_email",
            "from_name",
            "template",
            "template_detail",
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
            self.fields["tags"].child_relation.queryset = Tag.objects.filter(project=project)
            self.fields["template"].queryset = EmailTemplate.objects.filter(project=project)

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
