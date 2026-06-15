"""Home Assistant HTTP views for allowlisted Greenity central adapters."""

from __future__ import annotations

from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from .central_api import DEFAULT_CENTRAL_BASE_URL, CentralApiError, GreenityCentralClient, ensure_access_token
from .central_store import CentralTokenStore


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
