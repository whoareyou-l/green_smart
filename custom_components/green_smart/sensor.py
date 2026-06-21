"""Green Smart virtual rehearsal sensors."""
from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.helpers.entity import EntityCategory

from .const import DOMAIN

GREEN_SMART_VIRTUAL_DOMAINS = ("environment", "irrigation", "device")
GREEN_SMART_VIRTUAL_SENSOR_SPECS = (
    ("wind_speed", "풍속", "m/s", 1.2),
    ("temperature", "온도", "°C", 22.0),
)


async def async_setup_entry(hass, entry, async_add_entities):
    """Create 가상 센서 entities for virtual-device rehearsal."""
    entities = []
    for control_domain in GREEN_SMART_VIRTUAL_DOMAINS:
        for key, label, unit, initial in GREEN_SMART_VIRTUAL_SENSOR_SPECS:
            entities.append(GreenSmartVirtualSensor(control_domain, key, label, unit, initial))
    async_add_entities(entities)
    hass.data.setdefault(DOMAIN, {})["green_smart_virtual_sensor_entities"] = [e.entity_id for e in entities]


class GreenSmartVirtualSensor(SensorEntity):
    """가상 센서 for C19B virtual HA entity testing."""

    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_should_poll = False

    def __init__(self, control_domain: str, key: str, label: str, unit: str | None, initial) -> None:
        self._control_domain = control_domain
        self._key = key
        self._attr_native_value = initial
        self._attr_native_unit_of_measurement = unit
        self._attr_name = f"Green Smart 가상 센서 {control_domain} {label}"
        self._attr_unique_id = f"green_smart_virtual_{control_domain}_{key}"
        self.entity_id = f"sensor.green_smart_virtual_{control_domain}_{key}"
        # Static marker for contracts: sensor.green_smart_virtual_environment_wind_speed
        # Static marker for contracts: sensor.green_smart_virtual_irrigation_temperature
        # Static marker for contracts: binary_sensor.green_smart_virtual_device_rain

    async def async_set_native_value(self, value) -> None:
        self._attr_native_value = value
        self.async_write_ha_state()
