from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient

from sesy.models import ApiKey, Project

User = get_user_model()

NEW_PASSWORD = "a-Strong-new-pass-42"


class UserManagementTests(TestCase):
    def setUp(self):
        # The first user, seeded by the initial migration, is made owner by the second
        self.owner = User.objects.get(username="admin")
        self.admin = User.objects.create_user("alice", password="pw-alice-123", role=User.Role.ADMIN)
        self.user = User.objects.create_user("bob", password="pw-bob-123", role=User.Role.USER)

    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user)
        return client

    def login(self, username, password):
        client = APIClient()
        response = client.post("/auth/login/", {"username": username, "password": password})
        self.assertEqual(response.status_code, 200, response.data)
        return client, response

    def test_seeded_admin_is_owner(self):
        seeded = User.objects.get(username="admin")
        self.assertEqual(seeded.role, User.Role.OWNER)

    def test_first_user_becomes_owner(self):
        User.objects.all().delete()
        first = User.objects.create_user("first", password="x")
        second = User.objects.create_user("second", password="x")
        self.assertEqual(first.role, User.Role.OWNER)
        self.assertEqual(second.role, User.Role.USER)

    def test_only_one_owner_allowed(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            User.objects.filter(pk=self.admin.pk).update(role=User.Role.OWNER)

    def test_create_user_and_first_login_flow(self):
        response = self.client_for(self.admin).post("/auth/users/", {"username": "carol"})
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["role"], User.Role.USER)
        self.assertTrue(response.data["must_change_password"])
        temp_password = response.data["temp_password"]

        client, login = self.login("carol", temp_password)
        self.assertTrue(login.data["must_change_password"])
        self.assertTrue(client.get("/auth/me/").data["must_change_password"])

        # Everything else is blocked until the password is changed
        blocked = client.get("/sesy/projects/")
        self.assertEqual(blocked.status_code, 403)
        self.assertEqual(blocked.json()["code"], "password_change_required")

        # Reusing the temporary password is rejected
        same = client.post(
            "/auth/password-change/",
            {"new_password1": temp_password, "new_password2": temp_password},
        )
        self.assertEqual(same.status_code, 400)

        # No old password needed while replacing a temporary password
        changed = client.post(
            "/auth/password-change/",
            {"new_password1": NEW_PASSWORD, "new_password2": NEW_PASSWORD},
        )
        self.assertEqual(changed.status_code, 200, changed.data)
        self.assertFalse(client.get("/auth/me/").data["must_change_password"])
        self.assertEqual(client.get("/sesy/projects/").status_code, 200)

    def test_regular_password_change_still_requires_old_password(self):
        response = self.client_for(self.user).post(
            "/auth/password-change/",
            {"new_password1": NEW_PASSWORD, "new_password2": NEW_PASSWORD},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("old_password", response.data)

    def test_cannot_create_owner(self):
        response = self.client_for(self.owner).post("/auth/users/", {"username": "x", "role": "owner"})
        self.assertEqual(response.status_code, 400)

    def test_regular_user_cannot_manage_users_or_settings(self):
        client = self.client_for(self.user)
        self.assertEqual(client.get("/auth/users/").status_code, 403)
        self.assertEqual(client.post("/auth/users/", {"username": "x"}).status_code, 403)
        self.assertEqual(client.delete(f"/auth/users/{self.admin.pk}/").status_code, 403)
        self.assertEqual(client.get("/sesy/ses-configuration/").status_code, 403)
        self.assertEqual(client.get("/sesy/api-keys/").status_code, 403)

    def test_admin_cannot_delete_or_modify_owner(self):
        client = self.client_for(self.admin)
        self.assertEqual(client.delete(f"/auth/users/{self.owner.pk}/").status_code, 403)
        self.assertEqual(
            client.patch(f"/auth/users/{self.owner.pk}/", {"role": "user"}).status_code, 403
        )
        self.assertEqual(
            client.post(f"/auth/users/{self.owner.pk}/reset-password/").status_code, 403
        )
        self.assertTrue(User.objects.filter(pk=self.owner.pk, role=User.Role.OWNER).exists())

    def test_cannot_delete_self(self):
        response = self.client_for(self.admin).delete(f"/auth/users/{self.admin.pk}/")
        self.assertEqual(response.status_code, 403)

    def test_delete_user_reassigns_projects_and_api_keys(self):
        project = Project.objects.create(owner=self.user, name="P")
        key = ApiKey.objects.create(user=self.user, name="k", key=ApiKey.generate_key())
        response = self.client_for(self.admin).delete(f"/auth/users/{self.user.pk}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(pk=self.user.pk).exists())
        project.refresh_from_db()
        key.refresh_from_db()
        self.assertEqual(project.owner, self.admin)
        self.assertEqual(key.user, self.admin)

    def test_change_role(self):
        response = self.client_for(self.admin).patch(f"/auth/users/{self.user.pk}/", {"role": "admin"})
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["role"], "admin")

    def test_reset_password(self):
        response = self.client_for(self.admin).post(f"/auth/users/{self.user.pk}/reset-password/")
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.must_change_password)
        self.assertTrue(self.user.check_password(response.data["temp_password"]))

    def test_transfer_ownership(self):
        self.assertEqual(
            self.client_for(self.admin)
            .post(f"/auth/users/{self.user.pk}/transfer-ownership/")
            .status_code,
            403,
        )
        response = self.client_for(self.owner).post(f"/auth/users/{self.user.pk}/transfer-ownership/")
        self.assertEqual(response.status_code, 200, response.data)
        self.owner.refresh_from_db()
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, User.Role.OWNER)
        self.assertEqual(self.owner.role, User.Role.ADMIN)

    def test_workspace_is_shared(self):
        Project.objects.create(owner=self.admin, name="Shared")
        response = self.client_for(self.user).get("/sesy/projects/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([p["name"] for p in response.data], ["Shared"])
