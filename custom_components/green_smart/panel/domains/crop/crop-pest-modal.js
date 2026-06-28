export function pestModalContext(panel, editIndex = null) {
  const isEdit = Number.isInteger(editIndex);
  const editRecord = isEdit ? (panel._pestData[editIndex] || null) : null;
  const today = new Date().toISOString().slice(0, 10);
  const MAX_PEST_TYPES = 6;
  const currentSeasonLabel = panel._activeSeasonLabel();
  const pestTypes = editRecord?.type
    ? String(editRecord.type).split(",").map(name => ({ name: name.trim(), source: "", severity: String(editRecord.severity || "1") })).filter(p => p.name)
    : [{ name: "", source: "", severity: "1" }];
  return { editIndex, isEdit, editRecord, today, MAX_PEST_TYPES, currentSeasonLabel, pestTypes };
}

export function renderPestTypeRows(panel, pestTypes) {
  return pestTypes.map((item, idx) => `
          <div data-pest-type-entry="${idx}" data-pest-type-severity-row style="position:relative;display:grid;grid-template-columns:minmax(0,1fr) 150px auto;gap:6px;align-items:start;margin-bottom:7px;">
            <div style="position:relative;">
              <input type="text" data-pest-type-input="${idx}" value="${panel._esc(item.name)}" placeholder="예) 잿빛곰팡이, 응애, 총채벌레" autocomplete="off">
              <div data-pest-type-suggestions="${idx}" style="display:none;position:absolute;left:0;right:0;top:100%;background:#fff;border:1.5px solid #e8f0e9;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:320;max-height:180px;overflow-y:auto;margin-top:2px;"></div>
            </div>
            <select data-pest-severity-select="${idx}">
              <option value="1" ${item.severity === "1" ? "selected" : ""}>🟢 낮음</option>
              <option value="2" ${item.severity === "2" ? "selected" : ""}>🟡 보통</option>
              <option value="3" ${item.severity === "3" ? "selected" : ""}>🟠 높음</option>
              <option value="4" ${item.severity === "4" ? "selected" : ""}>🔴 위험</option>
            </select>
            ${idx > 0 ? `<button data-pest-type-del="${idx}" type="button" style="background:none;border:none;color:#c0392b;font-size:17px;cursor:pointer;padding:8px 2px;">✕</button>` : `<span></span>`}
          </div>`).join("");
}

export function renderPestScoutingModal(panel, context) {
  const { isEdit, editRecord, today, currentSeasonLabel, MAX_PEST_TYPES } = context;
  return `
      <div class="popup-card" data-pest-compact-modal>
        <div class="pop-header">
          <div class="pop-icon-box" style="background:#fff3e0;color:#e67e22;">
            <ha-icon icon="mdi:bug" style="--mdi-icon-size:22px;"></ha-icon>
          </div>
          <div>
            <div class="pop-title-main">${isEdit ? "병해충 예찰 수정" : "병해충 예찰 추가"}</div>
            <div class="pop-title-sub">선택된 작기 기준으로 여러 병해충을 기록합니다</div>
          </div>
        </div>
        <div class="pop-fields">
          <div class="pop-field">
            <label>조사일</label>
            <input type="date" id="p-date" value="${panel._esc(editRecord?.date || today)}">
          </div>
          <div class="pop-field-row" data-pest-scope-row>
            <div class="pop-field" data-pest-active-season-pill>
              <label>현재 작기</label>
              <div style="background:#f5faf6;border:1px solid #dbeee0;border-radius:10px;padding:9px 11px;font-size:13px;color:#4a6741;font-weight:800;">${panel._esc(currentSeasonLabel)}</div>
            </div>
            <div class="pop-field">
              <label>발생 범위</label>
              <select id="p-location-scope" data-pest-location-scope-select>
                <option value="전체" ${String(editRecord?.location || "").includes("부분") ? "" : "selected"}>전체</option>
                <option value="부분" ${String(editRecord?.location || "").includes("부분") ? "selected" : ""}>부분</option>
              </select>
            </div>
          </div>
          <div class="pop-field" data-pest-type-severity-list>
            <label>병해충 종류 / 발생 정도 <span style="font-weight:400;color:#7a9780;font-size:11px;">(농약 API 자동완성, 행 단위 추가)</span></label>
            <div id="p-type-list"></div>
            <button id="p-add-type" data-pest-type-add-row type="button" style="background:#fff8f5;color:#e67e22;border:1.5px dashed #f3c79d;border-radius:10px;padding:8px;width:100%;font-size:12px;font-weight:800;cursor:pointer;">+ 병해충/발생 정도 추가 (최대 ${MAX_PEST_TYPES}개)</button>
          </div>
          <div class="pop-field" data-pest-note-compact>
            <label>비고</label>
            <input type="text" id="p-note" value="${panel._esc(editRecord?.note || "")}" placeholder="추가 메모">
          </div>
        </div>
        <div class="pop-foot">
          <button class="crop-pop-cancel pop-btn-cancel">취소</button>
          <button id="p-save" class="pop-btn-save">저장</button>
        </div>
      </div>`;
}
