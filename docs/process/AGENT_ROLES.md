# Agent Roles for green_smart

Status: Draft

## Hermes
- Runs intake and deep interview.
- Reduces ambiguity before implementation.
- Maintains security gates and prod/dev/sandbox boundaries.
- Assigns work to Claude Code CLI, Codex CLI, and Antigravity CLI.
- Requires user approval before production deployment or credential changes.

## Claude Code CLI
Use for high-value reasoning only:
- Architecture design and review
- Security/privacy review
- Safety-critical control logic review
- Repeated failure root-cause analysis
- Final release review

Do not use Claude for routine lint fixes, boilerplate, or every Ralph loop round.

## Codex CLI
Primary implementation agent:
- Write tests
- Implement backend and Home Assistant integration changes
- Fix pytest/HA integration failures
- Execute bounded build/test/fix loops in dev worktrees

## Antigravity CLI
Frontend and independent reviewer:
- Sidebar UI and UX flows
- Installation/troubleshooting docs
- Alternative implementation review
- Edge-case review
