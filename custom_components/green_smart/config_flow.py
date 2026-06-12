"""Config flow for green_smart."""

from __future__ import annotations

import voluptuous as vol
from homeassistant import config_entries

from .central_api import DEFAULT_CENTRAL_BASE_URL, CentralApiError, GreenityCentralClient
from .central_store import CentralTokenStore
from .const import DOMAIN

_WIZARD_KEYS = (
    "host",
    "port",
    "unit_id",
    "greenhouse_zones",
    "nutrient_zones",
    "stevenson_screens",
    "weatherflow_prefix",
    "virtual",
    "central_base_url",
    "central_installation_id",
)

_ACTIVATION_ERROR_MAP = {
    "invalid_activation_code": "invalid_activation_code",
    "activation_code_expired": "activation_code_expired",
    "activation_code_not_active": "activation_code_not_active",
    "cannot_connect": "cannot_connect",
}


class GreenSmartConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Hidden flow used by the sidebar panel wizard."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        if self._async_current_entries():
            return self.async_abort(reason="already_configured")
        if user_input is not None:
            activation_code = user_input.get("activation_code")
            base_url = str(user_input.get("central_base_url") or DEFAULT_CENTRAL_BASE_URL).rstrip("/")
            data = {k: v for k, v in user_input.items() if k in _WIZARD_KEYS}
            data["central_base_url"] = base_url

            if activation_code:
                client = GreenityCentralClient(self.hass, base_url)
                try:
                    tokens = await client.exchange_activation_code(str(activation_code))
                except CentralApiError as err:
                    reason = _ACTIVATION_ERROR_MAP.get(err.detail, "cannot_connect")
                    return self.async_show_form(
                        step_id="user",
                        data_schema=vol.Schema({}, extra=vol.ALLOW_EXTRA),
                        errors={"base": reason},
                    )
                installation_id = str(tokens.get("installation_id", ""))
                data["central_installation_id"] = installation_id
                await CentralTokenStore(self.hass).save_token_pair(
                    base_url=base_url,
                    installation_id=installation_id,
                    access_token=str(tokens.get("access_token", "")),
                    refresh_token=str(tokens.get("refresh_token", "")),
                    token_type=str(tokens.get("token_type", "bearer")),
                    expires_in=int(tokens.get("expires_in", 0)),
                )

            # Wizard submitted full data — create configured entry. Activation input is not persisted.
            return self.async_create_entry(title="Green Smart", data=data)
        # First call (no data) — show empty form so wizard can submit data
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({}, extra=vol.ALLOW_EXTRA),
        )
