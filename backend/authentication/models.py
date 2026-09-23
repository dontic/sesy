from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        ADMIN = "admin", "Admin"
        USER = "user", "User"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)
    must_change_password = models.BooleanField(
        default=False,
        help_text="Designates whether the user must set a new password on next login.",
    )

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        constraints = [
            models.UniqueConstraint(
                fields=["role"],
                condition=models.Q(role="owner"),
                name="authentication_user_single_owner",
            ),
        ]

    def __str__(self) -> str:
        return self.username

    def save(self, *args, **kwargs):
        # The first user ever created becomes the owner
        if self._state.adding and not User.objects.filter(role=self.Role.OWNER).exists():
            self.role = self.Role.OWNER
        super().save(*args, **kwargs)

    @property
    def is_owner(self) -> bool:
        return self.role == self.Role.OWNER

    @property
    def is_admin_or_owner(self) -> bool:
        return self.role in (self.Role.OWNER, self.Role.ADMIN)
