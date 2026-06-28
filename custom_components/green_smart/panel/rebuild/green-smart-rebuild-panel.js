// Green Smart from-scratch rebuild panel
// This file starts from crop-centered operation. Legacy UI/features are reference only.

const REBUILD_VERSION = "1.12.0";
const REBUILD_ELEMENT_NAME = "green-smart-rebuild-panel";
const REBUILD_PAGES = Object.freeze([
  { key: "crop-status", label: "작물상태", description: "현재 작물이 어떤 상태인지 먼저 봅니다." },
  { key: "growth-goal", label: "생육목표", description: "오늘 작물이 가야 할 목표를 정리합니다." },
  { key: "influence-map", label: "영향지도", description: "환경·관수·장치가 작물에 주는 영향을 봅니다." },
  { key: "recommend-act", label: "추천·실행", description: "추천을 검토하고 승인 후 실행합니다." },
]);

const REBUILD_ZONE_CONTEXTS = Object.freeze([
  { id: "zone-a", name: "A구역", crop: "토마토", state: "착과·비대 관찰", equipment: ["천창", "측창", "양액기"] },
  { id: "zone-b", name: "B구역", crop: "딸기", state: "개화·수분 관리", equipment: ["보온커튼", "관수밸브", "순환팬"] },
]);

class GreenSmartRebuildPanel extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  renderZoneContexts() {
    return REBUILD_ZONE_CONTEXTS.map((zone) => `
      <article data-zone-context-card data-zone-context-id="${zone.id}" style="border:1px solid #e2eee5;border-radius:16px;background:#ffffff;padding:16px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:800;color:#78927f;">${zone.name}</p>
        <h3 data-zone-context-crop style="margin:0 0 8px;font-size:18px;color:#24323f;">${zone.crop}</h3>
        <p data-zone-context-state style="margin:0 0 10px;color:#5d6f62;line-height:1.6;">${zone.state}</p>
        <p data-zone-context-equipment style="margin:0;color:#31523b;font-size:13px;">구성 장비: ${zone.equipment.join(" · ")}</p>
      </article>
    `).join("");
  }

  renderOperatingHome() {
    return `
      <section data-crop-os-home style="display:grid;gap:14px;">
        <article style="border:1px solid #dcebe0;border-radius:22px;background:linear-gradient(135deg,#ffffff,#f0f8f2);padding:24px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:800;color:#5d7d64;letter-spacing:.08em;text-transform:uppercase;">Crop-centered OS</p>
          <h1 style="margin:0 0 12px;font-size:30px;line-height:1.2;color:#24323f;">작물 중심 운영체계</h1>
          <p style="margin:0;color:#5d6f62;line-height:1.7;">작물이 먼저이고 제어는 그 다음입니다. Green Smart의 새 홈은 기능 목록이 아니라 작물상태 → 생육목표 → 환경·관수·장치 영향 → 추천·실행 흐름으로 시작합니다.</p>
          <p style="margin:14px 0 0;font-size:13px;color:#78927f;">데이터 연결 전 · 새 설계 기준 · 추천은 실행 전 승인과 안전검사를 거칩니다</p>
        </article>
        <section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
          <article data-crop-os-stage="crop-status" style="border:1px solid #e3eee6;border-radius:16px;background:#fff;padding:16px;"><strong>1. 작물상태</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">작물의 현재 생육 상태, 이상 징후, 관찰 필요 지점을 먼저 보여줍니다.</p></article>
          <article data-crop-os-stage="growth-goal" style="border:1px solid #e3eee6;border-radius:16px;background:#fff;padding:16px;"><strong>2. 생육목표</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">오늘 목표 생육 방향과 우선순위를 운영자가 이해할 수 있게 정리합니다.</p></article>
          <article data-crop-os-stage="environment-impact" style="border:1px solid #e3eee6;border-radius:16px;background:#fff;padding:16px;"><strong>3. 환경·관수·장치 영향</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">온도, 습도, 광, 관수, 장치 상태를 작물 영향 관점으로 묶어 보여줍니다.</p></article>
          <article data-crop-os-stage="recommend-act" style="border:1px solid #e3eee6;border-radius:16px;background:#fff;padding:16px;"><strong>4. 추천·실행</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">추천 이유를 확인하고, 승인과 안전검사 후 실행하는 흐름을 둡니다.</p></article>
        </section>
        <section data-crop-os-zone-contexts style="border:1px solid #dcebe0;border-radius:20px;background:#fdfefd;padding:18px;">
          <h2 style="margin:0 0 8px;font-size:20px;color:#24323f;">구역별 작물 운영</h2>
          <p style="margin:0 0 14px;color:#5d6f62;line-height:1.6;">구역마다 작물·상태·장비 구성이 다릅니다. 메인은 작물 중심으로 보되, 세부 판단과 실행은 온실 구역별 context에서 합니다.</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">${this.renderZoneContexts()}</div>
        </section>
      </section>
    `;
  }

  render() {
    const nav = REBUILD_PAGES.map((page) => `<a href="#${page.key}" data-rebuild-nav-key="${page.key}" style="display:inline-flex;padding:8px 10px;border-radius:999px;background:#eef7f0;color:#31523b;text-decoration:none;font-size:13px;font-weight:700;">${page.label}</a>`).join("");
    this.innerHTML = `
      <main data-rebuild-root data-rebuild-blank-page style="min-height:100vh;padding:24px;background:#f7faf7;color:#1f2a24;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <section data-rebuild-empty-shell style="max-width:1080px;margin:0 auto;border:1px dashed #9ab8a4;border-radius:18px;background:#fff;padding:24px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5d7d64;">Green Smart Rebuild</p>
          <h2 style="margin:0 0 10px;font-size:22px;color:#24323f;">레거시를 참고하되, 작물 중심으로 다시 시작합니다</h2>
          <p style="margin:0;color:#5d6f62;line-height:1.6;">기존 UI/기능은 참고 자료입니다. 새 메인 화면은 기능 탭이 아니라 작물 운영 흐름으로 설계합니다.</p>
          <ul style="margin:18px 0 0;padding-left:20px;color:#415346;line-height:1.7;">
            <li data-rebuild-rule="legacy-reference-only">Legacy UI/features are reference only.</li>
            <li data-rebuild-rule="blank-first">Start from blank page/scaffold.</li>
            <li data-rebuild-rule="no-legacy-imports">No legacy panel module imports.</li>
            <li data-rebuild-rule="explicit-cutover-gate">No production cutover without explicit approval.</li>
          </ul>
          <nav data-rebuild-shell-nav style="display:flex;flex-wrap:wrap;gap:8px;margin-top:20px;">${nav}</nav>
        </section>
        <section data-rebuild-shell-main style="max-width:1080px;margin:18px auto 0;">${this.renderOperatingHome()}</section>
        <div data-rebuild-version="${REBUILD_VERSION}" style="max-width:1080px;margin:18px auto 0;font-size:12px;color:#78927f;">rebuild scaffold ${REBUILD_VERSION}</div>
      </main>
    `;
  }
}

if (!customElements.get(REBUILD_ELEMENT_NAME)) {
  customElements.define(REBUILD_ELEMENT_NAME, GreenSmartRebuildPanel);
}

export { GreenSmartRebuildPanel, REBUILD_ELEMENT_NAME, REBUILD_PAGES, REBUILD_VERSION, REBUILD_ZONE_CONTEXTS };
