# Green Smart Legacy Reference Inventory

> Status: LEGACY REFERENCE ONLY
> Last legacy release observed: `v1.11.17`
> Purpose: preserve evidence of how the old product worked so the from-scratch rebuild can learn from it without continuing it.

## Non-negotiable rule

The legacy UI, legacy API layering, legacy RB/RB-00x slices, and legacy release notes are **reference material only**.

They must not be treated as:

- the target architecture;
- the next implementation direction;
- a requirement to keep old pages/cards/buttons;
- permission to keep adding vertical slices onto the legacy panel;
- proof that the rebuild should preserve legacy UX.

They mean only:

> "Previously, Green Smart worked like this. Use it as evidence when designing the new product from a blank page."

## What went wrong in `v1.11.17`

`v1.11.17` was released as a VS-N001 RBAC/Admin ownership scaffold, but it still preserved the old product surface:

```text
custom_components/green_smart/panel/green-smart-panel.js
line count at v1.11.17: 9561
```

The panel still imported legacy domain modules such as:

```text
./domains/crop/crop-readonly.js
./domains/crop/crop-write-modal.js
./domains/crop/crop-growth-modal.js
./domains/crop/crop-pest-modal.js
./domains/crop/crop-control-modal.js
./domains/admin/admin-page.js
```

Therefore `v1.11.17 is not a from-scratch rebuild result`. It is now classified as legacy/reference material.

## How to use this inventory

Allowed uses:

- understand old routes and response shapes;
- identify farm workflows that must be redesigned;
- extract terminology that farmers recognize;
- compare old RBAC assumptions with the new access model;
- document migration/compatibility adapters when needed.

Forbidden uses:

- copy old page layouts into the new scaffold;
- continue `green-smart-panel.js` as the main rebuild surface;
- treat RB-00x component extraction as the new architecture;
- add new feature slices on top of the old UI;
- let old tests force the rebuild back toward legacy UX.

## From-scratch rebuild start rule

The next product implementation surface must begin as a blank scaffold:

```text
custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js
```

That scaffold must intentionally avoid importing legacy crop/environment/admin page modules. It starts with an empty shell and only grows from new master documents and target architecture.

## Main vs legacy registration

From this point forward:

```text
green-smart-rebuild-panel is the main product surface
green-smart-panel remains legacy reference/runtime only
```

Home Assistant sidebar policy:

```text
Green Smart -> /green_smart -> green-smart-rebuild-panel
Green Smart Legacy -> /green_smart_legacy -> green-smart-panel
```

`Green Smart Legacy` and `green_smart_legacy` exist only so old behavior can be inspected as reference. New work must start in the rebuild panel.

## Compatibility policy

The old integration may remain available for operational stability until cutover, but it is a legacy runtime. New rebuild work should be developed separately until an explicit cutover gate is approved.

No production cutover should happen merely because a legacy reference or scaffold contract passes.
