// Green Smart rebuild panel
// Developer-only rebuild notes belong in docs/rebuild/*, not in rendered UI copy.

const REBUILD_VERSION = "1.12.1";
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

const REBUILD_STAGE_DETAILS = Object.freeze({
  "crop-status": {
    title: "구역별 작물상태",
    summary: (zone) => `${zone.crop} · ${zone.state}`,
    detail: (zone) => `${zone.name}의 현재 작물과 생육 관찰 포인트를 확인합니다.`,
  },
  "growth-goal": {
    title: "구역별 생육목표",
    summary: (zone) => `${zone.crop} 목표 조정`,
    detail: (zone) => `${zone.name}의 작물 상태에 맞춰 오늘의 생육 목표를 따로 봅니다.`,
  },
  "environment-impact": {
    title: "구역별 환경·관수·장치 영향",
    summary: (zone) => zone.equipment.join(" · "),
    detail: (zone) => `${zone.name}의 장비 구성과 데이터 상태를 기준으로 작물 영향을 확인합니다.`,
  },
  "recommend-act": {
    title: "구역별 추천·실행 검토",
    summary: (zone) => `${zone.name} 승인 전 검토`,
    detail: (zone) => `${zone.name} 추천은 승인과 안전검사를 거친 뒤 실행 후보로 봅니다.`,
  },
});

class GreenSmartRebuildPanel extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  renderZoneDrilldown(stageKey) {
    const config = REBUILD_STAGE_DETAILS[stageKey];
    return `
      <div data-crop-os-stage-zone-detail data-zone-detail-stage="${stageKey}" style="margin-top:14px;border-top:1px solid #edf4ef;padding-top:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;">
          <strong style="font-size:13px;color:#31523b;">${config.title}</strong>
          <span style="font-size:12px;color:#78927f;">전체 · A구역 · B구역</span>
        </div>
        <div data-zone-detail-tabs style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;">
          <button data-zone-tab="all" data-zone-detail-tab="all" style="flex:0 0 auto;border:1px solid #d7e8db;border-radius:999px;background:#eef7f0;color:#31523b;padding:7px 10px;font-weight:800;">전체</button>
          ${REBUILD_ZONE_CONTEXTS.map((zone) => `
            <article data-zone-context-card data-zone-context-id="${zone.id}" style="flex:0 0 210px;border:1px solid #e2eee5;border-radius:14px;background:#ffffff;padding:12px;">
              <button data-zone-tab="${zone.id}" data-zone-detail-tab="${zone.id}" style="border:0;background:transparent;padding:0;margin:0 0 6px;font-size:12px;font-weight:800;color:#78927f;">${zone.name}</button>
              <h4 data-zone-context-crop style="margin:0 0 6px;font-size:15px;color:#24323f;">${config.summary(zone)}</h4>
              <p data-zone-context-state style="margin:0 0 8px;color:#5d6f62;font-size:13px;line-height:1.5;">${config.detail(zone)}</p>
              <p data-zone-context-equipment style="margin:0;color:#31523b;font-size:12px;">장비: ${zone.equipment.join(" · ")}</p>
              <button data-zone-detail-modal-button="${zone.id}" style="margin-top:10px;border:1px solid #cfe3d4;border-radius:999px;background:#f8fcf9;color:#31523b;padding:6px 10px;font-size:12px;font-weight:800;">구역 상세</button>
            </article>
          `).join("")}
        </div>
      </div>
    `;
  }

  renderOperatingHome() {
    return `
      <section data-crop-os-home style="display:grid;gap:14px;">
        <article style="border:1px solid #dcebe0;border-radius:22px;background:linear-gradient(135deg,#ffffff,#f0f8f2);padding:24px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:800;color:#5d7d64;letter-spacing:.08em;text-transform:uppercase;">Crop-centered OS</p>
          <h1 style="margin:0 0 12px;font-size:30px;line-height:1.2;color:#24323f;">작물 중심 운영체계</h1>
          <p style="margin:0;color:#5d6f62;line-height:1.7;">작물이 먼저이고 제어는 그 다음입니다. 작물상태 → 생육목표 → 환경·관수·장치 영향 → 추천·실행 흐름으로 오늘의 운영 판단을 정리합니다.</p>
          <p style="margin:14px 0 0;font-size:13px;color:#78927f;">구역별 세부 정보는 각 단계 안에서 탭·좌우 스크롤·상세 보기로 확인합니다 · 추천은 실행 전 승인과 안전검사를 거칩니다</p>
        </article>
        <section data-crop-os-flow-stages style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">
          <article data-crop-os-stage="crop-status" style="border:1px solid #e3eee6;border-radius:16px;background:#fff;padding:16px;"><strong>1. 작물상태</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">작물의 현재 생육 상태, 이상 징후, 관찰 필요 지점을 먼저 보여줍니다.</p>${this.renderZoneDrilldown("crop-status")}</article>
          <article data-crop-os-stage="growth-goal" style="border:1px solid #e3eee6;border-radius:16px;background:#fff;padding:16px;"><strong>2. 생육목표</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">오늘 목표 생육 방향과 우선순위를 운영자가 이해할 수 있게 정리합니다.</p>${this.renderZoneDrilldown("growth-goal")}</article>
          <article data-crop-os-stage="environment-impact" style="border:1px solid #e3eee6;border-radius:16px;background:#fff;padding:16px;"><strong>3. 환경·관수·장치 영향</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">온도, 습도, 광, 관수, 장치 상태를 작물 영향 관점으로 묶어 보여줍니다.</p>${this.renderZoneDrilldown("environment-impact")}</article>
          <article data-crop-os-stage="recommend-act" style="border:1px solid #e3eee6;border-radius:16px;background:#fff;padding:16px;"><strong>4. 추천·실행</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">추천 이유를 확인하고, 승인과 안전검사 후 실행하는 흐름을 둡니다.</p>${this.renderZoneDrilldown("recommend-act")}</article>
        </section>
      </section>
    `;
  }

  render() {
    const nav = REBUILD_PAGES.map((page) => `<a href="#${page.key}" data-rebuild-nav-key="${page.key}" style="display:inline-flex;padding:8px 10px;border-radius:999px;background:#eef7f0;color:#31523b;text-decoration:none;font-size:13px;font-weight:700;">${page.label}</a>`).join("");
    this.innerHTML = `
      <main data-rebuild-root data-rebuild-blank-page style="min-height:100vh;padding:24px;background:#f7faf7;color:#1f2a24;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <section data-rebuild-empty-shell style="max-width:1080px;margin:0 auto;border:1px solid #dcebe0;border-radius:18px;background:#fff;padding:24px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5d7d64;">Green Smart</p>
          <h2 style="margin:0 0 10px;font-size:22px;color:#24323f;">오늘의 작물 운영을 먼저 확인합니다</h2>
          <p style="margin:0;color:#5d6f62;line-height:1.6;">작물 상태와 목표를 기준으로 환경·관수·장치 영향을 함께 보고, 구역별 상세는 각 단계 안에서 확인합니다.</p>
          <nav data-rebuild-shell-nav style="display:flex;flex-wrap:wrap;gap:8px;margin-top:20px;">${nav}</nav>
        </section>
        <section data-rebuild-shell-main style="max-width:1080px;margin:18px auto 0;">${this.renderOperatingHome()}</section>
        <div data-rebuild-version="${REBUILD_VERSION}" style="max-width:1080px;margin:18px auto 0;font-size:12px;color:#78927f;">Green Smart ${REBUILD_VERSION}</div>
      </main>
    `;
  }
}

if (!customElements.get(REBUILD_ELEMENT_NAME)) {
  customElements.define(REBUILD_ELEMENT_NAME, GreenSmartRebuildPanel);
}

export { GreenSmartRebuildPanel, REBUILD_ELEMENT_NAME, REBUILD_PAGES, REBUILD_VERSION, REBUILD_ZONE_CONTEXTS, REBUILD_STAGE_DETAILS };
