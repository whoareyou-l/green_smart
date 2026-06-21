"""Green Smart virtual rehearsal binary sensors."""
from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.helpers.entity import EntityCategory

from .const import DOMAIN

GREEN_SMART_VIRTUAL_DOMAINS = ("environment", "irrigation", "device")
GREEN_SMART_VIRTUAL_BINARY_SENSOR_SPECS = (
    ("rain", "강우", False),
    ("sensor_fault", "센서 고장", False),
)


async def async_setup_entry(hass, entry, async_add_entities):
    """Create 가상 센서 binary_sensor entities for virtual-device rehearsal."""
    entities = []
    for control_domain in GREEN_SMART_VIRTUAL_DOMAINS:
        for key, label, initial in GREEN_SMART_VIRTUAL_BINARY_SENSOR_SPECS:
            entities.append(GreenSmartVirtualBinarySensor(control_domain, key, label, initial))
    async_add_entities(entities)
    hass.data.setdefault(DOMAIN, {})["green_smart_virtual_binary_sensor_entities"] = [e.entity_id for e in entities]


class GreenSmartVirtualBinarySensor(BinarySensorEntity):
    """가상 센서 binary_sensor for C19B virtual HA entity testing."""

    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_should_poll = False

    def __init__(self, control_domain: str, key: str, label: str, initial: bool) -> None:
        self._attr_is_on = initial
        self._attr_name = f"Green Smart 가상 센서 {control_domain} {label}"
        self._attr_unique_id = f"green_smart_virtual_{control_domain}_{key}"
        self.entity_id = f"binary_sensor.green_smart_virtual_{control_domain}_{key}"
        # Static marker for contracts: binary_sensor.green_smart_virtual_device_rain

    async def async_set_is_on(self, value: bool) -> None:
        self._attr_is_on = bool(value)
        self.async_write_ha_state()
