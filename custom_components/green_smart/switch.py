"""Green Smart virtual rehearsal switches."""
from __future__ import annotations

from homeassistant.components.switch import SwitchEntity

from .const import DOMAIN

GREEN_SMART_VIRTUAL_DOMAINS = ("environment", "irrigation", "device")
GREEN_SMART_VIRTUAL_SWITCH_SPECS = (
    ("irrigation_pump", "관수 펌프"),
    ("alarm_beacon", "알람 비콘"),
)


async def async_setup_entry(hass, entry, async_add_entities):
    """Create 가상 장치 switch entities for virtual-device rehearsal."""
    entities = []
    for control_domain in GREEN_SMART_VIRTUAL_DOMAINS:
        for key, label in GREEN_SMART_VIRTUAL_SWITCH_SPECS:
            entities.append(GreenSmartVirtualSwitch(control_domain, key, label))
    async_add_entities(entities)
    hass.data.setdefault(DOMAIN, {})["green_smart_virtual_switch_entities"] = [e.entity_id for e in entities]


class GreenSmartVirtualSwitch(SwitchEntity):
    """가상 장치 switch for C19B virtual HA entity testing."""

    _attr_should_poll = False

    def __init__(self, control_domain: str, key: str, label: str) -> None:
        self._attr_is_on = False
        self._attr_name = f"Green Smart 가상 장치 {control_domain} {label}"
        self._attr_unique_id = f"green_smart_virtual_{control_domain}_{key}"
        self.entity_id = f"switch.green_smart_virtual_{control_domain}_{key}"
        # Static marker for contracts: switch.green_smart_virtual_environment_irrigation_pump
        # Static marker for contracts: switch.green_smart_virtual_device_alarm_beacon

    async def async_turn_on(self, **kwargs) -> None:
        self._attr_is_on = True
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs) -> None:
        self._attr_is_on = False
        self.async_write_ha_state()
