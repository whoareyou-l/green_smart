// Green Smart rebuild panel
// Developer-only rebuild notes belong in docs/rebuild/*, not in rendered UI copy.
// RS-012 render shell consumes normalized crop_cycle/currentCrop DTO from current-crop-adapter.js.
// RS-015 async context loading: fetch protected home context API, normalize response, keep static read-only fallback.
// RS-016 crop cycle read-only page slice: 작물상태/생육목표 show currentCrop.crop_cycle_id as read-only product data.
// RS-017 zone current crop assignment read model: zone → currentCrop/crop_cycle, equipmentProfile, dataAvailability.
// RS-018 growth target read-only projection: currentCropAssignment → growthTargetProjection for 생육목표.
// RS-019 environment impact read-only projection: currentCropAssignment + equipmentProfile + dataAvailability for 영향지도.
// RS-020 recommendation review read-only projection: currentCropAssignment + growthTargetProjection + environmentImpactProjection for 추천·실행.
// RS-021 operator approval scaffold: recommendationReviewProjection → operatorApprovalScaffold for disabled 작업자 승인 상태.
// RS-022 safety/interlock preflight projection: operatorApprovalScaffold → safetyInterlockPreflightProjection.
// RS-023 virtual execution rehearsal scaffold: safetyInterlockPreflightProjection → virtualExecutionRehearsalScaffold.
// RS-024 rehearsal result review projection: virtualExecutionRehearsalScaffold → rehearsalResultReviewProjection.
// RS-025 virtual runner input contract: rehearsalResultReviewProjection → virtualRunnerInputContract.
// RS-026 virtual runner dry-run result adapter: virtualRunnerInputContract → virtualRunnerDryRunResultAdapter.
// RS-027 virtual rehearsal pass/fail review projection: virtualRunnerDryRunResultAdapter → virtualRehearsalPassFailReviewProjection.
// R7-001 Main dashboard redesign: operator-visible crop-centered dashboard renders from R6 read-only source shapes.
// R7-002 Sidebar navigation + page shell: R7 sidebar primary groups wrap the crop-centered workspace without adding execution authority.
// R7-003 Detail/configuration subpages baseline: all five sidebar groups receive read-only placeholder subpages.
// R7-004 Settings/Admin read-only detail: Settings/Admin renders RBAC/config/admin evidence without mutation authority.
// R7-002 group markers: data-r7-sidebar-group="operations-home" / data-r7-sidebar-group="crop-centered" / data-r7-sidebar-group="field-status" / data-r7-sidebar-group="recommendation-review" / data-r7-sidebar-group="settings-admin".
// R7-003 subpage markers: data-r7-detail-subpage="operations-home" / data-r7-detail-subpage="crop-centered" / data-r7-detail-subpage="field-status" / data-r7-detail-subpage="recommendation-review" / data-r7-detail-subpage="settings-admin".
// R7 source markers: currentCropAssignment / monitoringReadOnlyAdapter / safetyInterlockReadOnlyAdapter / environmentImpactProjection / recommendationReviewProjection / virtualExecutionRehearsalScaffold.
// R7 adapter evidence links: sourceMonitoringReadOnlyAdapter / sourceSafetyInterlockReadOnlyAdapter.
// R7 detail page shell grammar: detailHeader → evidenceSummary → zoneTabs → selectedZonePanel → optionalDetailModal.
// Compatibility contract markers retained after adapter extraction:
// this._homeContext = getRebuildHomeContext()
// zone.currentCrop?.cropLabelKo / zone.currentCrop?.growthStage / zone.equipmentProfile?.labels / zone.dataAvailability

import { getRebuildHomeContext, normalizeRebuildHomeContext } from "./current-crop-adapter.js";

const REBUILD_VERSION = "1.12.38";
const REBUILD_ELEMENT_NAME = "green-smart-rebuild-panel";
const REBUILD_CONTEXT_API_PATH = "green_smart/rebuild/home/context";
const REBUILD_PAGES = Object.freeze([
  { key: "crop-status", label: "작물상태", description: "현재 작물이 어떤 상태인지 먼저 봅니다." },
  { key: "growth-goal", label: "생육목표", description: "오늘 작물이 가야 할 목표를 정리합니다." },
  { key: "influence-map", label: "영향지도", description: "환경·관수·장치가 작물에 주는 영향을 봅니다." },
  { key: "recommend-act", label: "추천·실행", description: "추천을 검토하고 승인 후 실행합니다." },
]);

const R7_SIDEBAR_GROUPS = Object.freeze([
  { key: "operations-home", label: "운영 홈", summary: "오늘 작물 중심 overview", target: "crop-status" },
  { key: "crop-centered", label: "작물 중심 운영", summary: "작물상태·생육목표·구역 drilldown", target: "growth-goal" },
  { key: "field-status", label: "현장 상태", summary: "환경·관수·장치의 작물 영향", target: "influence-map" },
  { key: "recommendation-review", label: "추천·실행 검토", summary: "추천·승인·리허설·안전 근거", target: "recommend-act" },
  { key: "settings-admin", label: "설정·관리", summary: "Admin/System·장치 매핑·RBAC", target: "settings-admin" },
]);

const R7_DETAIL_SUBPAGES = Object.freeze([
  { key: "operations-home", label: "운영 홈", summary: "오늘의 작물 운영 요약을 읽기 전용으로 정리합니다.", source: "currentCropAssignment + dataAvailability", zoneScope: "전체 구역 우선, 필요한 구역은 stage drilldown에서 확인", safety: "추천·실행 전 승인/안전검사 필요" },
  { key: "crop-centered", label: "작물 중심 운영", summary: "작물상태와 생육목표 상세 subpage 자리입니다.", source: "currentCropAssignment + growthTargetProjection", zoneScope: "작물상태/생육목표 stage 안의 zoneTabs를 재사용", safety: "작기/목표 수정 권한은 아직 없음" },
  { key: "field-status", label: "현장 상태", summary: "환경·관수·장치가 작물에 주는 영향을 확인하는 subpage 자리입니다.", source: "monitoringReadOnlyAdapter + environmentImpactProjection", zoneScope: "구역별 장비 profile과 freshness evidence", safety: "센서 수집/장치 제어는 아직 없음" },
  { key: "recommendation-review", label: "추천·실행 검토", summary: "추천, 승인, 안전, 가상 리허설 근거를 검토하는 subpage 자리입니다.", source: "recommendationReviewProjection + safetyInterlockReadOnlyAdapter + virtualExecutionRehearsalScaffold", zoneScope: "추천 stage 안의 zone-scoped evidence", safety: "승인 해제/실행/MQTT 명령은 아직 없음" },
  { key: "settings-admin", label: "설정·관리", summary: "Admin/System, 장치 매핑, RBAC/config 설정 subpage 자리입니다.", source: "RBAC/config documentation baseline", zoneScope: "관리 설정은 zone data를 직접 변경하지 않음", safety: "설정 저장/삭제/권한 변경은 아직 없음" },
]);

const REBUILD_HOME_CONTEXT = Object.freeze({
  contextSource: "static-fixture-before-api",
  greenhouseId: "greenhouse-main",
  greenhouseName: "대표 온실",
  generatedAt: "2026-06-28T00:00:00+09:00",
  zones: [
    { id: "all", name: "전체", currentCrop: { cropSeasonId: null, cropType: "mixed", cropLabelKo: "전체 작물", growthStage: "전체 구역 요약" }, equipmentProfile: { labels: ["구역별 장비 요약"] }, dataAvailability: { state: "partial", freshnessMinutes: 6, note: "일부 구역 데이터가 아직 보강 중입니다." } },
    { id: "zone-a", name: "A구역", currentCrop: { cropSeasonId: "season-tomato-a", cropType: "tomato", cropLabelKo: "토마토", growthStage: "착과·비대 관찰" }, equipmentProfile: { labels: ["천창", "측창", "양액기"] }, dataAvailability: { state: "ok", freshnessMinutes: 2, note: "최근 데이터 기준으로 확인했습니다." } },
    { id: "zone-b", name: "B구역", currentCrop: { cropSeasonId: "season-strawberry-b", cropType: "strawberry", cropLabelKo: "딸기", growthStage: "개화·수분 관리" }, equipmentProfile: { labels: ["보온커튼", "관수밸브", "순환팬"] }, dataAvailability: { state: "stale", freshnessMinutes: 38, note: "최근 수집 시각이 오래되어 현장 확인이 필요합니다." } },
    { id: "zone-c", name: "C구역", currentCrop: { cropSeasonId: null, cropType: null, cropLabelKo: "미등록", growthStage: "작기 정보 없음" }, equipmentProfile: { labels: ["장비 매핑 없음"] }, dataAvailability: { state: "empty", freshnessMinutes: null, note: "현재 연결된 작기와 장비 정보가 없습니다." } },
    { id: "zone-loading", name: "동기화", currentCrop: { cropSeasonId: null, cropType: null, cropLabelKo: "불러오는 중", growthStage: "데이터 수집 중" }, equipmentProfile: { labels: ["동기화 대기"] }, dataAvailability: { state: "loading", freshnessMinutes: null, note: "구역 데이터를 불러오는 중입니다." } },
    { id: "zone-error", name: "점검", currentCrop: { cropSeasonId: null, cropType: null, cropLabelKo: "확인 필요", growthStage: "데이터 오류" }, equipmentProfile: { labels: ["상태 확인 필요"] }, dataAvailability: { state: "error", freshnessMinutes: null, note: "데이터를 읽지 못했습니다. 연결 상태를 확인합니다." } },
  ],
});

const REBUILD_ZONE_CONTEXTS = Object.freeze(getRebuildHomeContext(REBUILD_HOME_CONTEXT).zones);

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
    this._homeContext = getRebuildHomeContext(REBUILD_HOME_CONTEXT);
    this._contextLoadState = "loading";
    this._contextLoadError = null;
    this._contextRequestId = 0;
    this._selectedZoneId = Object.fromEntries(Object.keys(REBUILD_STAGE_DETAILS).map((stageKey) => [stageKey, "all"]));
  }

  connectedCallback() {
    this.render();
    this._loadHomeContext();
  }

  async _loadHomeContext() {
    const requestId = ++this._contextRequestId;
    this._contextLoadState = "loading";
    this._contextLoadError = null;
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      const response = await this.hass.callApi("GET", REBUILD_CONTEXT_API_PATH);
      if (requestId !== this._contextRequestId) return;
      this._homeContext = normalizeRebuildHomeContext(response);
      this._contextLoadState = "ready";
      this._contextLoadError = null;
    } catch (error) {
      if (requestId !== this._contextRequestId) return;
      this._homeContext = getRebuildHomeContext(REBUILD_HOME_CONTEXT);
      this._contextLoadState = "error";
      this._contextLoadError = error?.message || "context-load-failed";
    }
    this.render();
  }

  _zoneStateTone(state) {
    return ({ ok: "#2f7d46", partial: "#8a6d1d", stale: "#a35f00", empty: "#6b7280", loading: "#3b6ea8", error: "#b42318" })[state] || "#6b7280";
  }

  _zoneStateLabel(state) {
    return ({ ok: "정상", partial: "부분 데이터", stale: "오래됨", empty: "데이터 없음", loading: "불러오는 중", error: "오류" })[state] || "상태 확인";
  }

  renderStateBadge(status) {
    const state = status?.state || "empty";
    const tone = this._zoneStateTone(state);
    return `<span data-cba-component="COM-StateBadge" data-zone-state-badge data-zone-state="${state}" style="display:inline-flex;align-items:center;border:1px solid ${tone};border-radius:999px;color:${tone};background:#fff;padding:4px 9px;font-size:12px;font-weight:800;">${this._zoneStateLabel(state)}</span>`;
  }

  renderDataFreshnessPill(status) {
    const minutes = status?.freshnessMinutes;
    const label = Number.isFinite(minutes) ? `${minutes}분 전 갱신` : "갱신 시각 없음";
    return `<span data-cba-component="COM-DataFreshnessPill" data-zone-freshness-pill style="display:inline-flex;align-items:center;border-radius:999px;background:#f3f7f4;color:#5d6f62;padding:4px 9px;font-size:12px;font-weight:700;">${label}</span>`;
  }

  renderLoadingSkeleton(status) {
    if (status?.state !== "loading") return "";
    return `<div data-cba-component="COM-LoadingSkeleton" data-zone-loading-skeleton style="margin-top:10px;border-radius:12px;background:linear-gradient(90deg,#eef5f0,#f8fcf9,#eef5f0);padding:12px;color:#78927f;font-size:12px;">구역 정보를 불러오는 중입니다.</div>`;
  }

  renderEmptyState(status) {
    if (!["empty", "error"].includes(status?.state)) return "";
    return `<div data-cba-component="COM-EmptyState" data-zone-empty-state style="margin-top:10px;border:1px dashed #d7e8db;border-radius:12px;background:#fbfdfb;padding:12px;color:#5d6f62;font-size:12px;line-height:1.5;">${status.note}</div>`;
  }

  renderCropCycleReadOnlyCard(zone, stageKey) {
    if (!["crop-status", "growth-goal"].includes(stageKey)) return "";
    const crop = zone.currentCrop || {};
    const cropCycleId = crop.crop_cycle_id ?? zone.activeCropCycleId ?? zone.crop_cycle ?? "unassigned";
    const cropType = crop.crop_type || "other";
    const cropLabel = crop.crop_label_ko || zone.crop || "미등록";
    const growthStage = crop.growth_stage || zone.state || "작기 정보 없음";
    const variety = crop.variety || "품종 미등록";
    const plantDate = crop.plant_date || "정식일 미등록";
    const demolishDate = crop.demolish_date || "철거일 없음";
    return `
      <section data-crop-cycle-readonly-card data-crop-cycle-stage="${stageKey}" data-crop-cycle-id="${cropCycleId}" data-active-crop-cycle-id="${zone.activeCropCycleId ?? ""}" data-current-crop-type="${cropType}" style="margin:10px 0;border:1px solid #d7e8db;border-radius:14px;background:#fbfdfb;padding:12px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:900;color:#5d7d64;">${stageKey === "crop-status" ? "작물상태" : "생육목표"} · crop_cycle/currentCrop 읽기 전용</p>
        <dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;margin:0;color:#31523b;font-size:12px;">
          <dt style="font-weight:900;">작기 ID</dt><dd data-crop-cycle-id-value style="margin:0;">${cropCycleId}</dd>
          <dt style="font-weight:900;">작물</dt><dd data-current-crop-label style="margin:0;">${cropLabel} <span data-current-crop-type-value>(${cropType})</span></dd>
          <dt style="font-weight:900;">품종</dt><dd data-current-crop-variety style="margin:0;">${variety}</dd>
          <dt style="font-weight:900;">정식일</dt><dd data-current-crop-plant-date style="margin:0;">${plantDate}</dd>
          <dt style="font-weight:900;">철거일</dt><dd data-current-crop-demolish-date style="margin:0;">${demolishDate}</dd>
          <dt style="font-weight:900;">생육단계</dt><dd data-current-crop-growth-stage style="margin:0;">${growthStage}</dd>
        </dl>
        <p data-current-crop-readonly-note style="margin:10px 0 0;color:#78927f;font-size:12px;line-height:1.5;">읽기 전용 표시입니다. 작기 생성·수정·삭제는 RS-016 범위에 포함하지 않습니다.</p>
      </section>
    `;
  }

  renderCurrentCropAssignmentReadModel(zone) {
    const assignment = zone.currentCropAssignment || {};
    const state = assignment.assignmentState || (zone.currentCrop?.crop_cycle_id ? "assigned" : "unassigned");
    const sourceRowId = assignment.sourceRowId ?? zone.currentCrop?.crop_cycle_id ?? zone.crop_cycle ?? "";
    const readOnly = assignment.readOnly !== false;
    const executionEnabled = assignment.executionEnabled === true;
    const equipmentLabels = assignment.equipmentProfile?.labels || zone.equipmentProfile?.labels || zone.equipment || [];
    const availability = assignment.dataAvailability || zone.dataAvailability || zone.dataStatus || {};
    const availabilityState = availability.state || "unknown";
    const availabilitySource = availability.source || "unknown";
    return `
      <section data-current-crop-assignment-card data-current-crop-assignment-state="${state}" data-current-crop-assignment-source-row-id="${sourceRowId}" data-current-crop-assignment-readonly="${readOnly}" data-current-crop-assignment-execution-enabled="${executionEnabled}" style="margin:10px 0;border:1px solid #dce9f5;border-radius:14px;background:#f8fbff;padding:12px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:900;color:#41657d;">구역별 현재 작기 배정 · read model</p>
        <dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;margin:0;color:#315064;font-size:12px;">
          <dt style="font-weight:900;">배정 상태</dt><dd style="margin:0;">${state}</dd>
          <dt style="font-weight:900;">원천 행</dt><dd style="margin:0;">${sourceRowId || "없음"}</dd>
          <dt style="font-weight:900;">장비 프로필</dt><dd data-current-crop-assignment-equipment-profile style="margin:0;">${equipmentLabels.join(", ") || "구역 장비 요약 대기"}</dd>
          <dt style="font-weight:900;">데이터 상태</dt><dd data-current-crop-assignment-data-availability style="margin:0;">${availabilityState} · ${availabilitySource}</dd>
        </dl>
        <p style="margin:10px 0 0;color:#7890a3;font-size:12px;line-height:1.5;">읽기 전용 배정 모델입니다. 배정 변경/저장/삭제 및 실제 장치 실행은 RS-017 범위에 포함하지 않습니다.</p>
      </section>
    `;
  }

  renderGrowthTargetProjection(zone, stageKey) {
    if (!["growth-goal"].includes(stageKey)) return "";
    const projection = zone.growthTargetProjection || {};
    const state = projection.projectionState || "empty";
    const stageLabel = projection.targetStageLabel || zone.currentCrop?.growth_stage || zone.state || "작기 정보 없음";
    const focus = projection.targetFocus || "생육 균형 유지";
    const basis = projection.targetBasis || { crop_cycle_id: zone.currentCrop?.crop_cycle_id ?? zone.crop_cycle ?? "" };
    const cropCycleId = basis.crop_cycle_id ?? "";
    const readOnly = projection.readOnly !== false;
    const executionEnabled = projection.executionEnabled === true;
    return `
      <section data-growth-target-projection-card data-growth-target-projection-state="${state}" data-growth-target-stage-label="${stageLabel}" data-growth-target-focus="${focus}" data-growth-target-basis-crop-cycle-id="${cropCycleId}" data-growth-target-readonly="${readOnly}" data-growth-target-execution-enabled="${executionEnabled}" style="margin:10px 0;border:1px solid #eadfb8;border-radius:14px;background:#fffdf5;padding:12px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:900;color:#7a6220;">생육목표 projection · read-only</p>
        <dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;margin:0;color:#5d4a17;font-size:12px;">
          <dt style="font-weight:900;">목표 단계</dt><dd style="margin:0;">${stageLabel}</dd>
          <dt style="font-weight:900;">목표 초점</dt><dd style="margin:0;">${focus}</dd>
          <dt style="font-weight:900;">기준 작기</dt><dd style="margin:0;">${cropCycleId || "없음"}</dd>
        </dl>
        <p style="margin:10px 0 0;color:#89743b;font-size:12px;line-height:1.5;">currentCropAssignment 기반 읽기 전용 projection입니다. 목표 수정·저장·실행은 RS-018 범위에 포함하지 않습니다.</p>
      </section>
    `;
  }

  renderEnvironmentImpactProjection(zone, stageKey) {
    if (!["influence-map"].includes(stageKey)) return "";
    const projection = zone.environmentImpactProjection || {};
    const state = projection.impactState || "empty";
    const focus = projection.impactFocus || "구역 장비와 데이터 신선도 기준 영향 확인";
    const factors = projection.impactFactors || zone.equipmentProfile?.labels || zone.equipment || [];
    const freshness = projection.freshnessLabel || "갱신 시각 없음";
    const readOnly = projection.readOnly !== false;
    const executionEnabled = projection.executionEnabled === true;
    return `
      <section data-environment-impact-projection-card data-environment-impact-state="${state}" data-environment-impact-focus="${focus}" data-environment-impact-factors="${factors.join(", ")}" data-environment-impact-freshness="${freshness}" data-environment-impact-readonly="${readOnly}" data-environment-impact-execution-enabled="${executionEnabled}" style="margin:10px 0;border:1px solid #cfe0ef;border-radius:14px;background:#f7fbff;padding:12px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:900;color:#2d617e;">영향지도 projection · read-only</p>
        <dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;margin:0;color:#234c64;font-size:12px;">
          <dt style="font-weight:900;">영향 상태</dt><dd style="margin:0;">${state}</dd>
          <dt style="font-weight:900;">영향 초점</dt><dd style="margin:0;">${focus}</dd>
          <dt style="font-weight:900;">영향 요소</dt><dd style="margin:0;">${factors.join(" · ") || "구역 장비 요약 대기"}</dd>
          <dt style="font-weight:900;">데이터 신선도</dt><dd style="margin:0;">${freshness}</dd>
        </dl>
        <p style="margin:10px 0 0;color:#55778b;font-size:12px;line-height:1.5;">currentCropAssignment + equipmentProfile + dataAvailability 기반 읽기 전용 projection입니다. 영향 값 수정·저장·실행은 RS-019 범위에 포함하지 않습니다.</p>
      </section>
    `;
  }

  renderRecommendationReviewProjection(zone, stageKey) {
    if (!["recommend-act"].includes(stageKey)) return "";
    const projection = zone.recommendationReviewProjection || {};
    const inputs = projection.reviewInputs || {};
    const growth = inputs.growthTargetProjection || zone.growthTargetProjection || {};
    const environment = inputs.environmentImpactProjection || zone.environmentImpactProjection || {};
    const state = projection.reviewState || "empty";
    const summary = projection.reviewSummary || "추천 검토 대기: 생육목표와 환경 영향 projection 확인 필요";
    const approvalRequired = projection.approvalRequired !== false;
    const readOnly = projection.readOnly !== false;
    const executionEnabled = projection.executionEnabled === true;
    return `
      <section data-recommendation-review-projection-card data-recommendation-review-state="${state}" data-recommendation-review-summary="${summary}" data-recommendation-review-approval-required="${approvalRequired}" data-recommendation-review-readonly="${readOnly}" data-recommendation-review-execution-enabled="${executionEnabled}" style="margin:10px 0;border:1px solid #e5d4f0;border-radius:14px;background:#fdf8ff;padding:12px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:900;color:#684078;">추천·실행 projection · read-only</p>
        <dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;margin:0;color:#52305f;font-size:12px;">
          <dt style="font-weight:900;">검토 상태</dt><dd style="margin:0;">${state}</dd>
          <dt style="font-weight:900;">검토 요약</dt><dd style="margin:0;">${summary}</dd>
          <dt style="font-weight:900;">생육목표 입력</dt><dd style="margin:0;">${growth.targetFocus || "생육목표 projection 대기"}</dd>
          <dt style="font-weight:900;">환경 영향 입력</dt><dd style="margin:0;">${environment.impactFocus || "환경 영향 projection 대기"}</dd>
          <dt style="font-weight:900;">승인 필요</dt><dd style="margin:0;">${approvalRequired ? "필요" : "불필요"}</dd>
        </dl>
        <p style="margin:10px 0 0;color:#785c86;font-size:12px;line-height:1.5;">currentCropAssignment + growthTargetProjection + environmentImpactProjection 기반 읽기 전용 projection입니다. 추천 승인·저장·실행은 RS-020 범위에 포함하지 않습니다.</p>
      </section>
    `;
  }

  renderOperatorApprovalScaffold(zone, stageKey) {
    if (!["recommend-act"].includes(stageKey)) return "";
    const scaffold = zone.operatorApprovalScaffold || {};
    const state = scaffold.approvalState || "required";
    const approvalRequired = scaffold.approvalRequired !== false;
    const disabledReason = scaffold.disabledReason || "작업자 승인과 안전/인터록 사전검증 전에는 실행할 수 없습니다.";
    const executionBlocked = scaffold.executionBlocked !== false;
    const readOnly = scaffold.readOnly !== false;
    const executionEnabled = scaffold.executionEnabled === true;
    return `
      <section data-operator-approval-scaffold-card data-operator-approval-state="${state}" data-operator-approval-required="${approvalRequired}" data-operator-approval-disabled-reason="${disabledReason}" data-operator-approval-execution-blocked="${executionBlocked}" data-operator-approval-readonly="${readOnly}" data-operator-approval-execution-enabled="${executionEnabled}" style="margin:10px 0;border:1px solid #f0d2b9;border-radius:14px;background:#fff8f1;padding:12px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:900;color:#865222;">작업자 승인 scaffold · 실행 비활성화</p>
        <dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;margin:0;color:#6b421d;font-size:12px;">
          <dt style="font-weight:900;">승인 상태</dt><dd style="margin:0;">${state}</dd>
          <dt style="font-weight:900;">작업자 승인 필요</dt><dd style="margin:0;">${approvalRequired ? "필요" : "불필요"}</dd>
          <dt style="font-weight:900;">실행 차단</dt><dd style="margin:0;">${executionBlocked ? "차단" : "대기"}</dd>
          <dt style="font-weight:900;">비활성 사유</dt><dd style="margin:0;">${disabledReason}</dd>
        </dl>
        <p style="margin:10px 0 0;color:#8a674c;font-size:12px;line-height:1.5;">추천은 작업자 승인과 안전/인터록 사전검증 전까지 실행할 수 없습니다. RS-021은 승인 저장·실행 없이 read-only/disabled scaffold만 제공합니다.</p>
      </section>
    `;
  }

  renderSafetyInterlockPreflightProjection(zone, stageKey) {
    if (!["recommend-act"].includes(stageKey)) return "";
    const projection = zone.safetyInterlockPreflightProjection || {};
    const preflight = projection.preflightState || "blocked_until_review";
    const safety = projection.safetyState || "pending";
    const interlock = projection.interlockState || "pending";
    const failSafe = projection.failSafeState || "standby";
    const blockedReasons = projection.blockedReasons || ["operator_approval_required"];
    const requiredChecks = projection.requiredChecks || ["작업자 승인", "Safety 검증", "Interlock 검증", "Fail Safe 확인"];
    const readOnly = projection.readOnly !== false;
    const executionEnabled = projection.executionEnabled === true;
    return `
      <section data-safety-interlock-preflight-card data-safety-preflight-state="${preflight}" data-safety-state="${safety}" data-interlock-state="${interlock}" data-failsafe-state="${failSafe}" data-preflight-blocked-reasons="${blockedReasons.join(",")}" data-preflight-required-checks="${requiredChecks.join(",")}" data-preflight-readonly="${readOnly}" data-preflight-execution-enabled="${executionEnabled}" style="margin:10px 0;border:1px solid #d4dce8;border-radius:14px;background:#f8fbff;padding:12px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:900;color:#354e78;">Safety / Interlock / Fail Safe 사전검증 · read-only</p>
        <dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;margin:0;color:#2c3d5c;font-size:12px;">
          <dt style="font-weight:900;">사전검증 상태</dt><dd style="margin:0;">${preflight}</dd>
          <dt style="font-weight:900;">Safety</dt><dd style="margin:0;">${safety}</dd>
          <dt style="font-weight:900;">Interlock</dt><dd style="margin:0;">${interlock}</dd>
          <dt style="font-weight:900;">Fail Safe</dt><dd style="margin:0;">${failSafe}</dd>
          <dt style="font-weight:900;">필수 확인</dt><dd style="margin:0;">${requiredChecks.join(" · ")}</dd>
        </dl>
        <p style="margin:10px 0 0;color:#596b86;font-size:12px;line-height:1.5;">실행 전 Safety / Interlock / Fail Safe 사전검증이 필요합니다. RS-022는 실행 권한 없이 read-only projection만 제공합니다.</p>
      </section>
    `;
  }

  renderVirtualExecutionRehearsalScaffold(zone, stageKey) {
    if (!["recommend-act"].includes(stageKey)) return "";
    const scaffold = zone.virtualExecutionRehearsalScaffold || {};
    const rehearsalState = scaffold.rehearsalState || "blocked_until_virtual_rehearsal";
    const scenarios = scaffold.scenarioSet || ["normal", "strong_wind", "rain", "low_temperature", "sensor_fault", "blocked", "fail_safe", "recovery"];
    const currentScenario = scaffold.currentScenario || "blocked";
    const summary = scaffold.readinessSummary || "가상 실행 리허설 전: Safety/Interlock/Fail Safe 사전검증 필요";
    const readOnly = scaffold.readOnly !== false;
    const executionEnabled = scaffold.executionEnabled === true;
    const deviceCommandEnabled = scaffold.deviceCommandEnabled === true;
    const mqttEnabled = scaffold.mqttEnabled === true;
    return `
      <section data-virtual-execution-rehearsal-card data-virtual-rehearsal-state="${rehearsalState}" data-virtual-rehearsal-current-scenario="${currentScenario}" data-virtual-rehearsal-scenarios="${scenarios.join(",")}" data-virtual-rehearsal-readonly="${readOnly}" data-virtual-rehearsal-execution-enabled="${executionEnabled}" data-virtual-rehearsal-device-command-enabled="${deviceCommandEnabled}" data-virtual-rehearsal-mqtt-enabled="${mqttEnabled}" style="margin:10px 0;border:1px solid #d7e6db;border-radius:14px;background:#f8fff9;padding:12px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:900;color:#2d6840;">가상 실행 리허설 · read-only</p>
        <dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;margin:0;color:#2c4d37;font-size:12px;">
          <dt style="font-weight:900;">리허설 상태</dt><dd style="margin:0;">${rehearsalState}</dd>
          <dt style="font-weight:900;">현재 시나리오</dt><dd style="margin:0;">${currentScenario}</dd>
          <dt style="font-weight:900;">시나리오 세트</dt><dd style="margin:0;">${scenarios.join(" · ")}</dd>
          <dt style="font-weight:900;">준비 요약</dt><dd style="margin:0;">${summary}</dd>
        </dl>
        <p style="margin:10px 0 0;color:#57745d;font-size:12px;line-height:1.5;">RS-023은 실제 실행/MQTT/장치 명령 없이 정상·강풍·비·저온·센서장애·blocked·Fail Safe·복구 시나리오의 리허설 상태만 표시합니다.</p>
      </section>
    `;
  }

  renderRehearsalResultReviewProjection(zone, stageKey) {
    if (!["recommend-act"].includes(stageKey)) return "";
    const review = zone.rehearsalResultReviewProjection || {};
    const reviewState = review.reviewState || "pending_virtual_results";
    const summary = review.resultSummary || "가상 리허설 결과 검토 대기: 실제 실행 없이 시나리오별 결과를 확인합니다.";
    const scenarioResults = review.scenarioResults || ["normal", "strong_wind", "rain", "low_temperature", "sensor_fault", "blocked", "fail_safe", "recovery"].map((scenario) => ({ scenario, resultState: "not_run" }));
    const scenarioText = scenarioResults.map((item) => `${item.scenario}:${item.resultState || "not_run"}`).join(",");
    const readOnly = review.readOnly !== false;
    const executionEnabled = review.executionEnabled === true;
    const approvalReleaseEnabled = review.approvalReleaseEnabled === true;
    const deviceCommandEnabled = review.deviceCommandEnabled === true;
    const mqttEnabled = review.mqttEnabled === true;
    return `
      <section data-rehearsal-result-review-card data-rehearsal-result-review-state="${reviewState}" data-rehearsal-result-summary="${summary}" data-rehearsal-result-scenarios="${scenarioText}" data-rehearsal-result-readonly="${readOnly}" data-rehearsal-result-execution-enabled="${executionEnabled}" data-rehearsal-result-approval-release-enabled="${approvalReleaseEnabled}" data-rehearsal-result-device-command-enabled="${deviceCommandEnabled}" data-rehearsal-result-mqtt-enabled="${mqttEnabled}" style="margin:10px 0;border:1px solid #ead7a6;border-radius:14px;background:#fffdf5;padding:12px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:900;color:#7a5a12;">리허설 결과 검토 · read-only</p>
        <dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;margin:0;color:#5b4819;font-size:12px;">
          <dt style="font-weight:900;">검토 상태</dt><dd style="margin:0;">${reviewState}</dd>
          <dt style="font-weight:900;">결과 요약</dt><dd style="margin:0;">${summary}</dd>
          <dt style="font-weight:900;">시나리오 결과</dt><dd style="margin:0;">${scenarioResults.map((item) => `${item.scenario}=${item.resultState || "not_run"}`).join(" · ")}</dd>
        </dl>
        <p style="margin:10px 0 0;color:#746236;font-size:12px;line-height:1.5;">RS-024는 실제 virtual runner 전 단계입니다. 모든 시나리오 결과는 not_run 검토 상태이며 승인 해제, 실행, MQTT, 장치 명령을 제공하지 않습니다.</p>
      </section>
    `;
  }

  renderVirtualRunnerInputContract(zone, stageKey) {
    if (!["recommend-act"].includes(stageKey)) return "";
    const contract = zone.virtualRunnerInputContract || {};
    const inputState = contract.inputState || "contract_ready_not_executable";
    const runnerMode = contract.runnerMode || "read_only_contract";
    const inputScenarios = contract.inputScenarios || ["normal", "strong_wind", "rain", "low_temperature", "sensor_fault", "blocked", "fail_safe", "recovery"].map((scenario) => ({ scenario, resultState: "not_run" }));
    const scenarioText = inputScenarios.map((item) => `${item.scenario}:${item.resultState || "not_run"}`).join(",");
    const readOnly = contract.readOnly !== false;
    const executionEnabled = contract.executionEnabled === true;
    const runnerExecutionEnabled = contract.runnerExecutionEnabled === true;
    const deviceCommandEnabled = contract.deviceCommandEnabled === true;
    const mqttEnabled = contract.mqttEnabled === true;
    return `
      <section data-virtual-runner-input-contract-card data-virtual-runner-input-state="${inputState}" data-virtual-runner-mode="${runnerMode}" data-virtual-runner-input-scenarios="${scenarioText}" data-virtual-runner-readonly="${readOnly}" data-virtual-runner-execution-enabled="${executionEnabled}" data-virtual-runner-runner-execution-enabled="${runnerExecutionEnabled}" data-virtual-runner-device-command-enabled="${deviceCommandEnabled}" data-virtual-runner-mqtt-enabled="${mqttEnabled}" style="margin:10px 0;border:1px solid #d7cef2;border-radius:14px;background:#fbf9ff;padding:12px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:900;color:#59469a;">가상 러너 입력 계약 · read-only</p>
        <dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;margin:0;color:#4b3d76;font-size:12px;">
          <dt style="font-weight:900;">입력 상태</dt><dd style="margin:0;">${inputState}</dd>
          <dt style="font-weight:900;">러너 모드</dt><dd style="margin:0;">${runnerMode}</dd>
          <dt style="font-weight:900;">입력 시나리오</dt><dd style="margin:0;">${inputScenarios.map((item) => `${item.scenario}=${item.resultState || "not_run"}`).join(" · ")}</dd>
        </dl>
        <p style="margin:10px 0 0;color:#675b86;font-size:12px;line-height:1.5;">RS-025는 실제 virtual runner 실행 전 입력 계약만 고정합니다. runner 실행, 승인 해제, MQTT, 장치 명령은 제공하지 않습니다.</p>
      </section>
    `;
  }

  renderVirtualRunnerDryRunResultAdapter(zone, stageKey) {
    if (!["recommend-act"].includes(stageKey)) return "";
    const adapter = zone.virtualRunnerDryRunResultAdapter || {};
    const adapterState = adapter.adapterState || "dry_run_results_adapted_not_executable";
    const dryRunMode = adapter.dryRunMode || "synthetic_read_only_adapter";
    const scenarioDryRunResults = adapter.scenarioDryRunResults || ["normal", "strong_wind", "rain", "low_temperature", "sensor_fault", "blocked", "fail_safe", "recovery"].map((scenario) => ({ scenario, dryRunResult: "simulated_not_executed", executionAllowed: false }));
    const scenarioText = scenarioDryRunResults.map((item) => `${item.scenario}:${item.dryRunResult || "simulated_not_executed"}`).join(",");
    const readOnly = adapter.readOnly !== false;
    const executionEnabled = adapter.executionEnabled === true;
    const runnerExecutionEnabled = adapter.runnerExecutionEnabled === true;
    const deviceCommandEnabled = adapter.deviceCommandEnabled === true;
    const mqttEnabled = adapter.mqttEnabled === true;
    return `
      <section data-virtual-runner-dry-run-result-adapter-card data-virtual-runner-dry-run-adapter-state="${adapterState}" data-virtual-runner-dry-run-mode="${dryRunMode}" data-virtual-runner-dry-run-scenarios="${scenarioText}" data-virtual-runner-dry-run-readonly="${readOnly}" data-virtual-runner-dry-run-execution-enabled="${executionEnabled}" data-virtual-runner-dry-run-runner-execution-enabled="${runnerExecutionEnabled}" data-virtual-runner-dry-run-device-command-enabled="${deviceCommandEnabled}" data-virtual-runner-dry-run-mqtt-enabled="${mqttEnabled}" style="margin:10px 0;border:1px solid #c7d2fe;border-radius:14px;background:#f8fbff;padding:12px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:900;color:#334195;">가상 dry-run 결과 어댑터 · read-only</p>
        <dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;margin:0;color:#334155;font-size:12px;">
          <dt style="font-weight:900;">어댑터 상태</dt><dd style="margin:0;">${adapterState}</dd>
          <dt style="font-weight:900;">dry-run 모드</dt><dd style="margin:0;">${dryRunMode}</dd>
          <dt style="font-weight:900;">시나리오 결과</dt><dd style="margin:0;">${scenarioDryRunResults.map((item) => `${item.scenario}=${item.dryRunResult || "simulated_not_executed"}`).join(" · ")}</dd>
        </dl>
        <p style="margin:10px 0 0;color:#475569;font-size:12px;line-height:1.5;">RS-026은 virtual runner 입력 계약을 read-only dry-run 결과 shape로 변환합니다. 실제 runner 실행, 승인 해제, MQTT, 장치 명령은 제공하지 않습니다.</p>
      </section>
    `;
  }

  renderVirtualRehearsalPassFailReviewProjection(zone, stageKey) {
    if (!["recommend-act"].includes(stageKey)) return "";
    const projection = zone.virtualRehearsalPassFailReviewProjection || {};
    const reviewState = projection.reviewState || "pass_fail_review_pending";
    const overallDecision = projection.overallDecision || "review_needed";
    const scenarioReviews = projection.scenarioReviews || ["normal", "strong_wind", "rain", "low_temperature", "sensor_fault", "blocked", "fail_safe", "recovery"].map((scenario) => ({ scenario, decision: "review_needed", executionAllowed: false }));
    const scenarioText = scenarioReviews.map((item) => `${item.scenario}:${item.decision || "review_needed"}`).join(",");
    const readOnly = projection.readOnly !== false;
    const executionEnabled = projection.executionEnabled === true;
    const runnerExecutionEnabled = projection.runnerExecutionEnabled === true;
    const deviceCommandEnabled = projection.deviceCommandEnabled === true;
    const mqttEnabled = projection.mqttEnabled === true;
    return `
      <section data-virtual-rehearsal-pass-fail-review-card data-virtual-rehearsal-review-state="${reviewState}" data-virtual-rehearsal-overall-decision="${overallDecision}" data-virtual-rehearsal-scenario-reviews="${scenarioText}" data-virtual-rehearsal-pass-fail-readonly="${readOnly}" data-virtual-rehearsal-pass-fail-execution-enabled="${executionEnabled}" data-virtual-rehearsal-pass-fail-runner-execution-enabled="${runnerExecutionEnabled}" data-virtual-rehearsal-pass-fail-device-command-enabled="${deviceCommandEnabled}" data-virtual-rehearsal-pass-fail-mqtt-enabled="${mqttEnabled}" style="margin:10px 0;border:1px solid #fecaca;border-radius:14px;background:#fffafa;padding:12px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:900;color:#991b1b;">가상 리허설 pass/fail 검토 · read-only</p>
        <dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;margin:0;color:#334155;font-size:12px;">
          <dt style="font-weight:900;">검토 상태</dt><dd style="margin:0;">${reviewState}</dd>
          <dt style="font-weight:900;">종합 판단</dt><dd style="margin:0;">${overallDecision}</dd>
          <dt style="font-weight:900;">시나리오 검토</dt><dd style="margin:0;">${scenarioReviews.map((item) => `${item.scenario}=${item.decision || "review_needed"}`).join(" · ")}</dd>
        </dl>
        <p style="margin:10px 0 0;color:#7f1d1d;font-size:12px;line-height:1.5;">RS-027은 가상 리허설 결과를 pass/fail/review_needed 검토 projection으로 정리합니다. 실제 runner 실행, 승인 해제, MQTT, 장치 명령은 제공하지 않습니다.</p>
      </section>
    `;
  }

  _zonesForRender() {
    return this._homeContext?.zones || [];
  }

  _findZoneForRender(zoneId) {
    return this._zonesForRender().find((item) => item.id === zoneId) || this._zonesForRender()[0];
  }

  _contextMetaForRender() {
    return this._homeContext || getRebuildHomeContext(REBUILD_HOME_CONTEXT);
  }

  renderContextLoadNotice() {
    if (this._contextLoadState === "ready") return "";
    const message = this._contextLoadState === "loading"
      ? "실제 온실 데이터를 불러오는 중입니다."
      : "실제 데이터를 읽지 못해 읽기 전용 기본 화면으로 표시합니다.";
    return `<aside data-rebuild-context-load-notice data-rebuild-context-error="${this._contextLoadError || ""}" style="border:1px solid #d7e8db;border-radius:14px;background:#fbfdfb;color:#5d6f62;padding:12px;font-size:12px;line-height:1.5;">${message}</aside>`;
  }

  renderR7SourceShapesSummary() {
    return `
      <section data-r7-source-shapes data-r7-readonly-boundary="true" style="border:1px solid #dcebe0;border-radius:18px;background:#fff;padding:16px;display:grid;gap:10px;">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;">
          <strong style="font-size:15px;color:#24323f;">R6 읽기 전용 근거로 렌더링</strong>
          <span style="border:1px solid #d7e8db;border-radius:999px;background:#f8fcf9;color:#31523b;padding:5px 10px;font-size:12px;font-weight:900;">read-only · no execution</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          <span data-r7-source-current-crop-assignment style="border-radius:999px;background:#f3f7f4;color:#31523b;padding:5px 9px;font-size:12px;font-weight:800;">currentCropAssignment</span>
          <span data-r7-source-monitoring-readonly-adapter style="border-radius:999px;background:#f3f7f4;color:#31523b;padding:5px 9px;font-size:12px;font-weight:800;">monitoringReadOnlyAdapter</span>
          <span data-r7-source-safety-interlock-readonly-adapter style="border-radius:999px;background:#f3f7f4;color:#31523b;padding:5px 9px;font-size:12px;font-weight:800;">safetyInterlockReadOnlyAdapter</span>
          <span data-r7-source-environment-impact-projection style="border-radius:999px;background:#f3f7f4;color:#31523b;padding:5px 9px;font-size:12px;font-weight:800;">environmentImpactProjection</span>
          <span data-r7-source-recommendation-review-projection style="border-radius:999px;background:#f3f7f4;color:#31523b;padding:5px 9px;font-size:12px;font-weight:800;">recommendationReviewProjection</span>
          <span data-r7-source-virtual-execution-rehearsal-scaffold style="border-radius:999px;background:#f3f7f4;color:#31523b;padding:5px 9px;font-size:12px;font-weight:800;">virtualExecutionRehearsalScaffold</span>
        </div>
        <p style="margin:0;color:#6b7f70;font-size:12px;line-height:1.5;">기존 GET /api/green_smart/rebuild/home/context shape만 사용합니다. dashboard redesign은 API/DB/실행 권한을 추가하지 않습니다.</p>
      </section>
    `;
  }

  renderZoneTabs(stageKey) {
    const selectedZoneId = this._selectedZoneId[stageKey] || "all";
    return `
      <div data-cba-component="COM-ZoneTabs" data-zone-tablist data-zone-tab-stage="${stageKey}" role="tablist" aria-label="${REBUILD_STAGE_DETAILS[stageKey].title}" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;">
        ${this._zonesForRender().map((zone) => {
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
        ${this._zonesForRender().map((zone) => {
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
            <div data-zone-state-row style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;">
              ${this.renderStateBadge(zone.dataStatus)}
              ${this.renderDataFreshnessPill(zone.dataStatus)}
            </div>
            <p style="margin:0 0 6px;font-size:12px;font-weight:800;color:#78927f;">${zone.name}</p>
            <h4 data-zone-context-crop data-zone-current-crop style="margin:0 0 8px;font-size:16px;color:#24323f;">${zone.currentCrop?.crop_label_ko || zone.currentCrop?.cropLabelKo || zone.crop} · <span data-zone-growth-stage>${zone.currentCrop?.growth_stage || zone.currentCrop?.growthStage || zone.state}</span></h4>
            ${this.renderCropCycleReadOnlyCard(zone, stageKey)}
            ${this.renderCurrentCropAssignmentReadModel(zone)}
            ${this.renderGrowthTargetProjection(zone, stageKey)}
            ${this.renderEnvironmentImpactProjection(zone, stageKey)}
            ${this.renderRecommendationReviewProjection(zone, stageKey)}
            ${this.renderOperatorApprovalScaffold(zone, stageKey)}
            ${this.renderSafetyInterlockPreflightProjection(zone, stageKey)}
            ${this.renderVirtualExecutionRehearsalScaffold(zone, stageKey)}
            ${this.renderRehearsalResultReviewProjection(zone, stageKey)}
            ${this.renderVirtualRunnerInputContract(zone, stageKey)}
            ${this.renderVirtualRunnerDryRunResultAdapter(zone, stageKey)}
            ${this.renderVirtualRehearsalPassFailReviewProjection(zone, stageKey)}
            <p data-zone-context-state style="margin:0 0 10px;color:#5d6f62;font-size:13px;line-height:1.6;">${config.detail(zone)}</p>
            ${this.renderLoadingSkeleton(zone.dataStatus)}
            ${this.renderEmptyState(zone.dataStatus)}
            <dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;margin:0;color:#31523b;font-size:12px;">
              <dt style="font-weight:800;">기준</dt><dd style="margin:0;">${config.metric(zone)}</dd>
              <dt style="font-weight:800;">장비</dt><dd data-zone-context-equipment data-zone-equipment-profile style="margin:0;">${zone.equipmentProfile?.labels?.join(" · ") || zone.equipment.join(" · ")}</dd>
            </dl>
            <p data-zone-readonly-note style="margin:10px 0 0;color:#78927f;font-size:12px;line-height:1.5;">읽기 전용 · 추천은 실행 전 승인과 안전검사를 거친 뒤 별도 단계에서 다룹니다.</p>
            <button type="button" data-zone-detail-modal-button data-zone-detail-stage="${stageKey}" data-zone-detail-zone-id="${zone.id}" style="margin-top:12px;border:1px solid #cfe3d4;border-radius:999px;background:#f8fcf9;color:#31523b;padding:7px 11px;font-size:12px;font-weight:800;cursor:pointer;">구역 상세</button>
          </section>`;
        }).join("")}
      </div>
    `;
  }

  renderZoneDrilldown(stageKey) {
    const config = REBUILD_STAGE_DETAILS[stageKey];
    return `
      <div data-cba-component="MOD-CropStageZoneDetail" data-r7-detail-page-shell data-r7-detail-page-shell-grammar="detailHeader → evidenceSummary → zoneTabs → selectedZonePanel → optionalDetailModal" data-crop-os-stage-zone-detail data-zone-detail-stage="${stageKey}" style="margin-top:14px;border-top:1px solid #edf4ef;padding-top:12px;">
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
    const zone = this._findZoneForRender(zoneId);
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
    modal.style.display = "flex";
    document.body.classList.add("gs-modal-open");
    modal.querySelector("[data-zone-detail-modal-close]")?.focus();
  }

  _closeZoneDetailModal() {
    const modal = this.querySelector("[data-zone-detail-modal]");
    if (modal) {
      modal.hidden = true;
      modal.style.display = "none";
    }
    document.body.classList.remove("gs-modal-open");
  }

  renderOperatingHome() {
    const contextMeta = this._contextMetaForRender();
    return `
      <section data-cba-page="PAGE-CropCenteredHome" data-r7-main-dashboard data-crop-os-home data-rebuild-context-source="${contextMeta.contextSource}" data-rebuild-context-load-state="${this._contextLoadState}" data-rebuild-greenhouse-id="${contextMeta.greenhouseId}" data-rebuild-context-generated-at="${contextMeta.generatedAt}" style="display:grid;gap:14px;">
        ${this.renderContextLoadNotice()}
        <article data-r7-dashboard-hero style="border:1px solid #dcebe0;border-radius:22px;background:linear-gradient(135deg,#ffffff,#f0f8f2);padding:24px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:800;color:#5d7d64;letter-spacing:.08em;text-transform:uppercase;">Crop-centered OS</p>
          <h1 style="margin:0 0 12px;font-size:30px;line-height:1.2;color:#24323f;">작물 중심 운영체계</h1>
          <p style="margin:0;color:#5d6f62;line-height:1.7;">작물이 먼저이고 제어는 그 다음입니다. 작물상태 → 생육목표 → 환경·관수·장치 영향 → 추천·실행 흐름으로 오늘의 운영 판단을 정리합니다.</p>
          <p style="margin:14px 0 0;font-size:13px;color:#78927f;">구역별 세부 정보는 각 단계 안에서 탭으로 필요한 구역만 선택해 확인합니다 · 추천은 실행 전 승인과 안전검사를 거칩니다</p>
        </article>
        ${this.renderR7SourceShapesSummary()}
        <section data-crop-os-flow-stages data-r7-stage-grid data-cba-layout="single-column-stage-flow" style="display:grid;grid-template-columns:1fr;gap:18px;">
          <article data-r7-stage-card="crop-status" data-stage-card-shell data-crop-os-stage="crop-status" style="border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:20px;box-shadow:0 8px 24px rgba(49,82,59,.06);"><strong style="font-size:18px;color:#24323f;">1. 작물상태</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">작물의 현재 생육 상태, 이상 징후, 관찰 필요 지점을 먼저 보여줍니다.</p>${this.renderZoneDrilldown("crop-status")}</article>
          <article data-r7-stage-card="growth-goal" data-stage-card-shell data-crop-os-stage="growth-goal" style="border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:20px;box-shadow:0 8px 24px rgba(49,82,59,.06);"><strong style="font-size:18px;color:#24323f;">2. 생육목표</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">오늘 목표 생육 방향과 우선순위를 운영자가 이해할 수 있게 정리합니다.</p>${this.renderZoneDrilldown("growth-goal")}</article>
          <article data-r7-stage-card="environment-impact" data-stage-card-shell data-crop-os-stage="environment-impact" style="border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:20px;box-shadow:0 8px 24px rgba(49,82,59,.06);"><strong style="font-size:18px;color:#24323f;">3. 환경·관수·장치 영향</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">온도, 습도, 광, 관수, 장치 상태를 작물 영향 관점으로 묶어 보여줍니다.</p>${this.renderZoneDrilldown("environment-impact")}</article>
          <article data-r7-stage-card="recommend-act" data-stage-card-shell data-crop-os-stage="recommend-act" style="border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:20px;box-shadow:0 8px 24px rgba(49,82,59,.06);"><strong style="font-size:18px;color:#24323f;">4. 추천·실행</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">추천 이유를 확인하고, 승인과 안전검사 후 실행하는 흐름을 둡니다.</p>${this.renderZoneDrilldown("recommend-act")}</article>
        </section>
      </section>
    `;
  }

  renderZoneDetailModal() {
    return `
      <div data-cba-component="COM-ZoneDetailModal" data-zone-detail-modal role="dialog" aria-modal="true" aria-labelledby="zone-detail-modal-title" hidden style="display:none;position:fixed;inset:0;background:rgba(31,42,36,.38);z-index:10000;align-items:center;justify-content:center;padding:18px;">
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

  renderR7Sidebar() {
    return `<aside data-r7-sidebar data-r7-sidebar-primary-groups style="border:1px solid #dcebe0;border-radius:22px;background:#fff;padding:16px;display:grid;gap:10px;align-self:start;position:sticky;top:18px;">
      <div style="font-weight:1000;color:#24323f;font-size:18px;">Green Smart</div>
      <p style="margin:0;color:#78927f;font-size:12px;line-height:1.5;">작물 중심 운영 shell · read-only</p>
      ${R7_SIDEBAR_GROUPS.map((group) => `<a href="#${group.target}" data-r7-sidebar-group="${group.key}" data-r7-sidebar-target="${group.target}" style="display:block;border:1px solid #e2eee5;border-radius:14px;background:#f8fcf9;color:#31523b;text-decoration:none;padding:11px 12px;"><strong style="display:block;font-size:14px;">${group.label}</strong><span style="display:block;margin-top:4px;color:#78927f;font-size:11px;line-height:1.4;">${group.summary}</span></a>`).join("")}
    </aside>`;
  }

  renderR7MobileNav() {
    return `<nav data-r7-mobile-nav style="display:flex;gap:8px;overflow:auto;border:1px solid #dcebe0;border-radius:16px;background:#fff;padding:10px;">
      ${R7_SIDEBAR_GROUPS.map((group) => `<a href="#${group.target}" data-r7-mobile-nav-item="${group.key}" style="white-space:nowrap;border-radius:999px;background:#eef7f0;color:#31523b;text-decoration:none;padding:8px 10px;font-size:12px;font-weight:900;">${group.label}</a>`).join("")}
    </nav>`;
  }

  renderR7SettingsAdminDetail() {
    return `<section data-r7-settings-admin-detail data-r7-settings-admin-readonly-boundary="true" style="border:1px solid #d7e8db;border-radius:16px;background:#fbfdfb;padding:14px;display:grid;gap:12px;">
      <header>
        <p style="margin:0 0 5px;color:#5d7d64;font-size:11px;font-weight:1000;letter-spacing:.08em;text-transform:uppercase;">R7-004 read-only admin detail</p>
        <h4 style="margin:0;color:#24323f;font-size:16px;">설정·관리 · RBAC/config/admin 근거</h4>
        <p style="margin:8px 0 0;color:#5d6f62;font-size:12px;line-height:1.6;">RBAC_ROLE_OWNERSHIP, RBAC_PERMISSION_BUCKETS, RBAC_ADMIN_OWNERSHIP, RBAC_BACKEND_ENFORCED_ACTION_CLASSES를 운영자가 읽을 수 있는 근거로만 표시합니다.</p>
      </header>
      <section data-r7-settings-admin-role-ownership style="display:grid;gap:8px;">
        <strong style="color:#31523b;font-size:13px;">Role ownership matrix</strong>
        <div style="display:grid;grid-template-columns:1fr;gap:8px;">
          <p style="margin:0;border:1px solid #e2eee5;border-radius:12px;background:#fff;padding:10px;font-size:12px;line-height:1.5;"><b>admin</b><br>system_settings · HA mapping · RBAC · diagnostics · config metadata</p>
          <p style="margin:0;border:1px solid #e2eee5;border-radius:12px;background:#fff;padding:10px;font-size:12px;line-height:1.5;"><b>farm_owner</b><br>approvals · strategy review · high impact review · manage_farm_staff_roles</p>
          <p style="margin:0;border:1px solid #e2eee5;border-radius:12px;background:#fff;padding:10px;font-size:12px;line-height:1.5;"><b>farm_staff</b><br>daily records · routine monitoring · allowed routine actions</p>
        </div>
      </section>
      <section data-r7-settings-admin-permission-buckets style="display:grid;gap:8px;">
        <strong style="color:#31523b;font-size:13px;">Permission bucket matrix</strong>
        <p style="margin:0;color:#5d6f62;font-size:12px;line-height:1.6;">조회 · 기록 · 전략 · 실행 · 안전 · 고급설정</p>
        <p style="margin:0;color:#78927f;font-size:12px;line-height:1.6;">system_settings · edit_entity_mapping · view_audit_logs are admin/system evidence; write actions remain backend-enforced.</p>
      </section>
      <section data-r7-settings-admin-area="user-role-mapping" data-r7-settings-admin-farm-owner-staff-scope style="border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#31523b;font-size:13px;">User/role mapping</strong>
        <p style="margin:6px 0 0;color:#5d6f62;font-size:12px;line-height:1.6;">admin owns all role mapping. farm_owner scope is limited to farm_staff assignment evidence only; R7-004 does not mutate roles.</p>
      </section>
      <section data-r7-settings-admin-area="ha-entity-mapping" style="border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#31523b;font-size:13px;">HA entity mapping metadata</strong>
        <p style="margin:6px 0 0;color:#5d6f62;font-size:12px;line-height:1.6;">edit_entity_mapping belongs to admin. This page shows mapping ownership only and does not edit entities.</p>
      </section>
      <section data-r7-settings-admin-area="system-config-metadata" data-r7-settings-admin-secret-redaction style="border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#31523b;font-size:13px;">System config metadata</strong>
        <p style="margin:6px 0 0;color:#5d6f62;font-size:12px;line-height:1.6;">Raw secret material is never rendered. Stored secret fields are displayed only as [REDACTED].</p>
      </section>
      <section data-r7-settings-admin-area="diagnostics-backup-audit" style="border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#31523b;font-size:13px;">Diagnostics/backup/audit export metadata</strong>
        <p style="margin:6px 0 0;color:#5d6f62;font-size:12px;line-height:1.6;">Diagnostics and audit export ownership belongs to admin; farm_owner may receive summary-only review later by a separate slice.</p>
      </section>
      <section data-r7-settings-admin-area="rbac-policy-contract" data-r7-settings-admin-backend-enforcement style="border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#31523b;font-size:13px;">RBAC policy contract</strong>
        <p style="margin:6px 0 0;color:#5d6f62;font-size:12px;line-height:1.6;">RBAC_BACKEND_ENFORCED_ACTION_CLASSES = write / execute / save / delete / ack / clear / apply. UI visibility is presentation only.</p>
      </section>
    </section>`;
  }

  renderR7DetailSubpage(subpage) {
    return `<article data-r7-detail-subpage="${subpage.key}" data-r7-subpage-readonly-boundary="true" data-r7-subpage-config-placeholder style="border:1px solid #e2eee5;border-radius:18px;background:#fff;padding:16px;display:grid;gap:10px;">
      <header>
        <p style="margin:0 0 5px;color:#5d7d64;font-size:11px;font-weight:1000;letter-spacing:.08em;text-transform:uppercase;">read-only placeholder</p>
        <h3 style="margin:0;color:#24323f;font-size:18px;">${subpage.label}</h3>
      </header>
      <p data-r7-subpage-evidence-summary style="margin:0;color:#5d6f62;line-height:1.6;">${subpage.summary}</p>
      <p data-r7-subpage-source-freshness style="margin:0;color:#78927f;font-size:12px;line-height:1.5;">Source freshness: ${subpage.source}</p>
      <p data-r7-subpage-zone-scope style="margin:0;color:#31523b;font-size:12px;line-height:1.5;">Zone scope: ${subpage.zoneScope}</p>
      <p data-r7-subpage-safety-boundary style="margin:0;color:#8a6d1d;font-size:12px;line-height:1.5;">Safety/interlock boundary: ${subpage.safety}</p>
      ${subpage.key === "settings-admin" ? this.renderR7SettingsAdminDetail() : ""}
      <details style="border-top:1px solid #edf4ef;padding-top:8px;">
        <summary style="cursor:pointer;color:#31523b;font-size:12px;font-weight:900;">optional technical details</summary>
        <p style="margin:8px 0 0;color:#78927f;font-size:12px;line-height:1.5;">operator summary → source freshness → zone-scoped evidence → safety/interlock boundary → optional technical details</p>
      </details>
    </article>`;
  }

  renderR7SubpagePlaceholders() {
    return `<section data-r7-detail-subpages-baseline style="display:grid;gap:12px;">
      ${R7_DETAIL_SUBPAGES.map((subpage) => this.renderR7DetailSubpage(subpage)).join("")}
    </section>`;
  }

  renderR7PageShell() {
    return `<section data-r7-page-shell style="display:grid;gap:16px;">
      <header data-r7-page-header style="border:1px solid #dcebe0;border-radius:20px;background:linear-gradient(135deg,#ffffff,#f4faf5);padding:18px;">
        <p style="margin:0 0 6px;color:#5d7d64;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;">R7 Page Shell</p>
        <h2 style="margin:0;color:#24323f;font-size:22px;">운영 홈 · 작물 중심 작업공간</h2>
        <p style="margin:8px 0 0;color:#5d6f62;line-height:1.6;">사이드바는 운영 흐름을 고정하고, 본문은 기존 crop-centered dashboard를 그대로 감쌉니다. 실행 권한은 추가하지 않습니다.</p>
      </header>
      <div data-r7-page-workspace style="display:grid;gap:16px;">
        ${this.renderR7SubpagePlaceholders()}
        ${this.renderOperatingHome()}
      </div>
    </section>`;
  }

  render() {
    const nav = REBUILD_PAGES.map((page) => `<a href="#${page.key}" data-rebuild-nav-key="${page.key}" style="display:inline-flex;padding:8px 10px;border-radius:999px;background:#eef7f0;color:#31523b;text-decoration:none;font-size:13px;font-weight:700;">${page.label}</a>`).join("");
    this.innerHTML = `
      <main data-rebuild-root data-rebuild-blank-page data-r7-app-shell style="min-height:100vh;padding:24px;background:#f7faf7;color:#1f2a24;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="max-width:1280px;margin:0 auto;display:grid;gap:14px;">
          ${this.renderR7MobileNav()}
          <section data-rebuild-empty-shell style="border:1px solid #dcebe0;border-radius:18px;background:#fff;padding:18px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5d7d64;">Green Smart</p>
            <h2 style="margin:0 0 10px;font-size:22px;color:#24323f;">오늘의 작물 운영을 먼저 확인합니다</h2>
            <p style="margin:0;color:#5d6f62;line-height:1.6;">작물 상태와 목표를 기준으로 환경·관수·장치 영향을 함께 보고, 구역별 상세는 각 단계 안에서 확인합니다.</p>
            <nav data-rebuild-shell-nav style="display:flex;flex-wrap:wrap;gap:8px;margin-top:20px;">${nav}</nav>
          </section>
          <section style="display:grid;grid-template-columns:minmax(220px,280px) minmax(0,1fr);gap:18px;align-items:start;">
            ${this.renderR7Sidebar()}
            <section data-rebuild-shell-main>${this.renderR7PageShell()}</section>
          </section>
          <div data-rebuild-version="${REBUILD_VERSION}" style="font-size:12px;color:#78927f;">Green Smart ${REBUILD_VERSION}</div>
        </div>
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
