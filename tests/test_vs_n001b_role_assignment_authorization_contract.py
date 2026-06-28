from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POLICY_PATH = ROOT / "custom_components" / "green_smart" / "rbac_policy.py"
RBAC = ROOT / "custom_components" / "green_smart" / "rbac.py"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
SCAFFOLD = ROOT / "docs" / "rebuild" / "vs-n001-rbac-admin-ownership-scaffold.md"


def _load_policy_module():
    spec = importlib.util.spec_from_file_location("green_smart_rbac_policy_assignment", POLICY_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_role_assignment_authorization_helper_returns_structured_decisions():
    policy = _load_policy_module()

    allowed = policy.role_assignment_authorization("farm_owner", "farm_staff")
    assert allowed["allowed"] is True
    assert allowed["actorRole"] == "farm_owner"
    assert allowed["targetRole"] == "farm_staff"
    assert allowed["requiredPermission"] == "manage_farm_staff_roles"

    denied_admin = policy.role_assignment_authorization("farm_owner", "admin")
    assert denied_admin["allowed"] is False
    assert denied_admin["reasonCode"] == "role_assignment_not_allowed"
    assert denied_admin["requiredPermission"] == "manage_users_roles"

    denied_staff = policy.role_assignment_authorization("farm_staff", "farm_staff")
    assert denied_staff["allowed"] is False
    assert denied_staff["reasonCode"] == "role_assignment_not_allowed"


def test_rbac_async_set_role_accepts_actor_role_and_raises_permission_error():
    source = _read(RBAC)
    assert "actor_role: str | None = None" in source
    assert "role_assignment_authorization" in source
    assert "raise PermissionError" in source
    assert "role_assignment_not_allowed" in source
    assert "assignmentDecision" in source


def test_role_assignment_api_view_is_declared_and_registered():
    rbac = _read(RBAC)
    init = _read(INIT)

    for marker in (
        "GreenSmartRoleAssignmentView",
        'url = "/api/green_smart/auth/roles/{ha_user_id}"',
        "async def post(self, request: web.Request, ha_user_id: str)",
        "async_set_green_smart_user_role(",
        "actor_role=actor_role",
        "web.json_response",
        "status=403",
    ):
        assert marker in rbac

    assert "GreenSmartRoleAssignmentView" in init
    assert "hass.http.register_view(GreenSmartRoleAssignmentView())" in init


def test_role_assignment_scaffold_doc_records_api_and_no_db_migration():
    doc = _read(SCAFFOLD)
    for marker in (
        "POST /api/green_smart/auth/roles/{ha_user_id}",
        "role_assignment_authorization",
        "assignmentDecision",
        "role_assignment_not_allowed",
        "No DB migration",
        "farm_owner may assign/revoke farm_staff only",
    ):
        assert marker in doc
