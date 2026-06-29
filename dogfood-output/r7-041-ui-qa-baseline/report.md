# R7-041 UI QA Baseline Report

Date: 2026-06-30
Version under test: v1.12.76
Scope: operations-home plus seven shared R7 domain pages.

## Executive summary

Result: PASS with one documented limitation.

- Local contract/render smoke passed for all 8 pages.
- Browser QA harness rendered the panel successfully.
- Browser console had no JavaScript errors.
- Sidebar appeared as HA-adjacent Green Smart rail in the harness.
- Domain pages preserved the order: hero/title -> unified content card -> subtab navbar -> zone selector -> active panel.
- Domain subtabs rendered as top-navbar structure, not old pill-cluster structure.
- All domain subtabs contained `ha-icon` markers plus visible titles.

## Limitation

The real HA browser session reached the Home Assistant login page, but there was no authenticated browser session available in this QA run. Therefore the internal HA panel was not clicked through with a live HA login session.

Mitigation used:

1. HA login page was reachable at `http://127.0.0.1:8123/`.
2. Login page browser console had no JavaScript errors.
3. Prod served-source smoke was executed against `/green_smart_panel/rebuild/green-smart-rebuild-panel.js`.
4. Browser QA harness imported and rendered the same rebuild panel module from the repository.
5. Node render smoke exercised all 8 pages with HA-like `hass.user` and zone context.

## Browser QA harness evidence

Harness URL:

```text
http://127.0.0.1:8787/dogfood-output/r7-041-ui-qa-baseline/harness.html?page=crop-operations
```

Observed crop-operations visual baseline:

```text
sidebar visible
Green Smart brand visible
sidebar domain labels visible
작물 운영 hero visible
subtab navbar visible as a horizontal top nav
zone selector visible below subtabs
active status-summary panel visible
old pill-cluster markers absent
browser console errors: 0
```

Note: the harness stubs HA's `ha-icon` custom element, so icons may appear as `mdi:...` text in the harness screenshot. In real HA, those custom elements render as icons.

## DOM QA summary

```json
[
  {"page":"operations-home","hasSidebar":true,"hasHero":true,"hasUnified":true,"hasTopNavbar":true,"hasZone":true,"oldPill":false},
  {"page":"crop-operations","hasSidebar":true,"hasHero":true,"hasUnified":true,"hasTopNavbar":true,"hasZone":true,"oldPill":false},
  {"page":"environment-control","hasSidebar":true,"hasHero":true,"hasUnified":true,"hasTopNavbar":true,"hasZone":true,"oldPill":false},
  {"page":"irrigation-fertigation","hasSidebar":true,"hasHero":true,"hasUnified":true,"hasTopNavbar":true,"hasZone":true,"oldPill":false},
  {"page":"device-control","hasSidebar":true,"hasHero":true,"hasUnified":true,"hasTopNavbar":true,"hasZone":true,"oldPill":false},
  {"page":"recommendation-automation","hasSidebar":true,"hasHero":true,"hasUnified":true,"hasTopNavbar":true,"hasZone":true,"oldPill":false},
  {"page":"safety-history","hasSidebar":true,"hasHero":true,"hasUnified":true,"hasTopNavbar":true,"hasZone":true,"oldPill":false},
  {"page":"settings-admin","hasSidebar":true,"hasHero":true,"hasUnified":true,"hasTopNavbar":true,"hasZone":true,"oldPill":false}
]
```

## Findings

| ID | Severity | Category | Finding | Status |
|---|---|---|---|---|
| R7-041-F1 | Low | QA limitation | Browser could not enter authenticated HA panel because no HA browser login session was available. | Documented; mitigated with served-source/render smoke + harness |
| R7-041-F2 | Low | Harness artifact | Harness renders `ha-icon` as `mdi:...` text because HA frontend icon component is not loaded. | Documented; not a product issue |

## Completion checklist

- [x] R7-041 contract added
- [x] R7-041 contract passed locally
- [x] Browser harness rendered crop-operations
- [x] Browser console checked: 0 errors
- [x] Browser DOM sweep covered 8 pages
- [x] Node render smoke covered 8 pages
- [x] Recent HA log scan saved
- [x] Prod sync to v1.12.76
- [x] HA check_config after sync
- [x] Prod served-source smoke after sync
- [x] Full pytest
- [ ] Release v1.12.76
