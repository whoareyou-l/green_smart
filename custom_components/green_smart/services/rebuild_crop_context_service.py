"""RS-013 read-only service boundary for rebuild crop context.

Maps legacy physical DB rows into product-facing crop_cycle/currentCrop DTOs.
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
        "source": "legacy_physical_readonly_adapter",
        "updatedAt": updated_at,
        "note": "기존 물리 DB에서 읽은 작기 정보를 target DTO로 변환했습니다.",
    }
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
    return {
        "id": f"zone-{zone_id}",
        "zone_id": zone_id,
        "name": row.get("zone_name") or f"{zone_id}구역",
        "currentCrop": current_crop,
        "activeCropCycleId": crop_cycle_id,
        "crop_cycle": crop_cycle_id,
        "equipmentProfile": equipment_profile,
        "dataAvailability": data_availability,
        "currentCropAssignment": current_crop_assignment,
        "growthTargetProjection": growth_target_projection,
        "environmentImpactProjection": environment_impact_projection,
        "recommendationReviewProjection": recommendation_review_projection,
        "operatorApprovalScaffold": operator_approval_scaffold,
        "compatibilityAliases": {
            "cropSeasonId": compatibility_crop_season_id,
        },
    }


def rebuild_home_context_from_rows(rows: list[dict[str, Any]], *, greenhouse_id: str = "greenhouse-main") -> dict[str, Any]:
    """Return the read-only rebuild home context DTO for rows."""
    return {
        "contextSource": "legacy-physical-readonly-adapter",
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
