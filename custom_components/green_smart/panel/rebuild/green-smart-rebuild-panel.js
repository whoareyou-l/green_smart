// Green Smart rebuild panel
// Developer-only rebuild notes belong in docs/rebuild/*, not in rendered UI copy.

const REBUILD_VERSION = "1.12.2";
const REBUILD_ELEMENT_NAME = "green-smart-rebuild-panel";
const REBUILD_PAGES = Object.freeze([
  { key: "crop-status", label: "작물상태", description: "현재 작물이 어떤 상태인지 먼저 봅니다." },
  { key: "growth-goal", label: "생육목표", description: "오늘 작물이 가야 할 목표를 정리합니다." },
  { key: "influence-map", label: "영향지도", description: "환경·관수·장치가 작물에 주는 영향을 봅니다." },
  { key: "recommend-act", label: "추천·실행", description: "추천을 검토하고 승인 후 실행합니다." },
]);

const REBUILD_ZONE_CONTEXTS = Object.freeze([
  { id: "all", name: "전체", crop: "전체 작물", state: "전체 구역 요약", equipment: ["구역별 장비 요약"] },
  { id: "zone-a", name: "A구역", crop: "토마토", state: "착과·비대 관찰", equipment: ["천창", "측창", "양액기"] },
  { id: "zone-b", name: "B구역", crop: "딸기", state: "개화·수분 관리", equipment: ["보온커튼", "관수밸브", "순환팬"] },
]);

const REBUILD_STAGE_DETAILS = Object.freeze({
  "crop-status": {
    title: "구역별 작물상태",
    summary: (zone) => zone.id === "all" ? "전체 구역의 작물 상태를 한 번에 봅니다." : `${zone.crop} · ${zone.state}`,
    detail: (zone) => zone.id === "all" ? "전체 구역의 이상 징후와 관찰 우선순위를 요약합니다." : `${zone.name}의 현재 작물과 생육 관찰 포인트를 확인합니다.`,
    metric: (zone) => zone.id === "all" ? "구역별 편차 확인" : "관찰 필요 지점",
  },
  "growth-goal": {
    title: "구역별 생육목표",
    summary: (zone) => zone.id === "all" ? "전체 작물 목표를 먼저 정렬합니다." : `${zone.crop} 목표 조정`,
    detail: (zone) => zone.id === "all" ? "전체 목표를 본 뒤 필요한 구역만 탭으로 좁혀봅니다." : `${zone.name}의 작물 상태에 맞춰 오늘의 생육 목표를 따로 봅니다.`,
    metric: (zone) => zone.id === "all" ? "목표 우선순위" : "구역 목표",
  },
  "environment-impact": {
    title: "구역별 환경·관수·장치 영향",
    summary: (zone) => zone.id === "all" ? "전체 환경·관수·장치 영향 요약" : zone.equipment.join(" · "),
    detail: (zone) => zone.id === "all" ? "전체 구역의 영향 차이를 요약하고 편차가 큰 구역을 찾습니다." : `${zone.name}의 장비 구성과 데이터 상태를 기준으로 작물 영향을 확인합니다.`,
    metric: (zone) => zone.id === "all" ? "영향 편차" : "구역 장비 영향",
  },
  "recommend-act": {
    title: "구역별 추천·실행 검토",
    summary: (zone) => zone.id === "all" ? "전체 추천을 검토하고 구역별 실행 후보를 나눕니다." : `${zone.name} 승인 전 검토`,
    detail: (zone) => zone.id === "all" ? "추천은 전체 방향을 먼저 확인한 뒤 구역별로 승인·안전검사를 거칩니다." : `${zone.name} 추천은 승인과 안전검사를 거친 뒤 실행 후보로 봅니다.`,
    metric: (zone) => zone.id === "all" ? "승인 전 검토" : "구역 실행 후보",
  },
});

class GreenSmartRebuildPanel extends HTMLElement {
  constructor() {
    super();
    this._selectedZoneId = Object.fromEntries(Object.keys(REBUILD_STAGE_DETAILS).map((stageKey) => [stageKey, "all"]));
  }

  connectedCallback() {
    this.render();
  }

  renderZoneTabs(stageKey) {
    const selectedZoneId = this._selectedZoneId[stageKey] || "all";
    return `
      <div data-cba-component="COM-ZoneTabs" data-zone-tablist data-zone-tab-stage="${stageKey}" role="tablist" aria-label="${REBUILD_STAGE_DETAILS[stageKey].title}" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;">
        ${REBUILD_ZONE_CONTEXTS.map((zone) => {
          const selected = zone.id === selectedZoneId;
          return `<button
            type="button"
            role="tab"
            aria-selected="${selected}"
            aria-controls="zone-panel-${stageKey}-${zone.id}"
            id="zone-tab-${stageKey}-${zone.id}"
            data-zone-tab
            data-zone-tab-stage="${stageKey}"
            data-zone-tab-id="${zone.id}"
            style="border:1px solid ${selected ? "#78a87e" : "#d7e8db"};border-radius:999px;background:${selected ? "#e3f4e6" : "#f8fcf9"};color:#31523b;padding:8px 12px;font-weight:800;cursor:pointer;"
          >${zone.name}</button>`;
        }).join("")}
      </div>
    `;
  }

  renderZonePanel(stageKey) {
    const config = REBUILD_STAGE_DETAILS[stageKey];
    const selectedZoneId = this._selectedZoneId[stageKey] || "all";
    return `
      <div data-cba-component="COM-ZonePanel" data-zone-panels data-zone-panel-stage="${stageKey}" data-active-zone-id="${selectedZoneId}" style="margin-top:12px;">
        ${REBUILD_ZONE_CONTEXTS.map((zone) => {
          const selected = zone.id === selectedZoneId;
          return `<section
            data-zone-panel
            data-zone-panel-stage="${stageKey}"
            data-zone-panel-id="${zone.id}"
            role="tabpanel"
            aria-labelledby="zone-tab-${stageKey}-${zone.id}"
            id="zone-panel-${stageKey}-${zone.id}"
            ${selected ? "" : "hidden"}
            style="border:1px solid #e2eee5;border-radius:14px;background:#ffffff;padding:14px;"
          >
            <p style="margin:0 0 6px;font-size:12px;font-weight:800;color:#78927f;">${zone.name}</p>
            <h4 data-zone-context-crop style="margin:0 0 8px;font-size:16px;color:#24323f;">${config.summary(zone)}</h4>
            <p data-zone-context-state style="margin:0 0 10px;color:#5d6f62;font-size:13px;line-height:1.6;">${config.detail(zone)}</p>
            <dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;margin:0;color:#31523b;font-size:12px;">
              <dt style="font-weight:800;">기준</dt><dd style="margin:0;">${config.metric(zone)}</dd>
              <dt style="font-weight:800;">장비</dt><dd data-zone-context-equipment style="margin:0;">${zone.equipment.join(" · ")}</dd>
            </dl>
            <button type="button" data-zone-detail-modal-button data-zone-detail-stage="${stageKey}" data-zone-detail-zone-id="${zone.id}" style="margin-top:12px;border:1px solid #cfe3d4;border-radius:999px;background:#f8fcf9;color:#31523b;padding:7px 11px;font-size:12px;font-weight:800;cursor:pointer;">구역 상세</button>
          </section>`;
        }).join("")}
      </div>
    `;
  }

  renderZoneDrilldown(stageKey) {
    const config = REBUILD_STAGE_DETAILS[stageKey];
    return `
      <div data-cba-component="MOD-CropStageZoneDetail" data-crop-os-stage-zone-detail data-zone-detail-stage="${stageKey}" style="margin-top:14px;border-top:1px solid #edf4ef;padding-top:12px;">
        <strong style="font-size:13px;color:#31523b;">${config.title}</strong>
        <p style="margin:6px 0 0;color:#78927f;font-size:12px;line-height:1.5;">구역 탭으로 필요한 구역만 선택해 봅니다. 전체 내용을 펼쳐 스크롤하지 않습니다.</p>
        ${this.renderZoneTabs(stageKey)}
        ${this.renderZonePanel(stageKey)}
      </div>
    `;
  }

  _bindZoneTabs() {
    this.querySelectorAll("[data-zone-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        this._setSelectedZone(button.dataset.zoneTabStage, button.dataset.zoneTabId);
      });
    });
    this.querySelectorAll("[data-zone-detail-modal-button]").forEach((button) => {
      button.addEventListener("click", () => {
        this._openZoneDetailModal(button.dataset.zoneDetailStage, button.dataset.zoneDetailZoneId);
      });
    });
    this.querySelectorAll("[data-zone-detail-modal-close]").forEach((button) => {
      button.addEventListener("click", () => this._closeZoneDetailModal());
    });
    const modal = this.querySelector("[data-zone-detail-modal]");
    if (modal) {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) this._closeZoneDetailModal();
      });
    }
    this.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this._closeZoneDetailModal();
    });
  }

  _setSelectedZone(stageKey, zoneId) {
    this._selectedZoneId[stageKey] = zoneId;
    const panelsRoot = this.querySelector(`[data-zone-panel-stage="${stageKey}"][data-zone-panels]`);
    if (panelsRoot) panelsRoot.dataset.activeZoneId = zoneId;
    this.querySelectorAll(`[data-zone-tab-stage="${stageKey}"][data-zone-tab]`).forEach((button) => {
      const selected = button.dataset.zoneTabId === zoneId;
      button.setAttribute("aria-selected", String(selected));
      button.style.borderColor = selected ? "#78a87e" : "#d7e8db";
      button.style.background = selected ? "#e3f4e6" : "#f8fcf9";
    });
    this.querySelectorAll(`[data-zone-panel-stage="${stageKey}"][data-zone-panel]`).forEach((panel) => {
      panel.hidden = panel.dataset.zonePanelId !== zoneId;
    });
  }

  _openZoneDetailModal(stageKey, zoneId) {
    const zone = REBUILD_ZONE_CONTEXTS.find((item) => item.id === zoneId) || REBUILD_ZONE_CONTEXTS[0];
    const config = REBUILD_STAGE_DETAILS[stageKey];
    const modal = this.querySelector("[data-zone-detail-modal]");
    if (!modal || !config) return;
    modal.dataset.zoneDetailStage = stageKey;
    modal.dataset.zoneDetailZoneId = zone.id;
    modal.querySelector("[data-zone-detail-modal-title]").textContent = `${config.title} · ${zone.name}`;
    modal.querySelector("[data-zone-detail-modal-body]").innerHTML = `
      <p style="margin:0 0 10px;color:#5d6f62;line-height:1.6;">${config.detail(zone)}</p>
      <p style="margin:0 0 8px;color:#24323f;font-weight:800;">${config.summary(zone)}</p>
      <p style="margin:0;color:#31523b;font-size:13px;">장비: ${zone.equipment.join(" · ")}</p>
    `;
    modal.hidden = false;
    document.body.classList.add("gs-modal-open");
    modal.querySelector("[data-zone-detail-modal-close]")?.focus();
  }

  _closeZoneDetailModal() {
    const modal = this.querySelector("[data-zone-detail-modal]");
    if (modal) modal.hidden = true;
    document.body.classList.remove("gs-modal-open");
  }

  renderOperatingHome() {
    return `
      <section data-cba-page="PAGE-CropCenteredHome" data-crop-os-home style="display:grid;gap:14px;">
        <article style="border:1px solid #dcebe0;border-radius:22px;background:linear-gradient(135deg,#ffffff,#f0f8f2);padding:24px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:800;color:#5d7d64;letter-spacing:.08em;text-transform:uppercase;">Crop-centered OS</p>
          <h1 style="margin:0 0 12px;font-size:30px;line-height:1.2;color:#24323f;">작물 중심 운영체계</h1>
          <p style="margin:0;color:#5d6f62;line-height:1.7;">작물이 먼저이고 제어는 그 다음입니다. 작물상태 → 생육목표 → 환경·관수·장치 영향 → 추천·실행 흐름으로 오늘의 운영 판단을 정리합니다.</p>
          <p style="margin:14px 0 0;font-size:13px;color:#78927f;">구역별 세부 정보는 각 단계 안에서 탭으로 필요한 구역만 선택해 확인합니다 · 추천은 실행 전 승인과 안전검사를 거칩니다</p>
        </article>
        <section data-crop-os-flow-stages style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">
          <article data-crop-os-stage="crop-status" style="border:1px solid #e3eee6;border-radius:16px;background:#fff;padding:16px;"><strong>1. 작물상태</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">작물의 현재 생육 상태, 이상 징후, 관찰 필요 지점을 먼저 보여줍니다.</p>${this.renderZoneDrilldown("crop-status")}</article>
          <article data-crop-os-stage="growth-goal" style="border:1px solid #e3eee6;border-radius:16px;background:#fff;padding:16px;"><strong>2. 생육목표</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">오늘 목표 생육 방향과 우선순위를 운영자가 이해할 수 있게 정리합니다.</p>${this.renderZoneDrilldown("growth-goal")}</article>
          <article data-crop-os-stage="environment-impact" style="border:1px solid #e3eee6;border-radius:16px;background:#fff;padding:16px;"><strong>3. 환경·관수·장치 영향</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">온도, 습도, 광, 관수, 장치 상태를 작물 영향 관점으로 묶어 보여줍니다.</p>${this.renderZoneDrilldown("environment-impact")}</article>
          <article data-crop-os-stage="recommend-act" style="border:1px solid #e3eee6;border-radius:16px;background:#fff;padding:16px;"><strong>4. 추천·실행</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">추천 이유를 확인하고, 승인과 안전검사 후 실행하는 흐름을 둡니다.</p>${this.renderZoneDrilldown("recommend-act")}</article>
        </section>
      </section>
    `;
  }

  renderZoneDetailModal() {
    return `
      <div data-cba-component="COM-ZoneDetailModal" data-zone-detail-modal role="dialog" aria-modal="true" aria-labelledby="zone-detail-modal-title" hidden style="position:fixed;inset:0;background:rgba(31,42,36,.38);z-index:10000;align-items:center;justify-content:center;padding:18px;">
        <section style="max-width:520px;width:100%;border-radius:20px;background:#ffffff;border:1px solid #dcebe0;padding:20px;box-shadow:0 20px 60px rgba(31,42,36,.22);">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
            <h3 id="zone-detail-modal-title" data-zone-detail-modal-title style="margin:0;font-size:20px;color:#24323f;">구역 상세</h3>
            <button type="button" data-zone-detail-modal-close aria-label="구역 상세 닫기" style="border:1px solid #d7e8db;border-radius:999px;background:#f8fcf9;color:#31523b;padding:6px 10px;font-weight:800;cursor:pointer;">닫기</button>
          </div>
          <div data-zone-detail-modal-body style="margin-top:14px;"></div>
        </section>
      </div>
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
      ${this.renderZoneDetailModal()}
    `;
    this._bindZoneTabs();
  }
}

if (!customElements.get(REBUILD_ELEMENT_NAME)) {
  customElements.define(REBUILD_ELEMENT_NAME, GreenSmartRebuildPanel);
}

export { GreenSmartRebuildPanel, REBUILD_ELEMENT_NAME, REBUILD_PAGES, REBUILD_VERSION, REBUILD_ZONE_CONTEXTS, REBUILD_STAGE_DETAILS };
