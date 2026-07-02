# R7-050 Records Workflow Delete Old Card Content Corrective Plan

> **For Hermes:** The user's instruction was not only to add product actions. The old content-card UI must be used as documentation/reference, then removed from the visible `기록·작업` rendering path. Rebuild the visible layout from the new product judgment structure only.

**Target version:** v1.14.26
**Scope:** `작물 운영 > 기록·작업` subtab only
**Corrective reason:** R7-049 still left the new product layout inside the old Crop Operations `product-card-grid` wrapper and retained old R7-048 record-card compatibility markers in the visible records workflow. That violates the user instruction to reference the previous content, delete it, and rewrite the structure.

---

## 1. Required correction

For `records-workflow` only:

```text
Do not render the old direct-card grid wrapper.
Do not render old R7-048 record-card-kind compatibility markers.
Do not render the old value-card vertical slice marker as the primary visible structure.
Render only the new product-layout structure.
```

The visible records workflow must start from:

```text
data-r7-records-workflow-product-layout="write-history-review"
```

It must not be nested inside the records-workflow direct-card wrapper:

```text
data-r7-crop-product-direct-cards="records-workflow"
```

`data-r7-crop-product-card-grid` may still appear elsewhere because inactive sibling subtabs keep the shared direct-card grid. It must not be the records-workflow entry structure.

And it must not expose old content-card markers in visible records workflow:

```text
data-r7-crop-record-card-kind="today-work"
data-r7-crop-record-card-kind="growth-survey"
data-r7-crop-record-card-kind="pest-scouting"
data-r7-crop-record-card-kind="control-treatment"
data-r7-crop-record-card-kind="missing-attention"
data-r7-crop-record-card-kind="record-source"
data-r7-crop-record-workflow-vertical-slice="true"
data-r7-crop-record-workflow-layout="priority-records-source"
```

Those old marker/contracts are now historical reference only. Product-level R7-049 markers stay.

---

## 2. What remains

The following remain required:

```text
data-r7-records-workflow-product-layout="write-history-review"
data-r7-record-action-queue
data-r7-record-section="growth-survey"
data-r7-record-section="pest-scouting"
data-r7-record-section="control-treatment"
data-r7-record-section="missing-attention"
data-r7-record-section="record-source"
data-r7-record-write-target="growth-survey"
data-r7-record-history-target="growth-survey"
data-r7-record-edit-target="growth-survey-latest"
data-r7-record-write-target="pest-scouting"
data-r7-record-history-target="pest-scouting"
data-r7-record-link-target="control-treatment"
data-r7-record-write-target="control-treatment"
data-r7-record-history-target="control-treatment"
data-r7-record-check-target="pls"
data-r7-record-boundary="record-only-no-execution"
data-r7-record-source-detail="admin"
```

---

## 3. Implementation target

Change `renderR7CropProductCardsForSubtab(tabKey, ctx)` so that:

```js
if (tabKey === "records-workflow") {
  return this.renderR7RecordsWorkflowProductLayout(ctx);
}
```

That prevents the new layout from being wrapped inside `renderR7CropProductCardGrid()`.

Then remove old visible compatibility markers from `renderR7RecordsWorkflowProductLayout()`.

Do not redesign other subtabs.

---

## 4. Test requirements

Create:

```text
tests/test_r7_050_records_workflow_old_content_deleted_contract.py
```

Must verify:

1. Version surfaces are `1.14.26`.
2. This corrective plan exists and states old cards are reference-only then removed.
3. Rendered `records-workflow` contains product-layout markers and action affordances.
4. Rendered `records-workflow` does **not** contain:
   - `data-r7-crop-product-direct-cards="records-workflow"`
   - `data-r7-crop-product-card-grid`
   - old `data-r7-crop-record-card-kind="..."` markers
   - old `data-r7-crop-record-workflow-vertical-slice="true"`
   - old `data-r7-crop-record-workflow-layout="priority-records-source"`
5. Other subtabs still use direct-card grid where appropriate.
6. No execution/HA/MQTT/device markers appear.

---

## 5. Definition of done

The `기록·작업` visible UI is no longer an old content-card wrapper with new buttons inside it. It is a fresh product workflow layout, while old content remains only in docs/tests history as reference.
