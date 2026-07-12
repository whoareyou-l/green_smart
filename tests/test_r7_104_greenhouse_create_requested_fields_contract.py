from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-104-greenhouse-create-requested-fields.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_greenhouse_create_modal() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML=''; this.dataset={{}}; this.style={{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(n){{ return this._items.get(n); }}, define(n,c){{ this._items.set(n,c); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._homeContext = {{ greenhouseName: '대표 온실' }};
      panel._settingsGreenhouseCreateModal = {{ open: true, state: 'idle' }};
      console.log(JSON.stringify({{ html: panel.renderR7SettingsGreenhouseCreateModal() }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_104_version_surfaces_are_1_14_29():
    assert '"version": "1.15.54"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.54"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.54"' in _read(REBUILD_PANEL)


def test_r7_104_greenhouse_create_basic_info_has_only_name_and_location_inputs():
    html = _render_greenhouse_create_modal()
    assert 'data-r7-settings-greenhouse-create-form' in html
    assert 'data-r7-settings-create-section="basic-info"' in html
    basic = re.search(r'data-r7-settings-create-section="basic-info".*?</fieldset>', html, re.S).group(0)
    assert '<span>온실명</span><input name="name"' in basic
    assert '<span>위치</span><input name="location"' in basic
    assert basic.index('name="name"') < basic.index('name="location"')
    assert 'name="installType"' not in basic
    assert 'name="approvalScope"' not in basic


def test_r7_104_greenhouse_create_operation_standard_has_three_selects_in_order():
    html = _render_greenhouse_create_modal()
    operation = re.search(r'data-r7-settings-create-section="operation-standard".*?</fieldset>', html, re.S).group(0)
    expected = [
        ('운영상태', 'operatingStatus'),
        ('설치유형', 'installType'),
        ('기본 시간대', 'timezone'),
    ]
    for label, name in expected:
        assert f'<span>{label}</span><select name="{name}"' in operation
    positions = [operation.index(f'name="{name}"') for _, name in expected]
    assert positions == sorted(positions)
    assert 'name="approvalScope"' not in operation
    assert '승인 범위' not in operation


def test_r7_104_dropdown_options_are_operator_ready_and_install_type_is_nuc_only():
    html = _render_greenhouse_create_modal()
    operation = re.search(r'data-r7-settings-create-section="operation-standard".*?</fieldset>', html, re.S).group(0)
    for value, label in [('운영중', '운영중'), ('대기', '대기'), ('점검중', '점검중'), ('비활성', '비활성')]:
        assert re.search(rf'value="{value}"[^>]*>{label}', operation)
    assert 'name="installType"' in operation
    install_select = re.search(r'<select name="installType".*?</select>', operation, re.S).group(0)
    assert install_select.count('<option') == 1
    assert re.search(r'value="NUC edge"[^>]*>NUC edge', install_select)
    for value, label in [('Asia/Seoul', 'Asia/Seoul · 한국 표준시'), ('UTC', 'UTC'), ('Asia/Tokyo', 'Asia/Tokyo'), ('America/Los_Angeles', 'America/Los_Angeles')]:
        assert re.search(rf'value="{re.escape(value)}"[^>]*>{re.escape(label)}', operation)


def test_r7_104_memo_section_keeps_creation_reason_textarea_and_presave_checklist():
    html = _render_greenhouse_create_modal()
    memo = re.search(r'data-r7-settings-create-section="memo".*?</fieldset>', html, re.S).group(0)
    assert '<span>생성 사유</span><textarea name="note"' in memo
    for phrase in ['저장 전 검증', '온실명·위치 확인', '운영 기준 확인', '승인 메모']:
        assert phrase in html


def test_r7_104_documented():
    doc = _read(DOC)
    for phrase in ['온실 생성 모달', '운영상태', '설치유형', '기본 시간대', '생성 사유', '승인 범위 제거']:
        assert phrase in doc
