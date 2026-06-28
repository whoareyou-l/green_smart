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
  const variety = firstPresent(currentCrop.variety, currentCrop.crop_variety, currentCrop.cropVariety, "품종 미등록");
  const plantDate = firstPresent(currentCrop.plant_date, currentCrop.plantDate, currentCrop.started_at, "정식일 미등록");
  const demolishDate = firstPresent(currentCrop.demolish_date, currentCrop.demolishDate, null);
  return {
    crop_cycle_id: cropCycleId,
    crop_type: cropType,
    crop_label_ko: cropLabelKo,
    growth_stage: growthStage,
    variety,
    plant_date: plantDate,
    demolish_date: demolishDate,
    currentCrop: true,
  };
}

export function normalizeCurrentCropAssignment(zone = {}, currentCrop = normalizeCurrentCrop(zone.currentCrop || zone.current_crop || {})) {
  const assignment = zone.currentCropAssignment || zone.current_crop_assignment || {};
  const equipmentProfile = assignment.equipmentProfile || zone.equipmentProfile || { labels: zone.equipment || [] };
  const dataAvailability = assignment.dataAvailability || zone.dataAvailability || zone.dataStatus || { state: currentCrop.crop_cycle_id ? "ok" : "empty", source: "adapter_fallback", updatedAt: null };
  return {
    assignmentState: assignment.assignmentState || (currentCrop.crop_cycle_id ? "assigned" : "unassigned"),
    zone_id: firstPresent(assignment.zone_id, zone.zone_id, zone.zoneId),
    sourceRowId: firstPresent(assignment.sourceRowId, assignment.source_row_id, currentCrop.crop_cycle_id),
    currentCrop,
    equipmentProfile,
    dataAvailability,
    readOnly: true,
    executionEnabled: false,
  };
}

export function normalizeGrowthTargetProjection(zone = {}, currentCropAssignment = normalizeCurrentCropAssignment(zone)) {
  const projection = zone.growthTargetProjection || zone.growth_target_projection || {};
  const currentCrop = currentCropAssignment.currentCrop || normalizeCurrentCrop(zone.currentCrop || zone.current_crop || {});
  const targetBasis = projection.targetBasis || {
    crop_cycle_id: currentCrop.crop_cycle_id,
    crop_type: currentCrop.crop_type,
    growth_stage: currentCrop.growth_stage,
  };
  return {
    projectionState: projection.projectionState || (currentCrop.crop_cycle_id ? "ready" : "empty"),
    targetStageLabel: projection.targetStageLabel || currentCrop.growth_stage || "작기 정보 없음",
    targetFocus: projection.targetFocus || "생육 균형 유지",
    targetBasis,
    sourceAssignment: projection.sourceAssignment || currentCropAssignment,
    readOnly: true,
    executionEnabled: false,
  };
}

function freshnessLabel(dataAvailability = {}) {
  return Number.isFinite(dataAvailability.freshnessMinutes) ? `${dataAvailability.freshnessMinutes}분 전 갱신` : "갱신 시각 없음";
}

export function normalizeEnvironmentImpactProjection(zone = {}, currentCropAssignment = normalizeCurrentCropAssignment(zone)) {
  const projection = zone.environmentImpactProjection || zone.environment_impact_projection || {};
  const equipmentProfile = projection.equipmentProfile || currentCropAssignment.equipmentProfile || zone.equipmentProfile || { labels: zone.equipment || [] };
  const dataAvailability = projection.dataAvailability || currentCropAssignment.dataAvailability || zone.dataAvailability || zone.dataStatus || {};
  const impactFactors = projection.impactFactors || equipmentProfile.labels || [];
  return {
    impactState: projection.impactState || (currentCropAssignment.currentCrop?.crop_cycle_id ? "ready" : "empty"),
    impactFocus: projection.impactFocus || "구역 장비와 데이터 신선도 기준 영향 확인",
    impactFactors,
    freshnessLabel: projection.freshnessLabel || freshnessLabel(dataAvailability),
    sourceAssignment: projection.sourceAssignment || currentCropAssignment,
    dataAvailability,
    readOnly: true,
    executionEnabled: false,
  };
}

export function normalizeRecommendationReviewProjection(
  zone = {},
  currentCropAssignment = normalizeCurrentCropAssignment(zone),
  growthTargetProjection = normalizeGrowthTargetProjection(zone, currentCropAssignment),
  environmentImpactProjection = normalizeEnvironmentImpactProjection(zone, currentCropAssignment),
) {
  const projection = zone.recommendationReviewProjection || zone.recommendation_review_projection || {};
  return {
    reviewState: projection.reviewState || (currentCropAssignment.currentCrop?.crop_cycle_id ? "ready" : "empty"),
    reviewSummary: projection.reviewSummary || "추천 검토 대기: 생육목표와 환경 영향 projection 확인 필요",
    reviewInputs: projection.reviewInputs || {
      assignment: currentCropAssignment,
      growthTargetProjection,
      environmentImpactProjection,
    },
    approvalRequired: projection.approvalRequired ?? Boolean(currentCropAssignment.currentCrop?.crop_cycle_id),
    readOnly: true,
    executionEnabled: false,
  };
}

export function normalizeOperatorApprovalScaffold(zone = {}, recommendationReviewProjection = normalizeRecommendationReviewProjection(zone)) {
  const scaffold = zone.operatorApprovalScaffold || zone.operator_approval_scaffold || {};
  return {
    approvalState: scaffold.approvalState || (recommendationReviewProjection.approvalRequired ? "required" : "not_required"),
    approvalRequired: scaffold.approvalRequired ?? Boolean(recommendationReviewProjection.approvalRequired),
    disabledReason: scaffold.disabledReason || "작업자 승인과 안전/인터록 사전검증 전에는 실행할 수 없습니다.",
    executionBlocked: scaffold.executionBlocked ?? true,
    sourceRecommendationReview: scaffold.sourceRecommendationReview || recommendationReviewProjection,
    readOnly: true,
    executionEnabled: false,
  };
}

export function normalizeSafetyInterlockPreflightProjection(zone = {}, operatorApprovalScaffold = normalizeOperatorApprovalScaffold(zone)) {
  const projection = zone.safetyInterlockPreflightProjection || zone.safety_interlock_preflight_projection || {};
  return {
    preflightState: projection.preflightState || (operatorApprovalScaffold.executionBlocked ? "blocked_until_review" : "pending"),
    safetyState: projection.safetyState || "pending",
    interlockState: projection.interlockState || "pending",
    failSafeState: projection.failSafeState || "standby",
    blockedReasons: projection.blockedReasons || ["operator_approval_required"],
    requiredChecks: projection.requiredChecks || ["작업자 승인", "Safety 검증", "Interlock 검증", "Fail Safe 확인"],
    sourceOperatorApproval: projection.sourceOperatorApproval || operatorApprovalScaffold,
    readOnly: true,
    executionEnabled: false,
  };
}

export function normalizeVirtualExecutionRehearsalScaffold(zone = {}, safetyInterlockPreflightProjection = normalizeSafetyInterlockPreflightProjection(zone)) {
  const scaffold = zone.virtualExecutionRehearsalScaffold || zone.virtual_execution_rehearsal_scaffold || {};
  return {
    rehearsalState: scaffold.rehearsalState || "blocked_until_virtual_rehearsal",
    scenarioSet: scaffold.scenarioSet || ["normal", "strong_wind", "rain", "low_temperature", "sensor_fault", "blocked", "fail_safe", "recovery"],
    currentScenario: scaffold.currentScenario || "blocked",
    readinessSummary: scaffold.readinessSummary || "가상 실행 리허설 전: Safety/Interlock/Fail Safe 사전검증 필요",
    sourcePreflight: scaffold.sourcePreflight || safetyInterlockPreflightProjection,
    readOnly: true,
    executionEnabled: false,
    deviceCommandEnabled: false,
    mqttEnabled: false,
  };
}

export function normalizeRehearsalResultReviewProjection(zone = {}, virtualExecutionRehearsalScaffold = normalizeVirtualExecutionRehearsalScaffold(zone)) {
  const review = zone.rehearsalResultReviewProjection || zone.rehearsal_result_review_projection || {};
  const scenarios = virtualExecutionRehearsalScaffold.scenarioSet || ["normal", "strong_wind", "rain", "low_temperature", "sensor_fault", "blocked", "fail_safe", "recovery"];
  return {
    reviewState: review.reviewState || "pending_virtual_results",
    resultSummary: review.resultSummary || "가상 리허설 결과 검토 대기: 실제 실행 없이 시나리오별 결과를 확인합니다.",
    scenarioResults: review.scenarioResults || scenarios.map((scenario) => ({ scenario, resultState: "not_run" })),
    sourceRehearsal: review.sourceRehearsal || virtualExecutionRehearsalScaffold,
    readOnly: true,
    executionEnabled: false,
    approvalReleaseEnabled: false,
    deviceCommandEnabled: false,
    mqttEnabled: false,
  };
}

export function normalizeVirtualRunnerInputContract(zone = {}, rehearsalResultReviewProjection = normalizeRehearsalResultReviewProjection(zone)) {
  const contract = zone.virtualRunnerInputContract || zone.virtual_runner_input_contract || {};
  return {
    inputState: contract.inputState || "contract_ready_not_executable",
    runnerMode: contract.runnerMode || "read_only_contract",
    inputScenarios: contract.inputScenarios || rehearsalResultReviewProjection.scenarioResults || [],
    sourceReview: contract.sourceReview || rehearsalResultReviewProjection,
    executionCandidate: false,
    readOnly: true,
    executionEnabled: false,
    runnerExecutionEnabled: false,
    approvalReleaseEnabled: false,
    deviceCommandEnabled: false,
    mqttEnabled: false,
  };
}

export function normalizeRebuildZoneContext(zone = {}) {
  const currentCrop = normalizeCurrentCrop(zone.currentCrop || zone.current_crop || {});
  const currentCropAssignment = normalizeCurrentCropAssignment(zone, currentCrop);
  const growthTargetProjection = normalizeGrowthTargetProjection(zone, currentCropAssignment);
  const environmentImpactProjection = normalizeEnvironmentImpactProjection(zone, currentCropAssignment);
  const recommendationReviewProjection = normalizeRecommendationReviewProjection(zone, currentCropAssignment, growthTargetProjection, environmentImpactProjection);
  const operatorApprovalScaffold = normalizeOperatorApprovalScaffold(zone, recommendationReviewProjection);
  const safetyInterlockPreflightProjection = normalizeSafetyInterlockPreflightProjection(zone, operatorApprovalScaffold);
  const virtualExecutionRehearsalScaffold = normalizeVirtualExecutionRehearsalScaffold(zone, safetyInterlockPreflightProjection);
  const rehearsalResultReviewProjection = normalizeRehearsalResultReviewProjection(zone, virtualExecutionRehearsalScaffold);
  const virtualRunnerInputContract = normalizeVirtualRunnerInputContract(zone, rehearsalResultReviewProjection);
  const compatibilityAliases = {
    cropSeasonId: firstPresent(zone.currentCrop?.cropSeasonId, zone.current_crop?.cropSeasonId, zone.cropSeasonId),
    season_id: firstPresent(zone.currentCrop?.season_id, zone.current_crop?.season_id, zone.season_id),
  };
  return {
    ...zone,
    currentCrop,
    activeCropCycleId: currentCrop.crop_cycle_id,
    crop_cycle: currentCrop.crop_cycle_id,
    currentCropAssignment,
    growthTargetProjection,
    environmentImpactProjection,
    recommendationReviewProjection,
    operatorApprovalScaffold,
    safetyInterlockPreflightProjection,
    virtualExecutionRehearsalScaffold,
    rehearsalResultReviewProjection,
    virtualRunnerInputContract,
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
