export function controlModalContext(panel, editIndex = null) {
  const isEdit = Number.isInteger(editIndex);
  const editRecord = isEdit ? (panel._controlData[editIndex] || null) : null;
  const today = new Date().toISOString().slice(0, 10);
  const MAX_PESTS = 5;
  const currentSeasonLabel = panel._activeSeasonLabel();
  const entries = Array.isArray(editRecord?.pesticides) && editRecord.pesticides.length
    ? editRecord.pesticides.map(p => ({ name: p.name || "", regNo: p.regNo || "", moa: p.moa || "", dil: p.dil || "", amount: p.amount || "", chemicalAmount: p.chemicalAmount || "", waterAmount: p.waterAmount || "", treatmentAreaM2: p.treatmentAreaM2 || editRecord.area || "", perPyeongUsage: p.perPyeongUsage || "", pls: p.pls ?? null, mixWarning: p.mixWarning || "", plsWarning: p.plsWarning || "" }))
    : [{ name: "", regNo: "", moa: "", dil: "", amount: "", chemicalAmount: "", waterAmount: "", treatmentAreaM2: "", perPyeongUsage: "", pls: null, mixWarning: "", plsWarning: "" }];
  const historyByName = {};
  (panel._controlData || []).forEach(r => {
    const pests = Array.isArray(r.pesticides) ? r.pesticides : (r.pesticide ? [{ name: r.pesticide }] : []);
    pests.forEach(p => {
      if (!p.name) return;
      if (!historyByName[p.name]) historyByName[p.name] = [];
      historyByName[p.name].push(p);
    });
  });
  const getHistory = (name) => (historyByName[name] || [])[0] || null;
  const getPlsFromHistory = (name) => {
    const h = getHistory(name);
    return h ? h.pls : null;
  };
  return { editIndex, isEdit, editRecord, today, MAX_PESTS, currentSeasonLabel, entries, getHistory, getPlsFromHistory };
}

export function renderControlTreatmentModal(panel, context) {
  const { isEdit, editRecord, today, MAX_PESTS, currentSeasonLabel } = context;
  return `
      <div class="popup-card" data-control-compact-modal style="width:min(560px,94vw);">
        <div class="pop-header">
          <div class="pop-icon-box" style="background:#e8f4fd;color:#2980b9;">
            <ha-icon icon="mdi:spray" style="--mdi-icon-size:22px;"></ha-icon>
          </div>
          <div>
            <div class="pop-title-main">${isEdit ? "방제 기록 수정" : "방제 기록 추가"}</div>
            <div class="pop-title-sub">농약 사용 내역을 약제별로 기록합니다</div>
          </div>
        </div>
        <div class="pop-fields">
          <div class="pop-field" data-control-date-field>
            <label>방제일</label>
            <input type="date" id="c-date" value="${panel._esc(editRecord?.date || today)}">
          </div>
          <div class="pop-field-row" data-control-scope-row>
            <div class="pop-field" data-control-active-season-pill>
              <label>현재 작기</label>
              <div style="background:#f5faf6;border:1px solid #dbeee0;border-radius:10px;padding:9px 11px;font-size:13px;color:#4a6741;font-weight:800;">${panel._esc(currentSeasonLabel)}</div>
            </div>
            <div class="pop-field">
              <label>처리 범위</label>
              <select id="c-location-scope" data-control-location-scope-select>
                <option value="전체" ${String(editRecord?.location || "").includes("부분") ? "" : "selected"}>전체</option>
                <option value="부분" ${String(editRecord?.location || "").includes("부분") ? "selected" : ""}>부분</option>
              </select>
            </div>
          </div>
          <div id="c-pest-list" data-control-pesticide-list></div>
          <button id="c-add-pest" data-control-pesticide-add-row
            style="background:#f5faf6;color:#51AE60;border:1.5px dashed #b2d8b5;border-radius:10px;
                   padding:9px;width:100%;font-size:13px;font-weight:700;cursor:pointer;margin-top:2px;">
            + 약제 추가 (최대 ${MAX_PESTS}개)
          </button>
          <div id="c-mix-summary" style="display:none;margin-top:2px;font-size:11px;color:#856404;"></div>
          <div class="pop-field" data-control-note-compact>
            <label>비고</label>
            <input type="text" id="c-note" placeholder="추가 메모">
          </div>
        </div>
        <div class="pop-foot">
          <button class="crop-pop-cancel pop-btn-cancel">취소</button>
          <button id="c-save" class="pop-btn-save">저장</button>
        </div>
      </div>`;
}

export function renderControlPesticideEntry(panel, e, idx) {
  const plsBadge = e.pls === true
    ? `<span style="background:#d4edda;color:#155724;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;flex-shrink:0;">PLS ✓</span>`
    : e.pls === false
    ? `<span style="background:#f8d7da;color:#721c24;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;flex-shrink:0;">PLS ✗</span>`
    : "";
  return `
          <div data-entry="${idx}" data-control-pesticide-entry
            style="background:#f9fcf9;border:1.5px solid #e8f0e9;border-radius:12px;
                   padding:12px 14px;margin-bottom:10px;position:relative;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <span style="font-size:12px;font-weight:700;color:#51AE60;">약제 ${idx + 1}</span>
              ${idx > 0 ? `<button data-del-entry="${idx}" style="background:none;border:none;color:#c0392b;cursor:pointer;font-size:16px;padding:0 4px;line-height:1;">✕</button>` : ""}
            </div>
            <div class="pop-field" data-control-pesticide-name-field style="position:relative;margin-bottom:10px;">
              <label style="display:flex;align-items:center;gap:6px;">
                약제명 <span style="font-weight:400;color:#7a9780;font-size:11px;">(PSIS 검색)</span>
                ${plsBadge}
              </label>
              <input type="text" data-name-input="${idx}" value="${panel._esc(e.name)}" placeholder="2글자 이상 입력 시 자동완성..." autocomplete="off">
              <div data-pesticide-suggestions="${idx}" style="display:none;position:absolute;left:0;right:0;background:#fff;border:1.5px solid #e8f0e9;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:300;max-height:200px;overflow-y:auto;margin-top:2px;top:100%;"></div>
              <div data-mix-warning="${idx}" style="${e.mixWarning ? "" : "display:none;"}font-size:11px;color:#c0392b;margin-top:6px;line-height:1.4;">${e.mixWarning ? `⚠️ 혼용 경고: ${panel._esc(e.mixWarning)}` : ""}</div>
            </div>
            <div class="pop-field-row" style="margin-bottom:10px;">
              <div class="pop-field">
                <label>사용기작</label>
                <input type="text" data-moa-input="${idx}" value="${panel._esc(e.moa)}" placeholder="예) 살균제-가1">
                <div data-pls-warning="${idx}" style="${e.plsWarning ? "" : "display:none;"}font-size:11px;color:#c0392b;margin-top:5px;line-height:1.4;">${e.plsWarning ? `⚠️ PLS 경고: ${panel._esc(e.plsWarning)}` : ""}</div>
              </div>
              <div class="pop-field">
                <label>희석 배수 (배)</label>
                <input type="number" data-dil-input="${idx}" value="${e.dil}" placeholder="예) 1000" min="10" max="10000" step="10">
              </div>
            </div>
            <div data-control-dose-grid data-control-usage-row class="pop-field-row" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:10px;">
              <div class="pop-field">
                <label>약제 사용량</label>
                <input type="number" data-chemical-amount-input="${idx}" value="${panel._esc(e.chemicalAmount)}" placeholder="예) 0.5" min="0" step="0.01">
              </div>
              <div class="pop-field">
                <label>물 사용량</label>
                <input type="number" data-water-amount-input="${idx}" value="${panel._esc(e.waterAmount)}" placeholder="예) 500" min="0" step="0.1">
              </div>
            </div>
            <div class="pop-field-row">
              <div class="pop-field">
                <label>사용 면적(㎡)</label>
                <input type="number" data-treatment-area-input="${idx}" value="${panel._esc(e.treatmentAreaM2)}" placeholder="작기+처리범위로 자동" min="0" step="0.1">
              </div>
              <div class="pop-field">
                <label>평당 사용량</label>
                <input type="text" data-pyeong-amount-output="${idx}" value="${panel._esc(e.perPyeongUsage)}" placeholder="평당 사용량 자동 계산" readonly>
              </div>
            </div>
            <div class="pop-field">
              <label>사용량</label>
              <input type="text" data-amount-input="${idx}" value="${panel._esc(e.amount)}" placeholder="약제/물/면적 입력 시 자동 요약">
              <div style="font-size:11px;color:#7a9780;margin-top:5px;">희석 배수 자동 계산 · 평당 사용량 자동 계산 · cropModelNutritionHint 근거로 보존</div>
            </div>
          </div>`;
}
