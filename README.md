# green_smart

Home Assistant custom integration and sidebar panel for Green Smart greenhouse management.

## Status

This repository is the active product repository for the `green_smart` Home Assistant custom integration.
Paperclip-era documents are historical only and are not part of the active workflow.

## Start here

New developers should read the full project handbook first:

- [`docs/PROJECT_GUIDE.md`](docs/PROJECT_GUIDE.md) — end-to-end project overview, architecture, DB model, API map, UI structure, testing, deployment, and roadmap.
- [`docs/PROJECT_MASTER_PLAN.md`](docs/PROJECT_MASTER_PLAN.md) — current master roadmap aligned with the new interlock-first control plan.
- [`docs/design/system-architecture.md`](docs/design/system-architecture.md) — HA/edge/SaaS/deploy architecture boundary.
- [`docs/design/data-model.md`](docs/design/data-model.md) — current and planned DB/data-model contracts.
- [`docs/design/control-engine-contracts.md`](docs/design/control-engine-contracts.md) — CORP/TEMHUM/IRR/VENT/SCRN/SafetyGuard contracts.
- [`docs/design/api-spec.md`](docs/design/api-spec.md) — existing and planned API contract map.
- [`docs/design/home-assistant-integration-contract.md`](docs/design/home-assistant-integration-contract.md) — HA integration/panel/entity/persistent-notification contract.
- [`docs/design/zone-control-roadmap-and-data-model.md`](docs/design/zone-control-roadmap-and-data-model.md) — detailed zone-control/AI/final-target/entity-mapping/execution data model.

## Active workflow

- Hermes: orchestration, planning, security gates, user approval
- Claude Code CLI: architecture, security review, hard root-cause analysis when explicitly used
- Codex CLI / standard terminal-file-git tools: primary implementation and test/fix loop
- Antigravity CLI is not part of the active workflow.

## Public HACS installation model

Green Smart is distributed through the public `whoareyou-l/green_smart` repository so HACS can read repository metadata without private GitHub authentication.

- Product source/release repo: `whoareyou-l/green_smart` public repo
- Recommended customer flow: HACS custom repository → install `Green Smart` integration → restart Home Assistant
- Detailed runbook: [`docs/install/PRIVATE_ACCESS_INSTALL.md`](docs/install/PRIVATE_ACCESS_INSTALL.md)

## Safety boundary

Do not commit Home Assistant runtime data, `.storage`, secrets, tokens, real customer data, production Docker config, or real device credentials.

## Central activation baseline

The current central activation support is a demo/local baseline for connecting the Home Assistant integration to the Greenity central API contract.

- The default central URL is local/demo-oriented, not a managed production cloud promise.
- Do not enter real paid vendor credentials, real customer tokens, or real device secrets unless a supported vendor adapter and operating runbook are explicitly confirmed.
- The generic `/vendor/proxy` endpoint is not exposed by this Home Assistant client. User-facing integrations should use allowlisted adapter endpoints such as the demo status adapter only.
- This baseline adds client/storage/test plumbing; real vendor readiness still requires the first confirmed vendor schema and adapter contract.
