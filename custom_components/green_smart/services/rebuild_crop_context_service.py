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
    return {
        "id": f"zone-{zone_id}",
        "zone_id": zone_id,
        "name": row.get("zone_name") or f"{zone_id}구역",
        "currentCrop": current_crop,
        "activeCropCycleId": crop_cycle_id,
        "crop_cycle": crop_cycle_id,
        "equipmentProfile": {"labels": ["구역 장비 요약 대기"]},
        "dataAvailability": {
            "state": "ok" if crop_cycle_id else "empty",
            "freshnessMinutes": None,
            "source": "legacy_physical_readonly_adapter",
            "updatedAt": updated_at,
            "note": "기존 물리 DB에서 읽은 작기 정보를 target DTO로 변환했습니다.",
        },
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
