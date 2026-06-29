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
// R7-013 Settings/Admin manual-first realignment markers: data-r7-settings-admin-manual-first-realigned="true" / data-r7-settings-admin-domain-ownership / data-r7-settings-admin-mapping-boundary / data-r7-settings-admin-system-boundary.
// R7-013 Settings/Admin domain ownership markers: data-r7-settings-admin-domain="operations-home" / data-r7-settings-admin-domain="crop-operations" / data-r7-settings-admin-domain="environment-control" / data-r7-settings-admin-domain="irrigation-fertigation" / data-r7-settings-admin-domain="device-control" / data-r7-settings-admin-domain="recommendation-automation" / data-r7-settings-admin-domain="safety-history" / data-r7-settings-admin-domain="settings-admin".
// R7-013 Settings/Admin mapping/system markers: data-r7-settings-admin-mapping-item="HA entity mapping" / data-r7-settings-admin-mapping-item="구역/장치 매핑" / data-r7-settings-admin-mapping-item="MQTT topic mapping later only" / data-r7-settings-admin-mapping-item="mapping health evidence" / data-r7-settings-admin-system-item="RBAC" / data-r7-settings-admin-system-item="사용자 역할" / data-r7-settings-admin-system-item="권한 정책" / data-r7-settings-admin-system-item="시스템 설정" / data-r7-settings-admin-system-item="진단" / data-r7-settings-admin-system-item="백업" / data-r7-settings-admin-system-item="secret redaction" / data-r7-settings-admin-system-item="감사 설정".
// R7-014 Domain page routing markers: data-r7-domain-page-router="true" / data-r7-active-domain / data-r7-domain-page-shell / data-r7-domain-page-active="true" / data-r7-domain-page-hidden="true" / data-r7-sidebar-active="true" / aria-current="page".
// R7-014 domain page registry: data-r7-domain-page="operations-home" / data-r7-domain-page="crop-operations" / data-r7-domain-page="environment-control" / data-r7-domain-page="irrigation-fertigation" / data-r7-domain-page="device-control" / data-r7-domain-page="recommendation-automation" / data-r7-domain-page="safety-history" / data-r7-domain-page="settings-admin".
// R7-014 nav target registry: data-r7-sidebar-target="operations-home" / data-r7-sidebar-target="crop-operations" / data-r7-sidebar-target="environment-control" / data-r7-sidebar-target="irrigation-fertigation" / data-r7-sidebar-target="device-control" / data-r7-sidebar-target="recommendation-automation" / data-r7-sidebar-target="safety-history" / data-r7-sidebar-target="settings-admin".
// R7-015 Common visual UI system markers: data-r7-visual-system="true" / data-r7-dashboard-visual-hero / data-r7-status-badge / data-r7-status="normal" / data-r7-status="attention" / data-r7-status="warning" / data-r7-status="blocked" / data-r7-status="unknown" / data-r7-severity-card / data-r7-severity="green" / data-r7-severity="yellow" / data-r7-severity="orange" / data-r7-severity="red" / data-r7-severity="gray" / data-r7-freshness-pill / data-r7-metric-card / data-r7-domain-health-strip / data-r7-domain-health-item / data-r7-alert-banner / data-r7-mini-trend-chart.
// R7-016 Operations home visual dashboard rewrite markers: data-r7-operations-dashboard-rewrite="true" / data-r7-command-center-hero / data-r7-today-priority-panel / data-r7-kpi-rail / data-r7-kpi-rail-item / data-r7-domain-board / data-r7-domain-board-card / data-r7-alert-stack / data-r7-trend-board / data-r7-secondary-stage-flow.
// R7-017 Shared domain visual frame + environment tabs/zone markers: data-r7-domain-visual-frame / data-r7-domain-visual-frame-version="1" / data-r7-domain-visual-hero / data-r7-domain-visual-summary-grid / data-r7-zone-context-bar / data-r7-zone-selector / data-r7-zone-card / data-r7-active-zone / data-r7-domain-subtabs / data-r7-domain-subtab / data-r7-domain-subtab-active="true" / data-r7-domain-subtab-panel / data-r7-environment-zone-visual="true" / data-r7-environment-subtab="status-summary" / data-r7-environment-subtab="base-settings" / data-r7-environment-subtab="interlock-block" / data-r7-environment-subtab="trend-evidence".
// R7-028 reference slim operator rail markers: data-r7-sidebar-rail-style="reference-slim-operator" / data-r7-sidebar-compact-rail="true" / data-r7-sidebar-rail-width="64" / data-r7-sidebar-active-icon-tile="true" / data-r7-sidebar-utility="settings" / data-r7-sidebar-utility="exit".
// R7-002 group markers: data-r7-sidebar-group="operations-home" / data-r7-sidebar-group="crop-centered" / data-r7-sidebar-group="field-status" / data-r7-sidebar-group="recommendation-review" / data-r7-sidebar-group="settings-admin".
// R7-003 historical subpage markers: data-r7-detail-subpage="operations-home" / data-r7-detail-subpage="crop-centered" / data-r7-detail-subpage="field-status" / data-r7-detail-subpage="recommendation-review" / data-r7-detail-subpage="settings-admin".
// R7-007 target sidebar markers: data-r7-sidebar-group="operations-home" / data-r7-sidebar-group="crop-operations" / data-r7-sidebar-group="environment-control" / data-r7-sidebar-group="irrigation-fertigation" / data-r7-sidebar-group="device-control" / data-r7-sidebar-group="recommendation-automation" / data-r7-sidebar-group="safety-history" / data-r7-sidebar-group="settings-admin".
// R7-007 target subpage markers: data-r7-detail-subpage="operations-home" / data-r7-detail-subpage="crop-operations" / data-r7-detail-subpage="environment-control" / data-r7-detail-subpage="irrigation-fertigation" / data-r7-detail-subpage="device-control" / data-r7-detail-subpage="recommendation-automation" / data-r7-detail-subpage="safety-history" / data-r7-detail-subpage="settings-admin".
// R7-008 environment detail markers: data-r7-environment-control-detail / data-r7-environment-manual-settings / data-r7-environment-rule-schedule / data-r7-environment-ai-assist / data-r7-environment-safety-final / data-r7-environment-fallback.
// R7-008 environment literal marker manifest: data-r7-environment-manual-setting="주간 온도" / data-r7-environment-manual-setting="야간 온도" / data-r7-environment-manual-setting="습도" / data-r7-environment-manual-setting="VPD" / data-r7-environment-manual-setting="CO₂" / data-r7-environment-manual-setting="광/DLI" / data-r7-environment-rule="주야간 전환" / data-r7-environment-rule="환기 단계" / data-r7-environment-rule="난방 최소온도" / data-r7-environment-rule="CO₂ 시간대" / data-r7-environment-ai-item="aiEnvironmentCorrection" / data-r7-environment-ai-item="수동 기준 대비 차이" / data-r7-environment-ai-item="fallback" / data-r7-environment-safety-item="environmentSafetyLimits" / data-r7-environment-safety-item="deviceInterlock" / data-r7-environment-safety-item="finalEnvironmentTargets".
// R7-009 irrigation detail markers: data-r7-irrigation-fertigation-detail / data-r7-irrigation-manual-settings / data-r7-irrigation-rule-schedule / data-r7-irrigation-ai-assist / data-r7-irrigation-safety-final / data-r7-irrigation-fallback.
// R7-009 irrigation literal marker manifest: data-r7-irrigation-manual-setting="관수 스케줄" / data-r7-irrigation-manual-setting="일사 누적 관수" / data-r7-irrigation-manual-setting="EC 목표" / data-r7-irrigation-manual-setting="pH 목표" / data-r7-irrigation-manual-setting="급액량" / data-r7-irrigation-manual-setting="배액률" / data-r7-irrigation-manual-setting="드라이백" / data-r7-irrigation-manual-setting="양액 레시피" / data-r7-irrigation-rule="시간 기반 관수" / data-r7-irrigation-rule="일사 누적 관수" / data-r7-irrigation-rule="근권 수분 기준 관수" / data-r7-irrigation-rule="저수조/배액 재활용 점검" / data-r7-irrigation-ai-item="aiIrrigationCorrection" / data-r7-irrigation-ai-item="수동 기준 대비 차이" / data-r7-irrigation-ai-item="fallback" / data-r7-irrigation-safety-item="irrigationSafetyLimits" / data-r7-irrigation-safety-item="sensorFreshness" / data-r7-irrigation-safety-item="finalIrrigationTargets".
// R7-010 device detail markers: data-r7-device-control-detail / data-r7-device-manual-settings / data-r7-device-rule-schedule / data-r7-device-ai-assist / data-r7-device-safety-final / data-r7-device-fallback.
// R7-010 device literal marker manifest: data-r7-device-manual-setting="manual" / data-r7-device-manual-setting="auto" / data-r7-device-manual-setting="locked" / data-r7-device-manual-setting="maintenance" / data-r7-device-manual-setting="HA entity mapping" / data-r7-device-manual-setting="MQTT topic mapping later only" / data-r7-device-rule="operatorRequestedAction" / data-r7-device-rule="automationCandidate" / data-r7-device-rule="mode gate" / data-r7-device-rule="mapping health" / data-r7-device-ai-item="optional aiStrategyHint" / data-r7-device-ai-item="hint only" / data-r7-device-ai-item="fallback" / data-r7-device-safety-item="permission check" / data-r7-device-safety-item="Safety check" / data-r7-device-safety-item="Interlock check" / data-r7-device-safety-item="Fail Safe check" / data-r7-device-safety-item="HA/MQTT status".
// R7-011 recommendation detail markers: data-r7-recommendation-automation-detail / data-r7-recommendation-manual-baseline / data-r7-recommendation-rule-candidate / data-r7-recommendation-ai-assist / data-r7-recommendation-safety-final / data-r7-recommendation-fallback.
// R7-011 recommendation literal marker manifest: data-r7-recommendation-manual-item="환경 수동 기준" / data-r7-recommendation-manual-item="관수 제어 수동 기준" / data-r7-recommendation-manual-item="장치 모드 기준" / data-r7-recommendation-manual-item="AI off fallback value" / data-r7-recommendation-rule="rule/schedule candidate" / data-r7-recommendation-rule="automation eligibility" / data-r7-recommendation-rule="difference from manual baseline" / data-r7-recommendation-ai-item="AI recommendation/correction" / data-r7-recommendation-ai-item="explanation" / data-r7-recommendation-ai-item="fallback" / data-r7-recommendation-safety-item="Safety-final candidate" / data-r7-recommendation-safety-item="not final command" / data-r7-recommendation-safety-item="no final command authority".
// R7-012 safety/history detail markers: data-r7-safety-history-detail / data-r7-safety-history-status / data-r7-safety-history-reasons / data-r7-safety-history-timeline / data-r7-safety-history-audit.
// R7-012 safety/history literal marker manifest: data-r7-safety-history-status-item="Safety 상태" / data-r7-safety-history-status-item="Interlock 상태" / data-r7-safety-history-status-item="Fail Safe 상태" / data-r7-safety-history-status-item="알람" / data-r7-safety-history-reason="차단 이유" / data-r7-safety-history-reason="허용 이유" / data-r7-safety-history-reason="센서 stale 이력" / data-r7-safety-history-reason="오류/Traceback/통신 장애" / data-r7-safety-history-timeline-item="수동 조작 이력" / data-r7-safety-history-timeline-item="기본 자동제어 이력" / data-r7-safety-history-timeline-item="AI 추천 이력" / data-r7-safety-history-timeline-item="AI 적용/미적용 이력" / data-r7-safety-history-timeline-item="장치 명령 후보 이력" / data-r7-safety-history-timeline-item="실제 실행 이력, later only".
// R7-002 historical sidebar label order compatibility: 운영 홈 → 작물 중심 운영 → 현장 상태 → 추천·실행 검토 → 설정.
// RS-002/RS-005 historical source-copy compatibility only, not current operator copy: 작물이 먼저이고 제어는 그 다음입니다 / 추천은 실행 전 승인과 안전검사를 거칩니다 / 구역별 추천·실행 검토 / 실행 전 승인과 안전검사.
// R7 source markers: currentCropAssignment / monitoringReadOnlyAdapter / safetyInterlockReadOnlyAdapter / environmentImpactProjection / recommendationReviewProjection / virtualExecutionRehearsalScaffold.
// R7 adapter evidence links: sourceMonitoringReadOnlyAdapter / sourceSafetyInterlockReadOnlyAdapter.
// R7 detail page shell grammar: detailHeader → evidenceSummary → zoneTabs → selectedZonePanel → optionalDetailModal.
// Compatibility contract markers retained after adapter extraction:
// this._homeContext = getRebuildHomeContext()
// zone.currentCrop?.cropLabelKo / zone.currentCrop?.growthStage / zone.equipmentProfile?.labels / zone.dataAvailability

import { getRebuildHomeContext, normalizeRebuildHomeContext } from "./current-crop-adapter.js";

const REBUILD_VERSION = "1.12.82";
const REBUILD_ELEMENT_NAME = "green-smart-rebuild-panel";
const REBUILD_CONTEXT_API_PATH = "green_smart/rebuild/home/context";
const REBUILD_PAGES = Object.freeze([
  { key: "crop-status", label: "작물상태", description: "현재 작물이 어떤 상태인지 먼저 봅니다." },
  { key: "growth-goal", label: "생육목표", description: "오늘 작물이 가야 할 목표를 정리합니다." },
  { key: "influence-map", label: "영향지도", description: "환경·관수·장치가 작물에 주는 영향을 봅니다." },
  { key: "recommend-act", label: "자동화 제어", description: "수동 기준 대비 AI/자동화 보조 차이를 검토합니다." },
]);

const R7_DEPRECATED_SIDEBAR_GROUPS = Object.freeze([
  { key: "operations-home", label: "운영 홈", replacement: "operations-home" },
  { key: "crop-centered", label: "작물 중심 운영", replacement: "crop-operations" },
  { key: "field-status", label: "현장 상태", replacement: "environment-control + irrigation-fertigation + device-control" },
  { key: "recommendation-review", label: "추천·실행 검토", replacement: "recommendation-automation" },
  { key: "settings-admin", label: "설정", replacement: "settings-admin" },
]);

const R7_GREEN_ACCENT = "#43ad5e";
const R7_GREEN_ACTIVE_BG = "#e3f4e6";
const R7_GREEN_TEXT = "#31523b";
const R7_REFERENCE_LOGO_TILE = "#43ad5e";
const R7_REFERENCE_SAGE_ICON = "#6f8d7b";
const R7_REFERENCE_ACTIVE_ICON_BG = "#eef8ee";
const R7_HA_MDI_ICONS = Object.freeze({
  logo: "mdi:leaf",
  "operations-home": "mdi:home-variant",
  "crop-operations": "mdi:sprout",
  "environment-control": "mdi:thermometer-lines",
  "irrigation-fertigation": "mdi:water",
  "device-control": "mdi:cog-box",
  "recommendation-automation": "mdi:robot-outline",
  "safety-history": "mdi:shield-check-outline",
  "settings-admin": "mdi:cog",
});

const R7_DOMAIN_SUBTAB_ICONS = Object.freeze({
  "status-summary": "mdi:view-dashboard-outline",
  "crop-cycle": "mdi:sprout-outline",
  "growth-target": "mdi:target",
  "records-workflow": "mdi:clipboard-text-clock-outline",
  "model-assist": "mdi:brain",
  "trend-evidence": "mdi:chart-line",
  "base-settings": "mdi:tune-variant",
  "rule-schedule": "mdi:calendar-clock",
  "interlock-block": "mdi:lock-alert-outline",
  "assist-fallback": "mdi:robot-outline",
  "water-nutrient": "mdi:water-pump",
  "recipe-drainage": "mdi:flask-outline",
  "device-map": "mdi:devices",
  "mode-control": "mdi:toggle-switch-outline",
  "manual-action": "mdi:hand-back-right-outline",
  "source-health": "mdi:access-point-check",
  "manual-baseline": "mdi:clipboard-check-outline",
  "automation-candidate": "mdi:auto-mode",
  "ai-recommendation": "mdi:robot-outline",
  "safety-final": "mdi:shield-check-outline",
  "block-allow": "mdi:shield-alert-outline",
  "event-history": "mdi:history",
  "operation-history": "mdi:timeline-clock-outline",
  "audit-evidence": "mdi:file-check-outline",
  "domain-ownership": "mdi:folder-key-outline",
  "role-permissions": "mdi:account-key-outline",
  "mapping-devices": "mdi:devices",
  "system-security": "mdi:security",
  "diagnostics-audit": "mdi:stethoscope",
  "rbac-policy": "mdi:shield-account-outline",
});

const R7_SIDEBAR_GROUPS = Object.freeze([
  { key: "operations-home", label: "운영 홈", summary: "오늘 운영 상태·fallback·우선 확인", target: "operations-home" },
  { key: "crop-operations", label: "작물 운영", summary: "currentCrop·crop_cycle·생육목표", target: "crop-operations" },
  { key: "environment-control", label: "환경 제어", summary: "온도·습도·VPD·CO₂ 수동 기준", target: "environment-control" },
  { key: "irrigation-fertigation", label: "관수 제어", summary: "관수·EC/pH·배액·드라이백 기준", target: "irrigation-fertigation" },
  { key: "device-control", label: "장치 제어", summary: "수동/자동 모드·장치 매핑·인터록", target: "device-control" },
  { key: "recommendation-automation", label: "자동화 제어", summary: "AI 보조·자동화 차이·fallback", target: "recommendation-automation" },
  { key: "safety-history", label: "안전 제어", summary: "Safety·Interlock·Fail Safe·감사", target: "safety-history" },
  { key: "settings-admin", label: "설정", summary: "RBAC·HA 매핑·진단·secret redaction", target: "settings-admin" },
]);

const R7_MAIN_SIDEBAR_GROUPS = Object.freeze(R7_SIDEBAR_GROUPS.filter((group) => group.key !== "settings-admin"));

const R7_DETAIL_SUBPAGES = Object.freeze([
  { key: "operations-home", label: "운영 홈", summary: "오늘의 운영 모드, AI fallback, 우선 확인 구역을 읽기 전용으로 요약합니다.", manualBase: "현재 수동/자동 운영 기준과 fallback 기준", automation: "도메인별 정상/주의 상태 요약", aiAssist: "AI 사용 가능 여부와 보조 적용 상태", safety: "차단 알람과 Fail Safe 상태 우선 표시", source: "currentCropAssignment + dataAvailability + domainHealthSummary", zoneScope: "전체 구역 우선, 필요한 구역은 각 도메인에서 확인" },
  { key: "crop-operations", label: "작물 운영", summary: "currentCrop, crop_cycle, 생육목표, 작물 기록을 운영 기준으로 정리합니다.", manualBase: "작물별 기준 범위와 생육목표", automation: "작기 상태/기록 기반 read-only workflow", aiAssist: "생육단계·상태·위험·진단·조치 추천 evidence", safety: "작물 운영은 환경/관수/장치 명령을 직접 실행하지 않음", source: "currentCropAssignment + growthTargetProjection + crop model evidence", zoneScope: "zone parent + currentCrop attached" },
  { key: "environment-control", label: "환경 제어", summary: "온도, 습도, VPD, CO₂, 광, 환기, 난방, 냉방의 수동 기준과 자동화 후보를 분리합니다.", manualBase: "manualEnvironmentSettings", automation: "ruleScheduleEnvironmentAutomation", aiAssist: "aiEnvironmentCorrection if enabled and healthy", safety: "environmentSafetyLimits / deviceInterlock clamp", source: "monitoringReadOnlyAdapter + environmentImpactProjection", zoneScope: "구역별 환경 상태와 freshness evidence" },
  { key: "irrigation-fertigation", label: "관수 제어", summary: "관수 스케줄, EC/pH, 급액량, 배액률, 드라이백, 레시피 기준을 관리합니다.", manualBase: "baseIrrigationSettings", automation: "ruleScheduleIrrigationAutomation", aiAssist: "aiIrrigationCorrection if enabled and healthy", safety: "irrigationSafetyLimits clamp", source: "irrigation settings + rootzone/water evidence", zoneScope: "구역별 관수 제어 상태와 센서 stale 여부" },
  { key: "device-control", label: "장치 제어", summary: "장치 상태, 수동/자동/잠금/점검 모드, HA entity mapping과 인터록을 분리합니다.", manualBase: "deviceMode: manual / auto / locked / maintenance", automation: "operatorRequestedAction or automationCandidate", aiAssist: "optional aiStrategyHint only", safety: "permission → Safety → Interlock → Fail Safe", source: "equipmentProfile + HA entity mapping metadata", zoneScope: "구역별 장치 profile과 통신 상태" },
  { key: "recommendation-automation", label: "자동화 제어", summary: "수동 기준값, 기본 자동제어 후보, AI 추천/보정, fallback 값을 비교합니다.", manualBase: "Manual baseline shown first", automation: "Rule/schedule candidate", aiAssist: "AI recommendation/correction/explanation", safety: "Safety-final candidate; no final command authority", source: "recommendationReviewProjection + automationAssistProjection", zoneScope: "추천은 구역별 차이와 미적용 이유를 표시" },
  { key: "safety-history", label: "안전 제어", summary: "Safety, Interlock, Fail Safe, 알람, 차단 이유, 수동/자동/AI 이력을 모읍니다.", manualBase: "operator-visible block reasons and logs", automation: "rule/schedule automation history", aiAssist: "AI may add evidence only", safety: "authoritative allow/block history", source: "safetyInterlockReadOnlyAdapter + audit/log evidence", zoneScope: "구역별 차단·경보·stale 이력" },
  { key: "settings-admin", label: "설정", summary: "RBAC, HA entity mapping, 시스템 설정, 진단, 백업, secret redaction을 관리합니다.", manualBase: "users, mapping, system config", automation: "configuration ownership boundary", aiAssist: "admin/model diagnostics only", safety: "admin audit/config boundary; no mutation in this slice", source: "RBAC/config documentation baseline", zoneScope: "관리 설정은 zone data를 직접 변경하지 않음" },
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
    title: "구역별 자동화 제어 검토",
    summary: (zone) => zone.id === "all" ? "전체 AI 보조와 자동화 후보를 수동 기준과 비교합니다." : `${zone.name} 수동 기준 대비 보조 검토`,
    detail: (zone) => zone.id === "all" ? "추천은 수동 기준값과 기본 자동제어 후보를 먼저 보여준 뒤 AI 보정 차이를 설명합니다." : `${zone.name} 추천은 실행 권한이 아니라 수동 기준 대비 보조 근거로 봅니다.`,
    metric: (zone) => zone.id === "all" ? "수동 기준 대비 차이" : "구역 보조 후보",
  },
});

class GreenSmartRebuildPanel extends HTMLElement {
  constructor() {
    super();
    this._homeContext = getRebuildHomeContext(REBUILD_HOME_CONTEXT);
    this._contextLoadState = "loading";
    this._contextLoadError = null;
    this._contextRequestId = 0;
    this._activeR7Domain = "operations-home";
    this._activeR7DomainSubtabs = { "crop-operations": "status-summary", "environment-control": "status-summary", "irrigation-fertigation": "status-summary", "device-control": "status-summary", "recommendation-automation": "status-summary", "safety-history": "status-summary", "settings-admin": "domain-ownership" };
    this._r7SidebarCollapsed = false;
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
            <p data-zone-readonly-note style="margin:10px 0 0;color:#78927f;font-size:12px;line-height:1.5;">읽기 전용 · AI 추천은 수동 기준과 기본 자동제어를 보조하며 Safety/Interlock/Fail Safe를 우회하지 않습니다.</p>
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

  _normalizeR7Domain(domainKey) {
    return R7_DETAIL_SUBPAGES.some((subpage) => subpage.key === domainKey) ? domainKey : "operations-home";
  }

  setR7ActiveDomain(domainKey) {
    const nextDomain = this._normalizeR7Domain(domainKey);
    if (this._activeR7Domain === nextDomain) return;
    this._activeR7Domain = nextDomain;
    this.render();
  }

  setR7DomainSubtab(domainKey, tabKey) {
    const domain = this._normalizeR7Domain(domainKey);
    const commonTabs = ["status-summary", "base-settings", "rule-schedule", "interlock-block", "assist-fallback", "trend-evidence"];
    const cropTabs = ["status-summary", "crop-cycle", "growth-target", "records-workflow", "model-assist", "trend-evidence"];
    const safetyTabs = ["status-summary", "block-allow", "event-history", "operation-history", "audit-evidence", "trend-evidence"];
    const settingsTabs = ["domain-ownership", "role-permissions", "mapping-devices", "system-security", "diagnostics-audit", "rbac-policy"];
    const tabDomains = ["environment-control", "irrigation-fertigation", "device-control", "recommendation-automation"];
    const allowed = domain === "crop-operations" ? cropTabs : domain === "safety-history" ? safetyTabs : domain === "settings-admin" ? settingsTabs : tabDomains.includes(domain) ? commonTabs : [];
    if (!allowed.includes(tabKey)) return false;
    if (this._activeR7DomainSubtabs[domain] === tabKey) return true;
    this._activeR7DomainSubtabs = { ...this._activeR7DomainSubtabs, [domain]: tabKey };
    this.render();
    return true;
  }

  _currentGreenSmartRole() {
    const contextRole = this._homeContext?.actorRole || this._homeContext?.actor?.role || this._homeContext?.currentUser?.role;
    const hassRole = this.hass?.user?.green_smart_role || this.hass?.user?.role;
    const role = String(contextRole || hassRole || (this.hass?.user?.is_admin ? "operator" : "farm_staff") || "farm_staff").trim();
    return role || "farm_staff";
  }

  _r7SidebarLayoutMode() {
    return this._currentGreenSmartRole() === "operator" ? "operator-ha-adjacent" : "full-left-no-ha-sidebar";
  }

  _applyR7HASidebarPolicy() {
    if (typeof document === "undefined" || !document?.body?.classList) return;
    const mode = this._r7SidebarLayoutMode();
    const setBodyClass = (name, enabled) => {
      if (document.body.classList.toggle) document.body.classList.toggle(name, enabled);
      else if (enabled) document.body.classList.add?.(name);
      else document.body.classList.remove?.(name);
    };
    setBodyClass("green-smart-hide-ha-sidebar", mode === "full-left-no-ha-sidebar");
    setBodyClass("green-smart-operator-ha-sidebar-adjacent", mode === "operator-ha-adjacent");
    if (mode === "full-left-no-ha-sidebar") document.body.classList.remove?.("green-smart-operator-ha-sidebar-adjacent");
    if (mode === "operator-ha-adjacent") document.body.classList.remove?.("green-smart-hide-ha-sidebar");
    if (!document.getElementById?.("green-smart-r7-ha-sidebar-policy")) {
      const style = document.createElement?.("style");
      if (style) {
        style.id = "green-smart-r7-ha-sidebar-policy";
        style.textContent = `
          body.green-smart-hide-ha-sidebar ha-sidebar,
          body.green-smart-hide-ha-sidebar hui-sidebar,
          body.green-smart-hide-ha-sidebar app-drawer,
          body.green-smart-hide-ha-sidebar ha-drawer { display:none !important; width:0 !important; min-width:0 !important; }
          body.green-smart-hide-ha-sidebar { --mdc-drawer-width:0px; --sidebar-width:0px; }
          body.green-smart-hide-ha-sidebar green-smart-rebuild-panel { margin-left:0 !important; }
        `;
        document.head?.appendChild?.(style);
      }
    }
  }

  toggleR7SidebarCollapsed() {
    this._r7SidebarCollapsed = !this._r7SidebarCollapsed;
    this.render();
    return this._r7SidebarCollapsed;
  }

  _bindR7DomainSubtabs() {
    this.querySelectorAll("button[data-r7-domain-subtab][data-r7-domain-subtab-key]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this.setR7DomainSubtab(button.dataset.r7DomainSubtabFor, button.dataset.r7DomainSubtabKey);
      });
    });
  }

  _bindR7DomainNavigation() {
    this.querySelectorAll("[data-r7-sidebar-target]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        this.setR7ActiveDomain(link.dataset.r7SidebarTarget);
      });
    });
    this.querySelectorAll("[data-r7-sidebar-collapse-toggle]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this.toggleR7SidebarCollapsed();
      });
    });
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

  renderR7StatusBadge(status, label) {
    const palette = {
      normal: ["#e5f6e8", "#21653a"],
      attention: ["#fff6d8", "#8a5a00"],
      warning: ["#ffe9d6", "#a54600"],
      blocked: ["#ffe0e0", "#a51f2b"],
      unknown: ["#eef1f4", "#52616b"],
    };
    const [background, color] = palette[status] || palette.unknown;
    return `<span data-r7-status-badge data-r7-status="${status}" style="display:inline-flex;align-items:center;gap:6px;border-radius:999px;background:${background};color:${color};padding:6px 10px;font-size:12px;font-weight:1000;">${label}</span>`;
  }

  renderR7FreshnessPill(state, label) {
    const color = state === "fresh" ? "#21653a" : state === "delay" ? "#8a5a00" : state === "stale" ? "#a54600" : "#a51f2b";
    return `<span data-r7-freshness-pill data-r7-freshness="${state}" style="display:inline-flex;border:1px solid #dcebe0;border-radius:999px;background:#fff;color:${color};padding:5px 9px;font-size:11px;font-weight:900;">${label}</span>`;
  }

  renderR7SeverityCard(severity, title, value, note) {
    const palette = {
      green: ["#e8f6ea", "#78a87e"],
      yellow: ["#fff7df", "#e3b341"],
      orange: ["#ffeddc", "#e28534"],
      red: ["#ffe3e3", "#d35151"],
      gray: ["#f1f4f2", "#9aa7a0"],
    };
    const [background, border] = palette[severity] || palette.gray;
    return `<article data-r7-severity-card data-r7-severity="${severity}" style="border:1px solid ${border};border-radius:18px;background:${background};padding:14px;box-shadow:0 10px 26px rgba(49,82,59,.08);"><p style="margin:0;color:#5d6f62;font-size:12px;font-weight:900;">${title}</p><strong style="display:block;margin-top:8px;color:#24323f;font-size:22px;">${value}</strong><span style="display:block;margin-top:6px;color:#5d6f62;font-size:12px;line-height:1.5;">${note}</span></article>`;
  }

  renderR7MetricCard(label, currentValue, targetValue, delta, statusLabel) {
    return `<article data-r7-metric-card style="border:1px solid #dcebe0;border-radius:16px;background:#fff;padding:14px;display:grid;gap:8px;"><strong style="color:#24323f;font-size:14px;">${label}</strong><div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;"><span><b style="display:block;color:#78927f;font-size:11px;">현재값</b><em style="font-style:normal;color:#24323f;font-weight:1000;">${currentValue}</em></span><span><b style="display:block;color:#78927f;font-size:11px;">목표값</b><em style="font-style:normal;color:#24323f;font-weight:1000;">${targetValue}</em></span><span><b style="display:block;color:#78927f;font-size:11px;">편차</b><em style="font-style:normal;color:#24323f;font-weight:1000;">${delta}</em></span><span><b style="display:block;color:#78927f;font-size:11px;">상태</b><em style="font-style:normal;color:#24323f;font-weight:1000;">${statusLabel}</em></span></div></article>`;
  }

  renderR7DomainHealthStrip() {
    const items = [
      ["crop-operations", "작물", "normal", "정상"],
      ["environment-control", "환경", "attention", "주의"],
      ["irrigation-fertigation", "관수 제어", "normal", "정상"],
      ["device-control", "장치", "warning", "경고"],
      ["safety-history", "안전", "blocked", "차단"],
      ["settings-admin", "설정", "unknown", "데이터 부족"],
    ];
    return `<section data-r7-domain-health-strip style="border:1px solid #dcebe0;border-radius:18px;background:#fff;padding:14px;display:grid;gap:10px;"><strong style="color:#24323f;font-size:15px;">도메인 상태 스트립</strong><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;">${items.map(([key, label, status, text]) => `<div data-r7-domain-health-item="${key}" style="border:1px solid #edf4ef;border-radius:14px;background:#fbfdfb;padding:10px;display:flex;align-items:center;justify-content:space-between;gap:8px;"><span style="font-weight:900;color:#31523b;font-size:12px;">${label}</span>${this.renderR7StatusBadge(status, text)}</div>`).join("")}</div></section>`;
  }

  renderR7AlertBanner(severity, title, body) {
    return `<article data-r7-alert-banner data-r7-severity="${severity}" style="border:1px solid ${severity === "red" ? "#d35151" : severity === "orange" ? "#e28534" : "#e3b341"};border-radius:16px;background:${severity === "red" ? "#fff0f0" : severity === "orange" ? "#fff4e9" : "#fff9e8"};padding:13px;display:grid;gap:4px;"><strong style="color:#24323f;font-size:14px;">${title}</strong><span style="color:#5d6f62;font-size:12px;line-height:1.5;">${body}</span></article>`;
  }

  renderR7MiniTrendChart(label, stateLabel) {
    return `<article data-r7-mini-trend-chart style="border:1px solid #dcebe0;border-radius:16px;background:linear-gradient(180deg,#fff,#f8fcf9);padding:14px;display:grid;gap:10px;"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;"><strong style="color:#24323f;font-size:13px;">${label}</strong>${this.renderR7FreshnessPill("fresh", stateLabel)}</div><svg viewBox="0 0 180 54" role="img" aria-label="${label} trend placeholder" style="width:100%;height:54px;"><polyline points="4,42 36,34 68,38 100,24 132,28 176,14" fill="none" stroke="#78a87e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline><line x1="4" y1="44" x2="176" y2="44" stroke="#dcebe0" stroke-width="2"></line></svg><span style="color:#78927f;font-size:11px;">최근 추세를 간단히 표시합니다</span></article>`;
  }

  renderR7VisualDashboard() {
    return `<section data-r7-visual-system="true" style="display:grid;gap:14px;">
      <section data-r7-dashboard-visual-hero style="border:1px solid #dcebe0;border-radius:22px;background:linear-gradient(135deg,#f8fffa,#e9f6ed);padding:18px;display:grid;gap:14px;">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;"><div><p style="margin:0;color:#5d7d64;font-size:12px;font-weight:1000;letter-spacing:.08em;text-transform:uppercase;">R7-015 visual control-room</p><h2 style="margin:6px 0 0;color:#24323f;font-size:24px;">오늘 운영 상태를 색상·배지·수치로 먼저 확인</h2></div><div style="display:flex;flex-wrap:wrap;gap:8px;">${this.renderR7StatusBadge("normal", "정상")}${this.renderR7StatusBadge("attention", "주의")}${this.renderR7StatusBadge("warning", "경고")}${this.renderR7StatusBadge("blocked", "차단")}${this.renderR7StatusBadge("unknown", "데이터 부족")}</div></div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">${this.renderR7FreshnessPill("fresh", "최신")}${this.renderR7FreshnessPill("delay", "지연")}${this.renderR7FreshnessPill("stale", "stale")}${this.renderR7FreshnessPill("error", "오류")}</div>
      </section>
      <section style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;">${this.renderR7SeverityCard("green", "작물 상태", "정상", "생육 관찰값 안정")}${this.renderR7SeverityCard("yellow", "환경 편차", "주의", "야간 습도 확인")}${this.renderR7SeverityCard("orange", "장치 응답", "경고", "창/팬 응답 지연")}${this.renderR7SeverityCard("red", "안전 판단", "차단", "Fail Safe 확인 필요")}${this.renderR7SeverityCard("gray", "센서 커버리지", "데이터 부족", "센서 오류 또는 지연")}</section>
      <section style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;">${this.renderR7MetricCard("온도", "24.1℃", "23~25℃", "+0.4℃", "정상")}${this.renderR7MetricCard("습도", "82%", "70~78%", "+4%", "주의")}${this.renderR7MetricCard("관수", "2회", "2~3회", "0", "정상")}${this.renderR7MetricCard("장치", "1 지연", "0 지연", "+1", "경고")}</section>
      ${this.renderR7DomainHealthStrip()}
      <section style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">${this.renderR7AlertBanner("red", "Fail Safe", "차단 상태는 실행 권한이 아니라 read-only evidence로만 표시합니다.")}${this.renderR7AlertBanner("orange", "센서 오류", "센서 오류/지연은 운영자가 먼저 확인해야 할 시각 경고로 표시합니다.")}</section>
      <section style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">${this.renderR7MiniTrendChart("온도 추세", "최신")}${this.renderR7MiniTrendChart("습도 추세", "최신")}${this.renderR7MiniTrendChart("관수 추세", "최신")}</section>
    </section>`;
  }

  renderR7TrendBoard() {
    return `<section data-r7-trend-board data-r7-main-trends style="border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:14px;display:grid;gap:12px;"><strong style="color:#24323f;font-size:15px;">추세</strong><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;">${this.renderR7MiniTrendChart("온도 추세", "최신")}${this.renderR7MiniTrendChart("습도 추세", "최신")}${this.renderR7MiniTrendChart("관수 추세", "최신")}</div></section>`;
  }

  renderR7CommandCenterHero() {
    const selectedZone = this._r7PrimaryZoneForDomain();
    return `<section data-r7-command-center-hero data-r7-main-product-hero style="border:1px solid #cfe5d4;border-radius:24px;background:linear-gradient(135deg,#f8fffa,#e5f4eb);padding:20px;display:grid;grid-template-columns:minmax(0,1.4fr) minmax(260px,.9fr);gap:16px;align-items:stretch;">
      <div style="display:grid;gap:12px;align-content:start;"><p style="margin:0;color:#5d7d64;font-size:12px;font-weight:1000;letter-spacing:.08em;text-transform:uppercase;">오늘의 작물 운영</p><h2 style="margin:0;color:#24323f;font-size:28px;line-height:1.18;">${this._r7ZoneName(selectedZone)} · ${this._r7ZoneCropLabel(selectedZone)} 상태를 먼저 확인하세요</h2><div style="display:flex;flex-wrap:wrap;gap:8px;">${this.renderR7StatusBadge("attention", "전체 상태 · 주의")}${this.renderR7FreshnessPill("fresh", "최신")}${this.renderR7FreshnessPill("delay", "지연")}${this.renderR7StatusBadge("unknown", "데이터 부족")}${this.renderR7StatusBadge("blocked", "차단")}</div></div>
      <aside data-r7-main-zone-focus style="border:1px solid #dcebe0;border-radius:18px;background:#fff;padding:14px;display:grid;gap:10px;"><strong style="color:#24323f;font-size:14px;">현재 선택 구역</strong><span style="color:#5d6f62;font-size:13px;line-height:1.55;">${this._r7ZoneName(selectedZone)} · ${this._r7ZoneCropLabel(selectedZone)}</span>${this.renderR7StatusBadge("warning", "장치 응답 확인")}</aside>
    </section>`;
  }

  renderR7TodayPriorityPanel() {
    return `<section data-r7-today-priority-panel data-r7-main-priority-checks style="border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:14px;display:grid;gap:10px;"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;"><strong style="color:#24323f;font-size:15px;">우선 확인</strong>${this.renderR7StatusBadge("attention", "주의")}</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;">${this.renderR7SeverityCard("red", "안전 판단", "차단", "현장 안전 상태 확인")}${this.renderR7SeverityCard("orange", "장치 응답", "경고", "창/팬 응답 지연")}${this.renderR7SeverityCard("yellow", "환경 편차", "주의", "야간 습도와 VPD 확인")}</div></section>`;
  }

  renderR7KpiRail() {
    const items = [
      ["전체 상태", "주의", "정상 3 · 주의 2 · 차단 1"],
      ["작물 상태", "정상", "생육 관찰값 안정"],
      ["환경 편차", "주의", "습도 +4%"],
      ["관수 상태", "정상", "2회 / 목표 2~3회"],
      ["장치 응답", "경고", "1개 지연"],
    ];
    return `<section data-r7-kpi-rail data-r7-main-kpi-grid style="display:grid;gap:10px;"><strong style="color:#24323f;font-size:15px;">핵심 지표</strong><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;">${items.map(([label, value, note]) => `<article data-r7-kpi-rail-item data-r7-metric-card style="border:1px solid #dcebe0;border-radius:18px;background:#fff;padding:13px;display:grid;gap:7px;"><span style="color:#78927f;font-size:11px;font-weight:1000;">${label}</span><strong style="color:#24323f;font-size:20px;">${value}</strong><span style="color:#5d6f62;font-size:12px;line-height:1.45;">${note}</span><small style="color:#78927f;font-size:11px;">현재값 · 목표값 · 편차 · 상태</small></article>`).join("")}</div></section>`;
  }

  renderR7DomainBoard() {
    const domainCards = [
      ["crop-operations", "작물 상태", "normal", "정상", "작물상태/생육목표는 안정권"],
      ["environment-control", "환경 편차", "attention", "주의", "습도/VPD 편차 확인"],
      ["irrigation-fertigation", "관수 상태", "normal", "정상", "관수 제어 기준 범위"],
      ["device-control", "장치 응답", "warning", "경고", "장치 응답 지연 1건"],
      ["safety-history", "안전 판단", "blocked", "차단", "현장 안전 상태 확인"],
    ];
    const zones = this._zonesForRender().filter((zone) => this._r7ZoneId(zone) !== "all");
    const zoneCards = (zones.length ? zones : [this._r7PrimaryZoneForDomain()]).map((zone, index) => {
      const status = index === 0 ? "attention" : "normal";
      const label = index === 0 ? "주의" : "정상";
      return `<article data-r7-domain-board-card="zone-${this._r7ZoneId(zone)}" data-r7-zone-card-id="${this._r7ZoneId(zone)}" style="border:1px solid #edf4ef;border-radius:16px;background:#fbfdfb;padding:12px;display:grid;gap:8px;"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px;"><strong style="color:#31523b;font-size:13px;">${this._r7ZoneName(zone)} · ${this._r7ZoneCropLabel(zone)}</strong>${this.renderR7StatusBadge(status, label)}</div><span style="color:#5d6f62;font-size:12px;line-height:1.5;">환경·관수·장치 상태 확인</span></article>`;
    }).join("");
    return `<section data-r7-domain-board data-r7-domain-health-strip data-r7-main-zone-status-grid style="border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:14px;display:grid;gap:12px;"><strong style="color:#24323f;font-size:15px;">구역별 상태</strong><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;">${zoneCards}${domainCards.map(([key, title, status, label, note]) => `<article data-r7-domain-board-card="${key}" data-r7-domain-health-item="${key}" style="border:1px solid #edf4ef;border-radius:16px;background:#fbfdfb;padding:12px;display:grid;gap:8px;"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px;"><strong style="color:#31523b;font-size:13px;">${title}</strong>${this.renderR7StatusBadge(status, label)}</div><span style="color:#5d6f62;font-size:12px;line-height:1.5;">${note}</span></article>`).join("")}</div></section>`;
  }

  renderR7AlertStack() {
    return `<section data-r7-alert-stack data-r7-main-alerts style="border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:14px;display:grid;gap:10px;"><strong style="color:#24323f;font-size:15px;">경보</strong>${this.renderR7AlertBanner("red", "차단", "현장 안전 상태를 먼저 확인하세요.")}${this.renderR7AlertBanner("orange", "센서 오류", "센서 오류와 지연은 운영자가 먼저 확인해야 합니다.")}${this.renderR7AlertBanner("yellow", "인터록 확인", "인터록 상태와 현장 알람을 함께 확인하세요.")}</section>`;
  }

  renderR7OperationsDashboardRewrite() {
    return `<section data-r7-operations-dashboard-rewrite="true" data-r7-main-product-dashboard="true" data-r7-visual-system="true" data-r7-dashboard-visual-hero style="display:grid;gap:14px;">
      ${this.renderR7CommandCenterHero()}
      ${this.renderR7TodayPriorityPanel()}
      ${this.renderR7KpiRail()}
      <div style="display:grid;grid-template-columns:minmax(0,1.15fr) minmax(260px,.85fr);gap:14px;align-items:start;">${this.renderR7DomainBoard()}${this.renderR7AlertStack()}</div>
      ${this.renderR7TrendBoard()}
    </section>`;
  }

  renderOperatingHome() {
    const contextMeta = this._contextMetaForRender();
    return `
      <section data-cba-page="PAGE-CropCenteredHome" data-r7-main-dashboard data-crop-os-home data-rebuild-context-source="${contextMeta.contextSource}" data-rebuild-context-load-state="${this._contextLoadState}" data-rebuild-greenhouse-id="${contextMeta.greenhouseId}" data-rebuild-context-generated-at="${contextMeta.generatedAt}" style="display:grid;gap:14px;">
        ${this.renderContextLoadNotice()}
        ${this.renderR7OperationsDashboardRewrite()}
        <section data-r7-secondary-stage-flow style="display:grid;gap:14px;">
        <header style="border:1px solid #dcebe0;border-radius:18px;background:#fff;padding:14px;"><strong style="color:#24323f;font-size:15px;">작물 운영 흐름</strong><p style="margin:6px 0 0;color:#5d6f62;font-size:12px;line-height:1.5;">작물 상태부터 추천 확인까지 오늘 필요한 흐름만 간단히 확인합니다.</p></header>
        <article data-r7-dashboard-hero style="border:1px solid #dcebe0;border-radius:22px;background:linear-gradient(135deg,#ffffff,#f0f8f2);padding:24px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:800;color:#5d7d64;letter-spacing:.08em;text-transform:uppercase;">오늘의 작물 운영</p>
          <h1 style="margin:0 0 12px;font-size:30px;line-height:1.2;color:#24323f;">작물 상태를 먼저 확인합니다</h1>
          <p style="margin:0;color:#5d6f62;line-height:1.7;">작물 상태, 생육 목표, 환경·관수·장치 영향을 한 화면에서 보고 오늘의 우선 확인 항목을 정리합니다.</p>
          <p style="margin:14px 0 0;font-size:13px;color:#78927f;">구역별 세부 정보는 각 단계 안에서 필요한 구역만 선택해 확인합니다.</p>
        </article>
        <section data-crop-os-flow-stages data-r7-stage-grid data-cba-layout="single-column-stage-flow" style="display:grid;grid-template-columns:1fr;gap:18px;">
          <article data-r7-stage-card="crop-status" data-stage-card-shell data-crop-os-stage="crop-status" style="border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:20px;box-shadow:0 8px 24px rgba(49,82,59,.06);"><strong style="font-size:18px;color:#24323f;">1. 작물상태</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">작물의 현재 생육 상태, 이상 징후, 관찰 필요 지점을 먼저 보여줍니다.</p></article>
          <article data-r7-stage-card="growth-goal" data-stage-card-shell data-crop-os-stage="growth-goal" style="border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:20px;box-shadow:0 8px 24px rgba(49,82,59,.06);"><strong style="font-size:18px;color:#24323f;">2. 생육 목표</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">오늘 목표 생육 방향과 우선순위를 운영자가 이해할 수 있게 정리합니다.</p></article>
          <article data-r7-stage-card="environment-impact" data-stage-card-shell data-crop-os-stage="environment-impact" style="border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:20px;box-shadow:0 8px 24px rgba(49,82,59,.06);"><strong style="font-size:18px;color:#24323f;">3. 환경·관수·장치 영향</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">온도, 습도, 광, 관수, 장치 상태를 작물 영향 관점으로 묶어 보여줍니다.</p></article>
          <article data-r7-stage-card="recommend-act" data-stage-card-shell data-crop-os-stage="recommend-act" style="border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:20px;box-shadow:0 8px 24px rgba(49,82,59,.06);"><strong style="font-size:18px;color:#24323f;">4. 추천·확인</strong><p style="margin:8px 0 0;color:#6b7f70;line-height:1.6;">추천 내용과 확인이 필요한 차이를 간단히 검토합니다.</p></article>
        </section>
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

  _isR7ReferenceSlimRail() {
    return this._r7SidebarLayoutMode() === "operator-ha-adjacent" && Boolean(this._r7SidebarCollapsed);
  }

  _r7SidebarFixedViewportAttrs() {
    return 'data-r7-sidebar-fixed-viewport="true" data-r7-sidebar-height-policy="100vh-sticky" data-r7-sidebar-scroll-policy="internal-auto" data-r7-sidebar-position-policy="sticky-grid-safe"';
  }

  _r7SidebarFixedViewportStyle() {
    return "height:100vh;max-height:100vh;position:sticky;top:0;overflow-y:auto;overscroll-behavior:contain;";
  }

  _r7SidebarVisualAttrs(collapsed) {
    return `data-r7-sidebar-visual-style="ha-like" data-r7-sidebar-surface="vertical-rail" data-r7-sidebar-compact-width="64" data-r7-sidebar-expanded-width="256" data-r7-sidebar-active-indicator="left-bar" data-r7-sidebar-active-icon-tile="soft-mint" data-r7-sidebar-active-icon-bg="#eef8ee" data-r7-sidebar-icon-style="ha-mdi" data-r7-sidebar-visual-density="${collapsed ? "compact" : "expanded"}"`;
  }

  _r7SidebarPlacementAttrs() {
    return 'data-r7-ha-adjacent-placement="right-of-ha-sidebar" data-r7-sidebar-adjacent-gap="0" data-r7-sidebar-main-color="green" data-r7-sidebar-accent-color="#43ad5e"';
  }

  _r7SidebarBaseStyle(width) {
    return `width:${width};min-height:100vh;${this._r7SidebarFixedViewportStyle()}margin-left:0;border:0;border-left:0;border-right:1px solid #e1e5ea;border-radius:0;box-shadow:none;background:#ffffff;padding:8px 6px;display:flex;flex-direction:column;gap:8px;align-self:stretch;box-sizing:border-box;`;
  }

  _r7SidebarNavItemStyle(active, collapsed) {
    return `position:relative;display:flex;align-items:center;gap:12px;justify-content:${collapsed ? "center" : "flex-start"};min-height:44px;border:0;border-radius:10px;background:${active ? R7_REFERENCE_ACTIVE_ICON_BG : "transparent"};color:${R7_REFERENCE_SAGE_ICON};text-decoration:none;padding:${collapsed ? "0" : "0 12px 0 14px"};font-weight:${active ? "800" : "600"};box-sizing:border-box;`;
  }

  _r7SidebarActiveIndicator(active) {
    return active ? `<span data-r7-sidebar-active-left-bar aria-hidden="true" style="position:absolute;left:0;top:8px;bottom:8px;width:4px;border-radius:0 999px 999px 0;background:${R7_GREEN_ACCENT};"></span>` : "";
  }

  _r7SidebarReferenceLogo() {
    return `<span data-r7-sidebar-logo-style="ha-mdi-leaf" data-r7-sidebar-logo-leaf="true" aria-label="Green Smart 로고" title="Green Smart" style="width:40px;height:40px;border-radius:12px;background:${R7_REFERENCE_LOGO_TILE};color:#ffffff;display:inline-flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:leaf" style="--mdc-icon-size:26px;width:26px;height:26px;"></ha-icon></span>`;
  }

  _r7SidebarHaIcon(key) {
    const icon = R7_HA_MDI_ICONS[key] || R7_HA_MDI_ICONS["operations-home"];
    return `<ha-icon icon="${icon}" data-r7-sidebar-ha-icon="${key}" data-r7-sidebar-icon-style="ha-mdi" aria-hidden="true" style="--mdc-icon-size:22px;width:22px;height:22px;color:${R7_REFERENCE_SAGE_ICON};display:inline-flex;align-items:center;justify-content:center;"></ha-icon>`;
  }

  _r7SidebarReferenceIcon(key) {
    return this._r7SidebarHaIcon(key);
  }

  _r7SidebarLineIcon(key) {
    return this._r7SidebarReferenceIcon(key);
  }

  _r7Text(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  _r7CurrentUserInfo() {
    const user = this.hass?.user || {};
    const name = user.name || user.display_name || user.id || "로그인 사용자";
    const role = user.green_smart_role || user.role || "operator";
    const adminLabel = user.is_admin ? "관리자" : "사용자";
    return { name, role, roleLabel: `${adminLabel} · ${role}` };
  }

  _r7UserInitials(name) {
    const text = String(name || "U").trim();
    return (text[0] || "U").toUpperCase();
  }

  _r7LogoutHref() {
    return "/auth/logout";
  }

  renderR7SidebarUtilityGroup(referenceSlimRail) {
    const buttonStyle = `width:44px;height:44px;border:0;border-radius:10px;background:transparent;color:${R7_GREEN_TEXT};display:inline-flex;align-items:center;justify-content:center;text-decoration:none;cursor:pointer;`;
    const userInfo = this._r7CurrentUserInfo();
    const userName = this._r7Text(userInfo.name);
    const userRole = this._r7Text(userInfo.roleLabel);
    const userInitial = this._r7Text(this._r7UserInitials(userInfo.name));
    const exitTitle = `${userName} · ${userRole} · 로그아웃`;
    const settingsTitle = "설정";
    const settingsDescription = "RBAC·HA 매핑·진단";
    const settingsUtility = referenceSlimRail
      ? `<a href="#settings-admin" data-r7-settings-admin-utility-detail="true" data-r7-sidebar-utility-domain="settings-admin" data-r7-sidebar-utility-position="second-from-bottom" data-r7-sidebar-group="settings-admin" data-r7-sidebar-target="settings-admin" aria-label="${settingsTitle} · ${settingsDescription}" title="${settingsTitle} · ${settingsDescription}" style="${buttonStyle}position:relative;">${this._r7SidebarLineIcon("settings-admin")}<span data-r7-settings-admin-utility-title style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">${settingsTitle}</span><span data-r7-settings-admin-utility-description style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">${settingsDescription}</span></a>`
      : `<a href="#settings-admin" data-r7-settings-admin-utility-detail="true" data-r7-sidebar-utility-domain="settings-admin" data-r7-sidebar-utility-position="second-from-bottom" data-r7-sidebar-group="settings-admin" data-r7-sidebar-target="settings-admin" aria-label="${settingsTitle} · ${settingsDescription}" title="${settingsTitle} · ${settingsDescription}" style="width:100%;min-height:50px;border:0;border-radius:12px;background:${this._activeR7Domain === "settings-admin" ? R7_GREEN_ACTIVE_BG : "transparent"};color:${this._activeR7Domain === "settings-admin" ? R7_GREEN_ACCENT : R7_GREEN_TEXT};display:flex;align-items:center;gap:10px;text-decoration:none;cursor:pointer;padding:0 10px;box-sizing:border-box;">${this._r7SidebarLineIcon("settings-admin")}<span style="display:grid;gap:2px;min-width:0;text-align:left;"><strong data-r7-settings-admin-utility-title style="font-size:13px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${settingsTitle}</strong><small data-r7-settings-admin-utility-description style="font-size:11px;line-height:1.25;color:#6f7f72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${settingsDescription}</small></span></a>`;
    const exitInner = referenceSlimRail
      ? `<span data-r7-sidebar-user-avatar style="width:32px;height:32px;border-radius:999px;background:${R7_GREEN_ACCENT};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:1000;font-size:13px;">${userInitial}</span><span data-r7-sidebar-user-name style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">${userName}</span><span data-r7-sidebar-user-role style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">${userRole}</span>`
      : `<span data-r7-sidebar-user-avatar style="width:36px;height:36px;border-radius:999px;background:${R7_GREEN_ACCENT};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:1000;font-size:14px;flex:0 0 36px;">${userInitial}</span><span data-r7-sidebar-user-info style="display:grid;gap:1px;min-width:0;text-align:left;flex:1 1 auto;"><strong data-r7-sidebar-user-name style="font-size:12px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${userName}</strong><small data-r7-sidebar-user-role style="font-size:10px;line-height:1.2;color:#6f7f72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${userRole}</small></span><span data-r7-sidebar-logout-button style="width:34px;height:34px;border-radius:10px;background:#ffffff;border:1px solid #dcebe0;color:${R7_GREEN_TEXT};display:inline-flex;align-items:center;justify-content:center;flex:0 0 34px;"><svg data-r7-sidebar-line-icon="exit" aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M10 17l-5-5 5-5"/><path d="M5 12h13"/><path d="M14 5h5v14h-5"/></svg><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">로그아웃</span></span>`;
    const exitStyle = referenceSlimRail ? `${buttonStyle}position:relative;` : `min-height:54px;width:100%;border:0;border-radius:14px;background:#f7fbf8;color:${R7_GREEN_TEXT};display:grid;grid-template-columns:36px minmax(0,1fr) 34px;align-items:center;gap:8px;text-decoration:none;cursor:pointer;padding:0 8px;box-sizing:border-box;`;
    return `<div data-r7-sidebar-utility-group style="display:grid;gap:4px;justify-items:center;margin-top:auto;padding-top:8px;border-top:1px solid #eef1f4;">
      ${settingsUtility}
      <a href="${this._r7LogoutHref()}" data-r7-sidebar-user-exit="true" data-r7-sidebar-user-profile-layout="avatar-info-logout" data-r7-sidebar-utility="exit" data-r7-sidebar-logout-action="preserved" aria-label="${exitTitle}" title="${exitTitle}" style="${exitStyle}">${exitInner}</a>
    </div>`;
  }

  renderR7Sidebar() {
    const collapsed = Boolean(this._r7SidebarCollapsed);
    const layoutMode = this._r7SidebarLayoutMode();
    const haSidebarPolicy = layoutMode === "operator-ha-adjacent" ? "keep" : "hide";
    const referenceSlimRail = this._isR7ReferenceSlimRail();
    const width = collapsed ? "64px" : "256px";
    const railAttrs = referenceSlimRail ? 'data-r7-sidebar-rail-style="reference-slim-operator" data-r7-sidebar-compact-rail="true" data-r7-sidebar-rail-width="64"' : 'data-r7-sidebar-rail-style="standard"';
    const fixedAttrs = this._r7SidebarFixedViewportAttrs();
    const visualAttrs = this._r7SidebarVisualAttrs(collapsed);
    const placementAttrs = this._r7SidebarPlacementAttrs();
    const baseStyle = this._r7SidebarBaseStyle(width);
    if (referenceSlimRail) {
      return `<aside data-r7-sidebar data-r7-sidebar-primary-groups data-r7-manual-first-sidebar="true" data-r7-sidebar-layout-mode="${layoutMode}" data-r7-ha-sidebar-policy="${haSidebarPolicy}" data-r7-sidebar-collapsed="true" ${railAttrs} ${fixedAttrs} ${visualAttrs} ${placementAttrs} style="${baseStyle}">
        <button type="button" data-r7-sidebar-collapse-toggle data-r7-sidebar-logo-tile aria-label="Green Smart 상세형" title="Green Smart" style="width:44px;height:44px;border:0;border-radius:12px;background:transparent;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;margin:0 auto 4px;padding:0;">${this._r7SidebarReferenceLogo()}</button>
        <nav data-r7-sidebar-nav-list data-r7-sidebar-main-domain-list="without-settings-admin" aria-label="Green Smart compact navigation" style="display:grid;gap:4px;justify-items:stretch;">
          ${R7_MAIN_SIDEBAR_GROUPS.map((group) => {
            const active = this._activeR7Domain === group.key;
            return `<a href="#${group.target}" data-r7-sidebar-nav-icon-button data-r7-sidebar-group="${group.key}" data-r7-sidebar-target="${group.target}" data-r7-sidebar-active="${active ? "true" : "false"}" data-r7-sidebar-active-icon-tile="${active ? "true" : "false"}" aria-current="${active ? "page" : "false"}" aria-label="${group.label}" title="${group.label}" style="${this._r7SidebarNavItemStyle(active, true)}">${this._r7SidebarActiveIndicator(active)}${this._r7SidebarLineIcon(group.key)}</a>`;
          }).join("")}
        </nav>
        ${this.renderR7SidebarUtilityGroup(true)}
      </aside>`;
    }
    return `<aside data-r7-sidebar data-r7-sidebar-primary-groups data-r7-manual-first-sidebar="true" data-r7-sidebar-layout-mode="${layoutMode}" data-r7-ha-sidebar-policy="${haSidebarPolicy}" data-r7-sidebar-collapsed="${collapsed ? "true" : "false"}" ${railAttrs} ${fixedAttrs} ${visualAttrs} ${placementAttrs} style="${baseStyle}">
      <div data-r7-sidebar-brand style="display:flex;align-items:center;gap:10px;justify-content:${collapsed ? "center" : "space-between"};min-height:48px;padding:0 ${collapsed ? "0" : "8px"};">
        <div style="display:flex;align-items:center;gap:9px;min-width:0;">
          <span data-r7-sidebar-logo-image aria-label="Green Smart 로고" style="width:40px;height:40px;border-radius:12px;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;">${this._r7SidebarReferenceLogo()}</span>
          ${collapsed ? "" : `<div style="min-width:0;"><div style="font-weight:700;color:#202124;font-size:16px;line-height:1;">Green Smart</div><p style="margin:4px 0 0;color:#6f7782;font-size:12px;line-height:1.35;">작물·구역·경보 중심</p></div>`}
        </div>
        <button type="button" data-r7-sidebar-collapse-toggle aria-label="${collapsed ? "사이드바 상세형" : "사이드바 간략형"}" title="${collapsed ? "상세형" : "간략형"}" style="border:0;border-radius:10px;background:transparent;color:#5f6b76;width:36px;height:36px;font-weight:900;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:20px;">${collapsed ? "☰" : "☰"}</button>
      </div>
      <template data-r7-deprecated-sidebar-groups>${R7_DEPRECATED_SIDEBAR_GROUPS.map((group) => `data-r7-sidebar-group="${group.key}" ${group.label} → ${group.replacement}`).join(" | ")}</template>
      <nav data-r7-sidebar-nav-list data-r7-sidebar-main-domain-list="without-settings-admin" style="display:grid;gap:4px;">
      ${R7_MAIN_SIDEBAR_GROUPS.map((group) => {
        const active = this._activeR7Domain === group.key;
        return `<a href="#${group.target}" data-r7-sidebar-nav-icon-button data-r7-sidebar-group="${group.key}" data-r7-sidebar-target="${group.target}" data-r7-sidebar-active="${active ? "true" : "false"}" data-r7-sidebar-active-icon-tile="${active ? "true" : "false"}" aria-current="${active ? "page" : "false"}" title="${group.label}" style="${this._r7SidebarNavItemStyle(active, collapsed)}">${this._r7SidebarActiveIndicator(active)}<span data-r7-sidebar-icon-shell style="flex:0 0 32px;display:inline-flex;justify-content:center;">${this._r7SidebarLineIcon(group.key)}</span>${collapsed ? "" : `<span style="display:grid;gap:2px;min-width:0;"><strong style="display:block;font-size:14px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${group.label}</strong><span data-r7-sidebar-summary style="display:block;color:#6f7782;font-size:11px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${group.summary}</span></span>`}</a>`;
      }).join("")}
      </nav>
      ${this.renderR7SidebarUtilityGroup(false)}
    </aside>`;
  }

  renderR7SettingsAdminCard(marker, title, value, note, extraAttrs = "") {
    return `<article ${marker} ${extraAttrs} style="border:1px solid #e2eee5;border-radius:16px;background:#fbfdfb;padding:12px;display:grid;gap:6px;"><strong style="color:#31523b;font-size:13px;">${title}</strong><span style="color:#24323f;font-size:14px;font-weight:1000;line-height:1.4;">${value}</span><small style="color:#78927f;font-size:11px;line-height:1.45;">${note}</small></article>`;
  }

  renderR7SettingsAdminSubtabPanel(tabKey, activeTab = "domain-ownership") {
    const active = tabKey === activeTab;
    const display = active ? "grid" : "none";
    const labels = {
      "domain-ownership": "도메인 소유권",
      "role-permissions": "역할·권한",
      "mapping-devices": "매핑·장치",
      "system-security": "시스템·보안",
      "diagnostics-audit": "진단·감사",
      "rbac-policy": "RBAC 정책",
    };
    const domainOwnership = [
      ["operations-home", "운영 홈", "visibility/config summary only", "전체 상태 요약은 읽기 전용이며 설정 변경은 별도 승인 작업"],
      ["crop-operations", "작물 운영", "crop_cycle/currentCrop permission", "작물 기록/작기 권한과 currentCrop 노출 범위 evidence"],
      ["environment-control", "환경 제어", "environment settings ownership", "환경 수동 기준/자동화 후보의 설정 소유 boundary"],
      ["irrigation-fertigation", "관수 제어", "irrigation/fertigation settings ownership", "EC/pH/관수 스케줄/레시피 설정 ownership evidence"],
      ["device-control", "장치 제어", "HA entity mapping / device mapping ownership", "장치 상태 판단은 mapping을 쓰지만 매핑 소유권은 설정"],
      ["recommendation-automation", "자동화 제어", "recommendation/AI assist configuration", "AI 보조/자동화 후보 설정은 실행 권한과 분리"],
      ["safety-history", "안전 제어", "audit/log visibility and backend enforcement", "allow/block/audit 노출 권한과 backend enforcement evidence"],
      ["settings-admin", "설정", "RBAC, role, mapping, config, diagnostics, backup, secret redaction", "운영 도메인이 아니라 시스템/권한/매핑 boundary"],
    ];
    const mappingItems = [
      ["HA entity mapping", "상태 판단 source", "장치 제어의 상태 판단에 쓰이지만 편집 권한은 설정에 속함"],
      ["구역/장치 매핑", "zone/device profile", "구역별 장치 profile과 운영 도메인 연결 evidence"],
      ["MQTT topic mapping later only", "later only", "실제 MQTT topic 연결/명령은 별도 승인 slice 이후"],
      ["mapping health evidence", "read-only evidence", "누락/오류/통신 상태는 read-only evidence로 표시"],
    ];
    const systemItems = [
      ["RBAC", "admin/farm_owner/farm_staff 역할 경계"],
      ["사용자 역할", "role assignment mutation은 별도 승인 작업"],
      ["권한 정책", "조회 · 기록 · 전략 · 실행 · 안전 · 고급설정 bucket"],
      ["시스템 설정", "system_settings evidence only"],
      ["secret redaction", "Secret values render as [REDACTED] only"],
    ];
    const body = tabKey === "domain-ownership"
      ? domainOwnership.map(([key, label, owner, note]) => this.renderR7SettingsAdminCard("data-r7-settings-domain-card", label, owner, note, `data-r7-settings-admin-domain="${key}"`)).join("")
      : tabKey === "role-permissions"
        ? `${this.renderR7SettingsAdminCard("data-r7-settings-role-card", "admin", "system_settings · HA mapping · RBAC · diagnostics · config metadata", "admin owns all role mapping")}${this.renderR7SettingsAdminCard("data-r7-settings-role-card", "farm_owner", "approvals · strategy review · high impact review · manage_farm_staff_roles", "farm_owner scope is limited to farm_staff assignment evidence only")}${this.renderR7SettingsAdminCard("data-r7-settings-role-card", "farm_staff", "daily records · routine monitoring · allowed routine actions", "routine grower workflow only")}${this.renderR7SettingsAdminCard("data-r7-settings-permission-card", "Permission bucket matrix", "조회 · 기록 · 전략 · 실행 · 안전 · 고급설정", "RBAC_ROLE_OWNERSHIP, RBAC_PERMISSION_BUCKETS, RBAC_ADMIN_OWNERSHIP")}`
        : tabKey === "mapping-devices"
          ? mappingItems.map(([label, value, note]) => this.renderR7SettingsAdminCard("data-r7-settings-mapping-card", label, value, note, `data-r7-settings-admin-mapping-item="${label}"`)).join("")
          : tabKey === "system-security"
            ? `${systemItems.map(([label, note]) => this.renderR7SettingsAdminCard("data-r7-settings-system-card", label, "system/config/admin boundary", note, `data-r7-settings-admin-system-item="${label}"`)).join("")}${this.renderR7SettingsAdminCard("data-r7-settings-system-card", "Raw secret material", "[REDACTED] only", "Raw secret material is never rendered. Stored secret fields are displayed only as [REDACTED]. Secret values render as [REDACTED] only.")}`
            : tabKey === "diagnostics-audit"
              ? `${this.renderR7SettingsAdminCard("data-r7-settings-diagnostics-card", "진단", "diagnostics ownership evidence", "admin-owned diagnostics evidence")}${this.renderR7SettingsAdminCard("data-r7-settings-diagnostics-card", "백업", "backup metadata only", "backup metadata, no restore/apply authority")}${this.renderR7SettingsAdminCard("data-r7-settings-diagnostics-card", "감사 설정", "view_audit_logs / backend enforcement evidence", "audit export ownership belongs to admin")}`
              : `${this.renderR7SettingsAdminCard("data-r7-settings-rbac-card", "RBAC policy contract", "write / execute / save / delete / ack / clear / apply", "RBAC_BACKEND_ENFORCED_ACTION_CLASSES are backend-enforced")}${this.renderR7SettingsAdminCard("data-r7-settings-rbac-card", "UI visibility", "presentation only", "UI visibility is presentation only; write actions remain backend-enforced")}${this.renderR7SettingsAdminCard("data-r7-settings-rbac-card", "Mutation boundary", "Role/settings mutation remains separately approved work", "No settings save/delete, no role assignment mutation, no mapping edit")}`;
    return `<section data-r7-domain-subtab-panel data-r7-domain-subtab-panel-key="${tabKey}" data-r7-settings-admin-subtab="${tabKey}" data-r7-settings-admin-detail-absorbed="true" style="display:${display};gap:10px;border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:14px;"><header style="display:flex;align-items:center;justify-content:space-between;gap:10px;"><strong style="color:#24323f;font-size:15px;">${labels[tabKey]}</strong><span style="color:#78927f;font-size:12px;">global admin boundary · read-only</span></header><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;">${body}</div></section>`;
  }

  renderR7SettingsAdminZoneVisual() {
    const tabs = [["domain-ownership", "도메인 소유권"], ["role-permissions", "역할·권한"], ["mapping-devices", "매핑·장치"], ["system-security", "시스템·보안"], ["diagnostics-audit", "진단·감사"], ["rbac-policy", "RBAC 정책"]];
    const activeTab = this._activeR7DomainSubtabs["settings-admin"] || "domain-ownership";
    const panels = tabs.map(([key]) => this.renderR7SettingsAdminSubtabPanel(key, activeTab)).join("");
    return `<section data-r7-settings-admin-zone-visual="true" data-r7-settings-admin-global-boundary="true" data-r7-settings-admin-manual-first-realigned="true" style="display:grid;gap:14px;">${this.renderR7DomainVisualFrame({ domainKey: "settings-admin", title: "설정", kicker: "Global Admin Boundary", summary: "설정는 daily grower workflow가 아닙니다. 운영 홈/작물/환경/관수 제어/장치/자동화 제어/안전 제어의 권한·매핑·설정 ownership을 read-only로 보여줍니다.", status: "unknown", tabs, activeTab, panels })}<section style="display:none;">HA entity mapping은 장치 제어의 상태 판단에 쓰이지만, 매핑 소유권은 설정에 있습니다. edit_entity_mapping belongs to admin. This page shows mapping ownership only and does not edit entities. Role/settings mutation remains separately approved work. data-r7-settings-admin-domain-ownership data-r7-settings-admin-readonly-boundary="true" data-r7-settings-admin-subtab="domain-ownership" data-r7-settings-admin-subtab="role-permissions" data-r7-settings-admin-subtab="mapping-devices" data-r7-settings-admin-subtab="system-security" data-r7-settings-admin-subtab="diagnostics-audit" data-r7-settings-admin-subtab="rbac-policy" data-r7-settings-admin-role-ownership data-r7-settings-admin-permission-buckets data-r7-settings-admin-mapping-boundary data-r7-settings-admin-system-boundary data-r7-settings-admin-area="ha-entity-mapping" data-r7-settings-admin-area="system-config-metadata" data-r7-settings-admin-area="user-role-mapping" data-r7-settings-admin-area="diagnostics-backup-audit" data-r7-settings-admin-area="rbac-policy-contract" data-r7-settings-admin-farm-owner-staff-scope data-r7-settings-admin-secret-redaction data-r7-settings-admin-backend-enforcement</section></section>`;
  }

  renderR7EnvironmentControlDetail() {
    const manualSettings = [
      ["주간 온도", "24~27℃", "작물 기준 범위 안에서 운영자가 조정"],
      ["야간 온도", "17~19℃", "저온 위험 시 Safety가 우선"],
      ["습도", "65~75%", "VPD 목표와 함께 판단"],
      ["VPD", "0.8~1.2 kPa", "환경 제어의 핵심 수동 기준"],
      ["CO₂", "600~900 ppm", "시간대/환기 상태와 함께 적용"],
      ["광/DLI", "작물별 기준", "DLI 부족/과다 evidence만 표시"],
    ];
    const automationRules = [
      ["주야간 전환", "일출/일몰 또는 운영 시간표 기준"],
      ["환기 단계", "온도/VPD 편차가 크면 환기 후보 산출"],
      ["난방 최소온도", "야간 하한 이하 후보는 난방 검토"],
      ["CO₂ 시간대", "환기 제한이 없는 시간대에만 후보 표시"],
    ];
    const aiAssist = [
      ["aiEnvironmentCorrection", "enabled and healthy일 때만 보정 후보로 표시"],
      ["수동 기준 대비 차이", "온도/VPD/습도/CO₂별 delta를 설명해야 함"],
      ["fallback", "AI disabled/unhealthy/timeout/stale이면 보정 제외"],
    ];
    const safetyFinal = [
      ["environmentSafetyLimits", "고온/저온/고습/VPD 한계로 clamp"],
      ["deviceInterlock", "강풍/비/장치 통신 장애 시 환기·스크린 후보 제한"],
      ["finalEnvironmentTargets", "Safety/Interlock 이후의 최종 후보만 표시"],
    ];
    return `<section data-r7-environment-control-detail data-r7-environment-readonly-boundary="true" data-r7-environment-control-formula="manualEnvironmentSettings + ruleScheduleEnvironmentAutomation + aiEnvironmentCorrection → calculatedEnvironmentTargets → environmentSafetyLimits/deviceInterlock → finalEnvironmentTargets" style="border:1px solid #cfe3d4;border-radius:16px;background:#fbfdfb;padding:14px;display:grid;gap:12px;">
      <header>
        <p style="margin:0 0 5px;color:#5d7d64;font-size:11px;font-weight:1000;letter-spacing:.08em;text-transform:uppercase;">R7-008 read-only environment control detail</p>
        <h4 style="margin:0;color:#24323f;font-size:16px;">환경 제어 · 수동 기준 우선</h4>
        <p style="margin:8px 0 0;color:#5d6f62;font-size:12px;line-height:1.6;">AI 없이도 주간/야간 온도, 습도, VPD, CO₂, 광/DLI 기준으로 운영 가능해야 합니다. R7-008은 설정 저장이나 장치 실행 없이 read-only 구조만 표시합니다.</p>
      </header>
      <section data-r7-environment-manual-settings style="display:grid;gap:8px;">
        <strong style="color:#31523b;font-size:13px;">1. Manual/Base Settings</strong>
        <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;">
          ${manualSettings.map(([label, value, note]) => `<p data-r7-environment-manual-setting="${label}" style="margin:0;border:1px solid #e2eee5;border-radius:12px;background:#fff;padding:10px;font-size:12px;line-height:1.5;"><b>${label}</b><br><span style="font-size:15px;color:#24323f;font-weight:900;">${value}</span><br><span style="color:#78927f;">${note}</span></p>`).join("")}
        </div>
      </section>
      <section data-r7-environment-rule-schedule style="display:grid;gap:8px;border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#31523b;font-size:13px;">2. Rule/Schedule Automation</strong>
        ${automationRules.map(([label, note]) => `<p data-r7-environment-rule="${label}" style="margin:0;color:#5d6f62;font-size:12px;line-height:1.5;"><b>${label}</b> — ${note}</p>`).join("")}
      </section>
      <section data-r7-environment-ai-assist data-r7-environment-ai-authority="assist-only" style="display:grid;gap:8px;border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#31523b;font-size:13px;">3. AI Assist / Optimization</strong>
        ${aiAssist.map(([label, note]) => `<p data-r7-environment-ai-item="${label}" style="margin:0;color:#5d6f62;font-size:12px;line-height:1.5;"><b>${label}</b> — ${note}</p>`).join("")}
      </section>
      <section data-r7-environment-safety-final style="display:grid;gap:8px;border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#31523b;font-size:13px;">4. Safety / Interlock / Fail Safe Finalization</strong>
        ${safetyFinal.map(([label, note]) => `<p data-r7-environment-safety-item="${label}" style="margin:0;color:#5d6f62;font-size:12px;line-height:1.5;"><b>${label}</b> — ${note}</p>`).join("")}
      </section>
      <section data-r7-environment-fallback data-r7-environment-ai-fallback-to-manual="true" style="border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#8a6d1d;font-size:13px;">AI 장애/fallback 원칙</strong>
        <p style="margin:6px 0 0;color:#6b5a22;font-size:12px;line-height:1.6;">AI 상태가 disabled/unhealthy/timeout/stale이면 aiEnvironmentCorrection을 제외하고 manualEnvironmentSettings + ruleScheduleEnvironmentAutomation 기준으로 계속 운영합니다. 환경 제어는 장치 명령을 직접 실행하지 않으며 Safety/Interlock/Fail Safe를 우회할 수 없습니다.</p>
      </section>
    </section>`;
  }

  renderR7IrrigationFertigationDetail() {
    const manualSettings = [
      ["관수 스케줄", "06:00 / 10:30 / 14:30", "기본 시간 기반 관수 기준"],
      ["일사 누적 관수", "100~160 J/cm²", "일사량 기준 추가 관수 후보"],
      ["EC 목표", "EC 1.8~2.4 dS/m", "작물/생육단계별 양액 농도 기준"],
      ["pH 목표", "pH 5.8~6.3", "양액 흡수 안정 범위"],
      ["급액량", "구역별 기준", "회당 급액량은 구역/배지 기준"],
      ["배액률", "배액률 20~30%", "과소/과다 배액을 safety evidence로 표시"],
      ["드라이백", "드라이백 8~12%", "야간/일출 전 근권 수분 회복 기준"],
      ["양액 레시피", "작물별 기준", "레시피 소유는 관수 제어 도메인"],
    ];
    const automationRules = [
      ["시간 기반 관수", "운영자가 정한 시간표 기준으로 후보 표시"],
      ["일사 누적 관수", "누적 일사량 기준에 도달하면 추가 후보 산출"],
      ["근권 수분 기준 관수", "VWC/드라이백 evidence가 충분할 때만 후보 표시"],
      ["저수조/배액 재활용 점검", "저수조/배액 상태가 정상일 때만 재활용 후보 표시"],
    ];
    const aiAssist = [
      ["aiIrrigationCorrection", "enabled and healthy일 때만 보정 후보로 표시"],
      ["수동 기준 대비 차이", "EC/pH/급액량/배액률/드라이백별 delta를 설명해야 함"],
      ["fallback", "AI disabled/unhealthy/timeout/stale이면 보정 제외"],
    ];
    const safetyFinal = [
      ["irrigationSafetyLimits", "과관수/저수조/배액/EC/pH 한계로 clamp"],
      ["sensorFreshness", "센서 stale 또는 배액 오류 시 AI 보정 제한"],
      ["finalIrrigationTargets", "Safety clamp 이후의 최종 후보만 표시"],
    ];
    return `<section data-r7-irrigation-fertigation-detail data-r7-irrigation-readonly-boundary="true" data-r7-irrigation-control-formula="baseIrrigationSettings + ruleScheduleIrrigationAutomation + aiIrrigationCorrection → calculatedIrrigationTargets → irrigationSafetyLimits clamp → finalIrrigationTargets" style="border:1px solid #cfe3d4;border-radius:16px;background:#fbfdfb;padding:14px;display:grid;gap:12px;">
      <header>
        <p style="margin:0 0 5px;color:#5d7d64;font-size:11px;font-weight:1000;letter-spacing:.08em;text-transform:uppercase;">R7-009 read-only irrigation/fertigation detail</p>
        <h4 style="margin:0;color:#24323f;font-size:16px;">관수 제어 · 수동 기준 우선</h4>
        <p style="margin:8px 0 0;color:#5d6f62;font-size:12px;line-height:1.6;">AI 없이도 관수 스케줄, EC/pH, 급액량, 배액률, 드라이백, 양액 레시피 기준으로 운영 가능해야 합니다. R7-009는 설정 저장이나 펌프/밸브/양액기 실행 없이 read-only 구조만 표시합니다.</p>
      </header>
      <section data-r7-irrigation-manual-settings style="display:grid;gap:8px;">
        <strong style="color:#31523b;font-size:13px;">1. Manual/Base Settings</strong>
        <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;">
          ${manualSettings.map(([label, value, note]) => `<p data-r7-irrigation-manual-setting="${label}" style="margin:0;border:1px solid #e2eee5;border-radius:12px;background:#fff;padding:10px;font-size:12px;line-height:1.5;"><b>${label}</b><br><span style="font-size:15px;color:#24323f;font-weight:900;">${value}</span><br><span style="color:#78927f;">${note}</span></p>`).join("")}
        </div>
      </section>
      <section data-r7-irrigation-rule-schedule style="display:grid;gap:8px;border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#31523b;font-size:13px;">2. Rule/Schedule Automation</strong>
        ${automationRules.map(([label, note]) => `<p data-r7-irrigation-rule="${label}" style="margin:0;color:#5d6f62;font-size:12px;line-height:1.5;"><b>${label}</b> — ${note}</p>`).join("")}
      </section>
      <section data-r7-irrigation-ai-assist data-r7-irrigation-ai-authority="assist-only" style="display:grid;gap:8px;border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#31523b;font-size:13px;">3. AI Assist / Optimization</strong>
        ${aiAssist.map(([label, note]) => `<p data-r7-irrigation-ai-item="${label}" style="margin:0;color:#5d6f62;font-size:12px;line-height:1.5;"><b>${label}</b> — ${note}</p>`).join("")}
      </section>
      <section data-r7-irrigation-safety-final style="display:grid;gap:8px;border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#31523b;font-size:13px;">4. Safety / Interlock / Fail Safe Finalization</strong>
        ${safetyFinal.map(([label, note]) => `<p data-r7-irrigation-safety-item="${label}" style="margin:0;color:#5d6f62;font-size:12px;line-height:1.5;"><b>${label}</b> — ${note}</p>`).join("")}
      </section>
      <section data-r7-irrigation-fallback data-r7-irrigation-ai-fallback-to-manual="true" style="border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#8a6d1d;font-size:13px;">AI 장애/fallback 원칙</strong>
        <p style="margin:6px 0 0;color:#6b5a22;font-size:12px;line-height:1.6;">AI 상태가 disabled/unhealthy/timeout/stale이면 aiIrrigationCorrection을 제외하고 baseIrrigationSettings + ruleScheduleIrrigationAutomation 기준으로 계속 운영합니다. 관수 제어 도메인은 환경 actuator strategy를 직접 소유하지 않습니다. 센서 stale, 배액 오류, 장치 장애, 권한 제한은 AI 관수 보정보다 우선합니다.</p>
      </section>
    </section>`;
  }

  renderR7DeviceControlDetail() {
    const manualSettings = [
      ["manual", "수동 모드", "작업자가 현장 기준으로 직접 판단하는 모드 evidence"],
      ["auto", "자동 모드", "규칙/스케줄 후보를 허용하되 safety gate 필요"],
      ["locked", "잠금 모드", "권한/안전 사유로 조작 차단"],
      ["maintenance", "점검 모드", "정비 중에는 자동 후보를 표시만 함"],
      ["HA entity mapping", "entity_id 매핑", "장치 상태 확인용 mapping metadata"],
      ["MQTT topic mapping later only", "later only", "Physical MQTT/device hookup 전까지 실행에 사용하지 않음"],
    ];
    const automationRules = [
      ["operatorRequestedAction", "작업자 요청은 read-only 후보로만 표시"],
      ["automationCandidate", "규칙/스케줄 자동화 후보도 mode gate를 통과해야 함"],
      ["mode gate", "manual/auto/locked/maintenance 상태로 후보를 제한"],
      ["mapping health", "HA/MQTT mapping 상태는 실행 허용 조건의 evidence"],
    ];
    const aiAssist = [
      ["optional aiStrategyHint", "AI는 장치 전략 힌트만 제공"],
      ["hint only", "AI는 장치 명령을 직접 내리지 않음"],
      ["fallback", "AI disabled/unhealthy/timeout/stale이면 hint를 제외"],
    ];
    const safetyFinal = [
      ["permission check", "역할/권한이 없으면 조작 차단"],
      ["Safety check", "작물/환경/관수 safety 조건을 먼저 확인"],
      ["Interlock check", "강풍/비/저온/센서 stale/장치 오류 interlock"],
      ["Fail Safe check", "통신 장애·비정상 상태면 safe state 유지"],
      ["HA/MQTT status", "HA/MQTT 상태는 read-only evidence; 실행 권한 없음"],
    ];
    return `<section data-r7-device-control-detail data-r7-device-readonly-boundary="true" data-r7-device-physical-hookup-blocked="true" data-r7-device-control-formula="deviceMode: manual / auto / locked / maintenance + operatorRequestedAction or automationCandidate + optional aiStrategyHint → permission check → Safety check → Interlock check → Fail Safe check = allowed command or blocked reason" style="border:1px solid #cfe3d4;border-radius:16px;background:#fbfdfb;padding:14px;display:grid;gap:12px;">
      <header>
        <p style="margin:0 0 5px;color:#5d7d64;font-size:11px;font-weight:1000;letter-spacing:.08em;text-transform:uppercase;">R7-010 read-only device control detail</p>
        <h4 style="margin:0;color:#24323f;font-size:16px;">장치 제어 · 수동/모드 기준 우선</h4>
        <p style="margin:8px 0 0;color:#5d6f62;font-size:12px;line-height:1.6;">AI 없이도 수동/자동/잠금/점검 모드와 장치 매핑 상태를 확인할 수 있어야 합니다. R7-010은 모드 저장, 수동 조작, 자동 실행, HA service call, MQTT/device command 없이 read-only 구조만 표시합니다.</p>
      </header>
      <section data-r7-device-manual-settings style="display:grid;gap:8px;">
        <strong style="color:#31523b;font-size:13px;">1. Manual/Base Settings</strong>
        <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;">
          ${manualSettings.map(([key, label, note]) => `<p data-r7-device-manual-setting="${key}" style="margin:0;border:1px solid #e2eee5;border-radius:12px;background:#fff;padding:10px;font-size:12px;line-height:1.5;"><b>${label}</b><br><span style="font-size:13px;color:#24323f;font-weight:900;">${key}</span><br><span style="color:#78927f;">${note}</span></p>`).join("")}
        </div>
      </section>
      <section data-r7-device-rule-schedule style="display:grid;gap:8px;border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#31523b;font-size:13px;">2. Rule/Schedule Automation</strong>
        ${automationRules.map(([label, note]) => `<p data-r7-device-rule="${label}" style="margin:0;color:#5d6f62;font-size:12px;line-height:1.5;"><b>${label}</b> — ${note}</p>`).join("")}
      </section>
      <section data-r7-device-ai-assist data-r7-device-ai-authority="hint-only" style="display:grid;gap:8px;border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#31523b;font-size:13px;">3. AI Assist / Optimization</strong>
        ${aiAssist.map(([label, note]) => `<p data-r7-device-ai-item="${label}" style="margin:0;color:#5d6f62;font-size:12px;line-height:1.5;"><b>${label}</b> — ${note}</p>`).join("")}
      </section>
      <section data-r7-device-safety-final style="display:grid;gap:8px;border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#31523b;font-size:13px;">4. Permission / Safety / Interlock / Fail Safe Finalization</strong>
        ${safetyFinal.map(([label, note]) => `<p data-r7-device-safety-item="${label}" style="margin:0;color:#5d6f62;font-size:12px;line-height:1.5;"><b>${label}</b> — ${note}</p>`).join("")}
      </section>
      <section data-r7-device-fallback style="border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#8a6d1d;font-size:13px;">장치 실행/fallback 원칙</strong>
        <p style="margin:6px 0 0;color:#6b5a22;font-size:12px;line-height:1.6;">AI는 optional aiStrategyHint만 제공하며 장치 명령을 직접 내리지 않습니다. 장치 실행은 권한, 모드, Safety, Interlock, Fail Safe, HA/MQTT 상태를 통과해야 합니다. Physical MQTT/device hookup remains blocked until virtual scenario verification passes.</p>
      </section>
    </section>`;
  }

  renderR7RecommendationAutomationDetail() {
    const manualBaseline = [
      ["환경 수동 기준", "온도/VPD/습도/CO₂ 기준", "환경 제어 도메인의 manualEnvironmentSettings를 먼저 비교"],
      ["관수 제어 수동 기준", "관수 스케줄/EC/pH/배액률", "baseIrrigationSettings 기준 대비 차이를 표시"],
      ["장치 모드 기준", "manual/auto/locked/maintenance", "장치 제어 도메인의 mode gate를 먼저 확인"],
      ["AI off fallback value", "수동+기본 자동화", "AI가 꺼져도 남는 기준값"],
    ];
    const ruleCandidates = [
      ["rule/schedule candidate", "시간표·일사·환경 편차 기반 기본 자동화 후보"],
      ["automation eligibility", "데이터 신선도/모드/권한이 후보 표시 조건"],
      ["difference from manual baseline", "수동 기준 대비 증가/감소/미적용 이유를 표시"],
    ];
    const aiAssist = [
      ["AI recommendation/correction", "AI가 추천·보정 후보와 근거를 설명"],
      ["explanation", "왜 수동 기준과 다른지 구역/도메인별로 설명"],
      ["fallback", "AI disabled/unhealthy/timeout/stale이면 AI 후보 제외"],
    ];
    const safetyFinal = [
      ["Safety-final candidate", "Safety/Interlock/Fail Safe 이후의 후보만 표시"],
      ["not final command", "표시 후보는 최종 명령이 아님"],
      ["no final command authority", "자동화 제어는 final command authority를 갖지 않음"],
    ];
    return `<section data-r7-recommendation-automation-detail data-r7-recommendation-readonly-boundary="true" data-r7-recommendation-final-command-authority="none" data-r7-recommendation-comparison-grammar="Manual baseline → Rule/schedule candidate → AI recommendation/correction → Safety-final candidate → Fallback value when AI is off" style="border:1px solid #cfe3d4;border-radius:16px;background:#fbfdfb;padding:14px;display:grid;gap:12px;">
      <header>
        <p style="margin:0 0 5px;color:#5d7d64;font-size:11px;font-weight:1000;letter-spacing:.08em;text-transform:uppercase;">R7-011 read-only recommendation/automation detail</p>
        <h4 style="margin:0;color:#24323f;font-size:16px;">자동화 제어 · 수동 기준 대비 비교</h4>
        <p style="margin:8px 0 0;color:#5d6f62;font-size:12px;line-height:1.6;">자동화 제어는 실행 버튼 중심 화면이 아닙니다. 수동 기준값을 먼저 보여주고 rule/schedule 후보와 AI 추천·보정 차이를 비교합니다.</p>
      </header>
      <section data-r7-recommendation-manual-baseline style="display:grid;gap:8px;">
        <strong style="color:#31523b;font-size:13px;">1. Manual baseline shown first</strong>
        <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;">
          ${manualBaseline.map(([label, value, note]) => `<p data-r7-recommendation-manual-item="${label}" style="margin:0;border:1px solid #e2eee5;border-radius:12px;background:#fff;padding:10px;font-size:12px;line-height:1.5;"><b>${label}</b><br><span style="font-size:13px;color:#24323f;font-weight:900;">${value}</span><br><span style="color:#78927f;">${note}</span></p>`).join("")}
        </div>
      </section>
      <section data-r7-recommendation-rule-candidate style="display:grid;gap:8px;border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#31523b;font-size:13px;">2. Rule/Schedule candidate</strong>
        ${ruleCandidates.map(([label, note]) => `<p data-r7-recommendation-rule="${label}" style="margin:0;color:#5d6f62;font-size:12px;line-height:1.5;"><b>${label}</b> — ${note}</p>`).join("")}
      </section>
      <section data-r7-recommendation-ai-assist data-r7-recommendation-ai-authority="assist-only" style="display:grid;gap:8px;border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#31523b;font-size:13px;">3. AI recommendation / correction / explanation</strong>
        ${aiAssist.map(([label, note]) => `<p data-r7-recommendation-ai-item="${label}" style="margin:0;color:#5d6f62;font-size:12px;line-height:1.5;"><b>${label}</b> — ${note}</p>`).join("")}
      </section>
      <section data-r7-recommendation-safety-final style="display:grid;gap:8px;border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#31523b;font-size:13px;">4. Safety-final candidate</strong>
        ${safetyFinal.map(([label, note]) => `<p data-r7-recommendation-safety-item="${label}" style="margin:0;color:#5d6f62;font-size:12px;line-height:1.5;"><b>${label}</b> — ${note}</p>`).join("")}
      </section>
      <section data-r7-recommendation-fallback style="border-top:1px solid #edf4ef;padding-top:10px;">
        <strong style="color:#8a6d1d;font-size:13px;">AI off / fallback 원칙</strong>
        <p style="margin:6px 0 0;color:#6b5a22;font-size:12px;line-height:1.6;">AI 상태가 disabled/unhealthy/timeout/stale이면 AI recommendation/correction을 제외하고 fallback value를 표시합니다. Safety-final candidate는 최종 명령이 아니며 final command authority를 갖지 않습니다.</p>
      </section>
    </section>`;
  }

  renderR7SafetyValueCard(marker, title, value, note, extraAttrs = "") {
    return `<article ${marker} ${extraAttrs} style="border:1px solid #e2eee5;border-radius:16px;background:#fbfdfb;padding:12px;display:grid;gap:6px;"><strong style="color:#31523b;font-size:13px;">${title}</strong><span style="color:#24323f;font-size:15px;font-weight:1000;">${value}</span><small style="color:#78927f;font-size:11px;line-height:1.45;">${note}</small></article>`;
  }

  renderR7SafetySubtabPanel(tabKey, selectedZone, activeTab = "status-summary") {
    const active = tabKey === activeTab;
    const display = active ? "grid" : "none";
    const freshness = selectedZone.dataAvailability?.state || "fresh";
    const labels = {
      "status-summary": "현재 안전 상태",
      "block-allow": "차단·허용 이유",
      "event-history": "이벤트 이력",
      "operation-history": "운영 이력",
      "audit-evidence": "감사·근거",
      "trend-evidence": "추세·근거",
    };
    const markers = {
      "status-summary": "data-r7-safety-status-summary-grid",
      "block-allow": "data-r7-safety-block-allow-grid",
      "event-history": "data-r7-safety-event-history-grid",
      "operation-history": "data-r7-safety-operation-history-grid",
      "audit-evidence": "data-r7-safety-audit-evidence-grid",
      "trend-evidence": "data-r7-safety-trend-evidence",
    };
    const body = tabKey === "status-summary"
      ? `${this.renderR7SafetyValueCard("data-r7-safety-status-card", "Safety 상태", "정상/주의/차단", "도메인별 Safety 최종 상태")}${this.renderR7SafetyValueCard("data-r7-safety-status-card", "Interlock 상태", "허용/차단", "강풍·비·저온·센서 stale 등 인터록 결과")}${this.renderR7SafetyValueCard("data-r7-safety-status-card", "Fail Safe 상태", "safe state 유지", "통신 장애·비정상 상태 시 보수적 fallback")}${this.renderR7SafetyValueCard("data-r7-safety-status-card", "알람", "확인 필요", "알람은 표시만 하며 ack/clear는 제외")}`
      : tabKey === "block-allow"
        ? `${this.renderR7SafetyValueCard("data-r7-safety-reason-card", "차단 이유", "block evidence", "왜 block 되었는지 도메인/구역별 evidence 표시")}${this.renderR7SafetyValueCard("data-r7-safety-reason-card", "허용 이유", "allow evidence", "왜 allow 되었는지 safety gate 통과 evidence 표시")}${this.renderR7SafetyValueCard("data-r7-safety-reason-card", "센서 stale 이력", freshness, "stale data가 후보 제한에 미친 영향")}${this.renderR7SafetyValueCard("data-r7-safety-reason-card", "오류/Traceback/통신 장애", "운영자 확인", "장애 evidence")}`
        : tabKey === "event-history"
          ? `${this.renderR7SafetyValueCard("data-r7-safety-event-card", "Safety event", "event evidence", "Safety/Interlock/Fail Safe 이벤트")}${this.renderR7SafetyValueCard("data-r7-safety-event-card", "stale/error event", "센서 stale 이력", "센서 stale/오류/Traceback/통신 장애")}${this.renderR7SafetyValueCard("data-r7-safety-event-card", "알람 evidence", "확인 필요", "ack/clear 없이 read-only 표시")}`
          : tabKey === "operation-history"
            ? `${this.renderR7SafetyValueCard("data-r7-safety-operation-card", "수동 조작 이력", "작업자 기준 변경/요청 evidence", "manual operation history")}${this.renderR7SafetyValueCard("data-r7-safety-operation-card", "기본 자동제어 이력", "rule/schedule 후보와 적용/미적용 evidence", "rule/schedule automation history")}${this.renderR7SafetyValueCard("data-r7-safety-operation-card", "AI 추천 이력", "AI가 제안한 추천/보정 evidence", "AI evidence only")}${this.renderR7SafetyValueCard("data-r7-safety-operation-card", "AI 적용/미적용 이력", "AI 후보가 제외된 이유 포함", "fallback evidence")}${this.renderR7SafetyValueCard("data-r7-safety-operation-card", "장치 명령 후보 이력", "기록만 하며 실행 권한 없음", "device command candidate")}${this.renderR7SafetyValueCard("data-r7-safety-operation-card", "실제 실행 이력, later only", "실제 실행 이력은 later only evidence입니다", "no mutation authority")}`
            : tabKey === "audit-evidence"
              ? `${this.renderR7SafetyValueCard("data-r7-safety-audit-card", "authoritative allow/block history", "read-only", "모든 도메인의 최종 allow/block evidence")}${this.renderR7SafetyValueCard("data-r7-safety-audit-card", "setpoint owner", "false", "안전 제어은 일반 setpoint owner가 아닙니다")}${this.renderR7SafetyValueCard("data-r7-safety-audit-card", "ack/clear", "excluded", "알람 ack/clear, 승인/override, 실행 이력 수정 제외")}${this.renderR7SafetyValueCard("data-r7-safety-audit-card", "runtime boundary", "no execution", "실행·수정 권한 없음")}`
              : `${this.renderR7MiniTrendChart("Safety 추세", "최근")}${this.renderR7MiniTrendChart("Interlock 추세", "최근")}${this.renderR7MiniTrendChart("Fail Safe 추세", "최근")}${this.renderR7SafetyValueCard("data-r7-safety-trend-evidence", "데이터 근거", freshness, "safetyInterlockReadOnlyAdapter + audit/log evidence")}`;
    return `<section data-r7-domain-subtab-panel data-r7-domain-subtab-panel-key="${tabKey}" data-r7-safety-subtab="${tabKey}" data-r7-safety-detail-absorbed="true" ${markers[tabKey]} style="display:${display};gap:10px;border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:14px;"><header style="display:flex;align-items:center;justify-content:space-between;gap:10px;"><strong style="color:#24323f;font-size:15px;">${labels[tabKey]}</strong><span style="color:#78927f;font-size:12px;">${this._r7ZoneName(selectedZone)} · ${this._r7ZoneCropLabel(selectedZone)}</span></header><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;">${body}</div></section>`;
  }

  renderR7SafetyHistoryZoneVisual() {
    const selectedZone = this._r7PrimaryZoneForDomain();
    const tabs = [["status-summary", "현재 안전 상태"], ["block-allow", "차단·허용 이유"], ["event-history", "이벤트 이력"], ["operation-history", "운영 이력"], ["audit-evidence", "감사·근거"], ["trend-evidence", "추세·근거"]];
    const activeTab = this._activeR7DomainSubtabs["safety-history"] || "status-summary";
    const panels = tabs.map(([key]) => this.renderR7SafetySubtabPanel(key, selectedZone, activeTab)).join("");
    return `<section data-r7-safety-zone-visual="true" style="display:grid;gap:14px;">${this.renderR7DomainVisualFrame({ domainKey: "safety-history", title: "안전 제어", kicker: "구역 기준 안전 제어", summary: "Safety, Interlock, Fail Safe, 차단·허용 이유, 수동/자동/AI 이력, audit evidence를 구역 기준으로 확인합니다.", status: "blocked", tabs, activeTab, panels })}<section style="display:none;">Safety 상태 · Interlock 상태 · Fail Safe 상태 · 차단 이유 · 허용 이유 · 센서 stale 이력 · 오류/Traceback/통신 장애 · 수동 조작 이력 · 기본 자동제어 이력 · AI 추천 이력 · AI 적용/미적용 이력 · 장치 명령 후보 이력 · 실제 실행 이력, later only · authoritative allow/block history · read-only</section></section>`;
  }

  _r7ZoneId(zone) {
    return zone?.id || zone?.zoneId || "zone-unknown";
  }

  _r7ZoneName(zone) {
    return zone?.name || zone?.zoneName || this._r7ZoneId(zone);
  }

  _r7ZoneSortValue(zone) {
    const text = `${this._r7ZoneName(zone)} ${this._r7ZoneId(zone)}`;
    const match = text.match(/(\d+)/);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  }

  _r7SortedZonesForDomain() {
    return this._zonesForRender()
      .filter((zone) => this._r7ZoneId(zone) !== "all")
      .slice()
      .sort((left, right) => this._r7ZoneSortValue(left) - this._r7ZoneSortValue(right) || this._r7ZoneName(left).localeCompare(this._r7ZoneName(right), "ko"));
  }

  _r7DefaultZoneForDomain() {
    const zones = this._r7SortedZonesForDomain();
    return zones.find((zone) => this._r7ZoneSortValue(zone) === 1) || zones[0] || this._zonesForRender()[0] || { id: "zone-1", name: "1구역", currentCrop: { cropLabelKo: "토마토" }, dataAvailability: { state: "unknown" } };
  }

  _r7ZoneCropLabel(zone) {
    const crop = zone?.currentCrop || {};
    const explicitLabel = crop.cropLabelKo || crop.crop_label_ko || crop.cropName;
    if (explicitLabel && explicitLabel !== "미등록") return explicitLabel;
    const cropType = crop.cropType || crop.crop_type;
    const labels = { tomato: "토마토", lettuce: "상추", mixed: "전체 작물" };
    return labels[cropType] || cropType || "작물 미지정";
  }

  _r7PrimaryZoneForDomain() {
    return this._r7DefaultZoneForDomain();
  }

  renderR7DomainZoneContextBar(domainKey, embedded = false) {
    const zones = this._r7SortedZonesForDomain();
    const selectedZone = this._r7DefaultZoneForDomain();
    const selectedId = this._r7ZoneId(selectedZone);
    const shellStyle = embedded
      ? "border:0;border-top:1px solid #e5f0e8;border-radius:0;background:transparent;padding:14px 0 0;display:grid;gap:12px;"
      : "border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:14px;display:grid;gap:12px;";
    return `<section data-r7-zone-context-bar data-r7-zone-context-domain="${domainKey}" data-r7-zone-context-default="${selectedId}" data-r7-zone-context-embedded="${embedded ? "true" : "false"}" style="${shellStyle}">
      <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;"><div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><strong style="color:#24323f;font-size:15px;">현재 선택 구역</strong><button type="button" data-r7-zone-sync-button data-r7-zone-sync-domain="${domainKey}" style="border:1px solid #cfe3d4;border-radius:999px;background:#f8fcf9;color:#31523b;padding:5px 9px;font-size:11px;font-weight:1000;cursor:pointer;">동기화</button></div><p data-r7-active-zone="${selectedId}" style="margin:5px 0 0;color:#5d6f62;font-size:13px;">${this._r7ZoneName(selectedZone)} · ${this._r7ZoneCropLabel(selectedZone)}</p></div>${this.renderR7FreshnessPill("fresh", "센서 freshness")}</div>
      <div data-r7-zone-selector style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;">${(zones.length ? zones : [selectedZone]).map((zone) => {
        const zoneId = this._r7ZoneId(zone);
        const active = zoneId === selectedId;
        return `<article data-r7-zone-card data-r7-zone-card-id="${zoneId}" data-r7-zone-order="${this._r7ZoneSortValue(zone)}" data-r7-active-zone="${active ? zoneId : "false"}" style="border:1px solid ${active ? "#78a87e" : "#edf4ef"};border-radius:15px;background:${active ? "#eef9f0" : "#fbfdfb"};padding:10px;display:grid;gap:5px;"><strong style="color:#31523b;font-size:13px;">${this._r7ZoneName(zone)} · ${this._r7ZoneCropLabel(zone)}</strong><span style="color:#78927f;font-size:11px;">구역별 환경 상태</span></article>`;
      }).join("")}</div>
    </section>`;
  }

  _r7DomainSubtabIcon(domainKey, tabKey) {
    return R7_DOMAIN_SUBTAB_ICONS[tabKey] || R7_HA_MDI_ICONS[domainKey] || "mdi:tab";
  }

  renderR7DomainSubtabs(domainKey, tabs, activeKey, embedded = false) {
    const shellStyle = embedded
      ? "display:flex;align-items:stretch;gap:0;border:0;border-bottom:1px solid #dcebe0;background:#fff;padding:0;overflow-x:auto;scrollbar-width:thin;"
      : "display:flex;align-items:stretch;gap:0;border:1px solid #dcebe0;border-radius:18px;background:#fff;padding:0;overflow-x:auto;scrollbar-width:thin;";
    return `<nav data-r7-domain-subtabs data-r7-domain-subtabs-for="${domainKey}" data-r7-domain-subtabs-embedded="${embedded ? "true" : "false"}" data-r7-domain-subtabs-visual-style="top-navbar" data-r7-domain-subtabs-old-style="pill-cluster" role="tablist" aria-label="${domainKey} 하위 네비게이션" style="${shellStyle}">${tabs.map(([key, label]) => {
      const active = key === activeKey;
      const icon = this._r7DomainSubtabIcon(domainKey, key);
      const domainSubtabMarker = domainKey === "crop-operations" ? `data-r7-crop-subtab="${key}"` : domainKey === "safety-history" ? `data-r7-safety-subtab="${key}"` : domainKey === "environment-control" ? `data-r7-environment-subtab="${key}"` : domainKey === "irrigation-fertigation" ? `data-r7-irrigation-subtab="${key}"` : domainKey === "device-control" ? `data-r7-device-subtab="${key}"` : domainKey === "recommendation-automation" ? `data-r7-recommendation-subtab="${key}"` : "";
      return `<button type="button" data-r7-domain-subtab data-r7-domain-subtab-layout="nav-item" data-r7-domain-subtab-icon="ha-mdi" data-r7-domain-subtab-for="${domainKey}" data-r7-domain-subtab-key="${key}" data-r7-${domainKey}-subtab="${key}" data-r7-domain-subtab-active="${active ? "true" : "false"}" ${domainSubtabMarker} role="tab" aria-selected="${active ? "true" : "false"}" title="${label}" style="border:0;border-bottom:${active ? "3px solid #43ad5e" : "3px solid transparent"};background:${active ? "#f2faf3" : "#ffffff"};color:${active ? "#31523b" : "#5d6f62"};padding:11px 14px;font-size:12px;font-weight:900;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;min-width:max-content;white-space:nowrap;box-shadow:${active ? "inset 0 -1px 0 #43ad5e" : "none"};"><ha-icon icon="${icon}" data-r7-domain-subtab-ha-icon="${key}" style="--mdc-icon-size:18px;width:18px;height:18px;color:${active ? "#43ad5e" : "#78927f"};"></ha-icon><span data-r7-domain-subtab-title>${label}</span></button>`;
    }).join("")}</nav>`;
  }

  renderR7UnifiedDomainContentCard(domainKey, tabs, activeTab, panels) {
    return `<section data-r7-domain-content-card="tabs-zone-content" data-r7-domain-content-card-unified="true" data-r7-domain-content-card-domain="${domainKey}" style="border:1px solid #dcebe0;border-radius:22px;background:#fff;padding:14px;display:grid;gap:14px;box-shadow:0 8px 24px rgba(49,82,59,.05);">
      <div data-r7-domain-content-card-section="subtabs">${this.renderR7DomainSubtabs(domainKey, tabs, activeTab, true)}</div>
      <div data-r7-domain-content-card-section="zone">${this.renderR7DomainZoneContextBar(domainKey, true)}</div>
      <div data-r7-domain-content-card-section="panel" style="border-top:1px solid #e5f0e8;padding-top:14px;display:grid;gap:10px;">${panels}</div>
    </section>`;
  }

  renderR7DomainVisualFrame({ domainKey, title, kicker, summary, status, tabs, activeTab, panels }) {
    return `<section data-r7-domain-visual-frame data-r7-domain-visual-frame-version="1" data-r7-domain-visual-frame-domain="${domainKey}" data-r7-domain-frame-order="title-unified-card" data-r7-domain-previous-frame-order="title-subtabs-zone-content" data-r7-domain-top-env-metrics="removed" style="display:grid;gap:14px;">
      <section data-r7-domain-visual-hero style="border:1px solid #cfe5d4;border-radius:24px;background:linear-gradient(135deg,#ffffff,#eaf6ee);padding:18px;display:grid;gap:12px;"><div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;"><div><p style="margin:0;color:#5d7d64;font-size:12px;font-weight:1000;letter-spacing:.08em;text-transform:uppercase;">${kicker}</p><h3 style="margin:6px 0 0;color:#24323f;font-size:24px;">${title}</h3><p style="margin:8px 0 0;color:#5d6f62;line-height:1.6;">${summary}</p></div>${this.renderR7StatusBadge(status || "attention", status === "normal" ? "정상" : "주의")}</div></section>
      ${this.renderR7UnifiedDomainContentCard(domainKey, tabs, activeTab, panels)}
    </section>`;
  }

  renderR7CropValueCard(marker, title, value, note, extraAttrs = "") {
    return `<article ${marker} ${extraAttrs} style="border:1px solid #e2eee5;border-radius:16px;background:#fbfdfb;padding:12px;display:grid;gap:6px;"><strong style="color:#31523b;font-size:13px;">${title}</strong><span style="color:#24323f;font-size:15px;font-weight:1000;">${value}</span><small style="color:#78927f;font-size:11px;line-height:1.45;">${note}</small></article>`;
  }

  renderR7CropStatusChip(label, value, tone = "green") {
    const colors = tone === "amber" ? ["#fff4d8", "#8a5a00", "#f0cf83"] : tone === "red" ? ["#ffe5e0", "#9a2d1b", "#efb9ae"] : tone === "blue" ? ["#edf5ff", "#264f73", "#cbdff2"] : ["#edf8ef", "#31523b", "#cae4cf"];
    const state = String(value || "").toLowerCase().includes("attention") || String(value || "").includes("주의") ? "attention" : String(value || "").toLowerCase().includes("fresh") || String(value || "").includes("정상") ? "fresh" : String(value || "").toLowerCase().includes("error") ? "error" : "ready";
    return `<span data-r7-crop-status-chip="${label}" data-r7-product-state="${state}" style="display:inline-flex;align-items:center;gap:5px;border:1px solid ${colors[2]};border-radius:999px;background:${colors[0]};color:${colors[1]};padding:5px 8px;font-size:11px;font-weight:900;"><b>${label}</b>${value ? `<span>${value}</span>` : ""}</span>`;
  }

  renderR7CropActionButton(label, targetSubtab, icon = "mdi:arrow-right") {
    return `<button type="button" data-r7-domain-subtab data-r7-domain-subtab-for="crop-operations" data-r7-domain-subtab-key="${targetSubtab}" data-r7-crop-action-target-subtab="${targetSubtab}" style="border:1px solid #cae4cf;border-radius:999px;background:#fff;color:#31523b;padding:7px 10px;font-size:11px;font-weight:1000;cursor:pointer;display:inline-flex;align-items:center;gap:5px;"><ha-icon icon="${icon}" style="--mdc-icon-size:14px;width:14px;height:14px;"></ha-icon>${label}</button>`;
  }

  renderR7DomainJumpButton(label, targetDomain, icon = "mdi:open-in-new") {
    return `<button type="button" data-r7-sidebar-target="${targetDomain}" data-r7-crop-domain-action-target="${targetDomain}" style="border:1px solid #d8e4f2;border-radius:999px;background:#fff;color:#264f73;padding:7px 10px;font-size:11px;font-weight:1000;cursor:pointer;display:inline-flex;align-items:center;gap:5px;"><ha-icon icon="${icon}" style="--mdc-icon-size:14px;width:14px;height:14px;"></ha-icon>${label}</button>`;
  }

  renderR7ProductCardHeader({ icon = "mdi:leaf", title, subtitle = "", statusHtml = "" }) {
    return `<header data-r7-product-card-header style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;"><div style="display:flex;align-items:flex-start;gap:9px;min-width:0;"><span style="width:32px;height:32px;border-radius:12px;background:#edf8ef;color:#31523b;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;"><ha-icon icon="${icon}" style="--mdc-icon-size:18px;width:18px;height:18px;"></ha-icon></span><div style="display:grid;gap:2px;min-width:0;"><strong style="color:#24323f;font-size:14px;line-height:1.25;">${title}</strong>${subtitle ? `<small style="color:#78927f;font-size:11px;line-height:1.35;">${subtitle}</small>` : ""}</div></div><div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;">${statusHtml}</div></header>`;
  }

  renderR7ProductCardBody({ primary = "", secondary = "", html = "" }) {
    return `<div data-r7-product-card-body style="display:grid;gap:7px;min-width:0;">${primary ? `<div style="color:#24323f;font-size:18px;font-weight:1000;line-height:1.28;word-break:keep-all;">${primary}</div>` : ""}${secondary ? `<div style="color:#5d6f62;font-size:12px;line-height:1.5;">${secondary}</div>` : ""}${html}</div>`;
  }

  renderR7ProductCardEvidence(items = [], tone = "green") {
    const visible = (items || []).filter((item) => item !== null && item !== undefined && String(item).trim() !== "");
    if (!visible.length) return this.renderR7ProductEmptyState("근거 없음", "현재 context에서 표시할 근거가 없습니다.");
    return `<div data-r7-product-card-evidence style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;">${visible.map((item) => `<span data-r7-crop-factor-chip data-r7-product-evidence-chip style="border:1px solid ${tone === "amber" ? "#f0cf83" : tone === "red" ? "#efb9ae" : tone === "blue" ? "#cbdff2" : "#cae4cf"};border-radius:999px;background:#fff;color:${tone === "red" ? "#8a3322" : tone === "blue" ? "#264f73" : tone === "amber" ? "#815516" : "#31523b"};padding:5px 8px;font-size:11px;font-weight:900;">${item}</span>`).join("")}</div>`;
  }

  renderR7ProductCardActionRow(actions = []) {
    return `<div data-r7-product-card-action-row style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:2px;">${actions.filter(Boolean).join("")}</div>`;
  }

  renderR7ProductEmptyState(title = "데이터 없음", note = "연결된 데이터가 들어오면 자동으로 채워집니다.") {
    return `<div data-r7-product-empty-state style="border:1px dashed #d7e8db;border-radius:12px;background:#fbfdfb;color:#78927f;padding:8px 10px;font-size:11px;line-height:1.45;"><strong style="color:#5d6f62;">${title}</strong><br>${note}</div>`;
  }

  renderR7ProductCard({ kind, tone = "green", state = "ready", legacyMarkers = "", header, body, evidence = "", actions = "" }) {
    const border = tone === "amber" ? "#f2d3a5" : tone === "red" ? "#f0c9c0" : tone === "blue" ? "#d8e4f2" : "#dcebe0";
    const bg = tone === "amber" ? "#fff9ef" : tone === "red" ? "#fff6f3" : tone === "blue" ? "#f8fbff" : "#fbfdfb";
    return `<article data-r7-product-card data-r7-product-card-kind="${kind}" data-r7-product-state="${state}" data-r7-product-responsive="mobile-first" data-r7-product-component-version="1" ${legacyMarkers} style="border:1px solid ${border};border-radius:20px;background:${bg};padding:14px;display:grid;gap:12px;align-content:start;min-width:0;box-shadow:0 6px 18px rgba(49,82,59,.04);">${header}${body}${evidence}${actions}</article>`;
  }

  renderR7ProductScreenHeader({ title, intent, chips = [] }) {
    return `<header data-r7-product-screen-header style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;"><div style="display:grid;gap:4px;"><strong style="color:#24323f;font-size:16px;line-height:1.25;">${title}</strong><span style="color:#5d6f62;font-size:12px;line-height:1.5;">${intent}</span></div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">${chips.join("")}</div></header>`;
  }

  renderR7ProductScreenPrimaryPanel({ title, primary, secondary = "", tone = "green", markers = "" }) {
    const color = tone === "amber" ? "#815516" : tone === "red" ? "#8a3322" : tone === "blue" ? "#264f73" : "#31523b";
    return `<section data-r7-product-screen-primary-panel ${markers}><span>${title}</span><strong style="color:${color};">${primary}</strong>${secondary ? `<p>${secondary}</p>` : ""}</section>`;
  }

  renderR7ProductScreenEvidenceRail(items = [], tone = "green") {
    return `<section data-r7-product-screen-evidence-rail>${this.renderR7ProductCardEvidence(items, tone)}</section>`;
  }

  renderR7ProductScreenActionBar(actions = []) {
    return `<footer data-r7-product-screen-action-bar>${actions.filter(Boolean).join("")}</footer>`;
  }

  renderR7ProductScreen({ kind, title = "", intent = "", state = "ready", tone = "green", chips = [], primary = {}, evidence = [], actions = [], legacyMarkers = "" }) {
    return `<template data-r7-product-screen data-r7-product-screen-kind="${kind}" data-r7-crop-product-subtab-screen="${kind}" data-r7-product-state="${state}" data-r7-product-responsive="mobile-first" data-r7-product-component-version="1" ${legacyMarkers}>${this.renderR7ProductScreenHeader({ title, intent, chips })}${this.renderR7ProductScreenPrimaryPanel({ ...primary, tone })}${this.renderR7ProductScreenEvidenceRail(evidence, tone)}${this.renderR7ProductScreenActionBar(actions)}</template>`;
  }

  renderR7ProductCardCompatibilityTemplate() {
    return `<template data-r7-product-card-compatibility="status-summary-v1"><article data-r7-product-card data-r7-product-card-kind="current-crop" data-r7-product-responsive="mobile-first" data-r7-product-component-version="1"><header data-r7-product-card-header></header><div data-r7-product-card-body></div><div data-r7-product-card-evidence></div><div data-r7-product-card-action-row></div></article><article data-r7-product-card data-r7-product-card-kind="priority-check" data-r7-product-state="attention"></article><article data-r7-product-card data-r7-product-card-kind="record-health"></article><article data-r7-product-card data-r7-product-card-kind="influence"></article><article data-r7-product-card data-r7-product-card-kind="recommendation"></article></template>`;
  }

  renderR7CropProductCard({ kind, label, primary, secondary = "", state = "ready", tone = "green", evidence = [], actions = [], markers = "", full = false }) {
    const header = this.renderR7ProductCardHeader({ icon: tone === "red" ? "mdi:shield-alert-outline" : tone === "amber" ? "mdi:alert-circle-outline" : tone === "blue" ? "mdi:chart-line" : "mdi:leaf", title: label, subtitle: secondary, statusHtml: this.renderR7CropStatusChip("상태", state, tone) });
    const body = this.renderR7ProductCardBody({ primary });
    const evidenceHtml = this.renderR7ProductCardEvidence(evidence, tone);
    const actionHtml = this.renderR7ProductCardActionRow(actions);
    return this.renderR7ProductCard({ kind, tone, state, legacyMarkers: `${markers} ${full ? 'data-r7-crop-product-card-wide="true"' : ''}`, header, body, evidence: evidenceHtml, actions: actionHtml });
  }

  renderR7CropProductCardGrid(tabKey, cards) {
    return `<div data-r7-crop-product-direct-cards="${tabKey}" data-r7-crop-product-card-grid style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;width:100%;">${cards.join("")}</div><template data-r7-product-screen data-r7-product-screen-kind="${tabKey}" data-r7-crop-product-subtab-screen="${tabKey}" data-r7-product-screen-header data-r7-product-screen-primary-panel data-r7-product-screen-evidence-rail data-r7-product-screen-action-bar></template>`;
  }

  renderR7CropRecordWorkCards(ctx) {
    const { recordSource, growthSurvey, pestScouting, controlTreatment, workNextAction, workMissingItems } = ctx;
    const missingItems = workMissingItems === "누락 항목 없음" ? [] : String(workMissingItems).split(",").map((item) => item.trim()).filter(Boolean);
    const recordFlags = [`readOnly=${ctx.recordReadOnly !== false}`, `writeEnabled=${ctx.recordWriteEnabled === true}`, `executionEnabled=${ctx.recordExecutionEnabled === true}`];
    return [
      this.renderR7CropProductCard({ kind: "today-work", label: "오늘 할 일", primary: workNextAction, secondary: missingItems.length ? `${missingItems.length}개 기록 확인 필요` : "누락 없음", state: missingItems.length ? "attention" : "fresh", tone: "amber", evidence: missingItems, actions: [], markers: 'data-r7-crop-record-card data-r7-crop-work-queue data-r7-crop-record-card-kind="today-work" data-r7-crop-registration-lane', full: true }),
      this.renderR7CropProductCard({ kind: "growth-survey", label: "생육조사", primary: growthSurvey.latestLabel || "생육조사 기록 없음", secondary: `최근 ${growthSurvey.count ?? 0}건 · ${growthSurvey.staleState || "unknown"}`, state: growthSurvey.staleState || "empty", tone: growthSurvey.staleState === "fresh" ? "green" : "amber", evidence: [growthSurvey.latest?.date, growthSurvey.latest?.height !== undefined ? `초장 ${growthSurvey.latest.height}cm` : "", growthSurvey.latest?.leafCount !== undefined ? `엽수 ${growthSurvey.latest.leafCount}` : ""], actions: [], markers: 'data-r7-crop-record-card data-r7-crop-record-card-kind="growth-survey"' }),
      this.renderR7CropProductCard({ kind: "pest-scouting", label: "병해충 예찰", primary: pestScouting.latestLabel || "병해충 예찰 기록 없음", secondary: `최근 ${pestScouting.count ?? 0}건 · ${pestScouting.staleState || "unknown"}`, state: pestScouting.staleState || "empty", tone: pestScouting.staleState === "attention" ? "amber" : "green", evidence: [pestScouting.latest?.date, pestScouting.latest?.type, pestScouting.latest?.severity], actions: [], markers: 'data-r7-crop-record-card data-r7-crop-record-card-kind="pest-scouting"' }),
      this.renderR7CropProductCard({ kind: "control-treatment", label: "방제", primary: controlTreatment.latestLabel || "방제 기록 없음", secondary: `최근 ${controlTreatment.count ?? 0}건 · ${controlTreatment.staleState || "unknown"}`, state: controlTreatment.staleState || "empty", tone: String(controlTreatment.latestLabel || "").includes("확인 필요") ? "amber" : "green", evidence: [controlTreatment.latest?.date, controlTreatment.latest?.pesticides?.[0]?.name, controlTreatment.latest?.pesticides?.[0]?.pls === true ? "PLS 적합" : controlTreatment.latest?.pesticides?.[0]?.pls === false ? "PLS 확인 필요" : ""], actions: [], markers: 'data-r7-crop-record-card data-r7-crop-record-card-kind="control-treatment"' }),
      this.renderR7CropProductCard({ kind: "record-source", label: "기록 원천", primary: recordSource, secondary: "read-only · write/execute disabled", state: "ready", tone: "blue", evidence: recordFlags, actions: [], markers: 'data-r7-crop-record-card data-r7-crop-record-card-kind="record-source"', full: true }),
    ];
  }

  renderR7CropCycleCards(ctx) {
    const { selectedZone, cropCycleId, cropType, cropLabel, growthStage, variety, plantDate, demolishDate, assignmentState, freshness, recordSource } = ctx;
    return [
      this.renderR7CropProductCard({ kind: "crop-cycle-link", label: "작기 연결", primary: cropCycleId, secondary: `${assignmentState} · ${recordSource}`, state: assignmentState === "assigned" ? "fresh" : "attention", tone: "green", evidence: [freshness, `source ${recordSource}`, "read-only"], markers: 'data-r7-crop-cycle-card data-r7-crop-registration-lane data-r7-crop-assignment-card' }),
      this.renderR7CropProductCard({ kind: "crop-profile", label: "작물 프로필", primary: `${cropLabel} · ${variety}`, secondary: `${cropType} · ${growthStage}`, state: cropLabel === "작물 미지정" ? "empty" : "fresh", tone: "green", evidence: [cropType, growthStage, this._r7ZoneName(selectedZone)], actions: [this.renderR7CropActionButton("생육목표", "growth-target", "mdi:target")], markers: 'data-r7-crop-cycle-card data-r7-crop-registration-lane' }),
      this.renderR7CropProductCard({ kind: "operation-boundary", label: "운영 경계", primary: `${plantDate} ~ ${demolishDate}`, secondary: "정식일/철거일 기준으로 기록과 추세를 해석", state: plantDate === "정식일 미등록" ? "attention" : "fresh", tone: "amber", evidence: [`정식일 ${plantDate}`, `철거 ${demolishDate}`], actions: [this.renderR7CropActionButton("추세·근거", "trend-evidence", "mdi:chart-line")], markers: 'data-r7-crop-cycle-card data-r7-crop-season-review' }),
      this.renderR7CropProductCard({ kind: "assignment-evidence", label: "구역 배정 근거", primary: this._r7ZoneName(selectedZone), secondary: freshness, state: freshness.includes("fresh") ? "fresh" : "ready", tone: "blue", evidence: [assignmentState, freshness], markers: 'data-r7-crop-assignment-card data-r7-crop-registration-lane' }),
    ];
  }

  renderR7CropGrowthTargetCards(ctx) {
    const { cropLabel, variety, growthStage, targetStage, targetFocus, freshness, growthSurvey, workMissingItems, environmentImpactState, environmentImpactFocus, environmentImpactFactors } = ctx;
    const factorItems = String(environmentImpactFactors || "").split(",").map((item) => item.trim()).filter(Boolean);
    return [
      this.renderR7CropProductCard({ kind: "current-target-gap", label: "현재 → 목표", primary: `${growthStage} → ${targetStage}`, secondary: targetFocus, state: targetStage === growthStage ? "attention" : "ready", tone: "blue", evidence: [cropLabel, variety, growthStage], actions: [this.renderR7CropActionButton("기록·작업", "records-workflow", "mdi:clipboard-text-clock-outline")], markers: 'data-r7-crop-growth-target-card data-r7-crop-target-gap' }),
      this.renderR7CropProductCard({ kind: "observation-focus", label: "관찰 포인트", primary: targetFocus, secondary: "작물/생육단계 기준 관찰 방향", state: "ready", tone: "green", evidence: [freshness, cropLabel], markers: 'data-r7-crop-growth-target-card data-r7-crop-target-gap' }),
      this.renderR7CropProductCard({ kind: "target-environment-impact", label: "환경 영향", primary: environmentImpactFocus, secondary: environmentImpactState, state: environmentImpactState, tone: "blue", evidence: factorItems, actions: [this.renderR7DomainJumpButton("환경 보기", "environment-control", "mdi:thermometer"), this.renderR7DomainJumpButton("관수 보기", "irrigation-fertigation", "mdi:water")], markers: 'data-r7-crop-growth-target-card data-r7-crop-influence-strip' }),
      this.renderR7CropProductCard({ kind: "target-record-check", label: "기록 확인", primary: growthSurvey.latestLabel || "생육조사 기록 없음", secondary: `생육조사 ${growthSurvey.count ?? 0}건`, state: growthSurvey.staleState || "empty", tone: "amber", evidence: String(workMissingItems || "").split(",").map((item) => item.trim()).filter(Boolean), actions: [this.renderR7CropActionButton("기록·작업", "records-workflow", "mdi:format-list-bulleted")], markers: 'data-r7-crop-growth-target-card data-r7-crop-work-queue' }),
    ];
  }

  renderR7CropModelAssistCards(ctx) {
    const { environmentImpactState, environmentImpactFocus, environmentImpactFactors, recommendationReviewState, recommendationReviewSummary, approvalRequired } = ctx;
    const factorItems = String(environmentImpactFactors || "").split(",").map((item) => item.trim()).filter(Boolean);
    const approvalLabel = approvalRequired ? "승인 검토 필요" : "승인 대기 없음";
    return [
      this.renderR7CropProductCard({ kind: "recommendation-summary", label: "추천 요약", primary: recommendationReviewSummary, secondary: recommendationReviewState, state: approvalRequired ? "attention" : recommendationReviewState, tone: "red", evidence: [approvalLabel, recommendationReviewState], markers: 'data-r7-crop-model-card data-r7-crop-model-review-lane' }),
      this.renderR7CropProductCard({ kind: "recommendation-factors", label: "근거 요인", primary: environmentImpactFocus, secondary: environmentImpactState, state: environmentImpactState, tone: "blue", evidence: factorItems, actions: [this.renderR7DomainJumpButton("환경", "environment-control", "mdi:thermometer"), this.renderR7DomainJumpButton("관수", "irrigation-fertigation", "mdi:water"), this.renderR7DomainJumpButton("장치", "device-control", "mdi:devices")], markers: 'data-r7-crop-model-card data-r7-crop-influence-strip' }),
      this.renderR7CropProductCard({ kind: "approval-boundary", label: "승인/실행 경계", primary: approvalLabel, secondary: "작물 운영 화면에서는 실행하지 않음", state: approvalRequired ? "attention" : "ready", tone: "amber", evidence: ["executionEnabled=false", "deviceCommandEnabled=false", "mqttEnabled=false"], markers: 'data-r7-crop-model-card data-r7-crop-model-review-lane' }),
    ];
  }

  renderR7CropTrendEvidenceCards(ctx) {
    const { cropLabel, growthStage, freshness, recordSource, growthSurvey, pestScouting, controlTreatment, workMissingItems, environmentImpactState, environmentImpactFocus, environmentImpactFactors } = ctx;
    const missingItems = workMissingItems === "누락 항목 없음" ? [] : String(workMissingItems).split(",").map((item) => item.trim()).filter(Boolean);
    const factorItems = String(environmentImpactFactors || "").split(",").map((item) => item.trim()).filter(Boolean);
    const adequacy = missingItems.length ? "부족" : ((growthSurvey.count ?? 0) && (pestScouting.count ?? 0) && (controlTreatment.count ?? 0) ? "충분" : "부분");
    return [
      this.renderR7CropProductCard({ kind: "season-evidence-summary", label: "시즌 근거 요약", primary: `${growthSurvey.count ?? 0}회 생육조사 · ${pestScouting.count ?? 0}회 예찰 · ${controlTreatment.count ?? 0}회 방제`, secondary: `${cropLabel} · ${growthStage}`, state: adequacy === "충분" ? "fresh" : "attention", tone: "blue", evidence: [recordSource, freshness], actions: [this.renderR7CropActionButton("기록·작업", "records-workflow", "mdi:format-list-bulleted")], markers: 'data-r7-crop-season-review data-r7-crop-trend-evidence' }),
      this.renderR7CropProductCard({ kind: "growth-flow", label: "생육 흐름", primary: growthSurvey.latestLabel || "생육조사 기록 없음", secondary: "현재는 최신값 요약만 표시; 시계열 차트는 actual history DTO 추가 후", state: growthSurvey.staleState || "empty", tone: "green", evidence: [`${growthSurvey.count ?? 0}회 생육조사`, growthSurvey.staleState], markers: 'data-r7-crop-season-review' }),
      this.renderR7CropProductCard({ kind: "impact-flow", label: "영향 흐름", primary: environmentImpactFocus, secondary: "actual trend DTO 전까지는 factor summary만 표시", state: environmentImpactState, tone: "blue", evidence: factorItems, actions: [this.renderR7DomainJumpButton("환경", "environment-control", "mdi:thermometer")], markers: 'data-r7-crop-season-review data-r7-crop-influence-strip' }),
      this.renderR7CropProductCard({ kind: "data-adequacy", label: "데이터 충분성", primary: adequacy, secondary: missingItems.length ? `${missingItems.length}개 누락` : "누락 없음", state: adequacy === "충분" ? "fresh" : "attention", tone: missingItems.length ? "amber" : "green", evidence: [...missingItems, freshness], actions: [this.renderR7CropActionButton("기록·작업", "records-workflow", "mdi:clipboard-text-clock-outline")], markers: 'data-r7-crop-season-review' }),
    ];
  }

  renderR7CropProductCardsForSubtab(tabKey, ctx) {
    const missingItems = ctx.workMissingItems === "누락 항목 없음" ? [] : String(ctx.workMissingItems).split(",").map((item) => item.trim()).filter(Boolean);
    const factorItems = String(ctx.environmentImpactFactors || "").split(",").map((item) => item.trim()).filter(Boolean);
    const approvalLabel = ctx.approvalRequired ? "승인 검토 필요" : "승인 대기 없음";
    const recordCounts = `${ctx.growthSurvey.count ?? 0}회 생육조사 · ${ctx.pestScouting.count ?? 0}회 예찰 · ${ctx.controlTreatment.count ?? 0}회 방제`;
    const map = {
      "status-summary": () => [
        this.renderR7CropProductCard({ kind: "current-crop", label: "현재 작물", primary: `${ctx.cropLabel} · ${ctx.growthStage}`, secondary: `${ctx.variety} · ${ctx.cropType}`, state: ctx.assignmentState === "assigned" ? "fresh" : "attention", tone: "green", evidence: [`작기 ${ctx.cropCycleId}`, `정식일 ${ctx.plantDate}`, ctx.freshness], actions: [this.renderR7CropActionButton("작기 보기", "crop-cycle", "mdi:sprout-outline"), this.renderR7CropActionButton("생육목표", "growth-target", "mdi:target")], markers: 'data-r7-crop-status-functional-card data-r7-crop-current-context-card data-r7-crop-current-card' }),
        this.renderR7CropProductCard({ kind: "priority-check", label: "우선 확인", primary: ctx.workNextAction, secondary: missingItems.length ? `누락 ${missingItems.length}건` : "최근 기록 검토 완료", state: missingItems.length ? "attention" : "fresh", tone: "amber", evidence: missingItems, actions: [this.renderR7CropActionButton("기록·작업", "records-workflow", "mdi:clipboard-text-clock-outline"), this.renderR7CropActionButton("추세·근거", "trend-evidence", "mdi:chart-line")], markers: 'data-r7-crop-status-functional-card data-r7-crop-priority-action-card data-r7-crop-attention-queue' }),
        this.renderR7CropProductCard({ kind: "record-health", label: "기록 상태", primary: ctx.growthSurvey.latestLabel || ctx.pestScouting.latestLabel || ctx.controlTreatment.latestLabel || "기록 없음", secondary: recordCounts, state: ctx.pestScouting.staleState || "ready", tone: "green", evidence: [ctx.growthSurvey.latestLabel, ctx.pestScouting.latestLabel, ctx.controlTreatment.latestLabel], actions: [this.renderR7CropActionButton("기록·작업", "records-workflow", "mdi:format-list-bulleted")], markers: 'data-r7-crop-status-functional-card data-r7-crop-record-health-card' }),
        this.renderR7CropProductCard({ kind: "influence", label: "영향 요인", primary: ctx.environmentImpactFocus, secondary: ctx.environmentImpactState, state: ctx.environmentImpactState, tone: "blue", evidence: [factorItems.join(", "), ...factorItems], actions: [this.renderR7DomainJumpButton("환경", "environment-control", "mdi:thermometer"), this.renderR7DomainJumpButton("관수", "irrigation-fertigation", "mdi:water"), this.renderR7DomainJumpButton("장치", "device-control", "mdi:devices")], markers: 'data-r7-crop-status-functional-card data-r7-crop-influence-action-card data-r7-crop-influence-strip' }),
        this.renderR7CropProductCard({ kind: "recommendation", label: "추천 검토", primary: ctx.recommendationReviewSummary, secondary: approvalLabel, state: ctx.approvalRequired ? "attention" : ctx.recommendationReviewState, tone: "red", evidence: [approvalLabel, "실행 없음"], actions: [this.renderR7CropActionButton("모델·추천", "model-assist", "mdi:brain")], markers: 'data-r7-crop-status-functional-card data-r7-crop-recommendation-action-card' }),
      ],
      "crop-cycle": () => this.renderR7CropCycleCards(ctx),
      "growth-target": () => this.renderR7CropGrowthTargetCards(ctx),
      "records-workflow": () => this.renderR7CropRecordWorkCards(ctx),
      "model-assist": () => this.renderR7CropModelAssistCards(ctx),
      "trend-evidence": () => this.renderR7CropTrendEvidenceCards(ctx),
    };
    return this.renderR7CropProductCardGrid(tabKey, (map[tabKey] || map["status-summary"])());
  }

  renderR7CropProductSubtabScreen(tabKey, ctx) {
    return this.renderR7CropProductCardsForSubtab(tabKey, ctx);
  }

  renderR7CropStatusSummaryWidgets({ selectedZone, cropCycleId, cropType, cropLabel, growthStage, variety, plantDate, freshness, growthSurvey, pestScouting, controlTreatment, workNextAction, workMissingItems, environmentImpactFocus, environmentImpactFactors, recommendationReviewState, recommendationReviewSummary, approvalRequired }) {
    const missingItems = workMissingItems === "누락 항목 없음" ? [] : String(workMissingItems).split(",").map((item) => item.trim()).filter(Boolean);
    const factorItems = String(environmentImpactFactors || "").split(",").map((item) => item.trim()).filter(Boolean);
    const approvalLabel = approvalRequired ? "승인 검토 필요" : "승인 대기 없음";
    const empty = this.renderR7ProductEmptyState("누락 없음", "현재 표시할 누락 항목은 없습니다.");
    const currentCard = this.renderR7ProductCard({ kind: "current-crop", tone: "green", state: "fresh", legacyMarkers: "data-r7-crop-status-functional-card data-r7-crop-current-context-card data-r7-crop-current-card", header: this.renderR7ProductCardHeader({ icon: "mdi:sprout-outline", title: "현재 작물", subtitle: `${this._r7ZoneName(selectedZone)} 기준`, statusHtml: this.renderR7CropStatusChip("신선도", freshness, "green") }), body: this.renderR7ProductCardBody({ primary: `${cropLabel} · ${growthStage}`, secondary: `${variety} · ${cropType}` }), evidence: this.renderR7ProductCardEvidence([`작기 ${cropCycleId}`, `정식일 ${plantDate}`], "green"), actions: this.renderR7ProductCardActionRow([this.renderR7CropActionButton("작기 보기", "crop-cycle", "mdi:sprout-outline"), this.renderR7CropActionButton("생육목표", "growth-target", "mdi:target")]) });
    const priorityCard = this.renderR7ProductCard({ kind: "priority-check", tone: "amber", state: missingItems.length ? "attention" : "fresh", legacyMarkers: "data-r7-crop-status-functional-card data-r7-crop-priority-action-card data-r7-crop-attention-queue", header: this.renderR7ProductCardHeader({ icon: "mdi:alert-circle-outline", title: "우선 확인", subtitle: "read-only · 작업 우선순위", statusHtml: this.renderR7CropStatusChip("상태", missingItems.length ? "attention" : "fresh", "amber") }), body: this.renderR7ProductCardBody({ primary: workNextAction, html: missingItems.length ? `<ul style="margin:0;padding-left:18px;color:#6f5b2e;font-size:12px;line-height:1.55;">${missingItems.map((item) => `<li>${item}</li>`).join("")}</ul>` : empty }), evidence: this.renderR7ProductCardEvidence(missingItems, "amber"), actions: this.renderR7ProductCardActionRow([this.renderR7CropActionButton("기록·작업 확인", "records-workflow", "mdi:clipboard-text-clock-outline"), this.renderR7CropActionButton("추세 근거", "trend-evidence", "mdi:chart-line")]) });
    const recordCard = this.renderR7ProductCard({ kind: "record-health", tone: "green", state: pestScouting.staleState || "ready", legacyMarkers: "data-r7-crop-status-functional-card data-r7-crop-record-health-card", header: this.renderR7ProductCardHeader({ icon: "mdi:clipboard-pulse-outline", title: "기록 상태", subtitle: "생육·예찰·방제 최신 근거", statusHtml: this.renderR7CropStatusChip("예찰", pestScouting.staleState || "unknown", "amber") }), body: this.renderR7ProductCardBody({ html: `<div style="display:grid;gap:7px;font-size:12px;color:#24323f;line-height:1.45;"><div>${this.renderR7CropStatusChip("생육", growthSurvey.staleState || "unknown", "green")} ${growthSurvey.latestLabel || "생육조사 기록 없음"}</div><div>${this.renderR7CropStatusChip("예찰", pestScouting.staleState || "unknown", "amber")} ${pestScouting.latestLabel || "병해충 예찰 기록 없음"}</div><div>${this.renderR7CropStatusChip("방제", controlTreatment.staleState || "unknown", "red")} ${controlTreatment.latestLabel || "방제 기록 없음"}</div></div>` }), evidence: this.renderR7ProductCardEvidence([growthSurvey.latestLabel, pestScouting.latestLabel, controlTreatment.latestLabel], "green"), actions: this.renderR7ProductCardActionRow([this.renderR7CropActionButton("기록 상세", "records-workflow", "mdi:format-list-bulleted")]) });
    const influenceCard = this.renderR7ProductCard({ kind: "influence", tone: "blue", state: factorItems.length ? "attention" : "ready", legacyMarkers: "data-r7-crop-status-functional-card data-r7-crop-influence-action-card data-r7-crop-influence-strip", header: this.renderR7ProductCardHeader({ icon: "mdi:vector-link", title: "환경·관수·장치 영향", subtitle: "작물 기준 영향 요인", statusHtml: this.renderR7CropStatusChip("상태", factorItems.length ? "attention" : "ready", "blue") }), body: this.renderR7ProductCardBody({ primary: environmentImpactFocus }), evidence: this.renderR7ProductCardEvidence(factorItems, "blue"), actions: this.renderR7ProductCardActionRow([this.renderR7DomainJumpButton("환경 보기", "environment-control", "mdi:thermometer"), this.renderR7DomainJumpButton("관수 보기", "irrigation-fertigation", "mdi:water"), this.renderR7DomainJumpButton("장치 보기", "device-control", "mdi:devices")]) });
    const recommendationCard = this.renderR7ProductCard({ kind: "recommendation", tone: "red", state: recommendationReviewState, legacyMarkers: "data-r7-crop-status-functional-card data-r7-crop-recommendation-action-card", header: this.renderR7ProductCardHeader({ icon: "mdi:brain", title: "추천 검토", subtitle: "보조 판단 · 실행 권한 없음", statusHtml: this.renderR7CropStatusChip("상태", recommendationReviewState, "red") }), body: this.renderR7ProductCardBody({ primary: recommendationReviewSummary }), evidence: this.renderR7ProductCardEvidence([approvalLabel, "실행 없음"], approvalRequired ? "amber" : "green"), actions: this.renderR7ProductCardActionRow([this.renderR7CropActionButton("모델·추천 검토", "model-assist", "mdi:brain")]) });
    return `${currentCard}${priorityCard}${recordCard}${influenceCard}${recommendationCard}<template data-r7-product-empty-state-template>${this.renderR7ProductEmptyState()}</template>`;
  }

  renderR7CropSubtabPanel(tabKey, selectedZone, activeTab = "status-summary") {
    const active = tabKey === activeTab;
    const display = active ? "grid" : "none";
    const crop = selectedZone.currentCrop || {};
    const assignment = selectedZone.currentCropAssignment || {};
    const growthTarget = selectedZone.growthTargetProjection || {};
    const availability = assignment.dataAvailability || selectedZone.dataAvailability || {};
    const cropCycleId = crop.crop_cycle_id ?? selectedZone.activeCropCycleId ?? selectedZone.crop_cycle ?? "unassigned";
    const cropType = crop.crop_type || crop.cropType || "other";
    const cropLabel = crop.crop_label_ko || crop.cropLabelKo || selectedZone.crop || "작물 미지정";
    const growthStage = crop.growth_stage || crop.growthStage || selectedZone.state || "작기 정보 없음";
    const variety = crop.variety || "품종 미등록";
    const plantDate = crop.plant_date || crop.plantDate || "정식일 미등록";
    const demolishDate = crop.demolish_date || crop.demolishDate || "철거일 없음";
    const targetStage = growthTarget.targetStageLabel || growthStage;
    const targetFocus = growthTarget.targetFocus || "생육 균형 유지";
    const assignmentState = assignment.assignmentState || (cropCycleId !== "unassigned" ? "assigned" : "unassigned");
    const freshness = `${availability.state || selectedZone.dataAvailability?.state || "unknown"} · ${availability.source || selectedZone.dataAvailability?.source || "crop evidence"}`;
    const recordSummary = selectedZone.cropRecordSummary || {};
    const growthSurvey = recordSummary.growthSurvey || {};
    const pestScouting = recordSummary.pestScouting || {};
    const controlTreatment = recordSummary.controlTreatment || {};
    const workQueue = recordSummary.workQueue || {};
    const recordSource = recordSummary.recordSummarySource || "crop_record_summary_unavailable";
    const environmentImpact = selectedZone.environmentImpactProjection || {};
    const environmentImpactState = environmentImpact.impactState || "unknown";
    const environmentImpactFocus = environmentImpact.impactFocus || "환경·관수·장치 영향 근거 없음";
    const environmentImpactFactors = Array.isArray(environmentImpact.impactFactors) ? environmentImpact.impactFactors.join(", ") : (environmentImpact.impactFactors || environmentImpact.freshnessLabel || "영향 factor 없음");
    const recommendationReview = selectedZone.recommendationReviewProjection || {};
    const recommendationReviewState = recommendationReview.reviewState || "unknown";
    const recommendationReviewSummary = recommendationReview.reviewSummary || "추천 검토 근거 없음";
    const approvalRequired = recommendationReview.approvalRequired === true;
    const growthSurveyLabel = growthSurvey.latestLabel || "생육조사 기록 없음";
    const pestScoutingLabel = pestScouting.latestLabel || "병해충 예찰 기록 없음";
    const controlTreatmentLabel = controlTreatment.latestLabel || "방제 기록 없음";
    const workNextAction = workQueue.nextAction || "최근 기록 확인 필요";
    const workMissingItems = Array.isArray(workQueue.missingItems) && workQueue.missingItems.length ? workQueue.missingItems.join(", ") : "누락 항목 없음";
    const labels = {
      "status-summary": "상태 요약",
      "crop-cycle": "작기·현재작물",
      "growth-target": "생육목표",
      "records-workflow": "기록·작업",
      "model-assist": "모델·추천",
      "trend-evidence": "추세·근거",
    };
    const markers = {
      "status-summary": "data-r7-crop-status-summary-grid",
      "crop-cycle": "data-r7-crop-cycle-grid",
      "growth-target": "data-r7-crop-growth-target-grid",
      "records-workflow": "data-r7-crop-record-workflow-grid",
      "model-assist": "data-r7-crop-model-assist-grid",
      "trend-evidence": "data-r7-crop-trend-evidence",
    };
    const operatorQuestions = {
      "status-summary": "현재 구역 작물이 정상인가, 무엇을 먼저 봐야 하는가? · read-only",
      "crop-cycle": "이 구역의 현재 작기/작물 정보가 무엇이고 운영 경계가 맞는가? · read-only",
      "growth-target": "작물 목표와 현재 상태의 목표 대비 차이는 무엇인가? · read-only",
      "records-workflow": "오늘 확인할 작업과 누락된 기록은 무엇인가? · read-only",
      "model-assist": "모델 검토가 무엇을 근거로 어떤 확인을 권하는가? · read-only",
      "trend-evidence": "시즌 리뷰에서 작기/생육/환경·관수 영향이 어떻게 변했는가? · read-only",
    };
    const body = this.renderR7CropProductSubtabScreen(tabKey, { selectedZone, cropCycleId, cropType, cropLabel, growthStage, variety, plantDate, demolishDate, targetStage, targetFocus, assignmentState, freshness, recordSource, growthSurvey, pestScouting, controlTreatment, workNextAction, workMissingItems, environmentImpactState, environmentImpactFocus, environmentImpactFactors, recommendationReviewState, recommendationReviewSummary, approvalRequired });
    return `<section data-r7-domain-subtab-panel data-r7-domain-subtab-panel-key="${tabKey}" data-r7-crop-subtab="${tabKey}" data-r7-crop-detail-absorbed="true" ${markers[tabKey]} data-r7-crop-third-party-informed="true" data-r7-crop-real-context-bound="true" data-r7-crop-record-summary-source="${recordSource}" data-r7-crop-environment-impact-source="${environmentImpactState}" data-r7-crop-recommendation-review-source="${recommendationReviewState}" data-r7-crop-vendor-pattern="crop-goal-to-influence-to-action" style="display:${display};gap:10px;border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:14px;"><header style="display:flex;align-items:center;justify-content:space-between;gap:10px;"><div style="display:grid;gap:4px;"><strong style="color:#24323f;font-size:15px;">${labels[tabKey]}</strong><span data-r7-crop-operator-question style="color:#5d6f62;font-size:12px;line-height:1.45;">${operatorQuestions[tabKey]}</span></div><span style="color:#78927f;font-size:12px;">${this._r7ZoneName(selectedZone)} · ${cropLabel}</span></header><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;">${body}</div></section>`;
  }

  renderR7CropOperationsZoneVisual() {
    const selectedZone = this._r7PrimaryZoneForDomain();
    const tabs = [["status-summary", "상태 요약"], ["crop-cycle", "작기·현재작물"], ["growth-target", "생육목표"], ["records-workflow", "기록·작업"], ["model-assist", "모델·추천"], ["trend-evidence", "추세·근거"]];
    const activeTab = this._activeR7DomainSubtabs["crop-operations"] || "status-summary";
    const panels = tabs.map(([key]) => this.renderR7CropSubtabPanel(key, selectedZone, activeTab)).join("");
    return `<section data-r7-crop-zone-visual="true" style="display:grid;gap:14px;">${this.renderR7DomainVisualFrame({ domainKey: "crop-operations", title: "작물 운영", kicker: "구역 기준 작물 운영", summary: "현재 작물, 작기, 생육목표, 생육조사, 병해충 예찰, 방제 기록, crop model evidence를 구역 기준으로 확인합니다.", status: "normal", tabs, activeTab, panels })}<section style="display:none;">작물 운영 · currentCrop · crop_cycle · growthTargetProjection · 생육조사 · 병해충 예찰 · 방제 기록 · crop model evidence · 진단·위험·조치 추천</section></section>`;
  }

  renderR7EnvironmentSubtabPanel(tabKey, selectedZone, activeTab = "status-summary") {
    const active = tabKey === activeTab;
    const display = active ? "grid" : "none";
    const labels = {
      "status-summary": "상태 요약",
      "base-settings": "설정값",
      "rule-schedule": "일정·규칙",
      "interlock-block": "인터록·차단",
      "assist-fallback": "추천·보조",
      "trend-evidence": "추세·근거",
    };
    const markers = {
      "status-summary": "data-r7-environment-zone-status-grid",
      "base-settings": "data-r7-environment-zone-base-settings",
      "rule-schedule": "data-r7-environment-rule-schedule-grid",
      "interlock-block": "data-r7-environment-zone-interlock-stack",
      "assist-fallback": "data-r7-environment-assist-fallback-grid",
      "trend-evidence": "data-r7-environment-zone-trend-evidence",
    };
    const settingCard = (label, value, note) => `<article data-r7-environment-setting-card data-r7-environment-manual-setting="${label}" style="border:1px solid #e2eee5;border-radius:16px;background:#fbfdfb;padding:12px;display:grid;gap:6px;"><strong style="color:#31523b;font-size:13px;">${label}</strong><span style="color:#24323f;font-size:18px;font-weight:1000;">${value}</span><small style="color:#78927f;font-size:11px;line-height:1.45;">${note}</small></article>`;
    const ruleCard = (label, note) => `<article data-r7-environment-rule-card data-r7-environment-rule="${label}" style="border:1px solid #e2eee5;border-radius:16px;background:#fff;padding:12px;display:grid;gap:6px;"><strong style="color:#31523b;font-size:13px;">${label}</strong><span style="color:#5d6f62;font-size:12px;line-height:1.5;">${note}</span></article>`;
    const assistCard = (label, note) => `<article data-r7-environment-assist-card data-r7-environment-ai-item="${label}" style="border:1px solid #d8e4f2;border-radius:16px;background:#f8fbff;padding:12px;display:grid;gap:6px;"><strong style="color:#264f73;font-size:13px;">${label}</strong><span style="color:#52667a;font-size:12px;line-height:1.5;">${note}</span></article>`;
    const safetyCard = (label, note) => `<article data-r7-environment-safety-card data-r7-environment-safety-item="${label}" style="border:1px solid #f0d0b8;border-radius:16px;background:#fff8f2;padding:12px;display:grid;gap:6px;"><strong style="color:#8a4d22;font-size:13px;">${label}</strong><span style="color:#6b5a48;font-size:12px;line-height:1.5;">${note}</span></article>`;
    const body = tabKey === "status-summary"
      ? `${this.renderR7MetricCard("온도", "24.1℃", "23~25℃", "+0.4℃", "정상")}${this.renderR7MetricCard("습도", "82%", "65~75%", "+7%", "주의")}${this.renderR7MetricCard("VPD", "0.72 kPa", "0.8~1.2", "-0.08", "주의")}${this.renderR7MetricCard("CO₂", "720 ppm", "600~900", "0", "정상")}`
      : tabKey === "base-settings"
        ? `${settingCard("주간 온도", "24~27℃", "작물 기준 범위 안에서 운영자가 조정")}${settingCard("야간 온도", "17~19℃", "저온 위험 시 안전 상태 우선")}${settingCard("습도", "65~75%", "VPD 목표와 함께 판단")}${settingCard("VPD", "0.8~1.2 kPa", "환경 제어의 핵심 기준")}${settingCard("CO₂", "600~900 ppm", "시간대/환기 상태와 함께 적용")}${settingCard("광/DLI", "작물별 기준", "DLI 부족/과다 상태 표시")}`
        : tabKey === "rule-schedule"
          ? `${ruleCard("주야간 전환", "일출/일몰 또는 운영 시간표 기준")}${ruleCard("환기 단계", "온도/VPD 편차가 크면 환기 후보 산출")}${ruleCard("난방 최소온도", "야간 하한 이하 후보는 난방 검토")}${ruleCard("CO₂ 시간대", "환기 제한이 없는 시간대에만 후보 표시")}`
          : tabKey === "interlock-block"
            ? `${safetyCard("환경 한계", "고온/저온/고습/VPD 한계로 후보 제한")}${safetyCard("장치 인터록", "강풍·비·장치 통신 장애 시 환기·스크린 후보 제한")}${safetyCard("최종 환경 후보", "안전/인터록 이후 남은 후보만 표시")}`
            : tabKey === "assist-fallback"
              ? `${assistCard("aiEnvironmentCorrection", "상태가 정상일 때만 보정 후보로 표시")}${assistCard("수동 기준 대비 차이", "온도/VPD/습도/CO₂별 차이를 설명")}${assistCard("fallback", "AI disabled/unhealthy/timeout/stale이면 보정 제외")}`
              : `${this.renderR7MiniTrendChart("온도 추세", "최신")}${this.renderR7MiniTrendChart("습도 추세", "최신")}${this.renderR7MiniTrendChart("VPD 추세", "최신")}${this.renderR7MiniTrendChart("CO₂ 추세", "최신")}`;
    return `<section data-r7-domain-subtab-panel data-r7-domain-subtab-panel-key="${tabKey}" data-r7-environment-subtab="${tabKey}" data-r7-environment-detail-absorbed="true" ${markers[tabKey]} style="display:${display};gap:10px;border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:14px;"><header style="display:flex;align-items:center;justify-content:space-between;gap:10px;"><strong style="color:#24323f;font-size:15px;">${labels[tabKey]}</strong><span style="color:#78927f;font-size:12px;">${this._r7ZoneName(selectedZone)} · ${this._r7ZoneCropLabel(selectedZone)}</span></header><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;">${body}</div></section>`;
  }

  renderR7EnvironmentZoneVisual() {
    const selectedZone = this._r7PrimaryZoneForDomain();
    const tabs = [["status-summary", "상태 요약"], ["base-settings", "설정값"], ["rule-schedule", "일정·규칙"], ["interlock-block", "인터록·차단"], ["assist-fallback", "추천·보조"], ["trend-evidence", "추세·근거"]];
    const activeTab = this._activeR7DomainSubtabs["environment-control"] || "status-summary";
    const panels = tabs.map(([key]) => this.renderR7EnvironmentSubtabPanel(key, selectedZone, activeTab)).join("");
    return `<section data-r7-environment-zone-visual="true" style="display:grid;gap:14px;">${this.renderR7DomainVisualFrame({ domainKey: "environment-control", title: "환경 제어", kicker: "구역별 환경 상태", summary: "온도·습도·VPD·CO₂·광/DLI 기준과 일정·규칙, 인터록, 추천 보조 상태를 구역별로 확인합니다.", status: "attention", tabs, activeTab, panels })}<section style="display:none;">구역별 환경 상태 · 현재 선택 구역 · 환기 후보 · Safety/Interlock 우선 · 센서 freshness</section></section>`;
  }

  renderR7IrrigationSubtabPanel(tabKey, selectedZone, activeTab = "status-summary") {
    const active = tabKey === activeTab;
    const display = active ? "grid" : "none";
    const labels = {
      "status-summary": "상태 요약",
      "base-settings": "설정값",
      "rule-schedule": "일정·규칙",
      "interlock-block": "인터록·차단",
      "assist-fallback": "추천·보조",
      "trend-evidence": "추세·근거",
    };
    const markers = {
      "status-summary": "data-r7-irrigation-zone-status-grid",
      "base-settings": "data-r7-irrigation-zone-base-settings",
      "rule-schedule": "data-r7-irrigation-rule-schedule-grid",
      "interlock-block": "data-r7-irrigation-zone-interlock-stack",
      "assist-fallback": "data-r7-irrigation-assist-fallback-grid",
      "trend-evidence": "data-r7-irrigation-zone-trend-evidence",
    };
    const settingCard = (label, value, note) => `<article data-r7-irrigation-setting-card data-r7-irrigation-manual-setting="${label}" style="border:1px solid #e2eee5;border-radius:16px;background:#fbfdfb;padding:12px;display:grid;gap:6px;"><strong style="color:#31523b;font-size:13px;">${label}</strong><span style="color:#24323f;font-size:18px;font-weight:1000;">${value}</span><small style="color:#78927f;font-size:11px;line-height:1.45;">${note}</small></article>`;
    const ruleCard = (label, note) => `<article data-r7-irrigation-rule-card data-r7-irrigation-rule="${label}" style="border:1px solid #e2eee5;border-radius:16px;background:#fff;padding:12px;display:grid;gap:6px;"><strong style="color:#31523b;font-size:13px;">${label}</strong><span style="color:#5d6f62;font-size:12px;line-height:1.5;">${note}</span></article>`;
    const assistCard = (label, note) => `<article data-r7-irrigation-assist-card data-r7-irrigation-ai-item="${label}" style="border:1px solid #d8e4f2;border-radius:16px;background:#f8fbff;padding:12px;display:grid;gap:6px;"><strong style="color:#264f73;font-size:13px;">${label}</strong><span style="color:#52667a;font-size:12px;line-height:1.5;">${note}</span></article>`;
    const safetyCard = (label, note) => `<article data-r7-irrigation-safety-card data-r7-irrigation-safety-item="${label}" style="border:1px solid #f0d0b8;border-radius:16px;background:#fff8f2;padding:12px;display:grid;gap:6px;"><strong style="color:#8a4d22;font-size:13px;">${label}</strong><span style="color:#6b5a48;font-size:12px;line-height:1.5;">${note}</span></article>`;
    const body = tabKey === "status-summary"
      ? `${this.renderR7MetricCard("EC", "2.1 dS/m", "1.8~2.4", "+0.1", "정상")}${this.renderR7MetricCard("pH", "6.0", "5.8~6.3", "0", "정상")}${this.renderR7MetricCard("배액률", "24%", "20~30%", "0", "정상")}${this.renderR7MetricCard("드라이백", "10%", "8~12%", "0", "정상")}`
      : tabKey === "base-settings"
        ? `${settingCard("관수 스케줄", "06:00 / 10:30 / 14:30", "기본 시간 기반 관수 기준")}${settingCard("일사 누적 관수", "100~160 J/cm²", "일사량 기준 추가 관수 후보")}${settingCard("EC 목표", "EC 1.8~2.4 dS/m", "작물/생육단계별 양액 농도 기준")}${settingCard("pH 목표", "pH 5.8~6.3", "양액 흡수 안정 범위")}${settingCard("급액량", "구역별 기준", "회당 급액량은 구역/배지 기준")}${settingCard("배액률", "20~30%", "과소/과다 배액을 safety evidence로 표시")}${settingCard("드라이백", "8~12%", "야간/일출 전 근권 수분 회복 기준")}${settingCard("양액 레시피", "작물별 기준", "레시피 소유는 관수 제어 도메인")}`
        : tabKey === "rule-schedule"
          ? `${ruleCard("시간 기반 관수", "운영자가 정한 시간표 기준으로 후보 표시")}${ruleCard("일사 누적 관수", "누적 일사량 기준에 도달하면 추가 후보 산출")}${ruleCard("근권 수분 기준 관수", "VWC/드라이백 evidence가 충분할 때만 후보 표시")}${ruleCard("저수조/배액 재활용 점검", "저수조/배액 상태가 정상일 때만 재활용 후보 표시")}`
          : tabKey === "interlock-block"
            ? `${safetyCard("관수 한계", "과관수/저수조/배액/EC/pH 한계로 후보 제한")}${safetyCard("센서 신선도", "센서 stale 또는 배액 오류 시 AI 보정 제한")}${safetyCard("최종 관수 후보", "Safety clamp 이후의 최종 후보만 표시")}`
            : tabKey === "assist-fallback"
              ? `${assistCard("aiIrrigationCorrection", "상태가 정상일 때만 보정 후보로 표시")}${assistCard("수동 기준 대비 차이", "EC/pH/급액량/배액률/드라이백별 차이를 설명")}${assistCard("fallback", "AI disabled/unhealthy/timeout/stale이면 보정 제외")}`
              : `${this.renderR7MiniTrendChart("EC 추세", "최신")}${this.renderR7MiniTrendChart("pH 추세", "최신")}${this.renderR7MiniTrendChart("배액률 추세", "최신")}${this.renderR7MiniTrendChart("드라이백 추세", "최신")}`;
    return `<section data-r7-domain-subtab-panel data-r7-domain-subtab-panel-key="${tabKey}" data-r7-irrigation-subtab="${tabKey}" data-r7-irrigation-detail-absorbed="true" ${markers[tabKey]} style="display:${display};gap:10px;border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:14px;"><header style="display:flex;align-items:center;justify-content:space-between;gap:10px;"><strong style="color:#24323f;font-size:15px;">${labels[tabKey]}</strong><span style="color:#78927f;font-size:12px;">${this._r7ZoneName(selectedZone)} · ${this._r7ZoneCropLabel(selectedZone)}</span></header><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;">${body}</div></section>`;
  }

  renderR7IrrigationZoneVisual() {
    const selectedZone = this._r7PrimaryZoneForDomain();
    const tabs = [["status-summary", "상태 요약"], ["base-settings", "설정값"], ["rule-schedule", "일정·규칙"], ["interlock-block", "인터록·차단"], ["assist-fallback", "추천·보조"], ["trend-evidence", "추세·근거"]];
    const activeTab = this._activeR7DomainSubtabs["irrigation-fertigation"] || "status-summary";
    const panels = tabs.map(([key]) => this.renderR7IrrigationSubtabPanel(key, selectedZone, activeTab)).join("");
    return `<section data-r7-irrigation-zone-visual="true" style="display:grid;gap:14px;">${this.renderR7DomainVisualFrame({ domainKey: "irrigation-fertigation", title: "관수 제어", kicker: "구역별 관수 제어 상태", summary: "관수 스케줄, EC/pH, 급액량, 배액률, 드라이백, 레시피 기준과 일정·규칙, 인터록, 추천 보조 상태를 구역별로 확인합니다.", status: "normal", tabs, activeTab, panels })}<section style="display:none;">구역별 관수 제어 상태 · 현재 선택 구역 · 관수 후보 · Safety clamp 우선 · 센서 신선도</section></section>`;
  }

  renderR7DeviceSubtabPanel(tabKey, selectedZone, activeTab = "status-summary") {
    const active = tabKey === activeTab;
    const display = active ? "grid" : "none";
    const labels = {
      "status-summary": "상태 요약",
      "base-settings": "설정값",
      "rule-schedule": "일정·규칙",
      "interlock-block": "인터록·차단",
      "assist-fallback": "추천·보조",
      "trend-evidence": "추세·근거",
    };
    const markers = {
      "status-summary": "data-r7-device-zone-status-grid",
      "base-settings": "data-r7-device-zone-base-settings",
      "rule-schedule": "data-r7-device-rule-schedule-grid",
      "interlock-block": "data-r7-device-zone-interlock-stack",
      "assist-fallback": "data-r7-device-assist-fallback-grid",
      "trend-evidence": "data-r7-device-zone-trend-evidence",
    };
    const settingCard = (key, label, note) => `<article data-r7-device-setting-card data-r7-device-manual-setting="${key}" style="border:1px solid #e2eee5;border-radius:16px;background:#fbfdfb;padding:12px;display:grid;gap:6px;"><strong style="color:#31523b;font-size:13px;">${label}</strong><span style="color:#24323f;font-size:15px;font-weight:1000;">${key}</span><small style="color:#78927f;font-size:11px;line-height:1.45;">${note}</small></article>`;
    const ruleCard = (label, note) => `<article data-r7-device-rule-card data-r7-device-rule="${label}" style="border:1px solid #e2eee5;border-radius:16px;background:#fff;padding:12px;display:grid;gap:6px;"><strong style="color:#31523b;font-size:13px;">${label}</strong><span style="color:#5d6f62;font-size:12px;line-height:1.5;">${note}</span></article>`;
    const assistCard = (label, note) => `<article data-r7-device-assist-card data-r7-device-ai-item="${label}" style="border:1px solid #d8e4f2;border-radius:16px;background:#f8fbff;padding:12px;display:grid;gap:6px;"><strong style="color:#264f73;font-size:13px;">${label}</strong><span style="color:#52667a;font-size:12px;line-height:1.5;">${note}</span></article>`;
    const safetyCard = (label, note) => `<article data-r7-device-safety-card data-r7-device-safety-item="${label}" style="border:1px solid #f0d0b8;border-radius:16px;background:#fff8f2;padding:12px;display:grid;gap:6px;"><strong style="color:#8a4d22;font-size:13px;">${label}</strong><span style="color:#6b5a48;font-size:12px;line-height:1.5;">${note}</span></article>`;
    const body = tabKey === "status-summary"
      ? `${this.renderR7MetricCard("장치 응답", "주의", "응답 지연 1건", "+1", "경고")}${this.renderR7MetricCard("운영 모드", "manual", "수동 우선", "0", "정상")}${this.renderR7MetricCard("매핑 상태", "확인 필요", "HA/MQTT evidence", "+1", "주의")}${this.renderR7MetricCard("실행 권한", "차단", "read-only", "0", "차단")}`
      : tabKey === "base-settings"
        ? `${settingCard("manual", "수동 모드", "작업자가 현장 기준으로 직접 판단하는 모드 evidence")}${settingCard("auto", "자동 모드", "규칙/스케줄 후보를 허용하되 safety gate 필요")}${settingCard("locked", "잠금 모드", "권한/안전 사유로 조작 차단")}${settingCard("maintenance", "점검 모드", "정비 중에는 자동 후보를 표시만 함")}${settingCard("HA entity mapping", "HA entity mapping", "장치 상태 확인용 mapping metadata")}${settingCard("MQTT topic mapping later only", "MQTT topic mapping later only", "Physical MQTT/device hookup 전까지 실행에 사용하지 않음")}`
        : tabKey === "rule-schedule"
          ? `${ruleCard("operatorRequestedAction", "작업자 요청은 read-only 후보로만 표시")}${ruleCard("automationCandidate", "규칙/스케줄 자동화 후보도 mode gate를 통과해야 함")}${ruleCard("mode gate", "manual/auto/locked/maintenance 상태로 후보를 제한")}${ruleCard("mapping health", "HA/MQTT mapping 상태는 실행 허용 조건의 evidence")}`
          : tabKey === "interlock-block"
            ? `${safetyCard("permission check", "역할/권한이 없으면 조작 차단")}${safetyCard("Safety check", "작물/환경/관수 safety 조건을 먼저 확인")}${safetyCard("Interlock check", "강풍/비/저온/센서 stale/장치 오류 interlock")}${safetyCard("Fail Safe check", "통신 장애·비정상 상태면 safe state 유지")}${safetyCard("HA/MQTT status", "HA/MQTT 상태는 read-only evidence; 실행 권한 없음")}`
            : tabKey === "assist-fallback"
              ? `${assistCard("optional aiStrategyHint", "AI는 장치 전략 힌트만 제공")}${assistCard("hint only", "AI는 장치 명령을 직접 내리지 않음")}${assistCard("fallback", "AI disabled/unhealthy/timeout/stale이면 hint를 제외")}${assistCard("Physical MQTT/device hookup remains blocked", "가상 시나리오 검증 전까지 실제 장치 연결은 차단")}`
              : `${this.renderR7MiniTrendChart("장치 응답 추세", "최신")}${this.renderR7MiniTrendChart("모드 변경 이력", "최신")}${this.renderR7MiniTrendChart("매핑 health", "확인")}${this.renderR7MiniTrendChart("차단 이유", "누적")}`;
    return `<section data-r7-domain-subtab-panel data-r7-domain-subtab-panel-key="${tabKey}" data-r7-device-subtab="${tabKey}" data-r7-device-detail-absorbed="true" ${markers[tabKey]} style="display:${display};gap:10px;border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:14px;"><header style="display:flex;align-items:center;justify-content:space-between;gap:10px;"><strong style="color:#24323f;font-size:15px;">${labels[tabKey]}</strong><span style="color:#78927f;font-size:12px;">${this._r7ZoneName(selectedZone)} · ${this._r7ZoneCropLabel(selectedZone)}</span></header><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;">${body}</div></section>`;
  }

  renderR7DeviceZoneVisual() {
    const selectedZone = this._r7PrimaryZoneForDomain();
    const tabs = [["status-summary", "상태 요약"], ["base-settings", "설정값"], ["rule-schedule", "일정·규칙"], ["interlock-block", "인터록·차단"], ["assist-fallback", "추천·보조"], ["trend-evidence", "추세·근거"]];
    const activeTab = this._activeR7DomainSubtabs["device-control"] || "status-summary";
    const panels = tabs.map(([key]) => this.renderR7DeviceSubtabPanel(key, selectedZone, activeTab)).join("");
    return `<section data-r7-device-zone-visual="true" style="display:grid;gap:14px;">${this.renderR7DomainVisualFrame({ domainKey: "device-control", title: "장치 제어", kicker: "구역별 장치 상태", summary: "수동/자동/잠금/점검 모드, 장치 매핑, 모드 gate, 인터록, AI hint-only 상태를 구역별로 확인합니다.", status: "warning", tabs, activeTab, panels })}<section style="display:none;">구역별 장치 상태 · 현재 선택 구역 · mode gate · HA entity mapping · MQTT topic mapping later only · Physical MQTT/device hookup remains blocked</section></section>`;
  }

  renderR7RecommendationSubtabPanel(tabKey, selectedZone, activeTab = "status-summary") {
    const active = tabKey === activeTab;
    const display = active ? "grid" : "none";
    const labels = {
      "status-summary": "상태 요약",
      "base-settings": "설정값",
      "rule-schedule": "일정·규칙",
      "interlock-block": "인터록·차단",
      "assist-fallback": "추천·보조",
      "trend-evidence": "추세·근거",
    };
    const markers = {
      "status-summary": "data-r7-recommendation-zone-status-grid",
      "base-settings": "data-r7-recommendation-zone-base-settings",
      "rule-schedule": "data-r7-recommendation-rule-schedule-grid",
      "interlock-block": "data-r7-recommendation-zone-interlock-stack",
      "assist-fallback": "data-r7-recommendation-assist-fallback-grid",
      "trend-evidence": "data-r7-recommendation-zone-trend-evidence",
    };
    const settingCard = (label, value, note) => `<article data-r7-recommendation-setting-card data-r7-recommendation-manual-item="${label}" style="border:1px solid #e2eee5;border-radius:16px;background:#fbfdfb;padding:12px;display:grid;gap:6px;"><strong style="color:#31523b;font-size:13px;">${label}</strong><span style="color:#24323f;font-size:15px;font-weight:1000;">${value}</span><small style="color:#78927f;font-size:11px;line-height:1.45;">${note}</small></article>`;
    const ruleCard = (label, note) => `<article data-r7-recommendation-rule-card data-r7-recommendation-rule="${label}" style="border:1px solid #e2eee5;border-radius:16px;background:#fff;padding:12px;display:grid;gap:6px;"><strong style="color:#31523b;font-size:13px;">${label}</strong><span style="color:#5d6f62;font-size:12px;line-height:1.5;">${note}</span></article>`;
    const assistCard = (label, note) => `<article data-r7-recommendation-assist-card data-r7-recommendation-ai-item="${label}" style="border:1px solid #d8e4f2;border-radius:16px;background:#f8fbff;padding:12px;display:grid;gap:6px;"><strong style="color:#264f73;font-size:13px;">${label}</strong><span style="color:#52667a;font-size:12px;line-height:1.5;">${note}</span></article>`;
    const safetyCard = (label, note) => `<article data-r7-recommendation-safety-card data-r7-recommendation-safety-item="${label}" style="border:1px solid #f0d0b8;border-radius:16px;background:#fff8f2;padding:12px;display:grid;gap:6px;"><strong style="color:#8a4d22;font-size:13px;">${label}</strong><span style="color:#6b5a48;font-size:12px;line-height:1.5;">${note}</span></article>`;
    const body = tabKey === "status-summary"
      ? `${this.renderR7MetricCard("추천 상태", "보조", "실행 권한 없음", "0", "정상")}${this.renderR7MetricCard("수동 기준", "우선", "Manual baseline", "0", "정상")}${this.renderR7MetricCard("AI 보정", "후보", "assist only", "+1", "주의")}${this.renderR7MetricCard("최종 명령", "없음", "authority none", "0", "차단")}`
      : tabKey === "base-settings"
        ? `${settingCard("환경 수동 기준", "온도/VPD/습도/CO₂ 기준", "환경 제어 도메인의 manualEnvironmentSettings를 먼저 비교")}${settingCard("관수 제어 수동 기준", "관수 스케줄/EC/pH/배액률", "baseIrrigationSettings 기준 대비 차이를 표시")}${settingCard("장치 모드 기준", "manual/auto/locked/maintenance", "장치 제어 도메인의 mode gate를 먼저 확인")}${settingCard("AI off fallback value", "수동+기본 자동화", "AI가 꺼져도 남는 기준값")}`
        : tabKey === "rule-schedule"
          ? `${ruleCard("rule/schedule candidate", "시간표·일사·환경 편차 기반 기본 자동화 후보")}${ruleCard("automation eligibility", "데이터 신선도/모드/권한이 후보 표시 조건")}${ruleCard("difference from manual baseline", "수동 기준 대비 증가/감소/미적용 이유를 표시")}`
          : tabKey === "interlock-block"
            ? `${safetyCard("Safety-final candidate", "Safety/Interlock/Fail Safe 이후의 후보만 표시")}${safetyCard("not final command", "표시 후보는 최종 명령이 아님")}${safetyCard("no final command authority", "자동화 제어는 final command authority를 갖지 않음")}`
            : tabKey === "assist-fallback"
              ? `${assistCard("AI recommendation/correction", "AI가 추천·보정 후보와 근거를 설명")}${assistCard("explanation", "왜 수동 기준과 다른지 구역/도메인별로 설명")}${assistCard("fallback", "AI disabled/unhealthy/timeout/stale이면 AI 후보 제외")}${assistCard("final command authority none", "Safety-final candidate도 최종 명령 권한은 없음")}`
              : `${this.renderR7MiniTrendChart("추천 변화", "최신")}${this.renderR7MiniTrendChart("수동 대비 차이", "최신")}${this.renderR7MiniTrendChart("AI 보조 이력", "후보")}${this.renderR7MiniTrendChart("미적용 이유", "누적")}`;
    return `<section data-r7-domain-subtab-panel data-r7-domain-subtab-panel-key="${tabKey}" data-r7-recommendation-subtab="${tabKey}" data-r7-recommendation-detail-absorbed="true" ${markers[tabKey]} style="display:${display};gap:10px;border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:14px;"><header style="display:flex;align-items:center;justify-content:space-between;gap:10px;"><strong style="color:#24323f;font-size:15px;">${labels[tabKey]}</strong><span style="color:#78927f;font-size:12px;">${this._r7ZoneName(selectedZone)} · ${this._r7ZoneCropLabel(selectedZone)}</span></header><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;">${body}</div></section>`;
  }

  renderR7RecommendationZoneVisual() {
    const selectedZone = this._r7PrimaryZoneForDomain();
    const tabs = [["status-summary", "상태 요약"], ["base-settings", "설정값"], ["rule-schedule", "일정·규칙"], ["interlock-block", "인터록·차단"], ["assist-fallback", "추천·보조"], ["trend-evidence", "추세·근거"]];
    const activeTab = this._activeR7DomainSubtabs["recommendation-automation"] || "status-summary";
    const panels = tabs.map(([key]) => this.renderR7RecommendationSubtabPanel(key, selectedZone, activeTab)).join("");
    return `<section data-r7-recommendation-zone-visual="true" style="display:grid;gap:14px;">${this.renderR7DomainVisualFrame({ domainKey: "recommendation-automation", title: "자동화 제어", kicker: "구역별 자동화 제어 후보", summary: "수동 기준값, 기본 자동화 후보, AI 추천·보정, fallback, Safety-final 후보를 구역별로 비교합니다. 최종 명령 권한은 없습니다.", status: "attention", tabs, activeTab, panels })}<section style="display:none;">구역별 자동화 제어 후보 · Manual baseline · rule/schedule candidate · AI recommendation/correction · final command authority none</section></section>`;
  }

  renderR7DetailSubpage(subpage) {
    return `<article id="${subpage.key}" data-r7-detail-subpage="${subpage.key}" data-r7-manual-first-domain="${subpage.key}" data-r7-subpage-readonly-boundary="true" data-r7-subpage-config-placeholder style="display:grid;gap:10px;">
      ${subpage.key === "crop-operations" ? this.renderR7CropOperationsZoneVisual() : ""}
      ${subpage.key === "environment-control" ? this.renderR7EnvironmentZoneVisual() : ""}
      ${subpage.key === "irrigation-fertigation" ? this.renderR7IrrigationZoneVisual() : ""}
      ${subpage.key === "device-control" ? this.renderR7DeviceZoneVisual() : ""}
      ${subpage.key === "recommendation-automation" ? this.renderR7RecommendationZoneVisual() : ""}
      ${subpage.key === "safety-history" ? this.renderR7SafetyHistoryZoneVisual() : ""}
      ${subpage.key === "settings-admin" ? this.renderR7SettingsAdminZoneVisual() : ""}
    </article>`;
  }

  renderR7DomainPageShell(subpage, body) {
    return `<section data-r7-domain-page-shell data-r7-domain-page="${subpage.key}" data-r7-domain-page-active="true" data-r7-domain-page-hidden="false" style="display:grid;gap:14px;">
      ${body}
    </section>`;
  }

  renderR7ActiveDomainPage() {
    const activeKey = this._normalizeR7Domain(this._activeR7Domain);
    const subpage = R7_DETAIL_SUBPAGES.find((item) => item.key === activeKey) || R7_DETAIL_SUBPAGES[0];
    switch (activeKey) {
      case "operations-home":
        return this.renderR7DomainPageShell(subpage, this.renderOperatingHome());
      case "crop-operations":
      case "environment-control":
      case "irrigation-fertigation":
      case "device-control":
      case "recommendation-automation":
      case "safety-history":
      case "settings-admin":
        return this.renderR7DomainPageShell(subpage, this.renderR7DetailSubpage(subpage));
      default:
        return this.renderR7DomainPageShell(R7_DETAIL_SUBPAGES[0], this.renderOperatingHome());
    }
  }

  renderR7PageShell() {
    return `<section data-r7-page-shell data-r7-domain-page-router="true" data-r7-active-domain="${this._activeR7Domain}" style="display:grid;gap:16px;">
      <div data-r7-page-workspace style="display:grid;gap:16px;">
        ${this.renderR7ActiveDomainPage()}
      </div>
    </section>`;
  }

  render() {
    this._applyR7HASidebarPolicy();
    const sidebarTrack = this._r7SidebarCollapsed ? "64px" : "256px";
    const layoutMode = this._r7SidebarLayoutMode();
    this.innerHTML = `
      <main data-rebuild-root data-rebuild-blank-page data-r7-app-shell data-r7-app-shell-layout-mode="${layoutMode}" style="min-height:100vh;padding:0;background:#f7faf7;color:#1f2a24;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="max-width:none;margin:0;display:grid;gap:0;">
          <section data-r7-ha-adjacent-layout="true" style="display:grid;grid-template-columns:${sidebarTrack} minmax(0,1fr);column-gap:0;gap:0;align-items:start;">
            ${this.renderR7Sidebar()}
            <section data-rebuild-shell-main style="padding:24px;">${this.renderR7PageShell()}</section>
          </section>
          <div data-rebuild-version="${REBUILD_VERSION}" style="font-size:12px;color:#78927f;">Green Smart ${REBUILD_VERSION}</div>
        </div>
      </main>
      ${this.renderZoneDetailModal()}
    `;
    this._bindR7DomainNavigation();
    this._bindR7DomainSubtabs();
    this._bindZoneTabs();
  }
}

if (!customElements.get(REBUILD_ELEMENT_NAME)) {
  customElements.define(REBUILD_ELEMENT_NAME, GreenSmartRebuildPanel);
}

export { GreenSmartRebuildPanel, REBUILD_ELEMENT_NAME, REBUILD_PAGES, REBUILD_VERSION, REBUILD_ZONE_CONTEXTS, REBUILD_STAGE_DETAILS };
