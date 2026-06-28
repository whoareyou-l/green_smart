// RS-012 currentCrop/crop_cycle adapter
// Product-facing DTO names are crop_cycle/currentCrop; legacy fixture aliases stay inside compatibilityAliases.

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "") ?? null;
}

export function normalizeCurrentCrop(currentCrop = {}) {
  const cropCycleId = firstPresent(
    currentCrop.crop_cycle_id,
    currentCrop.cropCycleId,
    currentCrop.cropSeasonId,
    currentCrop.season_id,
  );
  const cropType = firstPresent(currentCrop.crop_type, currentCrop.cropType);
  const cropLabelKo = firstPresent(currentCrop.crop_label_ko, currentCrop.cropLabelKo, "미등록");
  const growthStage = firstPresent(currentCrop.growth_stage, currentCrop.growthStage, "작기 정보 없음");
  return {
    crop_cycle_id: cropCycleId,
    crop_type: cropType,
    crop_label_ko: cropLabelKo,
    growth_stage: growthStage,
    currentCrop: true,
  };
}

export function normalizeRebuildZoneContext(zone = {}) {
  const currentCrop = normalizeCurrentCrop(zone.currentCrop || zone.current_crop || {});
  const compatibilityAliases = {
    cropSeasonId: firstPresent(zone.currentCrop?.cropSeasonId, zone.current_crop?.cropSeasonId, zone.cropSeasonId),
    season_id: firstPresent(zone.currentCrop?.season_id, zone.current_crop?.season_id, zone.season_id),
  };
  return {
    ...zone,
    currentCrop,
    activeCropCycleId: currentCrop.crop_cycle_id,
    crop_cycle: currentCrop.crop_cycle_id,
    crop: currentCrop.crop_label_ko || "미등록",
    state: currentCrop.growth_stage || "작기 정보 없음",
    equipment: zone.equipmentProfile?.labels || zone.equipment || [],
    dataStatus: zone.dataAvailability || zone.dataStatus || { state: "empty", freshnessMinutes: null, note: "구역 데이터가 없습니다." },
    compatibilityAliases,
  };
}

export function normalizeRebuildHomeContext(context = {}) {
  const zones = Array.isArray(context.zones) ? context.zones : [];
  return {
    contextSource: context.contextSource || "static-fixture-before-api",
    greenhouseId: context.greenhouseId || "greenhouse-main",
    greenhouseName: context.greenhouseName || "대표 온실",
    generatedAt: context.generatedAt || new Date(0).toISOString(),
    zones: zones.map((zone) => normalizeRebuildZoneContext(zone)),
  };
}

export function getRebuildHomeContext(sourceContext) {
  return normalizeRebuildHomeContext(sourceContext);
}
