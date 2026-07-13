from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-11-mobile-settings-modal-lazy-cache-plan.md"


def source() -> str:
    return PANEL.read_text()


def block(text: str, start: str, end: str) -> str:
    s = text.index(start)
    e = text.index(end, s)
    return text[s:e]


def test_v1_15_18_declares_lazy_modal_root_mount_and_hide_helpers():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.56"' in text
    for marker in [
        '_ensureR7SettingsModalRoot()',
        'data-r7-settings-modal-root="lazy-cache"',
        '_renderR7CachedSettingsModalHtml(type)',
        'this["renderR7Settings" + "ApprovalListModal"]()',
        'this["renderR7Settings" + "AuditLogModal"]()',
        '_mountR7CachedSettingsModal(type)',
        '_hideR7CachedSettingsModal(type = "all")',
        'data-r7-settings-modal-cache-mounted',
        'lazy-cache-on-open-no-full-render',
    ]:
        assert marker in text


def test_v1_15_18_representative_modal_open_paths_mount_cache_before_full_render():
    text = source()
    expectations = {
        '_openSettingsApprovalModal(request)': '_mountR7CachedSettingsModal("approval-detail")',
        '_openSettingsApprovalListModal()': '_mountR7CachedSettingsModal("approval-list")',
        '_selectSettingsApprovalListRequest(requestId)': '_mountR7CachedSettingsModal("approval-list")',
        '_openSettingsAuditLogModal()': '_mountR7CachedSettingsModal("audit-log")',
        '_selectSettingsAuditLogRow(rowId)': '_mountR7CachedSettingsModal("audit-log")',
        '_openSettingsPermissionMatrixModal()': '_mountR7CachedSettingsModal("permission-matrix")',
        '_selectSettingsPermissionMatrixBucket(bucket)': '_mountR7CachedSettingsModal("permission-matrix")',
        '_selectSettingsPermissionMatrixRole(role)': '_mountR7CachedSettingsModal("permission-matrix")',
    }
    for fn, call in expectations.items():
        fn_block = text[text.index(fn):text.index('\n  }', text.index(fn))]
        assert call in fn_block
        refresh = 'this._renderOrRefreshR7SettingsPanel("settings-modal-state-change");'
        assert refresh in fn_block
        assert fn_block.index(call) < fn_block.index(refresh)


def test_v1_15_18_representative_modal_close_paths_hide_cache_before_full_render():
    text = source()
    expectations = {
        '_closeSettingsApprovalListModal()': '_hideR7CachedSettingsModal("approval-list")',
        '_closeSettingsAuditLogModal()': '_hideR7CachedSettingsModal("audit-log")',
        '_closeSettingsPermissionMatrixModal()': '_hideR7CachedSettingsModal("permission-matrix")',
    }
    for fn, call in expectations.items():
        fn_block = text[text.index(fn):text.index('\n  }', text.index(fn))]
        assert call in fn_block
        refresh = 'this._renderOrRefreshR7SettingsPanel("settings-modal-state-change");'
        assert refresh in fn_block
        assert fn_block.index(call) < fn_block.index(refresh)


def test_v1_15_18_plan_documents_modal_lazy_cache_scope():
    plan = PLAN.read_text()
    for marker in ['모바일 설정 모달 lazy cache', 'approval-list', 'audit-log', 'permission-matrix', 'GitHub Release']:
        assert marker in plan
