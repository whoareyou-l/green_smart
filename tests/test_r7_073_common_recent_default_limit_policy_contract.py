from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-073-common-recent-default-limit-policy.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_common_recent_without_explicit_limit():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const rows = Array.from({{ length: 7 }}, (_, i) => ({{
        kind: `기록${{i+1}}`, at: `2026-06-30 0${{i}}:00`, memo: `메모${{i+1}}`, state: '정상', icon: 'mdi:clipboard-text-outline', tone: 'green'
      }}));
      const html = panel.renderR7CommonRecentPanel({{ kind: 'records-recent-log', title: '최근 기록', rows, rowKind: 'records-recent' }});
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def _render_records_workflow_with_many_recent_rows():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const recentRows = Array.from({{ length: 7 }}, (_, i) => ({{
        kind: `생육조사${{i+1}}`, at: `2026-06-30 0${{i}}:00`, memo: `초장 ${{18+i}}cm`, state: 'fresh', icon: 'mdi:sprout-outline', tone: 'green'
      }}));
      const ctx = {{
        pestScouting: {{ count: 1, latestLabel: '2026-06-29 · 진딧물 낮음', staleState: 'fresh' }},
        controlTreatment: {{ count: 1, latestLabel: '2026-06-30 · PHI 3일 남음', staleState: 'fresh', latest: {{ pesticides: [{{ pls: true }}] }} }},
        growthSurvey: {{ count: 1, latestLabel: '2026-06-30 · 초장 18cm', staleState: 'fresh' }},
        seasonId: '7', missingItems: [], recentRows
      }};
      const html = panel.renderR7RecordsWorkflowProductLayout(ctx);
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_073_version_surfaces_are_1_13_8():
    assert '"version": "1.14.24"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.24"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.24"' in _read(REBUILD_PANEL)


def test_r7_073_common_recent_panel_has_default_limit_policy():
    source = _read(REBUILD_PANEL)
    assert 'r7CommonRecentDefaultLimit(' in source
    assert 'const effectiveLimit = Number.isFinite(limit) ? limit : this.r7CommonRecentDefaultLimit(kind, rowKind);' in source
    assert 'records-recent' in source
    assert 'settings-user' in source


def test_r7_073_common_card_body_is_not_record_only_between_header_and_buttons():
    source = _read(REBUILD_PANEL)
    assert 'renderR7CommonCardBody(' in source
    shell_match = re.search(r'renderR7CommonCardShell\([^\n]*\) \{(?P<body>.*?)\n  \}', source, flags=re.S)
    assert shell_match
    shell_body = shell_match.group('body')
    assert 'this.renderR7CommonCardBody({ primary, note, html, tone })' in shell_body
    assert 'this.renderR7RecordCardBody({ primary, note, html, tone })' not in shell_body
    record_body_match = re.search(r'renderR7RecordCardBody\([^\n]*\) \{(?P<body>.*?)\n  \}', source, flags=re.S)
    assert record_body_match
    assert 'return this.renderR7CommonCardBody({ primary, note, html, tone });' in record_body_match.group('body')


def test_r7_073_common_recent_without_limit_defaults_to_latest_five():
    html = _render_common_recent_without_explicit_limit()
    assert 'data-r7-common-data-limit="5"' in html
    assert html.count('data-r7-common-recent-row="records-recent"') == 5
    assert '기록1' in html and '기록5' in html
    assert '기록6' not in html and '기록7' not in html


def test_r7_073_crop_records_recent_uses_default_limit_without_callsite_limit():
    source = _read(REBUILD_PANEL)
    match = re.search(r'renderR7RecentRecordPanel\(recentRows = \[\]\) \{(?P<body>.*?)\n  \}', source, flags=re.S)
    assert match
    wrapper = match.group('body')
    assert 'limit:' not in wrapper
    html = _render_records_workflow_with_many_recent_rows()
    assert 'data-r7-common-data-limit="5"' in html
    assert html.count('data-r7-common-recent-row="records-recent"') == 5
    assert '생육조사1' in html and '생육조사5' in html
    assert '생육조사6' not in html and '생육조사7' not in html


def test_r7_073_documented():
    doc = _read(DOC)
    for phrase in ['공통 컴포넌트 기본 limit 정책', '최근 기록', '사용자 목록', '호출부에서 limit을 넘기지 않아도', 'override']:
        assert phrase in doc
