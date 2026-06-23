"""Home Assistant HTTP views for allowlisted Greenity central adapters."""

from __future__ import annotations

from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from .central_api import DEFAULT_CENTRAL_BASE_URL, CentralApiError, GreenityCentralClient, ensure_access_token
from .central_store import CentralTokenStore
from .crop_views import _growth_report_response

EDGE_VERSION = "1.9.46"


class _CentralAdapterView(HomeAssistantView):
    """Shared helpers for central adapter views."""

    requires_auth = True

    async def _client_and_token(self, request: web.Request) -> tuple[GreenityCentralClient, str]:
        hass = request.app["hass"]
        store = CentralTokenStore(hass)
        base_url = (await store.get_base_url()) or DEFAULT_CENTRAL_BASE_URL
        client = GreenityCentralClient(hass, base_url)
        token = await ensure_access_token(store, client)
        return client, token

    def _error_response(self, err: CentralApiError) -> web.Response:
        status = err.status if err.status and 400 <= err.status < 600 else 502
        return self.json({"error": err.detail}, status_code=status)


class CentralWeatherCurrentView(_CentralAdapterView):
    """POST /api/green_smart/central/weather/current — allowlisted central weather adapter."""

    url = "/api/green_smart/central/weather/current"
    name = "api:green_smart:central:weather:current"

    async def post(self, request: web.Request) -> web.Response:
        try:
            body = await request.json()
        except Exception:
            return self.json({"error": "invalid_json"}, status_code=400)

        nx = body.get("nx", 60)
        ny = body.get("ny", 127)
        try:
            params = {"nx": int(nx), "ny": int(ny)}
        except (TypeError, ValueError):
            return self.json({"error": "invalid_grid"}, status_code=400)

        try:
            client, token = await self._client_and_token(request)
            payload = await client.get_weather(token, "current", params)
            body = payload.get("body") if isinstance(payload, dict) and "body" in payload else payload
            return self.json(body)
        except CentralApiError as err:
            return self._error_response(err)


class CentralWeatherForecastView(_CentralAdapterView):
    """POST /api/green_smart/central/weather/forecast — allowlisted central short-term forecast adapter."""

    url = "/api/green_smart/central/weather/forecast"
    name = "api:green_smart:central:weather:forecast"

    async def post(self, request: web.Request) -> web.Response:
        try:
            body = await request.json()
        except Exception:
            return self.json({"error": "invalid_json"}, status_code=400)

        nx = body.get("nx", 60)
        ny = body.get("ny", 127)
        try:
            params = {"nx": int(nx), "ny": int(ny)}
        except (TypeError, ValueError):
            return self.json({"error": "invalid_grid"}, status_code=400)

        try:
            client, token = await self._client_and_token(request)
            payload = await client.get_weather(token, "forecast", params)
            body = payload.get("body") if isinstance(payload, dict) and "body" in payload else payload
            return self.json(body)
        except CentralApiError as err:
            return self._error_response(err)


class CentralWeatherMidView(_CentralAdapterView):
    """POST /api/green_smart/central/weather/mid — allowlisted central mid-term weather adapter."""

    url = "/api/green_smart/central/weather/mid"
    name = "api:green_smart:central:weather:mid"

    async def post(self, request: web.Request) -> web.Response:
        try:
            body = await request.json()
        except Exception:
            return self.json({"error": "invalid_json"}, status_code=400)

        land_reg_id = str(body.get("land_reg_id") or "11H10000").strip().upper()
        ta_reg_id = str(body.get("ta_reg_id") or "11H10701").strip().upper()
        if not land_reg_id.isalnum() or not ta_reg_id.isalnum():
            return self.json({"error": "invalid_reg_id"}, status_code=400)
        params = {"land_reg_id": land_reg_id, "ta_reg_id": ta_reg_id}

        try:
            client, token = await self._client_and_token(request)
            payload = await client.get_weather(token, "mid", params)
            body = payload.get("body") if isinstance(payload, dict) and "body" in payload else payload
            return self.json(body)
        except CentralApiError as err:
            return self._error_response(err)


class CentralCropInterlockSnapshotSyncView(_CentralAdapterView):
    """POST /api/green_smart/central/crop/interlock-snapshot/sync."""

    url = "/api/green_smart/central/crop/interlock-snapshot/sync"
    name = "api:green_smart:central:crop:interlock_snapshot:sync"

    async def post(self, request: web.Request) -> web.Response:
        try:
            body = await request.json()
        except Exception:
            return self.json({"error": "invalid_json"}, status_code=400)
        season_id = body.get("season_id") or body.get("seasonId")
        try:
            season_id_int = int(season_id)
        except (TypeError, ValueError):
            return self.json({"error": "invalid_season_id"}, status_code=400)
        hass = request.app["hass"]
        try:
            report = await _growth_report_response(hass, season_id_int)
            crop_model = report.get("cropModel") or {}
            crop_interlock = crop_model.get("cropInterlock") or {}
            season = crop_model.get("season") or {}
            payload = {
                "farm_id": int(body.get("farm_id") or body.get("farmId") or 1),
                "season_id": season_id_int,
                "zone_id": body.get("zone_id") or body.get("zoneId") or season.get("zoneId"),
                "stageDiagnosis": crop_model.get("stageDiagnosis") or crop_interlock.get("stageDiagnosis") or {},
                "cropInterlock": crop_interlock,
                "approvalAudit": crop_interlock.get("approvalAudit") or [],
                "auditSummary": {
                    "approvalGateStatus": crop_interlock.get("approvalGateStatus"),
                    "approvalResolvedReasons": crop_interlock.get("approvalResolvedReasons") or [],
                    "approvalUnresolvedReasons": crop_interlock.get("approvalUnresolvedReasons") or [],
                },
                "edgeVersions": {
                    "green_smart": EDGE_VERSION,
                    "cropModelVersion": crop_model.get("cropModelVersion"),
                    "cropInterlockVersion": crop_interlock.get("cropInterlockVersion"),
                    "cropStageInterlockVersion": crop_interlock.get("cropStageInterlockVersion"),
                },
            }
            client, token = await self._client_and_token(request)
            result = await client.sync_crop_interlock_snapshot(token, payload)
            return self.json({"ok": True, "center": result, "payload": payload})
        except CentralApiError as err:
            return self._error_response(err)


class CentralPesticideSearchView(_CentralAdapterView):
    """POST /api/green_smart/central/pesticide/search — allowlisted central pesticide adapter."""

    url = "/api/green_smart/central/pesticide/search"
    name = "api:green_smart:central:pesticide:search"

    async def post(self, request: web.Request) -> web.Response:
        try:
            body = await request.json()
        except Exception:
            return self.json({"items": [], "error": "invalid_json"}, status_code=400)

        query = str(body.get("query") or "").strip()
        if not query:
            return self.json({"items": [], "error": "empty_query"}, status_code=400)
        if len(query) > 80:
            return self.json({"items": [], "error": "query_too_long"}, status_code=400)

        try:
            client, token = await self._client_and_token(request)
            payload = await client.get_pesticide_data(token, {"query": query})
            body = payload.get("body") if isinstance(payload, dict) and "body" in payload else payload
            return self.json(body)
        except CentralApiError as err:
            return self._error_response(err)
