from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-074-common-body-row-grammar.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_users_permissions():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: 'admin', is_admin: true }}, callApi: async () => ({{}}) }};
      panel._settingsUsersPermissions = {{
        source: 'contract-fixture',
        approvalRows: [
          {{ label: '사용자 승인 요청', meta: 'staff02 · farm_staff · 대기', icon: 'mdi:account-clock-outline', tone: 'amber' }},
          {{ label: '자동제어 활성화', meta: 'owner01 허락 필요', icon: 'mdi:robot-outline', tone: 'amber' }},
          {{ label: '안전 리밋 변경', meta: 'farm_owner 허락 필요', icon: 'mdi:shield-alert-outline', tone: 'amber' }},
        ],
        auditRows: [
          {{ label: 'admin', summary: '역할 허락: staff01 → farm_staff', meta: '2026-06-30 09:12', icon: 'mdi:account-check-outline', tone: 'green' }},
          {{ label: 'owner01', summary: '안전 정책 허락', meta: '2026-06-30 08:45', icon: 'mdi:account-check-outline', tone: 'green' }},
        ],
        users: [],
      }};
      const html = panel.renderR7SettingsAdminSubtabPanel('users-permissions', 'users-permissions');
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def _render_records_workflow():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const ctx = {{
        pestScouting: {{ count: 1, latestLabel: '2026-06-29 · 진딧물 낮음', staleState: 'fresh' }},
        controlTreatment: {{ count: 1, latestLabel: '2026-06-30 · PHI 3일 남음', staleState: 'fresh', latest: {{ pesticides: [{{ pls: true }}] }} }},
        growthSurvey: {{ count: 1, latestLabel: '2026-06-30 · 초장 18cm', staleState: 'fresh' }},
        seasonId: '7', missingItems: ['SPAD 미입력', '병해충 예찰 5일 경과'], recentRows: []
      }};
      const html = panel.renderR7RecordsWorkflowProductLayout(ctx);
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_074_version_surfaces_are_1_13_9():
    assert '"version": "1.14.42"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.42"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.42"' in _read(REBUILD_PANEL)


def test_r7_074_common_body_row_helpers_exist():
    source = _read(REBUILD_PANEL)
    assert 'renderR7CommonCardDataRow(' in source
    assert 'renderR7CommonCardDataRows(' in source
    assert 'data-r7-common-card-data-row' in source
    assert 'data-r7-common-card-data-row-label' in source
    assert 'data-r7-common-card-data-row-meta' in source


def test_r7_074_settings_approval_and_audit_rows_use_common_body_rows():
    html = _render_users_permissions()
    approval_card = html.split('data-r7-common-card-shell="settings-approval-needed"', 1)[1].split('data-r7-common-card-shell="settings-audit-log"', 1)[0]
    audit_card = html.split('data-r7-common-card-shell="settings-audit-log"', 1)[1].split('data-r7-common-card-shell="settings-permission-matrix-summary"', 1)[0]
    assert approval_card.count('data-r7-common-card-data-row="settings-approval"') == 3
    assert audit_card.count('data-r7-common-card-data-row="settings-audit"') == 2
    assert 'data-r7-settings-approval-row="사용자 승인 요청"' in approval_card
    assert 'data-r7-settings-audit-row="admin"' in audit_card
    assert 'data-r7-common-card-data-row-label' in approval_card
    assert 'data-r7-common-card-data-row-meta' in approval_card
    assert 'data-r7-common-card-data-row-label' in audit_card
    assert 'data-r7-common-card-data-row-meta' in audit_card


def test_r7_074_records_missing_verification_also_uses_common_body_rows():
    html = _render_records_workflow()
    missing_card = html.split('data-r7-common-card-shell="missing-verification"', 1)[1].split('data-r7-common-card-shell="ai-evidence"', 1)[0]
    assert missing_card.count('data-r7-common-card-data-row="record-missing-item"') == 2
    assert 'SPAD 미입력' in missing_card
    assert '병해충 예찰 5일 경과' in missing_card
    assert '<ul style=' not in missing_card


def test_r7_074_source_no_bespoke_inline_rows_for_settings_approval_audit():
    source = _read(REBUILD_PANEL)
    settings_block = source.split('kind: "settings-approval-needed"', 1)[1].split('kind: "settings-permission-matrix-summary"', 1)[0]
    assert 'renderR7CommonCardDataRows(' in settings_block
    assert 'display:flex;align-items:center;justify-content:space-between' not in settings_block
    assert 'display:grid;grid-template-columns:1fr auto' not in settings_block


def test_r7_074_documented():
    doc = _read(DOC)
    for phrase in ['본문 row 공통 문법', '승인 필요 작업', '감사 로그', '기록·작업', 'renderR7CommonCardDataRow']:
        assert phrase in doc
