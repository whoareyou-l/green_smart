from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "custom_components/green_smart/db.py"
SETTINGS_VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_views.py"
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
DOC = ROOT / "docs/rebuild/r7-076-approval-gated-entry.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_076_version_surfaces_are_1_14_1():
    assert '"version": "1.14.97"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.97"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.97"' in _read(PANEL)


def test_r7_076_backend_has_pending_first_approval_gate_not_active_upsert():
    source = _read(SETTINGS_VIEWS)
    assert "APPROVED_USER_STATUSES" in source
    assert "async_get_or_create_user_approval_state" in source
    assert "approvalRequired" in source
    assert "approvalStatus" in source
    assert "default_status = \"active\" if _ha_user_is_admin(user) else \"pending\"" in source
    assert "VALUES (%s, %s, %s, %s, %s, NOW())" in source
    assert "VALUES (%s, %s, %s, 'active', %s, NOW())" not in source
    assert "status = VALUES(status)" not in source
    assert "status = CASE WHEN VALUES(status) = 'active' THEN 'active' ELSE status END" in source


def test_r7_076_pending_response_shape_blocks_normal_payload():
    namespace = {}
    exec(compile(_read(SETTINGS_VIEWS), str(SETTINGS_VIEWS), "exec"), namespace)
    fn = namespace["settings_users_permissions_pending_response"]
    payload = fn(ha_user_id="ha-pending", display_name="새 사용자", role="farm_staff", status="pending")
    assert payload["ok"] is False
    assert payload["approvalRequired"] is True
    assert payload["approvalStatus"] == "pending"
    assert payload["reasonCode"] == "user_approval_required"
    assert payload["users"] == []
    assert payload["approvalRows"] == []
    assert payload["auditRows"] == []


def test_r7_076_frontend_renders_approval_gate_and_does_not_enter_workspace():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._settingsUsersPermissions = {{ ok: false, approvalRequired: true, approvalStatus: 'pending', displayName: '새 사용자', role: 'farm_staff', source: 'green-smart-db' }};
      const html = panel.renderR7PageShell();
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    html = json.loads(result.stdout)["html"]
    assert 'data-r7-approval-gate="pending"' in html
    assert '승인 대기' in html
    assert '관리자 승인 후 Green Smart에 진입할 수 있습니다.' in html
    assert 'data-r7-page-workspace' not in html
    assert 'data-r7-domain-page-router="true"' not in html


def test_r7_076_documented():
    doc = _read(DOC)
    for phrase in ["미승인 사용자", "pending", "active/approved", "approvalRequired", "진입 차단"]:
        assert phrase in doc
