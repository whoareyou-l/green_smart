from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
DOC = ROOT / "docs/rebuild/r7-096-settings-greenhouse-zone-common-modal-shells.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_with_modal(open_call: str) -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML=''; this.dataset={{}}; this.style={{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(n){{ return this._items.get(n); }}, define(n,c){{ this._items.set(n,c); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ ok: true }}) }};
      panel._homeContext = {{ greenhouseName: '제1온실', zones: [{{ id:'zone-1', zoneId:'zone-1', name:'1구역', zoneName:'1구역', purpose:'재배', area:'120㎡', bedCount:6, currentCrop:{{ crop_cycle_id:'17', crop_label_ko:'토마토' }}, dataAvailability:{{ state:'fresh' }}, equipmentProfile:{{ labels:['온도 센서','천창','미연결 양액기'] }} }}] }};
      panel._activeR7Domain = 'settings-admin';
      panel.setR7DomainSubtab('settings-admin','greenhouse-zones');
      {open_call}
      panel.render();
      console.log(JSON.stringify({{ html: panel.innerHTML }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_096_version_surfaces_are_1_14_21():
    assert '"version": "1.15.21"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.21"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.21"' in _read(REBUILD_PANEL)


def test_r7_096_create_modals_use_record_common_modal_shell_not_direct_cda_overlay():
    source = _read(REBUILD_PANEL)
    assert 'renderR7SettingsCreateRecordCommonModal' in source
    assert 'renderR7RecordCommonModalShell(modalModel, summary, body)' in source
    assert 'data-r7-settings-create-record-common-modal' in source
    assert 'data-r7-settings-create-record-kind' in source
    detail_start = source.index('renderR7SettingsDetailActionModal')
    detail_end = source.index('renderR7SettingsGreenhouseCreateModal')
    detail_source = source[detail_start:detail_end]
    assert 'renderR7RecordCommonModalShell' in detail_source
    assert 'renderR7CdaModalOverlay' not in detail_source


def test_r7_096_greenhouse_zone_mapping_create_modals_render_record_common_shell():
    cases = [
        ('panel._openSettingsGreenhouseCreateModal();', 'greenhouse-create'),
        ('panel._openSettingsZoneCreateModal();', 'zone-create'),
        ('panel._openSettingsDeviceSensorMappingModal();', 'device-sensor-mapping'),
    ]
    for call, kind in cases:
        html = _render_with_modal(call)
        assert 'data-r7-record-common-modal-shell' in html
        assert f'data-r7-settings-create-record-kind="{kind}"' in html
        assert 'data-r7-settings-create-record-common-modal' in html


def test_r7_096_shortcut_buttons_open_cda_split_modals():
    source = _read(REBUILD_PANEL)
    for name in ['_openSettingsGreenhouseInfoSplitModal', '_openSettingsZoneListSplitModal', '_openSettingsEquipmentInfoSplitModal']:
        assert name in source
    assert 'renderR7SettingsShortcutCdaSplitModal' in source
    assert 'renderR7CdaSplitModal({ open: modal.open' in source
    for marker in [
        'data-r7-settings-greenhouse-info-split-modal',
        'data-r7-settings-zone-list-split-modal',
        'data-r7-settings-equipment-info-split-modal',
    ]:
        assert marker in source


def test_r7_096_shortcut_modal_render_has_cda_split_shell():
    cases = [
        ('panel._openSettingsGreenhouseInfoSplitModal();', 'greenhouse-info'),
        ('panel._openSettingsZoneListSplitModal();', 'zone-list'),
        ('panel._openSettingsEquipmentInfoSplitModal();', 'equipment-info'),
    ]
    for call, kind in cases:
        html = _render_with_modal(call)
        assert 'data-r7-cda-split-modal' in html
        assert f'data-r7-settings-shortcut-cda-split-kind="{kind}"' in html
        assert 'data-r7-cda-list-panel' in html
        assert 'data-r7-cda-detail-panel' in html


def test_r7_096_documented():
    doc = _read(DOC)
    for phrase in ['record common modal shell', 'CDA split modal', '생성 버튼', '목록 버튼']:
        assert phrase in doc
