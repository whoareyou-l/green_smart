"""Read-only API shell for the Green Smart rebuild surface."""
from __future__ import annotations

from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from .services.rebuild_crop_context_service import get_rebuild_home_context_from_legacy_db

REBUILD_HOME_CONTEXT_SOURCE = "legacy-physical-readonly-adapter"


async def rebuild_home_context_response(hass) -> dict:
    """Return the RS-014 API source adapter response.

    RS-014 API source adapter: the production route remains unchanged, but the
    response source is now the RS-013 read-only DB adapter service instead of a
    static fixture. The response remains read-only and execution-disabled.
    """
    return await get_rebuild_home_context_from_legacy_db(hass)


class RebuildHomeContextView(HomeAssistantView):
    """GET /api/green_smart/rebuild/home/context."""

    url = "/api/green_smart/rebuild/home/context"
    name = "api:green_smart:rebuild:home:context"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        return self.json(await rebuild_home_context_response(hass))
