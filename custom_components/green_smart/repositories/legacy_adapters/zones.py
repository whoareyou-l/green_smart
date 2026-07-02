"""Legacy zone table adapter fragments.

DB-02B compatibility bridge: this module intentionally owns SQL fragments that
still depend on the legacy `zones` table while crop-cycle data remains on legacy
`crop_seasons`. Current/product code should move toward
`green_smart_settings_zones`; until then, callers import these named fragments
instead of embedding `LEFT JOIN zones` directly.
"""

LEGACY_TABLE_ZONES = "zones"

CROP_SEASON_ZONE_NAME_SELECT = "COALESCE(z.name, CONCAT(s.zone_id, '구역')) AS zoneName, s.zone_id AS zoneId"

CROP_SEASON_ZONE_LEFT_JOIN = "LEFT JOIN zones z ON z.id = s.zone_id"

REBUILD_CROP_CONTEXT_ZONE_NAME_SELECT = "COALESCE(z.name, CONCAT(s.zone_id, '구역')) AS zone_name"

REBUILD_CROP_CONTEXT_ZONE_LEFT_JOIN = "LEFT JOIN zones z ON z.id = s.zone_id"
