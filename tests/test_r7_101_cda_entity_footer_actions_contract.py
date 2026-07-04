from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-101-cda-entity-footer-actions.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML=''; this.dataset={{}}; this.style={{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(n){{ return this._items.get(n); }}, define(n,c){{ this._items.set(n,c); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ ok: true }}) }};
      panel._homeContext = {{ greenhouseName: '대표 온실', zones: [] }};
      panel._settingsShortcutCdaModal = {{ open: true, kind: 'greenhouse-info', selectedGreenhouseId: 31 }};
      panel._settingsGreenhouseZoneData = {{ source: 'test', greenhouses: [{{ id: 31, name: 'C동 온실', location: '평택', installType: '연동형', approvalScope: '소유자 승인', status: 'active', note: '딸기', createdAt: '2026-07-01', updatedAt: '2026-07-02' }}], zones: [], deviceSensorMappings: [] }};
      console.log(JSON.stringify({{ html: panel.renderR7SettingsShortcutReviewLikeModal() }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_101_version_surfaces_are_1_14_26():
    assert '"version": "1.14.69"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.69"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.69"' in _read(REBUILD_PANEL)


def test_r7_101_greenhouse_edit_delete_are_detail_footer_actions_before_close():
    html = _render()
    assert 'data-r7-settings-greenhouse-info-detail-panel' in html
    assert 'data-r7-cda-entity-detail-footer="greenhouse-info"' in html
    assert 'data-r7-settings-greenhouse-edit-button="31"' in html
    assert 'data-r7-settings-greenhouse-delete-button="31"' in html

    footer_start = html.index('data-r7-cda-entity-detail-footer="greenhouse-info"')
    footer = html[footer_start:]
    positions = [
        footer.index('data-r7-settings-shortcut-evidence-button'),
        footer.index('data-r7-settings-greenhouse-edit-button="31"'),
        footer.index('data-r7-settings-greenhouse-delete-button="31"'),
        footer.index('data-r7-settings-shortcut-cda-split-close'),
    ]
    assert positions == sorted(positions)


def test_r7_101_greenhouse_actions_section_removed_from_detail_body():
    html = _render()
    assert 'data-r7-settings-shortcut-review-section="greenhouse-actions"' not in html
    assert '2. 온실 작업' not in html
    detail_body_start = html.index('data-r7-cda-entity-detail-fields="greenhouse-info"')
    detail_body_end = html.index('data-r7-cda-entity-detail-footer="greenhouse-info"')
    detail_body = html[detail_body_start:detail_body_end]
    assert 'data-r7-settings-greenhouse-edit-button' not in detail_body
    assert 'data-r7-settings-greenhouse-delete-button' not in detail_body


def test_r7_101_source_uses_cda_footer_action_slot_not_detail_section_for_entity_actions():
    source = _read(REBUILD_PANEL)
    assert "entityFooterActions" in source
    assert 'data-r7-cda-entity-detail-footer="${entityType}"' in source
    assert 'data-r7-settings-shortcut-review-section="greenhouse-actions"' not in source


def test_r7_101_documented():
    doc = _read(DOC)
    for phrase in ["footer action", "닫기 버튼의 왼쪽", "수정", "삭제", "CDA entity"]:
        assert phrase in doc
