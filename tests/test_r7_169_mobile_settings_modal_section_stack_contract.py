from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"


def source() -> str:
    return PANEL.read_text(encoding="utf-8")


def test_v1_15_37_settings_create_modal_mobile_stacks_form_and_checklist_sections():
    text = source()
    assert '"version": "1.15.55"' in MANIFEST.read_text(encoding="utf-8")
    assert 'const REBUILD_VERSION = "1.15.55"' in text
    start = text.index('  renderR7RecordCommonModalShell(modal, summary, body)')
    block = text[start:text.index('  renderR7RecordHistoryCdaBody', start)]
    assert 'data-r7-record-modal-responsive-style' in block
    assert '[data-r7-record-common-modal-shell] [data-r7-settings-create-form-layout="growth-like"] { grid-template-columns:1fr !important; gap:12px !important; }' in block
    assert '[data-r7-record-common-modal-shell] [data-r7-settings-create-pre-save-checklist] { position:static !important; top:auto !important; max-width:none !important; width:100% !important; }' in block


def test_v1_15_37_cda_list_modals_mobile_stack_list_and_detail_sections():
    text = source()
    start = text.index('  renderR7CdaSplitModal(')
    block = text[start:text.index('  renderR7SettingsCreatePreSaveChecklist', start)]
    assert 'data-r7-cda-split-mobile-stack-style' in block
    assert 'data-r7-cda-split-modal-main="list-detail"' in block
    assert 'data-r7-mobile-modal-sections="stack-1col"' in block
    assert '[data-r7-cda-split-modal-main="list-detail"] { grid-template-columns:1fr !important; grid-auto-flow:row !important; overflow:auto !important; }' in block
    assert '[data-r7-cda-split-modal-main="list-detail"] > [data-r7-cda-list-panel], [data-r7-cda-split-modal-main="list-detail"] > [data-r7-cda-detail-panel]' in block
