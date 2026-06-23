"""Home Assistant HTTP views for allowlisted Greenity central adapters."""

from __future__ import annotations

from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from .central_api import DEFAULT_CENTRAL_BASE_URL, CentralApiError, GreenityCentralClient, ensure_access_token
from .central_store import CentralTokenStore
from .crop_views import _growth_report_response

EDGE_VERSION = "1.9.49"
EDGE_REALTIME_EVALUATION_INTERVAL_SECONDS = 60
CENTER_CROP_INTERLOCK_SNAPSHOT_SYNC_INTERVAL_SECONDS = 300


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


async def sync_crop_interlock_snapshot_for_season(
    hass,
    season_id: int,
    farm_id: int = 1,
    zone_id: int | None = None,
    trigger: str = "scheduled_5m",
) -> dict:
    """Push one crop interlock snapshot to Center without changing local execution authority."""
    report = await _growth_report_response(hass, int(season_id))
    crop_model = report.get("cropModel") or {}
    crop_interlock = crop_model.get("cropInterlock") or {}
    season = crop_model.get("season") or {}
    payload = {
        "farm_id": int(farm_id or 1),
        "season_id": int(season_id),
        "zone_id": zone_id or season.get("zoneId"),
        "stageDiagnosis": crop_model.get("stageDiagnosis") or crop_interlock.get("stageDiagnosis") or {},
        "cropInterlock": crop_interlock,
        "approvalAudit": crop_interlock.get("approvalAudit") or [],
        "auditSummary": {
            "trigger": trigger,
            "approvalGateStatus": crop_interlock.get("approvalGateStatus"),
            "approvalResolvedReasons": crop_interlock.get("approvalResolvedReasons") or [],
            "approvalUnresolvedReasons": crop_interlock.get("approvalUnresolvedReasons") or [],
            "edgeRealtimeIntervalSeconds": EDGE_REALTIME_EVALUATION_INTERVAL_SECONDS,
            "centerSnapshotSyncIntervalSeconds": CENTER_CROP_INTERLOCK_SNAPSHOT_SYNC_INTERVAL_SECONDS,
        },
        "edgeVersions": {
            "green_smart": EDGE_VERSION,
            "cropModelVersion": crop_model.get("cropModelVersion"),
            "cropInterlockVersion": crop_interlock.get("cropInterlockVersion"),
            "cropStageInterlockVersion": crop_interlock.get("cropStageInterlockVersion"),
            "edgeRealtimeIntervalSeconds": EDGE_REALTIME_EVALUATION_INTERVAL_SECONDS,
            "centerSnapshotSyncIntervalSeconds": CENTER_CROP_INTERLOCK_SNAPSHOT_SYNC_INTERVAL_SECONDS,
        },
    }
    store = CentralTokenStore(hass)
    base_url = (await store.get_base_url()) or DEFAULT_CENTRAL_BASE_URL
    client = GreenityCentralClient(hass, base_url)
    token = await ensure_access_token(store, client)
    result = await client.sync_crop_interlock_snapshot(token, payload)
    return {"ok": True, "center": result, "payload": payload}


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
            result = await sync_crop_interlock_snapshot_for_season(
                hass,
                season_id=season_id_int,
                farm_id=int(body.get("farm_id") or body.get("farmId") or 1),
                zone_id=body.get("zone_id") or body.get("zoneId"),
                trigger=str(body.get("trigger") or "manual_api"),
            )
            return self.json(result)
        except CentralApiError as err:
            return self._error_response(err)


class CentralCropInterlockAnalyticsSummaryView(_CentralAdapterView):
    """GET /api/green_smart/central/crop/interlock-analytics/summary — analytics/reporting only; not real-time safety decision."""

    url = "/api/green_smart/central/crop/interlock-analytics/summary"
    name = "api:green_smart:central:crop:interlock_analytics:summary"

    async def get(self, request: web.Request) -> web.Response:
        farm_id_raw = request.query.get("farm_id", "1")
        season_id_raw = request.query.get("season_id")
        try:
            farm_id = int(farm_id_raw or 1)
            season_id = int(season_id_raw) if season_id_raw else None
        except (TypeError, ValueError):
            return self.json({"error": "invalid_query"}, status_code=400)
        try:
            client, token = await self._client_and_token(request)
            payload = await client.get_crop_interlock_analytics_summary(token, farm_id=farm_id, season_id=season_id)
            return self.json({
                **payload,
                "message": payload.get("message") or "analytics/reporting only; not real-time safety decision",
                "readonly": True,
            })
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
