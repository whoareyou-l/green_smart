from pathlib import Path
import subprocess
import json

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-039-sidebar-domain-label-simplification.md"

NEW_LABELS = {
    "irrigation-fertigation": "관수 제어",
    "recommendation-automation": "자동화 제어",
    "safety-history": "안전 제어",
    "settings-admin": "설정",
}
OLD_LABELS = ["관수\u00b7양액", "추천\u00b7자동화", "안전\u00b7이력", "설정\u00b7관리"]


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_039_version_surfaces_are_1_12_74():
    assert '"version": "1.14.35"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.35"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.35"' in _read(REBUILD_PANEL)
    assert "v1.14.35" in _read(DOC)


def test_r7_039_doc_records_label_mapping_and_boundary():
    text = _read(DOC)
    for key, label in NEW_LABELS.items():
        assert key in text
        assert label in text
    assert "Route/domain keys remain unchanged" in text
    assert "No API route change in R7-039" in text


def test_r7_039_source_has_new_sidebar_domain_labels_and_keeps_keys():
    text = _read(REBUILD_PANEL)
    for key, label in NEW_LABELS.items():
        assert key in text
        assert f'label: "{label}"' in text or f'title: "{label}"' in text or f'const settingsTitle = "{label}"' in text
    assert 'const settingsTitle = "설정"' in text
    for old in OLD_LABELS:
        assert old not in text


def test_r7_039_render_smoke_sidebar_and_domain_titles_use_new_labels():
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
      globalThis.document = {{
        body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }},
        getElementById(){{ return null; }},
        createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }},
        head: {{ appendChild(){{}} }}
      }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [] }};
      panel._r7SidebarCollapsed = false;
      const expected = new Map({json.dumps(list(NEW_LABELS.items()), ensure_ascii=False)});
      const oldLabels = {json.dumps(OLD_LABELS, ensure_ascii=False)};
      for (const [key, label] of expected.entries()) {{
        panel._activeR7Domain = key;
        panel.render();
        const html = panel.innerHTML;
        const aside = html.match(/<aside[\\s\\S]*?<\\/aside>/)?.[0] || '';
        const missing = [];
        if (!aside.includes(label)) missing.push(`sidebar:${{key}}:${{label}}`);
        if (!html.includes(`>${{label}}<`) && !html.includes(`aria-label="${{label}}`)) missing.push(`domain:${{key}}:${{label}}`);
        const forbidden = oldLabels.filter((oldLabel) => aside.includes(oldLabel) || html.includes(`>${{oldLabel}}<`) || html.includes(`aria-label="${{oldLabel}}`));
        if (missing.length || forbidden.length) {{
          console.error(JSON.stringify({{key, label, missing, forbidden, sample: html.slice(0, 2400)}}));
          process.exit(1);
        }}
      }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
