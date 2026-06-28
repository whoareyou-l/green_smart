export function growthModalContext(panel, editIndex = null) {
  const isEdit = Number.isInteger(editIndex);
  const editRecord = isEdit ? (panel._growthData[editIndex] || null) : null;
  const today = new Date().toISOString().slice(0, 10);
  const activeSeason = panel._activeSeason();
  const config = panel._growthFieldConfigForCrop(activeSeason?.cropType || editRecord?.cropType);
  const cropName = activeSeason?.variety ? `${config.title} · ${panel._esc(activeSeason.variety)}` : config.title;
  const editMetrics = editRecord ? panel._parseGrowthMetrics(editRecord) : [];
  const editMetricValue = (key) => {
    const found = editMetrics.find((m) => m && m.key === key);
    if (found && found.value !== null && found.value !== undefined) return panel._esc(String(found.value));
    const legacy = panel._growthLegacyPayloadFromMetrics([], editRecord?.cropType || activeSeason?.cropType);
    return panel._esc(String((editRecord && editRecord[key] !== undefined ? editRecord[key] : legacy[key]) || ""));
  };
  const qualityDisorderFields = config.qualityDisorderFields || [];
  return { isEdit, editRecord, today, activeSeason, config, cropName, editMetricValue, qualityDisorderFields };
}

export function renderGrowthMetricFields(panel, config, editMetricValue) {
  return config.fields.map(([key, label, placeholder, min, max, step], idx) => `
      <div class="pop-field" data-growth-field="${key}">
        <label>${label}</label>
        <input type="number" id="g-${key}" value="${editMetricValue(key)}" placeholder="${placeholder}" min="${min}" max="${max}" step="${step}">
      </div>${idx % 2 === 1 ? "" : ""}
    `).reduce((html, field, idx, arr) => {
      if (idx % 2 === 0) return html + `<div class="pop-field-row">${field}${arr[idx + 1] || ""}</div>`;
      return html;
    }, "");
}

export function renderGrowthQualityDisorderFields(panel, qualityDisorderFields, editMetricValue) {
  return qualityDisorderFields.length ? `
      <div data-growth-quality-disorder-section style="border:1px solid #efe7ff;background:#faf7ff;border-radius:12px;padding:10px;margin:4px 0 2px;">
        <div style="font-size:12px;font-weight:900;color:#4a356d;margin-bottom:7px;">품질/생리장해 입력</div>
        ${qualityDisorderFields.map(([key, label, placeholder, min, max, step], idx) => `
          <div class="pop-field" data-growth-quality-disorder-field="${key}">
            <label>${label}</label>
            <input type="number" id="g-${key}" value="${editMetricValue(key)}" placeholder="${placeholder}" min="${min}" max="${max}" step="${step}">
          </div>${idx % 2 === 1 ? "" : ""}
        `).reduce((html, field, idx, arr) => {
          if (idx % 2 === 0) return html + `<div class="pop-field-row">${field}${arr[idx + 1] || ""}</div>`;
          return html;
        }, "")}
      </div>` : "";
}

export function renderGrowthSurveyModal(panel, context) {
  const { isEdit, editRecord, today, config, cropName, editMetricValue, qualityDisorderFields } = context;
  const fieldHtml = renderGrowthMetricFields(panel, config, editMetricValue);
  const qualityDisorderHtml = renderGrowthQualityDisorderFields(panel, qualityDisorderFields, editMetricValue);
  return `
      <div class="popup-card">
        <div class="pop-header">
          <div class="pop-icon-box"><ha-icon icon="mdi:chart-line" style="--mdi-icon-size:22px;"></ha-icon></div>
          <div>
            <div class="pop-title-main">${isEdit ? "생육조사 수정" : cropName}</div>
            <div class="pop-title-sub">${panel._esc(config.desc)}</div>
          </div>
        </div>
        <div class="pop-fields">
          <div class="pop-field">
            <label>조사일</label>
            <input type="date" id="g-date" value="${panel._esc(editRecord?.date || today)}">
          </div>
          ${fieldHtml}
          ${qualityDisorderHtml}
          <div class="pop-field">
            <label>비고</label>
            <textarea id="g-note" rows="2" placeholder="특이사항">${panel._esc(editRecord?.note || "")}</textarea>
          </div>
        </div>
        <div class="pop-foot">
          <button class="crop-pop-cancel pop-btn-cancel">취소</button>
          <button id="g-save" class="pop-btn-save">저장</button>
        </div>
      </div>`;
}
