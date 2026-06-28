from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POLICY_PATH = ROOT / "custom_components" / "green_smart" / "rbac_policy.py"
RBAC = ROOT / "custom_components" / "green_smart" / "rbac.py"
SCAFFOLD = ROOT / "docs" / "rebuild" / "vs-n001-rbac-admin-ownership-scaffold.md"


def _load_policy_module():
    spec = importlib.util.spec_from_file_location("green_smart_rbac_policy_scaffold", POLICY_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rbac_policy_scaffold_module_exists_without_homeassistant_dependency():
    assert POLICY_PATH.exists()
    source = _read(POLICY_PATH)
    assert "homeassistant" not in source
    assert "aiohttp" not in source
    assert "RBAC_ROLE_OWNERSHIP" in source
    assert "RBAC_PERMISSION_BUCKETS" in source
    assert "RBAC_ADMIN_OWNERSHIP" in source
    assert "can_assign_role" in source


def test_rbac_policy_defines_roles_buckets_and_visibility_states():
    policy = _load_policy_module()
    assert policy.GREEN_SMART_ROLES == ("admin", "farm_owner", "farm_staff")
    assert policy.RBAC_UI_BUCKETS == ("조회", "기록", "전략", "실행", "안전", "고급설정")
    assert policy.RBAC_VISIBILITY_STATES == (
        "visible_enabled",
        "visible_disabled",
        "summary_only",
        "hidden",
    )
    assert "manage_farm_staff_roles" in policy.permissions_for_role("farm_owner")
    assert "system_settings" not in policy.permissions_for_role("farm_owner")
    assert "manage_users_roles" in policy.permissions_for_role("admin")
    assert "manage_farm_staff_roles" not in policy.permissions_for_role("farm_staff")


def test_farm_owner_can_assign_or_revoke_only_farm_staff_role():
    policy = _load_policy_module()
    assert policy.can_assign_role("farm_owner", "farm_staff") is True
    assert policy.can_assign_role("farm_owner", "farm_owner") is False
    assert policy.can_assign_role("farm_owner", "admin") is False
    assert policy.can_assign_role("farm_staff", "farm_staff") is False
    assert policy.can_assign_role("admin", "admin") is True
    assert policy.can_assign_role("admin", "farm_owner") is True
    assert policy.can_assign_role("admin", "farm_staff") is True


def test_backend_enforcement_action_classes_are_declared():
    policy = _load_policy_module()
    for action in ("write", "execute", "save", "delete", "ack", "clear", "apply"):
        assert action in policy.RBAC_BACKEND_ENFORCED_ACTION_CLASSES
    assert policy.action_requires_backend_enforcement("write") is True
    assert policy.action_requires_backend_enforcement("execute") is True
    assert policy.action_requires_backend_enforcement("view") is False


def test_existing_rbac_reexports_policy_constants_for_compatibility():
    source = _read(RBAC)
    assert "from .rbac_policy import" in source
    assert "GREEN_SMART_ROLE_PERMISSIONS" in source
    assert "manage_farm_staff_roles" in source
    assert "can_assign_role" in source


def test_scaffold_doc_mentions_policy_module():
    doc = _read(SCAFFOLD)
    assert "custom_components/green_smart/rbac_policy.py" in doc
    assert "manage_farm_staff_roles" in doc
    assert "can_assign_role" in doc
