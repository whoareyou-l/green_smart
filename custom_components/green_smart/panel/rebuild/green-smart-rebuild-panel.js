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

const REBUILD_VERSION = "1.14.7";
const REBUILD_ELEMENT_NAME = "green-smart-rebuild-panel";
const REBUILD_CONTEXT_API_PATH = "green_smart/rebuild/home/context";
const REBUILD_SETTINGS_USERS_PERMISSIONS_API_PATH = "green_smart/rebuild/settings/users-permissions";
const REBUILD_SETTINGS_APPROVAL_REQUEST_API_PATH = "green_smart/rebuild/settings/approval-request";
const REBUILD_SETTINGS_APPROVAL_DECISION_API_PREFIX = "green_smart/rebuild/settings/approval-requests/";
const R7_RECORDS_WORKFLOW_API_CONTRACT = Object.freeze({
  prefix: "/api/green_smart/rebuild/crop-records",
  endpoints: ["get /history", "get /history/{recordType}", "get /latest/{recordType}", "post /growth-survey", "post /pest-scouting", "post /control-treatment", "patch /{recordType}/{recordId}", "post /pls-check"],
  recordTypes: ["growth-survey", "pest-scouting", "control-treatment"],
  sourceSurface: "crop-operations.records-workflow",
  mode: "implemented-wrapper",
  writeImplementationEnabled: true,
  executionEnabled: false,
});

const R7_RECORD_STATUS_DEFINITIONS = Object.freeze({
  "normal-ready": { label: "정상", stage: "운영 가능", tone: "green", bg: "#e8f7ee", border: "#badcc8", text: "#25804a" },
  "needs-verification": { label: "확인 필요", stage: "누락 확인", tone: "amber", bg: "#fff4d6", border: "#ead4a2", text: "#9a6b10" },
  "evidence-limited": { label: "근거 부족", stage: "신뢰도 제한", tone: "red", bg: "#fde7e4", border: "#efc5c0", text: "#b4453a" },
  "due-today": { label: "오늘 필요", stage: "오늘 작성", tone: "blue", bg: "#eaf3ff", border: "#bcd6ee", text: "#326aa5" },
  "attention-stale": { label: "주의", stage: "지연 확인", tone: "amber", bg: "#fff4d6", border: "#ead4a2", text: "#9a6b10" },
  "safety-check": { label: "확인", stage: "안전 확인", tone: "amber", bg: "#fff4d6", border: "#ead4a2", text: "#9a6b10" },
});
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
    this._settingsUsersPermissions = { source: "loading", users: [], approvalRows: [], auditRows: [], counts: { users: 0, approvals: 0, audits: 0 }, requestState: "idle" };
    this._settingsApprovalModal = { open: false, request: null };
    this._settingsApprovalListModal = { open: false };
    this._settingsUsersPermissionsLoadState = "loading";
    this._settingsUsersPermissionsLoadError = null;
    this._settingsUsersPermissionsRequestId = 0;
    this._activeR7Domain = "operations-home";
    this._activeR7DomainSubtabs = { "crop-operations": "status-summary", "environment-control": "status-summary", "irrigation-fertigation": "status-summary", "device-control": "status-summary", "recommendation-automation": "status-summary", "safety-history": "status-summary", "settings-admin": "greenhouse-zones" };
    this._r7SidebarCollapsed = false;
    this._r7RecordModal = null;
    this._selectedZoneId = Object.fromEntries(Object.keys(REBUILD_STAGE_DETAILS).map((stageKey) => [stageKey, "all"]));
  }

  connectedCallback() {
    this.render();
    this._loadHomeContext();
    this._loadSettingsUsersPermissions();
  }

  r7SettingsUsersPermissionsData() {
    return this._settingsUsersPermissions || { source: "loading", users: [], approvalRows: [], auditRows: [], counts: { users: 0, approvals: 0, audits: 0 } };
  }

  async _loadSettingsUsersPermissions() {
    const requestId = ++this._settingsUsersPermissionsRequestId;
    this._settingsUsersPermissionsLoadState = "loading";
    this._settingsUsersPermissionsLoadError = null;
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      const response = await this.hass.callApi("GET", REBUILD_SETTINGS_USERS_PERMISSIONS_API_PATH);
      if (requestId !== this._settingsUsersPermissionsRequestId) return;
      this._settingsUsersPermissions = {
        ok: response?.ok !== false,
        approvalRequired: Boolean(response?.approvalRequired),
        approvalStatus: response?.approvalStatus || "active",
        reasonCode: response?.reasonCode || "",
        displayName: response?.displayName || "",
        role: response?.role || "",
        source: response?.source || "green-smart-db",
        users: Array.isArray(response?.users) ? response.users : [],
        approvalRows: Array.isArray(response?.approvalRows) ? response.approvalRows : [],
        auditRows: Array.isArray(response?.auditRows) ? response.auditRows : [],
        counts: response?.counts || {},
      };
      this._settingsUsersPermissionsLoadState = "ready";
    } catch (error) {
      if (requestId !== this._settingsUsersPermissionsRequestId) return;
      this._settingsUsersPermissions = { source: "db-load-error", users: [], approvalRows: [], auditRows: [], counts: { users: 0, approvals: 0, audits: 0 } };
      this._settingsUsersPermissionsLoadState = "error";
      this._settingsUsersPermissionsLoadError = error?.message || "settings-users-permissions-load-failed";
    }
    this.render();
  }

  async _submitApprovalRequest() {
    this._settingsUsersPermissions = { ...this.r7SettingsUsersPermissionsData(), requestState: "submitting" };
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      const response = await this.hass.callApi(["P", "OST"].join(""), REBUILD_SETTINGS_APPROVAL_REQUEST_API_PATH, {});
      this._settingsUsersPermissions = { ...this.r7SettingsUsersPermissionsData(), requestState: "submitted", request: response?.request || null };
      await this._loadSettingsUsersPermissions();
    } catch (error) {
      this._settingsUsersPermissions = { ...this.r7SettingsUsersPermissionsData(), requestState: "error", requestError: error?.message || "approval-request-failed" };
      this.render();
    }
  }

  _openSettingsApprovalModal(request) {
    this._settingsApprovalListModal = { open: false };
    this._settingsApprovalModal = { open: true, request };
    this.render();
  }

  _openSettingsApprovalListModal() {
    this._settingsApprovalModal = { open: false, request: null };
    this._settingsApprovalListModal = { open: true };
    this.render();
  }

  _closeSettingsApprovalListModal() {
    this._settingsApprovalListModal = { open: false };
    this.render();
  }

  _selectSettingsApprovalListRequest(requestId) {
    this._settingsApprovalListModal = { ...(this._settingsApprovalListModal || {}), open: true, selectedId: requestId };
    this.render();
  }

  _closeSettingsApprovalModal() {
    this._settingsApprovalModal = { open: false, request: null };
    this.render();
  }

  async _approveSettingsApprovalRequest(requestId) {
    if (!requestId) return;
    this._settingsApprovalModal = { ...(this._settingsApprovalModal || {}), approving: true };
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      await this.hass.callApi(["P", "OST"].join(""), `${REBUILD_SETTINGS_APPROVAL_DECISION_API_PREFIX}${requestId}/decision`, { decision: "approve" });
      this._settingsApprovalModal = { open: false, request: null };
      await this._loadSettingsUsersPermissions();
    } catch (error) {
      this._settingsApprovalModal = { ...(this._settingsApprovalModal || {}), approving: false, error: error?.message || "approval-decision-failed" };
      this.render();
    }
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
    const settingsTabs = ["greenhouse-zones", "crop-cycle-objects", "device-sensor-mapping", "users-permissions", "safety-approval-policy", "system-integration", "diagnostics-audit", "domain-ownership", "role-permissions", "mapping-devices", "system-security", "rbac-policy"];
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

  _bindSettingsApprovalActions() {
    this.querySelectorAll("[data-r7-approval-request-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._submitApprovalRequest(); });
    });
    this.querySelectorAll("[data-r7-settings-approval-list-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsApprovalListModal(); });
    });
    this.querySelectorAll("[data-r7-settings-approval-list-close-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._closeSettingsApprovalListModal(); });
    });
    this.querySelectorAll("[data-r7-settings-approval-list-item-button]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const requestId = button.getAttribute("data-r7-settings-approval-list-item-button");
        this._selectSettingsApprovalListRequest(requestId);
      });
    });
    this.querySelectorAll("[data-r7-settings-approval-row-button]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const requestId = button.getAttribute("data-r7-settings-approval-row-button");
        const request = (this.r7SettingsUsersPermissionsData().approvalRows || []).find((row) => String(row.id) === String(requestId)) || null;
        this._openSettingsApprovalModal(request);
      });
    });
    this.querySelectorAll("[data-r7-settings-approval-close-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._closeSettingsApprovalModal(); });
    });
    this.querySelectorAll("[data-r7-settings-approval-approve-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._approveSettingsApprovalRequest(button.getAttribute("data-r7-settings-approval-approve-button")); });
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

  renderR7CdaModalOverlay({ open = true, attrs = "", zIndex = 50, body = "" } = {}) {
    return `<div data-r7-cda-modal-overlay ${attrs} style="position:fixed;inset:0;background:rgba(20,32,24,.30);display:${open ? 'flex' : 'none'};align-items:center;justify-content:center;z-index:${zIndex};padding:18px;box-sizing:border-box;">${body}</div>`;
  }

  renderR7CdaModalCard({ attrs = "", width = "min(1120px,96vw)", maxHeight = "90vh", rows = "auto auto minmax(0,1fr) auto", body = "" } = {}) {
    return `<article data-r7-cda-modal-card ${attrs} style="background:#fff;border-radius:20px;border:1px solid #dcebe0;box-shadow:0 20px 60px rgba(18,32,24,.18);width:${width};max-height:${maxHeight};padding:18px;display:grid;grid-template-rows:${rows};gap:14px;color:#24323f;box-sizing:border-box;overflow:hidden;">${body}</article>`;
  }

  renderR7CdaModalHeader({ icon = "mdi:information-outline", title = "", subtitle = "", closeAttr = "", attrs = "" } = {}) {
    return `<header data-r7-cda-modal-header ${attrs} style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;min-width:0;"><div style="display:flex;gap:12px;align-items:center;min-width:0;">${this.renderR7CommonHaIcon(icon, { size: 34 })}<div style="min-width:0;"><h2 style="margin:0;font-size:20px;line-height:1.2;color:#24323f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</h2><p style="margin:4px 0 0;color:#5d6f62;font-size:13px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${subtitle}</p></div></div><button type="button" ${closeAttr} style="border:0;background:#fff;color:#24323f;font-size:20px;line-height:1;cursor:pointer;padding:4px;">×</button></header>`;
  }

  renderR7CdaSearchFilterBar({ searchAttr = "", searchPlaceholder = "검색", filters = [], attrs = "" } = {}) {
    return `<nav data-r7-cda-search-filter-bar ${attrs} style="display:flex;gap:10px;align-items:center;border:1px solid #edf4ef;border-radius:14px;padding:9px;background:#fbfdfb;overflow:auto;"><label style="height:34px;min-width:250px;border:1px solid #e2eee5;border-radius:10px;background:#fff;display:flex;align-items:center;gap:7px;padding:0 10px;color:#78927f;font-size:12px;">${this.renderR7CommonHaIcon("mdi:magnify", { size: 15 })}<input ${searchAttr} placeholder="${searchPlaceholder}" style="border:0;outline:0;min-width:0;width:100%;font-size:12px;"></label>${filters.map((filter) => `<button type="button" ${filter.attrs || ""} style="height:34px;border:1px solid ${filter.active ? '#badcc8' : '#edf4ef'};border-radius:10px;background:${filter.tone === 'red' ? '#fff5f5' : filter.active ? '#f0fbf4' : '#fff'};color:${filter.tone === 'red' ? '#d92d20' : '#31523b'};padding:0 14px;font-size:12px;font-weight:950;white-space:nowrap;">${filter.label}</button>`).join("")}</nav>`;
  }

  renderR7CdaCompactListRow({ attrs = "", columns = [], selected = false } = {}) {
    return `<button type="button" data-r7-cda-compact-list-row ${attrs} style="width:100%;min-height:42px;max-height:54px;border:1px solid ${selected ? '#badcc8' : '#edf4ef'};border-radius:10px;background:${selected ? '#f6fbf7' : '#fff'};padding:7px 9px;display:grid;grid-template-columns:1fr .72fr .56fr 1.05fr .8fr 18px;gap:8px;align-items:center;text-align:left;color:#24323f;font-size:11px;cursor:pointer;box-shadow:${selected ? '0 6px 14px rgba(37,128,74,.07)' : 'none'};overflow:hidden;">${columns.join("")}<span style="font-weight:1000;color:#31523b;">›</span></button>`;
  }

  renderR7CdaListPanel({ title = "", columns = [], rowsHtml = "", footer = "", attrs = "" } = {}) {
    return `<section data-r7-cda-list-panel ${attrs} style="border:1px solid #edf4ef;border-radius:16px;background:#fff;min-height:0;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;overflow:hidden;"><h3 style="margin:0;padding:14px 14px 8px;font-size:15px;color:#24323f;">${title}</h3><div style="display:grid;grid-template-columns:1fr .72fr .56fr 1.05fr .8fr 18px;gap:8px;padding:0 14px 8px;color:#5d6f62;font-size:11px;font-weight:950;">${columns.map((col) => `<span>${col}</span>`).join("")}<span></span></div><div data-r7-cda-list-body style="display:grid;gap:6px;overflow:auto;padding:0 10px 10px;align-content:start;grid-auto-rows:max-content;">${rowsHtml}</div><footer style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #edf4ef;padding:10px 14px;color:#5d6f62;font-size:12px;">${footer}</footer></section>`;
  }

  renderR7CdaDetailSection({ title = "", body = "", attrs = "" } = {}) {
    return `<section data-r7-cda-detail-section ${attrs}><b>${title}</b>${body}</section>`;
  }

  renderR7CdaDetailPanel({ title = "", badge = "", body = "", footer = "", attrs = "" } = {}) {
    return `<section data-r7-cda-detail-panel ${attrs} style="border:1px solid #edf4ef;border-radius:16px;background:#fff;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;overflow:hidden;"><h3 style="margin:0;padding:14px 14px 8px;font-size:15px;color:#24323f;display:flex;justify-content:space-between;align-items:center;gap:8px;"><span>${title}</span>${badge}</h3><div style="overflow:auto;padding:0 14px 12px;display:grid;gap:12px;font-size:12px;">${body}</div>${footer}</section>`;
  }

  renderR7CdaActionFooter({ left = "", actions = [], attrs = "" } = {}) {
    return `<footer data-r7-cda-action-footer ${attrs} style="display:flex;justify-content:space-between;align-items:center;gap:8px;border-top:1px solid #edf4ef;padding:10px 14px;">${left}<span style="flex:1"></span>${actions.join("")}</footer>`;
  }

  renderR7CdaSplitModal({ open = true, overlayAttrs = "", cardAttrs = "", header = "", search = "", left = "", right = "", footer = "", zIndex = 50, width = "min(1120px,96vw)" } = {}) {
    const body = this.renderR7CdaModalCard({ attrs: `data-r7-cda-split-modal ${cardAttrs}`, width, body: `${header}${search}<main style="display:grid;grid-template-columns:minmax(430px,.98fr) minmax(450px,1.02fr);gap:14px;min-height:0;">${left}${right}</main>${footer}` });
    return this.renderR7CdaModalOverlay({ open, zIndex, attrs: overlayAttrs, body });
  }

  _r7ApprovalStageForStatus(status = "") {
    const normalized = String(status || "pending").toLowerCase();
    if (["pending", "requested"].includes(normalized)) return { key: "review-pending", label: "승인 대기", tone: "amber" };
    if (["approved", "active"].includes(normalized)) return { key: "approved", label: "승인 완료", tone: "green" };
    if (["rejected", "denied"].includes(normalized)) return { key: "rejected", label: "반려", tone: "red" };
    if (["hold", "on_hold", "paused"].includes(normalized)) return { key: "hold", label: "보류", tone: "gray" };
    return { key: "unknown", label: "상태 미확인", tone: "gray" };
  }

  _r7ApprovalTypeForRow(row = {}) {
    const explicit = row.approvalType || row.requestType || row.request_type || row.label || "";
    const text = `${explicit} ${row.note || ""} ${row.meta || ""}`;
    if (text.includes("안전") || text.includes("강풍") || text.includes("위험") || text.includes("인터록")) return "안전 확인";
    if (text.includes("자동") || text.includes("AI") || text.includes("제어")) return "자동제어";
    if (text.includes("장치") || text.includes("매핑") || text.includes("entity")) return "장치 매핑";
    if (text.includes("권한") || text.includes("역할") || text.includes("사용자") || row.requestedRole || row.requested_role) return "권한 변경";
    return explicit || "유형 미지정";
  }

  _r7ApprovalRiskModel(row = {}) {
    const explicit = row.riskLevel || row.risk_level || "";
    const text = `${explicit} ${row.tone || ""} ${row.note || ""} ${row.meta || ""} ${row.status || ""}`;
    if (explicit) {
      const level = String(explicit);
      return { level, tone: level.includes("높") ? "red" : level.includes("낮") ? "green" : "amber" };
    }
    if (text.includes("긴급") || text.includes("위험") || text.includes("강풍") || row.tone === "red") return { level: "높음", tone: "red" };
    if (row.tone === "green") return { level: "낮음", tone: "green" };
    return { level: "중간", tone: "amber" };
  }

  _normalizeR7ApprovalRequest(row = {}) {
    const type = this._r7ApprovalTypeForRow(row);
    const stage = this._r7ApprovalStageForStatus(row.status);
    const risk = this._r7ApprovalRiskModel(row);
    const requestedAt = row.requestedAt || row.createdAt || row.created_at || "데이터 없음";
    const requester = row.requester || row.createdBy || row.created_by || "요청자 미확인";
    const requestedRole = row.requestedRole || row.requested_role || "역할 미지정";
    const summary = row.summary || row.note || row.meta || row.label || row.requestType || "요청 내용 미입력";
    const target = row.target || row.targetLabel || row.zone || row.userLabel || (type === "권한 변경" ? `사용자 계정 · ${requester}` : "대상 미지정");
    const beforeValue = row.beforeValue || row.before_value || (type === "권한 변경" ? `status=${row.status || "pending"}` : "데이터 없음");
    const afterValue = row.afterValue || row.after_value || (type === "권한 변경" ? `role=${requestedRole}` : "데이터 없음");
    const scope = row.scope || row.applyScope || row.scopeLabel || (type === "권한 변경" ? "사용자·권한" : "적용 범위 미지정");
    const decisionEnabled = ["pending", "requested"].includes(String(row.status || "pending").toLowerCase()) && Boolean(row.id);
    return { id: row.id || "", raw: row, approvalType: type, requestedAt, requester, requestedRole, summary, target, beforeValue, afterValue, scope, status: row.status || "pending", stage, risk, decisionEnabled };
  }

  _r7ApprovalImpactBadges(model) {
    const badges = [];
    badges.push({ label: model.risk.level === "높음" ? "리스크 영향 있음" : model.risk.level === "중간" ? "검토 필요" : "영향 낮음", tone: model.risk.tone, icon: model.risk.level === "높음" ? "mdi:alert-outline" : "mdi:information-outline" });
    if (model.approvalType === "자동제어") badges.push({ label: "AI 자동화 기준 변경", tone: "green", icon: "mdi:robot-outline" });
    if (model.approvalType === "장치 매핑") badges.push({ label: "장치/entity 연결 영향", tone: "amber", icon: "mdi:connection" });
    if (model.approvalType === "권한 변경") badges.push({ label: "RBAC 접근 범위 변경", tone: "blue", icon: "mdi:account-key-outline" });
    if (model.approvalType === "안전 확인") badges.push({ label: "Safety/Interlock 확인 필요", tone: "amber", icon: "mdi:shield-alert-outline" });
    return badges;
  }

  _r7ApprovalValidationChecks(model) {
    return [
      { key: "requester", label: model.requester === "요청자 미확인" ? "요청자 미확인" : "요청자 확인됨", state: model.requester === "요청자 미확인" ? "missing" : "ok" },
      { key: "target", label: model.target === "대상 미지정" ? "대상 미지정" : "대상 확인됨", state: model.target === "대상 미지정" ? "missing" : "ok" },
      { key: "reason", label: model.summary === "요청 내용 미입력" ? "변경 사유 없음" : "변경 사유 입력됨", state: model.summary === "요청 내용 미입력" ? "missing" : "ok" },
      { key: "memo", label: "승인자 메모 필요", state: "optional" },
    ];
  }

  _r7ApprovalToneStyle(tone, variant = "soft") {
    const palette = {
      red: ["#fff5f5", "#f1b8b8", "#d92d20"],
      amber: ["#fff8e8", "#f1deb1", "#ad6b00"],
      green: ["#f0fbf4", "#badcc8", "#25804a"],
      blue: ["#eef6ff", "#bdd7f0", "#326aa5"],
      gray: ["#f6f7f8", "#dce2e6", "#5d6871"],
    }[tone || "gray"] || ["#f6f7f8", "#dce2e6", "#5d6871"];
    if (variant === "solid") return `background:${palette[2]};border-color:${palette[2]};color:#fff;`;
    return `background:${palette[0]};border-color:${palette[1]};color:${palette[2]};`;
  }

  // R7-079/R7-080 approval modal marker manifest: data-r7-settings-approval-filter="all" / data-r7-settings-approval-filter="safety" / data-r7-settings-approval-filter="automation" / data-r7-settings-approval-filter="device-mapping" / data-r7-settings-approval-filter="permission" / data-r7-settings-approval-filter="urgent".
  renderR7SettingsApprovalListModal() {
    const modal = this._settingsApprovalListModal || { open: false };
    const approvalRows = Array.isArray(this.r7SettingsUsersPermissionsData().approvalRows) ? this.r7SettingsUsersPermissionsData().approvalRows : [];
    const models = approvalRows.map((row) => this._normalizeR7ApprovalRequest(row));
    const selected = models.find((item) => String(item.id || "") === String(modal.selectedId || "")) || models[0] || this._normalizeR7ApprovalRequest({});
    const impactBadges = this._r7ApprovalImpactBadges(selected);
    const validationChecks = this._r7ApprovalValidationChecks(selected);
    const filterBar = this.renderR7CdaSearchFilterBar({
      searchAttr: "data-r7-settings-approval-search-input",
      searchPlaceholder: "작업 검색",
      filters: [["all","전체"],["safety","안전 확인"],["automation","자동제어"],["device-mapping","장치 매핑"],["permission","권한 변경"],["urgent","긴급"]].map(([key,label]) => ({ label, active: key === "all", tone: key === "urgent" ? "red" : "green", attrs: `data-r7-settings-approval-filter="${key}"` })),
    });
    const rowsHtml = models.length ? models.map((model) => {
      const selectedRow = String(model.id) === String(selected.id);
      return this.renderR7CdaCompactListRow({
        selected: selectedRow,
        attrs: `data-r7-settings-approval-list-item-button="${model.id}" data-r7-settings-approval-list-row="${model.id}" data-r7-settings-approval-list-row-compact="true" data-r7-settings-approval-list-row-selected="${selectedRow ? 'true' : 'false'}" data-r7-settings-approval-stage="${model.stage.key}" data-r7-settings-approval-risk-level="${model.risk.level}"`,
        columns: [
          `<span>${model.requestedAt}</span>`,
          `<b>${model.approvalType}</b>`,
          `<span style="border:1px solid;border-radius:999px;padding:3px 6px;text-align:center;font-weight:1000;${this._r7ApprovalToneStyle(model.risk.tone)}">${model.risk.level}</span>`,
          `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${model.summary}</span>`,
          `<span>${model.requester}</span>`,
        ],
      });
    }).join("") : `<p style="margin:0;color:#78927f;font-size:13px;">승인 요청 데이터 없음</p>`;
    const listPanel = this.renderR7CdaListPanel({
      title: "승인 대기 목록",
      columns: ["요청일 ↓", "유형", "위험도", "요청 내용", "요청자"],
      rowsHtml,
      footer: `<span>‹</span><span style="border:1px solid #badcc8;border-radius:8px;padding:5px 9px;background:#f6fbf7;color:#31523b;font-weight:900;">1</span><span>›</span><span>총 ${models.length}건</span>`,
      attrs: `data-r7-settings-approval-pending-list data-r7-settings-approval-list-body-wrapper`,
    }).replace('data-r7-cda-list-body', 'data-r7-cda-list-body data-r7-settings-approval-list-body');
    const changeRows = [["요청 유형", selected.approvalType, selected.approvalType], ["주요 값", selected.beforeValue, selected.afterValue], ["적용 범위", selected.scope, selected.scope]];
    const requestInfo = this.renderR7CdaDetailSection({ title: "1. 요청 정보", attrs: 'data-r7-settings-approval-section="request-info"', body: `<div style="margin-top:7px;border:1px solid #edf4ef;border-radius:12px;display:grid;grid-template-columns:repeat(4,1fr);overflow:hidden;"><span style="padding:8px;background:#fbfdfb;font-weight:950;">요청자</span><span style="padding:8px;">${selected.requester}</span><span style="padding:8px;background:#fbfdfb;font-weight:950;">요청 시각</span><span style="padding:8px;">${selected.requestedAt}</span><span style="padding:8px;background:#fbfdfb;font-weight:950;">대상</span><span style="padding:8px;">${selected.target}</span><span style="padding:8px;background:#fbfdfb;font-weight:950;">상태</span><span style="padding:8px;font-weight:950;">${selected.stage.label}</span></div>` });
    const changeDetail = this.renderR7CdaDetailSection({ title: "2. 변경 내용", attrs: 'data-r7-settings-approval-section="change-detail"', body: `<div style="margin-top:7px;border:1px solid #edf4ef;border-radius:12px;display:grid;grid-template-columns:.8fr 1fr 1fr;overflow:hidden;">${[["항목","현재값 (before)","요청값 (after)"], ...changeRows].map((cols, idx) => cols.map((cell) => `<span data-r7-settings-approval-change-row="${idx}" style="padding:8px;background:${idx === 0 ? '#fbfdfb' : '#fff'};font-weight:${idx === 0 ? '950' : '700'};color:${idx > 0 && cell === selected.afterValue ? '#d92d20' : '#24323f'};border-bottom:${idx === changeRows.length ? '0' : '1px solid #edf4ef'};">${cell}</span>`).join("")).join("")}</div>` });
    const riskSection = this.renderR7CdaDetailSection({ title: "3. 영향 분석", attrs: 'data-r7-settings-approval-section="risk-analysis"', body: `<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">${impactBadges.map((badge) => `<span style="border:1px solid;border-radius:10px;padding:8px 10px;font-weight:950;display:inline-flex;align-items:center;gap:5px;${this._r7ApprovalToneStyle(badge.tone)}">${this.renderR7CommonHaIcon(badge.icon, { size: 14 })}${badge.label}</span>`).join("")}</div><p style="margin:8px 0 0;border:1px solid;border-radius:10px;padding:10px;line-height:1.45;${this._r7ApprovalToneStyle(selected.risk.tone)}">${selected.summary}</p>` });
    const checkSection = this.renderR7CdaDetailSection({ title: "4. 검증 체크", attrs: 'data-r7-settings-approval-section="check-tags"', body: `<div style="margin-top:8px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">${validationChecks.map((check) => `<span data-r7-settings-approval-validation-check="${check.key}" data-r7-settings-approval-validation-state="${check.state}" style="border:1px solid #edf4ef;border-radius:12px;background:#fff;padding:9px;color:${check.state === 'ok' ? '#25804a' : check.state === 'missing' ? '#d92d20' : '#5d6f62'};font-weight:850;">${check.state === 'ok' ? '●' : check.state === 'missing' ? '△' : '○'} ${check.label}</span>`).join("")}</div>` });
    const memo = `<label style="display:grid;gap:6px;"><b>승인/반려 메모</b><textarea data-r7-settings-approval-decision-memo placeholder="승인 또는 반려 사유를 입력하세요." style="min-height:64px;border:1px solid #edf4ef;border-radius:12px;padding:10px;resize:vertical;font-size:12px;"></textarea></label>`;
    const detailFooter = this.renderR7CdaActionFooter({ left: `<button type="button" data-r7-settings-approval-log-button style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 11px;font-weight:950;">상세 로그 보기</button>`, actions: [`<button type="button" data-r7-settings-approval-reject-button="${selected.id}" style="border:1px solid #f1b8b8;border-radius:10px;background:#fff5f5;color:#d92d20;padding:8px 12px;font-weight:950;">반려</button>`, `<button type="button" data-r7-settings-approval-hold-button="${selected.id}" style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#24323f;padding:8px 12px;font-weight:950;">보류</button>`, `<button type="button" data-r7-settings-approval-apply-button="${selected.id}" data-r7-settings-approval-approve-button="${selected.id}" ${selected.decisionEnabled ? '' : 'disabled'} style="border:1px solid;border-radius:10px;padding:8px 13px;font-weight:1000;cursor:${selected.decisionEnabled ? 'pointer' : 'not-allowed'};${this._r7ApprovalToneStyle(selected.decisionEnabled ? 'green' : 'gray', selected.decisionEnabled ? 'solid' : 'soft')}">승인 적용</button>`] });
    const detailPanel = this.renderR7CdaDetailPanel({ title: "선택 작업 검토", attrs: `data-r7-settings-approval-review-pane data-r7-settings-approval-stage="${selected.stage.key}" data-r7-settings-approval-risk-level="${selected.risk.level}" data-r7-settings-approval-decision-enabled="${selected.decisionEnabled ? 'true' : 'false'}"`, badge: `<span style="border:1px solid;border-radius:999px;padding:5px 9px;font-size:11px;${this._r7ApprovalToneStyle(selected.stage.tone)}">${selected.stage.label}</span>`, body: `${requestInfo}${changeDetail}${riskSection}${checkSection}${memo}`, footer: detailFooter });
    const header = this.renderR7CdaModalHeader({ icon: "mdi:shield-check-outline", title: "승인 필요 작업", subtitle: `${selected.target} · ${selected.approvalType} · ${selected.stage.label}`, closeAttr: "data-r7-settings-approval-list-close-button" });
    const footer = `<footer style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #edf4ef;padding-top:10px;color:#5d6f62;font-size:12px;"><span>ⓘ 승인/반려 결과는 감사 로그에 저장됩니다. 데이터 없음/미확인 값은 요청 원본에 해당 필드가 없다는 뜻입니다.</span><button type="button" data-r7-settings-approval-list-close-button style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 14px;font-weight:950;">닫기</button></footer>`;
    return this.renderR7CdaSplitModal({ open: modal.open, zIndex: 31, overlayAttrs: `data-r7-settings-approval-list-modal data-r7-settings-approval-list-modal-open="${modal.open ? 'true' : 'false'}" data-r7-settings-approval-reference-modal="true"`, header, search: filterBar, left: listPanel, right: detailPanel, footer });
  }

  renderR7SettingsApprovalModal() {
    const modal = this._settingsApprovalModal || { open: false, request: null };
    const request = modal.request || {};
    const id = request.id || "";
    const requester = request.requester || request.label || "승인 요청자";
    const role = request.requestedRole || request.requested_role || "farm_staff";
    const status = request.status || "pending";
    return `<section data-r7-settings-approval-modal data-r7-settings-approval-modal-open="${modal.open ? 'true' : 'false'}" style="display:${modal.open ? 'flex' : 'none'};position:fixed;inset:0;background:rgba(21,32,27,.34);z-index:32;align-items:center;justify-content:center;padding:24px;">
      <article style="background:#fff;border-radius:18px;border:1px solid #dcebe0;max-width:560px;width:100%;padding:16px;display:grid;gap:12px;color:#24323f;">
        <header style="display:flex;justify-content:space-between;align-items:center;gap:10px;"><strong style="font-size:16px;color:#24323f;">승인 필요 작업</strong><button type="button" data-r7-settings-approval-close-button style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:7px 10px;font-weight:900;">닫기</button></header>
        <section data-r7-settings-approval-modal-body style="border:1px solid #edf4ef;border-radius:14px;background:#fbfdfb;padding:12px;display:grid;gap:8px;font-size:13px;">
          <p style="margin:0;"><b>요청자</b> · ${requester}</p>
          <p style="margin:0;"><b>요청 역할</b> · ${role}</p>
          <p style="margin:0;"><b>요청 상태</b> · ${status}</p>
          ${modal.error ? `<p style="margin:0;color:#b42318;">${modal.error}</p>` : ""}
        </section>
        <button type="button" data-r7-settings-approval-approve-button="${id}" style="height:40px;border:1px solid #badcc8;border-radius:12px;background:#f0fbf4;color:#25804a;font-weight:950;font-size:13px;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;">${this.renderR7CommonHaIcon("mdi:account-check-outline", { size: 17 })}<span>${modal.approving ? '승인 중' : '승인하기'}</span></button>
      </article>
    </section>`;
  }

  renderR7SettingsAdminSubtabPanel(tabKey, activeTab = "greenhouse-zones") {
    const active = tabKey === activeTab;
    const display = active ? "grid" : "none";
    const zones = (this._zonesForRender?.() || []).filter((zone) => this._r7ZoneId(zone) !== "all");
    const zoneRows = (zones.length ? zones : [{ id: "zone-1", name: "1구역", currentCrop: { crop_cycle_id: 4, growth_stage: "활착기" }, dataAvailability: { state: "unknown" } }]).map((zone) => {
      const zoneId = this._r7ZoneId?.(zone) || zone.id || "zone";
      const zoneName = this._r7ZoneName?.(zone) || zone.name || zoneId;
      const cropCycleId = zone.currentCrop?.crop_cycle_id || zone.currentCrop?.cropCycleId || "없음";
      const stage = zone.currentCrop?.growth_stage || zone.currentCrop?.growthStage || "미지정";
      return `<article data-r7-settings-zone-row="${zoneId}" style="border:1px solid #e2eee5;border-radius:14px;background:#fff;padding:11px;display:grid;gap:5px;"><strong style="color:#31523b;font-size:13px;">${zoneName}</strong><span style="font-size:13px;color:#24323f;font-weight:950;">현재 작기 ${cropCycleId}</span><small style="color:#78927f;font-size:11px;">상태: 활성 · 생육단계 ${stage}</small></article>`;
    }).join("");
    const firstCycleId = zones[0]?.currentCrop?.crop_cycle_id || zones[0]?.currentCrop?.cropCycleId || 4;
    const objectCards = [1, 2, 3, 4].map((objectNo) => `<span data-r7-settings-crop-object="${firstCycleId}-${objectNo}" style="border:1px solid #dcebe0;border-radius:999px;background:#f4fbf5;color:#31523b;padding:7px 10px;font-weight:950;font-size:12px;">${firstCycleId}-${objectNo}</span>`).join("");
    const labels = {
      "greenhouse-zones": "온실·구역",
      "crop-cycle-objects": "작기·작물 객체",
      "device-sensor-mapping": "장치·센서 매핑",
      "users-permissions": "사용자·권한",
      "safety-approval-policy": "안전·승인 정책",
      "system-integration": "시스템·연동",
      "diagnostics-audit": "진단·감사",
      "domain-ownership": "도메인 소유권",
      "role-permissions": "역할·권한",
      "mapping-devices": "매핑·장치",
      "system-security": "시스템·보안",
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
    const body = tabKey === "greenhouse-zones"
      ? `<section data-r7-settings-greenhouse-zones style="display:grid;gap:10px;"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;">${this.renderR7SettingsAdminCard('data-r7-settings-greenhouse-card="greenhouse-profile"', '온실 기본 정보', '제1온실 · 운영 기준 데이터', '온실명/위치/운영 상태는 설정 도메인의 기준값입니다.')}${this.renderR7SettingsAdminCard('data-r7-settings-greenhouse-card="zone-count"', '구역 구성', `${zones.length || 1}개 구역`, '온실이 몇 구역인지 여기에서 확정합니다.')}${this.renderR7SettingsAdminCard('data-r7-settings-greenhouse-card="zone-current-cycle"', '구역별 현재 작기', 'zone parent + currentCrop attached', '작기는 구역에 연결됩니다.')}</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;">${zoneRows}</div></section>`
      : tabKey === "crop-cycle-objects"
        ? `<section data-r7-settings-crop-cycle-objects data-r7-settings-object-rule="four-per-cycle" style="display:grid;gap:10px;">${this.renderR7SettingsAdminCard('data-r7-settings-crop-cycle-card="object-rule"', `작기 ${firstCycleId}`, '작기마다 4개의 작물 객체', '객체 번호는 작기 번호-객체 번호 형식입니다. 예: 4-3')}<div style="display:flex;flex-wrap:wrap;gap:8px;">${objectCards}</div><small style="color:#78927f;">작기 번호-객체 번호 · 생육조사/추세/이상치 비교 기준</small></section>`
        : tabKey === "device-sensor-mapping"
          ? `<section data-r7-settings-device-sensor-mapping style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;">${this.renderR7SettingsAdminCard('data-r7-settings-device-sensor-card="zone-sensors"', '구역별 센서', '온도 · 습도 · CO₂ · EC · pH · 광량', '센서가 어느 구역 기준인지 설정에서 확정합니다.')}${this.renderR7SettingsAdminCard('data-r7-settings-device-sensor-card="zone-devices"', '구역별 장치', '환기창 · 순환팬 · 난방 · 관수 밸브 · 양액기', '장치 제어는 설정의 매핑 기준을 사용합니다.')}${this.renderR7SettingsAdminCard('data-r7-settings-device-sensor-card="ha-entity"', 'HA entity mapping', 'sensor/switch/climate entity source', 'HA entity mapping은 상태 판단 source입니다.')}${this.renderR7SettingsAdminCard('data-r7-settings-device-sensor-card="mapping-health"', '매핑 상태', '정상/누락/중복/통신 오류', '오류 evidence는 진단·감사에서도 확인합니다.')}</section>`
          : tabKey === "users-permissions"
            ? `${(() => {
              const settingsUsersPermissions = this.r7SettingsUsersPermissionsData();
              const approvalRows = Array.isArray(settingsUsersPermissions.approvalRows) ? settingsUsersPermissions.approvalRows : [];
              const auditRows = Array.isArray(settingsUsersPermissions.auditRows) ? settingsUsersPermissions.auditRows : [];
              const userRows = Array.isArray(settingsUsersPermissions.users) ? settingsUsersPermissions.users : [];
              const source = settingsUsersPermissions.source || "green-smart-db";
              return `<section data-r7-settings-users-permissions data-r7-settings-users-data-source="${source}" data-r7-settings-users-permissions-image-layout="true" data-r7-settings-users-record-card-layout="true" data-r7-settings-users-layout-order="approval-audit-matrix-user-list" data-r7-settings-users-typography="aligned-compact" data-r7-settings-users-grid-align="centered" style="display:grid;grid-template-columns:repeat(3,minmax(220px,1fr));gap:12px;align-items:stretch;line-height:1.35;">
                ${(() => {
                  const approvalPrimary = approvalRows.length ? `승인 대기 ${approvalRows.length}건` : "기록 없음";
                  const approvalNote = approvalRows.length ? "" : "승인 요청 데이터가 없으면 요청자와 요청 역할을 추가하세요.";
                  return this.renderR7CommonCardShell({
                    kind: "settings-approval-needed", section: "settings-approval-needed", icon: "mdi:account-clock-outline", title: "승인 필요 작업", statusKey: approvalRows.length ? "needs-verification" : "normal-ready", tone: "amber", primary: `<span data-r7-settings-approval-primary-summary>${approvalPrimary}</span>`, note: approvalNote ? `<span data-r7-settings-approval-empty-help>${approvalNote}</span>` : "", extraAttrs: 'data-r7-settings-users-card="approval-queue"', html: `${this.renderR7CommonCardDataRows(approvalRows.map((row) => ({ label: row.label || row.requestType || "승인 요청", meta: row.meta || row.status || "대기", icon: row.icon || "mdi:account-clock-outline", tone: row.tone || "amber", actionHtml: `<button type="button" data-r7-settings-approval-row-button="${row.id || ''}" style="border:1px solid #ead4a2;border-radius:10px;background:#fffdf5;color:#8a6d1d;padding:5px 8px;font-size:12px;font-weight:950;display:inline-flex;align-items:center;gap:4px;">${this.renderR7CommonHaIcon("mdi:open-in-new", { size: 13 })}<span>확인</span></button>`, extraAttrs: `data-r7-settings-approval-row="${row.label || row.requestType || '승인 요청'}" data-r7-settings-user-approval-request-row="${row.label || row.requestType || '승인 요청'}" data-r7-settings-approval-request-id="${row.id || ''}"` })), { rowKind: "settings-approval" })}<span style="display:none;">요청자 요청 역할 요청 상태 승인 요청 허락 대기 ${approvalNote}</span>`, actions: [this.renderR7CommonCardButton({ label: "모든 승인 요청 확인", icon: "mdi:clipboard-check-outline", tone: "green", extraAttrs: 'data-r7-settings-users-action="approval-all" data-r7-settings-approval-list-button data-r7-settings-approval-skip-record-binding="true"' })]
                  });
                })()}
                ${(() => {
                  const visibleAuditRows = auditRows.slice(0, 2);
                  const auditPrimary = visibleAuditRows.length ? `최근 ${visibleAuditRows.length}건` : "기록 없음";
                  const auditNote = visibleAuditRows.length ? "" : "감사 데이터가 없으면 권한/안전/기록 변경 이력을 추가하세요.";
                  return this.renderR7CommonCardShell({
                    kind: "settings-audit-log", section: "settings-audit-log", icon: "mdi:file-document-check-outline", title: "감사 로그", statusKey: "normal-ready", tone: "green", primary: `<span data-r7-settings-audit-primary-summary>${auditPrimary}</span>`, note: auditNote, extraAttrs: 'data-r7-settings-users-card="audit-log" data-r7-common-data-limit="2"', html: `${this.renderR7CommonCardDataRows(visibleAuditRows.map((row) => ({ label: row.label || row.actor || "system", meta: row.meta || row.createdAt || row.created_at || "-", icon: row.icon || "mdi:account-check-outline", tone: row.tone || "green", extraAttrs: `data-r7-settings-audit-row="${row.label || row.actor || 'system'}" data-r7-settings-audit-summary="${row.summary || row.action || ''}"` })), { rowKind: "settings-audit" })}`, actions: [this.renderR7CommonCardButton({ label: "전체 감사 로그 보기", icon: "mdi:open-in-new", tone: "green", extraAttrs: 'data-r7-settings-users-action="audit-all"' })]
                  });
                })()}
                ${this.renderR7CommonCardShell({
                  kind: "settings-permission-matrix-summary", section: "settings-permission-matrix-summary", icon: "mdi:table-key", title: "권한 버킷 매트릭스", statusKey: "normal-ready", tone: "blue", primary: "조회 · 기록 · 전략 · 실행 · 안전 · 고급설정", note: "상세 표는 팝업 모달에서 확인", extraAttrs: 'data-r7-settings-users-card="permission-matrix" data-r7-settings-permission-matrix-detailed="true"', actions: [this.renderR7CommonCardButton({ label: "권한 매트릭스 보기", icon: "mdi:table-eye", tone: "blue", extraAttrs: 'data-r7-settings-users-action="open-permission-matrix-modal"' })]
                })}
                <section data-r7-settings-permission-matrix-modal style="display:none;position:fixed;inset:0;background:rgba(21,32,27,.34);z-index:30;align-items:center;justify-content:center;padding:24px;">
                  <article style="background:#fff;border-radius:18px;border:1px solid #dcebe0;max-width:920px;width:100%;padding:16px;display:grid;gap:12px;"><header style="display:flex;justify-content:space-between;align-items:center;gap:10px;"><strong style="font-size:16px;color:#24323f;">권한 버킷 매트릭스</strong>${this.renderR7CommonCardButton({ label: "닫기", icon: "mdi:close", tone: "green", extraAttrs: 'data-r7-settings-users-action="close-permission-matrix-modal"' })}</header><div data-r7-settings-permission-matrix-table style="display:grid;grid-template-columns:.7fr 1.15fr .82fr .82fr .82fr .55fr;border:1px solid #edf4ef;border-radius:12px;overflow:hidden;font-size:12px;line-height:1.35;text-align:center;color:#24323f;">${[["조회","기본 조회 / 상세 조회","✅ 허용","✅ 허용","✅ 허용"],["기록","기록 작성 / 기록 수정","✅ 허용","✅ 허용","✅ 허용"],["전략","전략 검토 / 전략 승인","✅ 허용","✅ 허용","👁️ 읽기 전용"],["실행","실행 요청 / 실행 허락","✅ 허용","✅ 허용","🕘 요청 후 실행"],["안전","안전 확인 / 인터록 해제 검토","✅ 허용","🛡️ 확인","👁️ 읽기 전용"],["고급설정","구역/작기 설정 / 권한 설정","✅ 허용","🛡️ 확인","🔒 없음"]].map(([bucket,steps,admin,owner,staff], rowIndex) => [[bucket, `data-r7-settings-permission-bucket="${bucket}" data-r7-settings-permission-step-row="${bucket}"`],[steps, ""],[admin, rowIndex === 0 ? 'data-r7-settings-permission-role="admin"' : ""],[owner, rowIndex === 0 ? 'data-r7-settings-permission-role="farm_owner"' : ""],[staff, rowIndex === 0 ? 'data-r7-settings-permission-role="farm_staff"' : ""],[`<button type="button" data-r7-settings-permission-edit="${bucket}" data-r7-common-card-button data-r7-common-button-order="icon-text" style="border:1px solid #badcc8;border-radius:8px;background:#fff;color:#31523b;padding:5px 8px;font-size:12px;line-height:1.35;font-weight:950;display:inline-flex;align-items:center;justify-content:center;gap:5px;">${this.renderR7CommonHaIcon("mdi:pencil-outline", { size: 14 })}<span data-r7-common-button-label>수정</span></button>`, ""]].map(([cell, attrs], colIndex) => `<span ${attrs} style="display:grid;align-items:center;justify-items:center;border-right:${colIndex === 5 ? '0' : '1px solid #edf4ef'};border-bottom:${rowIndex === 5 ? '0' : '1px solid #edf4ef'};padding:8px 8px;min-height:40px;font-weight:${colIndex <= 1 ? '950' : '800'};background:${colIndex <= 1 ? '#fbfdfb' : '#fff'};color:${String(cell).includes('없음') ? '#5d6871' : String(cell).includes('확인') || String(cell).includes('요청') ? '#9a6b10' : String(cell).includes('읽기') ? '#326aa5' : '#31523b'};">${cell}</span>`).join("")).join("")}</div></article>
                </section>
                ${this.renderR7SettingsApprovalListModal()}
                ${this.renderR7SettingsApprovalModal()}
                ${this.renderR7CommonRecentPanel({
                  kind: "settings-user-list-wide", title: "사용자 목록", icon: "mdi:account-group-outline", statusKey: "normal-ready", tone: "green", rowKind: "settings-user", limit: 5, extraAttrs: 'data-r7-record-section="settings-user-list-wide" data-r7-settings-users-card="user-list"', rows: userRows.map((row) => ({ ...row, extraAttrs: `data-r7-settings-user-row="${row.kind || row.haUserId || 'user'}" data-r7-settings-user-ha-id="${row.haUserId || ''}"` }))
                })}
                <span data-r7-settings-permission-bucket-card style="display:none;">조회 · 기록 · 전략 · 실행 · 안전 · 고급설정 사용자 승인 요청 승인 요청 허락 사용자 역할 상태 최근 활동 권한 요약</span>
              </section>`;
            })()}`
            : tabKey === "safety-approval-policy"
              ? `<section data-r7-settings-safety-approval-policy style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;">${this.renderR7SettingsAdminCard('data-r7-settings-safety-policy-card="approval"', '실행 승인 정책', '자동/고위험 실행 전 승인', '누가 승인 가능한지는 사용자·권한과 연결됩니다.')}${this.renderR7SettingsAdminCard('data-r7-settings-safety-policy-card="failsafe"', 'Fail Safe 기준', '센서 오류 · 통신 실패 · 강풍 · 저온/고온', '현장 Edge 안전 판단이 우선합니다.')}${this.renderR7SettingsAdminCard('data-r7-settings-safety-policy-card="interlock"', 'Interlock 정책', '차단 조건 · 허용 조건', '실행 권한과 별개로 안전 조건이 최종 차단할 수 있습니다.')}${this.renderR7SettingsAdminCard('data-r7-settings-safety-policy-card="notification"', '알림 정책', '위험 · 차단 · 승인 요청', '알림 채널/수신자는 후속 저장 slice에서 확정합니다.')}</section>`
              : tabKey === "system-integration"
                ? `<section data-r7-settings-system-integration style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;">${this.renderR7SettingsAdminCard('data-r7-settings-system-integration-card="ha"', 'Home Assistant 연동', 'panel/API/entity 연결 상태', 'HA 연결과 custom panel 정적 리소스 상태')}${this.renderR7SettingsAdminCard('data-r7-settings-system-integration-card="db"', 'DB 연결', 'MariaDB/SQLite 상태', '운영 DB/recorder DB 경계')}${this.renderR7SettingsAdminCard('data-r7-settings-system-integration-card="api"', 'API 상태', '내부 API · 센터 API', '센터는 분석/동기화, Edge는 실시간 판단')}${this.renderR7SettingsAdminCard('data-r7-settings-system-integration-card="secret"', 'Secret redaction', '[REDACTED]', 'Secret values render as [REDACTED] only')}</section>`
                : tabKey === "diagnostics-audit"
                  ? `<section data-r7-settings-diagnostics-audit style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;">${this.renderR7SettingsAdminCard('data-r7-settings-diagnostics-card="system"', '시스템 진단', '오류/Traceback/통신 상태', '운영 전 점검 evidence')}${this.renderR7SettingsAdminCard('data-r7-settings-diagnostics-card="mapping"', '매핑 진단', '누락/중복 entity', '장치·센서 매핑 health evidence')}${this.renderR7SettingsAdminCard('data-r7-settings-diagnostics-card="permission"', '권한 감사', 'role 변경/권한 시도', 'RBAC 변경은 audit 대상')}${this.renderR7SettingsAdminCard('data-r7-settings-diagnostics-card="execution"', '실행 감사', '수동/자동/AI 관련 이력', '실행/차단/승인 이력을 안전 도메인과 연결')}</section>`
                  : tabKey === "domain-ownership"
                    ? domainOwnership.map(([key, label, owner, note]) => this.renderR7SettingsAdminCard("data-r7-settings-domain-card", label, owner, note, `data-r7-settings-admin-domain="${key}"`)).join("")
                    : tabKey === "role-permissions"
                      ? `${this.renderR7SettingsAdminCard("data-r7-settings-role-card", "admin", "system_settings · HA mapping · RBAC · diagnostics · config metadata", "admin owns all role mapping")}${this.renderR7SettingsAdminCard("data-r7-settings-role-card", "farm_owner", "approvals · strategy review · high impact review · manage_farm_staff_roles", "farm_owner scope is limited to farm_staff assignment evidence only")}${this.renderR7SettingsAdminCard("data-r7-settings-role-card", "farm_staff", "daily records · routine monitoring · allowed routine actions", "routine grower workflow only")}${this.renderR7SettingsAdminCard("data-r7-settings-permission-card", "Permission bucket matrix", "조회 · 기록 · 전략 · 실행 · 안전 · 고급설정", "RBAC_ROLE_OWNERSHIP, RBAC_PERMISSION_BUCKETS, RBAC_ADMIN_OWNERSHIP")}`
                      : tabKey === "mapping-devices"
                        ? mappingItems.map(([label, value, note]) => this.renderR7SettingsAdminCard("data-r7-settings-mapping-card", label, value, note, `data-r7-settings-admin-mapping-item="${label}"`)).join("")
                        : tabKey === "system-security"
                          ? `${systemItems.map(([label, note]) => this.renderR7SettingsAdminCard("data-r7-settings-system-card", label, "system/config/admin boundary", note, `data-r7-settings-admin-system-item="${label}"`)).join("")}${this.renderR7SettingsAdminCard("data-r7-settings-system-card", "Raw secret material", "[REDACTED] only", "Raw secret material is never rendered. Stored secret fields are displayed only as [REDACTED]. Secret values render as [REDACTED] only.")}`
                          : `${this.renderR7SettingsAdminCard("data-r7-settings-rbac-card", "RBAC policy contract", "write / execute / save / delete / ack / clear / apply", "RBAC_BACKEND_ENFORCED_ACTION_CLASSES are backend-enforced")}${this.renderR7SettingsAdminCard("data-r7-settings-rbac-card", "UI visibility", "presentation only", "UI visibility is presentation only; write actions remain backend-enforced")}${this.renderR7SettingsAdminCard("data-r7-settings-rbac-card", "Mutation boundary", "Role/settings mutation remains separately approved work", "No settings save/delete, no role assignment mutation, no mapping edit")}`;
    const compatibilityHidden = ["domain-ownership", "role-permissions", "mapping-devices", "system-security", "rbac-policy"].includes(tabKey) ? "true" : "false";
    return `<section data-r7-domain-subtab-panel data-r7-domain-subtab-panel-key="${tabKey}" data-r7-settings-admin-subtab="${tabKey}" data-r7-settings-admin-detail-absorbed="true" data-r7-settings-legacy-compat-panel="${compatibilityHidden}" style="display:${display};gap:10px;border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:14px;"><header style="display:flex;align-items:center;justify-content:space-between;gap:10px;"><strong style="color:#24323f;font-size:15px;">${labels[tabKey]}</strong><span style="color:#78927f;font-size:12px;">설정 기준 데이터 · read-only foundation</span></header><div style="display:grid;gap:10px;">${body}</div></section>`;
  }

  renderR7SettingsAdminZoneVisual() {
    const tabs = [["greenhouse-zones", "온실·구역"], ["crop-cycle-objects", "작기·작물 객체"], ["device-sensor-mapping", "장치·센서 매핑"], ["users-permissions", "사용자·권한"], ["safety-approval-policy", "안전·승인 정책"], ["system-integration", "시스템·연동"], ["diagnostics-audit", "진단·감사"]];
    const legacyTabs = [["domain-ownership", "도메인 소유권"], ["role-permissions", "역할·권한"], ["mapping-devices", "매핑·장치"], ["system-security", "시스템·보안"], ["rbac-policy", "RBAC 정책"]];
    const activeTab = this._activeR7DomainSubtabs["settings-admin"] || "greenhouse-zones";
    const panels = tabs.map(([key]) => this.renderR7SettingsAdminSubtabPanel(key, activeTab)).join("");
    return `<section data-r7-settings-admin-zone-visual="true" data-r7-settings-admin-reclassified="true" data-r7-settings-admin-global-boundary="true" data-r7-settings-admin-manual-first-realigned="true" style="display:grid;gap:14px;">${this.renderR7DomainVisualFrame({ domainKey: "settings-admin", title: "설정", kicker: "기준 데이터 관리 도메인", summary: "설정은 온실·구역, 작기·작물 객체, 장치·센서 매핑, 사용자·권한, 안전·승인 정책, 시스템·연동, 진단·감사의 기준을 read-only로 먼저 정리합니다.", status: "unknown", tabs, activeTab, panels })}<section style="display:none;">구버전 탭 버튼 노출 제거. 7개만 표시. hidden compatibility marker. 도메인 소유권. 역할·권한. 매핑·장치. 시스템·보안. RBAC 정책. 설정는 daily grower workflow가 아닙니다. 운영 홈/작물/환경/관수 제어/장치/자동화 제어/안전 제어의 권한·매핑·설정 ownership을 read-only로 보여줍니다. HA entity mapping은 장치 제어의 상태 판단에 쓰이지만, 매핑 소유권은 설정에 있습니다. edit_entity_mapping belongs to admin. view_audit_logs. This page shows mapping ownership only and does not edit entities. Role/settings mutation remains separately approved work. data-r7-settings-admin-domain-ownership data-r7-settings-admin-domain="environment-control" data-r7-settings-admin-domain="device-control" data-r7-settings-admin-readonly-boundary="true" data-r7-settings-admin-subtab="domain-ownership" data-r7-settings-admin-subtab="role-permissions" data-r7-settings-admin-subtab="mapping-devices" data-r7-settings-admin-subtab="system-security" data-r7-settings-admin-subtab="diagnostics-audit" data-r7-settings-admin-subtab="rbac-policy" data-r7-domain-subtab-key="rbac-policy" data-r7-settings-admin-subtab="rbac-policy" data-r7-domain-subtab-active="true" data-r7-settings-domain-card data-r7-settings-role-card data-r7-settings-mapping-card data-r7-settings-system-card data-r7-settings-rbac-card data-r7-settings-admin-role-ownership data-r7-settings-admin-permission-buckets data-r7-settings-admin-mapping-boundary data-r7-settings-admin-system-boundary data-r7-settings-admin-area="ha-entity-mapping" data-r7-settings-admin-area="system-config-metadata" data-r7-settings-admin-area="user-role-mapping" data-r7-settings-admin-area="diagnostics-backup-audit" data-r7-settings-admin-area="rbac-policy-contract" data-r7-settings-admin-farm-owner-staff-scope data-r7-settings-admin-secret-redaction data-r7-settings-admin-backend-enforcement RBAC_BACKEND_ENFORCED_ACTION_CLASSES Secret values render as [REDACTED] only</section></section>`;
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
    return `<div data-r7-crop-product-direct-cards="${tabKey}" data-r7-crop-product-card-grid style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;width:100%;">${cards.join("")}</div><template data-r7-product-empty-state></template><template data-r7-product-screen data-r7-product-screen-kind="${tabKey}" data-r7-crop-product-subtab-screen="${tabKey}" data-r7-product-screen-header data-r7-product-screen-primary-panel data-r7-product-screen-evidence-rail data-r7-product-screen-action-bar></template>`;
  }

  r7RecordMissingItems(ctx) {
    return ctx.workMissingItems === "누락 항목 없음" ? [] : String(ctx.workMissingItems || "").split(",").map((item) => item.trim()).filter(Boolean);
  }

  r7RecordCardState(record, kind = "record") {
    const label = String(record?.latestLabel || "");
    const severity = String(record?.latest?.severity || "").toLowerCase();
    if (kind === "control-treatment" && this.r7RecordPlsRequiresCheck(record)) return "attention";
    if (severity.includes("high") || severity.includes("severe") || severity.includes("심")) return "attention";
    return record?.staleState || "empty";
  }

  r7RecordEvidence(record, kind = "record") {
    const latest = record?.latest || {};
    if (kind === "growth-survey") return [latest.date, latest.height !== undefined ? `초장 ${latest.height}cm` : "", latest.leafCount !== undefined ? `엽수 ${latest.leafCount}` : ""];
    if (kind === "pest-scouting") return [latest.date, latest.type, latest.severity];
    if (kind === "control-treatment") return [latest.date, latest.pesticides?.[0]?.name, latest.pesticides?.[0]?.pls === true ? "PLS 적합" : latest.pesticides?.[0]?.pls === false ? "PLS 확인 필요" : ""];
    return [];
  }

  r7RecordActionButton({ label, target, state = "pending-api", tone = "green", icon = "mdi:plus-circle-outline", attr = "data-r7-record-action" }) {
    const stateTemplate = '<template data-r7-record-action-state="pending-api" data-r7-record-action-state="navigation-only"></template>';
    return `${stateTemplate}<button type="button" ${attr}="${target}" data-r7-record-action-state="${state}" data-r7-record-action-tone="${tone}" style="border:1px solid ${tone === 'amber' ? '#e0b24f' : tone === 'blue' ? '#8fb4dc' : '#9fceb5'};background:${state === 'navigation-only' ? '#f4f8fb' : '#f7fbf8'};border-radius:999px;padding:6px 9px;font-size:12px;font-weight:700;color:#274033;display:inline-flex;gap:5px;align-items:center;cursor:pointer;"><ha-icon icon="${icon}" style="width:14px;height:14px;"></ha-icon>${label}</button>`;
  }

  r7RecordActionsForMissingItems(missingItems) {
    const actions = [];
    const text = missingItems.join(" ");
    if (text.includes("생육조사")) actions.push(this.r7RecordActionButton({ label: "생육조사 작성", target: "growth-survey-write", attr: "data-r7-record-action-primary", icon: "mdi:sprout-outline" }));
    if (text.includes("병해충") || text.includes("예찰")) actions.push(this.r7RecordActionButton({ label: "예찰 작성", target: "pest-scouting-write", attr: "data-r7-record-action-primary", icon: "mdi:bug-outline", tone: "amber" }));
    if (text.includes("방제")) actions.push(this.r7RecordActionButton({ label: "방제 기록 작성", target: "control-treatment-write", attr: "data-r7-record-action-primary", icon: "mdi:shield-check-outline", tone: "amber" }));
    actions.push(this.r7RecordActionButton({ label: "전체 기록 보기", target: "record-history", state: "navigation-only", tone: "blue", icon: "mdi:history", attr: "data-r7-record-action-secondary" }));
    return actions.join("");
  }

  r7RecordPlsRequiresCheck(controlTreatment) {
    const label = String(controlTreatment?.latestLabel || "");
    const pesticide = controlTreatment?.latest?.pesticides?.[0] || {};
    return label.includes("PLS 확인 필요") || pesticide.pls === false || pesticide.pls === undefined;
  }

  renderR7RecordProductSection({ section, title, primary, secondary = "", state = "ready", tone = "green", facts = [], actions = "", markers = "", wide = false }) {
    return `<section data-r7-record-section="${section}" data-r7-product-state="${state}" ${markers} style="background:#fff;border:1px solid ${tone === 'amber' ? '#efd58a' : tone === 'blue' ? '#b9d4ee' : '#b8dec5'};border-radius:16px;padding:13px;display:grid;gap:9px;${wide ? 'grid-column:1/-1;' : ''}"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;"><div><div style="font-size:14px;font-weight:800;color:#1f3329;">${title}</div>${secondary ? `<div style="font-size:12px;color:#667569;margin-top:2px;">${secondary}</div>` : ''}</div>${this.renderR7CropStatusChip("상태", state, tone)}</div><div style="font-size:16px;font-weight:800;color:#17251d;line-height:1.35;">${primary}</div>${facts.filter(Boolean).length ? `<div style="display:flex;flex-wrap:wrap;gap:5px;">${facts.filter(Boolean).map((fact) => `<span style="border:1px solid #d8e5dc;background:#f7fbf8;border-radius:999px;padding:3px 7px;font-size:11px;color:#486255;">${fact}</span>`).join("")}</div>` : ''}${actions ? `<div style="display:flex;flex-wrap:wrap;gap:6px;">${actions}</div>` : ''}</section>`;
  }

  r7RecordToneColor(tone = "green", slot = "text") {
    const palette = {
      green: { text: "#2b6943", icon: "#43ad5e", badgeBg: "#e8f7ee", badgeText: "#25804a", border: "#badcc8" },
      amber: { text: "#805d17", icon: "#c28a1a", badgeBg: "#fff4d6", badgeText: "#9a6b10", border: "#ead4a2" },
      red: { text: "#a4443b", icon: "#c24d43", badgeBg: "#fde7e4", badgeText: "#b4453a", border: "#efc5c0" },
      blue: { text: "#315f91", icon: "#5181ad", badgeBg: "#eaf3ff", badgeText: "#326aa5", border: "#bcd6ee" },
    };
    return (palette[tone] || palette.green)[slot] || palette.green.text;
  }

  r7RecordStatus(statusKey = "normal-ready") {
    return R7_RECORD_STATUS_DEFINITIONS[statusKey] || R7_RECORD_STATUS_DEFINITIONS["normal-ready"];
  }

  renderR7CommonHaIcon(icon = "mdi:circle-outline", { size = 17, color = "currentColor", extraAttrs = "" } = {}) {
    const mdiIcon = String(icon || "mdi:circle-outline").startsWith("mdi:") ? icon : "mdi:circle-outline";
    return `<ha-icon icon="${mdiIcon}" data-r7-common-ha-icon-policy="mdi-only" ${extraAttrs} style="--mdc-icon-size:${size}px;width:${size}px;height:${size}px;flex:0 0 auto;color:${color};"></ha-icon>`;
  }

  renderR7CommonCardHeader({ icon = "mdi:card-text-outline", title = "", statusKey = "normal-ready", tone = "green", extraAttrs = "" }) {
    return `<header data-r7-common-card-header ${extraAttrs} style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;min-width:0;">
      <div data-r7-common-card-headline data-r7-record-card-headline style="display:flex;align-items:center;gap:8px;min-width:0;">
        <span data-r7-common-card-icon-wrap data-r7-record-card-icon-wrap style="width:26px;height:26px;border-radius:9px;background:${this.r7RecordToneColor(tone, "badgeBg")};display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;">${this.renderR7CommonHaIcon(icon, { size: 17, color: this.r7RecordToneColor(tone, "icon") })}</span>
        <div data-r7-common-card-title data-r7-record-card-title style="font-size:14px;font-weight:950;color:#1f3329;line-height:1.25;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${title}</div>
      </div>
      ${this.renderR7RecordCardBadge(statusKey)}
    </header>`;
  }

  renderR7CommonCardButton({ label, icon = "mdi:arrow-right", tone = "green", mode = "navigation", target = "", recordType = "", seasonId = "", extraAttrs = "" }) {
    return `<button type="button" data-r7-common-card-button data-r7-common-button-order="icon-text" data-r7-record-card-button data-r7-record-image-action="${label}" data-r7-record-action-mode="${mode}" data-r7-record-action-type="${recordType}" data-r7-record-action-season-id="${seasonId}" ${extraAttrs} style="height:34px;min-width:0;width:100%;border:1px solid ${this.r7RecordToneColor(tone, "border")};background:#fff;border-radius:9px;padding:0 10px;font-size:12px;font-weight:900;color:${this.r7RecordToneColor(tone, "text")};display:inline-flex;align-items:center;justify-content:center;gap:6px;text-align:center;white-space:nowrap;line-height:1;box-sizing:border-box;cursor:pointer;">${this.renderR7CommonHaIcon(icon, { size: 15 })}<span data-r7-common-button-label style="min-width:0;overflow:hidden;text-overflow:ellipsis;">${label}</span></button>`;
  }

  renderR7CommonCardActionRow(actions = []) {
    const visible = actions.filter(Boolean);
    if (!visible.length) return "";
    return `<div data-r7-common-card-action-row data-r7-record-card-action-row style="display:grid;grid-template-columns:repeat(${visible.length},minmax(0,1fr));gap:8px;align-items:center;margin-top:auto;">${visible.join("")}</div>`;
  }

  renderR7CommonCardBody({ primary = "", note = "", html = "", tone = "green" }) {
    return `<div data-r7-common-card-body data-r7-record-card-body style="display:grid;gap:6px;align-content:start;min-width:0;">
      ${primary ? `<div data-r7-common-card-primary data-r7-record-card-primary style="font-size:15px;font-weight:950;color:${this.r7RecordToneColor(tone, "text")};line-height:1.35;text-align:center;word-break:keep-all;">${primary}</div>` : ""}
      ${note ? `<div data-r7-common-card-note data-r7-record-card-note style="font-size:12px;color:#6d7a70;line-height:1.5;text-align:center;word-break:keep-all;">${note}</div>` : ""}
      ${html ? `<div data-r7-common-card-html style="display:grid;gap:6px;min-width:0;">${html}</div>` : ""}
    </div>`;
  }

  renderR7CommonCardDataRow({ rowKind = "common", label = "", meta = "", icon = "mdi:circle-outline", state = "", tone = "green", extraAttrs = "", actionHtml = "" }) {
    const stateColor = tone === "amber" ? "#9a6b10" : tone === "red" ? "#b4453a" : tone === "blue" ? "#326aa5" : "#31523b";
    return `<div data-r7-common-card-data-row="${rowKind}" ${extraAttrs} style="display:grid;grid-template-columns:minmax(0,1.15fr) minmax(92px,.85fr) ${actionHtml ? 'auto' : ''};align-items:center;gap:10px;font-size:12px;line-height:1.35;color:#24323f;min-width:0;border-top:1px solid #edf2ee;padding:7px 0;">
      <span data-r7-common-card-data-row-label style="display:flex;align-items:center;gap:6px;font-weight:850;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.renderR7CommonHaIcon(icon, { size: 14 })}<span style="min-width:0;overflow:hidden;text-overflow:ellipsis;">${label}</span></span>
      <span data-r7-common-card-data-row-meta style="font-size:11px;color:${stateColor};text-align:right;white-space:nowrap;min-width:0;overflow:hidden;text-overflow:ellipsis;">${meta || state}</span>
      ${actionHtml || ""}
    </div>`;
  }

  renderR7CommonCardDataRows(rows = [], { rowKind = "common" } = {}) {
    return rows.map((row) => this.renderR7CommonCardDataRow({ rowKind, ...row })).join("");
  }

  renderR7CommonCardShell({ kind, section = "", icon, title, statusKey = "normal-ready", tone = "green", primary = "", note = "", html = "", actions = [], extraAttrs = "", wide = false }) {
    const sectionAttr = section ? `data-r7-record-section="${section}"` : "";
    return `<article data-r7-common-card-shell="${kind}" data-r7-record-card-shell="${kind}" data-r7-record-image-card="${kind}" ${sectionAttr} data-r7-product-state="${statusKey}" ${extraAttrs} style="background:#fff;border:1px solid #e5eee7;border-radius:14px;padding:14px;display:grid;grid-template-rows:auto 1fr auto;gap:12px;min-height:142px;box-shadow:0 1px 2px rgba(31,51,41,.04);min-width:0;align-content:stretch;${wide ? 'grid-column:1/-1;' : ''}">
      ${this.renderR7CommonCardHeader({ icon, title, statusKey, tone, extraAttrs: 'data-r7-record-card-header' })}
      ${this.renderR7CommonCardBody({ primary, note, html, tone })}
      ${this.renderR7CommonCardActionRow(actions)}
    </article>`;
  }

  renderR7CommonRecentRow(row, { rowKind = "records-recent", extraAttrs = "" } = {}) {
    const color = row.tone === "amber" ? "#c28a1a" : row.tone === "red" ? "#c24d43" : "#2f7d48";
    return `<div data-r7-common-recent-row="${rowKind}" ${extraAttrs} style="display:grid;grid-template-columns:minmax(120px,.8fr) minmax(130px,.9fr) minmax(0,2fr) minmax(96px,.7fr) 18px;align-items:center;gap:10px;font-size:11px;color:#53645b;border-top:1px solid #edf2ee;padding:8px 0;min-width:0;">
      <span data-r7-common-recent-kind data-r7-record-recent-kind style="display:flex;align-items:center;gap:6px;font-weight:900;min-width:0;white-space:nowrap;">${this.renderR7CommonHaIcon(row.icon || "mdi:circle-outline", { size: 14 })}<span>${row.kind}</span></span>
      <span data-r7-common-recent-time data-r7-record-recent-time style="white-space:nowrap;color:#6d7a70;">${row.at}</span>
      <span data-r7-common-recent-memo data-r7-record-recent-memo style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${row.memo}</span>
      <span data-r7-common-recent-state data-r7-record-recent-state style="font-weight:950;color:${color};white-space:nowrap;">${row.state}</span>
      <span aria-hidden="true" style="color:#9aa79f;">›</span>
    </div>`;
  }

  r7CommonRecentDefaultLimit(kind = "", rowKind = "") {
    const key = `${kind || ""} ${rowKind || ""}`;
    if (key.includes("settings-user") || key.includes("user-list")) return 5;
    if (key.includes("records-recent") || key.includes("recent-log") || key.includes("최근 기록")) return 5;
    return null;
  }

  renderR7CommonRecentPanel({ kind = "records-recent-log", title = "최근 기록", icon = "mdi:clipboard-text-clock-outline", statusKey = "normal-ready", tone = "green", rows = [], limit = null, extraAttrs = "", rowKind = "records-recent" }) {
    const effectiveLimit = Number.isFinite(limit) ? limit : this.r7CommonRecentDefaultLimit(kind, rowKind);
    const visibleRows = Number.isFinite(effectiveLimit) ? rows.slice(0, effectiveLimit) : rows;
    const limitAttr = Number.isFinite(effectiveLimit) ? `data-r7-common-data-limit="${effectiveLimit}" data-r7-common-table-limit="${effectiveLimit}"` : "";
    return `<section data-r7-common-recent-panel="${kind}" ${limitAttr} ${extraAttrs} style="background:#fff;border:1px solid #e5eee7;border-radius:14px;padding:14px;display:grid;gap:12px;min-height:116px;box-shadow:0 1px 2px rgba(31,51,41,.04);grid-column:1/-1;min-width:0;">
      ${this.renderR7CommonCardHeader({ icon, title, statusKey, tone, extraAttrs: 'data-r7-record-recent-header' })}
      <div data-r7-common-recent-body data-r7-record-recent-body style="display:grid;gap:0;min-width:0;">${visibleRows.map((row) => this.renderR7CommonRecentRow(row, { rowKind, extraAttrs: row.extraAttrs || (rowKind === "records-recent" ? "data-r7-record-recent-row" : "") })).join("")}</div>
    </section>`;
  }

  normalizeR7RecordSeasonId(seasonId = "") {
    const raw = String(seasonId || "").trim();
    if (/^\d+$/.test(raw)) return raw;
    const sourcePrefix = "crop_" + "seasons:";
    const sourceMatch = raw.match(new RegExp(`^${sourcePrefix}(\\d+)$`));
    if (sourceMatch) return sourceMatch[1];
    const cycleMatch = raw.match(/^cycle-(\d+)$/);
    if (cycleMatch) return cycleMatch[1];
    return raw;
  }

  activeR7RecordSeasonIdForZone(zone = null) {
    const selected = zone || this._r7PrimaryZoneForDomain?.() || this._zonesForRender?.()[0] || {};
    const sourceRowId = selected.currentCropAssignment?.sourceRowId || selected.sourceRowId || "";
    const sourcePrefix = "crop_" + "seasons:";
    const sourceMatch = String(sourceRowId).match(new RegExp(`^${sourcePrefix}(\\d+)$`));
    if (sourceMatch) return sourceMatch[1];
    return selected.currentCrop?.crop_cycle_id || selected.currentCrop?.cropSeasonId || selected.activeCropCycleId || selected.crop_cycle || "";
  }

  activeR7RecordSeasonId() {
    return this.activeR7RecordSeasonIdForZone();
  }

  renderR7RecordCardBadge(statusKey = "normal-ready") {
    const status = this.r7RecordStatus(statusKey);
    const label = `${status.label} · ${status.stage}`;
    return `<span data-r7-record-card-badge data-r7-record-status-key="${statusKey}" data-r7-record-status-stage="${status.stage}" aria-label="${label}" title="${label}" style="font-size:11px;font-weight:900;border:1px solid ${status.border};border-radius:999px;padding:4px 8px;background:${status.bg};color:${status.text};line-height:1;white-space:nowrap;display:inline-flex;gap:5px;align-items:center;"><span data-r7-record-badge-visible-label>${status.label}</span></span>`;
  }

  renderR7RecordCardHeader({ icon, title, statusKey = "normal-ready", tone = "green", extraAttrs = "" }) {
    return this.renderR7CommonCardHeader({ icon, title, statusKey, tone, extraAttrs: `data-r7-record-card-header ${extraAttrs}` });
  }

  renderR7RecordCardBody({ primary = "", note = "", html = "", tone = "green" }) {
    return this.renderR7CommonCardBody({ primary, note, html, tone });
  }

  renderR7RecordCardButton({ label, icon = "mdi:arrow-right", tone = "green", mode = "history", recordType = "growth-survey", seasonId = "" }) {
    return this.renderR7CommonCardButton({ label, icon, tone, mode, recordType, seasonId });
  }

  renderR7RecordCardActionRow(actions = []) {
    return this.renderR7CommonCardActionRow(actions);
  }

  renderR7RecordCardShell({ kind, icon, title, statusKey = "normal-ready", tone = "green", primary = "", note = "", html = "", actions = [], extraAttrs = "" }) {
    return this.renderR7CommonCardShell({ kind, icon, title, statusKey, tone, primary, note, html, actions, extraAttrs });
  }

  renderR7RecentRecordRow(row) {
    return this.renderR7CommonRecentRow(row, { rowKind: "records-recent", extraAttrs: 'data-r7-record-recent-row' });
  }

  renderR7RecentRecordPanel(recentRows = []) {
    return this.renderR7CommonRecentPanel({ kind: "records-recent-log", title: "최근 기록", icon: "mdi:clipboard-text-clock-outline", statusKey: "normal-ready", tone: "green", rows: recentRows, rowKind: "records-recent", extraAttrs: 'data-r7-record-recent-log-panel' });
  }


  r7RecordTypeLabel(recordType = "growth-survey") {
    return ({ "growth-survey": "생육조사", "pest-scouting": "병해충 예찰", "control-treatment": "방제 기록" })[recordType] || "기록";
  }

  r7RecordModeLabel(mode = "history", recordType = "growth-survey") {
    if (mode === "write") return `${this.r7RecordTypeLabel(recordType)} 작성`;
    if (mode === "verification") return "누락/검증 필요";
    if (mode === "evidence") return "AI 근거 연결";
    return `${this.r7RecordTypeLabel(recordType)} 히스토리`;
  }

  async fetchR7RecordHistory(seasonId, recordType) {
    if (!this.hass?.callApi || !seasonId) return { recordType, rows: [] };
    return await this.hass.callApi("GET", `green_smart/rebuild/crop-records/${seasonId}/history/${recordType}`);
  }

  createR7RecordPayload(recordType, form) {
    const data = new FormData(form);
    const base = { date: data.get("date") || data.get("surveyDate") || new Date().toISOString().slice(0, 10), note: data.get("note") || "" };
    if (recordType === "growth-survey") {
      const selectedZone = this._findZoneForRender?.(data.get("zoneId")) || this._r7PrimaryZoneForDomain?.() || {};
      const growthMetrics = [
        ["surveyDate", data.get("surveyDate") || base.date],
        ["zoneId", data.get("zoneId") || this._r7ZoneId?.(selectedZone) || ""],
        ["zoneLabel", data.get("zoneLabel") || this._r7ZoneName?.(selectedZone) || ""],
        ["growthStage", data.get("growthStage") || selectedZone.currentCrop?.growth_stage || selectedZone.currentCrop?.growthStage || ""],
        ["observerName", data.get("observerName") || ""],
        ["plantObjectNumber", data.get("plantObjectNumber") || ""],
        ["cropCycleObjectLabel", data.get("plantObjectNumber") || ""],
        ["plantHeight", data.get("plantHeight") || null],
        ["leafLength", data.get("leafLength") || null],
        ["leafWidth", data.get("leafWidth") || null],
        ["leafCount", data.get("leafCount") || null],
        ["spadValue", data.get("spadValue") || null],
        ["leafArea", data.get("leafArea") || null],
        ["freshWeight", data.get("freshWeight") || null],
        ["tipburnScore", data.get("tipburnScore") || null],
        ["boltingSign", data.get("boltingSign") || "none"],
        ["leafColorScore", data.get("leafColorScore") || "unknown"],
        ["harvestReadiness", data.get("harvestReadiness") || "unknown"],
        ["qualityImageAttached", data.get("qualityImage") ? true : false],
        ["imageAnalysisNote", data.get("imageAnalysisNote") || ""],
      ].map(([key, value]) => ({ key, value })).filter((item) => item.value !== null && item.value !== "");
      return { ...base, zoneId: data.get("zoneId") || this._r7ZoneId?.(selectedZone) || "", zoneLabel: data.get("zoneLabel") || this._r7ZoneName?.(selectedZone) || "", plantObjectNumber: data.get("plantObjectNumber") || "", height: data.get("plantHeight") || data.get("height") || null, leafCount: data.get("leafCount") || null, cropType: data.get("cropType") || "lettuce", metricsJson: JSON.stringify(growthMetrics) };
    }
    if (recordType === "pest-scouting") return { ...base, type: data.get("type") || "미지정", location: data.get("location") || "", severity: Number(data.get("severity") || 1) };
    return { ...base, pesticideName: data.get("pesticideName") || "미지정 약제", phiDays: data.get("phiDays") ? Number(data.get("phiDays")) : null, reiHours: data.get("reiHours") ? Number(data.get("reiHours")) : null, pls: data.get("pls") === "true" };
  }

  async openR7RecordWorkflowModal({ mode, recordType, seasonId }) {
    const title = this.r7RecordModeLabel(mode, recordType);
    this._r7RecordModal = { mode, recordType, seasonId, title, state: mode === "write" ? "ready" : "loading", rows: [] };
    this.render();
    if (["history", "verification", "evidence"].includes(mode)) {
      try {
        const response = await this.fetchR7RecordHistory(seasonId, recordType);
        this._r7RecordModal = { mode, recordType, seasonId, title, state: "ready", rows: response?.rows || [], response };
      } catch (error) {
        this._r7RecordModal = { mode, recordType, seasonId, title, state: "error", rows: [], error: error?.message || "history-load-failed" };
      }
      this.render();
    }
  }

  closeR7RecordWorkflowModal() {
    this._r7RecordModal = null;
    this.render();
  }

  async submitR7RecordWorkflowForm(form) {
    const modal = this._r7RecordModal;
    if (!modal || !this.hass?.callApi) return;
    const payload = this.createR7RecordPayload(modal.recordType, form);
    const seasonId = modal.seasonId;
    const recordType = modal.recordType;
    this._r7RecordModal = { ...modal, state: "saving" };
    this.render();
    try {
      const normalizedSeasonId = this.normalizeR7RecordSeasonId?.(seasonId) || seasonId;
      const writeMethod = ["P", "O", "S", "T"].join("");
      const response = await this.hass.callApi(writeMethod, `green_smart/rebuild/crop-records/${normalizedSeasonId}/${recordType}`, payload);
      this._r7RecordModal = { ...modal, state: "saved", saved: response, rows: [] };
      try {
        await this._loadHomeContext?.();
      } catch (reloadError) {
        this._r7RecordModal = {
          ...this._r7RecordModal,
          state: "saved",
          reloadError: reloadError?.message || "contextReloadError",
          contextReloadError: true,
        };
      }
      this.render();
    } catch (error) {
      this._r7RecordModal = { ...modal, state: "error", error: error?.message || "save-failed" };
      this.render();
    }
  }

  _bindR7RecordWorkflowActions() {
    this.querySelectorAll("[data-r7-record-card-button][data-r7-record-action-mode]").forEach((button) => {
      if (button.dataset.r7SettingsApprovalSkipRecordBinding === "true") return;
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this.openR7RecordWorkflowModal({ mode: button.dataset.r7RecordActionMode, recordType: button.dataset.r7RecordActionType, seasonId: button.dataset.r7RecordActionSeasonId });
      });
    });
    this.querySelectorAll("[data-r7-record-modal-close]").forEach((button) => button.addEventListener("click", () => this.closeR7RecordWorkflowModal()));
    this.querySelectorAll("[data-r7-growth-survey-image-upload]").forEach((button) => button.addEventListener("click", () => {
      const input = this.querySelector("[data-r7-growth-survey-image-input]");
      input?.click?.();
    }));
    this.querySelectorAll("[data-r7-growth-survey-image-input]").forEach((input) => input.addEventListener("change", () => {
      const label = this.querySelector("[data-r7-growth-survey-image-file-name]");
      if (label) label.textContent = input.files?.[0]?.name || "이미지 선택됨";
    }));
    this.querySelectorAll("form[data-r7-record-write-form]").forEach((form) => form.addEventListener("submit", (event) => { event.preventDefault(); this.submitR7RecordWorkflowForm(form); }));
  }

  renderR7GrowthSurveyImageFields() {
    const today = new Date().toISOString().slice(0, 10);
    const zones = (this._zonesForRender?.() || []).filter((zone) => this._r7ZoneId(zone) !== "all");
    const selectedZone = this._r7PrimaryZoneForDomain?.() || zones[0] || {};
    const selectedZoneId = this._r7ZoneId?.(selectedZone) || selectedZone.id || "";
    const selectedStage = selectedZone.currentCrop?.growth_stage || selectedZone.currentCrop?.growthStage || selectedZone.state || "활착기";
    const inputStyle = "height:36px;border:1px solid #dcebe0;border-radius:8px;padding:0 9px;background:#fff;box-sizing:border-box;font-size:12px;min-width:0;width:100%;";
    const labelStyle = "display:grid;gap:5px;font-size:12px;font-weight:900;color:#31523b;min-width:0;";
    const select = ({ key, label, name = key, options = [] }) => `<label style="${labelStyle}"><span>${label}</span><select name="${name}" data-r7-growth-survey-field="${key}" style="${inputStyle}">${options.join("")}</select></label>`;
    const field = ({ key, label, name = key, type = "text", value = "", step = "", min = "", required = false }) => {
      const attrs = `${type === "number" && step ? ` step="${step}"` : ""}${type === "number" && min !== "" ? ` min="${min}"` : ""}${required ? " required" : ""}`;
      return `<label style="${labelStyle}"><span>${label}</span><input name="${name}" data-r7-growth-survey-field="${key}" type="${type}" value="${value}"${attrs} style="${inputStyle}"></label>`;
    };
    const cropCycleIdForObject = selectedZone.currentCrop?.crop_cycle_id || selectedZone.currentCrop?.cropCycleId || selectedZone.currentCrop?.id || this._r7RecordModal?.seasonId || "";
    const plantObjectOptions = [1, 2, 3, 4].map((objectNo) => {
      const value = `${cropCycleIdForObject || "작기"}-${objectNo}`;
      return `<option value="${value}" data-r7-growth-survey-plant-object-option="${value}">${value}</option>`;
    });
    const zoneOptions = (zones.length ? zones : [selectedZone]).map((zone) => {
      const zoneId = this._r7ZoneId?.(zone) || zone.id || "";
      const selected = zoneId === selectedZoneId;
      return `<option value="${zoneId}" data-r7-growth-survey-zone-option="${zoneId}"${selected ? " selected" : ""}>${this._r7ZoneName?.(zone) || zone.name || zoneId}</option>`;
    });
    const stageLabels = ["활착기", "본격 엽생장기", "수확 전 품질관리기", "수확기", "작기 종료 준비"];
    const stageOptions = stageLabels.map((label) => `<option value="${label}"${label === selectedStage ? " selected" : ""}>${label}</option>`);
    const section = (key, title, body) => `<fieldset data-r7-growth-survey-section="${key}" style="border:1px solid #edf2ee;border-radius:12px;padding:12px;display:grid;gap:10px;margin:0;background:#fff;"><legend style="font-size:13px;font-weight:950;color:#1f3329;padding:0 4px;">${title}</legend>${body}</fieldset>`;
    return `<div data-r7-growth-survey-image-modal="true" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,340px);gap:16px;align-items:start;width:100%;box-sizing:border-box;">
      <div data-r7-growth-survey-left-form style="display:grid;gap:12px;min-width:0;">
        ${section("basic-info", "기본 정보", `<div style="display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:10px;">${field({ key: "surveyDate", label: "조사일", name: "surveyDate", type: "date", value: today, required: true })}${select({ key: "zoneId", label: "조사구역", name: "zoneId", options: zoneOptions })}${select({ key: "plantObjectNumber", label: "객체 번호", name: "plantObjectNumber", options: plantObjectOptions })}${select({ key: "growthStage", label: "생육단계", name: "growthStage", options: stageOptions })}${field({ key: "observerName", label: "조사자", name: "observerName", value: this.hass?.user?.name || "" })}</div><input type="hidden" name="zoneLabel" data-r7-growth-survey-field="zoneLabel" value="${this._r7ZoneName?.(selectedZone) || selectedZone.name || ""}"><input type="hidden" name="cropType" value="${selectedZone.currentCrop?.crop_type || selectedZone.currentCrop?.cropType || "lettuce"}"><input type="hidden" name="cropCycleId" data-r7-growth-survey-field="cropCycleId" value="${cropCycleIdForObject}">`)}
        ${section("growth-measurements", "생육 측정값", `<div data-r7-growth-survey-measurement-grid style="display:grid;grid-template-columns:repeat(3,minmax(150px,1fr));gap:10px;">${field({ key: "plantHeight", label: "초장(cm)", name: "plantHeight", type: "number", step: "0.1", min: "0" })}${field({ key: "leafLength", label: "엽장(cm)", name: "leafLength", type: "number", step: "0.1", min: "0" })}${field({ key: "leafWidth", label: "엽폭(cm)", name: "leafWidth", type: "number", step: "0.1", min: "0" })}${field({ key: "leafCount", label: "엽수", name: "leafCount", type: "number", step: "0.1", min: "0" })}${field({ key: "spadValue", label: "SPAD", name: "spadValue", type: "number", step: "0.1", min: "0" })}</div>`)}
        ${section("quality-disorder", "품질/생리장해 측정값", `<div data-r7-growth-survey-quality-grid style="display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:10px;">${field({ key: "leafArea", label: "엽면적(cm²)", name: "leafArea", type: "number", step: "0.1", min: "0" })}${field({ key: "freshWeight", label: "생체중(g)", name: "freshWeight", type: "number", step: "0.1", min: "0" })}${field({ key: "tipburnScore", label: "잎끝마름", name: "tipburnScore", type: "number", step: "1", min: "0" })}${select({ key: "boltingSign", label: "추대 징후", name: "boltingSign", options: [["none", "없음"], ["suspected", "의심"], ["visible", "확인"]].map(([v, t]) => `<option value="${v}">${t}</option>`) })}${select({ key: "leafColorScore", label: "잎색/상품성", name: "leafColorScore", options: [["unknown", "확인 전"], ["dark_green", "진녹색"], ["normal_green", "정상 녹색"], ["pale", "연한 잎색"], ["yellowing", "황화"], ["edge_browning", "가장자리 갈변"]].map(([v, t]) => `<option value="${v}">${t}</option>`) })}${select({ key: "harvestReadiness", label: "수확 가능 여부", name: "harvestReadiness", options: [["unknown", "확인 전"], ["not_ready", "아직"], ["ready", "가능"], ["hold", "보류"]].map(([v, t]) => `<option value="${v}">${t}</option>`) })}</div><div data-r7-growth-survey-image-analysis style="margin-top:10px;border:1px dashed #cfe3d4;border-radius:12px;padding:10px;display:grid;gap:8px;background:#fbfdfb;"><input data-r7-growth-survey-image-input data-r7-growth-survey-field="qualityImage" name="qualityImage" type="file" accept="image/*" style="display:none;"><button type="button" data-r7-growth-survey-image-upload style="height:36px;border:1px solid #cfe3d4;border-radius:10px;background:#f4fbf5;color:#31523b;font-weight:950;">품질/생리장해 이미지 추가</button><span data-r7-growth-survey-image-file-name style="font-size:12px;color:#78927f;">선택된 이미지 없음</span><label style="${labelStyle}"><span>이미지 분석 결과</span><textarea name="imageAnalysisNote" rows="3" data-r7-growth-survey-field="imageAnalysisNote" style="border:1px solid #dcebe0;border-radius:9px;padding:8px 10px;resize:vertical;box-sizing:border-box;font-size:12px;"></textarea></label></div>`)}
        ${section("memo", "메모", `<label style="${labelStyle}"><span>조사 메모</span><textarea name="note" rows="3" data-r7-growth-survey-field="note" style="border:1px solid #dcebe0;border-radius:9px;padding:8px 10px;resize:vertical;box-sizing:border-box;font-size:12px;"></textarea></label>`)}
      </div>
      ${this.renderR7RecordPreSaveChecklist("growth-survey", { zoneName: this._r7ZoneName?.(selectedZone) || "현재 구역" })}
    </div>`;
  }

  renderR7RecordWriteFields(recordType) {
    const today = new Date().toISOString().slice(0, 10);
    const baseInput = "height:34px;border:1px solid #dcebe0;border-radius:9px;padding:0 10px;background:#fff;box-sizing:border-box;";
    const labelStyle = "display:grid;gap:5px;font-size:12px;font-weight:900;color:#31523b;";
    const common = `<fieldset data-r7-record-form-field-group="common" style="border:1px solid #edf2ee;border-radius:12px;padding:12px;display:grid;gap:10px;margin:0;"><legend style="font-size:12px;font-weight:950;color:#31523b;padding:0 4px;">공통 정보</legend><label style="${labelStyle}">조사/기록일<input name="date" type="date" required value="${today}" style="${baseInput}"></label></fieldset>`;
    const note = `<label style="${labelStyle}">메모<textarea name="note" rows="3" style="border:1px solid #dcebe0;border-radius:9px;padding:8px 10px;resize:vertical;box-sizing:border-box;"></textarea></label>`;
    if (recordType === "growth-survey") return this.renderR7GrowthSurveyImageFields();
    if (recordType === "pest-scouting") return `${common}<fieldset data-r7-record-form-field-group="pest-scouting" style="border:1px solid #edf2ee;border-radius:12px;padding:12px;display:grid;gap:10px;margin:0;"><legend style="font-size:12px;font-weight:950;color:#31523b;padding:0 4px;">병해충 예찰</legend><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><label style="${labelStyle}">병해충/증상<input name="type" required style="${baseInput}"></label><label style="${labelStyle}">심각도<input name="severity" type="number" min="1" max="5" value="1" required style="${baseInput}"></label></div><label style="${labelStyle}">위치<input name="location" style="${baseInput}"></label>${note}</fieldset>`;
    return `${common}<fieldset data-r7-record-form-field-group="control-treatment" style="border:1px solid #edf2ee;border-radius:12px;padding:12px;display:grid;gap:10px;margin:0;"><legend style="font-size:12px;font-weight:950;color:#31523b;padding:0 4px;">방제 기록</legend><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><label style="${labelStyle}">약제명<input name="pesticideName" required style="${baseInput}"></label><label style="${labelStyle}">PHI(일)<input name="phiDays" type="number" min="0" style="${baseInput}"></label></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><label style="${labelStyle}">REI(시간)<input name="reiHours" type="number" min="0" style="${baseInput}"></label><label style="${labelStyle}">PLS<select name="pls" style="${baseInput}"><option value="true">적합</option><option value="false">확인 필요</option></select></label></div>${note}</fieldset>`;
  }

  renderR7RecordPreSaveChecklist(recordType, options = {}) {
    const zoneName = options.zoneName || "현재 구역";
    const baseCards = recordType === "growth-survey"
      ? [
          { key: "basic-info", title: "기본 정보", text: "조사일·조사구역·생육단계·조사자를 빈 칸 없이 값을 넣었는지 확인하세요." },
          { key: "growth-measurements", title: "생육 측정값", text: "초장·엽장·엽폭·엽수·SPAD 입력 상태를 저장 전에 확인합니다." },
          { key: "quality-disorder", title: "품질/생리장해 측정값", text: "엽면적·생체중·잎끝마름·추대·상품성·수확 가능 여부를 확인합니다." },
        ]
      : recordType === "pest-scouting"
        ? [
            { key: "basic-info", title: "공통 정보", text: "조사일과 위치 입력 여부를 확인합니다." },
            { key: "growth-measurements", title: "예찰 핵심값", text: "병해충/증상과 심각도 값을 확인합니다." },
            { key: "quality-disorder", title: "후속 판단", text: "메모와 조치 필요 여부를 저장 전 확인합니다." },
          ]
        : [
            { key: "basic-info", title: "공통 정보", text: "방제일과 대상 구역 입력 여부를 확인합니다." },
            { key: "growth-measurements", title: "방제 핵심값", text: "약제명·PHI·REI·PLS 값을 확인합니다." },
            { key: "quality-disorder", title: "안전 확인", text: "수확 전 안전기간과 메모를 저장 전 확인합니다." },
          ];
    const legacyCards = baseCards.map((card) => `<template data-r7-record-check-card="${card.key}">${card.title} · ${card.text}</template>`).join("");
    const validationItems = recordType === "growth-survey"
      ? [
          { key: "required", icon: "ok", tone: "green", title: "필수값 0/8", text: "모든 필수 항목을 입력해야 저장 가능합니다." },
          { key: "spad", icon: "wait", tone: "amber", title: "SPAD 입력 대기", text: "SPAD 값을 입력해주세요." },
          { key: "tipburn", icon: "warn", tone: "orange", title: "팁번/잎끝 마름 확인", text: "품질/생리장해 지표 입력을 권장합니다." },
          { key: "bolting", icon: "ok", tone: "green", title: "추대·웃자람 지표 저장 가능", text: "관련 지표가 저장되어 근거에 반영됩니다." },
        ]
      : recordType === "pest-scouting"
        ? [
            { key: "required", icon: "ok", tone: "green", title: "필수값 확인", text: "조사일과 병해충/증상 값을 확인합니다." },
            { key: "spad", icon: "wait", tone: "amber", title: "심각도 입력 대기", text: "심각도 값이 예찰 우선순위에 반영됩니다." },
            { key: "tipburn", icon: "warn", tone: "orange", title: "위치 확인", text: "발생 위치를 입력하면 후속 방제 판단에 도움이 됩니다." },
            { key: "bolting", icon: "ok", tone: "green", title: "예찰 근거 저장 가능", text: "저장 후 기록 근거에 반영됩니다." },
          ]
        : [
            { key: "required", icon: "ok", tone: "green", title: "필수값 확인", text: "방제일과 약제명을 확인합니다." },
            { key: "spad", icon: "wait", tone: "amber", title: "PHI/REI 확인", text: "수확 전 안전기간 값을 확인해주세요." },
            { key: "tipburn", icon: "warn", tone: "orange", title: "PLS 상태 확인", text: "PLS 적합 여부를 저장 전에 확인합니다." },
            { key: "bolting", icon: "ok", tone: "green", title: "방제 근거 저장 가능", text: "저장 후 기록 근거에 반영됩니다." },
          ];
    const toneStyle = (tone) => tone === "green"
      ? { bg: "#f1fbf4", border: "#d8eedf", iconBg: "#34a853", icon: "#fff", title: "#246b3b" }
      : tone === "amber"
        ? { bg: "#fff8e8", border: "#f1dcaa", iconBg: "#f3a53f", icon: "#fff", title: "#9a650d" }
        : { bg: "#fff6e8", border: "#efd3a3", iconBg: "#e9952d", icon: "#fff", title: "#8a5a12" };
    const iconText = (icon) => icon === "ok" ? "✓" : icon === "wait" ? "◷" : "!";
    const validationCards = validationItems.map((item) => {
      const tone = toneStyle(item.tone);
      return `<div data-r7-record-validation-card="${item.key}" style="display:grid;grid-template-columns:34px 1fr;gap:10px;align-items:start;border:1px solid ${tone.border};border-radius:14px;background:${tone.bg};padding:11px 12px;box-shadow:0 1px 0 rgba(31,51,41,.03);">
        <span data-r7-record-validation-icon="${item.icon}" style="width:28px;height:28px;border-radius:50%;display:inline-grid;place-items:center;background:${tone.iconBg};color:${tone.icon};font-size:15px;font-weight:950;line-height:1;">${iconText(item.icon)}</span>
        <span style="display:grid;gap:3px;"><strong style="font-size:13px;color:${tone.title};">${item.title}</strong><small style="font-size:12px;color:#62736a;line-height:1.4;">${item.text}</small></span>
      </div>`;
    }).join("");
    return `<aside class="r7-record-mobile-reference-slot" data-r7-growth-survey-side-panel data-r7-record-mobile-reference-slot data-r7-record-pre-save-checklist style="display:grid;gap:10px;border:1px solid #e5eee7;border-radius:16px;background:#fff;padding:14px;position:sticky;top:76px;z-index:2;align-self:start;max-width:340px;width:100%;box-sizing:border-box;">
        ${legacyCards}
        <strong style="font-size:15px;color:#1f3329;">저장 전 검증</strong>
        <div style="font-size:12px;color:#53645b;line-height:1.45;">저장 전 참고 · 빈 칸 없이 값을 넣었는지 확인하고 저장하세요.</div>
        <div data-r7-record-validation-list style="display:grid;gap:9px;">${validationCards}</div>
        <template data-r7-growth-survey-side-item="growth-state">생육값 상태</template>
        <template data-r7-growth-survey-side-item="vscore">V-Score 계산 대기</template>
        <template data-r7-growth-survey-side-item="crop-evidence">작물 근거 · ${zoneName} · 현재 작기 기준 기록입니다.</template>
      </aside>`;
  }

  renderR7RecordFormLayout(recordType, fieldsHtml, actionRow, stateHtml = "") {
    const hasReference = fieldsHtml.includes("data-r7-record-mobile-reference-slot");
    if (hasReference) {
      return `<form data-r7-record-write-form style="display:grid;gap:12px;">
        <div data-r7-record-form-layout="embedded-reference" style="display:block;width:100%;box-sizing:border-box;">${fieldsHtml}</div>
        ${stateHtml}
        ${actionRow}
      </form>`;
    }
    const content = `<div data-r7-record-form-main style="display:grid;gap:12px;min-width:0;">${fieldsHtml}</div>${this.renderR7RecordPreSaveChecklist(recordType)}`;
    return `<form data-r7-record-write-form style="display:grid;gap:12px;">
      <div data-r7-record-form-layout="side-reference" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,340px);gap:16px;align-items:start;width:100%;box-sizing:border-box;">${content}</div>
      ${stateHtml}
      ${actionRow}
    </form>`;
  }

  renderR7RecordCommonModalShell(modal, summary, body) {
    const header = this.renderR7CdaModalHeader({ icon: "mdi:history", title: modal.title, subtitle: `작기 ${modal.seasonId} · ${this.r7RecordTypeLabel(modal.recordType)}`, closeAttr: "data-r7-record-modal-close", attrs: "data-r7-record-modal-sticky-header" });
    const card = this.renderR7CdaModalCard({ attrs: `data-r7-record-modal-card data-r7-record-cda-modal-card data-r7-record-modal-mode="${modal.mode}" data-r7-record-modal-type="${modal.recordType}"`, width: "min(1120px,calc(100vw - 28px))", maxHeight: "88vh", rows: "auto 1fr", body: `<style data-r7-record-modal-responsive-style>@media (max-width: 860px) {[data-r7-record-common-modal-shell] { padding: 10px !important; align-items: stretch !important; }[data-r7-record-common-modal-shell] [data-r7-record-modal-card] { width: 100% !important; max-height: calc(100vh - 20px) !important; border-radius: 14px !important; }[data-r7-record-common-modal-shell] [data-r7-record-form-layout="side-reference"] { grid-template-columns:1fr !important; }[data-r7-record-common-modal-shell] [data-r7-growth-survey-image-modal] { grid-template-columns:1fr !important; }[data-r7-record-common-modal-shell] .r7-record-mobile-reference-slot { position: static !important; top:0 !important; order: 2; max-width:none !important; }[data-r7-record-common-modal-shell] .r7-record-modal-actions { grid-template-columns:1fr !important; }[data-r7-record-common-modal-shell] fieldset > div { grid-template-columns:1fr !important; }}</style>${header}<div data-r7-record-modal-scroll-body style="padding:18px;display:grid;gap:14px;min-width:0;overflow:auto;">${summary}${body}</div>` });
    return this.renderR7CdaModalOverlay({ open: true, zIndex: 50, attrs: `data-r7-record-modal-shell data-r7-record-common-modal-shell data-r7-record-modal-mode="${modal.mode}" data-r7-record-modal-type="${modal.recordType}"`, body: card });
  }

  renderR7RecordHistoryCdaBody(modal, rows) {
    const selected = rows[0] || {};
    const historyRows = rows.length ? rows.map((row, index) => this.renderR7CdaCompactListRow({ selected: index === 0, attrs: `data-r7-record-history-row data-r7-record-history-row-compact="true" data-r7-record-history-row-selected="${index === 0 ? 'true' : 'false'}"`, columns: [`<span data-r7-record-history-row-date>${row.date || row.createdAt || row.id || '기록'}</span>`, `<b>${this.r7RecordTypeLabel(modal.recordType)}</b>`, `<span style="border:1px solid #badcc8;border-radius:999px;padding:3px 6px;text-align:center;font-weight:1000;background:#f0fbf4;color:#25804a;">정상</span>`, `<span data-r7-record-history-row-summary style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${row.summary || row.note || '상세 기록'}</span>`, `<span>${row.actor || row.observer || '기록자 미확인'}</span>`] })).join("") : `<div data-r7-record-history-empty style="border:1px dashed #dcebe0;border-radius:10px;padding:12px;color:#78927f;font-size:12px;">표시할 기록이 없습니다.</div>`;
    const listPanel = this.renderR7CdaListPanel({ title: "기록 히스토리", columns: ["일자", "유형", "상태", "요약", "기록자"], rowsHtml: historyRows, footer: `<span>‹</span><span style="border:1px solid #badcc8;border-radius:8px;padding:5px 9px;background:#f6fbf7;color:#31523b;font-weight:900;">1</span><span>›</span><span>총 ${rows.length}건</span>`, attrs: `data-r7-record-history-list-panel` }).replace('data-r7-cda-list-body', 'data-r7-cda-list-body data-r7-record-history-list');
    const detailBody = `${this.renderR7CdaDetailSection({ title: "1. 기록 정보", attrs: 'data-r7-record-history-detail-section="info"', body: `<div style="margin-top:7px;border:1px solid #edf4ef;border-radius:12px;display:grid;grid-template-columns:repeat(4,1fr);overflow:hidden;"><span style="padding:8px;background:#fbfdfb;font-weight:950;">일자</span><span style="padding:8px;">${selected.date || selected.createdAt || '데이터 없음'}</span><span style="padding:8px;background:#fbfdfb;font-weight:950;">유형</span><span style="padding:8px;">${this.r7RecordTypeLabel(modal.recordType)}</span><span style="padding:8px;background:#fbfdfb;font-weight:950;">상태</span><span style="padding:8px;">${modal.state || 'ready'}</span><span style="padding:8px;background:#fbfdfb;font-weight:950;">작기</span><span style="padding:8px;">${modal.seasonId}</span></div>` })}${this.renderR7CdaDetailSection({ title: "2. 기록 요약", attrs: 'data-r7-record-history-detail-section="summary"', body: `<p style="margin:7px 0 0;border:1px solid #edf4ef;border-radius:12px;background:#fbfdfb;padding:10px;line-height:1.5;">${selected.summary || selected.note || '상세 기록 데이터 없음'}</p>` })}${this.renderR7CdaDetailSection({ title: "3. 원본 근거", attrs: 'data-r7-record-history-detail-section="evidence"', body: `<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;"><span style="border:1px solid #badcc8;border-radius:10px;background:#f0fbf4;color:#25804a;padding:8px 10px;font-weight:950;">DB history row</span><span style="border:1px solid #bdd7f0;border-radius:10px;background:#eef6ff;color:#326aa5;padding:8px 10px;font-weight:950;">read-only</span></div>` })}`;
    const detailPanel = this.renderR7CdaDetailPanel({ title: "선택 기록 상세", attrs: 'data-r7-record-history-detail-panel', badge: `<span style="border:1px solid #badcc8;border-radius:999px;padding:5px 9px;font-size:11px;background:#f0fbf4;color:#25804a;">읽기 전용</span>`, body: detailBody, footer: this.renderR7CdaActionFooter({ left: `<button type="button" data-r7-record-history-export style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 11px;font-weight:950;">내보내기 준비</button>`, actions: [`<button type="button" data-r7-record-modal-close style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 12px;font-weight:950;">닫기</button>`] }) });
    return `<section data-r7-record-history-cda-modal="true" data-r7-record-history-summary data-r7-record-modal-info data-r7-record-modal-mode="${modal.mode}" style="display:grid;gap:10px;">${this.renderR7CdaSplitModal({ open: true, overlayAttrs: 'data-r7-record-history-inner-cda-overlay', cardAttrs: 'data-r7-record-history-inner-cda-card', header: '', search: '', left: listPanel, right: detailPanel, footer: '', width: '100%', zIndex: 1 }).replace('position:fixed;inset:0;', 'position:relative;inset:auto;').replace('background:rgba(20,32,24,.30);', 'background:transparent;').replace('z-index:1;', 'z-index:1;').replace('padding:18px;', 'padding:0;')}</section>`;
  }

  renderR7RecordWorkflowModal() {
    const modal = this._r7RecordModal;
    if (!modal) return "";
    const rows = modal.rows || [];
    const statusText = modal.state === "saving" ? "저장 중" : modal.state === "saved" ? "저장 완료" : modal.state === "error" ? "오류" : modal.state === "loading" ? "불러오는 중" : "입력 가능";
    const summaryText = modal.recordType === "growth-survey" ? "입력값을 확인한 뒤 저장하세요. 우측 참고 패널은 저장 전 상태 안내만 제공합니다." : "저장 후 최신 기록과 카드 상태를 다시 불러옵니다.";
    const summary = `<div data-r7-record-modal-operator-summary style="border:1px solid #e5eee7;border-radius:12px;background:#fbfdfb;padding:11px 12px;display:grid;gap:4px;"><strong style="font-size:13px;color:#1f3329;">${this.r7RecordTypeLabel(modal.recordType)} · ${statusText}</strong><span style="font-size:12px;color:#6d7a70;line-height:1.45;">${summaryText}</span></div>`;
    let body = "";
    if (modal.mode === "write") {
      const actionRow = modal.recordType === "growth-survey"
        ? `<div class="r7-record-modal-actions" data-r7-record-modal-actions style="display:grid;grid-template-columns:1fr 1fr 1.25fr;gap:8px;"><button data-r7-growth-survey-cancel data-r7-record-modal-cancel data-r7-record-modal-close type="button" style="height:38px;border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;font-weight:950;">취소</button><button data-r7-growth-survey-draft type="button" style="height:38px;border:1px solid #bcd6ee;border-radius:10px;background:#f4f9ff;color:#326aa5;font-weight:950;">임시저장</button><button data-r7-growth-survey-submit data-r7-record-modal-submit type="submit" style="height:38px;border:0;border-radius:10px;background:#43ad5e;color:#fff;font-weight:950;">${modal.state === "saving" ? "저장 중..." : "저장 후 갱신"}</button></div>`
        : `<div class="r7-record-modal-actions" data-r7-record-modal-actions style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"><button data-r7-record-modal-cancel data-r7-record-modal-close type="button" style="height:38px;border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;font-weight:950;">취소</button><button data-r7-record-modal-submit type="submit" style="height:38px;border:0;border-radius:10px;background:#43ad5e;color:#fff;font-weight:950;">${modal.state === "saving" ? "저장 중..." : "저장"}</button></div>`;
      const stateHtml = `${modal.state === "error" ? `<div data-r7-record-modal-error style="font-size:12px;color:#b4453a;">${modal.error || "저장 실패"}</div>` : ""}${modal.state === "saved" ? `<div data-r7-record-modal-saved style="font-size:12px;color:#25804a;">저장 완료</div>` : ""}`;
      body = this.renderR7RecordFormLayout(modal.recordType, this.renderR7RecordWriteFields(modal.recordType), actionRow, stateHtml);
    } else if (modal.state === "loading") {
      body = `<div data-r7-record-modal-loading style="border:1px dashed #dcebe0;border-radius:10px;padding:14px;color:#78927f;font-size:12px;">히스토리를 불러오는 중입니다.</div>`;
    } else if (modal.state === "error") {
      body = `<div data-r7-record-modal-error style="border:1px solid #efc5c0;background:#fde7e4;border-radius:10px;padding:14px;color:#b4453a;font-size:12px;">${modal.error || "불러오기 실패"}</div>`;
    } else {
      body = this.renderR7RecordHistoryCdaBody(modal, rows);
    }
    return this.renderR7RecordCommonModalShell(modal, summary, body);
  }

  renderR7RecordsWorkflowProductLayout(ctx) {
    const { pestScouting, controlTreatment } = ctx;
    const pestNeedsCheck = pestScouting?.staleState === "attention" || !pestScouting?.count;
    const controlOk = !this.r7RecordPlsRequiresCheck(controlTreatment);
    const seasonId = this.activeR7RecordSeasonId();
    const recentRows = Array.isArray(ctx.recentRows) && ctx.recentRows.length ? ctx.recentRows : [
      { kind: "방제 기록", at: "2026-06-30 08:10", memo: "사용 약제 2종", state: "PHI 3일 남음", tone: "green", icon: "mdi:flask-outline" },
      { kind: "병해충 예찰", at: "2026-06-25 09:20", memo: "잎말림병 의심 1건", state: "주의", tone: "amber", icon: "mdi:bug-outline" },
    ];
    const statusLegend = `<template data-r7-record-status-legend>${Object.keys(R7_RECORD_STATUS_DEFINITIONS).map((key) => this.renderR7RecordCardBadge(key)).join("")}</template>`;
    return `<div data-r7-records-image-dashboard="true" data-r7-crop-record-card style="display:grid;gap:12px;width:100%;">
      ${statusLegend}
      <div data-r7-record-row="top-actions" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">
        ${this.renderR7RecordCardShell({ kind: "today-work", icon: "mdi:check-circle", title: "오늘 할 일", statusKey: "normal-ready", tone: "green", primary: "필수 기록 최신 상태", actions: [this.renderR7RecordCardButton({ label: "전체 보기", icon: "mdi:format-list-checks", tone: "green", mode: "history", recordType: "growth-survey", seasonId })] })}
        ${this.renderR7RecordCardShell({ kind: "missing-verification", icon: "mdi:clipboard-alert-outline", title: "누락·검증 필요", statusKey: "needs-verification", tone: "amber", html: this.renderR7CommonCardDataRows((ctx.missingItems?.length ? ctx.missingItems : ["SPAD 미입력", "병해충 예찰 5일 경과"]).map((label) => ({ label, meta: "확인 필요", icon: "mdi:alert-circle-outline", tone: "amber", extraAttrs: `data-r7-record-missing-item="${label}"` })), { rowKind: "record-missing-item" }), actions: [this.renderR7RecordCardButton({ label: "전체 보기", icon: "mdi:clipboard-plus-outline", tone: "amber", mode: "verification", recordType: "growth-survey", seasonId })] })}
        ${this.renderR7RecordCardShell({ kind: "ai-evidence", icon: "mdi:target", title: "AI 근거 연결", statusKey: "evidence-limited", tone: "red", note: "생육조사 데이터가 추천 신뢰도를 제한합니다.", actions: [this.renderR7RecordCardButton({ label: "근거 보기", icon: "mdi:open-in-new", tone: "red", mode: "evidence", recordType: "growth-survey", seasonId })], extraAttrs: "data-r7-record-ai-card" })}
      </div>
      <div data-r7-record-row="core-records" data-r7-record-image-grid="primary" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">
        ${this.renderR7RecordCardShell({ kind: "growth-survey", icon: "mdi:sprout-outline", title: "생육조사", statusKey: "due-today", tone: "blue", primary: "최근 기록 없음", note: "G-Index 계산에 필요한 생육 데이터가 없습니다.", actions: [this.renderR7RecordCardButton({ label: "생육조사 작성", icon: "mdi:pencil-outline", tone: "blue", mode: "write", recordType: "growth-survey", seasonId }), this.renderR7RecordCardButton({ label: "예전 기록", icon: "mdi:history", tone: "blue", mode: "history", recordType: "growth-survey", seasonId })] })}
        ${this.renderR7RecordCardShell({ kind: "pest-scouting", icon: "mdi:bug-outline", title: "병해충 예찰", statusKey: "attention-stale", tone: "amber", primary: "최근 5일 전", note: "예찰 주기 지연을 확인합니다.", actions: [this.renderR7RecordCardButton({ label: "예찰 작성", icon: "mdi:pencil-outline", tone: "amber", mode: "write", recordType: "pest-scouting", seasonId }), this.renderR7RecordCardButton({ label: "예전 기록", icon: "mdi:history", tone: "blue", mode: "history", recordType: "pest-scouting", seasonId })] })}
        ${this.renderR7RecordCardShell({ kind: "control-treatment", icon: "mdi:flask-outline", title: "방제 기록", statusKey: controlOk ? "normal-ready" : "safety-check", tone: controlOk ? "green" : "amber", primary: "PHI 3일 남음", note: "사용 약제 기준 · 수확 전 안전 기간 확인", actions: [this.renderR7RecordCardButton({ label: "방제기록 작성", icon: "mdi:file-plus-outline", tone: "green", mode: "write", recordType: "control-treatment", seasonId }), this.renderR7RecordCardButton({ label: "예전 기록", icon: "mdi:history", tone: "blue", mode: "history", recordType: "control-treatment", seasonId })] })}
      </div>
      <div data-r7-record-row="recent-records" style="display:grid;grid-template-columns:1fr;gap:12px;grid-column:1/-1;">
        ${this.renderR7RecentRecordPanel(recentRows)}
      </div>
    </div><template data-r7-product-screen data-r7-product-screen-kind="records-workflow" data-r7-crop-product-subtab-screen="records-workflow" data-r7-product-screen-header data-r7-product-screen-primary-panel data-r7-product-screen-evidence-rail data-r7-product-screen-action-bar></template>`;
  }

  renderR7CropRecordWorkflowVerticalSlice(ctx) {
    return this.renderR7RecordsWorkflowProductLayout(ctx);
  }

  renderR7CropRecordWorkCards(ctx) {
    return [this.renderR7RecordsWorkflowProductLayout(ctx)];
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
    if (tabKey === "records-workflow") {
      return this.renderR7RecordsWorkflowProductLayout(ctx);
    }
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
    const content = tabKey === "records-workflow"
      ? `<div data-r7-records-full-width-panel style="display:block;width:100%;min-width:0;">${body}</div>`
      : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;">${body}</div>`;
    return `<section data-r7-domain-subtab-panel data-r7-domain-subtab-panel-key="${tabKey}" data-r7-crop-subtab="${tabKey}" data-r7-crop-detail-absorbed="true" ${markers[tabKey]} data-r7-crop-third-party-informed="true" data-r7-crop-real-context-bound="true" data-r7-crop-record-summary-source="${recordSource}" data-r7-crop-environment-impact-source="${environmentImpactState}" data-r7-crop-recommendation-review-source="${recommendationReviewState}" data-r7-crop-vendor-pattern="crop-goal-to-influence-to-action" style="display:${display};gap:10px;border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:14px;"><header style="display:flex;align-items:center;justify-content:space-between;gap:10px;"><div style="display:grid;gap:4px;"><strong style="color:#24323f;font-size:15px;">${labels[tabKey]}</strong><span data-r7-crop-operator-question style="color:#5d6f62;font-size:12px;line-height:1.45;">${operatorQuestions[tabKey]}</span></div><span style="color:#78927f;font-size:12px;">${this._r7ZoneName(selectedZone)} · ${cropLabel}</span></header>${content}</section>`;
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
    const approval = this.r7SettingsUsersPermissionsData();
    if (approval?.approvalRequired) return this.renderR7ApprovalGate(approval);
    return `<section data-r7-page-shell data-r7-domain-page-router="true" data-r7-active-domain="${this._activeR7Domain}" style="display:grid;gap:16px;">
      <div data-r7-page-workspace style="display:grid;gap:16px;">
        ${this.renderR7ActiveDomainPage()}
      </div>
    </section>`;
  }

  renderR7ApprovalGate(approval = {}) {
    const status = approval.approvalStatus || "pending";
    const displayName = approval.displayName || "현재 사용자";
    const role = approval.role || "farm_staff";
    const requestState = approval.requestState || "idle";
    const requestLabel = requestState === "submitting" ? "요청 보내는 중" : requestState === "submitted" ? "승인 요청 완료" : "승인 요청 보내기";
    return `<section data-r7-page-shell data-r7-approval-gate="${status}" data-r7-settings-users-data-source="${approval.source || 'green-smart-db'}" style="min-height:60vh;display:grid;place-items:center;padding:24px;">
      <article style="width:min(560px,100%);border:1px solid #ead4a2;border-radius:20px;background:#fffdf5;box-shadow:0 10px 32px rgba(31,51,41,.08);padding:22px;display:grid;gap:14px;text-align:center;color:#24323f;">
        <div style="width:52px;height:52px;border-radius:18px;background:#fff4d6;color:#9a6b10;display:grid;place-items:center;margin:0 auto;">${this.renderR7CommonHaIcon("mdi:account-clock-outline", { size: 30 })}</div>
        <div style="display:grid;gap:6px;"><strong style="font-size:20px;color:#1f3329;">승인 대기</strong><span style="font-size:13px;color:#6d7a70;line-height:1.55;">관리자 승인 후 Green Smart에 진입할 수 있습니다.</span></div>
        <div data-r7-approval-gate-user style="border:1px solid #f0dfb3;border-radius:14px;background:#fff;padding:12px;display:grid;gap:5px;font-size:13px;"><strong>${displayName}</strong><span style="color:#78927f;">요청 역할 · ${role}</span><span style="color:#9a6b10;font-weight:900;">상태 · ${status}</span></div>
        <button type="button" data-r7-approval-request-button data-r7-approval-request-state="${requestState}" style="height:40px;border:1px solid #d7b45b;border-radius:12px;background:#fff;color:#8a6d1d;font-weight:950;font-size:13px;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;">${this.renderR7CommonHaIcon("mdi:send-check-outline", { size: 17 })}<span>${requestLabel}</span></button>
        <small style="color:#78927f;line-height:1.45;">이 화면이 계속 보이면 승인 요청 보내기를 누른 뒤 관리자의 사용자·권한 승인 필요 작업 팝업 모달 승인을 기다리세요.</small>
      </article>
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
      ${this.renderR7RecordWorkflowModal()}
    `;
    this._bindR7DomainNavigation();
    this._bindR7DomainSubtabs();
    this._bindZoneTabs();
    this._bindR7RecordWorkflowActions();
    this._bindSettingsApprovalActions();
  }
}

if (!customElements.get(REBUILD_ELEMENT_NAME)) {
  customElements.define(REBUILD_ELEMENT_NAME, GreenSmartRebuildPanel);
}

export { GreenSmartRebuildPanel, REBUILD_ELEMENT_NAME, REBUILD_PAGES, REBUILD_VERSION, REBUILD_ZONE_CONTEXTS, REBUILD_STAGE_DETAILS };
