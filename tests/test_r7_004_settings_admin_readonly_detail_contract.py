from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-004-settings-admin-readonly-detail.md"
R7_003_DOC = ROOT / "docs/rebuild/r7-003-detail-configuration-subpages-baseline.md"
R7_000_DOC = ROOT / "docs/rebuild/r7-000-main-dashboard-sidebar-detail-ia-blueprint.md"
CURRENT_UI = ROOT / "docs/design/current-ui-design-and-navigation.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
TARGET_ARCH = ROOT / "docs/rebuild/target-architecture.md"
RBAC_POLICY = ROOT / "custom_components/green_smart/rbac_policy.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_004_version_surfaces_are_1_12_38():
    assert '"version": "1.14.67"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.67"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.67"' in _read(REBUILD_PANEL)
    for path in (DOC, R7_003_DOC, R7_000_DOC, CURRENT_UI, PRODUCT_PLAN, TARGET_ARCH):
        assert "v1.14.67" in _read(path)


def test_r7_004_doc_declares_user_selected_settings_admin_scope_and_boundaries():
    text = _read(DOC)
    for marker in (
        "# R7-004 Settings/Admin Read-only Detail",
        "Status: R7-004 complete",
        "user-selected scope: 설정 — RBAC/config/admin read-only detail",
        "Admin/System ownership matrix",
        "Role ownership matrix",
        "Permission bucket matrix",
        "HA entity mapping metadata",
        "Diagnostics/backup/audit export metadata",
        "No API route change in R7-004",
        "No DB migration in R7-004",
        "No execution authority in R7-004",
        "No role assignment mutation in R7-004",
        "No raw secrets in R7-004",
        "No MQTT/device command in R7-004",
    ):
        assert marker in text


def test_r7_004_panel_has_settings_admin_visual_absorbed_markers():
    text = _read(REBUILD_PANEL)
    for marker in (
        "R7-004 Settings/Admin read-only detail",
        "renderR7SettingsAdminZoneVisual",
        "data-r7-settings-admin-zone-visual=\"true\"",
        "data-r7-settings-admin-global-boundary=\"true\"",
        "data-r7-settings-admin-detail-absorbed=\"true\"",
        "data-r7-settings-admin-readonly-boundary=\"true\"",
        "data-r7-settings-admin-role-ownership",
        "data-r7-settings-admin-permission-buckets",
        "data-r7-settings-admin-area=\"user-role-mapping\"",
        "data-r7-settings-admin-area=\"ha-entity-mapping\"",
        "data-r7-settings-admin-area=\"system-config-metadata\"",
        "data-r7-settings-admin-area=\"diagnostics-backup-audit\"",
        "data-r7-settings-admin-area=\"rbac-policy-contract\"",
        "data-r7-settings-admin-farm-owner-staff-scope",
        "data-r7-settings-admin-secret-redaction",
        "data-r7-settings-admin-backend-enforcement",
        "data-r7-settings-domain-card",
        "data-r7-settings-role-card",
        "data-r7-settings-mapping-card",
        "data-r7-settings-system-card",
        "data-r7-settings-rbac-card",
    ):
        assert marker in text


def test_r7_004_settings_admin_replaces_placeholder_with_deeper_readonly_detail_only_for_settings_group():
    text = _read(REBUILD_PANEL)
    assert "data-r7-detail-subpage=\"settings-admin\"" in text
    assert "data-r7-settings-admin-zone-visual" in text
    settings_pos = text.index("data-r7-detail-subpage=\"settings-admin\"")
    detail_pos = text.index("data-r7-settings-admin-zone-visual")
    assert settings_pos < detail_pos
    for group in (
        "operations-home",
        "crop-centered",
        "field-status",
        "recommendation-review",
    ):
        assert f'data-r7-detail-subpage="{group}"' in text
    assert "data-r7-subpage-config-placeholder" in text


def test_r7_004_rbac_policy_source_terms_are_rendered_as_readonly_ui_evidence():
    panel = _read(REBUILD_PANEL)
    policy = _read(RBAC_POLICY)
    for term in (
        "RBAC_ROLE_OWNERSHIP",
        "RBAC_PERMISSION_BUCKETS",
        "RBAC_ADMIN_OWNERSHIP",
        "RBAC_BACKEND_ENFORCED_ACTION_CLASSES",
        "manage_farm_staff_roles",
        "system_settings",
        "edit_entity_mapping",
        "view_audit_logs",
    ):
        assert term in policy
        assert term in panel
    for label in ("admin", "farm_owner", "farm_staff", "조회", "기록", "전략", "실행", "안전", "고급설정"):
        assert label in panel


def test_r7_004_readonly_admin_detail_does_not_add_admin_mutation_or_secret_exposure():
    text = _read(REBUILD_PANEL)
    forbidden = (
        "data-r7-settings-admin-save",
        "data-r7-settings-admin-delete",
        "data-r7-settings-admin-assign-role-button",
        "data-r7-settings-admin-secret-value",
        "api_key",
        "password",
        "token",
        "callService(",
        ".callService",
        "POST",
        "PUT",
        "DELETE",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
        "approvalOverrideEnabled\": true",
    )
    for marker in forbidden:
        assert marker not in text
    assert "[REDACTED]" in text


def test_r7_004_node_smoke_renders_settings_admin_detail_with_dashboard_preserved():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'legacy-physical-readonly-adapter', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const homeHtml = panel.innerHTML;
      if (!homeHtml.includes('data-r7-main-dashboard')) {{ console.error('data-r7-main-dashboard'); process.exit(1); }}
      panel.setR7ActiveDomain('settings-admin');
      const html = panel.innerHTML;
      const required = [
        'data-r7-settings-admin-detail',
        'data-r7-settings-admin-readonly-boundary="true"',
        'data-r7-settings-admin-role-ownership',
        'data-r7-settings-admin-permission-buckets',
        'data-r7-settings-admin-secret-redaction',
        'data-r7-settings-admin-backend-enforcement',
        'RBAC_BACKEND_ENFORCED_ACTION_CLASSES',
        '[REDACTED]'
      ];
      for (const item of required) {{
        if (!html.includes(item)) {{ console.error(item); process.exit(1); }}
      }}
      if (html.includes('data-r7-settings-admin-save')) process.exit(2);
      if (html.includes('구역별 작물 운영')) process.exit(3);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_004_source_docs_link_settings_admin_detail_slice():
    for path in (R7_003_DOC, R7_000_DOC, CURRENT_UI, PRODUCT_PLAN, TARGET_ARCH):
        text = _read(path)
        assert "R7-004 Settings/Admin Read-only Detail" in text
        assert "docs/rebuild/r7-004-settings-admin-readonly-detail.md" in text
        assert "No role assignment mutation in R7-004" in text
