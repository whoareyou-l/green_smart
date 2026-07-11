from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-025-settings-admin-detail-absorption.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_025_version_surfaces_are_1_12_59():
    assert '"version": "1.15.34"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.34"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.34"' in _read(REBUILD_PANEL)
    assert "v1.15.34" in _read(DOC)


def test_r7_025_doc_records_settings_admin_inventory_and_mapping():
    text = _read(DOC)
    required = [
        "# R7-025 Settings/Admin Detail Absorption",
        "renderR7SettingsAdminDetail()",
        "Domain ownership",
        "Role ownership",
        "Permission buckets",
        "Mapping boundary",
        "System/config/admin boundary",
        "RBAC policy contract",
        "도메인 소유권",
        "역할·권한",
        "매핑·장치",
        "시스템·보안",
        "RBAC 정책",
        "No role assignment mutation in R7-025",
        "No settings save/delete in R7-025",
        "No mapping edit in R7-025",
        "No raw secrets in R7-025",
    ]
    for phrase in required:
        assert phrase in text


def test_r7_025_panel_contains_visual_absorption_markers():
    text = _read(REBUILD_PANEL)
    required = [
        "renderR7SettingsAdminZoneVisual",
        'data-r7-settings-admin-zone-visual="true"',
        'data-r7-settings-admin-global-boundary="true"',
        'data-r7-settings-admin-detail-absorbed="true"',
        'data-r7-settings-admin-subtab="domain-ownership"',
        'data-r7-settings-admin-subtab="role-permissions"',
        'data-r7-settings-admin-subtab="mapping-devices"',
        'data-r7-settings-admin-subtab="system-security"',
        'data-r7-settings-admin-subtab="rbac-policy"',
        "data-r7-settings-domain-card",
        "data-r7-settings-role-card",
        "data-r7-settings-permission-card",
        "data-r7-settings-mapping-card",
        "data-r7-settings-system-card",
        "data-r7-settings-rbac-card",
    ]
    for marker in required:
        assert marker in text
    assert 'data-r7-settings-admin-subtab="diagnostics-audit"' not in text
    assert "data-r7-settings-diagnostics-card" not in text


def test_r7_025_panel_maps_old_detail_items_to_visual_cards():
    text = _read(REBUILD_PANEL)
    for phrase in (
        "visibility/config summary only",
        "crop_cycle/currentCrop permission",
        "environment settings ownership",
        "irrigation/fertigation settings ownership",
        "HA entity mapping / device mapping ownership",
        "recommendation/AI assist configuration",
        "audit/log visibility and backend enforcement",
        "RBAC, role, mapping, config, diagnostics, backup, secret redaction",
        "admin/farm_owner/farm_staff 역할 경계",
        "조회 · 기록 · 전략 · 실행 · 안전 · 고급설정",
        "HA entity mapping",
        "구역/장치 매핑",
        "MQTT topic mapping later only",
        "mapping health evidence",
        "Secret values render as [REDACTED] only",
        "write / execute / save / delete / ack / clear / apply",
    ):
        assert phrase in text


def test_r7_025_settings_admin_domain_uses_visual_renderer_not_old_detail_call():
    text = _read(REBUILD_PANEL)
    assert 'subpage.key === "settings-admin" ? this.renderR7SettingsAdminZoneVisual() : ""' in text
    assert 'subpage.key === "settings-admin" ? this.renderR7SettingsAdminDetail() : ""' not in text


def test_r7_025_node_smoke_renders_visual_settings_admin_without_old_detail_card():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-025-settings-admin-render-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel._activeR7Domain = 'settings-admin';
      panel.render();
      const html = panel.innerHTML;
      const required = [
        'data-r7-detail-subpage="settings-admin"',
        'data-r7-settings-admin-zone-visual="true"',
        'data-r7-settings-admin-global-boundary="true"',
        'data-r7-settings-admin-detail-absorbed="true"',
        'data-r7-settings-admin-subtab="domain-ownership"',
        'data-r7-settings-admin-subtab="mapping-devices"',
        'data-r7-settings-admin-subtab="rbac-policy"',
        'data-r7-settings-domain-card',
        'data-r7-settings-role-card',
        'data-r7-settings-mapping-card',
        'data-r7-settings-system-card',
        'data-r7-settings-rbac-card',
        '설정는 daily grower workflow가 아닙니다',
        'Secret values render as [REDACTED] only'
      ];
      for (const item of required) {{
        if (!html.includes(item)) {{ console.error(item); process.exit(1); }}
      }}
      if (/<[^>]+data-r7-settings-admin-detail(\\s|=|>)/.test(html)) {{ console.error('old detail rendered'); process.exit(2); }}
      if (html.includes('data-r7-settings-admin-save')) process.exit(3);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
