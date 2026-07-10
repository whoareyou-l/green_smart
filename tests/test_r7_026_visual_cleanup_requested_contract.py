from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-026-browser-qa-visual-cleanup.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_026_version_surfaces_are_1_12_60():
    assert '"version": "1.15.03"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.03"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.03"' in _read(REBUILD_PANEL)
    assert "v1.15.03" in _read(DOC)


def test_r7_026_doc_records_user_requested_visual_cleanup():
    text = _read(DOC)
    for phrase in (
        "상단 네비게이션바 제거",
        "왼쪽 사이드바가 있으므로 중복 상단 nav를 렌더하지 않는다",
        "그린 스마트 운영 화면 카드 제거",
        "현재 화면 카드 제거",
        "manual-first read-only domain 블록은 제품 화면에서 제거하고 문서/계약 evidence로만 유지",
        "No API route change in R7-026",
        "No DB migration in R7-026",
        "No HA service call in R7-026",
    ):
        assert phrase in text


def test_r7_026_source_removes_duplicate_top_navigation_and_headers():
    text = _read(REBUILD_PANEL)
    forbidden_source = (
        "renderR7MobileNav()",
        "data-r7-mobile-nav",
        "data-rebuild-shell-nav",
        "data-rebuild-empty-shell",
        "data-r7-page-header",
        "Green Smart 운영 화면",
        "현재 화면",
        "manual-first read-only domain",
        "data-r7-domain-layer-summary",
        "data-r7-subpage-evidence-summary",
        "data-r7-subpage-source-freshness",
        "data-r7-subpage-zone-scope",
        "data-r7-subpage-safety-boundary",
    )
    for marker in forbidden_source:
        assert marker not in text


def test_r7_026_render_smoke_uses_left_sidebar_only_and_no_doc_blocks():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-026-cleanup-smoke', zones: [{{ zoneId: 'zone-1', zoneName: '1구역', currentCrop: {{ cropLabelKo: '토마토' }}, dataAvailability: {{ state: 'fresh' }} }}] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('crop-operations');
      const html = panel.innerHTML;
      const required = [
        'data-r7-sidebar',
        'data-r7-sidebar-target="crop-operations"',
        'data-r7-crop-zone-visual="true"',
        'data-r7-domain-subtabs',
        'data-r7-zone-context-bar'
      ];
      for (const item of required) {{
        if (!html.includes(item)) {{ console.error('missing ' + item); process.exit(1); }}
      }}
      const forbidden = [
        'data-r7-mobile-nav',
        'data-rebuild-shell-nav',
        'data-rebuild-empty-shell',
        'data-r7-page-header',
        'Green Smart 운영 화면',
        '현재 화면',
        'manual-first read-only domain',
        'Manual/Base',
        'Rule/Schedule',
        'AI Assist',
        'Safety Final',
        'Source freshness:',
        'Zone scope:',
        'Safety/interlock boundary:',
        '작물별 기준 범위와 생육목표',
        '작기 상태/기록 기반 read-only workflow'
      ];
      for (const item of forbidden) {{
        if (html.includes(item)) {{ console.error('forbidden ' + item); process.exit(2); }}
      }}
      console.log(JSON.stringify({{render_ok:true, len: html.length}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
