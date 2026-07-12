from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-013-settings-admin-manual-first-realignment.md"
R7_004_DOC = ROOT / "docs/rebuild/r7-004-settings-admin-readonly-detail.md"
SPEC = ROOT / "docs/rebuild/r7-006-manual-first-target-domain-spec.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_013_version_surfaces_are_1_12_45():
    assert '"version": "1.15.49"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.49"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.49"' in _read(REBUILD_PANEL)
    assert "v1.15.49" in _read(DOC)


def test_r7_013_doc_declares_manual_first_settings_admin_realignment():
    text = _read(DOC)
    required = [
        "# R7-013 Settings/Admin Manual-first Realignment",
        "Status: R7-013 complete",
        "R7-004 `설정` detail을 R7-005~R7-012 이후의 8도메인 manual-first 구조에 맞게 재보정한다",
        "운영 홈 → visibility/config summary only",
        "작물 운영 → crop_cycle/currentCrop permission and record ownership evidence",
        "환경 제어 → environment settings ownership boundary",
        "관수 제어 → irrigation/fertigation settings ownership boundary",
        "장치 제어 → HA entity mapping / device mapping ownership boundary",
        "자동화 제어 → recommendation/AI assist configuration boundary",
        "안전 제어 → audit/log visibility and backend enforcement boundary",
        "설정 → RBAC, role, mapping, config, diagnostics, backup, secret redaction",
        "No API route change in R7-013",
        "No DB migration in R7-013",
        "No HA service call in R7-013",
        "No MQTT/device command in R7-013",
        "No role assignment mutation in R7-013",
        "No settings save/delete in R7-013",
        "No mapping edit in R7-013",
        "No raw secrets in R7-013",
    ]
    for phrase in required:
        assert phrase in text


def test_r7_013_panel_has_manual_first_realignment_markers():
    text = _read(REBUILD_PANEL)
    required = [
        'data-r7-settings-admin-manual-first-realigned="true"',
        "data-r7-settings-admin-domain-ownership",
        "data-r7-settings-admin-mapping-boundary",
        "data-r7-settings-admin-system-boundary",
        "설정는 daily grower workflow가 아닙니다",
        "운영 홈/작물/환경/관수 제어/장치/자동화 제어/안전 제어의 권한·매핑·설정 ownership을 read-only로 보여줍니다",
        "HA entity mapping은 장치 제어의 상태 판단에 쓰이지만, 매핑 소유권은 설정에 있습니다",
        "Role/settings mutation remains separately approved work",
    ]
    for marker in required:
        assert marker in text


def test_r7_013_panel_maps_all_active_domains_to_settings_admin_ownership():
    text = _read(REBUILD_PANEL)
    for key in (
        "operations-home",
        "crop-operations",
        "environment-control",
        "irrigation-fertigation",
        "device-control",
        "recommendation-automation",
        "safety-history",
        "settings-admin",
    ):
        assert f'data-r7-settings-admin-domain="{key}"' in text
    for phrase in (
        "visibility/config summary only",
        "crop_cycle/currentCrop permission",
        "environment settings ownership",
        "irrigation/fertigation settings ownership",
        "HA entity mapping / device mapping ownership",
        "recommendation/AI assist configuration",
        "audit/log visibility and backend enforcement",
        "RBAC, role, mapping, config, diagnostics, backup, secret redaction",
    ):
        assert phrase in text


def test_r7_013_panel_names_mapping_and_system_boundary_items():
    text = _read(REBUILD_PANEL)
    for marker in (
        'data-r7-settings-admin-mapping-item="HA entity mapping"',
        'data-r7-settings-admin-mapping-item="구역/장치 매핑"',
        'data-r7-settings-admin-mapping-item="MQTT topic mapping later only"',
        'data-r7-settings-admin-mapping-item="mapping health evidence"',
        'data-r7-settings-admin-system-item="RBAC"',
        'data-r7-settings-admin-system-item="사용자 역할"',
        'data-r7-settings-admin-system-item="권한 정책"',
        'data-r7-settings-admin-system-item="시스템 설정"',
        'data-r7-settings-admin-system-item="진단"',
        'data-r7-settings-admin-system-item="백업"',
        'data-r7-settings-admin-system-item="secret redaction"',
        'data-r7-settings-admin-system-item="감사 설정"',
    ):
        assert marker in text


def test_r7_013_preserves_r7_004_settings_admin_visual_compatibility_markers():
    text = _read(REBUILD_PANEL)
    for marker in (
        "renderR7SettingsAdminZoneVisual",
        'data-r7-settings-admin-zone-visual="true"',
        'data-r7-settings-admin-global-boundary="true"',
        'data-r7-settings-admin-detail-absorbed="true"',
        'data-r7-settings-admin-readonly-boundary="true"',
        "data-r7-settings-admin-role-ownership",
        "data-r7-settings-admin-permission-buckets",
        'data-r7-settings-admin-area="user-role-mapping"',
        'data-r7-settings-admin-area="ha-entity-mapping"',
        'data-r7-settings-admin-area="system-config-metadata"',
        'data-r7-settings-admin-area="rbac-policy-contract"',
        "data-r7-settings-admin-farm-owner-staff-scope",
        "data-r7-settings-admin-secret-redaction",
        "data-r7-settings-admin-backend-enforcement",
        "[REDACTED]",
        "data-r7-settings-domain-card",
        "data-r7-settings-role-card",
        "data-r7-settings-mapping-card",
        "data-r7-settings-system-card",
        "data-r7-settings-rbac-card",
    ):
        assert marker in text


def test_r7_013_does_not_add_settings_admin_mutation_or_execution_authority():
    text = _read(REBUILD_PANEL)
    forbidden = (
        "data-r7-settings-admin-save",
        "data-r7-settings-admin-delete",
        "data-r7-settings-admin-assign-role-button",
        "data-r7-settings-admin-edit-mapping",
        "data-r7-settings-admin-secret-value",
        "data-r7-settings-admin-apply",
        "callService(",
        ".callService",
        "hass.services",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
        "approvalOverrideEnabled\": true",
    )
    for marker in forbidden:
        assert marker not in text


def test_r7_013_node_smoke_renders_realigned_settings_admin_detail():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-013-readonly-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel._activeR7Domain = 'settings-admin';
      panel.render();
      const html = panel.innerHTML;
      const required = [
        'data-r7-detail-subpage="settings-admin"',
        'data-r7-settings-admin-manual-first-realigned="true"',
        'data-r7-settings-admin-domain-ownership',
        'data-r7-settings-admin-domain="environment-control"',
        'data-r7-settings-admin-domain="device-control"',
        'data-r7-settings-admin-mapping-boundary',
        'data-r7-settings-admin-system-boundary',
        '설정는 daily grower workflow가 아닙니다',
        'Secret values render as [REDACTED] only'
      ];
      for (const item of required) {{
        if (!html.includes(item)) {{ console.error(item); process.exit(1); }}
      }}
      if (html.includes('data-r7-settings-admin-save')) process.exit(2);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_013_spec_and_r7_004_doc_record_keep_adapt_context():
    spec = _read(SPEC)
    r7_004 = _read(R7_004_DOC)
    for phrase in (
        "설정는 daily grower workflow가 아니다",
        "Secret values render as [REDACTED] only",
        "Role/settings mutation remains separately approved work",
    ):
        assert phrase in spec
    assert "KEEP/ADAPT" in r7_004
    assert "R7-005+ direction note" in r7_004
