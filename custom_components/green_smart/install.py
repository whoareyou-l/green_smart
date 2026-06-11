#!/usr/bin/env python3
"""Register Green Smart in Home Assistant (official ConfigFlow REST API).

Usage:
  python3 install.py [ha_url] [long_lived_token]

Examples:
  python3 install.py http://192.168.1.100:8123 eyJ...
  python3 install.py http://homeassistant.local:8123

Long-Lived Token: HA Profile -> Security -> Long-Lived Access Tokens -> Create.

How it works (official HA mechanism, same as HACS uses):
  1. POST /api/config/config_entries/flow  {"handler": "green_smart"}
  2. HA calls async_setup_entry -> panel_custom registers sidebar panel
  3. "Green Smart" appears in sidebar without restart.
"""

from __future__ import annotations

import argparse
import getpass
import json
import sys
import urllib.error
import urllib.request
from typing import Any

DEFAULT_HA_URL = "http://homeassistant.local:8123"


def _request(
    ha_url: str,
    token: str,
    method: str,
    path: str,
    body: dict[str, Any] | None = None,
) -> Any:
    url = f"{ha_url.rstrip('/')}{path}"
    data = json.dumps(body).encode() if body is not None else (b"{}" if method == "POST" else None)
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            return json.loads(raw.decode()) if raw else None
    except urllib.error.HTTPError as err:
        detail = err.read().decode(errors="replace")
        raise RuntimeError(f"HTTP {err.code}: {detail or err.reason}") from err
    except urllib.error.URLError as err:
        raise RuntimeError(str(err.reason)) from err


def _get_green_smart_entry(ha_url: str, token: str) -> dict[str, Any] | None:
    entries = _request(ha_url, token, "GET", "/api/config/config_entries/entry") or []
    return next((e for e in entries if e.get("domain") == "green_smart"), None)


def _print_entry_status(ha_url: str, token: str) -> None:
    entry = _get_green_smart_entry(ha_url, token)
    if entry is None:
        print("Entry was not created. Check HA logs if sidebar is not visible.")
        return

    state = entry.get("state", "unknown")
    if state == "loaded":
        print("Green Smart panel is active. Check your HA sidebar.")
    elif state == "setup_error":
        print("Entry created (state: setup_error). Check HA logs for setup failure details.")
    elif state == "not_loaded":
        print("Entry created but not loaded yet. Check HA logs.")
    else:
        print(f"Entry created (state: {state}). Check HA logs if sidebar is not visible.")


def register_green_smart(ha_url: str, token: str) -> None:
    if _get_green_smart_entry(ha_url, token):
        _print_entry_status(ha_url, token)
        return

    # Start ConfigFlow (official REST API)
    flow = _request(ha_url, token, "POST",
                    "/api/config/config_entries/flow",
                    {"handler": "green_smart"})
    flow_type = flow.get("type")

    if flow_type == "create_entry":
        _print_entry_status(ha_url, token)
        return

    if flow_type == "abort":
        reason = flow.get("reason", "unknown")
        if reason == "already_configured":
            _print_entry_status(ha_url, token)
            return
        if reason == "use_panel_wizard":
            raise RuntimeError(
                "Flow aborted with use_panel_wizard. Update green_smart to v1.3.5 or newer."
            )
        raise RuntimeError(f"Flow aborted: {reason}")

    if flow_type == "form":
        # Complete the form step (wizard runs inside the panel, not here)
        flow_id = flow["flow_id"]
        result = _request(ha_url, token, "POST",
                          f"/api/config/config_entries/flow/{flow_id}",
                          {})
        result_type = result.get("type")
        if result_type == "create_entry":
            _print_entry_status(ha_url, token)
            return
        if result_type == "abort":
            reason = result.get("reason", "unknown")
            if reason == "already_configured":
                _print_entry_status(ha_url, token)
                return
            if reason == "use_panel_wizard":
                raise RuntimeError(
                    "Flow aborted with use_panel_wizard. Update green_smart to v1.3.5 or newer."
                )
            raise RuntimeError(f"Flow aborted: {reason}")
        raise RuntimeError(f"Unexpected flow result: {result_type}")

    raise RuntimeError(f"Unexpected flow type: {flow_type}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Register Green Smart in Home Assistant.",
        epilog="Create a Long-Lived Token at: HA Profile -> Security -> Long-Lived Access Tokens.",
    )
    parser.add_argument("ha_url", nargs="?", default=DEFAULT_HA_URL,
                        help=f"HA URL (default: {DEFAULT_HA_URL})")
    parser.add_argument("token", nargs="?", help="Long-Lived Access Token")
    args = parser.parse_args(argv)

    token = args.token
    if not token:
        if not sys.stdin.isatty():
            print("ERROR: token required (non-interactive mode).", file=sys.stderr)
            return 2
        token = getpass.getpass("HA Long-Lived Token: ").strip()
    if not token:
        print("ERROR: token is required.", file=sys.stderr)
        return 2

    try:
        register_green_smart(args.ha_url, token)
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
