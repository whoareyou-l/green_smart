from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
ADMIN_MODULE = ROOT / "custom_components" / "green_smart" / "panel" / "domains" / "admin" / "admin-page.js"
FRONTEND_PLAN = ROOT / "docs" / "rebuild" / "frontend-decomposition-plan.md"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rb001_version_surfaces_are_v1115():
    assert '"version": "1.14.0"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.0"' in _read(PANEL)
    assert "v1.14.0" in _read(FRONTEND_PLAN)


def test_rb001_admin_module_exists_and_exports_shell_renderers():
    assert ADMIN_MODULE.exists()
    module = _read(ADMIN_MODULE)
    for marker in (
        "export function adminSystemTabs",
        "export function renderAdminSystemTabBar",
        "export function renderAdminSystemTabContent",
        "export function renderAdminSystemPage",
        "data-admin-system-tab",
        "data-admin-system-content",
        "data-required-permission=\"system_settings\"",
        "data-role-visibility=\"admin\"",
    ):
        assert marker in module


def test_rb001_panel_imports_admin_shell_and_delegates_existing_methods():
    panel = _read(PANEL)
    assert 'from "./domains/admin/admin-page.js"' in panel
    for imported in (
        "adminSystemTabs",
        "renderAdminSystemTabBar",
        "renderAdminSystemTabContent",
        "renderAdminSystemPage",
    ):
        assert imported in panel
    assert "_adminSystemTabs() {" in panel and "return adminSystemTabs();" in panel
    assert "_renderAdminSystemTabBar() {" in panel and "return renderAdminSystemTabBar(this);" in panel
    assert "_renderAdminSystemTabContent() {" in panel and "return renderAdminSystemTabContent(this);" in panel
    assert "_renderAdminSystemPage() {" in panel and "return renderAdminSystemPage(this);" in panel


def test_rb001_keeps_admin_sidebar_permission_gate_and_existing_bindings():
    panel = _read(PANEL)
    for marker in (
        'this._page === "admin" && this._hasPermission("system_settings")',
        'this._hasPermission("system_settings") ? navBtn("admin"',
        '_bindAdminSystemInputs(root)',
        'button[data-admin-system-tab]',
        'data-admin-role-save',
        'data-admin-config-save',
        'data-admin-diagnostic-run',
        'data-admin-backup-export',
    ):
        assert marker in panel


def test_rb001_frontend_plan_records_admin_shell_extraction_done_and_boundaries():
    plan = _read(FRONTEND_PLAN)
    for marker in (
        "RB-001 Admin/System shell 분리",
        "v1.14.0",
        "domains/admin/admin-page.js",
        "Admin/System render boundary extracted",
        "API route/DB/prod 변경 없음",
        "Crop/environment/irrigation/device extraction remains deferred",
    ):
        assert marker in plan
