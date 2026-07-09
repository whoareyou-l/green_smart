# R7-113 Zone greenhouse FK display and stable ordering

Version: v1.14.89
Status: prod verified

## User report

- `구역 목록` only appeared to show the first greenhouse.
- Previously saved first-greenhouse data appeared to be gone.

## Findings

Current prod DB evidence at investigation time:

```text
greenhouses:
1  대표 온실
5  대표 온실222

zones:
1  greenhouse_id=1  1-1구역
2  greenhouse_id=1  1-2구역
```

So the second greenhouse row exists, but there are currently no zone rows linked to `greenhouse_id=5`.

DB recovery limitations:

```text
log_bin = OFF
general_log = OFF
```

The DB does not retain query-level history, so exact overwritten/deleted previous values cannot be reconstructed from MariaDB logs.

## Root causes fixed

### Zone API lacked greenhouse name join

`list_settings_zones()` returned only `greenhouseId`, not `greenhouseName`. The frontend then fell back to the home context greenhouse label, which could make zone rows look like they belonged to the first/default greenhouse.

Fixed by joining zones to greenhouses:

```sql
LEFT JOIN green_smart_settings_greenhouses gh
  ON gh.farm_id = z.farm_id AND gh.id = z.greenhouse_id
```

The zone DTO now includes:

```json
"greenhouseName": "..."
```

### Unstable greenhouse ordering

The API previously ordered greenhouses and zones by `updated_at DESC`, which can make a newly edited/created greenhouse appear first. The zone create modal derived display numbering from array index, so 1온실/2온실 display order could be unstable.

Fixed:

- Greenhouses: `ORDER BY id ASC`
- Zones: `ORDER BY z.id ASC`
- Frontend zone-create greenhouse select sorts by stable numeric id before assigning display numbers.

### Frontend fallback ignored FK

`normalizeR7SettingsZoneEntityRows()` now resolves `greenhouseId` against the snapshot's `greenhouses` array before falling back to home context.

## Prod smoke

Temporary zone created under second greenhouse:

```json
{
  "greenhouseId": 5,
  "greenhouseName": "대표 온실222",
  "name": "2온실 표시 Smoke 구역"
}
```

Then the temp row was hard-deleted. Final prod zones remained:

```text
1  greenhouse_id=1  1-1구역
2  greenhouse_id=1  1-2구역
```

Stable log window: no errors.

## Verification

- Focused contracts: pass
- Full suite: `1508 passed`
- HA config check: pass
- Served prod asset marker: `REBUILD_VERSION = "1.14.89"`
- Prod FK display smoke: pass
