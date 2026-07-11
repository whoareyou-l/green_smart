from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEGACY_DOC = ROOT / "docs" / "rebuild" / "legacy-reference-inventory.md"
REBUILD_PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "rebuild" / "green-smart-rebuild-panel.js"
LEGACY_PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_legacy_inventory_declares_reference_only_not_direction():
    doc = _read(LEGACY_DOC)
    for marker in (
        "LEGACY REFERENCE ONLY",
        "reference material only",
        "not be treated as",
        "the target architecture",
        "the next implementation direction",
        "v1.11.17 is not a from-scratch rebuild result",
        "Previously, Green Smart worked like this",
    ):
        assert marker in doc


def test_legacy_inventory_records_old_panel_as_legacy_evidence():
    doc = _read(LEGACY_DOC)
    assert "green-smart-panel.js" in doc
    assert "line count at v1.11.17: 9561" in doc
    assert "./domains/crop/crop-readonly.js" in doc
    assert "./domains/admin/admin-page.js" in doc


def test_from_scratch_rebuild_panel_exists_as_new_main_surface():
    source = _read(REBUILD_PANEL)
    for marker in (
        "green-smart-rebuild-panel",
        "data-rebuild-root",
        "data-r7-app-shell",
        "data-r7-sidebar",
        "data-r7-page-workspace",
    ):
        assert marker in source


def test_from_scratch_transition_rules_stay_in_docs_not_rendered_panel():
    source = _read(REBUILD_PANEL)
    doc = _read(LEGACY_DOC)
    for marker in (
        "Legacy UI/features are reference only.",
        "Start from blank page/scaffold.",
        "No legacy panel module imports.",
        "No production cutover without explicit approval.",
    ):
        assert marker not in source
        assert marker in doc


def test_from_scratch_rebuild_panel_does_not_import_legacy_modules():
    source = _read(REBUILD_PANEL)
    forbidden = (
        "./domains/crop/",
        "./domains/admin/admin-page.js",
        "renderAdminSystemPage",
        "./domains/crop/crop-readonly.js",
        "./domains/crop/crop-write-modal.js",
        "green-smart-panel.js",
        "_saveAdminRoleMapping",
    )
    for marker in forbidden:
        assert marker not in source


def test_legacy_panel_still_exists_but_is_not_the_rebuild_start_surface():
    legacy = _read(LEGACY_PANEL)
    rebuild = _read(REBUILD_PANEL)
    assert "Green Smart — Modern SaaS greenhouse dashboard" in legacy
    assert "green-smart-rebuild-panel" in rebuild
    # RS-003~RS-027 and R7-001~R7-020 add real CBA interactions, API loading, crop_cycle cards, assignment read models, read-only projections,
    # virtual runner contract/result adapters, the R7 manual-first sidebar shell, domain placeholders, settings/admin realignment, environment/irrigation/device details,
    # recommendation/automation detail, safety/history detail, domain-page routing, common visual UI, operations dashboard rewrite, shared domain visual frames,
    # and detail-card absorption for environment + irrigation while keeping the rebuild surface far below the legacy panel scale.
    # R7-032 adds inline line-icon SVG paths for the HA-adjacent green sidebar; keep the guard tight but allow that explicit UI slice.
    # R7-033 adds user-info/logout utility helpers while removing settings-admin from the main nav; still keep the rebuild surface bounded.
    # R7-035 adds the reference leaf logo and sage icon helpers from the supplied sidebar image.
    # R7-038 supersedes the active sidebar logo/icon rendering with HA `ha-icon` MDI icons.
    # R7-040 adds the shared domain subtab HA-icon top-navbar mapping while keeping the rebuild surface bounded.
    # R7-042 adds third-party-informed Crop Operations detail markers/operator questions while keeping the surface bounded.
    # R7-043 binds Crop Operations cards to real home-context record/impact/recommendation summaries while keeping the surface bounded.
    # R7-044 turns Crop Operations status-summary content cards into functional operator widgets while preserving no-execution boundaries.
    # R7-047 adds direct product-card helpers for all Crop Operations subtabs and removes duplicate wrapper headings.
    # R7-048 deepens only the records-workflow subtab as a vertical slice with explicit missing/PLS state handling.
    # R7-049 redoes records-workflow as a product layout with write/history/edit/PLS/source affordance judgment.
    # R7-051 adds UI-only write/history/edit/PLS flow skeletons under records-workflow while keeping write APIs disconnected.
    # R7-053 replaces the records-workflow visible content with the user-supplied image-style card dashboard.
    # R7-057 adds records-workflow status badges, modals, and API bindings while keeping execution/device boundaries out.
    # R7-059 adds the image-reference growth survey modal fields/side panel; keep bounded under the adjusted cap.
    # R7-061 adds write-method normalization and save hotfix helpers; keep bounded under the adjusted cap.
    # R7-063 adds the shared records modal shell, sticky header, responsive layout, and save-before validation cards.
    # R7-066 reclassifies Settings into greenhouse/zone, crop-object, mapping, RBAC, safety, system, and diagnostics foundations.
    # R7-071 adds shared HA-icon card/button/recent-row helpers used by records-workflow and Settings users-permissions.
    # R7-086 adds the dedicated CDA permission-matrix modal while keeping the rebuild surface bounded.
    # R7-087 replaces permission-matrix emoji state labels with HA ha-icon state pills and adds bucket edit selection.
    # R7-088 rebuilds Settings greenhouse/zone into reference summary cards + zone list/detail panels.
    # R7-097 remakes Settings create/list modals to match growth-survey write and approval/audit review modal grammar.
    # R7-098 adds settings DB snapshot reload and API-backed list data while keeping write views outside rebuild_views.py.
    # R7-099 turns greenhouse info into per-greenhouse detail with edit/delete affordances.
    # R7-100 extracts a reusable CDA entity list/detail modal so Settings popups do not regress into field-as-row dumps.
    # R7-102 reuses the CDA entity modal for zone-list rows and selected zone details.
    # R7-103 reuses the CDA entity modal for equipment/sensor mapping rows and selected mapping details.
    # R7-105 adds greenhouse FK select + automatic next zone-name calculation to the zone-create modal.
    # R7-112 adds zone-list footer edit/delete actions and reuses the zone-create modal as a PATCH-backed zone edit modal.
    # R7-115 rebuilds Settings device/sensor mapping into image-like device/group/mapping cards and a mapping list.
    # R7-115/v1.15.18 adds device/group create modals that reuse the greenhouse-create common modal grammar.
    # R7-116/v1.15.18 wires Settings users-permissions cards to real approval/permission/user role APIs.
    # R7-117 adds DB-backed reject/edit mutations for the selected Settings audit-log row.
    # R7-118 reworks the audit popup into DB-column user list/detail and a growth-common edit modal.
    # R7-120 adds the Settings system-integration CDB 3/3/1 content-card slice while keeping the rebuild surface bounded.
    # R7-122 adds bounded system action modals for GS/HACS update requests, DB/API error inspection, and Center connection.
    # R7-124 adds Center list modal + system-action button/close bugfixes while preserving the bounded rebuild surface.
    # R7-125 adds row selection, non-throwing update errors, modal action footer fixes, and explicit action-card summaries.
    # R7-128 adds device connection authoring, device/group list modals, and group candidate multi-select.
    # v1.15.18 separates profile/logout controls and adds mobile top two-row navigation while keeping the rebuild surface bounded.
    # v1.15.18 adds mobile settings lazy modal cache mount/hide helpers on top of persistent panel cache.
    assert len(rebuild.splitlines()) < 5505
