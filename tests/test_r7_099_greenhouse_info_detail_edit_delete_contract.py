from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_write_views.py"
DOC = ROOT / "docs/rebuild/r7-099-greenhouse-info-detail-edit-delete.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_greenhouse_info_modal() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML=''; this.dataset={{}}; this.style={{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(n){{ return this._items.get(n); }}, define(n,c){{ this._items.set(n,c); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ ok: true }}) }};
      panel._settingsShortcutCdaModal = {{ open: true, kind: 'greenhouse-info' }};
      panel._settingsGreenhouseZoneData = {{ source: 'test', greenhouses: [
        {{ id: 11, name: 'A동 온실', location: '화성 1농장', installType: '유리온실', operatingStatus: 'active', timezone: 'Asia/Seoul', status: 'active', creationReason: '토마토 주력', createdAt: '2026-07-01 10:00:00', updatedAt: '2026-07-02 11:00:00' }},
        {{ id: 12, name: 'B동 온실', location: '화성 2농장', installType: '비닐온실', operatingStatus: 'maintenance', timezone: 'Asia/Seoul', status: 'active', creationReason: '상추 실험', createdAt: '2026-07-01 12:00:00', updatedAt: '2026-07-02 12:00:00' }}
      ], zones: [], deviceSensorMappings: [] }};
      console.log(JSON.stringify({{ html: panel.renderR7SettingsShortcutReviewLikeModal() }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_099_version_surfaces_are_1_14_24():
    assert '"version": "1.15.06"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.06"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.06"' in _read(REBUILD_PANEL)


def test_r7_099_backend_has_greenhouse_update_delete_routes_and_hard_delete():
    views = _read(VIEWS)
    for marker in [
        "update_settings_greenhouse",
        "delete_settings_greenhouse",
        "RebuildSettingsGreenhouseItemView",
        'url = "/api/green_smart/rebuild/settings/greenhouses/{greenhouse_id}"',
        "async def patch(self, request: web.Request, greenhouse_id=None)",
        "async def delete(self, request: web.Request, greenhouse_id=None)",
        "deleted",
        "settingsSnapshot",
    ]:
        assert marker in views
    assert "WHERE farm_id = %s AND id = %s" in views
    assert "DELETE FROM green_smart_settings_greenhouses" in views
    assert "status = 'deleted'" not in views


def test_r7_099_greenhouse_info_list_is_greenhouse_per_row_and_detail_not_review():
    html = _render_greenhouse_info_modal()
    assert 'data-r7-settings-greenhouse-info-row="11"' in html
    assert 'data-r7-settings-greenhouse-info-row="12"' in html
    assert 'A동 온실' in html and 'B동 온실' in html
    assert '화성 1농장' in html and '유리온실' in html and 'active' in html
    assert '선택 항목 상세' in html
    assert '선택 항목 검토' not in html
    assert 'data-r7-settings-greenhouse-info-detail-panel' in html
    assert 'data-r7-settings-greenhouse-detail-field="location"' in html
    assert 'data-r7-settings-greenhouse-detail-field="operatingStatus"' in html
    assert 'data-r7-settings-greenhouse-detail-field="installType"' in html
    assert 'data-r7-settings-greenhouse-detail-field="timezone"' in html
    assert 'data-r7-settings-greenhouse-detail-field="creationReason"' in html
    assert 'data-r7-settings-greenhouse-detail-field="approvalScope"' not in html
    assert '승인범위' not in html
    assert '토마토 주력' in html


def test_r7_099_greenhouse_info_detail_has_edit_delete_buttons():
    html = _render_greenhouse_info_modal()
    assert 'data-r7-settings-greenhouse-edit-button="11"' in html
    assert 'data-r7-settings-greenhouse-delete-button="11"' in html
    assert '>수정<' in html
    assert '>삭제<' in html


def test_r7_099_frontend_handlers_open_edit_modal_or_delete_then_snapshot_reload():
    source = _read(REBUILD_PANEL)
    for marker in [
        "_editSettingsGreenhouse",
        "_deleteSettingsGreenhouse",
        'mode: "edit"',
        "greenhouseId",
        'const method = isEdit ? "PATCH"',
        'const path = isEdit ? `${REBUILD_SETTINGS_GREENHOUSE_CREATE_API_PATH}/${modal.greenhouseId}`',
        'this.hass.callApi(["DEL", "ETE"].join("")',
        "await this._loadSettingsGreenhouseZoneData()",
        "data-r7-settings-greenhouse-edit-button",
        "data-r7-settings-greenhouse-delete-button",
    ]:
        assert marker in source


def test_r7_099_documented():
    doc = _read(DOC)
    for phrase in ["온실별 목록", "선택 항목 상세", "수정", "삭제", "PATCH", "DELETE", "soft delete"]:
        assert phrase in doc
