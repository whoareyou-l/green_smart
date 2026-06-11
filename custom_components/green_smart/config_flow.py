"""Config flow for green_smart."""

from __future__ import annotations

import voluptuous as vol
from homeassistant import config_entries

from .const import DOMAIN

_WIZARD_KEYS = (
    "host", "port", "unit_id",
    "greenhouse_zones", "nutrient_zones", "stevenson_screens",
    "weatherflow_prefix", "virtual",
)


class GreenSmartConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Hidden flow used by the sidebar panel wizard."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        if self._async_current_entries():
            return self.async_abort(reason="already_configured")
        if user_input is not None:
            # Wizard submitted full data — create configured entry
            data = {k: v for k, v in user_input.items() if k in _WIZARD_KEYS}
            return self.async_create_entry(title="Green Smart", data=data)
        # First call (no data) — show empty form so wizard can submit data
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({}, extra=vol.ALLOW_EXTRA),
        )
