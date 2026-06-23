"""Greenity central API client for Green Smart."""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, TYPE_CHECKING

from aiohttp import ClientError, ClientTimeout
from homeassistant.helpers.aiohttp_client import async_get_clientsession

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .central_store import CentralTokenStore

DEFAULT_CENTRAL_BASE_URL = "http://127.0.0.1:18000"
CENTRAL_TIMEOUT_SECONDS = 10
TOKEN_REFRESH_MARGIN_SECONDS = 60
ACTIVATION_EXCHANGE_PATH = "/activation/exchange"
TOKEN_REFRESH_PATH = "/tokens/refresh"
TOKEN_REVOKE_PATH = "/tokens/revoke"
DEMO_STATUS_PATH = "/vendor/adapters/demo/status"
CROP_INTERLOCK_SNAPSHOT_PATH = "/edge/snapshots/crop-interlock"
CROP_INTERLOCK_ANALYTICS_SUMMARY_PATH = "/analytics/crop-interlock/summary"


@dataclass(slots=True)
class CentralApiError(Exception):
    """Sanitized central API error."""

    detail: str
    status: int | None = None

    def __str__(self) -> str:
        if self.status is None:
            return self.detail
        return f"central_api_http_{self.status}:{self.detail}"


class GreenityCentralClient:
    """Small JSON client for the central API."""

    def __init__(self, hass: HomeAssistant, base_url: str) -> None:
        self._session = async_get_clientsession(hass)
        self._base_url = base_url.rstrip("/")
        self._timeout = ClientTimeout(total=CENTRAL_TIMEOUT_SECONDS)

    def _url(self, endpoint: str) -> str:
        return f"{self._base_url}{endpoint}"

    async def _post_json(
        self,
        endpoint: str,
        payload: dict[str, Any],
        headers: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        try:
            async with self._session.post(
                self._url(endpoint),
                json=payload,
                headers=headers,
                timeout=self._timeout,
            ) as response:
                body = await response.json(content_type=None)
                if response.status >= 400:
                    detail = body.get("detail", "central_api_error") if isinstance(body, dict) else "central_api_error"
                    raise CentralApiError(str(detail), response.status)
                if not isinstance(body, dict):
                    raise CentralApiError("central_api_invalid_json", response.status)
                return body
        except CentralApiError:
            raise
        except (ClientError, TimeoutError, OSError) as err:
            raise CentralApiError("cannot_connect") from err

    async def _get_json(
        self,
        endpoint: str,
        params: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        try:
            clean_params = {key: value for key, value in (params or {}).items() if value is not None}
            async with self._session.get(
                self._url(endpoint),
                params=clean_params,
                headers=headers,
                timeout=self._timeout,
            ) as response:
                body = await response.json(content_type=None)
                if response.status >= 400:
                    detail = body.get("detail", "central_api_error") if isinstance(body, dict) else "central_api_error"
                    raise CentralApiError(str(detail), response.status)
                if not isinstance(body, dict):
                    raise CentralApiError("central_api_invalid_json", response.status)
                return body
        except CentralApiError:
            raise
        except (ClientError, TimeoutError, OSError) as err:
            raise CentralApiError("cannot_connect") from err

    async def exchange_activation_code(
        self,
        code: str,
        ha_instance_id: str | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {"code": code, "ha_instance_id": ha_instance_id}
        if not ha_instance_id:
            payload.pop("ha_instance_id")
        return await self._post_json(ACTIVATION_EXCHANGE_PATH, payload)

    async def refresh_tokens(self, refresh_token: str) -> dict[str, Any]:
        return await self._post_json(TOKEN_REFRESH_PATH, {"refresh_token": refresh_token})

    async def revoke_token(self, token: str, token_type: str) -> dict[str, Any]:
        return await self._post_json(TOKEN_REVOKE_PATH, {"token": token, "token_type": token_type})

    async def demo_status(self, access_token: str, device_id: str) -> dict[str, Any]:
        return await self._post_json(
            DEMO_STATUS_PATH,
            {"device_id": device_id},
            headers={"Authorization": f"Bearer {access_token}"},
        )

    async def get_weather(self, access_token: str, endpoint: str, params: dict[str, Any]) -> dict[str, Any]:
        return await self._post_json(
            f"/vendor/adapters/weather/{endpoint}",
            params,
            headers={"Authorization": f"Bearer {access_token}"},
        )

    async def get_pesticide_data(self, access_token: str, params: dict[str, Any]) -> dict[str, Any]:
        return await self._post_json(
            "/vendor/adapters/pesticide/search",
            params,
            headers={"Authorization": f"Bearer {access_token}"},
        )

    async def sync_crop_interlock_snapshot(self, access_token: str, payload: dict[str, Any]) -> dict[str, Any]:
        return await self._post_json(
            CROP_INTERLOCK_SNAPSHOT_PATH,
            {
                "farm_id": payload.get("farm_id", 1),
                "season_id": payload.get("season_id") or payload.get("seasonId"),
                "zone_id": payload.get("zone_id") or payload.get("zoneId"),
                "stageDiagnosis": payload.get("stageDiagnosis") or {},
                "cropInterlock": payload.get("cropInterlock") or {},
                "approvalAudit": payload.get("approvalAudit") or [],
                "auditSummary": payload.get("auditSummary") or {},
                "edgeVersions": payload.get("edgeVersions") or {},
            },
            headers={"Authorization": f"Bearer {access_token}"},
        )

    async def get_crop_interlock_analytics_summary(
        self,
        access_token: str,
        farm_id: int = 1,
        season_id: int | None = None,
    ) -> dict[str, Any]:
        return await self._get_json(
            CROP_INTERLOCK_ANALYTICS_SUMMARY_PATH,
            params={"farm_id": farm_id, "season_id": season_id},
            headers={"Authorization": f"Bearer {access_token}"},
        )


async def ensure_access_token(store: CentralTokenStore, client: GreenityCentralClient) -> str:
    """Return a current central access token, rotating refresh tokens when needed."""

    access = await store.get_access_token()
    expires_at = await store.get_expires_at()
    now = int(time.time())
    if access and expires_at and now < expires_at - TOKEN_REFRESH_MARGIN_SECONDS:
        return access

    refresh = await store.get_refresh_token()
    if not refresh:
        raise CentralApiError("central_tokens_missing")

    token_pair = await client.refresh_tokens(refresh)
    token_values = {
        "base_url": await store.get_base_url(),
        "installation_id": str(token_pair.get("installation_id", "")),
        "access_token": str(token_pair.get("access_token", "")),
        "refresh_token": str(token_pair.get("refresh_token", "")),
        "token_type": str(token_pair.get("token_type", "bearer")),
        "expires_in": int(token_pair.get("expires_in", 0)),
    }
    await store.save_token_pair(**token_values)
    rotated_access = await store.get_access_token()
    if not rotated_access:
        raise CentralApiError("central_tokens_missing")
    return rotated_access
