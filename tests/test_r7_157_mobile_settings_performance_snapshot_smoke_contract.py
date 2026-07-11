import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-11-mobile-settings-performance-snapshot-smoke-plan.md"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_23_declares_perf_snapshot_summary_and_self_smoke_helpers():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.37"' in text
    for marker in [
        'this._r7SettingsPerf = { eventKind: "idle", startedAt: 0, samples: {} };',
        '_snapshotR7SettingsPerf()',
        '_updateR7SettingsPerfSnapshot()',
        '_runR7SettingsPerfMarkerSmoke()',
        'data-r7-perf-settings-summary',
        'data-r7-perf-settings-snapshot-json',
        'data-r7-perf-settings-snapshot-updated',
        'data-r7-perf-settings-self-smoke',
        'all-under-sla',
        'has-over-sla',
        'no-samples',
    ]:
        assert marker in text


def test_v1_15_23_record_helper_updates_snapshot_after_every_sample():
    text = source()
    block = text[text.index('_recordR7SettingsPerf(label, targetMs = 2000)'):text.index('_snapshotR7SettingsPerf()', text.index('_recordR7SettingsPerf(label, targetMs = 2000)'))]
    assert 'this._r7SettingsPerf.samples[label]' in block
    assert 'this._updateR7SettingsPerfSnapshot();' in block


def test_v1_15_23_plan_documents_snapshot_smoke_scope():
    plan = PLAN.read_text()
    for marker in ['성능 snapshot/smoke 계획', '_snapshotR7SettingsPerf()', '_runR7SettingsPerfMarkerSmoke()', 'GitHub Release v1.15.37']:
        assert marker in plan


def test_v1_15_23_node_self_smoke_returns_all_under_sla_snapshot():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', dataset: {{}}, style: {{}}, textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.performance = {{ now: () => 1 }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._attrs = new Map(); }} setAttribute(k,v){{ this._attrs.set(k, String(v)); }} getAttribute(k){{ return this._attrs.get(k) || ''; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const snapshot = panel._runR7SettingsPerfMarkerSmoke();
      console.log(JSON.stringify({{
        summary: snapshot.summary,
        selfSmoke: panel.getAttribute('data-r7-perf-settings-self-smoke'),
        json: panel.getAttribute('data-r7-perf-settings-snapshot-json'),
        complete: panel.getAttribute('data-r7-perf-settings-interaction-complete-sla')
      }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr
    data = json.loads(result.stdout)
    assert data["summary"] == "all-under-sla"
    assert data["selfSmoke"] == "ok"
    assert data["complete"] == "under-2000ms"
    parsed = json.loads(data["json"])
    assert parsed["summary"] == "all-under-sla"
    assert "interaction-complete" in parsed["recorded"]
