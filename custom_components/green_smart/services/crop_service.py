"""Crop read-only service helpers — RB-006A.

Services enforce domain permissions and delegate persistence to repositories.
They intentionally preserve existing route response shapes.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from ..repositories import crop_repo


@dataclass(frozen=True)
class CropReadActor:
    """Minimal actor DTO passed from HTTP views into read-only crop services."""

    role: str
    permissions: tuple[str, ...]


@dataclass(frozen=True)
class CropWriteActor:
    """Minimal actor DTO passed from HTTP views into crop write services."""

    role: str
    permissions: tuple[str, ...]


async def _require_crop_read(actor: CropReadActor) -> None:
    if "view_crop_records" not in set(actor.permissions or ()):  # RB-006B permission smoke
        raise PermissionError("view_crop_records permission required")


async def _require_crop_write(actor: CropWriteActor) -> None:
    if "edit_crop_records" not in set(actor.permissions or ()):  # RB-006C permission smoke
        raise PermissionError("edit_crop_records permission required")


async def _require_crop_delete(actor: CropWriteActor) -> None:
    permissions = set(actor.permissions or ())
    if "delete_crop_records" not in permissions and "manage_crop_seasons" not in permissions:
        raise PermissionError("delete_crop_records permission required")


def _vs003_lettuce_crop_cycle_payload(row: dict[str, Any]) -> dict[str, Any]:
    """Return the legacy VS-003 lettuce crop-cycle compatibility payload."""
    return {
        "cropCycleId": row.get("id"),
        "cropType": row.get("cropType"),
        "zoneId": row.get("zoneId"),
        "zoneName": row.get("zoneName"),
        "indexType": "L-Index",
        "metricsSource": "growth_surveys.metrics_json",
        "requiredMetricKeys": ["leafLength", "leafWidth", "leafCount", "freshWeight", "plantHeight"],
    }


def _with_crop_cycle_aliases(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if row and str(row.get("cropType") or "").lower() == "lettuce":
        row["vs003"] = _vs003_lettuce_crop_cycle_payload(row)
        row["crop_cycle_id"] = row.get("id")
    return row


async def list_crop_seasons(hass, actor: CropReadActor) -> list[dict[str, Any]]:
    """Return crop seasons if the actor can view crop records."""
    await _require_crop_read(actor)
    rows = await crop_repo.list_crop_seasons(hass)
    return rows


async def create_crop_season(hass, actor: CropWriteActor, body: dict[str, Any]) -> dict[str, Any] | None:
    """Create a crop season through the repository and return the legacy row shape."""
    await _require_crop_write(actor)
    new_id = await crop_repo.create_crop_season(hass, body)
    row = await crop_repo.get_crop_season(hass, new_id)
    return _with_crop_cycle_aliases(row)


async def update_crop_season(hass, actor: CropWriteActor, season_id: int, body: dict[str, Any]) -> dict[str, Any] | None:
    """Update a crop season through the repository and return the legacy row shape."""
    await _require_crop_write(actor)
    await crop_repo.update_crop_season(hass, season_id, body)
    row = await crop_repo.get_crop_season(hass, season_id)
    return _with_crop_cycle_aliases(row)


async def demolish_crop_season(hass, actor: CropWriteActor, season_id: int, demolish_date: str) -> dict[str, Any]:
    """Demolish a crop season while preserving the old response shape."""
    await _require_crop_write(actor)
    await crop_repo.demolish_crop_season(hass, season_id, demolish_date)
    return {"id": int(season_id), "demolishDate": demolish_date}


async def hard_delete_crop_season(hass, actor: CropWriteActor, season_id: int) -> dict[str, Any]:
    """Hard delete a crop season and dependent records through the repository."""
    await _require_crop_delete(actor)
    await crop_repo.hard_delete_crop_season(hass, season_id)
    return {"ok": True, "id": int(season_id), "hardDeleted": True}


async def list_growth_records(hass, actor: CropReadActor, season_id: int) -> list[dict[str, Any]]:
    """Return growth survey records if the actor can view crop records."""
    await _require_crop_read(actor)
    rows = await crop_repo.list_growth_records(hass, season_id)
    return rows


async def list_pest_records(hass, actor: CropReadActor, season_id: int) -> list[dict[str, Any]]:
    """Return pest scouting records if the actor can view crop records."""
    await _require_crop_read(actor)
    rows = await crop_repo.list_pest_records(hass, season_id)
    return rows


async def list_control_records(hass, actor: CropReadActor, season_id: int) -> list[dict[str, Any]]:
    """Return control records if the actor can view crop records."""
    await _require_crop_read(actor)
    rows = await crop_repo.list_control_records(hass, season_id)
    return rows
