export function cropBasicAddZones(panel) {
  const cfg = panel._normalizedForm();
  const zoneCount = cfg.greenhouse_zones || 1;
  const zones = Array.from({ length: zoneCount }, (_, i) => ({ id: i + 1, label: `${i + 1}구역` }));
  zones.forEach((z) => { if (panel._basicZoneCollapsed[z.id] === undefined) panel._basicZoneCollapsed[z.id] = false; });
  return zones;
}

export function renderCropBasicAddModal(panel, zones) {
  // Contract markers preserved from panel shell: data-basic-crop-type data-basic-variety data-basic-method
  // data-basic-same-as-prev data-basic-zone-toggle data-basic-zone-body selectedZones.map zoneId: zone.id
  return `
      <div class="popup-card" style="width:min(720px,94vw);">
        <div class="pop-header">
          <div class="pop-icon-box"><ha-icon icon="mdi:sprout" style="--mdi-icon-size:22px;"></ha-icon></div>
          <div><div class="pop-title-main">정식 등록</div><div class="pop-title-sub">구역별 작물 정보와 정식 정보를 동시에 등록합니다</div></div>
        </div>
        <div class="pop-fields">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div style="font-size:11px;font-weight:700;color:#51AE60;letter-spacing:.4px;">구역별 정식 정보</div>
            <div style="font-size:11px;color:#7a9780;">저장할 구역을 체크하세요</div>
          </div>
          ${zones.map((zone, idx) => panel._renderBasicZoneFields(zone, idx)).join("")}
        </div>
        <div class="pop-foot"><button class="crop-pop-cancel pop-btn-cancel">취소</button><button id="b-save" class="pop-btn-save">선택 구역 정식 등록</button></div>
      </div>`;
}

export function cropBasicEditValues(panel, season) {
  return {
    enabled: true,
    cropType: season.cropType || "tomato",
    variety: season.variety || "",
    method: season.method || "hydro",
    plantDate: season.plantDate || new Date().toISOString().slice(0, 10),
    totalPlants: season.totalPlants,
    rowSpacing: season.rowSpacing,
    plantSpacing: season.plantSpacing,
    plantDensity: season.plantDensity,
    trainDir: season.trainDir || "v",
  };
}

export function renderCropBasicEditModal(panel, season, zone, values) {
  return `
      <div class="popup-card" style="width:min(650px,94vw);">
        <div class="pop-header">
          <div class="pop-icon-box"><ha-icon icon="mdi:pencil" style="--mdi-icon-size:22px;"></ha-icon></div>
          <div><div class="pop-title-main">작기 수정</div><div class="pop-title-sub">${panel._esc(panel._seasonZoneLabel(season))} 작기 정보를 수정합니다</div></div>
        </div>
        <div class="pop-fields">${panel._renderBasicZoneFields(zone, 0, values)}</div>
        <div class="pop-foot"><button class="crop-pop-cancel pop-btn-cancel">취소</button><button id="b-edit-save" class="pop-btn-save">수정 저장</button></div>
      </div>`;
}
