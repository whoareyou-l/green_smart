# green_smart

Home Assistant custom integration and sidebar panel for Green Smart greenhouse management.

## Status

This repository is the active product repository for the `green_smart` Home Assistant custom integration.
Paperclip-era documents are historical only and are not part of the active workflow.

## Active workflow

- Hermes: orchestration, planning, security gates, user approval
- Claude Code CLI: architecture, security review, hard root-cause analysis
- Codex CLI: primary implementation and test/fix loop
- Antigravity CLI: frontend, UX, documentation, independent review

## Public HACS installation model

Green Smart is distributed through the public `whoareyou-l/green_smart` repository so HACS can read repository metadata without private GitHub authentication.

- Product source/release repo: `whoareyou-l/green_smart` public repo
- Recommended customer flow: HACS custom repository → install `Green Smart` integration → restart Home Assistant
- Detailed runbook: [`docs/install/PRIVATE_ACCESS_INSTALL.md`](docs/install/PRIVATE_ACCESS_INSTALL.md)

## Safety boundary

Do not commit Home Assistant runtime data, `.storage`, secrets, tokens, real customer data, production Docker config, or real device credentials.
