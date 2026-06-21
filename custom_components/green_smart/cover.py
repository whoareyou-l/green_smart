"""Green Smart virtual rehearsal covers."""
from __future__ import annotations

from homeassistant.components.cover import CoverEntity, CoverEntityFeature

from .const import DOMAIN

GREEN_SMART_VIRTUAL_DOMAINS = ("environment", "irrigation", "device")
GREEN_SMART_VIRTUAL_COVER_SPECS = (
    ("ventilation", "환기창"),
    ("screen", "스크린"),
)


async def async_setup_entry(hass, entry, async_add_entities):
    """Create 가상 장치 cover entities for virtual-device rehearsal."""
    entities = []
    for control_domain in GREEN_SMART_VIRTUAL_DOMAINS:
        for key, label in GREEN_SMART_VIRTUAL_COVER_SPECS:
            entities.append(GreenSmartVirtualCover(control_domain, key, label))
    async_add_entities(entities)
    hass.data.setdefault(DOMAIN, {})["green_smart_virtual_cover_entities"] = [e.entity_id for e in entities]


class GreenSmartVirtualCover(CoverEntity):
    """가상 장치 cover for C19B virtual HA entity testing."""

    _attr_should_poll = False
    _attr_supported_features = CoverEntityFeature.OPEN | CoverEntityFeature.CLOSE | CoverEntityFeature.SET_POSITION

    def __init__(self, control_domain: str, key: str, label: str) -> None:
        self._attr_current_cover_position = 0
        self._attr_is_closed = True
        self._attr_name = f"Green Smart 가상 장치 {control_domain} {label}"
        self._attr_unique_id = f"green_smart_virtual_{control_domain}_{key}"
        self.entity_id = f"cover.green_smart_virtual_{control_domain}_{key}"
        # Static marker for contracts: cover.green_smart_virtual_environment_ventilation
        # Static marker for contracts: cover.green_smart_virtual_device_screen

    async def async_open_cover(self, **kwargs) -> None:
        self._attr_current_cover_position = 100
        self._attr_is_closed = False
        self.async_write_ha_state()

    async def async_close_cover(self, **kwargs) -> None:
        self._attr_current_cover_position = 0
        self._attr_is_closed = True
        self.async_write_ha_state()

    async def async_set_cover_position(self, **kwargs) -> None:
        position = int(kwargs.get("position", 0))
        self._attr_current_cover_position = max(0, min(100, position))
        self._attr_is_closed = self._attr_current_cover_position == 0
        self.async_write_ha_state()
