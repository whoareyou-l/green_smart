"""R6-001 Crop cycle read-only adapter for rebuild crop context.

RS-013 read-only service boundary is preserved as compatibility evidence.
Maps legacy physical crop_seasons rows → product-facing crop_cycle/currentCrop DTO.
Core shape rule: zone parent + currentCrop attached.

This re-baselines the existing RS-013/RS-014 read-only adapter as the first
post-R5 foundation runtime adapter. It remains read-only and execution-disabled.

R6-002 Monitoring read-only adapter attaches monitoringReadOnlyAdapter to each
zone context. dataAvailability + equipmentProfile → monitoringReadOnlyAdapter.

R6-003 Safety/Interlock read-only adapter attaches safetyInterlockReadOnlyAdapter
to each zone context. monitoringReadOnlyAdapter + safetyInterlockPreflightProjection → safetyInterlockReadOnlyAdapter.
"""

from __future__ import annotations

from typing import Any

try:  # package import in Home Assistant runtime
    from ..repositories import rebuild_crop_context_repo
except Exception:  # direct importlib contract tests load this file outside a package
    rebuild_crop_context_repo = None  # type: ignore[assignment]

CROP_LABELS_KO = {
    "tomato": "토마토",
    "strawberry": "딸기",
    "lettuce": "상추",
    "pepper": "고추",
    "cucumber": "오이",
    "mixed": "혼합 작물",
    "other": "기타 작물",
}

R6_001_ADAPTER_NAME = "R6-001 Crop cycle read-only adapter"
R6_001_CONTEXT_SOURCE = "legacy-physical-readonly-adapter"
RS_013_DATA_AVAILABILITY_SOURCE = "legacy_physical_readonly_adapter"
R6_001_BOUNDARY = "legacy physical crop_seasons rows → product-facing crop_cycle/currentCrop DTO"
R6_001_SHAPE_RULE = "zone parent + currentCrop attached"

R6_002_ADAPTER_NAME = "R6-002 Monitoring read-only adapter"
R6_002_BOUNDARY = "dataAvailability + equipmentProfile → monitoringReadOnlyAdapter"
R6_002_CONTEXT_SOURCE = "zone-context-monitoring-readonly-adapter"

R6_003_ADAPTER_NAME = "R6-003 Safety/Interlock read-only adapter"
R6_003_BOUNDARY = "monitoringReadOnlyAdapter + safetyInterlockPreflightProjection → safetyInterlockReadOnlyAdapter"
R6_003_CONTEXT_SOURCE = "zone-context-safety-interlock-readonly-adapter"


def _crop_label_ko(crop_type: str | None) -> str:
    return CROP_LABELS_KO.get(str(crop_type or "other").lower(), "기타 작물")


def _growth_target_focus(crop_type: str | None, growth_stage: str | None) -> str:
    """Return a read-only operator-facing growth target focus label."""
    stage = str(growth_stage or "").strip()
    if "정식" in stage:
        return "활착 안정"
    if "착과" in stage or "비대" in stage:
        return "착과·비대 균형"
    if "개화" in stage:
        return "개화·수분 안정"
    if str(crop_type or "").lower() == "lettuce":
        return "엽채 생장 균일화"
    return "생육 균형 유지"


def _freshness_label(freshness_minutes: Any) -> str:
    if isinstance(freshness_minutes, (int, float)):
        return f"{int(freshness_minutes)}분 전 갱신"
    return "갱신 시각 없음"


def normalize_monitoring_readonly_adapter(
    *,
    zone_id: int | str | None,
    crop_cycle_id: int | str | None,
    data_availability: dict[str, Any] | None,
    equipment_profile: dict[str, Any] | None,
) -> dict[str, Any]:
    """Return the R6-002 monitoring read-only adapter DTO.

    This adapter composes already-read zone context evidence. It does not collect
    sensors, read Home Assistant entity state, mutate DB rows, send MQTT, or
    execute device commands.
    """

    availability = dict(data_availability or {})
    equipment = dict(equipment_profile or {})
    state = str(availability.get("state") or "empty")
    if crop_cycle_id and state == "empty":
        state = "partial"
    summary = "현재 작기 연결 전: 모니터링 근거 없음" if state == "empty" else "구역 컨텍스트 기준 모니터링 근거 연결됨"
    return {
        "r6_002_adapter": True,
        "adapterName": R6_002_ADAPTER_NAME,
        "adapterBoundary": R6_002_BOUNDARY,
        "contextSource": R6_002_CONTEXT_SOURCE,
        "zone_id": zone_id,
        "crop_cycle_id": crop_cycle_id,
        "sourceDataAvailability": availability,
        "sourceEquipmentProfile": equipment,
        "dataFreshnessState": state,
        "freshnessBoundary": "sensor state freshness boundary",
        "monitoringSummary": summary,
        "runtimeReadAdapterEnabled": True,
        "readOnly": True,
        "writeEnabled": False,
        "sensorCollectionEnabled": False,
        "dbMigrationEnabled": False,
        "executionEnabled": False,
        "deviceCommandEnabled": False,
        "mqttEnabled": False,
    }


def normalize_safety_interlock_readonly_adapter(
    *,
    zone_id: int | str | None,
    crop_cycle_id: int | str | None,
    monitoring_readonly_adapter: dict[str, Any] | None,
    safety_interlock_preflight_projection: dict[str, Any] | None,
) -> dict[str, Any]:
    """Return the R6-003 safety/interlock read-only adapter DTO.

    This adapter composes existing read-only monitoring/preflight evidence only.
    It does not call SafetyGuard runtime, Interlock runtime, approval override,
    MQTT, Home Assistant services, or device commands.
    """

    monitoring = dict(monitoring_readonly_adapter or {})
    preflight = dict(safety_interlock_preflight_projection or {})
    has_crop = bool(crop_cycle_id)
    safety_state = str(preflight.get("safetyState") or ("pending" if has_crop else "empty"))
    interlock_state = str(preflight.get("interlockState") or ("pending" if has_crop else "empty"))
    summary = "현재 작기 연결 전: 안전·인터록 근거 없음" if not has_crop else "안전·인터록 사전검증 근거 연결됨"
    return {
        "r6_003_adapter": True,
        "adapterName": R6_003_ADAPTER_NAME,
        "adapterBoundary": R6_003_BOUNDARY,
        "contextSource": R6_003_CONTEXT_SOURCE,
        "zone_id": zone_id,
        "crop_cycle_id": crop_cycle_id,
        "sourceMonitoringReadOnlyAdapter": monitoring,
        "sourcePreflightProjection": preflight,
        "safetyState": safety_state,
        "interlockState": interlock_state,
        "failSafeState": preflight.get("failSafeState") or ("standby" if has_crop else "empty"),
        "blockedReasons": list(preflight.get("blockedReasons") or ([] if not has_crop else ["operator_approval_required"])),
        "safetySummary": summary,
        "runtimeSafetyAdapterEnabled": True,
        "readOnly": True,
        "writeEnabled": False,
        "executionDecisionEnabled": False,
        "approvalOverrideEnabled": False,
        "dbMigrationEnabled": False,
        "executionEnabled": False,
        "deviceCommandEnabled": False,
        "mqttEnabled": False,
    }


def crop_cycle_row_to_zone_context(row: dict[str, Any]) -> dict[str, Any]:
    """Map one legacy physical crop row into a product-facing zone context DTO."""
    zone_id = row.get("zone_id") or row.get("zoneId") or 0
    crop_cycle_id = row.get("crop_cycle_id")
    compatibility_crop_season_id = row.get("compatibility_crop_season_id") or crop_cycle_id
    updated_at = row.get("updated_at")
    current_crop = {
        "crop_cycle_id": crop_cycle_id,
        "crop_type": row.get("crop_type") or "other",
        "crop_label_ko": _crop_label_ko(row.get("crop_type")),
        "variety": row.get("variety") or "",
        "growth_stage": row.get("growth_stage") or "생육 관찰",
        "plant_date": row.get("plant_date"),
        "demolish_date": row.get("demolish_date"),
    }
    equipment_profile = {"labels": ["구역 장비 요약 대기"]}
    data_availability = {
        "state": "ok" if crop_cycle_id else "empty",
        "freshnessMinutes": None,
        "source": RS_013_DATA_AVAILABILITY_SOURCE,
        "adapterSource": R6_001_CONTEXT_SOURCE,
        "updatedAt": updated_at,
        "note": "기존 물리 DB에서 읽은 작기 정보를 target DTO로 변환했습니다.",
    }
    monitoring_readonly_adapter = normalize_monitoring_readonly_adapter(
        zone_id=zone_id,
        crop_cycle_id=crop_cycle_id,
        data_availability=data_availability,
        equipment_profile=equipment_profile,
    )
    current_crop_assignment = {
        "assignmentState": "assigned" if crop_cycle_id else "unassigned",
        "zone_id": zone_id,
        "sourceRowId": compatibility_crop_season_id,
        "currentCrop": current_crop,
        "equipmentProfile": equipment_profile,
        "dataAvailability": data_availability,
        "readOnly": True,
        "executionEnabled": False,
    }
    growth_target_projection = {
        "projectionState": "ready" if crop_cycle_id else "empty",
        "targetStageLabel": current_crop["growth_stage"],
        "targetFocus": _growth_target_focus(current_crop["crop_type"], current_crop["growth_stage"]),
        "targetBasis": {
            "crop_cycle_id": crop_cycle_id,
            "crop_type": current_crop["crop_type"],
            "growth_stage": current_crop["growth_stage"],
        },
        "sourceAssignment": current_crop_assignment,
        "readOnly": True,
        "executionEnabled": False,
    }
    environment_impact_projection = {
        "impactState": "ready" if crop_cycle_id else "empty",
        "impactFocus": "구역 장비와 데이터 신선도 기준 영향 확인",
        "impactFactors": equipment_profile["labels"],
        "freshnessLabel": _freshness_label(data_availability.get("freshnessMinutes")),
        "sourceAssignment": current_crop_assignment,
        "sourceMonitoringReadOnlyAdapter": monitoring_readonly_adapter,
        "dataAvailability": data_availability,
        "readOnly": True,
        "executionEnabled": False,
    }
    recommendation_review_projection = {
        "reviewState": "ready" if crop_cycle_id else "empty",
        "reviewSummary": "추천 검토 대기: 생육목표와 환경 영향 projection 확인 필요",
        "reviewInputs": {
            "assignment": current_crop_assignment,
            "growthTargetProjection": growth_target_projection,
            "environmentImpactProjection": environment_impact_projection,
        },
        "approvalRequired": True if crop_cycle_id else False,
        "readOnly": True,
        "executionEnabled": False,
    }
    operator_approval_scaffold = {
        "approvalState": "required" if crop_cycle_id else "not_required",
        "approvalRequired": True if crop_cycle_id else False,
        "disabledReason": "작업자 승인과 안전/인터록 사전검증 전에는 실행할 수 없습니다.",
        "executionBlocked": True,
        "sourceRecommendationReview": recommendation_review_projection,
        "readOnly": True,
        "executionEnabled": False,
    }
    safety_interlock_preflight_projection = {
        "preflightState": "blocked_until_review" if crop_cycle_id else "empty",
        "safetyState": "pending" if crop_cycle_id else "empty",
        "interlockState": "pending" if crop_cycle_id else "empty",
        "failSafeState": "standby" if crop_cycle_id else "empty",
        "blockedReasons": ["operator_approval_required"] if crop_cycle_id else [],
        "requiredChecks": ["작업자 승인", "Safety 검증", "Interlock 검증", "Fail Safe 확인"] if crop_cycle_id else [],
        "sourceOperatorApproval": operator_approval_scaffold,
        "readOnly": True,
        "executionEnabled": False,
    }
    safety_interlock_readonly_adapter = normalize_safety_interlock_readonly_adapter(
        zone_id=zone_id,
        crop_cycle_id=crop_cycle_id,
        monitoring_readonly_adapter=monitoring_readonly_adapter,
        safety_interlock_preflight_projection=safety_interlock_preflight_projection,
    )
    virtual_execution_rehearsal_scaffold = {
        "rehearsalState": "blocked_until_virtual_rehearsal" if crop_cycle_id else "empty",
        "scenarioSet": ["normal", "strong_wind", "rain", "low_temperature", "sensor_fault", "blocked", "fail_safe", "recovery"],
        "currentScenario": "blocked",
        "readinessSummary": "가상 실행 리허설 전: Safety/Interlock/Fail Safe 사전검증 필요",
        "sourcePreflight": safety_interlock_preflight_projection,
        "sourceSafetyInterlockReadOnlyAdapter": safety_interlock_readonly_adapter,
        "readOnly": True,
        "executionEnabled": False,
        "deviceCommandEnabled": False,
        "mqttEnabled": False,
    }
    rehearsal_result_review_projection = {
        "reviewState": "pending_virtual_results" if crop_cycle_id else "empty",
        "resultSummary": "가상 리허설 결과 검토 대기: 실제 실행 없이 시나리오별 결과를 확인합니다.",
        "scenarioResults": [
            {"scenario": scenario, "resultState": "not_run"}
            for scenario in virtual_execution_rehearsal_scaffold["scenarioSet"]
        ],
        "sourceRehearsal": virtual_execution_rehearsal_scaffold,
        "readOnly": True,
        "executionEnabled": False,
        "approvalReleaseEnabled": False,
        "deviceCommandEnabled": False,
        "mqttEnabled": False,
    }
    virtual_runner_input_contract = {
        "inputState": "contract_ready_not_executable" if crop_cycle_id else "empty",
        "runnerMode": "read_only_contract",
        "inputScenarios": rehearsal_result_review_projection["scenarioResults"],
        "sourceReview": rehearsal_result_review_projection,
        "executionCandidate": False,
        "readOnly": True,
        "executionEnabled": False,
        "runnerExecutionEnabled": False,
        "approvalReleaseEnabled": False,
        "deviceCommandEnabled": False,
        "mqttEnabled": False,
    }
    virtual_runner_dry_run_result_adapter = {
        "adapterState": "dry_run_results_adapted_not_executable" if crop_cycle_id else "empty",
        "dryRunMode": "synthetic_read_only_adapter",
        "scenarioDryRunResults": [
            {
                "scenario": item.get("scenario"),
                "dryRunResult": "simulated_not_executed",
                "sourceResultState": item.get("resultState", "not_run"),
                "executionAllowed": False,
            }
            for item in virtual_runner_input_contract["inputScenarios"]
        ],
        "sourceInputContract": virtual_runner_input_contract,
        "resultAuthority": "review_only",
        "summaryState": "pending_operator_review" if crop_cycle_id else "empty",
        "readOnly": True,
        "executionEnabled": False,
        "runnerExecutionEnabled": False,
        "approvalReleaseEnabled": False,
        "deviceCommandEnabled": False,
        "mqttEnabled": False,
    }
    virtual_rehearsal_pass_fail_review_projection = {
        "reviewState": "pass_fail_review_pending" if crop_cycle_id else "empty",
        "overallDecision": "review_needed" if crop_cycle_id else "empty",
        "scenarioReviews": [
            {
                "scenario": item.get("scenario"),
                "decision": "review_needed",
                "sourceDryRunResult": item.get("dryRunResult", "simulated_not_executed"),
                "executionAllowed": False,
            }
            for item in virtual_runner_dry_run_result_adapter["scenarioDryRunResults"]
        ],
        "sourceDryRunResultAdapter": virtual_runner_dry_run_result_adapter,
        "passFailAuthority": "operator_review_only",
        "operatorReviewRequired": True,
        "readOnly": True,
        "executionEnabled": False,
        "runnerExecutionEnabled": False,
        "approvalReleaseEnabled": False,
        "deviceCommandEnabled": False,
        "mqttEnabled": False,
    }
    return {
        "id": f"zone-{zone_id}",
        "zone_id": zone_id,
        "name": row.get("zone_name") or f"{zone_id}구역",
        "r6_001_adapter": True,
        "adapterName": R6_001_ADAPTER_NAME,
        "adapterBoundary": R6_001_BOUNDARY,
        "shapeRule": R6_001_SHAPE_RULE,
        "readOnly": True,
        "executionEnabled": False,
        "currentCrop": current_crop,
        "activeCropCycleId": crop_cycle_id,
        "crop_cycle": crop_cycle_id,
        "equipmentProfile": equipment_profile,
        "dataAvailability": data_availability,
        "monitoringReadOnlyAdapter": monitoring_readonly_adapter,
        "currentCropAssignment": current_crop_assignment,
        "growthTargetProjection": growth_target_projection,
        "environmentImpactProjection": environment_impact_projection,
        "recommendationReviewProjection": recommendation_review_projection,
        "operatorApprovalScaffold": operator_approval_scaffold,
        "safetyInterlockPreflightProjection": safety_interlock_preflight_projection,
        "safetyInterlockReadOnlyAdapter": safety_interlock_readonly_adapter,
        "virtualExecutionRehearsalScaffold": virtual_execution_rehearsal_scaffold,
        "rehearsalResultReviewProjection": rehearsal_result_review_projection,
        "virtualRunnerInputContract": virtual_runner_input_contract,
        "virtualRunnerDryRunResultAdapter": virtual_runner_dry_run_result_adapter,
        "virtualRehearsalPassFailReviewProjection": virtual_rehearsal_pass_fail_review_projection,
        "compatibilityAliases": {
            "cropSeasonId": compatibility_crop_season_id,
        },
    }


def rebuild_home_context_from_rows(rows: list[dict[str, Any]], *, greenhouse_id: str = "greenhouse-main") -> dict[str, Any]:
    """Return the read-only rebuild home context DTO for rows."""
    return {
        "contextSource": R6_001_CONTEXT_SOURCE,
        "readOnly": True,
        "executionEnabled": False,
        "greenhouseId": greenhouse_id,
        "greenhouseName": "대표 온실",
        "zones": [crop_cycle_row_to_zone_context(row) for row in rows],
    }


async def get_rebuild_home_context_from_legacy_db(hass, *, greenhouse_id: str = "greenhouse-main") -> dict[str, Any]:
    """Read legacy crop_seasons via repository and return product-facing context."""
    if rebuild_crop_context_repo is None:
        raise RuntimeError("rebuild_crop_context_repo unavailable outside package runtime")
    rows = await rebuild_crop_context_repo.list_current_crop_cycle_rows(hass)
    return rebuild_home_context_from_rows(rows, greenhouse_id=greenhouse_id)
