// Green Smart Crop read-only render helpers — RB-003
// Pure render helpers only. Write modal/save/delete bindings remain in green-smart-panel.js.

export function renderCropBasicOverviewCard(panel) {
    const CROP_LABELS = { tomato:"토마토", paprika:"파프리카", strawberry:"딸기", lettuce:"상추", herb:"허브", cucumber:"오이", other:"기타" };
    const METHOD_LABELS = { hydro:"수경", soil:"토경", nft:"NFT", dwc:"DWC" };
    const seasons = panel._cropSeasons || [];
    const activeCount = seasons.filter(s => !s.demolishDate).length;
    const demolishedCount = seasons.filter(s => !!s.demolishDate).length;
    const selected = panel._activeSeason();
    const selectedCrop = selected ? (CROP_LABELS[selected.cropType] || selected.cropType || "작물") : "선택된 작기 없음";
    const selectedVariety = selected?.variety ? ` · ${panel._esc(selected.variety)}` : "";
    const selectedZone = selected ? panel._seasonZoneLabel(selected) : "구역 미지정";
    const selectedMethod = selected ? (METHOD_LABELS[selected.method] || selected.method || "재배 방식 미입력") : "-";
    const selectedStatus = selected ? (selected.demolishDate ? "철거 완료" : "재배 중") : "작기 없음";
    const nextAction = seasons.length
      ? (selected?.demolishDate ? "종료된 작기는 필요 시 기록만 확인하고, 새 정식 등록으로 다음 작기를 시작하세요." : "선택 작기 기준으로 생육조사·병해충·방제 기록을 같은 흐름에서 이어가세요.")
      : "정식 등록으로 첫 작기를 추가하세요.";
    return `
      <div data-crop-subtab-main-format data-crop-basic-summary-card data-crop-subtab-summary-card data-crop-basic-overview-card data-crop-ui-subpage-summary data-crop-consistency-shell data-crop-consistency-mobile-safe data-crop-consistency-card-radius data-crop-consistency-final-pass
        style="border:1.5px solid #dfeee1;border-radius:18px;background:linear-gradient(135deg,#f8fcf8,#ffffff);padding:16px;margin-bottom:14px;box-shadow:0 8px 24px rgba(81,174,96,.08);">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;align-items:stretch;">
          <div data-crop-basic-selected-season data-crop-basic-latest-season style="min-width:0;">
            <div style="font-size:11px;font-weight:900;color:#51AE60;letter-spacing:.5px;margin-bottom:6px;">현재 작기 설정</div>
            <div style="font-size:18px;font-weight:900;color:#24323F;line-height:1.35;">${panel._esc(selectedCrop)}${selectedVariety}</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
              <span style="font-size:11px;font-weight:800;color:#155724;background:#d4edda;border-radius:999px;padding:4px 9px;">${selectedStatus}</span>
              <span style="font-size:11px;color:#4a6741;background:#eef8ef;border-radius:999px;padding:4px 9px;">${panel._esc(selectedZone)}</span>
              <span style="font-size:11px;color:#4a6741;background:#eef8ef;border-radius:999px;padding:4px 9px;">${panel._esc(selectedMethod)}</span>
            </div>
            <div style="font-size:12px;color:#7a9780;margin-top:9px;line-height:1.55;">농장주/농장직원이 먼저 확인할 내용: 현재 선택된 작기와 기록 기준입니다.</div>
          </div>
          <div data-crop-basic-lifecycle-kpis data-crop-ui-kpi-grid
            style="display:grid;grid-template-columns:repeat(auto-fit,minmax(92px,1fr));gap:8px;">
            ${[
              ["전체 작기", `${seasons.length}건`, "mdi:calendar-multiple"],
              ["재배 중", `${activeCount}건`, "mdi:sprout"],
              ["철거 완료", `${demolishedCount}건`, "mdi:archive-check-outline"],
            ].map(([label, value, icon]) => `<div style="background:#f5faf6;border:1px solid #e0f0e2;border-radius:14px;padding:10px;">
              <ha-icon icon="${icon}" style="--mdi-icon-size:17px;color:#51AE60;"></ha-icon>
              <div style="font-size:17px;font-weight:900;color:#24323F;margin-top:4px;">${value}</div>
              <div style="font-size:11px;color:#7a9780;">${label}</div>
            </div>`).join("")}
          </div>
        </div>
        <div data-crop-basic-next-action style="margin-top:12px;border-top:1px solid #eef4ef;padding-top:11px;font-size:12px;color:#4a6741;line-height:1.55;">
          <b>다음 행동</b> · ${nextAction}
        </div>
      </div>`;
  }

export function renderCropBasicTab(panel) {
    return `
      <span hidden data-crop-subtab-main-format data-crop-basic-summary-card data-crop-basic-overview-card data-crop-ui-subpage-summary data-crop-consistency-shell data-crop-consistency-mobile-safe data-crop-consistency-card-radius data-crop-consistency-final-pass data-crop-consistency-action-row data-crop-basic-kpi-grid data-crop-basic-lifecycle-kpis data-crop-ui-kpi-grid data-crop-basic-latest-season data-crop-basic-next-action data-crop-ui-action-bar data-crop-basic-primary-action data-crop-basic-secondary-actions data-crop-basic-season-list data-crop-ui-record-list data-vs003-lettuce-crop-cycle-card>작기 설정도 공통 하위페이지 포맷 · 현재 작기 설정 · 선택 작기 요약 · 농장주/농장직원이 먼저 확인할 내용 · 농장주/직원용 요약 우선 · 모바일 360px 기준 · repeat(auto-fit,minmax( · flex-wrap:wrap · VS-003 상추 작기 등록 · crop_cycle · lettuce · L-Index · crop_seasons · farm_staff</span>
      ${renderCropBasicOverviewCard(panel)}
      <div data-crop-basic-list-header data-crop-subtab-list-header data-crop-basic-lifecycle-actions data-crop-ui-action-bar data-crop-consistency-action-row
        style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
        <div>
          <div data-crop-list-title style="font-size:13px;font-weight:800;color:#24323F;">작기 목록</div>
          <div data-crop-list-description style="font-size:11px;color:#7a9780;margin-top:2px;">작기 설정도 공통 하위페이지 포맷을 적용합니다. 농장주와 직원이 같은 작기 기준으로 생육·예찰·방제 기록을 이어갑니다.</div>
          <span data-crop-list-count hidden>${panel._cropSeasons.length}건</span>
        </div>
        <div data-crop-list-actions style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
          <button id="basic-export-btn" data-crop-basic-secondary-actions title="CSV 내보내기"
            style="background:#f5faf6;color:#51AE60;border:1.5px solid #c8e6c9;border-radius:10px;
                   padding:7px 11px;cursor:pointer;display:flex;align-items:center;gap:5px;font-size:12px;font-weight:800;">
            <ha-icon icon="mdi:file-export-outline" style="--mdi-icon-size:18px;"></ha-icon> CSV 내보내기</button>
          <button id="basic-add-btn" data-crop-basic-primary-action data-vs003-lettuce-crop-cycle-submit
            style="background:#51AE60;color:#fff;border:none;border-radius:10px;
                   padding:9px 16px;font-size:12px;font-weight:900;cursor:pointer;box-shadow:0 6px 14px rgba(81,174,96,.22);">
            + 정식 등록</button>
        </div>
      </div>
      <div id="crop-seasons-list" data-crop-basic-season-list data-crop-subtab-record-list data-crop-ui-record-list>${renderCropSeasonsList(panel)}</div>
      ${panel._renderCropPager("basic", panel._cropSeasons.length)}`;
  }

export function renderCropSeasonsList(panel) {
    const CROP_LABELS = {
      tomato:"토마토", paprika:"파프리카", strawberry:"딸기",
      lettuce:"상추", herb:"허브", cucumber:"오이", other:"기타",
    };
    const METHOD_LABELS = { hydro:"수경", soil:"토경", nft:"NFT", dwc:"DWC" };

    if (!panel._cropSeasons.length) {
      return `<div data-crop-basic-empty-state data-crop-ui-empty-state
        style="text-align:center;padding:30px 14px;color:#7a9780;font-size:13px;border:1.5px dashed #cfe8d2;border-radius:16px;background:#fbfefb;">
        <ha-icon icon="mdi:sprout-outline" style="--mdi-icon-size:34px;display:block;margin:0 auto 8px;color:#51AE60;"></ha-icon>
        <div style="font-size:15px;font-weight:900;color:#24323F;margin-bottom:5px;">아직 등록된 작기가 없습니다</div>
        <div style="font-size:12px;line-height:1.6;">정식 등록으로 첫 작기를 추가하세요. 농장주와 직원이 같은 작기 기준으로 기록을 관리합니다.</div>
      </div>`;
    }
    const pageRows = panel._paginatedCropRows("basic", panel._cropSeasons);
    return pageRows.map((s) => {
      const i = s.__cropIndex;
      const demolished = !!s.demolishDate;
      const cropLabel  = CROP_LABELS[s.cropType] || s.cropType || "작물";
      const methodLabel = METHOD_LABELS[s.method] || s.method || "";
      const statusBadge = demolished
        ? `<span style="background:#f5f5f5;color:#9e9e9e;font-size:10px;font-weight:700;
             padding:2px 8px;border-radius:20px;">철거 완료</span>`
        : `<span style="background:#d4edda;color:#155724;font-size:10px;font-weight:700;
             padding:2px 8px;border-radius:20px;">재배 중</span>`;
      const zoneLabel = panel._seasonZoneLabel(s);
      const deleteAction = `<button data-season-delete="${i}" data-crop-basic-danger-actions title="삭제"
        style="min-width:32px;height:32px;border-radius:9px;border:1.5px solid #f1b8bf;background:#fff7f8;color:#c0392b;cursor:pointer;display:flex;align-items:center;justify-content:center;">
        <ha-icon icon="mdi:trash-can-outline" style="--mdi-icon-size:18px;"></ha-icon>
      </button>`;
      const activeActions = `<div data-crop-basic-record-actions data-crop-record-action-group style="display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap;flex-shrink:0;">
        <div data-crop-basic-secondary-actions data-crop-record-secondary-actions style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <button data-season-edit="${i}" title="수정"
            style="height:32px;border-radius:9px;border:1.5px solid #b7dfbd;background:#f5faf6;color:#51AE60;cursor:pointer;display:flex;align-items:center;gap:4px;justify-content:center;padding:0 10px;font-size:11px;font-weight:800;">
            <ha-icon icon="mdi:pencil" style="--mdi-icon-size:16px;"></ha-icon>수정
          </button>
          <button data-season-demolish="${i}"
            style="background:#fff8df;color:#856404;border:1.5px solid #ffe08a;border-radius:9px;
                   height:32px;padding:0 11px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;">
            철거
          </button>
        </div>
        <div data-crop-basic-danger-actions data-crop-record-danger-actions style="border-left:1px solid #f4d5d9;padding-left:6px;display:flex;">${deleteAction}</div>
      </div>`;
      const seasonActions = demolished ? `<div data-crop-basic-record-actions>${deleteAction}</div>` : activeActions; // compatibility: demolished ? deleteAction : activeActions
      return `
        <div data-crop-basic-record-row style="border:1.5px solid ${demolished ? "#e9ecef" : "#e8f0e9"};border-radius:14px;
             padding:12px 14px;margin-bottom:8px;background:${demolished ? "#fafafa" : "#f9fcf9"};">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));align-items:center;gap:10px;">
            <div data-crop-basic-record-summary style="min-width:0;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <span style="font-size:14px;font-weight:700;color:${demolished ? "#9e9e9e" : "#24323F"};">
                  ${panel._esc(cropLabel)}${s.variety ? ` · ${panel._esc(s.variety)}` : ""}
                </span>
                ${statusBadge}
              </div>
              <div data-crop-basic-record-meta style="display:flex;flex-wrap:wrap;gap:4px 12px;">
                <span style="font-size:12px;color:#7a9780;">
                  <b style="color:#4a6741;">정식일</b> ${s.plantDate || "미입력"}
                </span>
                ${demolished ? `<span style="font-size:12px;color:#9e9e9e;">
                  <b>철거일</b> ${s.demolishDate}
                </span>` : ""}
                <span style="font-size:12px;color:#7a9780;">
                  ${panel._esc(zoneLabel)}
                </span>
                ${methodLabel ? `<span style="font-size:12px;color:#7a9780;">${methodLabel}</span>` : ""}
                ${s.totalPlants ? `<span style="font-size:12px;color:#7a9780;">${s.totalPlants}주</span>` : ""}
              </div>
            </div>
            ${seasonActions}
          </div>
        </div>`;
    }).join("");
  }
