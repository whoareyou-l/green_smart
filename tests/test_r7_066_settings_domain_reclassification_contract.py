from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-066-settings-domain-reclassification.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_settings(active_tab="greenhouse-zones", open_permission_matrix=False):
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '#settings-admin' }};
      globalThis.innerWidth = 1280;
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = '';this.dataset = {{}};this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: 'admin', is_admin: true }}, callApi: async () => ({{}}) }};
      panel._activeR7Domain = 'settings-admin';
      panel._activeR7DomainSubtabs = {{ ...panel._activeR7DomainSubtabs, 'settings-admin': {active_tab!r} }};
      panel._settingsPermissionMatrixModal = {{ open: {str(open_permission_matrix).lower()} }};
      panel._homeContext = {{
        actorRole: 'admin',
        zones: [
          {{ id: 'zone-1', name: '1구역', currentCrop: {{ crop_cycle_id: 4, crop_type: 'lettuce', growth_stage: '활착기' }}, equipmentProfile: {{ ventilation: 'window-1', irrigation: 'valve-1' }}, dataAvailability: {{ state: 'fresh' }} }},
          {{ id: 'zone-2', name: '2구역', currentCrop: {{ crop_cycle_id: 5, crop_type: 'lettuce', growth_stage: '엽생장기' }}, equipmentProfile: {{ ventilation: 'window-2', irrigation: 'valve-2' }}, dataAvailability: {{ state: 'stale' }} }}
        ]
      }};
      console.log(JSON.stringify({{ html: panel.renderR7SettingsAdminZoneVisual() }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_066_version_surfaces_are_1_13_1():
    assert '"version": "1.15.52"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.52"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.52"' in _read(REBUILD_PANEL)


def test_r7_066_settings_new_tabs_replace_admin_explanation_first_tabs():
    html = _render_settings()
    for label in ('온실·구역', '장치 연결 작성', '사용자·권한', '시스템·연동'):
        assert label in html
    for key in ('greenhouse-zones', 'device-sensor-mapping', 'users-permissions', 'system-integration'):
        assert f'data-r7-settings-admin-subtab="{key}"' in html
    for removed in ('안전·승인 정책', '진단·감사', 'data-r7-settings-admin-subtab="safety-approval-policy"', 'data-r7-settings-admin-subtab="diagnostics-audit"'):
        assert removed not in html
    assert '작기·작물 객체' not in html
    assert 'data-r7-settings-admin-subtab="crop-cycle-objects"' not in html
    assert 'data-r7-settings-admin-subtab="domain-ownership"' in html  # hidden compatibility only
    assert 'data-r7-settings-admin-subtab="rbac-policy"' in html  # hidden compatibility only


def test_r7_066_greenhouse_zones_tab_contains_required_greenhouse_zone_baseline_cards():
    html = _render_settings('greenhouse-zones')
    for needle in (
        'data-r7-settings-greenhouse-zones',
        'data-r7-settings-greenhouse-card="greenhouse-profile"',
        'data-r7-settings-greenhouse-card="zone-count"',
        'data-r7-settings-zone-row="zone-1"',
        'data-r7-settings-zone-row="zone-2"',
        '온실 정보',
        '구역 정보',
        '현재 작기',
        '1구역',
        '2구역',
    ):
        assert needle in html


def test_r7_066_crop_cycle_objects_tab_removed_and_owned_by_crop_operations():
    html = _render_settings('crop-cycle-objects')
    for needle in (
        'data-r7-settings-crop-cycle-objects',
        'data-r7-settings-object-rule="four-per-cycle"',
        '작기 번호-객체 번호',
    ):
        assert needle not in html


def test_r7_066_device_user_safety_system_tabs_are_reclassified():
    expected = {
        'device-sensor-mapping': ['data-r7-settings-device-sensor-mapping', 'data-r7-settings-device-mapping-layout="error-device-group-device-list"', '장치 기본 정보', '그룹 기본 정보', '오류 기본 정보'],
        'users-permissions': ['data-r7-settings-users-permissions', 'admin', 'farm_owner', 'farm_staff', '조회 · 기록 · 전략 · 실행 · 안전 · 고급설정'],
        'system-integration': ['data-r7-settings-system-integration', 'Home Assistant 연동', 'DB 연결', '[REDACTED]'],
    }
    for tab, needles in expected.items():
        html = _render_settings(tab, open_permission_matrix=(tab == 'users-permissions'))
        for needle in needles:
            assert needle in html
    for removed_tab in ('safety-approval-policy', 'diagnostics-audit'):
        html = _render_settings(removed_tab)
        assert 'data-r7-settings-safety-approval-policy' not in html
        assert 'data-r7-settings-diagnostics-audit' not in html
        assert 'data-r7-domain-subtab-key="greenhouse-zones"' in html
        assert 'data-r7-domain-subtab-active="true"' in html


def test_r7_066_documented():
    doc = _read(DOC)
    for phrase in ('온실·구역', '장치·센서 매핑', '사용자·권한', '설정 도메인 재분류', '기준 데이터 관리 도메인'):
        assert phrase in doc
