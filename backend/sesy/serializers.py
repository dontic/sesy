from rest_framework import serializers
from .models import Project, Tag, AudienceMember


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


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["pk", "name", "description", "created_at", "updated_at"]
        read_only_fields = ["pk", "created_at", "updated_at"]

    def create(self, validated_data):
        owner = self.context["request"].user
        return Project.objects.create(owner=owner, **validated_data)
