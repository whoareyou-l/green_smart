from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
DOC = ROOT / "docs/rebuild/r7-085-approval-card-modal-only-settings-icons.md"

SETTINGS_TABS = {
    "greenhouse-zones": "mdi:greenhouse",
    "device-sensor-mapping": "mdi:devices",
    "users-permissions": "mdi:account-key-outline",
    "system-integration": "mdi:home-assistant",
}


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_085_version_surfaces_are_1_14_10():
    assert '"version": "1.14.95"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.95"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.95"' in _read(PANEL)


def test_r7_085_approval_needed_card_has_no_inline_confirm_button():
    source = _read(PANEL)
    start = source.index('kind: "settings-approval-needed"')
    end = source.index('kind: "settings-audit-log"')
    block = source[start:end]
    assert 'data-r7-settings-approval-row-button' not in block
    assert '<span>확인</span>' not in block
    assert 'actionHtml:' not in block
    assert 'data-r7-settings-approval-list-button' in block
    assert '전체 로그인 승인 확인' in block


def test_r7_085_settings_subtab_icons_are_domain_specific_and_unique():
    source = _read(PANEL)
    for key, icon in SETTINGS_TABS.items():
        assert f'"{key}": "{icon}"' in source
    icons = list(SETTINGS_TABS.values())
    assert len(icons) == len(set(icons))
    assert 'data-r7-domain-subtab-icon-name="${icon}"' in source


def test_r7_085_rendered_settings_tabs_use_distinct_icon_names_and_card_modal_only():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._settingsUsersPermissions = {{
        source: 'fixture', users: [], auditRows: [], counts: {{}},
        approvalRows: [{{ id: 77, label: '권한 변경', requestType: '권한 변경', requester: '임서원', status: 'pending', tone: 'amber' }}]
      }};
      const html = panel.renderR7SettingsAdminZoneVisual();
      const iconMatches = [...html.matchAll(/data-r7-domain-subtab-for="settings-admin"[\\s\\S]*?data-r7-domain-subtab-icon-name="([^"]+)"/g)].map((m) => m[1]);
      const approvalBlock = html.slice(html.indexOf('data-r7-settings-users-card="approval-queue"'), html.indexOf('data-r7-settings-users-card="audit-log"'));
      console.log(JSON.stringify({{ iconMatches, approvalBlock }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    payload = json.loads(result.stdout)
    icons = payload["iconMatches"][:len(SETTINGS_TABS)]
    assert icons == list(SETTINGS_TABS.values())
    assert len(icons) == len(set(icons))
    approval_block = payload["approvalBlock"]
    assert 'data-r7-settings-approval-row-button' not in approval_block
    assert '>확인<' not in approval_block
    assert 'data-r7-settings-approval-list-button' in approval_block


def test_r7_085_documented():
    doc = _read(DOC)
    for phrase in ["승인 필요 작업", "확인 버튼 제거", "모달에서 처리", "설정 하위탭", "고유 MDI 아이콘"]:
        assert phrase in doc
