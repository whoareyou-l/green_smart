from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-071-common-card-components-ha-icons.md"


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
        users: [
          {{ kind: 'admin', at: 'admin', memo: '활성 · 방금 전', state: '전체 설정', icon: 'mdi:shield-account-outline', tone: 'green' }},
          {{ kind: 'owner01', at: 'farm_owner', memo: '활성 · 오늘 09:20', state: '승인 · 전략', icon: 'mdi:account-tie-outline', tone: 'green' }},
          {{ kind: 'staff01', at: 'farm_staff', memo: '승인 대기 · -', state: '기록 · 모니터링', icon: 'mdi:account-outline', tone: 'amber' }},
          {{ kind: 'staff02', at: 'farm_staff', memo: '대기 · 오늘 08:40', state: '승인 요청', icon: 'mdi:account-clock-outline', tone: 'amber' }},
          {{ kind: 'viewer01', at: 'viewer', memo: '최근 5일 전', state: '조회 전용', icon: 'mdi:account-eye-outline', tone: 'blue' }},
        ],
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
        users: [
          {{ kind: 'admin', at: 'admin', memo: '활성 · 방금 전', state: '전체 설정', icon: 'mdi:shield-account-outline', tone: 'green' }},
          {{ kind: 'owner01', at: 'farm_owner', memo: '활성 · 오늘 09:20', state: '승인 · 전략', icon: 'mdi:account-tie-outline', tone: 'green' }},
          {{ kind: 'staff01', at: 'farm_staff', memo: '승인 대기 · -', state: '기록 · 모니터링', icon: 'mdi:account-outline', tone: 'amber' }},
          {{ kind: 'staff02', at: 'farm_staff', memo: '대기 · 오늘 08:40', state: '승인 요청', icon: 'mdi:account-clock-outline', tone: 'amber' }},
          {{ kind: 'viewer01', at: 'viewer', memo: '최근 5일 전', state: '조회 전용', icon: 'mdi:account-eye-outline', tone: 'blue' }},
        ],
      }};
      panel._homeContext = {{ zones: [{{ id: 'zone-1', name: '1구역', currentCrop: {{ crop_cycle_id: 7, crop_label_ko: '상추', growth_stage: '활착기' }}, cropRecordSummary: {{ growthSurvey: {{ count: 1, latestLabel: '2026-06-30 · 초장 18cm', staleState: 'fresh' }}, pestScouting: {{ count: 1, latestLabel: '2026-06-29 · 진딧물 낮음', staleState: 'fresh' }}, controlTreatment: {{ count: 1, latestLabel: '2026-06-30 · PHI 3일 남음', staleState: 'fresh', latest: {{ pesticides: [{{ pls: true }}] }} }} }} }}] }};
      const ctx = {{
        pestScouting: panel._homeContext.zones[0].cropRecordSummary.pestScouting,
        controlTreatment: panel._homeContext.zones[0].cropRecordSummary.controlTreatment,
        growthSurvey: panel._homeContext.zones[0].cropRecordSummary.growthSurvey,
        seasonId: '7',
        missingItems: ['생육조사 확인'],
        recentRows: [
          {{ kind: '생육조사', at: '2026-06-30 08:10', memo: '초장 18cm', state: 'fresh', icon: 'mdi:sprout-outline', tone: 'green' }},
          {{ kind: '방제 기록', at: '2026-06-30 08:20', memo: 'PHI 3일 남음', state: '정상', icon: 'mdi:shield-check-outline', tone: 'green' }}
        ]
      }};
      const html = panel.renderR7RecordsWorkflowProductLayout(ctx);
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_071_version_surfaces_are_1_13_6():
    assert '"version": "1.14.2"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.2"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.2"' in _read(REBUILD_PANEL)


def test_r7_071_common_helpers_exist_and_document_ha_icon_policy():
    source = _read(REBUILD_PANEL)
    for helper in [
        'renderR7CommonHaIcon(',
        'renderR7CommonCardHeader(',
        'renderR7CommonCardButton(',
        'renderR7CommonCardActionRow(',
        'renderR7CommonCardShell(',
        'renderR7CommonRecentRow(',
        'renderR7CommonRecentPanel(',
    ]:
        assert helper in source
    assert 'data-r7-common-ha-icon-policy="mdi-only"' in source
    assert 'data-r7-common-button-order="icon-text"' in source


def test_r7_071_settings_users_use_common_card_components_and_ha_icons():
    html = _render_users_permissions()
    assert 'data-r7-common-card-shell="settings-approval-needed"' in html
    assert 'data-r7-common-card-shell="settings-audit-log"' in html
    assert 'data-r7-common-card-shell="settings-permission-matrix-summary"' in html
    assert 'data-r7-common-recent-panel="settings-user-list-wide"' in html
    assert 'data-r7-common-recent-row="settings-user"' in html
    assert 'data-r7-common-ha-icon-policy="mdi-only"' in html
    assert 'data-r7-settings-users-card="approval-queue"' in html
    assert 'data-r7-settings-users-card="audit-log"' in html
    assert 'data-r7-settings-users-card="permission-matrix"' in html
    assert 'data-r7-settings-users-card="user-list"' in html
    assert '<span style="width:24px;height:24px' not in html
    assert '👥' not in html and '🧾' not in html and '⌛' not in html
    assert 'ha-icon icon="mdi:' in html


def test_r7_071_common_buttons_are_icon_then_text_in_settings():
    html = _render_users_permissions()
    buttons = re.findall(r'<button[^>]*data-r7-common-card-button[^>]*>.*?</button>', html, flags=re.S)
    assert buttons
    for button in buttons:
        assert 'data-r7-common-button-order="icon-text"' in button
        assert button.index('<ha-icon icon="mdi:') < button.index('<span data-r7-common-button-label')


def test_r7_071_crop_records_recent_panel_uses_common_recent_component():
    html = _render_records_workflow()
    assert 'data-r7-record-recent-log-panel' in html
    assert 'data-r7-common-recent-panel="records-recent-log"' in html
    assert 'data-r7-common-recent-row="records-recent"' in html
    assert 'data-r7-common-card-header' in html
    assert 'ha-icon icon="mdi:clipboard-text-clock-outline"' in html


def test_r7_071_documented():
    doc = _read(DOC)
    for phrase in ['ha-icon icon="mdi:..."', '아이콘, 텍스트 순', '기록·작업 공동 컴포넌트', '최근 기록', '사용자·권한']:
        assert phrase in doc
