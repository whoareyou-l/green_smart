# Testing green_smart

This repo has a lightweight product test baseline that does not require a real Home Assistant instance.

## Run all product tests

```bash
cd /home/smartfarm/green_smart
scripts/green-smart-product-test
```

This runs:

```text
1. Python contract tests with pytest via uv/Python 3.12
2. JavaScript syntax check for the custom panel with node --check
```

Expected success marker:

```text
GREEN_SMART_PRODUCT_TEST_OK
```

## Test scope

Current tests cover:

- `manifest.json` contract: domain, name, config flow, iot class, pinned runtime requirement.
- `const.py`: `DOMAIN == "green_smart"`.
- `config_flow.py` static contract: wizard keys and single user step.
- `panel/green-smart-panel.js`: panel registration marker and no obvious embedded secrets/prod URLs.
- `kma_grid.py`: address search, duplicate grid behavior, short sido names, regId fallback/specific mapping.
- `weather_api.py`: storage/cache constants, masked key contract, key-safe error handling, masked frontend methods.
- `db.py`: environment variable defaults, utf8mb4/autocommit/bounded pool config, ISO conversion, pool cleanup contract.
- JS syntax validity via `node --check`.

Current baseline: 20 pytest tests plus JS syntax check.

## Why tests avoid importing Home Assistant

The first test baseline is intentionally static/contract-oriented. It avoids importing Home Assistant so tests can run quickly in a small local uv environment and inside agent workflows.

Future tests can add Home Assistant test harness coverage once the dev HA bootstrap/auth strategy is settled.
