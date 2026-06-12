"""Dedicated Home Assistant storage for Greenity central tokens."""

from __future__ import annotations

import time
from typing import Any, TYPE_CHECKING

from homeassistant.helpers.storage import Store

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

CENTRAL_STORAGE_KEY = "green_smart_central"
CENTRAL_STORAGE_VERSION = 1


class CentralTokenStore:
    """Store central token material outside config entry data."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store = Store(hass, CENTRAL_STORAGE_VERSION, CENTRAL_STORAGE_KEY)

    async def _load(self) -> dict[str, Any]:
        data = await self._store.async_load()
        return data if isinstance(data, dict) else {}

    async def save_token_pair(
        self,
        *,
        base_url: str,
        installation_id: str,
        access_token: str,
        refresh_token: str,
        token_type: str,
        expires_in: int,
    ) -> None:
        expires_at = int(time.time()) + int(expires_in)
        await self._store.async_save(
            {
                "base_url": base_url,
                "installation_id": installation_id,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": token_type,
                "expires_at": expires_at,
            }
        )

    async def get_base_url(self) -> str:
        data = await self._load()
        value = data.get("base_url")
        return value if isinstance(value, str) else ""

    async def get_access_token(self) -> str | None:
        data = await self._load()
        value = data.get("access_token")
        return value if isinstance(value, str) and value else None

    async def get_refresh_token(self) -> str | None:
        data = await self._load()
        value = data.get("refresh_token")
        return value if isinstance(value, str) and value else None

    async def get_expires_at(self) -> int | None:
        data = await self._load()
        value = data.get("expires_at")
        return value if isinstance(value, int) else None

    async def get_masked_installation_id(self) -> str | None:
        data = await self._load()
        value = data.get("installation_id")
        if not isinstance(value, str) or not value:
            return None
        if len(value) <= 8:
            return "****"
        return f"{value[:4]}****{value[-4:]}"

    async def clear_tokens(self) -> None:
        await self._store.async_save({})
