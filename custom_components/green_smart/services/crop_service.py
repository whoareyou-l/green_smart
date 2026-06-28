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


async def list_crop_seasons(hass, actor: CropReadActor) -> list[dict[str, Any]]:
    """Return crop seasons if the actor can view crop records."""
    if "view_crop_records" not in set(actor.permissions or ()):  # RB-006A permission smoke
        raise PermissionError("view_crop_records permission required")
    rows = await crop_repo.list_crop_seasons(hass)
    return rows
