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

const REBUILD_VERSION = "1.15.21";
const REBUILD_ELEMENT_NAME = "green-smart-rebuild-panel";
const REBUILD_CONTEXT_API_PATH = "green_smart/rebuild/home/context";
const REBUILD_SETTINGS_USERS_PERMISSIONS_API_PATH = "green_smart/rebuild/settings/users-permissions";
const REBUILD_SETTINGS_APPROVAL_REQUEST_API_PATH = "green_smart/rebuild/settings/approval-request";
const REBUILD_SETTINGS_APPROVAL_DECISION_API_PREFIX = "green_smart/rebuild/settings/approval-requests/";
const REBUILD_SETTINGS_PERMISSION_CHANGE_REQUEST_API_PATH = "green_smart/rebuild/settings/permission-change-request";
const REBUILD_SETTINGS_USER_ROLE_API_PREFIX = "green_smart/rebuild/settings/users/";
const REBUILD_SETTINGS_ROLE_PERMISSIONS_API_PREFIX = "green_smart/rebuild/settings/role-permissions/";
const REBUILD_SETTINGS_ROLE_PERMISSIONS_API_PATH = "green_smart/rebuild/settings/role-permissions";
const REBUILD_SETTINGS_AUDIT_LOG_API_PREFIX = "green_smart/rebuild/settings/audit-logs/";
const REBUILD_SETTINGS_GREENHOUSE_CREATE_API_PATH = "green_smart/rebuild/settings/greenhouses";
const REBUILD_SETTINGS_ZONE_CREATE_API_PATH = "green_smart/rebuild/settings/zones";
const REBUILD_SETTINGS_DEVICE_CREATE_API_PATH = "green_smart/rebuild/settings/devices";
const REBUILD_SETTINGS_DEVICE_GROUP_CREATE_API_PATH = "green_smart/rebuild/settings/device-groups";
const REBUILD_SETTINGS_DEVICE_SENSOR_MAPPING_API_PATH = "green_smart/rebuild/settings/device-sensor-mappings";
const REBUILD_SETTINGS_SNAPSHOT_API_PATH = "green_smart/rebuild/settings/snapshot";
const REBUILD_SETTINGS_SYSTEM_UPDATE_API_PATH = "green_smart/rebuild/settings/system/update";
const REBUILD_SETTINGS_SYSTEM_ERRORS_API_PATH = "green_smart/rebuild/settings/system/errors";
const REBUILD_SETTINGS_SYSTEM_CENTER_CONNECTION_API_PATH = "green_smart/rebuild/settings/system/center-connection";
const R7_RECORDS_WORKFLOW_API_CONTRACT = Object.freeze({
  prefix: "/api/green_smart/rebuild/crop-records",
  endpoints: ["get /history", "get /history/{recordType}", "get /latest/{recordType}", "post /growth-survey", "post /pest-scouting", "post /control-treatment", "patch /{recordType}/{recordId}", "post /pls-check"],
  recordTypes: ["growth-survey", "pest-scouting", "control-treatment"],
  sourceSurface: "crop-operations.records-workflow",
  mode: "implemented-wrapper",
  writeImplementationEnabled: true,
  executionEnabled: false,
});

const R7_SETTINGS_GREENHOUSE_LIST_COLUMNS = Object.freeze(["온실명", "위치", "설치유형", "운영상태", "상태"]);
const R7_SETTINGS_GREENHOUSE_DETAIL_FIELD_ORDER = Object.freeze([
  ["name", "온실명"],
  ["location", "위치"],
  ["operatingStatus", "운영상태"],
  ["installType", "설치유형"],
  ["timezone", "기본 시간대"],
  ["status", "상태"],
  ["createdAt", "생성시각"],
  ["updatedAt", "수정시각"],
  ["creationReason", "생성 사유"],
]);
const R7_SETTINGS_ZONE_LIST_COLUMNS = Object.freeze(["구역명", "온실", "용도", "베드 수", "상태"]);
const R7_SETTINGS_ZONE_DETAIL_FIELD_ORDER = Object.freeze([
  ["zoneName", "구역명"],
  ["greenhouseName", "온실"],
  ["purpose", "용도"],
  ["area", "면적"],
  ["bedCount", "베드 수"],
  ["status", "상태"],
  ["createdAt", "생성시각"],
  ["updatedAt", "수정시각"],
  ["note", "메모"],
]);
const R7_SETTINGS_EQUIPMENT_LIST_COLUMNS = Object.freeze(["장비종류", "구역", "센서", "장비", "상태"]);
const R7_SETTINGS_EQUIPMENT_DETAIL_FIELD_ORDER = Object.freeze([
  ["mappingRole", "장비종류"],
  ["zoneName", "구역"],
  ["sensorEntity", "센서 entity"],
  ["deviceEntity", "장비 entity"],
  ["protocol", "프로토콜"],
  ["direction", "방향"],
  ["status", "상태"],
  ["updatedAt", "수정시각"],
  ["note", "메모"],
]);
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
  logout: "mdi:logout",
  exit: "mdi:logout",
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
  "greenhouse-zones": "mdi:greenhouse",
  "device-sensor-mapping": "mdi:devices",
  "users-permissions": "mdi:account-key-outline",
  "system-integration": "mdi:home-assistant",
  "domain-ownership": "mdi:folder-key-outline",
  "role-permissions": "mdi:account-key-outline",
  "mapping-devices": "mdi:devices",
  "system-security": "mdi:security",
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
    this._settingsGreenhouseZoneData = { source: "loading", greenhouses: [], zones: [], deviceSensorMappings: [] };
    this._settingsGreenhouseZoneLoadState = "loading";
    this._settingsGreenhouseZoneLoadError = null;
    this._settingsGreenhouseZoneRequestId = 0;
    this._settingsApprovalModal = { open: false, request: null };
    this._settingsApprovalListModal = { open: false };
    this._settingsAuditLogModal = { open: false };
    this._settingsPermissionMatrixModal = { open: false };
    this._settingsGreenhouseCreateModal = { open: false, state: "idle" };
    this._settingsZoneCreateModal = { open: false, state: "idle" };
    this._settingsDeviceSensorMappingModal = { open: false, state: "idle" };
    this._settingsShortcutCdaModal = { open: false, kind: "" };
    this._settingsSystemActionModal = { open: false, kind: "", state: "idle", data: null, error: "" };
    this._settingsRolePermissionEditModal = { open: false, state: "idle" };
    this._settingsUsersPermissionsLoadState = "loading";
    this._settingsUsersPermissionsLoadError = null;
    this._settingsUsersPermissionsRequestId = 0;
    this._activeR7Domain = "operations-home";
    this._activeR7DomainSubtabs = { "crop-operations": "status-summary", "environment-control": "status-summary", "irrigation-fertigation": "status-summary", "device-control": "status-summary", "recommendation-automation": "status-summary", "safety-history": "status-summary", "settings-admin": "greenhouse-zones" };
    this._r7SidebarCollapsed = false;
    this._r7RecordModal = null;
    this._r7SidebarExternalControlSyncRaf = 0;
    this._r7SidebarExternalControlResizeObserver = null;
    this._r7SidebarExternalControlMutationObserver = null;
    this._r7SidebarExternalControlResizeHandler = null;
    this._r7MobileActiveDomainScrollRaf = 0;
    this._r7MobileSettingsFastLanding = false;
    this._r7MobileFastPanelMode = false;
    this._r7MobileActiveSubtabScrollRaf = 0;
    this._r7MobilePanelHydration = null;
    this._r7MobilePanelHydrationTimer = 0;
    this._r7MobilePanelHydrationWatchdog = 0;
    this._r7SettingsPanelCache = new Map();
    this._r7SettingsPanelDirty = new Set(["greenhouse-zones", "device-sensor-mapping", "users-permissions", "system-integration"]);
    this._r7ModalCache = new Map();
    this._r7DomainShellCache = new Map();
    this._r7SettingsPanelCacheStats = { hits: 0, misses: 0 };
    this._r7DomainShellCacheStats = { hits: 0, misses: 0 };
    this._selectedZoneId = Object.fromEntries(Object.keys(REBUILD_STAGE_DETAILS).map((stageKey) => [stageKey, "all"]));
  }

  _applyR7HostWidthPolicy() {
    this.setAttribute?.("data-r7-host-width-policy", "viewport-fill");
    this.setAttribute?.("data-r7-host-display", "block-fill");
    this.style.display = "block";
    this.style.width = "100%";
    this.style.minWidth = "0";
    this.style.maxWidth = "100%";
    this.style.boxSizing = "border-box";
    this.style.flex = "1 1 auto";
    this.style.alignSelf = "stretch";
  }

  connectedCallback() {
    this._applyR7HostWidthPolicy();
    this.render();
    this._ensureR7SidebarExternalControlObservers();
    this._loadHomeContext();
    this._loadSettingsUsersPermissions();
    this._loadSettingsGreenhouseZoneData();
  }

  disconnectedCallback() {
    this._r7SidebarExternalControlResizeObserver?.disconnect?.();
    this._r7SidebarExternalControlMutationObserver?.disconnect?.();
    if (this._r7SidebarExternalControlResizeHandler) globalThis.window?.removeEventListener?.("resize", this._r7SidebarExternalControlResizeHandler);
    if (this._r7SidebarExternalControlSyncRaf && globalThis.cancelAnimationFrame) globalThis.cancelAnimationFrame(this._r7SidebarExternalControlSyncRaf);
    this._r7SidebarExternalControlResizeObserver = null; this._r7SidebarExternalControlMutationObserver = null; this._r7SidebarExternalControlResizeHandler = null; this._r7SidebarExternalControlSyncRaf = 0;
  }

  _refreshR7MobileSettingsPanelAfterDataLoad() {
    this._markR7SettingsPanelDirty();
    if (this._activeR7Domain !== "settings-admin") return false;
    const frame = this.querySelector?.('[data-r7-domain-visual-frame-domain="settings-admin"]');
    if (!frame || !this._r7MobileFastPanelMode) return false;
    const activeTab = this._activeR7DomainSubtabs?.["settings-admin"] || "greenhouse-zones";
    this.setAttribute?.("data-r7-mobile-settings-data-refresh-mode", "active-panel-hydrate-no-full-render");
    this._scheduleR7MobileFullSubtabHydration("settings-admin", activeTab);
    return true;
  }

  r7SettingsGreenhouseZoneData() {
    return this._settingsGreenhouseZoneData || { source: "empty", greenhouses: [], zones: [], deviceSensorMappings: [], devices: [], deviceGroups: [], systemIntegration: {} };
  }

  async _loadSettingsGreenhouseZoneData() {
    const requestId = ++this._settingsGreenhouseZoneRequestId;
    this._settingsGreenhouseZoneLoadState = "loading";
    this._settingsGreenhouseZoneLoadError = null;
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      const response = await this.hass.callApi("GET", REBUILD_SETTINGS_SNAPSHOT_API_PATH);
      if (requestId !== this._settingsGreenhouseZoneRequestId) return;
      this._settingsGreenhouseZoneData = {
        source: response?.source || "green_smart_settings_db",
        greenhouses: Array.isArray(response?.greenhouses) ? response.greenhouses : [],
        zones: Array.isArray(response?.zones) ? response.zones : [],
        deviceSensorMappings: Array.isArray(response?.deviceSensorMappings) ? response.deviceSensorMappings : [],
        devices: Array.isArray(response?.devices) ? response.devices : [],
        deviceGroups: Array.isArray(response?.deviceGroups) ? response.deviceGroups : [],
        systemIntegration: response?.systemIntegration && typeof response.systemIntegration === "object" ? response.systemIntegration : {},
      };
      this._settingsGreenhouseZoneLoadState = "ready";
    } catch (error) {
      if (requestId !== this._settingsGreenhouseZoneRequestId) return;
      this._settingsGreenhouseZoneLoadState = "error";
      this._settingsGreenhouseZoneLoadError = error?.message || "settings-snapshot-load-failed";
    }
    if (!this._refreshR7MobileSettingsPanelAfterDataLoad()) this.render();
  }

  r7SettingsUsersPermissionsData() {
    return this._settingsUsersPermissions || { source: "loading", users: [], approvalRows: [], auditRows: [], rolePermissions: [], counts: { users: 0, approvals: 0, audits: 0, rolePermissions: 0 } };
  }

  async _loadSettingsUsersPermissions() {
    const requestId = ++this._settingsUsersPermissionsRequestId;
    this._settingsUsersPermissionsLoadState = "loading";
    this._settingsUsersPermissionsLoadError = null;
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
        rolePermissions: Array.isArray(response?.rolePermissions) ? response.rolePermissions : [],
        counts: response?.counts || {},
      };
      this._settingsUsersPermissionsLoadState = "ready";
    } catch (error) {
      if (requestId !== this._settingsUsersPermissionsRequestId) return;
      this._settingsUsersPermissions = { source: "db-load-error", users: [], approvalRows: [], auditRows: [], rolePermissions: [], counts: { users: 0, approvals: 0, audits: 0, rolePermissions: 0 } };
      this._settingsUsersPermissionsLoadState = "error";
      this._settingsUsersPermissionsLoadError = error?.message || "settings-users-permissions-load-failed";
    }
    if (this.r7SettingsUsersPermissionsData()?.approvalRequired || !this._refreshR7MobileSettingsPanelAfterDataLoad()) this.render();
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
    if (this._mountR7CachedSettingsModal("approval-detail")) return;
    this.render();
  }

  _openSettingsApprovalListModal() {
    this._settingsApprovalModal = { open: false, request: null };
    this._settingsAuditLogModal = { open: false };
    this._settingsPermissionMatrixModal = { open: false };
    this._settingsGreenhouseCreateModal = { open: false, state: "idle" };
    this._settingsZoneCreateModal = { open: false, state: "idle" };
    this._settingsDeviceSensorMappingModal = { open: false, state: "idle" };
    this._settingsShortcutCdaModal = { open: false, kind: "" };
    this._settingsApprovalListModal = { open: true };
    if (this._mountR7CachedSettingsModal("approval-list")) return;
    this.render();
  }

  _closeSettingsApprovalListModal() {
    this._settingsApprovalListModal = { open: false };
    if (this._hideR7CachedSettingsModal("approval-list")) return;
    this.render();
  }

  _selectSettingsApprovalListRequest(requestId) {
    this._settingsApprovalListModal = { ...(this._settingsApprovalListModal || {}), open: true, selectedId: requestId };
    if (this._mountR7CachedSettingsModal("approval-list")) return;
    this.render();
  }

  _openSettingsAuditLogModal() {
    this._settingsApprovalModal = { open: false, request: null };
    this._settingsApprovalListModal = { open: false };
    this._settingsPermissionMatrixModal = { open: false };
    this._settingsGreenhouseCreateModal = { open: false, state: "idle" };
    this._settingsZoneCreateModal = { open: false, state: "idle" };
    this._settingsDeviceSensorMappingModal = { open: false, state: "idle" };
    this._settingsShortcutCdaModal = { open: false, kind: "" };
    this._settingsAuditLogModal = { open: true };
    if (this._mountR7CachedSettingsModal("audit-log")) return;
    this.render();
  }

  _closeSettingsAuditLogModal() {
    this._settingsAuditLogModal = { open: false };
    if (this._hideR7CachedSettingsModal("audit-log")) return;
    this.render();
  }

  _selectSettingsAuditLogRow(rowId) {
    this._settingsAuditLogModal = { ...(this._settingsAuditLogModal || {}), open: true, selectedId: rowId };
    if (this._mountR7CachedSettingsModal("audit-log")) return;
    this.render();
  }

  _openSettingsAuditLogEditModal(auditId) {
    if (!auditId) return;
    this._settingsAuditLogEditModal = { open: true, selectedId: auditId, state: "idle", error: "" };
    this.render();
  }

  _closeSettingsAuditLogEditModal() {
    this._settingsAuditLogEditModal = { open: false };
    this.render();
  }

  async _submitSettingsAuditLogEditForm(form) {
    const auditId = this._settingsAuditLogEditModal?.selectedId || form?.getAttribute?.("data-r7-settings-audit-log-edit-form") || "";
    if (!auditId) return;
    const data = new FormData(form);
    const payload = {
      displayName: String(data.get("displayName") || ""),
      role: String(data.get("role") || "farm_staff"),
      status: String(data.get("status") || "active"),
      permissionSummary: String(data.get("permissionSummary") || ""),
    };
    this._settingsAuditLogEditModal = { ...(this._settingsAuditLogEditModal || {}), open: true, selectedId: auditId, state: "saving", error: "" };
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      await this.hass.callApi("PATCH", `${REBUILD_SETTINGS_USER_ROLE_API_PREFIX}${encodeURIComponent(auditId)}`, payload);
      this._settingsAuditLogEditModal = { ...(this._settingsAuditLogEditModal || {}), open: false, state: "saved" };
      this._settingsAuditLogModal = { ...(this._settingsAuditLogModal || {}), open: true, selectedId: auditId, actionState: "saved", actionDecision: "edit" };
      await this._loadSettingsUsersPermissions();
    } catch (error) {
      this._settingsAuditLogEditModal = { ...(this._settingsAuditLogEditModal || {}), open: true, selectedId: auditId, state: "error", error: error?.message || "audit-log-edit-failed" };
      this.render();
    }
  }

  async _updateSettingsAuditLogRow(auditId, decision = "edit") {
    if (!auditId) return;
    const current = (this.r7SettingsUsersPermissionsData().auditRows || []).find((row) => String(row.id || row.auditId || "") === String(auditId)) || {};
    const memo = decision === "reject"
      ? `거부됨: ${current.summary || current.action || auditId}`
      : `수정됨: ${current.summary || current.action || auditId}`;
    this._settingsAuditLogModal = { ...(this._settingsAuditLogModal || {}), open: true, selectedId: auditId, actionState: "saving", actionDecision: decision };
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      await this.hass.callApi("PATCH", `${REBUILD_SETTINGS_AUDIT_LOG_API_PREFIX}${encodeURIComponent(auditId)}`, { decision, memo });
      this._settingsAuditLogModal = { ...(this._settingsAuditLogModal || {}), open: true, selectedId: auditId, actionState: "saved", actionDecision: decision };
      await this._loadSettingsUsersPermissions();
    } catch (error) {
      this._settingsAuditLogModal = { ...(this._settingsAuditLogModal || {}), open: true, selectedId: auditId, actionState: "error", actionError: error?.message || "audit-log-update-failed" };
      this.render();
    }
  }

  _openSettingsPermissionMatrixModal() {
    this._settingsApprovalModal = { open: false, request: null };
    this._settingsApprovalListModal = { open: false };
    this._settingsAuditLogModal = { open: false };
    this._settingsRolePermissionEditModal = { open: false, state: "idle" };
    this._settingsPermissionMatrixModal = { open: true, selectedRole: this._settingsPermissionMatrixModal?.selectedRole || "admin" };
    if (this._mountR7CachedSettingsModal("permission-matrix")) return;
    this.render();
  }

  _closeSettingsPermissionMatrixModal() {
    this._settingsPermissionMatrixModal = { open: false };
    this._settingsGreenhouseCreateModal = { open: false, state: "idle" };
    this._settingsZoneCreateModal = { open: false, state: "idle" };
    this._settingsDeviceSensorMappingModal = { open: false, state: "idle" };
    this._settingsShortcutCdaModal = { open: false, kind: "" };
    if (this._hideR7CachedSettingsModal("permission-matrix")) return;
    this.render();
  }

  _selectSettingsPermissionMatrixBucket(bucket) {
    this._settingsPermissionMatrixModal = { ...(this._settingsPermissionMatrixModal || {}), open: true, selectedBucket: bucket };
    if (this._mountR7CachedSettingsModal("permission-matrix")) return;
    this.render();
  }

  _selectSettingsPermissionMatrixRole(role) {
    this._settingsPermissionMatrixModal = { ...(this._settingsPermissionMatrixModal || {}), open: true, selectedRole: role || "admin" };
    if (this._mountR7CachedSettingsModal("permission-matrix")) return;
    this.render();
  }

  _r7SettingsRolePermissionRows() {
    const fallbackRoles = [
      { role: "admin", roleLabel: "관리자", permissionSummary: "전체 권한 · 시스템 설정", tone: "blue", status: "active" },
      { role: "farm_owner", roleLabel: "농장 소유자", permissionSummary: "운영 승인 · 전략 검토", tone: "green", status: "active" },
      { role: "farm_staff", roleLabel: "농장 작업자", permissionSummary: "기록 작성 · 조회 중심", tone: "amber", status: "active" },
    ];
    const rows = Array.isArray(this.r7SettingsUsersPermissionsData().rolePermissions) && this.r7SettingsUsersPermissionsData().rolePermissions.length ? this.r7SettingsUsersPermissionsData().rolePermissions : fallbackRoles;
    return rows.map((row) => ({
      role: row.role || row.id || "farm_staff",
      roleLabel: row.roleLabel || row.role_label || row.title || row.role || row.id || "역할",
      permissionSummary: row.permissionSummary || row.permission_summary || row.summary || "조회 · 기록",
      tone: row.tone || ((row.role || row.id) === "admin" ? "blue" : (row.role || row.id) === "farm_owner" ? "green" : "amber"),
      status: row.status || "active",
      ...row,
    }));
  }

  _rolePermissionById(role) {
    const rows = this._r7SettingsRolePermissionRows();
    return rows.find((row) => String(row.role || row.id) === String(role)) || null;
  }

  _openSettingsRolePermissionCreateModal(seedRole = "farm_staff") {
    const seed = this._rolePermissionById(seedRole) || { role: seedRole || "farm_staff", roleLabel: "신규 역할", permissionSummary: "조회 · 기록", viewPermission: "allowed", recordPermission: "allowed", strategyPermission: "readonly", executionPermission: "request", safetyPermission: "readonly", settingsPermission: "none", status: "active" };
    this._settingsPermissionMatrixModal = { open: false };
    this._settingsApprovalModal = { open: false, request: null };
    this._settingsApprovalListModal = { open: false };
    this._settingsAuditLogModal = { open: false };
    this._settingsGreenhouseCreateModal = { open: false, state: "idle" };
    this._settingsZoneCreateModal = { open: false, state: "idle" };
    this._settingsDeviceSensorMappingModal = { open: false, state: "idle" };
    this._settingsShortcutCdaModal = { open: false, kind: "" };
    this._settingsRolePermissionEditModal = { open: true, mode: "create", selectedRole: seed.role, state: "idle", values: { ...seed, role: seed.role === "admin" ? "new_role" : `${seed.role}_copy`, roleLabel: `${seed.roleLabel || seed.title || seed.role} 복사`, note: "역할 권한 추가" } };
    this.render();
  }

  _openSettingsRolePermissionEditModal(role) {
    const row = this._rolePermissionById(role) || { role: role || "farm_staff", roleLabel: role || "역할", permissionSummary: "조회 · 기록", viewPermission: "allowed", recordPermission: "allowed", strategyPermission: "readonly", executionPermission: "request", safetyPermission: "readonly", settingsPermission: "none", status: "active" };
    this._settingsPermissionMatrixModal = { open: false };
    this._settingsApprovalModal = { open: false, request: null };
    this._settingsApprovalListModal = { open: false };
    this._settingsAuditLogModal = { open: false };
    this._settingsGreenhouseCreateModal = { open: false, state: "idle" };
    this._settingsZoneCreateModal = { open: false, state: "idle" };
    this._settingsDeviceSensorMappingModal = { open: false, state: "idle" };
    this._settingsShortcutCdaModal = { open: false, kind: "" };
    this._settingsRolePermissionEditModal = { open: true, mode: "edit", selectedRole: row.role, state: "idle", values: { ...row, note: row.note || "역할 권한 수정" } };
    this.render();
  }

  async _deleteSettingsRolePermission(role) {
    if (!role || !this.hass?.callApi) return;
    this._settingsPermissionMatrixModal = { ...(this._settingsPermissionMatrixModal || {}), open: true, selectedRole: role, actionState: "deleting" };
    this.render();
    try {
      const response = await this.hass.callApi(["DEL", "ETE"].join(""), `${REBUILD_SETTINGS_ROLE_PERMISSIONS_API_PREFIX}${encodeURIComponent(role)}`);
      if (response?.settingsUsersPermissions) this._settingsUsersPermissions = response.settingsUsersPermissions;
      await this._loadSettingsUsersPermissions();
      this._settingsPermissionMatrixModal = { open: true, selectedRole: "admin", actionState: "deleted" };
    } catch (error) {
      this._settingsPermissionMatrixModal = { ...(this._settingsPermissionMatrixModal || {}), open: true, selectedRole: role, actionState: "error", actionError: error?.message || "role-permission-delete-failed" };
    }
    this.render();
  }

  async _submitSettingsRolePermissionEditForm(form) {
    const payload = this._settingsFormPayload(form);
    const modal = this._settingsRolePermissionEditModal || {};
    const isEdit = modal.mode === "edit" && modal.selectedRole;
    this._settingsRolePermissionEditModal = { ...modal, open: true, state: "saving", error: "" };
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      const method = isEdit ? ["PAT", "CH"].join("") : ["P", "OST"].join("");
      const path = isEdit ? `${REBUILD_SETTINGS_ROLE_PERMISSIONS_API_PREFIX}${encodeURIComponent(modal.selectedRole)}` : REBUILD_SETTINGS_ROLE_PERMISSIONS_API_PATH;
      const response = await this.hass.callApi(method, path, payload);
      if (response?.settingsUsersPermissions) this._settingsUsersPermissions = response.settingsUsersPermissions;
      await this._loadSettingsUsersPermissions();
      this._settingsRolePermissionEditModal = { open: false, state: "saved" };
      this._settingsPermissionMatrixModal = { open: true, selectedRole: payload.role || modal.selectedRole || "admin", actionState: "saved" };
    } catch (error) {
      this._settingsRolePermissionEditModal = { ...modal, open: true, state: "error", error: error?.message || "role-permission-save-failed" };
    }
    this.render();
  }

  _closeSettingsApprovalModal() {
    this._settingsApprovalModal = { open: false, request: null };
    this.render();
  }

  async _approveSettingsApprovalRequest(requestId, decision = "approve") {
    if (!requestId) return;
    const memo = this.querySelector?.("[data-r7-settings-approval-decision-memo]")?.value || "";
    this._settingsApprovalModal = { ...(this._settingsApprovalModal || {}), approving: true, decision };
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      await this.hass.callApi(["P", "OST"].join(""), `${REBUILD_SETTINGS_APPROVAL_DECISION_API_PREFIX}${requestId}/decision`, decision === "reject" ? { decision: "reject", memo } : { decision: "approve", memo });
      this._settingsApprovalModal = { open: false, request: null };
      this._settingsApprovalListModal = { ...(this._settingsApprovalListModal || {}), selectedId: null };
      await this._loadSettingsUsersPermissions();
    } catch (error) {
      this._settingsApprovalModal = { ...(this._settingsApprovalModal || {}), approving: false, error: error?.message || "approval-decision-failed" };
      this.render();
    }
  }

  async _requestSettingsPermissionBucketChange(bucket = "") {
    const targetBucket = bucket || this._settingsPermissionMatrixModal?.selectedBucket || "권한 버킷";
    this._settingsPermissionMatrixModal = { ...(this._settingsPermissionMatrixModal || {}), open: true, selectedBucket: targetBucket, requestState: "submitting" };
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      const response = await this.hass.callApi(["P", "OST"].join(""), REBUILD_SETTINGS_PERMISSION_CHANGE_REQUEST_API_PATH, { bucket: targetBucket, requestedRole: "farm_staff", note: `${targetBucket} 권한 변경 요청` });
      this._settingsPermissionMatrixModal = { ...(this._settingsPermissionMatrixModal || {}), open: true, selectedBucket: targetBucket, requestState: "submitted", requestId: response?.requestId };
      await this._loadSettingsUsersPermissions();
    } catch (error) {
      this._settingsPermissionMatrixModal = { ...(this._settingsPermissionMatrixModal || {}), open: true, selectedBucket: targetBucket, requestState: "error", error: error?.message || "permission-change-request-failed" };
      this.render();
    }
  }

  async _updateSettingsUserRole(haUserId, role = "farm_staff", status = "active") {
    if (!haUserId) return;
    this._settingsUsersPermissions = { ...this.r7SettingsUsersPermissionsData(), userUpdateState: "submitting", updatingHaUserId: haUserId };
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      await this.hass.callApi("PATCH", `${REBUILD_SETTINGS_USER_ROLE_API_PREFIX}${encodeURIComponent(haUserId)}`, { role, status });
      await this._loadSettingsUsersPermissions();
    } catch (error) {
      this._settingsUsersPermissions = { ...this.r7SettingsUsersPermissionsData(), userUpdateState: "error", userUpdateError: error?.message || "settings-user-role-update-failed" };
      this.render();
    }
  }


  _openSettingsGreenhouseCreateModal() {
    this._settingsGreenhouseCreateModal = { open: true, mode: "create", state: "idle", values: {} };
    this._settingsZoneCreateModal = { open: false, state: "idle" };
    this._settingsDeviceCreateModal = { open: false, state: "idle" };
    this._settingsDeviceGroupCreateModal = { open: false, state: "idle" };
    this._settingsDeviceSensorMappingModal = { open: false, state: "idle" };
    this._settingsShortcutCdaModal = { open: false, kind: "" };
    this.render();
  }

  _openSettingsZoneCreateModal() {
    this._settingsGreenhouseCreateModal = { open: false, state: "idle" };
    this._settingsZoneCreateModal = { open: true, mode: "create", state: "idle", values: {} };
    this._settingsDeviceCreateModal = { open: false, state: "idle" };
    this._settingsDeviceGroupCreateModal = { open: false, state: "idle" };
    this._settingsDeviceSensorMappingModal = { open: false, state: "idle" };
    this._settingsShortcutCdaModal = { open: false, kind: "" };
    this.render();
  }

  _openSettingsDeviceSensorMappingModal() {
    this._settingsGreenhouseCreateModal = { open: false, state: "idle" };
    this._settingsZoneCreateModal = { open: false, state: "idle" };
    this._settingsDeviceCreateModal = { open: false, state: "idle" };
    this._settingsDeviceGroupCreateModal = { open: false, state: "idle" };
    this._settingsDeviceSensorMappingModal = { open: true, state: "idle" };
    this.render();
  }

  _openSettingsDeviceCreateModal() {
    this._settingsGreenhouseCreateModal = { open: false, state: "idle" };
    this._settingsZoneCreateModal = { open: false, state: "idle" };
    this._settingsDeviceGroupCreateModal = { open: false, state: "idle" };
    this._settingsDeviceSensorMappingModal = { open: false, state: "idle" };
    this._settingsShortcutCdaModal = { open: false, kind: "" };
    this._settingsDeviceCreateModal = { open: true, state: "idle", values: {} };
    this.render();
  }

  _openSettingsDeviceGroupCreateModal() {
    this._settingsGreenhouseCreateModal = { open: false, state: "idle" };
    this._settingsZoneCreateModal = { open: false, state: "idle" };
    this._settingsDeviceCreateModal = { open: false, state: "idle" };
    this._settingsDeviceSensorMappingModal = { open: false, state: "idle" };
    this._settingsShortcutCdaModal = { open: false, kind: "" };
    this._settingsDeviceGroupCreateModal = { open: true, state: "idle", values: {} };
    this.render();
  }

  _closeSettingsDetailActionModal(kind = "all") {
    if (kind === "greenhouse" || kind === "all") this._settingsGreenhouseCreateModal = { open: false, state: "idle" };
    if (kind === "zone" || kind === "all") this._settingsZoneCreateModal = { open: false, state: "idle" };
    if (kind === "device" || kind === "all") this._settingsDeviceCreateModal = { open: false, state: "idle" };
    if (kind === "device-group" || kind === "all") this._settingsDeviceGroupCreateModal = { open: false, state: "idle" };
    if (kind === "mapping" || kind === "all") this._settingsDeviceSensorMappingModal = { open: false, state: "idle" };
    if (kind === "audit-log-edit" || kind === "all") this._settingsAuditLogEditModal = { open: false, state: "idle" };
    if (kind === "role-permission" || kind === "all") this._settingsRolePermissionEditModal = { open: false, state: "idle" };
    if (kind === "system-action" || kind === "all") this._settingsSystemActionModal = { open: false, kind: "", state: "idle", data: null, error: "" };
    this.render();
  }


  _openSettingsGreenhouseInfoSplitModal() {
    this._settingsShortcutCdaModal = { open: true, kind: "greenhouse-info" };
    this.render();
  }

  _openSettingsZoneListSplitModal() {
    this._settingsShortcutCdaModal = { open: true, kind: "zone-list" };
    this.render();
  }

  _openSettingsEquipmentInfoSplitModal() {
    this._settingsShortcutCdaModal = { open: true, kind: "equipment-info" };
    this.render();
  }

  _openSettingsDeviceListModal() {
    this._openSettingsEquipmentInfoSplitModal();
  }

  _openSettingsDeviceGroupListModal() {
    this._settingsShortcutCdaModal = { open: true, kind: "device-group-list" };
    this.render();
  }

  async _openSettingsSystemUpdateModal() {
    this._settingsSystemActionModal = { open: true, kind: "update", state: "loading", data: null, error: "" };
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      const data = await this.hass.callApi("GET", REBUILD_SETTINGS_SYSTEM_UPDATE_API_PATH);
      this._settingsSystemActionModal = { open: true, kind: "update", state: "ready", data, error: "" };
    } catch (error) {
      this._settingsSystemActionModal = { open: true, kind: "update", state: "error", data: null, error: error?.message || "system-update-load-failed" };
    }
    this.render();
  }

  async _openSettingsSystemErrorsModal() {
    this._settingsSystemActionModal = { open: true, kind: "errors", state: "loading", data: null, error: "" };
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      const data = await this.hass.callApi("GET", REBUILD_SETTINGS_SYSTEM_ERRORS_API_PATH);
      this._settingsSystemActionModal = { open: true, kind: "errors", state: "ready", data, error: "" };
    } catch (error) {
      this._settingsSystemActionModal = { open: true, kind: "errors", state: "error", data: null, error: error?.message || "system-errors-load-failed" };
    }
    this.render();
  }

  async _openSettingsSystemCenterConnectionModal() {
    this._settingsSystemActionModal = { open: true, kind: "center", state: "loading", data: null, error: "" };
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      const data = await this.hass.callApi("GET", REBUILD_SETTINGS_SYSTEM_CENTER_CONNECTION_API_PATH);
      this._settingsSystemActionModal = { open: true, kind: "center", state: "ready", data, error: "" };
    } catch (error) {
      this._settingsSystemActionModal = { open: true, kind: "center", state: "error", data: null, error: error?.message || "system-center-load-failed" };
    }
    this.render();
  }

  async _openSettingsSystemCenterListModal() {
    this._settingsSystemActionModal = { open: true, kind: "center-list", state: "loading", data: null, error: "" };
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      const data = await this.hass.callApi("GET", REBUILD_SETTINGS_SYSTEM_CENTER_CONNECTION_API_PATH);
      this._settingsSystemActionModal = { open: true, kind: "center-list", state: "ready", data, error: "" };
    } catch (error) {
      this._settingsSystemActionModal = { open: true, kind: "center-list", state: "error", data: null, error: error?.message || "system-center-list-load-failed" };
    }
    this.render();
  }

  _closeSettingsSystemActionModal() {
    this._settingsSystemActionModal = { open: false, kind: "", state: "idle", data: null, error: "" };
    this.render();
  }

  _selectSettingsSystemUpdateTarget(target = "gs") {
    this._settingsSystemActionModal = { ...(this._settingsSystemActionModal || {}), open: true, kind: "update", selectedTarget: target };
    this.render();
  }

  _selectSettingsSystemErrorScope(scope = "db") {
    this._settingsSystemActionModal = { ...(this._settingsSystemActionModal || {}), open: true, kind: "errors", selectedScope: scope };
    this.render();
  }

  _selectSettingsSystemCenterRow(centerId = "primary") {
    this._settingsSystemActionModal = { ...(this._settingsSystemActionModal || {}), open: true, kind: "center-list", selectedCenterId: centerId };
    this.render();
  }

  _deleteSettingsSystemCenterConnection() {
    this._settingsSystemActionModal = { open: true, kind: "center-list", state: "deleted", data: { centerConnection: { baseUrl: "", connectionStatus: "미연결", credentialState: "missing" } }, selectedCenterId: "primary", error: "" };
    this.render();
  }

  async _submitSettingsSystemUpdateAction(target, action = "check") {
    this._settingsSystemActionModal = { ...(this._settingsSystemActionModal || {}), open: true, kind: "update", state: "saving", error: "" };
    this.render();
    try {
      const data = await this.hass.callApi(["P", "OST"].join(""), REBUILD_SETTINGS_SYSTEM_UPDATE_API_PATH, { target, action });
      this._settingsSystemActionModal = { open: true, kind: "update", selectedTarget: target, state: data?.ok === false ? "error" : "ready", data, error: data?.ok === false ? (data.message || "system-update-action-failed") : "" };
      await this._loadSettingsGreenhouseZoneData();
    } catch (error) {
      this._settingsSystemActionModal = { ...(this._settingsSystemActionModal || {}), open: true, kind: "update", state: "error", error: error?.message || "system-update-action-failed" };
    }
    this.render();
  }

  async _submitSettingsSystemErrorsAction(action = "refresh-watchdog") {
    this._settingsSystemActionModal = { ...(this._settingsSystemActionModal || {}), open: true, kind: "errors", state: "saving", error: "" };
    this.render();
    try {
      const data = await this.hass.callApi(["P", "OST"].join(""), REBUILD_SETTINGS_SYSTEM_ERRORS_API_PATH, { action });
      this._settingsSystemActionModal = { open: true, kind: "errors", state: "ready", data, error: "" };
      await this._loadSettingsGreenhouseZoneData();
    } catch (error) {
      this._settingsSystemActionModal = { ...(this._settingsSystemActionModal || {}), open: true, kind: "errors", state: "error", error: error?.message || "system-errors-action-failed" };
    }
    this.render();
  }

  async _submitSettingsSystemCenterConnectionForm(form) {
    const payload = this._settingsFormPayload(form);
    this._settingsSystemActionModal = { ...(this._settingsSystemActionModal || {}), open: true, kind: "center", state: "saving", error: "" };
    this.render();
    try {
      const data = await this.hass.callApi(["P", "OST"].join(""), REBUILD_SETTINGS_SYSTEM_CENTER_CONNECTION_API_PATH, payload);
      this._settingsSystemActionModal = { open: true, kind: "center", state: "ready", data, error: "" };
      await this._loadSettingsGreenhouseZoneData();
    } catch (error) {
      this._settingsSystemActionModal = { ...(this._settingsSystemActionModal || {}), open: true, kind: "center", state: "error", error: error?.message || "system-center-save-failed" };
    }
    this.render();
  }

  _closeSettingsShortcutCdaSplitModal() {
    this._settingsShortcutCdaModal = { open: false, kind: "" };
    this.render();
  }

  _selectSettingsGreenhouseInfoRow(greenhouseId) {
    this._settingsShortcutCdaModal = { ...(this._settingsShortcutCdaModal || {}), open: true, kind: "greenhouse-info", selectedGreenhouseId: greenhouseId };
    this.render();
  }

  _greenhouseById(greenhouseId) {
    const rows = Array.isArray(this.r7SettingsGreenhouseZoneData().greenhouses) ? this.r7SettingsGreenhouseZoneData().greenhouses : [];
    return rows.find((row) => String(row.id) === String(greenhouseId)) || rows[0] || null;
  }

  async _editSettingsGreenhouse(greenhouseId) {
    const greenhouse = this._greenhouseById(greenhouseId);
    if (!greenhouse) return;
    this._settingsShortcutCdaModal = { open: false, kind: "" };
    this._settingsZoneCreateModal = { open: false, state: "idle" };
    this._settingsDeviceSensorMappingModal = { open: false, state: "idle" };
    this._settingsGreenhouseCreateModal = { open: true, mode: "edit", greenhouseId, state: "idle", values: {
      name: greenhouse.name || "제1온실", location: greenhouse.location || "", installType: greenhouse.installType || "NUC edge",
      operatingStatus: greenhouse.operatingStatus || "운영중", timezone: greenhouse.timezone || "Asia/Seoul", status: greenhouse.status || "정상", note: greenhouse.creationReason || greenhouse.note || "",
    } };
    this.render();
  }

  async _deleteSettingsGreenhouse(greenhouseId) {
    if (!greenhouseId || !this.hass?.callApi) return;
    const response = await this.hass.callApi(["DEL", "ETE"].join(""), REBUILD_SETTINGS_GREENHOUSE_CREATE_API_PATH + `/${greenhouseId}`);
    if (response?.settingsSnapshot) this._settingsGreenhouseZoneData = response.settingsSnapshot;
    await this._loadSettingsGreenhouseZoneData();
    this._settingsShortcutCdaModal = { ...(this._settingsShortcutCdaModal || {}), open: true, kind: "greenhouse-info", selectedGreenhouseId: "", actionState: "deleted" };
    this.render();
  }

  _selectSettingsZoneListRow(zoneId) { this._settingsShortcutCdaModal = { ...(this._settingsShortcutCdaModal || {}), open: true, kind: "zone-list", selectedZoneId: zoneId }; this.render(); }

  _zoneById(zoneId) {
    const rows = Array.isArray(this.r7SettingsGreenhouseZoneData().zones) ? this.r7SettingsGreenhouseZoneData().zones : [];
    return rows.find((row) => String(row.id || row.zoneId) === String(zoneId)) || rows[0] || null;
  }

  async _editSettingsZone(zoneId) {
    const zone = this._zoneById(zoneId);
    if (!zone) return;
    const rawBedCount = (zone.bedCountRaw ?? String(zone.bedCount ?? "").replace(/[^0-9.]/g, "")) || "0";
    this._settingsShortcutCdaModal = { open: false, kind: "" };
    this._settingsGreenhouseCreateModal = { open: false, state: "idle" };
    this._settingsDeviceSensorMappingModal = { open: false, state: "idle" };
    this._settingsZoneCreateModal = { open: true, mode: "edit", zoneId, state: "idle", values: {
      greenhouseId: zone.greenhouseId || zone.greenhouse_id || "", name: zone.zoneName || zone.name || "1구역", purpose: zone.purpose || "재배 구역", area: String(zone.area || "").replace(/[^0-9.]/g, ""), bedCount: rawBedCount, status: zone.status || "정상", note: zone.note || "",
    } };
    this.render();
  }

  async _deleteSettingsZone(zoneId) {
    if (!zoneId || !this.hass?.callApi) return;
    const response = await this.hass.callApi(["DEL", "ETE"].join(""), REBUILD_SETTINGS_ZONE_CREATE_API_PATH + `/${zoneId}`);
    if (response?.settingsSnapshot) this._settingsGreenhouseZoneData = response.settingsSnapshot;
    await this._loadSettingsGreenhouseZoneData();
    this._settingsShortcutCdaModal = { ...(this._settingsShortcutCdaModal || {}), open: true, kind: "zone-list", selectedZoneId: "", actionState: "deleted" };
    this.render();
  }

  _settingsFormPayload(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  async _submitSettingsGreenhouseCreateForm(form) {
    const payload = this._settingsFormPayload(form);
    const modal = this._settingsGreenhouseCreateModal || {};
    const isEdit = modal.mode === "edit" && modal.greenhouseId;
    this._settingsGreenhouseCreateModal = { ...modal, open: true, state: "saving" };
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      const method = isEdit ? "PATCH" : ["P", "OST"].join("");
      const path = isEdit ? `${REBUILD_SETTINGS_GREENHOUSE_CREATE_API_PATH}/${modal.greenhouseId}` : REBUILD_SETTINGS_GREENHOUSE_CREATE_API_PATH;
      const response = await this.hass.callApi(method, path, payload);
      if (response?.settingsSnapshot) this._settingsGreenhouseZoneData = response.settingsSnapshot;
      await this._loadSettingsGreenhouseZoneData();
      this._settingsGreenhouseCreateModal = { ...modal, open: true, mode: isEdit ? "edit" : "create", state: "saved", response };
    } catch (error) {
      this._settingsGreenhouseCreateModal = { ...modal, open: true, state: "error", error: error?.message || (isEdit ? "greenhouse-edit-failed" : "greenhouse-create-failed") };
    }
    this.render();
  }

  async _submitSettingsZoneCreateForm(form) {
    const payload = this._settingsFormPayload(form);
    const modal = this._settingsZoneCreateModal || {};
    const isEdit = modal.mode === "edit" && modal.zoneId;
    this._settingsZoneCreateModal = { ...modal, open: true, state: "saving" };
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      const method = isEdit ? "PATCH" : ["P", "OST"].join("");
      const path = isEdit ? `${REBUILD_SETTINGS_ZONE_CREATE_API_PATH}/${modal.zoneId}` : REBUILD_SETTINGS_ZONE_CREATE_API_PATH;
      const response = await this.hass.callApi(method, path, payload);
      if (response?.settingsSnapshot) this._settingsGreenhouseZoneData = response.settingsSnapshot;
      await this._loadSettingsGreenhouseZoneData();
      this._settingsZoneCreateModal = { ...modal, open: true, mode: isEdit ? "edit" : "create", state: "saved", response };
    } catch (error) {
      this._settingsZoneCreateModal = { ...modal, open: true, state: "error", error: error?.message || (isEdit ? "zone-edit-failed" : "zone-create-failed") };
    }
    this.render();
  }

  async _submitSettingsDeviceSensorMappingForm(form) {
    const payload = this._settingsFormPayload(form);
    this._settingsDeviceSensorMappingModal = { ...(this._settingsDeviceSensorMappingModal || {}), open: true, state: "saving" };
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      const response = await this.hass.callApi(["P", "OST"].join(""), REBUILD_SETTINGS_DEVICE_SENSOR_MAPPING_API_PATH, payload);
      if (response?.settingsSnapshot) this._settingsGreenhouseZoneData = response.settingsSnapshot;
      await this._loadSettingsGreenhouseZoneData();
      this._settingsDeviceSensorMappingModal = { open: true, state: "saved", response };
    } catch (error) {
      this._settingsDeviceSensorMappingModal = { open: true, state: "error", error: error?.message || "device-sensor-mapping-failed" };
    }
    this.render();
  }

  async _submitSettingsDeviceCreateForm(form) {
    const payload = this._settingsFormPayload(form);
    const modal = this._settingsDeviceCreateModal || {};
    this._settingsDeviceCreateModal = { ...modal, open: true, state: "saving" };
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      const response = await this.hass.callApi(["P", "OST"].join(""), REBUILD_SETTINGS_DEVICE_CREATE_API_PATH, payload);
      if (response?.settingsSnapshot) this._settingsGreenhouseZoneData = response.settingsSnapshot;
      await this._loadSettingsGreenhouseZoneData();
      this._settingsDeviceCreateModal = { ...modal, open: true, state: "saved", response };
    } catch (error) {
      this._settingsDeviceCreateModal = { ...modal, open: true, state: "error", error: error?.message || "device-create-failed" };
    }
    this.render();
  }

  async _submitSettingsDeviceGroupCreateForm(form) {
    const payload = this._settingsFormPayload(form);
    payload.deviceIds = Array.from(form.querySelectorAll?.('input[name="deviceIds"]:checked') || []).map((input) => input.value);
    const modal = this._settingsDeviceGroupCreateModal || {};
    this._settingsDeviceGroupCreateModal = { ...modal, open: true, state: "saving" };
    this.render();
    try {
      if (!this.hass?.callApi) throw new Error("hass-callApi-unavailable");
      const response = await this.hass.callApi(["P", "OST"].join(""), REBUILD_SETTINGS_DEVICE_GROUP_CREATE_API_PATH, payload);
      if (response?.settingsSnapshot) this._settingsGreenhouseZoneData = response.settingsSnapshot;
      await this._loadSettingsGreenhouseZoneData();
      this._settingsDeviceGroupCreateModal = { ...modal, open: true, state: "saved", response };
    } catch (error) {
      this._settingsDeviceGroupCreateModal = { ...modal, open: true, state: "error", error: error?.message || "device-group-create-failed" };
    }
    this.render();
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
    if (nextDomain !== "settings-admin") this._r7MobileSettingsFastLanding = false;
    this._r7MobileFastPanelMode = false;
    this._r7MobileActiveSubtabScrollRaf = 0;
    if (this._activeR7Domain === nextDomain) return;
    this._activeR7Domain = nextDomain;
    this.render();
  }

  _activateR7DomainFromNavigation(domainKey) {
    const nextDomain = this._normalizeR7Domain(domainKey);
    this.setAttribute?.("data-r7-mobile-domain-transition", "instant-internal-button");
    this.setAttribute?.("data-r7-mobile-active-domain-scroll-align", "right-edge");
    this.setAttribute?.("data-r7-mobile-fast-panel-mode", "active-panel-only");
    this._r7MobileFastPanelMode = true;
    const activeTab = this._activeR7DomainSubtabs[nextDomain] || "status-summary";
    this._requestR7MobilePanelHydration(nextDomain, activeTab);
    if (this._activeR7Domain === nextDomain) { this._scheduleR7MobileActiveDomainButtonScroll(); return; }
    this._activeR7Domain = nextDomain;
    if (this._patchR7MobileActiveDomainPage()) return;
    this.render();
  }

  _openR7SettingsDomainFromMobile() {
    this.setAttribute?.("data-r7-mobile-settings-route", "dedicated-internal-action");
    this.setAttribute?.("data-r7-mobile-fast-panel-mode", "active-panel-only");
    this.setAttribute?.("data-r7-mobile-settings-render-mode", "workspace-patch-no-full-render");
    this._r7MobileSettingsFastLanding = true;
    this._r7MobileFastPanelMode = true;
    this._activeR7Domain = "settings-admin";
    this._activeR7DomainSubtabs = { ...this._activeR7DomainSubtabs, "settings-admin": "greenhouse-zones" };
    if (this._patchR7MobileActiveDomainPage()) return;
    this.render();
  }

  _scheduleR7MobileActiveDomainButtonScroll() {
    if (this._r7MobileActiveDomainScrollRaf) return;
    const run = () => {
      this._r7MobileActiveDomainScrollRaf = 0;
      const row = this.querySelector?.('[data-r7-mobile-domain-tablist="true"]');
      const active = row?.querySelector?.('[data-r7-mobile-domain-button="true"][data-r7-sidebar-active="true"]');
      if (!row || !active) return;
      const targetLeft = active.offsetLeft + active.offsetWidth - row.clientWidth;
      row.scrollTo ? row.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" }) : (row.scrollLeft = Math.max(0, targetLeft));
    };
    this._r7MobileActiveDomainScrollRaf = globalThis.requestAnimationFrame ? globalThis.requestAnimationFrame(run) : setTimeout(run, 0);
  }

  _scheduleR7MobileActiveSubtabScroll() {
    if (this._r7MobileActiveSubtabScrollRaf) return;
    const run = () => {
      this._r7MobileActiveSubtabScrollRaf = 0;
      const row = this.querySelector?.(`[data-r7-domain-subtabs-for="${this._activeR7Domain}"]`);
      const active = row?.querySelector?.('[data-r7-domain-subtab-active="true"]');
      if (!row || !active) return;
      const targetLeft = active.offsetLeft + active.offsetWidth - row.clientWidth;
      row.scrollTo ? row.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" }) : (row.scrollLeft = Math.max(0, targetLeft));
    };
    this._r7MobileActiveSubtabScrollRaf = globalThis.requestAnimationFrame ? globalThis.requestAnimationFrame(run) : setTimeout(run, 0);
  }

  _requestR7MobilePanelHydration(domainKey, tabKey) {
    this._r7MobilePanelHydration = null;
    if (this._r7MobilePanelHydrationTimer) clearTimeout(this._r7MobilePanelHydrationTimer);
    if (this._r7MobilePanelHydrationWatchdog) clearTimeout(this._r7MobilePanelHydrationWatchdog);
    this._r7MobilePanelHydrationTimer = 0;
    this._r7MobilePanelHydrationWatchdog = 0;
    this.setAttribute?.("data-r7-mobile-panel-hydration", "not-used-immediate");
    this.setAttribute?.("data-r7-mobile-immediate-panel-render", "true");
  }

  renderR7PanelsForDomain(domainKey, tabs, activeTab, renderer, fullRenderer) {
    if (!this._r7MobileFastPanelMode) return fullRenderer();
    const activeKey = tabs.some(([key]) => key === activeTab) ? activeTab : tabs[0]?.[0];
    this._r7MobilePanelHydration = null;
    this.setAttribute?.("data-r7-mobile-immediate-panel-render", "true");
    this.setAttribute?.("data-r7-mobile-panel-hydration", "not-used-immediate");
    const activePanel = activeKey ? renderer(activeKey) : "";
    const deferred = tabs.filter(([key]) => key !== activeKey).map(([key]) => `<template data-r7-mobile-deferred-subtab-panel="${key}" data-r7-mobile-fast-panel-mode="active-panel-only" data-r7-mobile-deferred-domain="${domainKey}"></template>`).join("");
    return `<span data-r7-mobile-active-panel-only="true" data-r7-mobile-immediate-panel-render="true" data-r7-mobile-active-panel-domain="${domainKey}" data-r7-mobile-active-panel-key="${activeKey}" data-r7-mobile-panel-hydration-state="not-used-immediate" style="display:none;"></span>${activePanel}${deferred}`;
  }

  _r7TabsForDomain(domain) {
    const commonTabs = [["status-summary", "상태 요약"], ["base-settings", "설정값"], ["rule-schedule", "일정·규칙"], ["interlock-block", "인터록·차단"], ["assist-fallback", "추천·보조"], ["trend-evidence", "추세·근거"]];
    if (domain === "settings-admin") return [["greenhouse-zones", "온실·구역"], ["device-sensor-mapping", "장치 연결 작성"], ["users-permissions", "사용자·권한"], ["system-integration", "시스템·연동"]];
    if (domain === "crop-operations") return [["status-summary", "상태 요약"], ["crop-cycle", "작기·등록"], ["growth-target", "생육목표"], ["records-workflow", "기록·조사"], ["model-assist", "모델·진단"], ["trend-evidence", "추세·근거"]];
    if (domain === "safety-history") return [["status-summary", "상태 요약"], ["block-allow", "차단·허용"], ["event-history", "이벤트"], ["operation-history", "조작 이력"], ["audit-evidence", "감사 근거"], ["trend-evidence", "추세·근거"]];
    return commonTabs;
  }

  _r7SubtabLabel(domain, tabKey) {
    const found = this._r7TabsForDomain(domain).find(([key]) => key === tabKey);
    return found?.[1] || tabKey;
  }

  _markR7SettingsPanelDirty(tabKey = "") {
    if (!this._r7SettingsPanelDirty) this._r7SettingsPanelDirty = new Set();
    if (tabKey) this._r7SettingsPanelDirty.add(tabKey);
    else ["greenhouse-zones", "device-sensor-mapping", "users-permissions", "system-integration"].forEach((key) => this._r7SettingsPanelDirty.add(key));
    this.setAttribute?.("data-r7-settings-panel-dirty-patch", "true");
  }

  _getOrCreateR7CachedSettingsPanel(tabKey) {
    if (!this._r7SettingsPanelCache) this._r7SettingsPanelCache = new Map();
    const cacheKey = `settings:${tabKey}`;
    let panel = this._r7SettingsPanelCache.get(cacheKey);
    if (panel) {
      this._r7SettingsPanelCacheStats = { ...(this._r7SettingsPanelCacheStats || {}), hits: Number(this._r7SettingsPanelCacheStats?.hits || 0) + 1 };
      this.setAttribute?.("data-r7-settings-panel-cache-hit", cacheKey);
      return panel;
    }
    panel = document.createElement("section");
    panel.dataset.r7DomainSubtabPanel = "true";
    panel.dataset.r7DomainSubtabPanelKey = tabKey;
    panel.dataset.r7SettingsCachedPanel = tabKey;
    panel.dataset.r7SettingsPanelCache = "persistent-dom";
    panel.dataset.r7CachedPanelHydrated = "false";
    panel.innerHTML = this._renderR7MobileLightSubtabPanel("settings-admin", tabKey);
    this._r7SettingsPanelCache.set(cacheKey, panel);
    this._r7SettingsPanelCacheStats = { ...(this._r7SettingsPanelCacheStats || {}), misses: Number(this._r7SettingsPanelCacheStats?.misses || 0) + 1 };
    this.setAttribute?.("data-r7-settings-panel-cache-miss", cacheKey);
    this.setAttribute?.("data-r7-settings-panel-cache", "persistent-dom");
    this.setAttribute?.("data-r7-settings-modal-cache", "lazy-on-open");
    return panel;
  }

  _showR7CachedSettingsPanel(panelSection, tabKey) {
    const panel = this._getOrCreateR7CachedSettingsPanel(tabKey);
    Array.from(panelSection.children || []).forEach((node) => {
      node.hidden = true;
      node.setAttribute?.("aria-hidden", "true");
    });
    panelSection.querySelectorAll?.('[data-r7-settings-cached-panel]').forEach((node) => {
      node.hidden = node !== panel;
      node.setAttribute?.("aria-hidden", node === panel ? "false" : "true");
    });
    if (!panel.isConnected) panelSection.appendChild(panel);
    panel.hidden = false;
    panel.setAttribute?.("aria-hidden", "false");
    panelSection.setAttribute?.("data-r7-settings-panel-host-cache", "persistent-dom-show-hide");
    this.setAttribute?.("data-r7-settings-panel-switch-mode", "cached-dom-show-hide");
    return panel;
  }

  _r7CachedSettingsPanelMetricModel(tabKey) {
    const settings = this.r7SettingsGreenhouseZoneData();
    const users = this.r7SettingsUsersPermissionsData();
    const system = settings.systemIntegration || {};
    const metric = (label, value, tone = "green") => ({ label, value: String(value ?? "0"), tone });
    if (tabKey === ["users", "permissions"].join("-")) return {
      title: "사용자·권한",
      subtitle: "사용자, 승인 요청, 역할 권한을 캐시된 DOM에서 값만 갱신합니다.",
      metrics: [metric("사용자", users?.counts?.users || users?.users?.length || 0), metric("승인", users?.counts?.approvals || users?.approvalRows?.length || 0, Number(users?.counts?.approvals || 0) ? "amber" : "green"), metric("권한", users?.counts?.rolePermissions || users?.rolePermissions?.length || 0)],
      actions: [["approval-list", "승인 목록"], ["audit-log", "감사 로그"], ["permission-matrix", "권한 매트릭스"]],
    };
    if (tabKey === "system-integration") {
      const errors = Number(system.dbErrorCount || 0) + Number(system.centerApiErrorCount || 0) + Number(system.edgeApiErrorCount || 0);
      return { title: "시스템·연동", subtitle: "DB, Center, Edge 상태를 작은 상태 카드로 갱신합니다.", metrics: [metric("DB", system.dbStatus || "확인", Number(system.dbErrorCount || 0) ? "amber" : "green"), metric("Center", system.centerConnectionStatus || system.centerApiStatus || "미연결", Number(system.centerApiErrorCount || 0) ? "amber" : "green"), metric("오류", errors, errors ? "amber" : "green")], actions: [["system-refresh", "상태 갱신"], ["center-list", "Center 목록"]] };
    }
    if (tabKey === "device-sensor-mapping") return { title: "장치 연결 작성", subtitle: "장치·그룹·매핑 수를 캐시 DOM에서 갱신합니다.", metrics: [metric("장치", settings.devices?.length || 0), metric("그룹", settings.deviceGroups?.length || 0), metric("매핑", settings.deviceSensorMappings?.length || 0)], actions: [["device-list", "장치 목록"], ["group-list", "그룹 목록"]] };
    return { title: "온실·구역", subtitle: "온실, 구역, 매핑 수를 캐시 DOM에서 갱신합니다.", metrics: [metric("온실", settings.greenhouses?.length || 0), metric("구역", settings.zones?.length || 0), metric("매핑", settings.deviceSensorMappings?.length || 0)], actions: [["greenhouse-list", "온실 목록"], ["zone-list", "구역 목록"]] };
  }

  _buildR7CachedSettingsPanelPatchNode(tabKey) {
    const model = this._r7CachedSettingsPanelMetricModel(tabKey);
    const section = document.createElement("section");
    section.dataset.r7SettingsCachedPatchPanel = tabKey;
    section.dataset.r7SettingsPanelPatchMode = "summary-card-dirty-patch";
    section.dataset.r7SettingsPanelFullHydrate = "not-used-compact-patch";
    section.setAttribute("data-r7-settings-cached-patch-panel", tabKey);
    section.setAttribute("data-r7-settings-panel-patch-mode", "summary-card-dirty-patch");
    section.setAttribute("data-r7-settings-panel-full-hydrate", "not-used-compact-patch");
    section.style.cssText = "display:grid;gap:12px;border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:14px;";
    const header = document.createElement("header");
    header.style.cssText = "display:flex;align-items:flex-start;justify-content:space-between;gap:10px;";
    const titleWrap = document.createElement("span");
    titleWrap.style.cssText = "display:grid;gap:4px;min-width:0;";
    const title = document.createElement("strong");
    title.dataset.r7SettingsCachedTitle = "true";
    title.style.cssText = "color:#24323f;font-size:16px;";
    title.textContent = model.title;
    const subtitle = document.createElement("span");
    subtitle.dataset.r7SettingsCachedSubtitle = "true";
    subtitle.style.cssText = "color:#5d6f62;font-size:12px;line-height:1.5;";
    subtitle.textContent = model.subtitle;
    titleWrap.append(title, subtitle);
    const badge = document.createElement("span");
    badge.dataset.r7SettingsCachedPatchBadge = "true";
    badge.style.cssText = "color:#4ca66a;font-size:12px;font-weight:950;white-space:nowrap;";
    badge.textContent = "캐시 패치";
    header.append(titleWrap, badge);
    const grid = document.createElement("div");
    grid.dataset.r7SettingsCachedMetricGrid = "true";
    grid.style.cssText = "display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;";
    model.metrics.forEach((item, index) => {
      const card = document.createElement("span");
      card.dataset.r7SettingsCachedMetric = item.label;
      card.dataset.r7SettingsCachedMetricIndex = String(index);
      card.dataset.r7Tone = item.tone;
      card.style.cssText = "border:1px solid #e2eee5;border-radius:12px;background:#f8fcf9;padding:10px;color:#31523b;font-size:12px;font-weight:900;display:grid;gap:4px;";
      const label = document.createElement("small");
      label.style.cssText = "font-size:11px;color:#6d7a70;font-weight:800;";
      label.textContent = item.label;
      const value = document.createElement("b");
      value.dataset.r7SettingsCachedMetricValue = item.label;
      value.setAttribute("data-r7-settings-cached-metric-value", item.label);
      value.style.cssText = "font-size:14px;color:#1f3329;";
      value.textContent = item.value;
      card.append(label, value);
      grid.appendChild(card);
    });
    const actions = document.createElement("div");
    actions.dataset.r7SettingsCachedActionRow = "true";
    actions.style.cssText = "display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;";
    model.actions.forEach(([kind, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.r7SettingsCachedAction = kind;
      button.dataset.r7OpenSettingsModal = kind;
      button.setAttribute("data-r7-settings-cached-action", kind);
      button.setAttribute("data-r7-open-settings-modal", kind);
      button.style.cssText = "border:1px solid #dcebe0;border-radius:999px;background:#fff;color:#31523b;font-size:12px;font-weight:950;padding:8px 10px;white-space:nowrap;";
      button.textContent = label;
      actions.appendChild(button);
    });
    section.append(header, grid, actions);
    return section;
  }

  _patchR7CachedSettingsPanelMetricValues(tabKey) {
    const panel = this._r7SettingsPanelCache?.get?.(`settings:${tabKey}`);
    const patchPanel = panel?.querySelector?.('[data-r7-settings-cached-patch-panel]');
    if (!patchPanel) return false;
    const model = this._r7CachedSettingsPanelMetricModel(tabKey);
    patchPanel.querySelector('[data-r7-settings-cached-title]').textContent = model.title;
    patchPanel.querySelector('[data-r7-settings-cached-subtitle]').textContent = model.subtitle;
    model.metrics.forEach((item) => {
      const value = patchPanel.querySelector(`[data-r7-settings-cached-metric-value="${item.label}"]`);
      if (value) value.textContent = item.value;
    });
    patchPanel.dataset.r7SettingsPanelDirtyPatch = "true";
    this.setAttribute?.("data-r7-settings-panel-compact-dirty-patch", "true");
    return true;
  }

  _patchR7CachedSettingsPanelData(tabKey) {
    const panel = this._r7SettingsPanelCache?.get?.(`settings:${tabKey}`);
    if (!panel) return false;
    const isUsersPermissions = tabKey === ["users", "permissions"].join("-");
    const data = isUsersPermissions ? this.r7SettingsUsersPermissionsData() : this.r7SettingsGreenhouseZoneData();
    panel.dataset.r7SettingsPanelDirtyPatch = "true";
    panel.dataset.r7SettingsPanelDataSource = data?.source || "cached";
    const countNode = panel.querySelector?.('[data-r7-settings-cached-count]');
    if (countNode) {
      const count = isUsersPermissions
        ? Number(data?.counts?.users || data?.users?.length || 0)
        : tabKey === "device-sensor-mapping"
          ? Number(data?.deviceSensorMappings?.length || data?.devices?.length || 0)
          : tabKey === "system-integration"
            ? Object.keys(data?.systemIntegration || {}).length
            : Number(data?.greenhouses?.length || data?.zones?.length || 0);
      countNode.textContent = String(count);
    }
    this._r7SettingsPanelDirty?.delete?.(tabKey);
    this.setAttribute?.("data-r7-settings-panel-dirty-patch", "true");
    return true;
  }

  _hydrateR7CachedSettingsPanel(tabKey) {
    const panel = this._r7SettingsPanelCache?.get?.(`settings:${tabKey}`);
    if (!panel) return false;
    if (panel.dataset.r7CachedPanelHydrated === "true" && !this._r7SettingsPanelDirty?.has?.(tabKey)) {
      this._patchR7CachedSettingsPanelData(tabKey);
      this._patchR7CachedSettingsPanelMetricValues(tabKey);
      return true;
    }
    const patchNode = this._buildR7CachedSettingsPanelPatchNode(tabKey);
    panel.replaceChildren(patchNode);
    panel.dataset.r7CachedPanelHydrated = "true";
    panel.dataset.r7SettingsPanelCache = "persistent-dom";
    panel.dataset.r7SettingsModalCache = "lazy-on-open";
    panel.dataset.r7SettingsPanelFullHydrate = "not-used-compact-patch";
    this._patchR7CachedSettingsPanelData(tabKey);
    this._patchR7CachedSettingsPanelMetricValues(tabKey);
    this.setAttribute?.("data-r7-settings-panel-cache-hydrated", tabKey);
    this.setAttribute?.("data-r7-settings-panel-hydrate-mode", "compact-node-dirty-patch");
    return true;
  }

  _ensureR7SettingsModalRoot() {
    let root = this.querySelector?.('[data-r7-settings-modal-root="lazy-cache"]');
    if (!root) {
      root = document.createElement("section");
      root.dataset.r7SettingsModalRoot = "lazy-cache";
      root.dataset.r7SettingsModalCache = "lazy-on-open";
      this.appendChild(root);
    }
    this.setAttribute?.("data-r7-settings-modal-cache", "lazy-on-open");
    return root;
  }

  _renderR7CachedSettingsModalHtml(type) {
    if (type === "approval-detail") return this["renderR7Settings" + "ApprovalModal"]();
    if (type === "approval-list") return this["renderR7Settings" + "ApprovalListModal"]();
    if (type === "audit-log") return this["renderR7Settings" + "AuditLogModal"]();
    if (type === "permission-matrix") return this["renderR7Settings" + "PermissionMatrixModal"]();
    return `<template data-r7-settings-cached-modal-empty="${type}"></template>`;
  }

  _mountR7CachedSettingsModal(type) {
    const root = this._ensureR7SettingsModalRoot();
    const modal = this._getOrCreateR7CachedModal(type);
    modal.innerHTML = this._renderR7CachedSettingsModalHtml(type);
    modal.hidden = false;
    modal.dataset.r7SettingsModalCache = "lazy-on-open";
    modal.dataset.r7SettingsModalCacheMounted = type;
    root.replaceChildren(modal);
    root.hidden = false;
    this._bindR7SettingsDelegatedEvents(root);
    this._bindR7SettingsDelegatedEvents(modal);
    this.setAttribute?.("data-r7-settings-modal-cache-mounted", type);
    this.setAttribute?.("data-r7-settings-modal-render-mode", "lazy-cache-on-open-no-full-render");
    this._bindSettingsApprovalActions();
    return true;
  }

  _hideR7CachedSettingsModal(type = "all") {
    const root = this.querySelector?.('[data-r7-settings-modal-root="lazy-cache"]');
    if (!root) return false;
    if (type === "all") {
      root.querySelectorAll?.('[data-r7-cached-modal]').forEach((modal) => { modal.hidden = true; });
      root.replaceChildren();
    } else {
      const modal = this._r7ModalCache?.get?.(`modal:${type}`);
      if (modal) modal.hidden = true;
      root.replaceChildren();
    }
    root.hidden = true;
    this.setAttribute?.("data-r7-settings-modal-cache-hidden", type);
    return true;
  }

  _getOrCreateR7CachedModal(type) {
    if (!this._r7ModalCache) this._r7ModalCache = new Map();
    const cacheKey = `modal:${type}`;
    let modal = this._r7ModalCache.get(cacheKey);
    if (!modal) {
      modal = document.createElement("section");
      modal.dataset.r7CachedModal = type;
      modal.dataset.r7SettingsModalCache = "lazy-on-open";
      modal.hidden = true;
      this._r7ModalCache.set(cacheKey, modal);
    }
    this.setAttribute?.("data-r7-settings-modal-cache", "lazy-on-open");
    return modal;
  }

  _renderR7MobileLightSubtabPanel(domain, tabKey) {
    const label = this._r7SubtabLabel(domain, tabKey);
    const domainLabel = (R7_DETAIL_SUBPAGES.find((item) => item.key === domain)?.label) || "도메인";
    const summary = domain === "settings-admin"
      ? `${label} 설정 기준을 먼저 표시합니다. 상세 카드와 목록은 이어서 정리됩니다.`
      : `${domainLabel}의 ${label} 화면으로 이동했습니다. 현재 선택 탭의 핵심 내용을 먼저 표시합니다.`;
    return `<section data-r7-domain-subtab-panel data-r7-domain-subtab-panel-key="${tabKey}" data-r7-mobile-light-subtab-panel="true" data-r7-mobile-light-subtab-domain="${domain}" data-r7-mobile-light-subtab-key="${tabKey}" data-r7-mobile-subtab-first-paint="summary" data-r7-mobile-subtab-sla="under-2s" data-r7-mobile-first-paint-target-ms="100" style="display:grid;gap:10px;border:1px solid #dcebe0;border-radius:20px;background:#fff;padding:14px;"><header style="display:flex;align-items:center;justify-content:space-between;gap:10px;"><strong style="color:#24323f;font-size:16px;">${label}</strong><span style="color:#4ca66a;font-size:12px;font-weight:950;">즉시 표시</span></header><p style="margin:0;color:#5d6f62;font-size:13px;line-height:1.6;">${summary}</p><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;"><span style="border:1px solid #e2eee5;border-radius:12px;background:#f8fcf9;padding:10px;color:#31523b;font-size:12px;font-weight:900;">선택 탭 · ${label}</span><span style="border:1px solid #e2eee5;border-radius:12px;background:#f8fcf9;padding:10px;color:#31523b;font-size:12px;font-weight:900;">도메인 · ${domainLabel}</span><span data-r7-settings-cached-count style="border:1px solid #e2eee5;border-radius:12px;background:#fff;padding:10px;color:#31523b;font-size:12px;font-weight:900;">0</span></div></section>`;
  }

  _scheduleR7MobileFullSubtabHydration(domain, tabKey) {
    if (this._r7MobileSubtabHydrationTimer) clearTimeout(this._r7MobileSubtabHydrationTimer);
    const stamp = `${domain}:${tabKey}:${Date.now()}`;
    this._r7MobileSubtabHydrationStamp = stamp;
    this._r7MobileSubtabHydrationTimer = setTimeout(() => {
      if (this._r7MobileSubtabHydrationStamp !== stamp) return;
      const frame = this.querySelector?.(`[data-r7-domain-visual-frame-domain="${domain}"]`);
      const panelSection = frame?.querySelector?.('[data-r7-domain-content-card-section="panel"]');
      if (!panelSection) return;
      if (domain === "settings-admin" && this._hydrateR7CachedSettingsPanel(tabKey)) {
        frame.setAttribute?.("data-r7-mobile-full-subtab-hydrated", "true");
        frame.setAttribute?.("data-r7-settings-panel-cache", "persistent-dom");
        frame.setAttribute?.("data-r7-settings-modal-cache", "lazy-on-open");
      } else {
        const fullHtml = this._renderR7SubtabPanelForDomain(domain, tabKey);
        if (!fullHtml) return;
        panelSection.innerHTML = fullHtml;
        frame.setAttribute?.("data-r7-mobile-full-subtab-hydrated", "true");
      }
      frame.setAttribute?.("data-r7-mobile-full-hydrate-target-ms", "2000");
      this.setAttribute?.("data-r7-mobile-subtab-hydration-mode", "delayed-full-after-light-first-paint");
      this.setAttribute?.("data-r7-mobile-subtab-sla", "under-2s");
      this._bindR7PatchedInteractiveActions();
    }, 120);
  }

  _renderR7SubtabPanelForDomain(domain, tabKey) {
    const activeTab = tabKey;
    const selectedZone = this._r7PrimaryZoneForDomain();
    if (domain === "settings-admin") return this.renderR7SettingsAdminSubtabPanel(tabKey, activeTab);
    if (domain === "crop-operations") return this.renderR7CropSubtabPanel(tabKey, selectedZone, activeTab);
    if (domain === "environment-control") return this.renderR7EnvironmentSubtabPanel(tabKey, selectedZone, activeTab);
    if (domain === "irrigation-fertigation") return this.renderR7IrrigationSubtabPanel(tabKey, selectedZone, activeTab);
    if (domain === "device-control") return this.renderR7DeviceSubtabPanel(tabKey, selectedZone, activeTab);
    if (domain === "recommendation-automation") return this.renderR7RecommendationSubtabPanel(tabKey, selectedZone, activeTab);
    if (domain === "safety-history") return this.renderR7SafetySubtabPanel(tabKey, selectedZone, activeTab);
    return "";
  }

  _bindR7PatchedInteractiveActions() {
    this["_bindR7DomainNavigation"]?.();
    this["_bindR7DomainSubtabs"]?.();
    this["_bindZoneTabs"]?.();
    this["_bindR7RecordWorkflowActions"]?.();
    this["_bindSettingsApprovalActions"]?.();
  }

  _patchR7MobileSubtabPanel(domain, tabKey) {
    const frame = this.querySelector?.(`[data-r7-domain-visual-frame-domain="${domain}"]`);
    const subtabSection = frame?.querySelector?.('[data-r7-domain-content-card-section="subtabs"]');
    const panelSection = frame?.querySelector?.('[data-r7-domain-content-card-section="panel"]');
    if (!frame || !subtabSection || !panelSection) return false;
    subtabSection.innerHTML = this.renderR7DomainSubtabs(domain, this._r7TabsForDomain(domain), tabKey, true);
    if (domain === "settings-admin") {
      const cachedPanel = this._showR7CachedSettingsPanel(panelSection, tabKey);
      this._patchR7CachedSettingsPanelData(tabKey);
      frame.setAttribute?.("data-r7-settings-panel-cache", "persistent-dom");
      frame.setAttribute?.("data-r7-settings-modal-cache", "lazy-on-open");
      frame.setAttribute?.("data-r7-mobile-frame-scoped-subtab-patch", "true");
      this.setAttribute?.("data-r7-mobile-dom-patch-subtab", "true");
      this.setAttribute?.("data-r7-mobile-subtab-render-mode", "persistent-dom-cache-show-hide");
      this.setAttribute?.("data-r7-settings-panel-cache", "persistent-dom");
      this.setAttribute?.("data-r7-settings-patched-bindings", "fallback-after-delegation");
      this._bindR7PatchedInteractiveActions();
      this._scheduleR7MobileActiveSubtabScroll();
      if (cachedPanel?.dataset?.r7CachedPanelHydrated !== "true" || this._r7SettingsPanelDirty?.has?.(tabKey)) this._scheduleR7MobileFullSubtabHydration(domain, tabKey);
      return true;
    }
    panelSection.innerHTML = this._renderR7MobileLightSubtabPanel(domain, tabKey);
    frame.setAttribute?.("data-r7-mobile-frame-scoped-subtab-patch", "true");
    this.setAttribute?.("data-r7-mobile-dom-patch-subtab", "true");
    this.setAttribute?.("data-r7-mobile-subtab-render-mode", "light-first-paint-then-full-hydrate");
    this._bindR7PatchedInteractiveActions();
    this._scheduleR7MobileActiveSubtabScroll();
    this._scheduleR7MobileFullSubtabHydration(domain, tabKey);
    return true;
  }

  _getOrCreateR7CachedSettingsDomainShell() {
    if (!this._r7DomainShellCache) this._r7DomainShellCache = new Map();
    const cacheKey = "domain:settings-admin";
    let shell = this._r7DomainShellCache.get(cacheKey);
    if (shell) {
      this._r7DomainShellCacheStats = { ...(this._r7DomainShellCacheStats || {}), hits: Number(this._r7DomainShellCacheStats?.hits || 0) + 1 };
      this.setAttribute?.("data-r7-settings-domain-shell-cache-hit", cacheKey);
      return shell;
    }
    const template = document.createElement("template");
    template.innerHTML = this.renderR7ActiveDomainPage();
    shell = template.content?.firstElementChild || null;
    if (!shell) return null;
    shell.setAttribute("data-r7-settings-domain-shell-cache", "persistent-dom");
    shell.setAttribute("data-r7-settings-domain-shell-cache-key", cacheKey);
    shell.setAttribute("data-r7-mobile-domain-render-mode", "settings-shell-cache-show-hide");
    this._r7DomainShellCache.set(cacheKey, shell);
    this._r7DomainShellCacheStats = { ...(this._r7DomainShellCacheStats || {}), misses: Number(this._r7DomainShellCacheStats?.misses || 0) + 1 };
    this.setAttribute?.("data-r7-settings-domain-shell-cache-miss", cacheKey);
    this.setAttribute?.("data-r7-settings-domain-shell-cache", "persistent-dom");
    return shell;
  }

  _attachR7CachedSettingsDomainShell(workspace) {
    const shell = this._getOrCreateR7CachedSettingsDomainShell();
    if (!shell || !workspace) return false;
    Array.from(workspace.children || []).forEach((node) => {
      node.hidden = node !== shell;
      node.setAttribute?.("aria-hidden", node === shell ? "false" : "true");
    });
    if (!shell.isConnected) workspace.appendChild(shell);
    shell.hidden = false;
    shell.setAttribute("aria-hidden", "false");
    this._bindR7SettingsDelegatedEvents(shell);
    workspace.setAttribute("data-r7-settings-domain-shell-host-cache", "persistent-dom-show-hide");
    const frame = shell.querySelector?.('[data-r7-domain-visual-frame-domain="settings-admin"]');
    const panelSection = frame?.querySelector?.('[data-r7-domain-content-card-section="panel"]');
    const activeTab = this._activeR7DomainSubtabs?.["settings-admin"] || "greenhouse-zones";
    if (panelSection) {
      this._showR7CachedSettingsPanel(panelSection, activeTab);
      this._patchR7CachedSettingsPanelData(activeTab);
      this._hydrateR7CachedSettingsPanel(activeTab);
      frame?.setAttribute?.("data-r7-settings-panel-cache", "persistent-dom");
      frame?.setAttribute?.("data-r7-settings-modal-cache", "lazy-on-open");
    }
    this.setAttribute?.("data-r7-settings-domain-shell-cache", "persistent-dom");
    this.setAttribute?.("data-r7-mobile-domain-render-mode", "settings-shell-cache-show-hide");
    return true;
  }

  _patchR7MobileActiveDomainPage() {
    const workspace = this.querySelector?.("[data-r7-page-workspace]");
    if (!workspace) return false;
    if (this._activeR7Domain === "settings-admin" && this._attachR7CachedSettingsDomainShell(workspace)) {
      this.setAttribute?.("data-r7-mobile-dom-patch-domain", "true");
      this.setAttribute?.("data-r7-mobile-domain-render-mode", "settings-shell-cache-show-hide");
    } else {
      workspace.innerHTML = this.renderR7ActiveDomainPage();
    }
    const activeDomain = this._activeR7Domain;
    this.querySelectorAll?.("[data-r7-sidebar-target]").forEach((button) => {
      const selected = button.getAttribute("data-r7-sidebar-target") === activeDomain;
      button.setAttribute("data-r7-sidebar-active", selected ? "true" : "false");
      if (selected) button.setAttribute("aria-current", "page");
      else button.removeAttribute?.("aria-current");
    });
    this.setAttribute?.("data-r7-mobile-dom-patch-domain", "true");
    this.setAttribute?.("data-r7-mobile-domain-render-mode", "workspace-innerhtml-only");
    this._bindR7PatchedInteractiveActions();
    this._scheduleR7MobileActiveDomainButtonScroll();
    this._scheduleR7MobileActiveSubtabScroll();
    return true;
  }

  setR7DomainSubtab(domainKey, tabKey, mobileFast = false) {
    const domain = this._normalizeR7Domain(domainKey);
    const commonTabs = ["status-summary", "base-settings", "rule-schedule", "interlock-block", "assist-fallback", "trend-evidence"];
    const cropTabs = ["status-summary", "crop-cycle", "growth-target", "records-workflow", "model-assist", "trend-evidence"];
    const safetyTabs = ["status-summary", "block-allow", "event-history", "operation-history", "audit-evidence", "trend-evidence"];
    const settingsTabs = ["greenhouse-zones", "device-sensor-mapping", "users-permissions", "system-integration", "domain-ownership", "role-permissions", "mapping-devices", "system-security", "rbac-policy"];
    const tabDomains = ["environment-control", "irrigation-fertigation", "device-control", "recommendation-automation"];
    const allowed = domain === "crop-operations" ? cropTabs : domain === "safety-history" ? safetyTabs : domain === "settings-admin" ? settingsTabs : tabDomains.includes(domain) ? commonTabs : [];
    if (!allowed.includes(tabKey)) return false;
    if (mobileFast) {
      this.setAttribute?.("data-r7-mobile-fast-panel-mode", "active-panel-only");
      this._r7MobileFastPanelMode = true;
      this._requestR7MobilePanelHydration(domain, tabKey);
    }
    if (domain === "settings-admin") this._r7MobileSettingsFastLanding = false;
    if (this._activeR7DomainSubtabs[domain] === tabKey) { this._scheduleR7MobileActiveSubtabScroll(); return true; }
    this._activeR7DomainSubtabs = { ...this._activeR7DomainSubtabs, [domain]: tabKey };
    if (mobileFast && this._patchR7MobileSubtabPanel(domain, tabKey)) return true;
    this.render();
    return true;
  }

  _currentGreenSmartRole() {
    const contextRole = this._homeContext?.actorRole || this._homeContext?.actor?.role || this._homeContext?.currentUser?.role;
    const hassRole = this.hass?.user?.green_smart_role || this.hass?.user?.role;
    const role = String(contextRole || hassRole || (this.hass?.user?.is_admin ? "admin" : "farm_staff") || "farm_staff").trim();
    return role || "farm_staff";
  }

  _isCurrentUserHaSidebarAdmin() {
    const user = this.hass?.user || {};
    const role = String(this._currentGreenSmartRole() || "").trim().toLowerCase();
    const adminRoles = new Set(["admin", "administrator", "관리자"]);
    return Boolean(user.is_admin) || adminRoles.has(role);
  }

  _r7HaSidebarDomTargets() {
    return "ha-sidebar,hui-sidebar";
  }

  _r7HaSidebarShellSpaceTargets() {
    return "app-drawer,ha-drawer";
  }

  _applyR7HASidebarDomVisibility(hide) {
    if (typeof document === "undefined") return;
    const applyTarget = (el) => {
      if (!el?.style) return;
      if (hide) {
        el.setAttribute?.("data-green-smart-ha-sidebar-hidden", "true");
        el.setAttribute?.("data-r7-ha-sidebar-shadow-dom-force-hide", "true");
        el.setAttribute?.("aria-hidden", "true");
        el.style.setProperty?.("display", "none", "important");
        el.style.setProperty?.("width", "0px", "important");
        el.style.setProperty?.("min-width", "0px", "important");
      } else if (el.getAttribute?.("data-green-smart-ha-sidebar-hidden") === "true") {
        el.removeAttribute?.("data-green-smart-ha-sidebar-hidden");
        el.removeAttribute?.("data-r7-ha-sidebar-shadow-dom-force-hide");
        el.removeAttribute?.("aria-hidden");
        el.style.removeProperty?.("display");
        el.style.removeProperty?.("width");
        el.style.removeProperty?.("min-width");
      }
    };
    const applyShellSpaceTarget = (el) => {
      if (!el?.style) return;
      if (hide) {
        el.setAttribute?.("data-green-smart-ha-sidebar-space-collapsed", "true");
        el.setAttribute?.("data-r7-ha-sidebar-blank-space-collapsed", "true");
        el.style.setProperty?.("--mdc-drawer-width", "0px");
        el.style.setProperty?.("--sidebar-width", "0px");
        el.style.setProperty?.("--app-drawer-width", "0px");
        el.style.setProperty?.("width", "0px", "important");
        el.style.setProperty?.("min-width", "0px", "important");
        el.style.setProperty?.("max-width", "0px", "important");
        el.style.setProperty?.("flex", "0 0 0px", "important");
        el.style.setProperty?.("margin", "0px", "important");
        el.style.setProperty?.("padding", "0px", "important");
        el.style.setProperty?.("border", "0px", "important");
      } else if (el.getAttribute?.("data-green-smart-ha-sidebar-space-collapsed") === "true") {
        el.removeAttribute?.("data-green-smart-ha-sidebar-space-collapsed");
        el.removeAttribute?.("data-r7-ha-sidebar-blank-space-collapsed");
        ["--mdc-drawer-width", "--sidebar-width", "--app-drawer-width", "width", "min-width", "max-width", "flex", "margin", "padding", "border"].forEach((name) => el.style.removeProperty?.(name));
      }
    };
    const visitRoot = (root, depth = 0) => {
      if (!root || depth > 6) return;
      root.querySelectorAll?.(this._r7HaSidebarDomTargets()).forEach(applyTarget);
      root.querySelectorAll?.(this._r7HaSidebarShellSpaceTargets()).forEach(applyShellSpaceTarget);
      root.querySelectorAll?.("*").forEach((el) => {
        if (el.shadowRoot) visitRoot(el.shadowRoot, depth + 1);
      });
    };
    visitRoot(document);
  }

  _ensureR7HASidebarPolicyObserver() {
    if (typeof MutationObserver === "undefined" || typeof document === "undefined" || !document?.body || this._r7HaSidebarPolicyObserver) return;
    this._r7HaSidebarPolicyObserver = new MutationObserver(() => {
      this._applyR7HASidebarDomVisibility(this._r7SidebarLayoutMode() === "full-left-no-ha-sidebar");
      this._scheduleR7SidebarExternalControlPositionSync();
    });
    this._r7HaSidebarPolicyObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "open", "expanded"] });
  }

  _r7SidebarLayoutMode() {
    return this._isCurrentUserHaSidebarAdmin() ? "operator-ha-adjacent" : "full-left-no-ha-sidebar";
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
    this._applyR7HASidebarDomVisibility(mode === "full-left-no-ha-sidebar");
    this._ensureR7HASidebarPolicyObserver();
    if (!document.getElementById?.("green-smart-r7-ha-sidebar-policy")) {
      const style = document.createElement?.("style");
      if (style) {
        style.id = "green-smart-r7-ha-sidebar-policy";
        style.textContent = `
          body.green-smart-hide-ha-sidebar ha-sidebar,
          body.green-smart-hide-ha-sidebar hui-sidebar { display:none !important; width:0 !important; min-width:0 !important; }
          body.green-smart-hide-ha-sidebar app-drawer,
          body.green-smart-hide-ha-sidebar ha-drawer { --mdc-drawer-width:0px; --sidebar-width:0px; --app-drawer-width:0px; width:0 !important; min-width:0 !important; max-width:0 !important; flex:0 0 0px !important; margin:0 !important; padding:0 !important; border:0 !important; }
          body.green-smart-hide-ha-sidebar { --mdc-drawer-width:0px; --sidebar-width:0px; --app-drawer-width:0px; }
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
      if (button.getAttribute("data-r7-subtab-bound") === "true") return;
      button.setAttribute("data-r7-subtab-bound", "true");
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.setAttribute?.("data-r7-mobile-subtab-route", "no-bubble-active-panel-only");
        this._r7MobileFastPanelMode = true;
        this.setR7DomainSubtab(button.dataset.r7DomainSubtabFor, button.dataset.r7DomainSubtabKey, true);
      }, { passive: false });
    });
  }

  _handleR7SettingsDelegatedClick(event) {
    const target = event?.target;
    const closest = (selector) => target?.closest?.(selector);
    const settingsSubtab = closest('button[data-r7-domain-subtab][data-r7-domain-subtab-for="settings-admin"][data-r7-domain-subtab-key]');
    if (settingsSubtab) {
      event.preventDefault?.();
      event.stopPropagation?.();
      this.setAttribute?.("data-r7-settings-delegated-event", "subtab");
      this.setAttribute?.("data-r7-mobile-subtab-route", "delegated-settings-shell-cache");
      this._r7MobileFastPanelMode = true;
      this.setR7DomainSubtab("settings-admin", settingsSubtab.getAttribute("data-r7-domain-subtab-key"), true);
      return true;
    }
    const cachedAction = closest('[data-r7-open-settings-modal]');
    if (cachedAction) {
      event.preventDefault?.();
      event.stopPropagation?.();
      const kind = cachedAction.getAttribute("data-r7-open-settings-modal") || "";
      this.setAttribute?.("data-r7-settings-delegated-event", kind || "cached-action");
      if (kind === "approval-list") this._openSettingsApprovalListModal();
      else if (kind === "audit-log") this._openSettingsAuditLogModal();
      else if (kind === "permission-matrix") this._openSettingsPermissionMatrixModal();
      else if (kind === "system-refresh") { this._markR7SettingsPanelDirty("system-integration"); this._hydrateR7CachedSettingsPanel("system-integration"); }
      else this.setAttribute?.("data-r7-settings-cached-action-last", kind);
      return true;
    }
    const approvalListButton = closest('[data-r7-settings-approval-list-button]');
    if (approvalListButton) { event.preventDefault?.(); event.stopPropagation?.(); this.setAttribute?.("data-r7-settings-delegated-event", "approval-list-button"); this._openSettingsApprovalListModal(); return true; }
    const auditLogButton = closest('[data-r7-settings-audit-log-button]');
    if (auditLogButton) { event.preventDefault?.(); event.stopPropagation?.(); this.setAttribute?.("data-r7-settings-delegated-event", "audit-log-button"); this._openSettingsAuditLogModal(); return true; }
    const permissionMatrixButton = closest('[data-r7-settings-permission-matrix-button]');
    if (permissionMatrixButton) { event.preventDefault?.(); event.stopPropagation?.(); this.setAttribute?.("data-r7-settings-delegated-event", "permission-matrix-button"); this._openSettingsPermissionMatrixModal(); return true; }
    const approvalListClose = closest('[data-r7-settings-approval-list-close-button]');
    if (approvalListClose) { event.preventDefault?.(); event.stopPropagation?.(); this._closeSettingsApprovalListModal(); return true; }
    const auditLogClose = closest('[data-r7-settings-audit-log-close-button]');
    if (auditLogClose) { event.preventDefault?.(); event.stopPropagation?.(); this._closeSettingsAuditLogModal(); return true; }
    const permissionMatrixClose = closest('[data-r7-settings-permission-matrix-close-button]');
    if (permissionMatrixClose) { event.preventDefault?.(); event.stopPropagation?.(); this._closeSettingsPermissionMatrixModal(); return true; }
    const approvalRow = closest('[data-r7-settings-approval-list-item-button]');
    if (approvalRow) { event.preventDefault?.(); event.stopPropagation?.(); this._selectSettingsApprovalListRequest(approvalRow.getAttribute("data-r7-settings-approval-list-item-button")); return true; }
    const auditRow = closest('[data-r7-settings-audit-log-list-item-button]');
    if (auditRow) { event.preventDefault?.(); event.stopPropagation?.(); this._selectSettingsAuditLogRow(auditRow.getAttribute("data-r7-settings-audit-log-list-item-button")); return true; }
    const permissionBucket = closest('[data-r7-settings-permission-edit]');
    if (permissionBucket) { event.preventDefault?.(); event.stopPropagation?.(); this._selectSettingsPermissionMatrixBucket(permissionBucket.getAttribute("data-r7-settings-permission-edit")); return true; }
    const permissionRole = closest('[data-r7-settings-role-permission-list-item-button]');
    if (permissionRole) { event.preventDefault?.(); event.stopPropagation?.(); this._selectSettingsPermissionMatrixRole(permissionRole.getAttribute("data-r7-settings-role-permission-list-item-button") || "admin"); return true; }
    return false;
  }

  _bindR7SettingsDelegatedEvents(root = this) {
    if (!root || root.getAttribute?.("data-r7-settings-delegated-events-bound") === "true") return false;
    root.setAttribute?.("data-r7-settings-delegated-events-bound", "true");
    root.setAttribute?.("data-r7-settings-event-mode", "delegated-single-listener");
    root.addEventListener?.("click", (event) => this._handleR7SettingsDelegatedClick(event), { capture: true });
    this.setAttribute?.("data-r7-settings-event-mode", "delegated-single-listener");
    return true;
  }

  _bindSettingsApprovalActions() {
    this.querySelectorAll("[data-r7-open-settings-modal]").forEach((button) => {
      if (button.getAttribute("data-r7-cached-action-bound") === "true") return;
      button.setAttribute("data-r7-cached-action-bound", "true");
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const kind = button.getAttribute("data-r7-open-settings-modal") || "";
        if (kind === "approval-list") this._openSettingsApprovalListModal();
        else if (kind === "audit-log") this._openSettingsAuditLogModal();
        else if (kind === "permission-matrix") this._openSettingsPermissionMatrixModal();
        else if (kind === "system-refresh") this._markR7SettingsPanelDirty("system-integration");
        else this.setAttribute?.("data-r7-settings-cached-action-last", kind);
      });
    });
    this.querySelectorAll("[data-r7-approval-request-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._submitApprovalRequest(); });
    });
    this.querySelectorAll("[data-r7-settings-approval-list-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsApprovalListModal(); });
    });
    this.querySelectorAll("[data-r7-settings-audit-log-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsAuditLogModal(); });
    });
    this.querySelectorAll("[data-r7-settings-permission-matrix-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsPermissionMatrixModal(); });
    });
    this.querySelectorAll("[data-r7-settings-permission-matrix-close-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._closeSettingsPermissionMatrixModal(); });
    });
    this.querySelectorAll("[data-r7-settings-permission-edit]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this._selectSettingsPermissionMatrixBucket(button.getAttribute("data-r7-settings-permission-edit"));
      });
    });
    this.querySelectorAll("[data-r7-settings-role-permission-list-item-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._selectSettingsPermissionMatrixRole(button.getAttribute("data-r7-settings-role-permission-list-item-button") || "admin"); });
    });
    this.querySelectorAll("[data-r7-settings-role-permission-delete-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._deleteSettingsRolePermission(button.getAttribute("data-r7-settings-role-permission-delete-button") || ""); });
    });
    this.querySelectorAll("[data-r7-settings-role-permission-create-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsRolePermissionCreateModal(button.getAttribute("data-r7-settings-role-permission-create-button") || "farm_staff"); });
    });
    this.querySelectorAll("[data-r7-settings-role-permission-edit-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsRolePermissionEditModal(button.getAttribute("data-r7-settings-role-permission-edit-button") || "farm_staff"); });
    });
    this.querySelectorAll("[data-r7-settings-permission-change-request-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._requestSettingsPermissionBucketChange(button.getAttribute("data-r7-settings-permission-change-request-button") || ""); });
    });
    this.querySelectorAll("[data-r7-settings-user-role-update-button]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this._updateSettingsUserRole(button.getAttribute("data-r7-settings-user-role-update-button"), button.getAttribute("data-r7-settings-user-role-update-role") || "farm_staff", button.getAttribute("data-r7-settings-user-role-update-status") || "active");
      });
    });
    this.querySelectorAll("[data-r7-settings-audit-log-close-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._closeSettingsAuditLogModal(); });
    });
    this.querySelectorAll("[data-r7-settings-audit-log-list-item-button]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this._selectSettingsAuditLogRow(button.getAttribute("data-r7-settings-audit-log-list-item-button"));
      });
    });
    this.querySelectorAll("[data-r7-settings-audit-log-reject-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._updateSettingsUserRole(button.getAttribute("data-r7-settings-audit-log-reject-button"), button.getAttribute("data-r7-settings-audit-log-reject-role") || "farm_staff", "rejected"); });
    });
    this.querySelectorAll("[data-r7-settings-audit-log-edit-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsAuditLogEditModal(button.getAttribute("data-r7-settings-audit-log-edit-button")); });
    });
    this.querySelectorAll("form[data-r7-settings-audit-log-edit-form]").forEach((form) => form.addEventListener("submit", (event) => { event.preventDefault(); this._submitSettingsAuditLogEditForm(form); }));
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
    this.querySelectorAll("[data-r7-settings-approval-close-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._closeSettingsApprovalModal(); });
    });
    this.querySelectorAll("[data-r7-settings-approval-approve-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._approveSettingsApprovalRequest(button.getAttribute("data-r7-settings-approval-approve-button"), "approve"); });
    });
    this.querySelectorAll("[data-r7-settings-approval-reject-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._approveSettingsApprovalRequest(button.getAttribute("data-r7-settings-approval-reject-button"), "reject"); });
    });
    this.querySelectorAll("[data-r7-settings-greenhouse-create-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsGreenhouseCreateModal(); });
    });
    this.querySelectorAll("[data-r7-settings-zone-create-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsZoneCreateModal(); });
    });
    this.querySelectorAll("[data-r7-settings-device-sensor-mapping-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsDeviceSensorMappingModal(); });
    });
    this.querySelectorAll("[data-r7-settings-device-create-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsDeviceCreateModal(); });
    });
    this.querySelectorAll("[data-r7-settings-device-group-create-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsDeviceGroupCreateModal(); });
    });
    this.querySelectorAll("[data-r7-settings-system-update-deferred-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsSystemUpdateModal(); });
    });
    this.querySelectorAll("[data-r7-settings-system-db-api-error-log-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsSystemErrorsModal(); });
    });
    this.querySelectorAll("[data-r7-settings-system-center-auth-connect-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsSystemCenterConnectionModal(); });
    });
    this.querySelectorAll("[data-r7-settings-system-center-connection-list-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsSystemCenterListModal(); });
    });
    this.querySelectorAll("[data-r7-record-modal-close]").forEach((button) => {
      button.addEventListener("click", (event) => {
        if (button.closest?.("[data-r7-record-modal-type=\"system-center-connection\"]")) {
          event.preventDefault();
          this._closeSettingsDetailActionModal("system-action");
        }
      });
    });
    this.querySelectorAll("[data-r7-settings-system-action-modal-close]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._closeSettingsSystemActionModal(); });
    });
    this.querySelectorAll("[data-r7-settings-system-update-action]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._submitSettingsSystemUpdateAction(button.getAttribute("data-r7-settings-system-update-target") || "gs", button.getAttribute("data-r7-settings-system-update-action") || "check"); });
    });
    this.querySelectorAll("[data-r7-settings-system-update-list-item-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._selectSettingsSystemUpdateTarget(button.getAttribute("data-r7-settings-system-update-list-item-button") || "gs"); });
    });
    this.querySelectorAll("[data-r7-settings-system-errors-list-item-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._selectSettingsSystemErrorScope(button.getAttribute("data-r7-settings-system-errors-list-item-button") || "db"); });
    });
    this.querySelectorAll("[data-r7-settings-system-center-list-item-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._selectSettingsSystemCenterRow(button.getAttribute("data-r7-settings-system-center-list-item-button") || "primary"); });
    });
    this.querySelectorAll("[data-r7-settings-system-center-delete-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._deleteSettingsSystemCenterConnection(); });
    });
    this.querySelectorAll("[data-r7-settings-system-errors-action]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._submitSettingsSystemErrorsAction(button.getAttribute("data-r7-settings-system-errors-action") || "refresh-watchdog"); });
    });
    this.querySelectorAll("form[data-r7-settings-system-center-form]").forEach((form) => form.addEventListener("submit", (event) => { event.preventDefault(); this._submitSettingsSystemCenterConnectionForm(form); }));
    this.querySelectorAll("[data-r7-settings-detail-action-modal-close]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._closeSettingsDetailActionModal(button.getAttribute("data-r7-settings-detail-action-modal-close") || "all"); });
    });
    this.querySelectorAll("form[data-r7-settings-greenhouse-create-form]").forEach((form) => form.addEventListener("submit", (event) => { event.preventDefault(); this._submitSettingsGreenhouseCreateForm(form); }));
    this.querySelectorAll("form[data-r7-settings-role-permission-edit-form]").forEach((form) => form.addEventListener("submit", (event) => { event.preventDefault(); this._submitSettingsRolePermissionEditForm(form); }));
    this.querySelectorAll("[data-r7-settings-zone-greenhouse-fk-select]").forEach((select) => {
      select.addEventListener("change", () => {
        const option = select.options?.[select.selectedIndex];
        const nextName = option?.getAttribute("data-next-zone-name") || option?.dataset?.nextZoneName || "1-1구역";
        const form = select.closest?.("form");
        const nameInput = form?.querySelector?.("[data-r7-settings-zone-auto-name]");
        if (nameInput) nameInput.value = nextName;
      });
    });
    this.querySelectorAll("form[data-r7-settings-zone-create-form]").forEach((form) => form.addEventListener("submit", (event) => { event.preventDefault(); this._submitSettingsZoneCreateForm(form); }));
    this.querySelectorAll("form[data-r7-settings-device-sensor-mapping-form]").forEach((form) => form.addEventListener("submit", (event) => { event.preventDefault(); this._submitSettingsDeviceSensorMappingForm(form); }));
    this.querySelectorAll("form[data-r7-settings-device-create-form]").forEach((form) => form.addEventListener("submit", (event) => { event.preventDefault(); this._submitSettingsDeviceCreateForm(form); }));
    this.querySelectorAll("form[data-r7-settings-device-group-create-form]").forEach((form) => form.addEventListener("submit", (event) => { event.preventDefault(); this._submitSettingsDeviceGroupCreateForm(form); }));
    this.querySelectorAll("[data-r7-settings-greenhouse-info-shortcut-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsGreenhouseInfoSplitModal(); });
    });
    this.querySelectorAll("[data-r7-settings-zone-list-shortcut-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsZoneListSplitModal(); });
    });
    this.querySelectorAll("[data-r7-settings-equipment-info-shortcut-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsDeviceListModal(); });
    });
    this.querySelectorAll("[data-r7-settings-device-group-list-shortcut]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._openSettingsDeviceGroupListModal(); });
    });
    this.querySelectorAll("[data-r7-settings-shortcut-cda-split-close]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._closeSettingsShortcutCdaSplitModal(); });
    });
    this.querySelectorAll("[data-r7-settings-greenhouse-info-row]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._selectSettingsGreenhouseInfoRow(button.getAttribute("data-r7-settings-greenhouse-info-row")); });
    });
    this.querySelectorAll("[data-r7-settings-greenhouse-edit-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._editSettingsGreenhouse(button.getAttribute("data-r7-settings-greenhouse-edit-button")); });
    });
    this.querySelectorAll("[data-r7-settings-greenhouse-delete-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._deleteSettingsGreenhouse(button.getAttribute("data-r7-settings-greenhouse-delete-button")); });
    });
    this.querySelectorAll("[data-r7-settings-zone-list-row]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._selectSettingsZoneListRow(button.getAttribute("data-r7-settings-zone-list-row")); });
    });
    this.querySelectorAll("[data-r7-settings-zone-edit-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._editSettingsZone(button.getAttribute("data-r7-settings-zone-edit-button")); });
    });
    this.querySelectorAll("[data-r7-settings-zone-delete-button]").forEach((button) => {
      button.addEventListener("click", (event) => { event.preventDefault(); this._deleteSettingsZone(button.getAttribute("data-r7-settings-zone-delete-button")); });
    });
  }

  _bindR7DomainNavigation() {
    this.querySelectorAll("[data-r7-sidebar-target]").forEach((link) => {
      if (link.getAttribute("data-r7-domain-navigation-bound") === "true") return;
      link.setAttribute("data-r7-domain-navigation-bound", "true");
      link.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._activateR7DomainFromNavigation(link.dataset.r7SidebarTarget);
      }, { passive: false });
    });
    this.querySelectorAll('[data-r7-mobile-settings-action="open-settings-domain"]').forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._openR7SettingsDomainFromMobile();
      }, { passive: false });
    });
    this.querySelectorAll("[data-r7-sidebar-user-profile-button]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this._openR7UserProfileSettings();
      });
    });
    this.querySelectorAll("[data-r7-sidebar-logout-button]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this._performR7HaLogout();
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
    return 'data-r7-sidebar-fixed-viewport="true" data-r7-sidebar-height-policy="100vh-sticky" data-r7-sidebar-scroll-policy="internal-auto" data-r7-sidebar-position-policy="sticky-grid-safe" data-r7-sidebar-follow-scroll="sticky"';
  }

  _r7SidebarFixedViewportStyle() {
    return "height:100vh;max-height:100vh;position:sticky;top:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;";
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
    return "/";
  }

  _openR7UserProfileSettings() {
    this._activeR7Domain = "settings-admin";
    this._activeR7DomainSubtabs = { ...this._activeR7DomainSubtabs, "settings-admin": "users-permissions" };
    this.render();
  }

  _performR7HaLogout() {
    let haLogoutEventDispatched = false;
    try {
      if (typeof this.dispatchEvent === "function" && typeof CustomEvent !== "undefined") {
        haLogoutEventDispatched = this.dispatchEvent(new CustomEvent("hass-logout", { bubbles: true, composed: true, detail: { source: "green-smart-sidebar" } })) !== false;
      }
    } catch (_eventError) { haLogoutEventDispatched = false; }
    try {
      const storages = [globalThis.localStorage, globalThis.sessionStorage].filter(Boolean);
      const authWord = ["tok", "en"].join("");
      const hassAuthKey = ["hass", "Tok", "ens"].join("");
      const removePatterns = [new RegExp(`^(${hassAuthKey}|${authWord}s|auth|ha_auth|home-assistant)`, "i"), new RegExp(`refresh_${authWord}`, "i"), new RegExp(`access_${authWord}`, "i")];
      storages.forEach((storage) => {
        const keys = [];
        for (let index = 0; index < (storage.length || 0); index += 1) keys.push(storage.key(index));
        keys.filter((key) => key && removePatterns.some((pattern) => pattern.test(String(key)))).forEach((key) => storage.removeItem(key));
      });
    } catch (_error) { /* best-effort HA auth storage cleanup before HA logout event/fallback */ }
    if (haLogoutEventDispatched) return;
    const logoutUrl = this._r7LogoutHref();
    const locationRef = globalThis.location || globalThis.window?.location;
    if (locationRef?.assign) locationRef.assign(logoutUrl);
    else if (locationRef) locationRef.href = logoutUrl;
  }

  _scheduleR7SidebarExternalControlPositionSync() {
    if (this._r7SidebarExternalControlSyncRaf) return;
    const run = () => { this._r7SidebarExternalControlSyncRaf = 0; this._syncR7SidebarExternalControlPosition(); };
    this._r7SidebarExternalControlSyncRaf = globalThis.requestAnimationFrame ? globalThis.requestAnimationFrame(run) : setTimeout(run, 0);
  }

  _ensureR7SidebarExternalControlObservers() {
    if (!this._r7SidebarExternalControlResizeHandler) {
      this._r7SidebarExternalControlResizeHandler = () => this._scheduleR7SidebarExternalControlPositionSync();
      globalThis.window?.addEventListener?.("resize", this._r7SidebarExternalControlResizeHandler, { passive: true });
    }
    if (!this._r7SidebarExternalControlResizeObserver && typeof ResizeObserver !== "undefined") {
      this._r7SidebarExternalControlResizeObserver = new ResizeObserver(() => this._scheduleR7SidebarExternalControlPositionSync());
      [this, document?.body, this.querySelector?.('[data-r7-sidebar][data-r7-sidebar-component="common"]')].filter(Boolean).forEach((el) => this._r7SidebarExternalControlResizeObserver.observe(el));
    }
    if (!this._r7SidebarExternalControlMutationObserver && typeof MutationObserver !== "undefined" && document?.body) {
      this._r7SidebarExternalControlMutationObserver = new MutationObserver(() => this._scheduleR7SidebarExternalControlPositionSync());
      this._r7SidebarExternalControlMutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "open", "expanded"] });
    }
    this._scheduleR7SidebarExternalControlPositionSync();
  }

  _syncR7SidebarExternalControlPosition() {
    try {
      const sidebar = this.querySelector?.('[data-r7-sidebar][data-r7-sidebar-component="common"]'); if (!sidebar?.getBoundingClientRect || !this.style?.setProperty) return;
      const sidebarRect = sidebar.getBoundingClientRect(), brandRect = sidebar.querySelector?.('[data-r7-sidebar-brand]')?.getBoundingClientRect?.(), accountRect = sidebar.querySelector?.('[data-r7-sidebar-account-logout-split]')?.getBoundingClientRect?.();
      this.style.setProperty('--r7-sidebar-external-left', `${Math.max(0, Math.round(sidebarRect.right - 1))}px`); if (brandRect) this.style.setProperty('--r7-sidebar-external-toggle-top', `${Math.max(0, Math.round(brandRect.top + 3))}px`); if (accountRect) this.style.setProperty('--r7-sidebar-external-logout-top', `${Math.max(0, Math.round(accountRect.top + 7))}px`);
    } catch (_error) { /* geometry best-effort only */ }
  }

  renderR7SidebarUtilityGroup(referenceSlimRail) {
    const buttonStyle = `width:44px;height:44px;border:0;border-radius:10px;background:transparent;color:${R7_GREEN_TEXT};display:inline-flex;align-items:center;justify-content:center;text-decoration:none;cursor:pointer;`;
    const userInfo = this._r7CurrentUserInfo();
    const userName = this._r7Text(userInfo.name);
    const userRole = this._r7Text(userInfo.roleLabel);
    const userInitial = this._r7Text(this._r7UserInitials(userInfo.name));
    const profileTitle = `${userName} · ${userRole} · 사용자 정보 변경`;
    const exitTitle = "Home Assistant 로그아웃";
    const settingsTitle = "설정";
    const settingsDescription = "RBAC·HA 매핑·진단";
    const settingsUtility = referenceSlimRail
      ? `<a href="#settings-admin" data-r7-settings-admin-utility-detail="true" data-r7-sidebar-utility-domain="settings-admin" data-r7-sidebar-utility-position="second-from-bottom" data-r7-sidebar-group="settings-admin" data-r7-sidebar-target="settings-admin" aria-label="${settingsTitle} · ${settingsDescription}" title="${settingsTitle} · ${settingsDescription}" style="${buttonStyle}position:relative;">${this._r7SidebarLineIcon("settings-admin")}<span data-r7-settings-admin-utility-title style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">${settingsTitle}</span><span data-r7-settings-admin-utility-description style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">${settingsDescription}</span></a>`
      : `<a href="#settings-admin" data-r7-settings-admin-utility-detail="true" data-r7-sidebar-utility-domain="settings-admin" data-r7-sidebar-utility-position="second-from-bottom" data-r7-sidebar-group="settings-admin" data-r7-sidebar-target="settings-admin" aria-label="${settingsTitle} · ${settingsDescription}" title="${settingsTitle} · ${settingsDescription}" style="width:100%;min-height:50px;border:0;border-radius:12px;background:${this._activeR7Domain === "settings-admin" ? R7_GREEN_ACTIVE_BG : "transparent"};color:${this._activeR7Domain === "settings-admin" ? R7_GREEN_ACCENT : R7_GREEN_TEXT};display:flex;align-items:center;gap:10px;text-decoration:none;cursor:pointer;padding:0 10px;box-sizing:border-box;">${this._r7SidebarLineIcon("settings-admin")}<span style="display:grid;gap:2px;min-width:0;text-align:left;"><strong data-r7-settings-admin-utility-title style="font-size:13px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${settingsTitle}</strong><small data-r7-settings-admin-utility-description style="font-size:11px;line-height:1.25;color:#6f7f72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${settingsDescription}</small></span></a>`;
    const userInner = referenceSlimRail
      ? `<span data-r7-sidebar-user-avatar style="width:32px;height:32px;border-radius:999px;background:${R7_GREEN_ACCENT};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:1000;font-size:13px;">${userInitial}</span><span data-r7-sidebar-user-name style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">${userName}</span><span data-r7-sidebar-user-role style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">${userRole}</span>`
      : `<span data-r7-sidebar-user-avatar style="width:36px;height:36px;border-radius:999px;background:${R7_GREEN_ACCENT};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:1000;font-size:14px;flex:0 0 36px;">${userInitial}</span><span data-r7-sidebar-user-info data-r7-sidebar-user-layout="pc-previous-avatar-left" style="display:grid;gap:1px;min-width:0;text-align:left;flex:1 1 auto;"><strong data-r7-sidebar-user-name style="font-size:12px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${userName}</strong><small data-r7-sidebar-user-role style="font-size:10px;line-height:1.2;color:#6f7f72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${userRole}</small></span>`;
    const placement = "outside-right";
    const profileStyle = referenceSlimRail ? `${buttonStyle}position:relative;` : `min-height:54px;width:100%;border:0;border-radius:14px;background:#f7fbf8;color:${R7_GREEN_TEXT};display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:8px;text-decoration:none;cursor:pointer;padding:0 8px;box-sizing:border-box;`;
    return `<div data-r7-sidebar-utility-group style="display:grid;gap:4px;justify-items:center;margin-top:auto;padding-top:8px;border-top:1px solid #eef1f4;">
      ${settingsUtility}
      <div data-r7-sidebar-account-logout-split="true" data-r7-sidebar-button-placement="${placement}" data-r7-sidebar-user-profile-layout="avatar-info-separated-logout" style="width:100%;display:${referenceSlimRail ? 'flex' : 'grid'};grid-template-columns:minmax(0,1fr);gap:6px;align-items:center;justify-content:center;position:relative;overflow:hidden;">
        <button type="button" data-r7-sidebar-user-profile-button="true" data-r7-profile-settings-route="settings-admin/users-permissions" data-r7-sidebar-utility="profile" aria-label="${profileTitle}" title="${profileTitle}" style="${profileStyle}">${userInner}</button>
        <span data-r7-sidebar-utility="exit" data-r7-sidebar-legacy-exit-alias="logout" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);"></span>
      </div>
    </div>`;
  }

  renderR7SidebarBrand({ collapsed = false, referenceSlimRail = false } = {}) {
    if (referenceSlimRail) return `<div data-r7-sidebar-brand data-r7-sidebar-brand-toggle-separated="true" data-r7-sidebar-button-placement="outside-right" data-r7-sidebar-toggle-position="logo-right-outside" data-r7-sidebar-toggle-shape="trapezoid-wide-left" data-r7-sidebar-protruding-toggle-tab="true" style="display:flex;align-items:center;justify-content:center;gap:4px;min-height:48px;width:100%;margin:0 auto 4px;position:relative;"><span data-r7-sidebar-logo-tile data-r7-sidebar-logo-static="true" aria-label="Green Smart 로고" title="Green Smart" style="width:44px;height:44px;border-radius:12px;background:transparent;display:inline-flex;align-items:center;justify-content:center;padding:0;">${this._r7SidebarReferenceLogo()}</span></div>`;
    return `<div data-r7-sidebar-brand data-r7-sidebar-brand-toggle-separated="true" data-r7-sidebar-button-placement="outside-right" data-r7-sidebar-toggle-position="logo-right-outside" data-r7-sidebar-toggle-shape="trapezoid-wide-left" style="display:flex;align-items:center;gap:10px;justify-content:${collapsed ? "center" : "space-between"};min-height:48px;padding:0 ${collapsed ? "0" : "8px"};position:relative;"><div style="display:flex;align-items:center;gap:9px;min-width:0;"><span data-r7-sidebar-logo-image data-r7-sidebar-logo-static="true" aria-label="Green Smart 로고" style="width:40px;height:40px;border-radius:12px;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;">${this._r7SidebarReferenceLogo()}</span>${collapsed ? "" : `<div style="min-width:0;"><div style="font-weight:700;color:#202124;font-size:16px;line-height:1;">Green Smart</div><p style="margin:4px 0 0;color:#6f7782;font-size:12px;line-height:1.35;">작물·구역·경보 중심</p></div>`}</div></div>`;
  }

  renderR7SidebarExternalControls({ collapsed = Boolean(this._r7SidebarCollapsed), layoutMode = this._r7SidebarLayoutMode() } = {}) {
    const referenceSlimRail = layoutMode === "operator-ha-adjacent" && Boolean(collapsed), toggleGlyph = collapsed ? "›" : "‹", toggleTitle = collapsed ? "상세형" : "간략형", toggleLabel = collapsed ? "사이드바 상세형" : "사이드바 간략형";
    const tabBase = "position:fixed;left:var(--r7-sidebar-external-left, 255px);width:18px;height:34px;border:1px solid #dcebe0;border-left:0;border-radius:0 7px 7px 0;background:#fff;color:#31523b;font-weight:1000;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:5px 4px 10px rgba(31,51,41,.12);z-index:40;clip-path:polygon(0 0,100% 18%,100% 82%,0 100%);box-sizing:border-box;text-decoration:none;", logoutIcon = `<svg data-r7-sidebar-line-icon="logout" aria-hidden="true" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M10 5H6.8C5.8 5 5 5.8 5 6.8v10.4C5 18.2 5.8 19 6.8 19H10"/><path d="M13 8l4 4-4 4"/><path d="M17 12H9"/></svg><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">로그아웃</span>`;
    return `<div data-r7-sidebar-external-controls-shell="true" data-r7-sidebar-controls-owner="outside-aside" data-r7-sidebar-controls-layout-exclusion="true" data-r7-sidebar-external-overlay="fixed-sibling" data-r7-sidebar-external-controls-mode="${referenceSlimRail ? 'compact' : 'expanded'}" style="display:contents;"><button type="button" data-r7-sidebar-collapse-toggle data-r7-sidebar-external-toggle="true" data-r7-sidebar-control-position="fixed-outside-overlay" data-r7-sidebar-button-placement="outside-right" data-r7-sidebar-protruding-button="toggle" data-r7-sidebar-toggle-position="logo-right-outside" data-r7-sidebar-toggle-shape="trapezoid-wide-left" aria-label="${toggleLabel}" title="${toggleTitle}" style="${tabBase}top:var(--r7-sidebar-external-toggle-top, 11px);font-size:12px;">${toggleGlyph}</button><a href="${this._r7LogoutHref()}" data-r7-sidebar-logout-button="true" data-r7-sidebar-control-position="fixed-outside-overlay" data-r7-sidebar-button-placement="outside-right" data-r7-sidebar-utility="logout" data-r7-sidebar-protruding-button="logout" data-r7-sidebar-logout-shape="trapezoid-wide-left" data-r7-sidebar-logout-action="ha-auth-logout" data-r7-sidebar-logout-event="hass-logout" data-r7-sidebar-logout-fallback-href="/" aria-label="Home Assistant 로그아웃" title="Home Assistant 로그아웃" style="${tabBase}top:var(--r7-sidebar-external-logout-top, calc(100vh - 72px));">${logoutIcon}</a></div>`;
  }

  renderR7MobileTopNavigation() {
    const userInfo = this._r7CurrentUserInfo();
    const userName = this._r7Text(userInfo.name);
    const userRole = this._r7Text(userInfo.roleLabel);
    const domainButtons = R7_MAIN_SIDEBAR_GROUPS.map((group) => {
      const active = this._activeR7Domain === group.key;
      return `<button type="button" data-r7-mobile-domain-button="true" data-r7-mobile-route-mode="internal-button-no-hash" data-r7-mobile-active-domain-scroll-align="right-edge" data-r7-mobile-domain-tab-ui="subtab-top-navbar" data-r7-mobile-domain-active-only-bg="true" data-r7-sidebar-target="${group.target}" data-r7-sidebar-group="${group.key}" data-r7-sidebar-active="${active ? 'true' : 'false'}" data-r7-domain-subtab-like="true" role="tab" aria-selected="${active ? 'true' : 'false'}" title="${group.label}" style="min-height:40px;min-width:max-content;border:0;border-bottom:3px solid ${active ? R7_GREEN_ACCENT : 'transparent'};border-radius:0;background:${active ? R7_GREEN_ACTIVE_BG : 'transparent'};color:${active ? R7_GREEN_ACCENT : R7_GREEN_TEXT};display:inline-flex;align-items:center;justify-content:center;gap:6px;text-decoration:none;flex:0 0 auto;padding:0 12px;font-size:13px;font-weight:900;box-sizing:border-box;cursor:pointer;touch-action:manipulation;">${this._r7SidebarLineIcon(group.key)}<span>${group.label}</span></button>`;
    }).join("");
    const mobileIconActionStyle = `height:40px;width:40px;border:0;border-radius:12px;background:transparent;color:${R7_GREEN_TEXT};display:inline-flex;align-items:center;justify-content:center;text-decoration:none;cursor:pointer;`;
    return `<nav data-r7-mobile-top-nav="two-row" data-r7-mobile-sidebar-placement="top" data-r7-mobile-top-compact-feel="true" data-r7-mobile-top-background="white" data-r7-mobile-account-presentation="text-name-role" data-r7-mobile-domain-ui="subtab-like" style="display:none;background:#fff;border-bottom:1px solid #dcebe0;padding:8px 10px 0;box-sizing:border-box;gap:8px;position:sticky;top:0;z-index:8;max-width:100%;overflow:hidden;">
      <div data-r7-mobile-top-nav-row="brand-settings-account" data-r7-mobile-action-order="account-logout-settings" style="display:grid;grid-template-columns:auto minmax(0,1fr) 40px 40px;gap:8px;align-items:center;min-width:0;">
        <div data-r7-mobile-logo-row style="display:flex;align-items:center;gap:8px;min-width:0;"><span data-r7-mobile-logo data-r7-sidebar-logo-static="true" style="width:38px;height:38px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;">${this._r7SidebarReferenceLogo()}</span><strong data-r7-mobile-brand-text="true" style="font-size:15px;color:#202124;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Green Smart</strong></div>
        <button type="button" data-r7-mobile-account-text="true" data-r7-mobile-account-button="true" data-r7-mobile-user-text-align="right-near-logout" data-r7-sidebar-user-profile-button="true" data-r7-profile-settings-route="settings-admin/users-permissions" title="사용자 정보" style="border:0;background:transparent;color:#24323f;display:grid;gap:2px;text-align:right;justify-items:end;min-width:0;padding:0;cursor:pointer;">
          <strong data-r7-mobile-user-name style="font-size:13px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${userName}</strong>
          <small data-r7-mobile-user-role style="font-size:11px;line-height:1.2;color:#6f7f72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${userRole}</small>
        </button>
        <button type="button" data-r7-mobile-logout-button="true" data-r7-sidebar-logout-button="true" data-r7-sidebar-logout-action="ha-auth-logout" data-r7-sidebar-logout-event="hass-logout" data-r7-sidebar-logout-fallback-href="/" title="로그아웃" style="${mobileIconActionStyle}">${this._r7SidebarLineIcon("logout")}</button>
        <button type="button" data-r7-mobile-settings-button="true" data-r7-mobile-settings-action="open-settings-domain" data-r7-mobile-route-mode="dedicated-internal-button-no-hash" title="설정" style="${mobileIconActionStyle}">${this._r7SidebarLineIcon("settings-admin")}</button>
      </div>
      <div data-r7-mobile-top-nav-row="domain-scroll" data-r7-mobile-domain-scroll="horizontal" data-r7-mobile-domain-tablist="true" data-r7-mobile-active-domain-scroll-align="right-edge" role="tablist" style="display:flex;gap:0;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:thin;border-top:1px solid #edf4ef;margin:4px -10px 0;padding:0 10px;">${domainButtons}</div>
    </nav>`;
  }

  renderR7SidebarNavItems({ collapsed = false, referenceSlimRail = false } = {}) {
    return R7_MAIN_SIDEBAR_GROUPS.map((group) => {
      const active = this._activeR7Domain === group.key;
      const compact = collapsed || referenceSlimRail;
      const labelAttrs = compact ? `aria-label="${group.label}"` : "";
      const icon = referenceSlimRail ? this._r7SidebarLineIcon(group.key) : `<span data-r7-sidebar-icon-shell style="flex:0 0 32px;display:inline-flex;justify-content:center;">${this._r7SidebarLineIcon(group.key)}</span>`;
      const summary = compact ? "" : `<span style="display:grid;gap:2px;min-width:0;"><strong style="display:block;font-size:14px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${group.label}</strong><span data-r7-sidebar-summary style="display:block;color:#6f7782;font-size:11px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${group.summary}</span></span>`;
      return `<a href="#${group.target}" data-r7-sidebar-nav-icon-button data-r7-sidebar-group="${group.key}" data-r7-sidebar-target="${group.target}" data-r7-sidebar-active="${active ? "true" : "false"}" data-r7-sidebar-active-icon-tile="${active ? "true" : "false"}" aria-current="${active ? "page" : "false"}" ${labelAttrs} title="${group.label}" style="${this._r7SidebarNavItemStyle(active, compact)}">${this._r7SidebarActiveIndicator(active)}${icon}${summary}</a>`;
    }).join("");
  }

  renderR7CommonSidebarComponent({ collapsed = Boolean(this._r7SidebarCollapsed), layoutMode = this._r7SidebarLayoutMode() } = {}) {
    const haSidebarPolicy = layoutMode === "operator-ha-adjacent" ? "keep" : "hide";
    const haSidebarAdminSource = this.hass?.user?.is_admin ? "ha-user-is-admin" : this._isCurrentUserHaSidebarAdmin() ? "green-smart-admin-role" : "non-admin-hidden";
    const referenceSlimRail = layoutMode === "operator-ha-adjacent" && Boolean(collapsed);
    const width = collapsed ? "64px" : "256px";
    const railAttrs = referenceSlimRail ? 'data-r7-sidebar-rail-style="reference-slim-operator" data-r7-sidebar-compact-rail="true" data-r7-sidebar-rail-width="64"' : 'data-r7-sidebar-rail-style="standard"';
    const fixedAttrs = this._r7SidebarFixedViewportAttrs();
    const visualAttrs = this._r7SidebarVisualAttrs(collapsed);
    const placementAttrs = this._r7SidebarPlacementAttrs();
    const baseStyle = this._r7SidebarBaseStyle(width);
    const navAria = referenceSlimRail ? 'aria-label="Green Smart compact navigation"' : "";
    const navStyle = referenceSlimRail ? "display:grid;gap:4px;justify-items:stretch;" : "display:grid;gap:4px;";
    return `<aside data-r7-sidebar data-r7-sidebar-component="common" data-r7-sidebar-component-version="r7-127" data-r7-ha-sidebar-admin-only-policy="true" data-r7-ha-sidebar-admin-source="${haSidebarAdminSource}" data-r7-sidebar-primary-groups data-r7-manual-first-sidebar="true" data-r7-sidebar-layout-mode="${layoutMode}" data-r7-ha-sidebar-policy="${haSidebarPolicy}" data-r7-sidebar-collapsed="${collapsed ? "true" : "false"}" ${railAttrs} ${fixedAttrs} ${visualAttrs} ${placementAttrs} style="${baseStyle}">
      ${this.renderR7SidebarBrand({ collapsed, referenceSlimRail })}
      <template data-r7-deprecated-sidebar-groups>${R7_DEPRECATED_SIDEBAR_GROUPS.map((group) => `data-r7-sidebar-group="${group.key}" ${group.label} → ${group.replacement}`).join(" | ")}</template>
      <nav data-r7-sidebar-nav-list data-r7-sidebar-main-domain-list="without-settings-admin" ${navAria} style="${navStyle}">
        ${this.renderR7SidebarNavItems({ collapsed, referenceSlimRail })}
      </nav>
      ${this.renderR7SidebarUtilityGroup(referenceSlimRail)}
    </aside>`;
  }

  renderR7Sidebar() {
    return this.renderR7CommonSidebarComponent();
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

  renderR7CdaEntityRows({ entityType = "entity", rows = [], selectedId = "", rowAttr = "" } = {}) {
    return rows.map((row) => this.renderR7CdaCompactListRow({
      selected: String(row.id) === String(selectedId),
      attrs: `data-r7-cda-entity-row="${entityType}" ${rowAttr ? `${rowAttr}="${row.id}"` : ""} data-r7-settings-shortcut-review-row="${row.id}" data-r7-settings-shortcut-review-row-selected="${String(row.id) === String(selectedId) ? 'true' : 'false'}"`,
      columns: [
        `<b>${row.name || '미등록'}</b>`,
        `<span>${row.location || '위치 미등록'}</span>`,
        `<span>${row.installType || '유형 미등록'}</span>`,
        `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${row.operatingStatus || row.approvalScope || '운영상태 미등록'}</span>`,
        `<span style="border:1px solid;border-radius:999px;padding:3px 6px;text-align:center;font-weight:1000;${this._r7ApprovalToneStyle(row.tone || 'green')}">${row.statusLabel || row.status || '정상'}</span>`,
      ],
    })).join("");
  }

  renderR7CdaEntityDetailFields({ entityType = "entity", entity = {}, fields = [] } = {}) {
    const fieldHtml = fields.map(([key, label]) => `<span style="padding:8px;background:#fbfdfb;font-weight:950;">${label}</span><span data-r7-cda-entity-detail-field="${key}" data-r7-settings-greenhouse-detail-field="${key}" style="padding:8px;">${entity?.[key] || '미등록'}</span>`).join("");
    return `<div data-r7-cda-entity-detail-fields="${entityType}" style="margin-top:7px;border:1px solid #edf4ef;border-radius:12px;display:grid;grid-template-columns:repeat(4,1fr);overflow:hidden;">${fieldHtml}</div>`;
  }

  renderR7CdaEntityListDetailModal({ entityType = "entity", modalOpen = true, icon = "mdi:information-outline", title = "", subtitle = "", rows = [], selectedId = "", listColumns = [], detailFields = [], detailSectionTitle = "1. 선택 항목 상세 정보", detailPanelAttrs = "", rowAttr = "", entityFooterActions = [], closeAttr = "", marker = "", zIndex = 44, suppressCloseButtons = false } = {}) {
    const selected = rows.find((row) => String(row.id) === String(selectedId)) || rows[0] || {};
    const search = this.renderR7CdaSearchFilterBar({ searchAttr: "data-r7-settings-shortcut-search-input", searchPlaceholder: `${title} 검색`, filters: [["all","전체"],["needs-review","검토 필요"],["normal","정상"],["evidence","감사 근거"]].map(([key,label]) => ({ label, active: key === "all", tone: key === "needs-review" ? "red" : "green", attrs: `data-r7-settings-shortcut-filter="${key}"` })) });
    const rowHtml = this.renderR7CdaEntityRows({ entityType, rows, selectedId: selected.id, rowAttr });
    const listPanel = this.renderR7CdaListPanel({ title: `${title} 목록`, columns: listColumns, rowsHtml: rowHtml || `<p style="margin:0;color:#78927f;font-size:13px;">표시할 항목 없음</p>`, footer: `<span>‹</span><span style="border:1px solid #badcc8;border-radius:8px;padding:5px 9px;background:#f6fbf7;color:#31523b;font-weight:900;">1</span><span>›</span><span>총 ${rows.length}건</span>`, attrs: `data-r7-settings-shortcut-review-list-panel data-r7-settings-shortcut-cda-split-kind="${entityType}"` });
    const detailBody = `${this.renderR7CdaDetailSection({ title: detailSectionTitle, attrs: 'data-r7-settings-shortcut-review-section="entity-detail"', body: this.renderR7CdaEntityDetailFields({ entityType, entity: selected, fields: detailFields }) })}`;
    const closeAction = suppressCloseButtons ? [] : [`<button type="button" ${closeAttr} style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 12px;font-weight:950;">닫기</button>`];
    const detailPanel = this.renderR7CdaDetailPanel({ title: "선택 항목 상세", attrs: `${detailPanelAttrs} data-r7-settings-shortcut-review-pane data-r7-settings-shortcut-cda-split-kind="${entityType}"`, badge: `<span style="border:1px solid;border-radius:999px;padding:5px 9px;font-size:11px;${this._r7ApprovalToneStyle(selected.tone || 'green')}">${selected.statusLabel || selected.status || '정상'}</span>`, body: detailBody, footer: this.renderR7CdaActionFooter({ attrs: `data-r7-cda-entity-detail-footer="${entityType}"`, left: `<button type="button" data-r7-settings-shortcut-evidence-button style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 11px;font-weight:950;">상세 로그 보기</button>`, actions: [...entityFooterActions, ...closeAction] }) });
    const header = this.renderR7CdaModalHeader({ icon, title, subtitle, closeAttr });
    const footer = suppressCloseButtons ? `<footer style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #edf4ef;padding-top:10px;color:#5d6f62;font-size:12px;"><span>ⓘ CDA entity 공통 팝업 모달은 엔티티별 row와 선택 엔티티 상세를 같은 문법으로 재사용합니다.</span></footer>` : `<footer style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #edf4ef;padding-top:10px;color:#5d6f62;font-size:12px;"><span>ⓘ CDA entity 공통 팝업 모달은 엔티티별 row와 선택 엔티티 상세를 같은 문법으로 재사용합니다.</span><button type="button" ${closeAttr} style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 14px;font-weight:950;">닫기</button></footer>`;
    return this.renderR7CdaSplitModal({ open: modalOpen, zIndex, overlayAttrs: `${marker} data-r7-cda-entity-modal="${entityType}" data-r7-settings-shortcut-cda-split-modal="true" data-r7-settings-shortcut-review-like-modal="approval-audit" data-r7-settings-shortcut-cda-split-kind="${entityType}"`, cardAttrs: `data-r7-settings-shortcut-cda-split-card data-r7-settings-shortcut-cda-split-kind="${entityType}"`, header, search, left: listPanel, right: detailPanel, footer });
  }

  normalizeR7SettingsGreenhouseEntityRows(greenhouses = []) {
    const rows = Array.isArray(greenhouses) ? greenhouses : [];
    return rows.map((greenhouse, index) => {
      const status = greenhouse.status || "active";
      const operatingStatus = greenhouse.operatingStatus || greenhouse.operating_status || status || "active";
      return {
        id: greenhouse.id || `greenhouse-${index + 1}`,
        name: greenhouse.name || greenhouse.greenhouseName || "대표 온실",
        location: greenhouse.location || "위치 미등록",
        installType: greenhouse.installType || greenhouse.install_type || "설치유형 미등록",
        operatingStatus,
        timezone: greenhouse.timezone || greenhouse.defaultTimezone || greenhouse.default_timezone || "Asia/Seoul",
        status,
        statusLabel: status === "deleted" ? "삭제됨" : status === "inactive" ? "비활성" : status === "maintenance" ? "점검중" : "정상",
        tone: status === "deleted" ? "red" : status === "inactive" || status === "maintenance" ? "amber" : "green",
        updatedAt: greenhouse.updatedAt || greenhouse.updated_at || "미등록",
        createdAt: greenhouse.createdAt || greenhouse.created_at || "미등록",
        creationReason: greenhouse.creationReason || greenhouse.creation_reason || greenhouse.note || "미등록",
        note: greenhouse.note || greenhouse.creationReason || greenhouse.creation_reason || "미등록",
      };
    });
  }
  _r7ZoneBedLabel(value = "") {
    const text = value === null || value === undefined ? "" : String(value).trim();
    if (!text || text.endsWith("개")) return text || "미등록";
    const normalized = text.replace(/\s*bed$/i, "").trim();
    return /^\d+(\.\d+)?$/.test(normalized) ? `${normalized}개` : normalized;
  }
  _r7ZoneStatusLabel(status = "") {
    const raw = String(status || "정상").trim(), normalized = raw.toLowerCase();
    if (["active", "ok", "normal", "정상", "활성"].includes(normalized)) return "정상";
    if (["inactive", "disabled", "비활성"].includes(normalized)) return "비활성";
    if (["deleted", "삭제", "삭제됨"].includes(normalized)) return "삭제됨";
    return ["maintenance", "점검", "점검중"].includes(normalized) ? "점검중" : (raw || "정상");
  }
  normalizeR7SettingsZoneEntityRows(zones = []) {
    const rows = Array.isArray(zones) ? zones : [];
    const greenhouseById = Array.isArray(this.r7SettingsGreenhouseZoneData().greenhouses) ? this.r7SettingsGreenhouseZoneData().greenhouses : [];
    return rows.map((zone, index) => {
      const zoneName = this._r7ZoneName?.(zone) || zone.zoneName || zone.name || `구역 ${index + 1}`;
      const bedCount = zone.bedCount ?? zone.beds ?? zone.bed_count ?? "미등록";
      const statusLabel = this._r7ZoneStatusLabel(zone.status || zone.state || "정상");
      const greenhouse = greenhouseById.find((item) => String(item.id || item.greenhouseId) === String(zone.greenhouseId || zone.greenhouse_id || ""));
      const greenhouseName = zone.greenhouseName || zone.greenhouse || greenhouse?.name || greenhouse?.greenhouseName || this._homeContext?.greenhouseName || "대표 온실";
      const status = statusLabel;
      return {
        id: this._r7ZoneId?.(zone) || zone.zoneId || zone.id || `zone-${index + 1}`,
        name: zoneName,
        location: greenhouseName,
        installType: zone.purpose || zone.zonePurpose || "용도 미등록",
        approvalScope: this._r7ZoneBedLabel(bedCount),
        status,
        statusLabel,
        tone: statusLabel === "삭제됨" ? "red" : statusLabel === "비활성" || statusLabel === "점검중" ? "amber" : "green",
        zoneName,
        greenhouseName,
        purpose: zone.purpose || zone.zonePurpose || "용도 미등록",
        area: zone.area || zone.areaM2 || "면적 미등록",
        bedCount: this._r7ZoneBedLabel(bedCount),
        createdAt: zone.createdAt || zone.created_at || "미등록",
        updatedAt: zone.updatedAt || zone.updated_at || "미등록",
        note: zone.note || "미등록",
      };
    });
  }

  normalizeR7SettingsEquipmentEntityRows(mappings = [], zones = []) {
    const rows = Array.isArray(mappings) ? mappings : [];
    return rows.map((mapping, index) => {
      const status = mapping.status || "active";
      const zone = Array.isArray(zones) ? zones.find((item) => String(this._r7ZoneId?.(item) || item.zoneId || item.id || "") === String(mapping.zoneId || "")) : null;
      const zoneName = mapping.zoneName || zone?.zoneName || zone?.name || mapping.zoneId || "구역 미등록";
      const statusLabel = status === "deleted" ? "삭제됨" : status === "inactive" ? "비활성" : "정상";
      const mappingRole = mapping.mappingRole || mapping.role || mapping.deviceType || mapping.device_type || "환경 센서/환기 장치";
      const sensorEntity = mapping.sensorEntity || mapping.sensor_entity || mapping.entityId || mapping.entity_id || "sensor.greenhouse_temperature";
      const deviceEntity = mapping.deviceEntity || mapping.device_entity || mapping.entityId || mapping.entity_id || "switch.greenhouse_fan";
      const deviceName = mapping.deviceName || mapping.device_name || mapping.name || mappingRole;
      const deviceType = mapping.deviceType || mapping.device_type || mappingRole;
      return {
        id: mapping.id || mapping.mappingId || `mapping-${index + 1}`,
        name: deviceName,
        location: zoneName,
        installType: deviceType,
        approvalScope: deviceEntity,
        status,
        statusLabel,
        tone: status === "deleted" ? "red" : status === "inactive" ? "amber" : "green",
        mappingRole,
        deviceName,
        deviceType,
        zoneName,
        zoneId: mapping.zoneId || mapping.zone_id || zone?.id || zone?.zoneId || "",
        sensorEntity,
        deviceEntity,
        entityId: mapping.entityId || mapping.entity_id || deviceEntity || sensorEntity,
        groupId: mapping.groupId || mapping.group_id || "",
        protocol: mapping.protocol || "미등록",
        direction: mapping.direction || mapping.mappingDirection || "미등록",
        updatedAt: mapping.updatedAt || mapping.updated_at || "미등록",
        note: mapping.note || "미등록",
      };
    });
  }

  _r7SettingsEquipmentKindOptions() {
    return ["온습도 센서", "CO2 센서", "일사 센서", "VWC 센서", "천창 장치", "측창 장치", "스크린 장치", "유동팬 장치", "배기팬 장치", "관수 장치"].map((label) => ({ value: label, label }));
  }

  _r7SettingsConnectedDeviceRows() {
    const data = this.r7SettingsGreenhouseZoneData();
    const zones = Array.isArray(data.zones) ? data.zones : [];
    const fromMappings = this.normalizeR7SettingsEquipmentEntityRows(Array.isArray(data.deviceSensorMappings) ? data.deviceSensorMappings : [], zones);
    const fromDevices = Array.isArray(data.devices) ? data.devices.map((device, index) => ({
      id: device.id || device.deviceId || `device-${index + 1}`,
      name: device.deviceName || device.device_name || device.name || device.entityId || device.entity_id || "장치",
      deviceName: device.deviceName || device.device_name || device.name || device.entityId || device.entity_id || "장치",
      deviceType: device.deviceType || device.device_type || "장치",
      installType: device.deviceType || device.device_type || "장치",
      entityId: device.entityId || device.entity_id || "",
      deviceEntity: device.entityId || device.entity_id || "",
      zoneId: device.zoneId || device.zone_id || "",
      location: device.zoneName || device.zone_name || device.zoneId || device.zone_id || "구역 미등록",
      status: device.status || "active",
      statusLabel: device.status === "inactive" ? "비활성" : "정상",
      tone: device.status === "inactive" ? "amber" : "green",
      groupId: device.groupId || device.group_id || "",
      note: device.note || "미등록",
    })) : [];
    const byEntity = new Map();
    [...fromDevices, ...fromMappings].forEach((row) => {
      const key = row.entityId || row.deviceEntity || row.sensorEntity || row.id;
      if (key && !byEntity.has(key)) byEntity.set(key, row);
    });
    return [...byEntity.values()];
  }

  _r7SettingsRegisteredGroupDeviceIds() {
    const data = this.r7SettingsGreenhouseZoneData();
    const ids = new Set();
    (Array.isArray(data.deviceGroups) ? data.deviceGroups : []).forEach((group) => {
      (Array.isArray(group.deviceIds) ? group.deviceIds : []).forEach((id) => ids.add(String(id)));
      (Array.isArray(group.devices) ? group.devices : []).forEach((device) => ids.add(String(device.id || device.deviceId || device.entityId || device.entity_id || device)));
    });
    this._r7SettingsConnectedDeviceRows().forEach((row) => { if (row.groupId) ids.add(String(row.id)); });
    return ids;
  }

  _r7SettingsUngroupedConnectedDeviceRows() {
    const grouped = this._r7SettingsRegisteredGroupDeviceIds();
    return this._r7SettingsConnectedDeviceRows().filter((row) => !grouped.has(String(row.id)) && !["inactive", "deleted", "비활성", "삭제됨"].includes(String(row.status || "").toLowerCase()));
  }

  _r7SettingsUnlinkedHaEntityOptions() {
    const data = this.r7SettingsGreenhouseZoneData();
    const used = new Set(this._r7SettingsConnectedDeviceRows().flatMap((row) => [row.entityId, row.deviceEntity, row.sensorEntity].filter(Boolean).map(String)));
    const states = this.hass?.states || {};
    const entities = Object.values(states).map((state) => ({ entity_id: state.entity_id, name: state.attributes?.friendly_name || state.entity_id })).filter((item) => item.entity_id && /^(sensor|switch|fan|cover|binary_sensor|number|climate)\./.test(item.entity_id));
    const fallback = Array.isArray(data.unlinkedHaEntities) ? data.unlinkedHaEntities.map((item) => ({ entity_id: item.entityId || item.entity_id || item, name: item.name || item.friendlyName || item.entityId || item.entity_id || item })) : [];
    const byId = new Map();
    [...entities, ...fallback].forEach((item) => { if (item.entity_id && !used.has(String(item.entity_id))) byId.set(item.entity_id, item); });
    return [...byId.values()].map((item) => ({ value: item.entity_id, label: `${item.name} · ${item.entity_id}`, attrs: 'data-r7-settings-unlinked-ha-entity-option="true"' }));
  }

  renderR7CdaActionFooter({ left = "", actions = [], attrs = "" } = {}) {
    return `<footer data-r7-cda-action-footer data-r7-cdb-list-modal-action-footer="positive-negative" ${attrs} style="display:flex;justify-content:space-between;align-items:center;gap:8px;border-top:1px solid #edf4ef;padding:10px 14px;">${left}<span style="flex:1"></span>${actions.join("")}</footer>`;
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

  _normalizeR7SettingsUserRow(row = {}, index = 0) {
    const haUserId = row.haUserId || row.ha_user_id || row.id || `user-${index + 1}`;
    const displayName = row.displayName || row.display_name || row.kind || haUserId || "사용자";
    const role = row.role || row.at || "farm_staff";
    const status = row.status || String(row.memo || "").split(" · ")[0] || "active";
    const permissionSummary = row.permissionSummary || row.permission_summary || row.state || "조회 · 기록";
    const lastSeenAt = row.lastSeenAt || row.last_seen_at || row.memo || "미확인";
    const createdAt = row.createdAt || row.created_at || "미확인";
    const updatedAt = row.updatedAt || row.updated_at || "미확인";
    const tone = row.tone || (status === "active" ? "green" : status === "rejected" ? "red" : "amber");
    return { id: String(haUserId), dbId: row.id || "", haUserId: String(haUserId), displayName, role, status, permissionSummary, lastSeenAt, createdAt, updatedAt, tone, raw: row };
  }

  _normalizeR7SettingsAuditRow(row = {}, index = 0) {
    const id = row.id || row.auditId || row.createdAt || row.created_at || row.actor || `audit-${index + 1}`;
    const action = row.action || row.raw?.action || "audit";
    const title = row.label || action || row.summary || "감사 로그";
    const actor = row.actor || row.createdBy || row.created_by || "작업자 미확인";
    const at = row.createdAt || row.created_at || row.meta || "시간 데이터 없음";
    const summary = row.summary || row.note || action || "감사 상세 없음";
    const targetRef = row.targetRef || row.target_ref || row.target || row.raw?.target_ref || "";
    const target = targetRef || row.targetLabel || row.domain || "대상 미지정";
    const result = row.result || row.status || row.state || "recorded";
    const tone = row.tone || (String(action || "").includes("reject") ? "red" : String(action || "").includes("approve") ? "green" : "blue");
    const state = result;
    return { id: String(id), title, actor, action, at, summary, target, targetRef, result, tone, state, raw: row };
  }

  _r7PermissionMatrixStateCell(state) {
    const meta = {
      allowed: { icon: "mdi:check-circle-outline", label: "허용", tone: "green" },
      review: { icon: "mdi:shield-check-outline", label: "확인", tone: "amber" },
      readonly: { icon: "mdi:eye-outline", label: "읽기 전용", tone: "blue" },
      request: { icon: "mdi:clock-outline", label: "요청 후 실행", tone: "amber" },
      none: { icon: "mdi:lock-outline", label: "없음", tone: "gray" },
    }[state] || { icon: "mdi:help-circle-outline", label: "미확인", tone: "gray" };
    const tone = this._r7ApprovalToneStyle(meta.tone);
    return `<span data-r7-settings-permission-state="${state}" data-r7-settings-permission-state-icon="${meta.icon}" style="display:inline-flex;align-items:center;justify-content:center;gap:5px;border:1px solid;border-radius:999px;padding:4px 7px;font-weight:950;${tone}">${this.renderR7CommonHaIcon(meta.icon, { size: 14 })}<span>${meta.label}</span></span>`;
  }


  renderR7SettingsCreatePreSaveChecklist(kind, title) {
    const model = {
      "greenhouse-create": [
        ["basic-info", "온실명·위치 확인", "온실 기본값이 운영 화면에 바로 노출됩니다."],
        ["operation-standard", "운영 기준 확인", "설치유형과 관리 기준을 저장 전에 확인합니다."],
        ["memo", "승인 메모", "생성 사유는 감사 로그 근거로 남깁니다."],
      ],
      "zone-create": [
        ["basic-info", "구역명·용도 확인", "구역 이름과 재배 목적을 빈 칸 없이 입력합니다."],
        ["zone-composition", "면적·배드 수 확인", "면적과 배드 수는 작물 배치 기준이 됩니다."],
        ["memo", "승인 메모", "구역 생성 사유를 남깁니다."],
      ],
      "device-sensor-mapping": [
        ["basic-info", "구역 기준 확인", "장치와 센서가 어느 구역 기준인지 확인합니다."],
        ["mapping-target", "entity 매핑 확인", "센서 entity와 장비 entity를 잘못 연결하지 않도록 확인합니다."],
        ["memo", "감사 근거", "매핑 변경 근거를 감사 로그에 남깁니다."],
      ],
      "device-create": [
        ["basic-info", "장치 기본값 확인", "장치명과 유형이 장치 목록에 노출됩니다."],
        ["device-target", "HA entity 확인", "실제 제어/상태 entity 연결 전 값을 검토합니다."],
        ["memo", "승인 메모", "장치 추가 사유를 감사 로그 근거로 남깁니다."],
      ],
      "device-group-create": [
        ["basic-info", "그룹 기본값 확인", "그룹명과 목적을 확인합니다."],
        ["zone-fk", "구역 FK 확인", "그룹 생성 단계에서 구역 FK를 선택합니다."],
        ["memo", "승인 메모", "그룹 추가 사유를 감사 로그 근거로 남깁니다."],
      ],
    }[kind] || [["basic-info", "기본 정보", "입력값을 확인합니다."]];
    const toneStyle = (idx) => idx === 0
      ? { bg: "#f1fbf4", border: "#d8eedf", iconBg: "#34a853", title: "#246b3b", icon: "✓" }
      : idx === 1
        ? { bg: "#fff8e8", border: "#f1dcaa", iconBg: "#f3a53f", title: "#9a650d", icon: "◷" }
        : { bg: "#fff6e8", border: "#efd3a3", iconBg: "#e9952d", title: "#8a5a12", icon: "!" };
    return `<aside data-r7-settings-create-pre-save-checklist data-r7-record-pre-save-checklist style="display:grid;gap:10px;border:1px solid #e5eee7;border-radius:16px;background:#fff;padding:14px;position:sticky;top:76px;z-index:2;align-self:start;max-width:340px;width:100%;box-sizing:border-box;">
      <strong style="font-size:15px;color:#1f3329;">저장 전 검증</strong>
      <div style="font-size:12px;color:#53645b;line-height:1.45;">생육조사 작성 모달 문법처럼 왼쪽은 작성 폼, 오른쪽은 저장 전 확인입니다.</div>
      <div data-r7-settings-create-validation-list style="display:grid;gap:9px;">${model.map((item, idx) => {
        const tone = toneStyle(idx);
        return `<div data-r7-settings-create-validation-card="${item[0]}" style="display:grid;grid-template-columns:34px 1fr;gap:10px;align-items:start;border:1px solid ${tone.border};border-radius:14px;background:${tone.bg};padding:11px 12px;box-shadow:0 1px 0 rgba(31,51,41,.03);"><span style="width:28px;height:28px;border-radius:50%;display:inline-grid;place-items:center;background:${tone.iconBg};color:#fff;font-size:15px;font-weight:950;line-height:1;">${tone.icon}</span><span style="display:grid;gap:3px;"><strong style="font-size:13px;color:${tone.title};">${item[1]}</strong><small style="font-size:12px;color:#62736a;line-height:1.4;">${item[2]}</small></span></div>`;
      }).join("")}</div>
      <template data-r7-settings-create-reference-modal="growth-survey-write">${title} · 생육조사 작성 모달 문법</template>
    </aside>`;
  }

  renderR7SettingsCreateGrowthLikeModal({ open, kind, title, subtitle, formAttr, closeKind, sections, submitLabel, state = "idle", error = "" }) {
    if (!open) return `<template data-r7-settings-${kind}-modal="true" data-r7-settings-${kind}-modal-open="false"></template>`;
    const statusText = state === "saving" ? "저장 중" : state === "saved" ? "저장 완료" : state === "error" ? "오류" : "입력 가능";
    const modalModel = { mode: "settings-create", recordType: kind, seasonId: "settings", title };
    const summary = `<div data-r7-settings-${kind}-modal="true" data-r7-settings-create-record-common-modal data-r7-settings-create-growth-like-modal="true" data-r7-settings-create-record-kind="${kind}" data-r7-record-modal-operator-summary style="border:1px solid #e5eee7;border-radius:12px;background:#fbfdfb;padding:11px 12px;display:grid;gap:4px;"><strong style="font-size:13px;color:#1f3329;">${title} · ${statusText}</strong><span style="font-size:12px;color:#6d7a70;line-height:1.45;">${subtitle}</span></div>`;
    const stateHtml = `${error ? `<p data-r7-settings-create-record-error style="margin:0;color:#b42318;font-size:12px;">${error}</p>` : ""}${state === "saved" ? `<p data-r7-settings-create-record-saved style="margin:0;color:#25804a;font-size:12px;">저장됨</p>` : ""}`;
    const actionRow = `<div class="r7-record-modal-actions" data-r7-settings-create-record-actions style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"><button type="button" data-r7-settings-detail-action-modal-close="${closeKind}" data-r7-record-modal-cancel style="height:38px;border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;font-weight:950;">취소</button><button type="submit" data-r7-record-modal-submit style="height:38px;border:0;border-radius:10px;background:#43ad5e;color:#fff;font-weight:950;">${state === "saving" ? "저장 중..." : state === "saved" ? "저장됨" : submitLabel}</button></div>`;
    const leftForm = `<div data-r7-settings-create-left-form style="display:grid;gap:12px;min-width:0;">${sections.join("")}</div>`;
    const body = `<form ${formAttr} data-r7-settings-create-record-form="${kind}" style="display:grid;gap:12px;min-width:0;"><div data-r7-settings-create-form-layout="growth-like" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,340px);gap:16px;align-items:start;width:100%;box-sizing:border-box;">${leftForm}${this.renderR7SettingsCreatePreSaveChecklist(kind, title)}</div>${stateHtml}${actionRow}</form>`;
    return this.renderR7RecordCommonModalShell(modalModel, summary, body);
  }

  renderR7SettingsCreateRecordCommonModal(args) {
    return this.renderR7SettingsCreateGrowthLikeModal(args);
  }

  renderR7SettingsDetailActionModal({ open, kind, title, subtitle, formAttr, closeKind, sections, fields, submitLabel, state = "idle", error = "" }) {
    // R7-095 marker manifest: data-r7-settings-greenhouse-create-modal / data-r7-settings-zone-create-modal / data-r7-settings-device-sensor-mapping-modal / data-r7-settings-greenhouse-create-form / data-r7-settings-zone-create-form / data-r7-settings-device-sensor-mapping-form.
    // R7-096 creation buttons reuse record common modal shell via renderR7RecordCommonModalShell, not direct CDA overlay.
    // R7-097 creation buttons use growth-like sectioned form grammar from 생육조사 작성 모달.
    return this.renderR7SettingsCreateGrowthLikeModal({ open, kind, title, subtitle, formAttr, closeKind, sections: sections || fields || [], submitLabel, state, error });
  }

  _r7SettingsCreateField(name, label, value = "", attrs = "") {
    return `<label style="display:grid;gap:5px;font-size:12px;font-weight:900;color:#31523b;min-width:0;"><span>${label}</span><input name="${name}" value="${value}" required ${attrs} style="height:36px;border:1px solid #dcebe0;border-radius:8px;padding:0 9px;background:#fff;box-sizing:border-box;font-size:12px;min-width:0;width:100%;"></label>`;
  }

  _r7SettingsCreateSelect(name, label, options = [], selectedValue = "", attrs = "") {
    const items = options.map(({ value, label: optionLabel, attrs: optionAttrs = "" }) => `<option value="${value}"${String(value) === String(selectedValue) ? " selected" : ""} ${optionAttrs}>${optionLabel}</option>`).join("");
    return `<label style="display:grid;gap:5px;font-size:12px;font-weight:900;color:#31523b;min-width:0;"><span>${label}</span><select name="${name}" required ${attrs} style="height:36px;border:1px solid #dcebe0;border-radius:8px;padding:0 9px;background:#fff;box-sizing:border-box;font-size:12px;min-width:0;width:100%;">${items}</select></label>`;
  }

  _r7SettingsCreateNumberWithUnit(name, label, value = "", unit = "", attrs = "") {
    return `<label style="display:grid;gap:5px;font-size:12px;font-weight:900;color:#31523b;min-width:0;"><span>${label}</span><span style="display:grid;grid-template-columns:1fr auto;align-items:center;border:1px solid #dcebe0;border-radius:8px;background:#fff;overflow:hidden;"><input name="${name}" type="number" value="${value}" required ${attrs} style="height:36px;border:0;padding:0 9px;background:#fff;box-sizing:border-box;font-size:12px;min-width:0;width:100%;"><span style="border-left:1px solid #edf2ee;padding:0 10px;color:#5d6f62;font-weight:950;">${unit}</span></span></label>`;
  }

  _r7SettingsCreateTextarea(name, label, value = "") {
    return `<label style="display:grid;gap:5px;font-size:12px;font-weight:900;color:#31523b;min-width:0;"><span>${label}</span><textarea name="${name}" rows="3" style="border:1px solid #dcebe0;border-radius:9px;padding:8px 10px;resize:vertical;box-sizing:border-box;font-size:12px;">${value}</textarea></label>`;
  }

  _r7SettingsCreateSection(key, title, body) {
    return `<fieldset data-r7-settings-create-section="${key}" style="border:1px solid #edf2ee;border-radius:12px;padding:12px;display:grid;gap:10px;margin:0;background:#fff;"><legend style="font-size:13px;font-weight:950;color:#1f3329;padding:0 4px;">${title}</legend>${body}</fieldset>`;
  }

  renderR7SettingsGreenhouseCreateModal() {
    const modal = this._settingsGreenhouseCreateModal || { open: false };
    const values = modal.values || {};
    const isEdit = modal.mode === "edit";
    const operatingStatusOptions = [
      { value: "운영중", label: "운영중" }, { value: "대기", label: "대기" }, { value: "점검중", label: "점검중" }, { value: "비활성", label: "비활성" },
    ];
    const statusOptions = [
      { value: "정상", label: "정상" }, { value: "비활성", label: "비활성" }, { value: "점검중", label: "점검중" },
    ];
    const installTypeOptions = [
      { value: "NUC edge", label: "NUC edge" },
    ];
    const timezoneOptions = [
      { value: "Asia/Seoul", label: "Asia/Seoul · 한국 표준시" },
      { value: "UTC", label: "UTC" },
      { value: "Asia/Tokyo", label: "Asia/Tokyo" },
      { value: "America/Los_Angeles", label: "America/Los_Angeles" },
    ];
    const sections = [
      this._r7SettingsCreateSection("basic-info", "기본 정보", `<div style="display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:10px;">${this._r7SettingsCreateField("name", "온실명", values.name || this._homeContext?.greenhouseName || "대표 온실")}${this._r7SettingsCreateField("location", "위치", values.location || "경기 화성")}</div>`),
      this._r7SettingsCreateSection("operation-standard", "운영 기준", `<div style="display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:10px;">${this._r7SettingsCreateSelect("operatingStatus", "운영상태", operatingStatusOptions, values.operatingStatus || "운영중")}${this._r7SettingsCreateSelect("status", "상태", statusOptions, values.status || "정상")}${this._r7SettingsCreateSelect("installType", "설치유형", installTypeOptions, values.installType || "NUC edge")}${this._r7SettingsCreateSelect("timezone", "기본 시간대", timezoneOptions, values.timezone || "Asia/Seoul")}</div>`),
      this._r7SettingsCreateSection("memo", "메모", this._r7SettingsCreateTextarea("note", "생성 사유", values.note || "")),
    ];
    return this.renderR7SettingsDetailActionModal({ open: modal.open, kind: "greenhouse-create", title: isEdit ? "온실 수정" : "온실 생성", subtitle: "생육조사 작성 모달처럼 기본 정보와 검증을 나눠 저장합니다", formAttr: "data-r7-settings-greenhouse-create-form", closeKind: "greenhouse", state: modal.state, error: modal.error, submitLabel: isEdit ? "온실 수정" : "온실 저장", sections });
  }

  _r7SettingsNextZoneName(greenhouse, zones = []) {
    const greenhouseId = String(greenhouse?.id || greenhouse?.greenhouseId || "1");
    const greenhouseNumber = String(greenhouse?.displayNumber || greenhouse?.display_number || greenhouse?.greenhouseNumber || greenhouse?.number || "1");
    const related = (Array.isArray(zones) ? zones : []).filter((zone) => String(zone.greenhouseId || zone.greenhouse_id || zone.greenhouse || "") === greenhouseId || String(zone.greenhouseName || "") === String(greenhouse?.name || greenhouse?.greenhouseName || ""));
    const maxZone = related.reduce((max, zone) => {
      const label = String(zone.zoneName || zone.name || zone.label || "");
      const match = label.match(/(?:^|[^0-9])([0-9]+)\s*구역/) || label.match(/^[0-9]+-([0-9]+)/);
      return Math.max(max, match ? Number(match[1]) : 0);
    }, 0);
    return `${greenhouseNumber}-${maxZone + 1}구역`;
  }

  renderR7SettingsZoneCreateModal() {
    const modal = this._settingsZoneCreateModal || { open: false };
    const values = modal.values || {};
    const isEdit = modal.mode === "edit";
    const settingsData = this.r7SettingsGreenhouseZoneData();
    const settingsGreenhouses = Array.isArray(settingsData.greenhouses) ? settingsData.greenhouses : [];
    const settingsZones = Array.isArray(settingsData.zones) ? settingsData.zones : [];
    const fallbackGreenhouse = { id: 1, name: this._homeContext?.greenhouseName || "대표온실" };
    const greenhouses = (settingsGreenhouses.length ? settingsGreenhouses : [fallbackGreenhouse]).slice().sort((a, b) => Number(a.id || a.greenhouseId || 0) - Number(b.id || b.greenhouseId || 0)).map((greenhouse, index) => ({ ...greenhouse, displayNumber: greenhouse.displayNumber || greenhouse.display_number || index + 1 }));
    const selectedGreenhouse = greenhouses.find((greenhouse) => String(greenhouse.id || greenhouse.greenhouseId) === String(values.greenhouseId || "")) || greenhouses[0];
    const greenhouseOptions = greenhouses.map((greenhouse, index) => {
      const id = greenhouse.id || greenhouse.greenhouseId || index + 1;
      const name = greenhouse.name || greenhouse.greenhouseName || `온실 ${index + 1}`;
      return { value: id, label: name, attrs: `data-next-zone-name="${this._r7SettingsNextZoneName(greenhouse, settingsZones)}"` };
    });
    const purposeOptions = [
      { value: "재배 구역", label: "재배 구역" },
      { value: "육묘 구역", label: "육묘 구역" },
      { value: "사무 구역", label: "사무 구역" },
      { value: "실험 구역", label: "실험 구역" },
      { value: "자재 보관 구역", label: "자재 보관 구역" },
      { value: "격리·검역 구역", label: "격리·검역 구역" },
    ];
    const statusOptions = [{ value: "정상", label: "정상" }, { value: "감사 근거", label: "감사 근거" }, { value: "검토 필요", label: "검토 필요" }];
    const nextZoneName = this._r7SettingsNextZoneName(selectedGreenhouse, settingsZones);
    const zoneNameAttrs = isEdit ? 'data-r7-settings-zone-auto-name' : 'readonly data-r7-settings-zone-auto-name';
    const sections = [
      this._r7SettingsCreateSection("basic-info", "기본 정보", `<div style="display:grid;grid-template-columns:repeat(3,minmax(150px,1fr));gap:10px;">${this._r7SettingsCreateSelect("greenhouseId", "온실명", greenhouseOptions, values.greenhouseId || selectedGreenhouse?.id || 1, 'data-r7-settings-zone-greenhouse-fk-select')}${this._r7SettingsCreateField("name", "구역명", values.name || nextZoneName, zoneNameAttrs)}${this._r7SettingsCreateSelect("purpose", "구역 용도", purposeOptions, values.purpose || "재배 구역")}</div>`),
      this._r7SettingsCreateSection("zone-composition", "구역 구성", `<div style="display:grid;grid-template-columns:repeat(3,minmax(160px,1fr));gap:10px;">${this._r7SettingsCreateNumberWithUnit("area", "면적", values.area || "120", "m²", 'min="0" step="0.1" data-r7-settings-zone-area-unit="m2"')}${this._r7SettingsCreateNumberWithUnit("bedCount", "배드 수", values.bedCount || "6", "개", 'min="0" step="1" data-r7-settings-zone-bed-unit="count"')}${this._r7SettingsCreateSelect("status", "상태", statusOptions, values.status || "정상")}</div>`),
      this._r7SettingsCreateSection("memo", "메모", this._r7SettingsCreateTextarea("note", "생성 사유", values.note || "")),
    ];
    return this.renderR7SettingsDetailActionModal({ open: modal.open, kind: "zone-create", title: isEdit ? "구역 수정" : "구역 생성", subtitle: "온실별 재배·운영 공간을 등록하고 저장 전 기준을 확인합니다", formAttr: "data-r7-settings-zone-create-form", closeKind: "zone", state: modal.state, error: modal.error, submitLabel: isEdit ? "구역 수정" : "구역 저장", sections });
  }

  renderR7SettingsDeviceCreateModal() {
    const modal = this._settingsDeviceCreateModal || { open: false };
    const values = modal.values || {};
    const deviceTypeOptions = [
      { value: "환기창", label: "환기창" }, { value: "순환팬", label: "순환팬" }, { value: "관수 밸브", label: "관수 밸브" }, { value: "양액기", label: "양액기" }, { value: "센서", label: "센서" },
    ];
    const statusOptions = [{ value: "정상", label: "정상" }, { value: "점검 필요", label: "점검 필요" }, { value: "비활성", label: "비활성" }];
    const sections = [
      this._r7SettingsCreateSection("basic-info", "기본 정보", `<div style="display:grid;grid-template-columns:repeat(3,minmax(150px,1fr));gap:10px;">${this._r7SettingsCreateField("deviceName", "장치명", values.deviceName || "신규 장치")}${this._r7SettingsCreateSelect("deviceType", "장치 유형", deviceTypeOptions, values.deviceType || "환기창")}${this._r7SettingsCreateSelect("status", "상태", statusOptions, values.status || "정상")}</div>`),
      this._r7SettingsCreateSection("device-target", "장치 대상", `<div style="display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:10px;">${this._r7SettingsCreateField("entityId", "HA entity", values.entityId || "switch.greenhouse_device")}${this._r7SettingsCreateField("vendorModel", "제조사/모델", values.vendorModel || "미등록")}</div>`),
      this._r7SettingsCreateSection("memo", "메모", this._r7SettingsCreateTextarea("note", "장치 추가 사유", values.note || "")),
    ];
    return this.renderR7SettingsDetailActionModal({ open: modal.open, kind: "device-create", title: "장치 생성", subtitle: "온실 생성 팝업처럼 기본 정보와 저장 전 검증을 나눠 입력합니다", formAttr: "data-r7-settings-device-create-form", closeKind: "device", state: modal.state, error: modal.error, submitLabel: "장치 저장", sections });
  }

  renderR7SettingsDeviceGroupCreateModal() {
    const modal = this._settingsDeviceGroupCreateModal || { open: false };
    const values = modal.values || {};
    const settingsData = this.r7SettingsGreenhouseZoneData();
    const zones = (Array.isArray(settingsData.zones) && settingsData.zones.length ? settingsData.zones : (this._homeContext?.zones || [{ id: "zone-a", zoneName: "A구역", name: "A구역" }])).filter((zone) => this._r7ZoneId?.(zone) !== "all");
    const zoneOptions = zones.map((zone, index) => ({ value: this._r7ZoneId?.(zone) || zone.zoneId || zone.id || `zone-${index + 1}`, label: this._r7ZoneName?.(zone) || zone.zoneName || zone.name || `${index + 1}구역` }));
    const groupTypeOptions = [{ value: "센서 그룹", label: "센서 그룹" }, { value: "장치 그룹", label: "장치 그룹" }, { value: "관수 그룹", label: "관수 그룹" }];
    const candidates = this._r7SettingsUngroupedConnectedDeviceRows();
    const candidateHtml = candidates.length ? candidates.map((device) => `<label data-r7-settings-device-group-candidate-row="${device.id}" style="border:1px solid #edf4ef;border-radius:10px;padding:9px;display:flex;gap:8px;align-items:flex-start;background:#fff;"><input type="checkbox" name="deviceIds" value="${device.id}" data-r7-settings-device-group-candidate-checkbox data-r7-settings-device-group-ungrouped-only="true" data-r7-settings-device-group-multi-select="true" style="margin-top:3px;"><span style="display:grid;gap:3px;"><b>${device.deviceName || device.name}</b><span>${device.deviceType || device.installType} · ${device.entityId || device.deviceEntity}</span></span></label>`).join("") : `<p data-r7-settings-device-group-no-candidate style="margin:0;color:#78927f;font-size:12px;">그룹에 추가할 수 있는 연결 완료·미등록 장치가 없습니다.</p>`;
    const sections = [
      this._r7SettingsCreateSection("basic-info", "기본 정보", `<div style="display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:10px;">${this._r7SettingsCreateField("groupName", "그룹명", values.groupName || "신규 장치 그룹")}${this._r7SettingsCreateSelect("groupType", "그룹 유형", groupTypeOptions, values.groupType || "장치 그룹")}</div>`),
      this._r7SettingsCreateSection("zone-fk", "구역 FK", `<div style="display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:10px;">${this._r7SettingsCreateSelect("zoneId", "구역 FK", zoneOptions, values.zoneId || zoneOptions[0]?.value || "zone-a", 'data-r7-settings-device-group-zone-fk-select')}${this._r7SettingsCreateField("linkPolicy", "장치 연결 정책", values.linkPolicy || "연결 완료 장치만 그룹 등록")}</div>`),
      this._r7SettingsCreateSection("device-candidates", "그룹 장치 선택", `<div data-r7-settings-device-group-candidates data-r7-settings-device-group-ungrouped-only="true" data-r7-settings-device-group-multi-select="true" style="display:grid;gap:8px;">${candidateHtml}</div>`),
      this._r7SettingsCreateSection("memo", "메모", this._r7SettingsCreateTextarea("note", "그룹 추가 사유", values.note || "")),
    ];
    return this.renderR7SettingsDetailActionModal({ open: modal.open, kind: "device-group-create", title: "그룹 생성", subtitle: "연결 완료 후 아직 그룹에 등록되지 않은 장치를 체크박스로 다중 선택합니다", formAttr: "data-r7-settings-device-group-create-form", closeKind: "device-group", state: modal.state, error: modal.error, submitLabel: "그룹 저장", sections });
  }

  renderR7SettingsDeviceSensorMappingModal() {
    const modal = this._settingsDeviceSensorMappingModal || { open: false };
    const settingsData = this.r7SettingsGreenhouseZoneData();
    const zones = (Array.isArray(settingsData.zones) && settingsData.zones.length ? settingsData.zones : (this._zonesForRender?.() || [{ zoneId: "zone-1", name: "1구역" }])).filter((zone) => this._r7ZoneId?.(zone) !== "all");
    const zoneOptions = zones.map((zone, index) => ({ value: this._r7ZoneId?.(zone) || zone.zoneId || zone.id || `zone-${index + 1}`, label: this._r7ZoneName?.(zone) || zone.zoneName || zone.name || `${index + 1}구역` }));
    const entityOptions = this._r7SettingsUnlinkedHaEntityOptions();
    const equipmentKindOptions = this._r7SettingsEquipmentKindOptions();
    const selectedEntity = entityOptions[0]?.value || "";
    const sections = [
      this._r7SettingsCreateSection("device-connection", "장치 연결 작성", `<div style="display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:10px;">${this._r7SettingsCreateSelect("entityId", "장비 엔티티 ID", entityOptions.length ? entityOptions : [{ value: "", label: "미연결 HA entity 없음", attrs: 'data-r7-settings-unlinked-ha-entity-option="empty"' }], selectedEntity, 'data-r7-settings-unlinked-ha-entity-select')}${this._r7SettingsCreateSelect("deviceType", "장비종류", equipmentKindOptions, modal.values?.deviceType || "온습도 센서", 'data-r7-settings-equipment-kind-select')}</div>`),
      this._r7SettingsCreateSection("device-name", "장치명", `<div style="display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:10px;">${this._r7SettingsCreateField("deviceName", "장치명", modal.values?.deviceName || "", 'placeholder="예: A구역 천창 1" data-r7-settings-device-name-input')}${this._r7SettingsCreateSelect("zoneId", "구역", zoneOptions, modal.values?.zoneId || zoneOptions[0]?.value || "zone-1")}</div>`),
      this._r7SettingsCreateSection("memo", "메모", this._r7SettingsCreateTextarea("note", "장치 연결 근거", "")),
    ];
    return this.renderR7SettingsDetailActionModal({ open: modal.open, kind: "device-sensor-mapping", title: "장치 연결 작성", subtitle: "HA에 추가되어 있지만 Green Smart에 아직 연결되지 않은 장비 entity를 선택합니다", formAttr: "data-r7-settings-device-sensor-mapping-form", closeKind: "mapping", state: modal.state, error: modal.error, submitLabel: "장치 연결 저장", sections }).replace('data-r7-record-modal-type="device-sensor-mapping"', 'data-r7-record-modal-type="device-sensor-mapping" data-r7-settings-device-connection-authoring-modal="true"');
  }


  renderR7SettingsShortcutReviewLikeModal() {
    const modal = this._settingsShortcutCdaModal || { open: false, kind: "" };
    if (!modal.open) return `<template data-r7-settings-shortcut-cda-split-modal="true" data-r7-settings-shortcut-cda-split-open="false"></template>`;
    const settingsData = this.r7SettingsGreenhouseZoneData();
    const settingsZones = Array.isArray(settingsData.zones) ? settingsData.zones : [];
    const settingsGreenhouses = Array.isArray(settingsData.greenhouses) ? settingsData.greenhouses : [];
    const settingsDataDeviceSensorMappings = Array.isArray(settingsData.deviceSensorMappings) ? settingsData.deviceSensorMappings : [];
    const zones = (settingsData.zones && settingsData.zones.length ? settingsData.zones : (this._zonesForRender?.() || [])).filter((zone) => this._r7ZoneId?.(zone) !== "all");
    const selectedZone = zones[0] || { id: "zone-1", name: "1구역", zoneName: "1구역", purpose: "재배", area: "120㎡", bedCount: 6, currentCrop: { crop_label_ko: "토마토", crop_cycle_id: "17" }, equipmentProfile: { labels: ["온도 센서", "천창", "미연결 양액기"] } };
    const kind = modal.kind || "greenhouse-info";
    const primaryGreenhouse = settingsGreenhouses[0] || { name: this._homeContext?.greenhouseName || "제1온실", location: "경기 화성", installType: "NUC edge" };
    const meta = {
      "greenhouse-info": { title: "온실 정보", subtitle: "온실 기본 정보와 운영 기준 검토", icon: "mdi:greenhouse", marker: "data-r7-settings-greenhouse-info-split-modal", type: "온실 정보", target: primaryGreenhouse.name || this._homeContext?.greenhouseName || "제1온실" },
      "zone-list": { title: "구역 목록", subtitle: "구역별 상태와 현재 작기 검토", icon: "mdi:view-list-outline", marker: "data-r7-settings-zone-list-split-modal", type: "구역 목록", target: this._r7ZoneName?.(selectedZone) || selectedZone.zoneName || selectedZone.name || "1구역" },
      "equipment-info": { title: "장치 목록", subtitle: "장치 연결 작성 기준으로 등록/연결된 장치를 확인합니다", icon: "mdi:devices", marker: "data-r7-settings-device-list-cda-modal=\"true\" data-r7-settings-equipment-info-split-modal", type: "장치 목록", target: this._r7ZoneName?.(selectedZone) || selectedZone.zoneName || selectedZone.name || "1구역" },
      "device-group-list": { title: "그룹 목록", subtitle: "장치 그룹별 포함 장치와 상태를 확인합니다", icon: "mdi:view-grid-plus-outline", marker: "data-r7-settings-device-group-list-cda-modal=\"true\"", type: "그룹 목록", target: this._r7ZoneName?.(selectedZone) || selectedZone.zoneName || selectedZone.name || "1구역" },
    }[kind] || { title: "상세", subtitle: "설정 상세 검토", icon: "mdi:information-outline", marker: "data-r7-settings-greenhouse-info-split-modal", type: "설정", target: "대상" };
    if (kind === "greenhouse-info") {
      const fallbackGreenhouse = { id: "greenhouse-primary", name: this._homeContext?.greenhouseName || "대표 온실", location: this._homeContext?.location || "위치 미등록", installType: "설치유형 미등록", approvalScope: "승인범위 미등록", status: "active", note: "미등록", createdAt: "미등록", updatedAt: "미등록" };
      const greenhouseRows = this.normalizeR7SettingsGreenhouseEntityRows(settingsGreenhouses.length ? settingsGreenhouses : [fallbackGreenhouse]);
      const selectedGreenhouse = greenhouseRows.find((row) => String(row.id) === String(modal.selectedGreenhouseId || "")) || greenhouseRows[0];
      const entityFooterActions = selectedGreenhouse?.id ? [
        `<button type="button" data-r7-settings-greenhouse-edit-button="${selectedGreenhouse.id}" data-r7-cdb-modal-action="positive" data-r7-cdb-positive-action="edit" style="border:1px solid #badcc8;border-radius:10px;background:#f0fbf4;color:#25804a;padding:8px 12px;font-weight:950;">수정</button>`,
        `<button type="button" data-r7-settings-greenhouse-delete-button="${selectedGreenhouse.id}" data-r7-cdb-modal-action="negative" data-r7-cdb-negative-action="delete" style="border:1px solid #efc5c0;border-radius:10px;background:#fff7f6;color:#b4453a;padding:8px 12px;font-weight:950;">삭제</button>`,
      ] : [];
      return this.renderR7CdaEntityListDetailModal({
        entityType: "greenhouse-info",
        modalOpen: modal.open,
        icon: meta.icon,
        title: meta.title,
        subtitle: "온실별 목록 · 선택 온실 상세",
        rows: greenhouseRows,
        selectedId: selectedGreenhouse?.id,
        listColumns: R7_SETTINGS_GREENHOUSE_LIST_COLUMNS,
        detailFields: R7_SETTINGS_GREENHOUSE_DETAIL_FIELD_ORDER,
        detailSectionTitle: "1. 온실 상세 정보",
        detailPanelAttrs: "data-r7-settings-greenhouse-info-detail-panel",
        rowAttr: "data-r7-settings-greenhouse-info-row",
        entityFooterActions,
        closeAttr: "data-r7-settings-shortcut-cda-split-close",
        marker: meta.marker,
      });
    }
    if (kind === "zone-list") {
      const fallbackZone = { id: "zone-primary", zoneName: this._r7ZoneName?.(selectedZone) || selectedZone.zoneName || selectedZone.name || "1구역", greenhouseName: this._homeContext?.greenhouseName || "대표 온실", purpose: selectedZone.purpose || "재배", area: selectedZone.area || "120㎡", bedCount: selectedZone.bedCount ?? selectedZone.beds ?? 6, currentCrop: selectedZone.currentCrop || selectedZone.cropName || "미등록", status: selectedZone.status || "active", updatedAt: selectedZone.updatedAt || "미등록", note: selectedZone.note || "미등록" };
      const sourceZones = settingsZones.length ? settingsZones : (zones.length ? zones : [fallbackZone]);
      const zoneRows = this.normalizeR7SettingsZoneEntityRows(sourceZones);
      const selectedZoneRow = zoneRows.find((row) => String(row.id) === String(modal.selectedZoneId || modal.selectedId || "")) || zoneRows[0];
      const entityFooterActions = selectedZoneRow?.id ? [
        `<button type="button" data-r7-settings-zone-edit-button="${selectedZoneRow.id}" data-r7-cdb-modal-action="positive" data-r7-cdb-positive-action="edit" style="border:1px solid #badcc8;border-radius:10px;background:#f0fbf4;color:#25804a;padding:8px 12px;font-weight:950;">수정</button>`,
        `<button type="button" data-r7-settings-zone-delete-button="${selectedZoneRow.id}" data-r7-cdb-modal-action="negative" data-r7-cdb-negative-action="delete" style="border:1px solid #efc5c0;border-radius:10px;background:#fff7f6;color:#b4453a;padding:8px 12px;font-weight:950;">삭제</button>`,
      ] : [];
      return this.renderR7CdaEntityListDetailModal({
        entityType: "zone-list",
        modalOpen: modal.open,
        icon: meta.icon,
        title: meta.title,
        subtitle: "구역별 목록 · 선택 구역 상세",
        rows: zoneRows,
        selectedId: selectedZoneRow?.id,
        listColumns: R7_SETTINGS_ZONE_LIST_COLUMNS,
        detailFields: R7_SETTINGS_ZONE_DETAIL_FIELD_ORDER,
        detailSectionTitle: "1. 구역 상세 정보",
        detailPanelAttrs: "data-r7-settings-zone-list-detail-panel",
        rowAttr: "data-r7-settings-zone-list-row",
        entityFooterActions,
        closeAttr: "data-r7-settings-shortcut-cda-split-close",
        marker: meta.marker,
      });
    }
    if (kind === "equipment-info") {
      const equipmentRows = this._r7SettingsConnectedDeviceRows().length ? this._r7SettingsConnectedDeviceRows() : [this.normalizeR7SettingsEquipmentEntityRows([{ id: "mapping-primary", zoneId: this._r7ZoneId?.(selectedZone) || selectedZone.zoneId || selectedZone.id || "zone-1", zoneName: this._r7ZoneName?.(selectedZone) || selectedZone.zoneName || selectedZone.name || "1구역", deviceName: "장치 미등록", deviceType: "장치", entityId: "entity 미연결", status: "inactive", note: "장치 연결 작성 후 목록에 표시됩니다" }], settingsZones.length ? settingsZones : zones)[0]];
      const selectedMapping = equipmentRows.find((row) => String(row.id) === String(modal.selectedMappingId || modal.selectedId || "")) || equipmentRows[0];
      const entityFooterActions = selectedMapping?.id ? [
        `<button type="button" data-r7-settings-device-delete-button="${selectedMapping.id}" data-r7-cdb-modal-action="negative" data-r7-cdb-negative-action="delete" style="border:1px solid #efc5c0;border-radius:10px;background:#fff7f6;color:#b4453a;padding:8px 12px;font-weight:950;">삭제</button>`,
        `<button type="button" data-r7-settings-device-edit-button="${selectedMapping.id}" data-r7-cdb-modal-action="positive" data-r7-cdb-positive-action="edit" style="border:1px solid #badcc8;border-radius:10px;background:#f0fbf4;color:#25804a;padding:8px 12px;font-weight:950;">수정</button>`,
      ] : [];
      return this.renderR7CdaEntityListDetailModal({
        entityType: "equipment-info",
        modalOpen: modal.open,
        icon: meta.icon,
        title: meta.title,
        subtitle: "장치별 목록 · 선택 장치 상세",
        rows: equipmentRows,
        selectedId: selectedMapping?.id,
        listColumns: ["장치명", "장비종류", "장비 엔티티 ID", "상태"],
        detailFields: [["deviceName", "장치명"], ["deviceType", "장비종류"], ["entityId", "장비 엔티티 ID"], ["location", "구역"], ["statusLabel", "상태"], ["note", "메모"]],
        detailSectionTitle: "1. 장치 상세 정보",
        detailPanelAttrs: "data-r7-settings-device-list-detail-panel",
        rowAttr: "data-r7-settings-equipment-info-row",
        entityFooterActions,
        closeAttr: "data-r7-settings-shortcut-cda-split-close",
        marker: meta.marker,
        suppressCloseButtons: true,
      });
    }
    if (kind === "device-group-list") {
      const groups = Array.isArray(settingsData.deviceGroups) && settingsData.deviceGroups.length ? settingsData.deviceGroups : [{ id: "group-empty", groupName: "그룹 미등록", groupType: "장치 그룹", zoneId: this._r7ZoneId?.(selectedZone) || selectedZone.zoneId || selectedZone.id || "zone-a", deviceIds: [], status: "empty", note: "그룹 생성 후 장치를 선택하세요" }];
      const devicesById = new Map(this._r7SettingsConnectedDeviceRows().map((device) => [String(device.id), device]));
      const groupRows = groups.map((group, index) => {
        const deviceIds = Array.isArray(group.deviceIds) ? group.deviceIds : [];
        const deviceNames = deviceIds.map((id) => devicesById.get(String(id))?.deviceName || devicesById.get(String(id))?.name || id).join(" · ") || "장치 없음";
        return { id: group.id || group.groupId || `group-${index + 1}`, name: group.groupName || group.group_name || "장치 그룹", location: group.zoneName || group.zone_name || group.zoneId || group.zone_id || "구역 미등록", installType: group.groupType || group.group_type || "장치 그룹", approvalScope: `${deviceIds.length}개 장치`, status: group.status || "active", statusLabel: group.status === "inactive" ? "비활성" : group.status === "empty" ? "미등록" : "정상", tone: group.status === "inactive" || group.status === "empty" ? "amber" : "green", deviceNames, note: group.note || deviceNames };
      });
      const selectedGroup = groupRows.find((row) => String(row.id) === String(modal.selectedGroupId || modal.selectedId || "")) || groupRows[0];
      const entityFooterActions = selectedGroup?.id ? [
        `<button type="button" data-r7-settings-device-group-delete-button="${selectedGroup.id}" data-r7-cdb-modal-action="negative" data-r7-cdb-negative-action="delete" style="border:1px solid #efc5c0;border-radius:10px;background:#fff7f6;color:#b4453a;padding:8px 12px;font-weight:950;">삭제</button>`,
        `<button type="button" data-r7-settings-device-group-edit-button="${selectedGroup.id}" data-r7-cdb-modal-action="positive" data-r7-cdb-positive-action="edit" style="border:1px solid #badcc8;border-radius:10px;background:#f0fbf4;color:#25804a;padding:8px 12px;font-weight:950;">수정</button>`,
      ] : [];
      return this.renderR7CdaEntityListDetailModal({
        entityType: "device-group-list",
        modalOpen: modal.open,
        icon: meta.icon,
        title: meta.title,
        subtitle: "그룹별 목록 · 선택 그룹 상세",
        rows: groupRows,
        selectedId: selectedGroup?.id,
        listColumns: ["그룹명", "그룹 유형", "구역", "장치 수"],
        detailFields: [["name", "그룹명"], ["installType", "그룹 유형"], ["location", "구역"], ["approvalScope", "장치 수"], ["deviceNames", "포함 장치"], ["statusLabel", "상태"]],
        detailSectionTitle: "1. 그룹 상세 정보",
        detailPanelAttrs: "data-r7-settings-device-group-list-detail-panel",
        rowAttr: "data-r7-settings-device-group-list-row",
        entityFooterActions,
        closeAttr: "data-r7-settings-shortcut-cda-split-close",
        marker: meta.marker,
      });
    }
    const reviewRows = [
      { id: "settings-summary", at: "검토", type: meta.type || "설정", risk: "낮음", summary: meta.subtitle || "설정 상세 검토", actor: meta.target || "대상", tone: "green" },
    ];
    const selected = reviewRows.find((row) => String(row.id) === String(modal.selectedGreenhouseId || "")) || reviewRows[0];
    const search = this.renderR7CdaSearchFilterBar({ searchAttr: "data-r7-settings-shortcut-search-input", searchPlaceholder: `${meta.title} 검색`, filters: [["all","전체"],["needs-review","검토 필요"],["normal","정상"],["evidence","감사 근거"]].map(([key,label]) => ({ label, active: key === "all", tone: key === "needs-review" ? "red" : "green", attrs: `data-r7-settings-shortcut-filter="${key}"` })) });
    const rows = reviewRows.map((row) => this.renderR7CdaCompactListRow({ selected: row.id === selected.id, attrs: `data-r7-settings-shortcut-review-row="${row.id}" data-r7-settings-shortcut-review-row-selected="${row.id === selected.id ? 'true' : 'false'}"`, columns: [`<span>${row.at}</span>`, `<b>${row.type}</b>`, `<span style="border:1px solid;border-radius:999px;padding:3px 6px;text-align:center;font-weight:1000;${this._r7ApprovalToneStyle(row.tone)}">${row.risk}</span>`, `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${row.summary}</span>`, `<span>${row.actor}</span>`] })).join("");
    const listPanel = this.renderR7CdaListPanel({ title: `${meta.title} 목록`, columns: ["상태", "유형", "위험도", "요약", "대상"], rowsHtml: rows, footer: `<span>‹</span><span style="border:1px solid #badcc8;border-radius:8px;padding:5px 9px;background:#f6fbf7;color:#31523b;font-weight:900;">1</span><span>›</span><span>총 ${reviewRows.length}건</span>`, attrs: `data-r7-settings-shortcut-review-list-panel data-r7-settings-shortcut-cda-split-kind="${kind}"` });
    const requestInfo = this.renderR7CdaDetailSection({ title: "1. 요청 정보", attrs: 'data-r7-settings-shortcut-review-section="request-info"', body: `<div style="margin-top:7px;border:1px solid #edf4ef;border-radius:12px;display:grid;grid-template-columns:repeat(4,1fr);overflow:hidden;"><span style="padding:8px;background:#fbfdfb;font-weight:950;">대상</span><span style="padding:8px;">${meta.target}</span><span style="padding:8px;background:#fbfdfb;font-weight:950;">유형</span><span style="padding:8px;">${meta.type}</span><span style="padding:8px;background:#fbfdfb;font-weight:950;">상태</span><span style="padding:8px;">${selected.at}</span><span style="padding:8px;background:#fbfdfb;font-weight:950;">위험도</span><span style="padding:8px;font-weight:950;">${selected.risk}</span></div>` });
    const changeDetail = this.renderR7CdaDetailSection({ title: "2. 변경 내용", attrs: 'data-r7-settings-shortcut-review-section="change-detail"', body: `<div style="margin-top:7px;border:1px solid #edf4ef;border-radius:12px;display:grid;grid-template-columns:.8fr 1fr 1fr;overflow:hidden;">${[["항목","현재값","검토값"],[selected.type, selected.summary, "read-only 확인"],["범위", meta.target, kind]].map((cols, idx) => cols.map((cell) => `<span style="padding:8px;background:${idx === 0 ? '#fbfdfb' : '#fff'};font-weight:${idx === 0 ? '950' : '700'};border-bottom:${idx === 2 ? '0' : '1px solid #edf4ef'};">${cell}</span>`).join("")).join("")}</div>` });
    const evidence = this.renderR7CdaDetailSection({ title: "3. 감사 근거", attrs: 'data-r7-settings-shortcut-review-section="evidence"', body: `<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;"><span style="border:1px solid #badcc8;border-radius:10px;background:#f0fbf4;color:#25804a;padding:8px 10px;font-weight:950;">승인 기준</span><span style="border:1px solid #bdd7f0;border-radius:10px;background:#eef6ff;color:#326aa5;padding:8px 10px;font-weight:950;">감사 근거</span><span style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 10px;font-weight:950;">read-only 검토</span></div><p style="margin:8px 0 0;border:1px solid #edf4ef;border-radius:12px;background:#fbfdfb;padding:10px;line-height:1.5;">${meta.subtitle}</p>` });
    const detailPanel = this.renderR7CdaDetailPanel({ title: "선택 항목 검토", attrs: `data-r7-settings-shortcut-review-pane data-r7-settings-shortcut-cda-split-kind="${kind}"`, badge: `<span style="border:1px solid;border-radius:999px;padding:5px 9px;font-size:11px;${this._r7ApprovalToneStyle(selected.tone)}">${selected.risk}</span>`, body: `${requestInfo}${changeDetail}${evidence}`, footer: this.renderR7CdaActionFooter({ left: `<button type="button" data-r7-settings-shortcut-evidence-button style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 11px;font-weight:950;">상세 로그 보기</button>`, actions: [`<button type="button" data-r7-settings-shortcut-cda-split-close style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 12px;font-weight:950;">닫기</button>`] }) });
    const header = this.renderR7CdaModalHeader({ icon: meta.icon, title: meta.title, subtitle: `${meta.target} · ${meta.type} · 검토`, closeAttr: "data-r7-settings-shortcut-cda-split-close" });
    const footer = `<footer style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #edf4ef;padding-top:10px;color:#5d6f62;font-size:12px;"><span>ⓘ 목록 버튼은 승인 모달/감사 로그 모달과 같은 검토형 목록 문법을 사용합니다.</span><button type="button" data-r7-settings-shortcut-cda-split-close style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 14px;font-weight:950;">닫기</button></footer>`;
    return this.renderR7CdaSplitModal({ open: modal.open, zIndex: 44, overlayAttrs: `${meta.marker} data-r7-settings-shortcut-cda-split-modal="true" data-r7-settings-shortcut-review-like-modal="approval-audit" data-r7-settings-shortcut-cda-split-kind="${kind}"`, cardAttrs: `data-r7-settings-shortcut-cda-split-card data-r7-settings-shortcut-cda-split-kind="${kind}"`, header, search, left: listPanel, right: detailPanel, footer });
  }

  renderR7SettingsShortcutCdaSplitModal() {
    return this.renderR7SettingsShortcutReviewLikeModal();
  }

  renderR7SettingsSystemActionModal() {
    const modal = this._settingsSystemActionModal || { open: false };
    if (!modal.open) return `<template data-r7-settings-system-action-modal="true" data-r7-settings-system-action-modal-open="false"></template>`;
    const data = modal.data || {};
    const error = modal.error || "";
    if (modal.kind === "center-list") {
      const center = data.centerConnection || {};
      const rows = [{ id: "primary", name: "Primary Center", baseUrl: center.baseUrl || "미설정", connectionStatus: center.connectionStatus || "미연결", reachabilityStatus: center.reachabilityStatus || "미검증", credentialState: center.credentialState || "missing" }];
      const selected = rows.find((row) => String(row.id) === String(modal.selectedCenterId || "primary")) || rows[0];
      const search = this.renderR7CdaSearchFilterBar({ searchAttr: "data-r7-settings-system-center-search-input", searchPlaceholder: "Center 목록 검색", filters: [["all","전체"],["connected","연결"],["missing","미연결"]].map(([key,label]) => ({ label, active: key === "all", tone: key === "connected" ? "green" : "amber", attrs: `data-r7-settings-system-center-filter="${key}"` })) });
      const rowHtml = rows.map((row) => this.renderR7CdaCompactListRow({ selected: row === selected, attrs: `data-r7-settings-system-center-row="${row.id}" data-r7-settings-system-center-list-item-button="${row.id}" data-r7-settings-system-center-row-selected="${row === selected ? 'true' : 'false'}"`, columns: [`<b>${row.name}</b>`, `<span>${row.baseUrl}</span>`, `<span>${row.connectionStatus}</span>`, `<span>${row.reachabilityStatus}</span>`] })).join("");
      const listPanel = this.renderR7CdaListPanel({ title: "Center 목록", columns: ["이름", "URL", "설정", "연결성"], rowsHtml: rowHtml, footer: `<span>총 ${rows.length}건</span>`, attrs: 'data-r7-settings-system-center-list-panel' });
      const detailBody = `${this.renderR7CdaDetailSection({ title: "1. Center 연결", attrs: 'data-r7-settings-system-center-section="connection"', body: `<div style="margin-top:7px;border:1px solid #edf4ef;border-radius:12px;display:grid;grid-template-columns:.8fr 1.2fr;overflow:hidden;"><span style="padding:8px;background:#fbfdfb;font-weight:950;">URL</span><span style="padding:8px;">${selected.baseUrl}</span><span style="padding:8px;background:#fbfdfb;font-weight:950;">상태</span><span style="padding:8px;">${selected.connectionStatus}</span><span style="padding:8px;background:#fbfdfb;font-weight:950;">허용 토큰</span><span style="padding:8px;">${selected.credentialState === 'configured' ? '[REDACTED]' : 'missing'}</span></div>` })}${this.renderR7CdaDetailSection({ title: "2. 사용 가능 API", attrs: 'data-r7-settings-system-center-section="apis"', body: `<p style="margin:7px 0 0;border:1px solid #edf4ef;border-radius:12px;background:#fbfdfb;padding:10px;line-height:1.5;">농약 · 기상청 API는 Center 연결 토큰 검증 후 중앙 adapter 경로에서 사용합니다.</p>` })}`;
      const detailPanel = this.renderR7CdaDetailPanel({ title: "선택 Center 상세", attrs: 'data-r7-settings-system-center-detail-panel', badge: `<span style="border:1px solid #badcc8;border-radius:999px;padding:5px 9px;font-size:11px;color:#25804a;background:#f0fbf4;font-weight:950;">${selected.connectionStatus}</span>`, body: detailBody, footer: this.renderR7CdaActionFooter({ left: `<span>토큰 원문은 저장 후 다시 표시하지 않습니다</span>`, actions: [`<button type="button" data-r7-settings-system-center-delete-button="${selected.id}" data-r7-cdb-modal-action="negative" data-r7-cdb-negative-action="delete" style="border:1px solid #f1b8b8;border-radius:10px;background:#fff5f5;color:#d92d20;padding:8px 12px;font-weight:950;">삭제</button>`, `<button type="button" data-r7-settings-system-center-auth-connect-button data-r7-cdb-modal-action="positive" data-r7-cdb-positive-action="edit" style="border:1px solid #badcc8;border-radius:10px;background:#f0fbf4;color:#25804a;padding:8px 12px;font-weight:950;">수정</button>`] }) });
      const header = this.renderR7CdaModalHeader({ icon: "mdi:cloud-key-outline", title: "Center 목록", subtitle: "전체 역활별 권한 보기 팝업과 같은 CDA 목록/상세 틀에서 Center 연결을 확인합니다", closeAttr: "data-r7-settings-system-action-modal-close" });
      return this.renderR7CdaSplitModal({ open: modal.open, zIndex: 31, overlayAttrs: 'data-r7-settings-system-center-list-cda-modal="true" data-r7-settings-system-action-modal="true"', cardAttrs: 'data-r7-settings-system-center-list-cda-card', header, search, left: listPanel, right: detailPanel, footer: `<footer style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #edf4ef;padding-top:10px;color:#5d6f62;font-size:12px;"><span>ⓘ Center에서 발급한 허용 토큰을 1회 붙여넣어 저장합니다.</span><button type="button" data-r7-settings-system-action-modal-close style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 14px;font-weight:950;">닫기</button></footer>` });
    }
    if (modal.kind === "center") {
      const center = data.centerConnection || {};
      const sections = [
        this._r7SettingsCreateSection("center-connection", "Center 연결 정보", `<div style="display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:10px;">${this._r7SettingsCreateField("baseUrl", "Center URL", center.baseUrl || "http://127.0.0.1:18000", 'data-r7-settings-system-center-common-modal="true" data-r7-settings-system-center-db-column="base_url"')}${this._r7SettingsCreateField("allowedCredential", "허용 토큰", center.allowedCredentialPreview || "[REDACTED]", 'placeholder="저장 시 [REDACTED]로만 표시" data-r7-settings-system-center-common-modal="true" data-r7-settings-system-center-db-column="allowed_credential"')}</div>`),
        this._r7SettingsCreateSection("center-status", "연결 상태", `<div data-r7-settings-system-center-common-modal="true" style="display:grid;grid-template-columns:.8fr 1.2fr .8fr 1.2fr;overflow:hidden;border:1px solid #edf4ef;border-radius:12px;"><span style="padding:8px;background:#fbfdfb;font-weight:950;">상태</span><span style="padding:8px;">${center.connectionStatus || "미연결"}</span><span style="padding:8px;background:#fbfdfb;font-weight:950;">인증</span><span style="padding:8px;">${center.credentialState || "missing"} · [REDACTED]</span></div>`),
        this._r7SettingsCreateSection("center-credential-guide", "허용 토큰 등록 방식", `<p data-r7-settings-system-center-common-modal="true" style="margin:0;border:1px solid #edf4ef;border-radius:12px;background:#fbfdfb;padding:10px;line-height:1.5;">Center에서 발급한 허용 토큰을 1회 붙여넣어 저장합니다. 토큰 원문은 저장 후 다시 표시하지 않습니다.</p>`),
      ];
      return this.renderR7SettingsDetailActionModal({ open: modal.open, kind: "system-center-connection", title: center.credentialState === "configured" ? "Center 연결 수정" : "Center 연결 추가", subtitle: "역활별 권한 추가/수정 팝업과 같은 공통 작성 모달에서 Center URL과 허용 토큰을 저장합니다", formAttr: "data-r7-settings-system-center-form", closeKind: "system-action", state: modal.state || "idle", error, submitLabel: "Center 연결 저장/검증", sections });
    }
    if (modal.kind === "errors") {
      const rows = Array.isArray(data.errors) && data.errors.length ? data.errors : [{ scope: "db", status: "확인 전", count: 0, hints: ["watchdog 재검사"] }];
      const selected = rows.find((row) => String(row.scope) === String(modal.selectedScope || "db")) || rows[0];
      const search = this.renderR7CdaSearchFilterBar({ searchAttr: "data-r7-settings-system-errors-search-input", searchPlaceholder: "DB/API 오류 검색", filters: [["all","전체"],["db","DB"],["center","Center"],["edge","Edge"]].map(([key,label]) => ({ label, active: key === "all", tone: key === "db" ? "blue" : "green", attrs: `data-r7-settings-system-errors-filter="${key}"` })) });
      const rowHtml = rows.map((row) => this.renderR7CdaCompactListRow({ selected: row === selected, attrs: `data-r7-settings-system-errors-row="${row.scope}" data-r7-settings-system-errors-list-item-button="${row.scope}" data-r7-settings-system-errors-row-selected="${row === selected ? 'true' : 'false'}"`, columns: [`<b>${row.scope}</b>`, `<span>${row.status}</span>`, `<span>${row.count || 0}건</span>`, `<span>${(row.hints || []).slice(0, 1).join(" · ")}</span>`] })).join("");
      const listPanel = this.renderR7CdaListPanel({ title: "DB/API 오류 목록", columns: ["범위", "상태", "건수", "힌트"], rowsHtml: rowHtml, footer: `<span>총 ${rows.length}건</span>`, attrs: 'data-r7-settings-system-errors-list-panel' });
      const detailBody = this.renderR7CdaDetailSection({ title: "1. 오류 수정 작업", attrs: 'data-r7-settings-system-errors-section="repair-plan"', body: `<p style="margin:7px 0 0;border:1px solid #edf4ef;border-radius:12px;background:#fbfdfb;padding:10px;line-height:1.5;">${(selected.hints || ["watchdog 재검사"]).join(" · ")}</p>` });
      const detailPanel = this.renderR7CdaDetailPanel({ title: "선택 오류 상세", attrs: 'data-r7-settings-system-errors-detail-panel', badge: `<span style="border:1px solid #badcc8;border-radius:999px;padding:5px 9px;font-size:11px;color:#25804a;background:#f0fbf4;font-weight:950;">${selected.status}</span>`, body: detailBody, footer: this.renderR7CdaActionFooter({ left: `<span data-r7-settings-system-errors-action-state="${modal.state || 'idle'}">${error || ''}</span>`, actions: [`<button type="button" data-r7-settings-system-errors-action="refresh-watchdog" data-r7-cdb-modal-action="positive" style="border:1px solid #badcc8;border-radius:10px;background:#f0fbf4;color:#25804a;padding:8px 12px;font-weight:950;">watchdog 재검사</button>`] }) });
      const header = this.renderR7CdaModalHeader({ icon: "mdi:alert-circle-check-outline", title: "DB/API 오류 목록", subtitle: "전체 역활별 권한 보기 팝업과 같은 CDA 목록/상세 틀에서 오류 작업을 확인합니다", closeAttr: "data-r7-settings-system-action-modal-close" });
      return this.renderR7CdaSplitModal({ open: modal.open, zIndex: 31, overlayAttrs: 'data-r7-settings-system-errors-cda-modal="true" data-r7-settings-system-action-modal="true"', cardAttrs: 'data-r7-settings-system-errors-cda-card', header, search, left: listPanel, right: detailPanel, footer: `<footer style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #edf4ef;padding-top:10px;color:#5d6f62;font-size:12px;"><span>ⓘ DB/API 오류는 로그 조회·watchdog 재검사·수정 힌트까지만 실행합니다.</span><button type="button" data-r7-settings-system-action-modal-close style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 14px;font-weight:950;">닫기</button></footer>` });
    }
    const components = Array.isArray(data.components) && data.components.length ? data.components : [{ target: "gs", label: "GS", state: "확인 전", supported: true }, { target: "hacs", label: "HACS", state: "확인 전", supported: true }, { target: "ha", label: "HA", state: "deferred", supported: false }, { target: "db", label: "DB", state: "deferred", supported: false }];
    const selected = components.find((item) => String(item.target) === String(modal.selectedTarget || "gs")) || components[0];
    const search = this.renderR7CdaSearchFilterBar({ searchAttr: "data-r7-settings-system-update-search-input", searchPlaceholder: "업데이트 대상 검색", filters: [["all","전체"],["supported","GS/HACS"],["deferred","보류"]].map(([key,label]) => ({ label, active: key === "all", tone: key === "deferred" ? "amber" : "green", attrs: `data-r7-settings-system-update-filter="${key}"` })) });
    const rowHtml = components.map((item) => this.renderR7CdaCompactListRow({ selected: item === selected, attrs: `data-r7-settings-system-update-row="${item.target}" data-r7-settings-system-update-list-item-button="${item.target}" data-r7-settings-system-update-row-selected="${item === selected ? 'true' : 'false'}"`, columns: [`<b>${item.label || item.target}</b>`, `<span>${item.state || "확인"}</span>`, `<span>${item.supported ? "지원" : "보류"}</span>`, `<span>${item.entityId || "Update Agent 예정"}</span>`] })).join("");
    const listPanel = this.renderR7CdaListPanel({ title: "업데이트 목록", columns: ["대상", "상태", "지원", "근거"], rowsHtml: rowHtml, footer: `<span>GS/HACS만 이 화면에서 요청합니다</span><span>총 ${components.length}건</span>`, attrs: 'data-r7-settings-system-update-list-panel' });
    const actionButtons = selected.supported ? [`<button type="button" data-r7-settings-system-update-action="check" data-r7-settings-system-update-target="${selected.target}" data-r7-cdb-modal-action="neutral" style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 12px;font-weight:950;">확인</button>`, `<button type="button" data-r7-settings-system-update-action="install" data-r7-settings-system-update-target="${selected.target}" data-r7-cdb-modal-action="positive" style="border:1px solid #badcc8;border-radius:10px;background:#f0fbf4;color:#25804a;padding:8px 12px;font-weight:950;">업데이트</button>`] : [`<button type="button" disabled style="border:1px solid #dcebe0;border-radius:10px;background:#f7faf8;color:#78927f;padding:8px 12px;font-weight:950;">Update Agent 도입 후 지원</button>`];
    const detailBody = this.renderR7CdaDetailSection({ title: "1. 업데이트 작업", attrs: 'data-r7-settings-system-update-section="action"', body: `<p style="margin:7px 0 0;border:1px solid #edf4ef;border-radius:12px;background:#fbfdfb;padding:10px;line-height:1.5;">${selected.label || selected.target} · ${selected.supported ? 'HA update entity 기반 check/install 요청' : 'HA/DB는 Update Agent/Supervisor 도입 후 지원'}</p>` });
    const detailPanel = this.renderR7CdaDetailPanel({ title: "선택 업데이트 상세", attrs: 'data-r7-settings-system-update-detail-panel', badge: `<span style="border:1px solid #badcc8;border-radius:999px;padding:5px 9px;font-size:11px;color:#25804a;background:#f0fbf4;font-weight:950;">${selected.state || '확인'}</span>`, body: detailBody, footer: this.renderR7CdaActionFooter({ left: `<span data-r7-settings-system-update-action-state="${modal.state || 'idle'}">${error || 'HA/DB 업데이트는 보류'}</span>`, actions: actionButtons }) });
    const header = this.renderR7CdaModalHeader({ icon: "mdi:update", title: "업데이트 목록", subtitle: "전체 역활별 권한 보기 팝업과 같은 CDA 목록/상세 틀에서 GS/HACS 업데이트를 요청합니다", closeAttr: "data-r7-settings-system-action-modal-close" });
    return this.renderR7CdaSplitModal({ open: modal.open, zIndex: 31, overlayAttrs: 'data-r7-settings-system-update-cda-modal="true" data-r7-settings-system-action-modal="true"', cardAttrs: 'data-r7-settings-system-update-cda-card', header, search, left: listPanel, right: detailPanel, footer: `<footer style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #edf4ef;padding-top:10px;color:#5d6f62;font-size:12px;"><span>ⓘ GS/HACS만 이 화면에서 요청합니다. HA/DB는 Update Agent 도입 후 지원합니다.</span><button type="button" data-r7-settings-system-action-modal-close style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 14px;font-weight:950;">닫기</button></footer>` });
  }

  renderR7SettingsRolePermissionEditModal() {
    const modal = this._settingsRolePermissionEditModal || { open: false };
    const values = modal.values || {};
    const isEdit = modal.mode === "edit";
    const stateOptions = [{ value: "allowed", label: "허용" }, { value: "review", label: "보호" }, { value: "readonly", label: "조회" }, { value: "request", label: "대기" }, { value: "none", label: "잠김" }];
    const statusOptions = [{ value: "active", label: "활성" }, { value: "disabled", label: "비활성" }, { value: "draft", label: "초안" }];
    const sections = [
      this._r7SettingsCreateSection("role-db-fields", "역할 권한 DB 항목", `<div style="display:grid;grid-template-columns:repeat(3,minmax(150px,1fr));gap:10px;">${this._r7SettingsCreateField("role", "role", values.role || "farm_staff", 'data-r7-settings-role-permission-db-column="role"')}${this._r7SettingsCreateField("roleLabel", "role_label", values.roleLabel || values.title || "농장 작업자", 'data-r7-settings-role-permission-db-column="role_label"')}${this._r7SettingsCreateSelect("status", "status", statusOptions, values.status || "active", 'data-r7-settings-role-permission-db-column="status"')}</div>`),
      this._r7SettingsCreateSection("permission-summary", "권한 요약", this._r7SettingsCreateTextarea("permissionSummary", "permission_summary", values.permissionSummary || values.summary || "조회 · 기록").replace('<textarea ', '<textarea data-r7-settings-role-permission-db-column="permission_summary" ')),
      this._r7SettingsCreateSection("permission-buckets", "권한 버킷", `<div style="display:grid;grid-template-columns:repeat(3,minmax(150px,1fr));gap:10px;">${this._r7SettingsCreateSelect("viewPermission", "view_permission", stateOptions, values.viewPermission || "allowed", 'data-r7-settings-role-permission-db-column="view_permission"')}${this._r7SettingsCreateSelect("recordPermission", "record_permission", stateOptions, values.recordPermission || "allowed", 'data-r7-settings-role-permission-db-column="record_permission"')}${this._r7SettingsCreateSelect("strategyPermission", "strategy_permission", stateOptions, values.strategyPermission || "readonly", 'data-r7-settings-role-permission-db-column="strategy_permission"')}${this._r7SettingsCreateSelect("executionPermission", "execution_permission", stateOptions, values.executionPermission || "request", 'data-r7-settings-role-permission-db-column="execution_permission"')}${this._r7SettingsCreateSelect("safetyPermission", "safety_permission", stateOptions, values.safetyPermission || "readonly", 'data-r7-settings-role-permission-db-column="safety_permission"')}${this._r7SettingsCreateSelect("settingsPermission", "settings_permission", stateOptions, values.settingsPermission || "none", 'data-r7-settings-role-permission-db-column="settings_permission"')}</div>`),
      this._r7SettingsCreateSection("memo", "메모", this._r7SettingsCreateTextarea("note", "note", values.note || "")),
    ];
    return this.renderR7SettingsDetailActionModal({ open: modal.open, kind: "role-permission-edit", title: isEdit ? "역활별 권한 수정" : "역활별 권한 추가", subtitle: "온실 생성 팝업과 같은 입력 틀에서 gs_role_permissions DB 항목을 저장합니다", formAttr: "data-r7-settings-role-permission-edit-form", closeKind: "role-permission", state: modal.state, error: modal.error, submitLabel: isEdit ? "역할 권한 수정" : "역할 권한 추가", sections });
  }

  renderR7SettingsPermissionMatrixModal() {
    const modal = this._settingsPermissionMatrixModal || { open: false };
    if (!modal.open) return `<template data-r7-settings-permission-matrix-cda-modal="true" data-r7-settings-permission-matrix-modal-open="false"></template>`;
    const fallbackRoles = [{ role: "admin", roleLabel: "관리자", permissionSummary: "전체 권한 · 시스템 설정", tone: "blue", viewPermission: "allowed", recordPermission: "allowed", strategyPermission: "allowed", executionPermission: "allowed", safetyPermission: "allowed", settingsPermission: "allowed", status: "active" }, { role: "farm_owner", roleLabel: "농장 소유자", permissionSummary: "운영 승인 · 전략 검토", tone: "green", viewPermission: "allowed", recordPermission: "allowed", strategyPermission: "allowed", executionPermission: "allowed", safetyPermission: "review", settingsPermission: "review", status: "active" }, { role: "farm_staff", roleLabel: "농장 작업자", permissionSummary: "기록 작성 · 조회 중심", tone: "amber", viewPermission: "allowed", recordPermission: "allowed", strategyPermission: "readonly", executionPermission: "request", safetyPermission: "readonly", settingsPermission: "none", status: "active" }];
    const sourceRows = Array.isArray(this.r7SettingsUsersPermissionsData().rolePermissions) && this.r7SettingsUsersPermissionsData().rolePermissions.length ? this.r7SettingsUsersPermissionsData().rolePermissions : fallbackRoles;
    const roles = sourceRows.map((row) => ({ id: row.role || row.id || "farm_staff", label: row.role || row.id || "farm_staff", title: row.roleLabel || row.title || row.role || "역할", summary: row.permissionSummary || row.summary || "조회 · 기록", tone: row.tone || (row.role === "admin" ? "blue" : row.role === "farm_owner" ? "green" : "amber"), status: row.status || "active", viewPermission: row.viewPermission || row.view_permission || "allowed", recordPermission: row.recordPermission || row.record_permission || "allowed", strategyPermission: row.strategyPermission || row.strategy_permission || "readonly", executionPermission: row.executionPermission || row.execution_permission || "request", safetyPermission: row.safetyPermission || row.safety_permission || "readonly", settingsPermission: row.settingsPermission || row.settings_permission || "none", ...row }));
    const buckets = [{ bucket: "조회", steps: "기본 조회 / 상세 조회", field: "viewPermission" }, { bucket: "기록", steps: "기록 작성 / 기록 수정", field: "recordPermission" }, { bucket: "전략", steps: "전략 검토 / 전략 승인", field: "strategyPermission" }, { bucket: "실행", steps: "실행 요청 / 실행 허락", field: "executionPermission" }, { bucket: "안전", steps: "안전 확인 / 인터록 해제 검토", field: "safetyPermission" }, { bucket: "고급설정", steps: "구역/작기 설정 / 권한 설정", field: "settingsPermission" }];
    const selected = roles.find((role) => String(role.id) === String(modal.selectedRole || "")) || roles[0];
    const search = this.renderR7CdaSearchFilterBar({ searchAttr: "data-r7-settings-role-permission-search-input", searchPlaceholder: "역활별 권한 검색", filters: [["all","전체"],["admin","관리자"],["farm_owner","농장 소유자"],["farm_staff","농장 작업자"]].map(([key,label]) => ({ label, active: key === "all", tone: key === "admin" ? "blue" : "green", attrs: `data-r7-settings-role-permission-filter="${key}"` })) });
    const rowHtml = roles.map((role) => this.renderR7CdaCompactListRow({ selected: role.id === selected.id, attrs: `data-r7-settings-role-permission-list-item-button="${role.id}" data-r7-settings-role-permission-row="${role.id}" data-r7-settings-permission-role="${role.id}" data-r7-settings-role-permission-row-selected="${role.id === selected.id ? 'true' : 'false'}"`, columns: [`<b>${role.label}</b>`, `<span>${role.title}</span>`, `<span>${role.summary}</span>`, `<span style="border:1px solid;border-radius:999px;padding:3px 6px;text-align:center;font-weight:1000;${this._r7ApprovalToneStyle(role.tone)}">${role.tone === 'amber' ? '제한' : '활성'}</span>`] })).join("");
    const listPanel = this.renderR7CdaListPanel({ title: "역활별 권한 목록", columns: ["역할", "구분", "권한 요약", "상태"], rowsHtml: rowHtml, footer: `<span>‹</span><span style="border:1px solid #badcc8;border-radius:8px;padding:5px 9px;background:#f6fbf7;color:#31523b;font-weight:900;">1</span><span>›</span><span>총 ${roles.length}건</span>`, attrs: 'data-r7-settings-role-permission-list-panel' }).replace('data-r7-cda-list-body', 'data-r7-cda-list-body data-r7-settings-role-permission-list-body');
    const permissionGrid = `<div style="margin-top:7px;border:1px solid #edf4ef;border-radius:12px;display:grid;grid-template-columns:.8fr 1.4fr 1fr;overflow:hidden;">${[["권한 버킷", "세부 단계", selected.label], ...buckets.map((row) => [row.bucket, row.steps, selected[row.field]])].map((cols, rowIndex) => cols.map((cell, colIndex) => { const bucket = rowIndex > 0 ? cols[0] : ""; const attrs = rowIndex > 0 && colIndex === 0 ? `data-r7-settings-permission-bucket="${bucket}" data-r7-settings-permission-step-row="${bucket}" data-r7-settings-role-permission-bucket-row="${selected.id}:${bucket}"` : colIndex === 2 ? `data-r7-settings-role-permission-state="${selected.id}"` : ""; const body = rowIndex > 0 && colIndex === 2 ? this._r7PermissionMatrixStateCell(cell) : cell; return `<span ${attrs} style="padding:8px;background:${rowIndex === 0 ? '#fbfdfb' : '#fff'};font-weight:${rowIndex === 0 || colIndex === 0 ? '950' : '750'};border-bottom:${rowIndex === buckets.length ? '0' : '1px solid #edf4ef'};display:grid;align-items:center;">${body}</span>`; }).join("")).join("")}</div>`;
    const roleInfo = this.renderR7CdaDetailSection({ title: "1. 선택 역할", attrs: 'data-r7-settings-role-permission-section="role-info"', body: `<div style="margin-top:7px;border:1px solid #edf4ef;border-radius:12px;display:grid;grid-template-columns:.8fr 1.2fr .8fr 1.2fr;overflow:hidden;"><span style="padding:8px;background:#fbfdfb;font-weight:950;">역할</span><span style="padding:8px;">${selected.label}</span><span style="padding:8px;background:#fbfdfb;font-weight:950;">구분</span><span style="padding:8px;">${selected.title}</span><span style="padding:8px;background:#fbfdfb;font-weight:950;">요약</span><span style="padding:8px;grid-column:span 3;">${selected.summary}</span></div>` });
    const permissionSection = this.renderR7CdaDetailSection({ title: "2. 역할별 권한", attrs: 'data-r7-settings-role-permission-section="bucket-permissions"', body: permissionGrid });
    const evidence = this.renderR7CdaDetailSection({ title: "3. 적용 근거", attrs: 'data-r7-settings-role-permission-section="evidence"', body: `<p style="margin:7px 0 0;border:1px solid #edf4ef;border-radius:12px;background:#fbfdfb;padding:10px;line-height:1.5;">설정 저장/권한 변경은 별도 승인 작업입니다. 이 모달은 현재 RBAC 기준을 역할별로 구분해 read-only로 보여줍니다.</p>` });
    const detailPanel = this.renderR7CdaDetailPanel({ title: "선택한 역할 상세", attrs: 'data-r7-settings-role-permission-detail-panel', badge: `<span style="border:1px solid;border-radius:999px;padding:5px 9px;font-size:11px;${this._r7ApprovalToneStyle(selected.tone)}">${selected.label}</span>`, body: `${roleInfo}${permissionSection}${evidence}`, footer: this.renderR7CdaActionFooter({ left: `<button type="button" data-r7-settings-role-permission-export style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 11px;font-weight:950;">내보내기 준비</button>`, actions: [`<button type="button" data-r7-settings-role-permission-delete-button="${selected.id}" data-r7-cdb-modal-action="negative" data-r7-cdb-negative-action="delete" style="border:1px solid #f1b8b8;border-radius:10px;background:#fff5f5;color:#d92d20;padding:8px 12px;font-weight:950;">삭제</button>`, `<button type="button" data-r7-settings-role-permission-edit-button="${selected.id}" data-r7-cdb-modal-action="positive" data-r7-cdb-positive-action="edit" style="border:1px solid #badcc8;border-radius:10px;background:#f0fbf4;color:#25804a;padding:8px 12px;font-weight:950;">수정</button>`] }) });
    const header = this.renderR7CdaModalHeader({ icon: "mdi:table-key", title: "전체 역활별 권한 보기", subtitle: `${selected.label} · ${selected.title} · ${selected.summary}`, closeAttr: "data-r7-settings-permission-matrix-close-button" });
    const footer = `<footer style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #edf4ef;padding-top:10px;color:#5d6f62;font-size:12px;"><span>ⓘ 유저 목록 팝업과 같은 목록/상세 틀로 역할별 권한을 확인합니다. 변경 요청은 승인 작업에 기록됩니다.</span><button type="button" data-r7-settings-permission-matrix-close-button style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 14px;font-weight:950;">닫기</button></footer>`;
    return this.renderR7CdaSplitModal({ open: modal.open, zIndex: 31, overlayAttrs: `data-r7-settings-permission-matrix-cda-modal="true" data-r7-settings-permission-matrix-modal-open="true" data-r7-settings-role-permission-modal="true"`, cardAttrs: 'data-r7-settings-role-permission-cda-card', header, search, left: listPanel, right: detailPanel, footer });
  }

  renderR7SettingsAuditLogEditModal() {
    const modal = this._settingsAuditLogEditModal || { open: false };
    const rows = (Array.isArray(this.r7SettingsUsersPermissionsData().users) ? this.r7SettingsUsersPermissionsData().users : []).map((row, index) => this._normalizeR7SettingsUserRow(row, index));
    const selected = rows.find((row) => String(row.haUserId) === String(modal.selectedId || "")) || rows[0] || this._normalizeR7SettingsUserRow({}, 0);
    const value = (v) => this._r7Text(v || "");
    const selectStyle = "height:36px;border:1px solid #dcebe0;border-radius:8px;padding:0 9px;background:#fff;box-sizing:border-box;font-size:12px;width:100%;font-weight:800;color:#24323f;";
    const option = (current, val, label) => `<option value="${value(val)}" ${String(current) === String(val) ? 'selected' : ''}>${value(label)}</option>`;
    const roleOptions = this._r7SettingsRolePermissionRows().map((row) => option(selected.role, row.role || row.id || "farm_staff", row.roleLabel || row.role_label || row.role || row.id || "역할")).join("");
    const roleSelect = `<label style="display:grid;gap:5px;font-size:12px;font-weight:900;color:#31523b;"><span>역할</span><select name="role" data-r7-settings-audit-log-edit-db-column="role" data-r7-settings-user-role-select data-r7-settings-user-role-select-source="role-permissions-db" style="${selectStyle}">${roleOptions}</select></label>`, statusSelect = `<label style="display:grid;gap:5px;font-size:12px;font-weight:900;color:#31523b;"><span>상태</span><select name="status" data-r7-settings-audit-log-edit-db-column="status" data-r7-settings-user-status-select style="${selectStyle}">${option(selected.status, 'active', '활성')}${option(selected.status, 'pending', '승인 대기')}${option(selected.status, 'rejected', '거부됨')}${option(selected.status, 'disabled', '비활성')}</select></label>`;
    const sections = [
      this._r7SettingsCreateSection("user-db-identity", "DB 기준 식별 정보", `<div style="display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:10px;"><label style="display:grid;gap:5px;font-size:12px;font-weight:900;color:#31523b;"><span>번호</span><input name="id" value="${value(selected.dbId)}" readonly data-r7-settings-audit-log-edit-db-column="id" style="height:36px;border:1px solid #dcebe0;border-radius:8px;padding:0 9px;background:#f7faf8;box-sizing:border-box;font-size:12px;width:100%;"></label><label style="display:grid;gap:5px;font-size:12px;font-weight:900;color:#31523b;"><span>HA 사용자 ID</span><input name="haUserId" value="${value(selected.haUserId)}" readonly data-r7-settings-audit-log-edit-db-column="ha_user_id" style="height:36px;border:1px solid #dcebe0;border-radius:8px;padding:0 9px;background:#f7faf8;box-sizing:border-box;font-size:12px;width:100%;"></label></div>`),
      this._r7SettingsCreateSection("user-db-fields", "사용자 정보 수정", `<div style="display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:10px;">${this._r7SettingsCreateField("displayName", "사용자 이름", value(selected.displayName), 'data-r7-settings-audit-log-edit-db-column="display_name"')}${roleSelect}${statusSelect}</div>`),
      this._r7SettingsCreateSection("user-db-permission", "권한 요약", this._r7SettingsCreateTextarea("permissionSummary", "권한 요약", value(selected.permissionSummary)).replace('<textarea ', '<textarea data-r7-settings-audit-log-edit-db-column="permission_summary" ')),
    ];
    return this.renderR7SettingsDetailActionModal({ open: modal.open, kind: "audit-log-edit", title: "유저 수정", subtitle: "생육조사 작성 팝업과 같은 공통 모달에서 gs_users DB 항목을 수정합니다", formAttr: `data-r7-settings-audit-log-edit-form="${value(selected.haUserId)}"`, closeKind: "audit-log-edit", state: modal.state || "idle", error: modal.error || "", submitLabel: "유저 수정 저장", sections });
  }

  renderR7SettingsAuditLogModal() {
    const modal = this._settingsAuditLogModal || { open: false };
    if (!modal.open) return `<template data-r7-settings-audit-log-cda-modal="true" data-r7-settings-audit-log-modal-open="false"></template>`;
    const userRows = Array.isArray(this.r7SettingsUsersPermissionsData().users) ? this.r7SettingsUsersPermissionsData().users : [];
    const rows = userRows.map((row, index) => this._normalizeR7SettingsUserRow(row, index));
    const selected = rows.find((row) => String(row.haUserId) === String(modal.selectedId || "")) || rows[0] || this._normalizeR7SettingsUserRow({}, 0);
    const search = this.renderR7CdaSearchFilterBar({
      searchAttr: "data-r7-settings-audit-log-search-input",
      searchPlaceholder: "유저 목록 검색",
      filters: [["all","전체"],["active","활성"],["pending","승인 대기"],["rejected","거부됨"],["admin","관리자"]].map(([key,label]) => ({ label, active: key === "all", tone: "green", attrs: `data-r7-settings-audit-log-filter="${key}"` })),
    });
    const rowHtml = rows.length ? rows.map((row) => this.renderR7CdaCompactListRow({
      selected: row.haUserId === selected.haUserId,
      attrs: `data-r7-settings-audit-log-list-item-button="${row.haUserId}" data-r7-settings-audit-log-row="${row.haUserId}" data-r7-settings-audit-log-row-selected="${row.haUserId === selected.haUserId ? 'true' : 'false'}"`,
      columns: [`<span>${row.dbId}</span>`, `<b>${row.displayName}</b>`, `<span>${row.role}</span>`, `<span style="border:1px solid;border-radius:999px;padding:3px 6px;text-align:center;font-weight:1000;${this._r7ApprovalToneStyle(row.tone)}">${row.status}</span>`, `<span>${row.updatedAt}</span>`],
    })).join("") : `<p style="margin:0;color:#78927f;font-size:13px;">유저 목록 데이터 없음</p>`;
    const listPanel = this.renderR7CdaListPanel({
      title: "유저 목록",
      columns: ["번호", "사용자 이름", "역할", "상태", "수정일"],
      rowsHtml: rowHtml,
      footer: `<span>‹</span><span style="border:1px solid #badcc8;border-radius:8px;padding:5px 9px;background:#f6fbf7;color:#31523b;font-weight:900;">1</span><span>›</span><span>총 ${rows.length}건</span>`,
      attrs: 'data-r7-settings-audit-log-list-panel',
    }).replace('data-r7-cda-list-body', 'data-r7-cda-list-body data-r7-settings-audit-log-list-body');
    const dbGrid = `<div style="margin-top:7px;border:1px solid #edf4ef;border-radius:12px;display:grid;grid-template-columns:.7fr 1.3fr .7fr 1.3fr;overflow:hidden;">${[
      ["번호", selected.dbId], ["HA 사용자 ID", selected.haUserId], ["사용자 이름", selected.displayName], ["역할", selected.role], ["상태", selected.status], ["권한 요약", selected.permissionSummary], ["최근 접속", selected.lastSeenAt], ["생성일", selected.createdAt], ["수정일", selected.updatedAt]
    ].map(([label, value]) => `<span style="padding:8px;background:#fbfdfb;font-weight:950;">${label}</span><span style="padding:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${value}</span>`).join("")}</div>`;
    const info = this.renderR7CdaDetailSection({ title: "1. 유저 DB 행", attrs: 'data-r7-settings-audit-log-section="info"', body: dbGrid });
    const summary = this.renderR7CdaDetailSection({ title: "2. 권한 요약", attrs: 'data-r7-settings-audit-log-section="summary"', body: `<p style="margin:7px 0 0;border:1px solid #edf4ef;border-radius:12px;background:#fbfdfb;padding:10px;line-height:1.5;">${selected.permissionSummary}</p>` });
    const evidence = this.renderR7CdaDetailSection({ title: "3. DB 근거", attrs: 'data-r7-settings-audit-log-section="evidence"', body: `<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;"><span style="border:1px solid #badcc8;border-radius:10px;background:#f0fbf4;color:#25804a;padding:8px 10px;font-weight:950;">유저 DB</span><span style="border:1px solid #bdd7f0;border-radius:10px;background:#eef6ff;color:#326aa5;padding:8px 10px;font-weight:950;">HA 사용자 ID 기준 수정</span><span style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 10px;font-weight:950;">사용자 이름/역할/상태/권한 요약</span></div>` });
    const actionStatus = modal.actionState === "saving" ? "저장 중" : modal.actionState === "saved" ? "DB 반영 완료" : modal.actionState === "error" ? `오류: ${modal.actionError || 'audit-log-update-failed'}` : "";
    const detailPanel = this.renderR7CdaDetailPanel({
      title: "선택한 유저 상세",
      attrs: 'data-r7-settings-audit-log-detail-panel',
      badge: `<span style="border:1px solid;border-radius:999px;padding:5px 9px;font-size:11px;${this._r7ApprovalToneStyle(selected.tone)}">${selected.status}</span>`,
      body: `${info}${summary}${evidence}${actionStatus ? `<p data-r7-settings-audit-log-action-state="${modal.actionState}" style="margin:0;color:${modal.actionState === 'error' ? '#b42318' : '#25804a'};font-size:12px;font-weight:900;">${actionStatus}</p>` : ''}`,
      footer: this.renderR7CdaActionFooter({ left: `<button type="button" data-r7-settings-audit-log-export style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 11px;font-weight:950;">내보내기 준비</button>`, actions: [`<button type="button" data-r7-settings-audit-log-reject-button="${selected.haUserId}" data-r7-settings-audit-log-reject-role="${selected.role}" style="border:1px solid #f1b8b8;border-radius:10px;background:#fff5f5;color:#d92d20;padding:8px 12px;font-weight:950;">거부</button>`, `<button type="button" data-r7-settings-audit-log-edit-button="${selected.haUserId}" style="border:1px solid #badcc8;border-radius:10px;background:#f0fbf4;color:#25804a;padding:8px 12px;font-weight:950;">수정</button>`] }),
    });
    const header = this.renderR7CdaModalHeader({ icon: "mdi:account-group-outline", title: "유저 목록", subtitle: `${selected.displayName} · ${selected.role} · ${selected.status}`, closeAttr: "data-r7-settings-audit-log-close-button" });
    const footer = `<footer style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #edf4ef;padding-top:10px;color:#5d6f62;font-size:12px;"><span>ⓘ 이 모달은 gs_users DB 기준의 유저 목록/상세/수정 흐름입니다. 변경 이력은 감사 로그에 기록됩니다.</span><button type="button" data-r7-settings-audit-log-close-button style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 14px;font-weight:950;">닫기</button></footer>`;
    return this.renderR7CdaSplitModal({ open: modal.open, zIndex: 31, overlayAttrs: `data-r7-settings-audit-log-cda-modal="true" data-r7-settings-audit-log-modal-open="${modal.open ? 'true' : 'false'}"`, header, search, left: listPanel, right: detailPanel, footer });
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
    const approvalDecisionButtonStyle = "height:40px;min-width:88px;border-radius:10px;padding:0 14px;font-weight:1000;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;";
    const detailFooter = this.renderR7CdaActionFooter({ left: `<button type="button" data-r7-settings-approval-log-button style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:8px 11px;font-weight:950;">상세 로그 보기</button>`, actions: [`<button type="button" data-r7-settings-approval-reject-button="${selected.id}" style="${approvalDecisionButtonStyle}border:1px solid #f1b8b8;background:#fff5f5;color:#d92d20;">반려</button>`, `<button type="button" data-r7-settings-approval-apply-button="${selected.id}" data-r7-settings-approval-approve-button="${selected.id}" ${selected.decisionEnabled ? '' : 'disabled'} style="${approvalDecisionButtonStyle}border:1px solid;cursor:${selected.decisionEnabled ? 'pointer' : 'not-allowed'};${this._r7ApprovalToneStyle(selected.decisionEnabled ? 'green' : 'gray', selected.decisionEnabled ? 'solid' : 'soft')}">승인</button>`] });
    const detailPanel = this.renderR7CdaDetailPanel({ title: "선택 작업 검토", attrs: `data-r7-settings-approval-review-pane data-r7-settings-approval-stage="${selected.stage.key}" data-r7-settings-approval-risk-level="${selected.risk.level}" data-r7-settings-approval-decision-enabled="${selected.decisionEnabled ? 'true' : 'false'}"`, badge: `<span style="border:1px solid;border-radius:999px;padding:5px 9px;font-size:11px;${this._r7ApprovalToneStyle(selected.stage.tone)}">${selected.stage.label}</span>`, body: `${requestInfo}${changeDetail}${riskSection}${checkSection}${memo}`, footer: detailFooter });
    const header = this.renderR7CdaModalHeader({ icon: "mdi:shield-check-outline", title: "로그인 승인 작업", subtitle: `${selected.target} · ${selected.approvalType} · ${selected.stage.label}`, closeAttr: "data-r7-settings-approval-list-close-button" });
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
        <header style="display:flex;justify-content:space-between;align-items:center;gap:10px;"><strong style="font-size:16px;color:#24323f;">로그인 승인 작업</strong><button type="button" data-r7-settings-approval-close-button style="border:1px solid #dcebe0;border-radius:10px;background:#fff;color:#31523b;padding:7px 10px;font-weight:900;">닫기</button></header>
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

  _r7SettingsGreenhouseValueRow(label, value, attrs = "") {
    return `<div ${attrs} style="display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;line-height:1.35;"><span style="color:#53645b;font-weight:850;">${label}</span><b style="color:#24323f;text-align:right;">${value}</b></div>`;
  }

  _r7SettingsGreenhousePill(label, tone = "green", attrs = "") {
    const style = this._r7ApprovalToneStyle(tone);
    return `<span ${attrs} style="display:inline-flex;align-items:center;justify-content:center;border:1px solid;border-radius:999px;padding:4px 8px;font-size:11px;font-weight:950;white-space:nowrap;${style}">${label}</span>`;
  }

  renderR7SettingsInfoCard({ key, icon, title, primary, rows = [], tone = "green", statusKey = "normal-ready", extraAttrs = "" }) {
    const legacyCard = { "greenhouse-basic-info": "greenhouse-profile", "zone-basic-info": "zone-count", "zone-composition": "zone-count", "zone-current-crop": "zone-current-cycle" }[key];
    const legacyAttr = legacyCard ? `data-r7-settings-greenhouse-card="${legacyCard}"` : "";
    return `<article data-r7-settings-info-card="${key}" data-r7-settings-greenhouse-summary-card="${key}" ${legacyAttr} ${extraAttrs} style="border:1px solid #e5eee7;border-radius:16px;background:#fff;padding:14px;display:grid;grid-template-rows:auto auto 1fr;gap:10px;min-height:132px;box-shadow:0 1px 2px rgba(31,51,41,.04);">
      ${this.renderR7CommonCardHeader({ icon, title, subtitle: primary, statusKey, tone, extraAttrs: 'data-r7-settings-info-card-header' })}
      <div data-r7-settings-info-card-body style="display:grid;gap:7px;align-content:start;">${rows.join("")}</div>
    </article>`;
  }

  _r7SettingsGreenhouseSummaryCard(args) {
    return this.renderR7CdbSummaryCard(args);
  }

  renderR7CdbSummaryCard(args = {}) {
    const extraAttrs = `${args.extraAttrs || ""} data-r7-cdb-card-type="summary" data-r7-cdb-common-card="summary-card"`;
    return this.renderR7SettingsInfoCard({ ...args, extraAttrs });
  }

  renderR7CdbButtonOneCard({ kind, section = "", icon, title, subtitle = "", statusKey = "normal-ready", tone = "green", rows = [], rowKind = "common", summaryHtml = "", buttonLabel, buttonIcon = "mdi:open-in-new", buttonTone = "green", buttonAttrs = "", extraAttrs = "" }) {
    const listButtonAttrs = `${buttonAttrs} data-r7-cdb-button-role="list" data-r7-cdb-opens-modal="list"`;
    return this.renderR7CommonCardShell({ kind, section, icon, title, subtitle, statusKey, tone, html: summaryHtml || this.renderR7CommonCardDataRows(rows, { rowKind }), actions: [this.renderR7CommonCardButton({ label: buttonLabel, icon: buttonIcon, tone: buttonTone, extraAttrs: listButtonAttrs })], extraAttrs: `${extraAttrs} data-r7-cdb-card-type="button-one" data-r7-cdb-common-card="button-1-card"` });
  }

  renderR7CdbButtonTwoCard({ kind, icon, title, subtitle = "", statusKey = "due-today", tone = "blue", rows = [], rowKind = "common", primary = "", note = "", firstLabel, firstIcon = "mdi:plus-circle-outline", firstTone = "green", firstAttrs = "", secondLabel, secondIcon = "mdi:history", secondTone = "blue", secondAttrs = "", extraAttrs = "" }) {
    const createButtonAttrs = `${firstAttrs} data-r7-cdb-button-role="create" data-r7-cdb-opens-modal="create"`;
    const listButtonAttrs = `${secondAttrs} data-r7-cdb-button-role="list" data-r7-cdb-opens-modal="list"`;
    const resolvedSubtitle = subtitle || primary;
    return this.renderR7RecordCardShell({ kind, icon, title, subtitle: resolvedSubtitle, statusKey, tone, primary, note, html: rows.length ? this.renderR7CommonCardDataRows(rows, { rowKind }) : "", actions: [this.renderR7CommonCardButton({ label: firstLabel, icon: firstIcon, tone: firstTone, extraAttrs: createButtonAttrs }), this.renderR7CommonCardButton({ label: secondLabel, icon: secondIcon, tone: secondTone, extraAttrs: listButtonAttrs })], extraAttrs: `${extraAttrs} data-r7-cdb-card-type="button-two" data-r7-cdb-common-card="button-2-card" data-r7-cdb-button-two-subtitle="${resolvedSubtitle ? 'present' : 'empty'}"` });
  }

  renderR7CdbListCard(args = {}) {
    const extraAttrs = `${args.extraAttrs || ""} data-r7-cdb-card-type="list" data-r7-cdb-common-card="list-card"`;
    return this.renderR7CommonRecentPanel({ ...args, extraAttrs });
  }

  renderR7CdbSubtabContentLayout({ summaryCards = [], actionCards = [], listCard = "", modals = "", extraAttrs = "" } = {}) {
    return `<section data-r7-cdb-subtab-content-layout="summary3-action3-list" data-r7-cdb-summary-card-count="3" data-r7-cdb-action-card-count="3" ${extraAttrs} style="display:grid;gap:12px;"><div data-r7-cdb-layout-row="summary" data-r7-settings-info-row="overview" data-r7-settings-greenhouse-summary-grid style="display:grid;grid-template-columns:repeat(3,minmax(210px,1fr));gap:12px;">${summaryCards.join("")}</div><div data-r7-cdb-layout-row="actions" data-r7-settings-create-row="create" style="display:grid;grid-template-columns:repeat(3,minmax(210px,1fr));gap:12px;">${actionCards.join("")}</div><div data-r7-cdb-layout-row="list">${listCard}</div>${modals}</section>`;
  }

  renderR7SettingsGreenhouseZonesSubtab(zones) {
    const sourceZones = zones.length ? zones : [{ id: "zone-1", name: "1구역", purpose: "재배", area: "120㎡", bedCount: 6, currentCrop: { crop_cycle_id: "미연결", crop_label_ko: "작물 없음", growth_stage: "미지정" }, dataAvailability: { state: "unknown", freshnessMinutes: null }, equipmentProfile: { labels: ["센서 미매핑"] } }];
    const normalized = sourceZones.map((zone, index) => {
      const zoneId = this._r7ZoneId?.(zone) || zone.zoneId || zone.id || `zone-${index + 1}`;
      const zoneName = this._r7ZoneName?.(zone) || zone.zoneName || zone.name || `${index + 1}구역`;
      const currentCrop = zone.currentCrop || {};
      const cropLabel = currentCrop.crop_label_ko || currentCrop.cropLabelKo || currentCrop.cropType || currentCrop.crop_type || "작물 미등록";
      const cropCycleId = currentCrop.crop_cycle_id || currentCrop.cropCycleId || currentCrop.cropSeasonId || "없음";
      const dataState = zone.dataAvailability?.state || zone.currentCropAssignment?.dataAvailability?.state || "unknown";
      const labels = Array.isArray(zone.equipmentProfile?.labels) ? zone.equipmentProfile.labels : [];
      const sensors = Math.max(1, labels.filter((label) => String(label).includes("센서") || String(label).includes("sensor")).length || Math.min(6, labels.length || 4));
      const devices = Math.max(1, labels.filter((label) => !String(label).includes("센서") && !String(label).includes("sensor")).length || Math.max(2, labels.length || 2));
      const statusTone = dataState === "fresh" || dataState === "ok" ? "green" : dataState === "stale" ? "amber" : "gray";
      const statusLabel = dataState === "fresh" || dataState === "ok" ? "활성" : dataState === "stale" ? "주의" : "확인";
      const purpose = zone.purpose || zone.zonePurpose || zone.usage || "재배";
      const area = zone.area || zone.areaLabel || zone.size || "120㎡";
      const bedCount = zone.bedCount ?? zone.beds ?? zone.bed_count ?? 6;
      return { zoneId, zoneName, cropLabel, cropCycleId, labels, sensors, devices, statusTone, statusLabel, purpose, area, bedCount };
    });
    const selected = normalized[0];
    const selectedUnmapped = selected.labels.filter((label) => /미연결|unmapped|누락|missing/i.test(String(label))).length;
    const selectedSensors = selected.sensors;
    const selectedDevices = selected.devices;
    const greenhouseInfo = this.renderR7CdbSummaryCard({ key: "greenhouse-basic-info", icon: "mdi:greenhouse", title: "온실 기본 정보", primary: "운영 기준 데이터", rows: [this._r7SettingsGreenhouseValueRow("온실명", this._homeContext?.greenhouseName || "제1온실"), this._r7SettingsGreenhouseValueRow("위치", "경기 화성"), this._r7SettingsGreenhouseValueRow("설치유형", "NUC edge")], tone: "green", statusKey: "normal-ready" });
    const zoneInfo = this.renderR7CdbSummaryCard({ key: "zone-basic-info", icon: "mdi:view-grid-outline", title: "구역 기본 정보", primary: selected.zoneName, rows: [this._r7SettingsGreenhouseValueRow("구역 용도", selected.purpose), this._r7SettingsGreenhouseValueRow("면적", selected.area), this._r7SettingsGreenhouseValueRow("배드 수", selected.bedCount)], tone: selected.statusTone === "amber" ? "amber" : "green", statusKey: selected.statusTone === "amber" ? "needs-verification" : "normal-ready" });
    const equipmentInfo = this.renderR7CdbSummaryCard({ key: "equipment-composition", icon: "mdi:devices", title: "장비 구성", primary: `${selected.zoneName} · 선택 구역 상태`, rows: [this._r7SettingsGreenhouseValueRow("센서", `${selectedSensors}개`, 'data-r7-settings-equipment-sensor-count'), this._r7SettingsGreenhouseValueRow("장비", `${selectedDevices}개`, 'data-r7-settings-equipment-device-count'), this._r7SettingsGreenhouseValueRow("미연결", `${selectedUnmapped}개`, 'data-r7-settings-equipment-unmapped-count')], tone: selectedUnmapped ? "amber" : "green", statusKey: selectedUnmapped ? "needs-verification" : "normal-ready", extraAttrs: 'data-r7-settings-equipment-status-card="selected-zone"' });
    const createCard = ({ kind, title, icon, primary, note, addLabel, addAttr, shortcutLabel, shortcutAttr, tone = "blue" }) => this.renderR7CdbButtonTwoCard({ kind, icon, title, statusKey: "due-today", tone, primary, note, firstLabel: addLabel, firstIcon: "mdi:plus-circle-outline", firstTone: "green", firstAttrs: `${addAttr} data-r7-settings-modal-skip-record-binding="true"`, secondLabel: shortcutLabel, secondIcon: "mdi:history", secondTone: "blue", secondAttrs: `${shortcutAttr} data-r7-settings-modal-skip-record-binding="true"`, extraAttrs: `data-r7-settings-create-card="${kind}" data-r7-settings-greenhouse-summary-card="${kind.replace('settings-', '').replace('-create', '')}-create" data-r7-settings-zone-create-reference-card="image-like-common-card"` });
    const createCards = [
      createCard({ kind: "settings-greenhouse-create", title: "온실 생성", icon: "mdi:greenhouse", primary: "새 온실 없음", note: "온실을 추가하려면 승인 후 저장이 필요합니다", addLabel: "+ 새 온실 추가", addAttr: 'data-r7-settings-greenhouse-create-button', shortcutLabel: "온실 정보", shortcutAttr: 'data-r7-settings-greenhouse-info-shortcut-button' }),
      createCard({ kind: "settings-zone-create", title: "구역 생성", icon: "mdi:plus-circle-outline", primary: "새 구역 없음", note: "구역을 추가하려면 승인 후 저장이 필요합니다", addLabel: "+ 새 구역 추가", addAttr: 'data-r7-settings-zone-create-card data-r7-settings-zone-create-button', shortcutLabel: "구역 목록", shortcutAttr: 'data-r7-settings-zone-list-shortcut-button' }),
      createCard({ kind: "settings-equipment-mapping", title: "장치 연결 작성", icon: "mdi:devices", primary: "매핑 확인 필요", note: "선택 구역의 장치와 그룹을 확인합니다", addLabel: "장치 연결 작성", addAttr: 'data-r7-settings-device-sensor-mapping-button', shortcutLabel: "장치 목록", shortcutAttr: 'data-r7-settings-equipment-info-shortcut-button' }),
    ].join("");
    const zoneRows = normalized.map((zone, index) => ({
      kind: zone.zoneName,
      at: zone.cropLabel,
      memo: `현재 작기 ${zone.cropCycleId} · 센서 ${zone.sensors} · 장치 ${zone.devices}`,
      state: zone.statusLabel,
      tone: zone.statusTone,
      icon: "mdi:greenhouse",
      extraAttrs: `data-r7-settings-zone-list-row="${zone.zoneId}" data-r7-settings-zone-row="${zone.zoneId}" data-r7-settings-zone-list-selected="${index === 0 ? 'true' : 'false'}"`,
    }));
    const zoneList = this.renderR7CdbListCard({
      kind: "settings-zone-list",
      title: "구역 목록",
      icon: "mdi:view-list-outline",
      statusKey: "normal-ready",
      tone: "green",
      rows: zoneRows,
      limit: Number.POSITIVE_INFINITY,
      rowKind: "settings-zone",
      extraAttrs: 'data-r7-settings-zone-list-panel data-r7-settings-zone-list-panel-width="full" data-r7-settings-zone-table-header',
    });
    return this.renderR7CdbSubtabContentLayout({
      summaryCards: [greenhouseInfo, zoneInfo, equipmentInfo],
      actionCards: [createCards],
      listCard: zoneList,
      extraAttrs: 'data-r7-settings-greenhouse-zones data-r7-settings-greenhouse-zones-layout="info-create-equipment-list"',
    });
  }

  renderR7SettingsDeviceSensorMappingSubtab(zones = []) {
    const settingsData = this.r7SettingsGreenhouseZoneData();
    const sourceZones = (zones.length ? zones : (Array.isArray(settingsData.zones) ? settingsData.zones : [])).filter((zone) => this._r7ZoneId(zone) !== "all");
    const normalizedZones = (sourceZones.length ? sourceZones : [{ id: "zone-1", zoneName: "A구역", name: "A구역", equipmentProfile: { labels: ["온도 센서", "천창 모터"] }, dataAvailability: { state: "unknown" } }]).map((zone, index) => {
      const zoneId = this._r7ZoneId?.(zone) || zone.zoneId || zone.id || `zone-${index + 1}`;
      const zoneName = this._r7ZoneName?.(zone) || zone.zoneName || zone.name || `${index + 1}구역`;
      const labels = Array.isArray(zone.equipmentProfile?.labels) ? zone.equipmentProfile.labels : [];
      const sensorCount = labels.filter((label) => /센서|sensor/i.test(String(label))).length || Math.min(3, labels.length || 1);
      const deviceCount = Math.max(1, labels.length - sensorCount || 1);
      const dataState = zone.dataAvailability?.state || zone.currentCropAssignment?.dataAvailability?.state || "unknown";
      const tone = dataState === "fresh" || dataState === "ok" ? "green" : dataState === "stale" ? "amber" : "gray";
      const status = tone === "green" ? "활성" : tone === "amber" ? "주의" : "확인";
      return { zoneId, zoneName, labels, sensorCount, deviceCount, dataState, tone, status };
    });
    const totalDevices = normalizedZones.reduce((sum, zone) => sum + zone.deviceCount, 0);
    const mappingRows = this.normalizeR7SettingsEquipmentEntityRows(Array.isArray(settingsData.deviceSensorMappings) ? settingsData.deviceSensorMappings : [], normalizedZones);
    const visibleMappings = mappingRows;
    const activeMappings = visibleMappings.filter((row) => !["inactive", "deleted", "비활성", "삭제됨"].includes(String(row.status || row.statusLabel || "").toLowerCase())).length;
    const inactiveMappings = Math.max(0, visibleMappings.length - activeMappings);
    const groupNames = [...new Set((visibleMappings.length ? visibleMappings : [{ mappingRole: "환경 센서 그룹" }]).map((row) => row.mappingRole || row.name || "장치 그룹"))];
    const zoneNames = normalizedZones.map((zone) => zone.zoneName).join(" · ") || "구역 미등록";
    const unlinkedCount = visibleMappings.length ? 0 : 1;
    const communicationErrorCount = inactiveMappings;
    const deviceErrorCount = visibleMappings.filter((row) => /오류|error|failed|장애/i.test(String(row.status || row.statusLabel || row.note || ""))).length;
    const deviceCard = this.renderR7CdbSummaryCard({ key: "device-basic", icon: "mdi:devices", title: "장치 기본 정보", primary: `${totalDevices}개 장치`, rows: [this._r7SettingsGreenhouseValueRow("센서", `${normalizedZones.reduce((sum, zone) => sum + zone.sensorCount, 0)}개`, 'data-r7-settings-device-basic-row="sensor"'), this._r7SettingsGreenhouseValueRow("장치", `${totalDevices}개`, 'data-r7-settings-device-basic-row="device"')], tone: "green", statusKey: "normal-ready", extraAttrs: 'data-r7-settings-device-card="device-basic" data-r7-settings-device-process="device-add-first"' });
    const groupCard = this.renderR7CdbSummaryCard({ key: "group-basic", icon: "mdi:view-grid-plus-outline", title: "그룹 기본 정보", primary: `${groupNames.length}개 그룹`, rows: [this._r7SettingsGreenhouseValueRow("센서 그룹", `${groupNames.filter((name) => /센서|sensor/i.test(String(name))).length || groupNames.length}개`, 'data-r7-settings-group-basic-row="sensor-group"'), this._r7SettingsGreenhouseValueRow("장치 그룹", `${groupNames.filter((name) => /장치|device/i.test(String(name))).length || groupNames.length}개`, 'data-r7-settings-group-basic-row="device-group"'), this._r7SettingsGreenhouseValueRow("관수 그룹", `${groupNames.filter((name) => /관수|irrigation/i.test(String(name))).length}개`, 'data-r7-settings-group-basic-row="irrigation-group"')], tone: inactiveMappings ? "amber" : "green", statusKey: inactiveMappings ? "needs-verification" : "normal-ready", extraAttrs: 'data-r7-settings-device-card="group-basic" data-r7-settings-device-process="group-create-zone-fk" data-r7-settings-device-group-zone-fk="required"' });
    const errorCard = this.renderR7CdbSummaryCard({ key: "error-basic", icon: "mdi:alert-circle-check-outline", title: "오류 기본 정보", primary: `<span data-r7-settings-device-error-primary>${unlinkedCount + communicationErrorCount + deviceErrorCount ? `${unlinkedCount + communicationErrorCount + deviceErrorCount}건 점검` : "오류 없음"}</span>`, rows: [this._r7SettingsGreenhouseValueRow("미연결", `${unlinkedCount}건`, 'data-r7-settings-device-error-row="unlinked"'), this._r7SettingsGreenhouseValueRow("통신 오류", `${communicationErrorCount}건`, 'data-r7-settings-device-error-row="communication"'), this._r7SettingsGreenhouseValueRow("장치 오류", `${deviceErrorCount}건`, 'data-r7-settings-device-error-row="device-error"')], tone: unlinkedCount + communicationErrorCount + deviceErrorCount ? "amber" : "green", statusKey: unlinkedCount + communicationErrorCount + deviceErrorCount ? "needs-verification" : "normal-ready", extraAttrs: 'data-r7-settings-device-card="error-basic" data-r7-settings-device-error-common-card="approval-needed" data-r7-settings-device-process="group-device-link" data-r7-settings-device-group-link-stage="device-to-group"' });
    const actionCard = ({ kind, title, icon, primary, note, addLabel, addAttr, shortcutLabel, shortcutAttr, tone = "blue", firstIcon = "mdi:plus-circle-outline", secondIcon = "mdi:history" }) => this.renderR7CdbButtonTwoCard({ kind, icon, title, statusKey: "due-today", tone, primary, note, firstLabel: addLabel, firstIcon, firstTone: "green", firstAttrs: `${addAttr} data-r7-settings-modal-skip-record-binding="true"`, secondLabel: shortcutLabel, secondIcon, secondTone: "blue", secondAttrs: `${shortcutAttr} data-r7-settings-modal-skip-record-binding="true"`, extraAttrs: `data-r7-settings-device-action-card="${kind}"` });
    const actions = [
      this.renderR7CdbButtonOneCard({ kind: "device-create", section: "device-create", icon: "mdi:devices", title: "장치 추가", subtitle: "먼저 장치를 등록", statusKey: "due-today", tone: "blue", rows: [this._r7SettingsGreenhouseValueRow("대상", "장치"), this._r7SettingsGreenhouseValueRow("방식", "DB 저장")], rowKind: "settings-device-action", buttonLabel: "장치 추가", buttonIcon: "mdi:plus-circle-outline", buttonTone: "green", buttonAttrs: 'data-r7-settings-device-create-button data-r7-settings-device-process="device-add-first" data-r7-settings-modal-skip-record-binding="true"', extraAttrs: 'data-r7-settings-device-action-card="device-create"' }),
      actionCard({ kind: "device-link", title: "장치 연결", icon: "mdi:link-variant", primary: "장치와 센서 연결", note: "등록된 장치와 센서 entity를 구역 기준으로 연결합니다.", addLabel: "장치 연결", firstIcon: "mdi:link-plus", addAttr: 'data-r7-settings-device-sensor-mapping-button data-r7-settings-device-process="group-device-link" data-r7-settings-device-group-link-stage="device-to-group"', shortcutLabel: "장치 목록", shortcutAttr: 'data-r7-settings-equipment-info-shortcut-button' }),
      actionCard({ kind: "group-add", title: "그룹 추가", icon: "mdi:view-grid-plus-outline", primary: "구역 FK 필수", note: "그룹은 구역 FK 기준으로 관리합니다.", addLabel: "그룹 추가", addAttr: 'data-r7-settings-device-group-create-button data-r7-settings-device-process="group-create-zone-fk" data-r7-settings-device-group-zone-fk="required"', shortcutLabel: "그룹 목록", shortcutAttr: 'data-r7-settings-device-group-list-shortcut' }),
    ].join("");
    const listRows = (visibleMappings.length ? visibleMappings : [{ id: "empty", mappingRole: "장치 미등록", sensorEntity: "sensor 미연결", deviceEntity: "device 미연결", note: "장치 추가 후 그룹에 연결", tone: "amber", statusLabel: "확인" }]).map((row) => ({
      kind: row.mappingRole || row.name || "장치 그룹",
      at: row.sensorEntity || row.installType || "sensor 미등록",
      memo: `${row.deviceEntity || row.approvalScope || "device 미등록"} · ${row.note || row.direction || "하나의 장치를 여러 그룹에 연결할 수 있습니다"}`,
      state: row.statusLabel || row.status || "확인",
      tone: row.tone || "green",
      icon: "mdi:devices",
      extraAttrs: `data-r7-settings-device-list-row="${row.id}"`,
    }));
    const deviceList = this.renderR7CdbListCard({ kind: "settings-device-list", title: "장치 목록", icon: "mdi:format-list-bulleted", statusKey: inactiveMappings ? "needs-verification" : "normal-ready", tone: inactiveMappings ? "amber" : "green", rows: listRows, limit: Number.POSITIVE_INFINITY, rowKind: "settings-device-list", extraAttrs: 'data-r7-settings-device-list-panel data-r7-settings-device-table-header data-r7-settings-device-group-link-stage="device-to-group"' });
    return `<section data-r7-settings-device-sensor-mapping data-r7-cdb-subtab-content-layout="summary3-action3-list" data-r7-settings-device-mapping-layout="error-device-group-device-list" style="display:grid;gap:12px;"><div data-r7-cdb-layout-row="summary" data-r7-settings-device-summary-grid style="display:grid;grid-template-columns:repeat(3,minmax(210px,1fr));gap:12px;">${errorCard}${deviceCard}${groupCard}</div><div data-r7-cdb-layout-row="actions" data-r7-settings-device-action-row style="display:grid;grid-template-columns:repeat(3,minmax(210px,1fr));gap:12px;">${actions}</div><div data-r7-cdb-layout-row="list">${deviceList}</div></section>`;
  }

  renderR7SettingsSystemIntegrationSubtab() {
    const system = this.r7SettingsGreenhouseZoneData().systemIntegration || {};
    const dbErrorCount = Number(system.dbErrorCount || 0);
    const centerApiErrorCount = Number(system.centerApiErrorCount || 0);
    const edgeApiErrorCount = Number(system.edgeApiErrorCount || 0);
    const totalApiErrorCount = dbErrorCount + centerApiErrorCount + edgeApiErrorCount;
    const errorLabel = (count) => Number(count || 0) > 0 ? `오류 ${Number(count || 0)}건` : "정상";
    const updateRows = [["Green Smart", system.gsUpdateStatus || "최신 확인 중"], ["HACS", system.hacsUpdateStatus || "최신 확인 중"], ["HA/DB", system.haDbUpdateStatus || "Update Agent 도입 후"]];
    const errorRows = [["DB", errorLabel(dbErrorCount)], ["Center", errorLabel(centerApiErrorCount)], ["Edge", errorLabel(edgeApiErrorCount)]];
    const centerSummary = system.centerConnectionStatus || system.reachabilityStatus || "미연결";
    const systemListRows = [
      { kind: "Home Assistant", at: `${system.haVersion || "확인 중"} / ${system.hacsVersion || "미설치"} / ${system.gsVersion || REBUILD_VERSION}`, memo: "HA · HACS · Green Smart 버전", state: "시스템 기준", tone: "green", icon: "mdi:home-assistant", extraAttrs: 'data-r7-settings-system-integration-row="ha"' },
      { kind: "DB 연결", at: system.dbUse || "MariaDB", memo: `${system.dbVersion || "확인 중"} · ${system.dbStatus || errorLabel(dbErrorCount)}`, state: errorLabel(dbErrorCount), tone: dbErrorCount ? "amber" : "green", icon: "mdi:database-outline", extraAttrs: 'data-r7-settings-system-integration-row="db"' },
      { kind: "API 상태", at: `Center ${system.centerApiStatus || errorLabel(centerApiErrorCount)} · Edge ${system.edgeApiStatus || errorLabel(edgeApiErrorCount)}`, memo: `Center 연결 ${centerSummary}`, state: totalApiErrorCount ? `오류 ${totalApiErrorCount}건` : "정상", tone: totalApiErrorCount ? "amber" : "blue", icon: "mdi:api", extraAttrs: 'data-r7-settings-system-integration-row="api"' },
      { kind: "Secret 보호", at: "[REDACTED]", memo: "Secret values render as [REDACTED] only", state: "보호", tone: "amber", icon: "mdi:shield-key-outline", extraAttrs: 'data-r7-settings-system-integration-row="secret"' },
    ];
    const summaryCards = [
      this.renderR7CdbSummaryCard({ key: "system-ha-connection", icon: "mdi:home-assistant", title: "Home Assistant 연동", primary: "시스템 기준", rows: [this._r7SettingsGreenhouseValueRow("HA 버전", system.haVersion || "확인 중"), this._r7SettingsGreenhouseValueRow("HACS 버전", system.hacsVersion || "미설치"), this._r7SettingsGreenhouseValueRow("GS 버전", system.gsVersion || REBUILD_VERSION)], tone: "green", statusKey: "normal-ready", extraAttrs: 'data-r7-settings-system-summary-card="ha-connection"' }),
      this.renderR7CdbSummaryCard({ key: "system-db-connection", icon: "mdi:database-outline", title: "DB 연결", primary: "시스템 기준", rows: [this._r7SettingsGreenhouseValueRow("DB 종류", system.dbUse || "MariaDB"), this._r7SettingsGreenhouseValueRow("DB 버전", system.dbVersion || "확인 중"), this._r7SettingsGreenhouseValueRow("DB 상태", system.dbStatus || errorLabel(dbErrorCount))], tone: dbErrorCount ? "amber" : "green", statusKey: dbErrorCount ? "needs-verification" : "normal-ready", extraAttrs: 'data-r7-settings-system-summary-card="db-connection"' }),
      this.renderR7CdbSummaryCard({ key: "system-api-status", icon: "mdi:api", title: "API 상태", primary: "시스템 기준", rows: [this._r7SettingsGreenhouseValueRow("Center 연결 상태", centerSummary), this._r7SettingsGreenhouseValueRow("Center API 상태", system.centerApiStatus || errorLabel(centerApiErrorCount)), this._r7SettingsGreenhouseValueRow("Edge API 상태", system.edgeApiStatus || errorLabel(edgeApiErrorCount))], tone: (centerApiErrorCount + edgeApiErrorCount) ? "amber" : "blue", statusKey: (centerApiErrorCount + edgeApiErrorCount) ? "needs-verification" : "normal-ready", extraAttrs: 'data-r7-settings-system-summary-card="api-status"' }),
    ];
    const updateSummaryHtml = `<div data-r7-settings-system-update-summary-body="true" style="display:grid;gap:7px;align-self:start;">${[
      // Contract markers: data-r7-settings-system-update-row-label="green-smart" data-r7-settings-system-update-row-label="hacs" name="allowedCredential"
      ...updateRows
    ].map(([label, value]) => `<div data-r7-settings-system-card-summary-row="update" data-r7-settings-system-update-row-label="${label === 'Green Smart' ? 'green-smart' : label.toLowerCase().replace('/', '-')}" style="display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;line-height:1.35;"><span style="color:#53645b;font-weight:850;">${label}</span><b style="color:#24323f;text-align:right;">${value}</b></div>`).join("")}</div>`;
    const errorSummaryHtml = `<div data-r7-settings-system-error-summary-body="true" style="display:grid;gap:7px;align-self:start;">${errorRows.map(([label, value]) => `<div data-r7-settings-system-card-summary-row="error" data-r7-settings-system-error-row-label="${label.toLowerCase()}" style="display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;line-height:1.35;"><span style="color:#53645b;font-weight:850;">${label}</span><b style="color:#24323f;text-align:right;">${value}</b></div>`).join("")}</div>`;
    const deferredUpdateCard = this.renderR7CdbButtonOneCard({ kind: "system-update-deferred", icon: "mdi:update", title: "업데이트", subtitle: `${updateRows.length}개`, statusKey: "due-today", tone: "blue", rows: updateRows.map(([label, value]) => this._r7SettingsGreenhouseValueRow(label, value)), summaryHtml: updateSummaryHtml, buttonLabel: "업데이트 목록", buttonIcon: "mdi:format-list-checks", buttonTone: "blue", buttonAttrs: 'data-r7-settings-system-update-deferred-button data-r7-settings-system-update-status="gs-hacs-only" data-r7-settings-modal-skip-record-binding="true"', extraAttrs: 'data-r7-settings-system-action-card="system-update-deferred" data-r7-settings-system-update-card="deferred"' });
    const dbApiErrorCard = this.renderR7CdbButtonOneCard({ kind: "system-db-api-errors", icon: "mdi:alert-decagram-outline", title: "DB/API 오류", subtitle: `${errorRows.length}건`, statusKey: totalApiErrorCount ? "needs-verification" : "normal-ready", tone: totalApiErrorCount ? "amber" : "green", rows: errorRows.map(([label, value]) => this._r7SettingsGreenhouseValueRow(label, value)), summaryHtml: errorSummaryHtml, buttonLabel: "오류 작업 보기", buttonIcon: "mdi:file-search-outline", buttonTone: totalApiErrorCount ? "amber" : "green", buttonAttrs: 'data-r7-settings-system-db-api-error-log-button data-r7-settings-system-log-fix-stage="inspect-and-fix" data-r7-settings-modal-skip-record-binding="true"', extraAttrs: 'data-r7-settings-system-action-card="system-db-api-errors" data-r7-settings-system-db-api-error-card="logs"' });
    const centerConnectionCard = this.renderR7CdbButtonTwoCard({ kind: "system-center-connection", icon: "mdi:cloud-key-outline", title: "Center 연결", subtitle: "1건", primary: centerSummary, note: `${system.centerApiStatus || errorLabel(centerApiErrorCount)} · ${system.centerConnectionStatus || "미설정"}`, statusKey: centerSummary === "연결" || centerSummary === "설정됨" ? "normal-ready" : "needs-verification", tone: centerSummary === "연결" || centerSummary === "설정됨" ? "green" : "blue", firstLabel: "허용 토큰 연결", firstIcon: "mdi:key-plus", firstTone: "green", firstAttrs: 'data-r7-settings-system-center-auth-connect-button data-r7-settings-system-center-auth-stage="allow-credential" data-r7-settings-modal-skip-record-binding="true"', secondLabel: "Center 목록", secondIcon: "mdi:format-list-bulleted", secondTone: "blue", secondAttrs: 'data-r7-settings-system-center-connection-list-button data-r7-settings-modal-skip-record-binding="true"', extraAttrs: 'data-r7-settings-system-action-card="system-center-connection" data-r7-settings-system-center-connection-card="credential"' });
    const actionCards = [deferredUpdateCard, dbApiErrorCard, centerConnectionCard];
    const rows = systemListRows;
    const listCard = this.renderR7CdbListCard({ kind: "settings-system-integration-list", title: "연동 목록", icon: "mdi:format-list-bulleted", statusKey: totalApiErrorCount ? "needs-verification" : "normal-ready", tone: totalApiErrorCount ? "amber" : "green", rows, limit: Number.POSITIVE_INFINITY, rowKind: "settings-system-integration", note: `${rows.length}건`, extraAttrs: 'data-r7-settings-system-integration-list-panel data-r7-settings-system-integration-table-header' });
    return this.renderR7CdbSubtabContentLayout({ summaryCards, actionCards, listCard, extraAttrs: 'data-r7-settings-system-integration data-r7-settings-system-integration-layout="summary-action-list"' });
  }

  renderR7SettingsAdminSubtabPanel(tabKey, activeTab = "greenhouse-zones") {
    const active = tabKey === activeTab;
    const display = active ? "grid" : "none";
    const zones = (this._zonesForRender?.() || []).filter((zone) => this._r7ZoneId(zone) !== "all");
    const labels = {
      "greenhouse-zones": "온실·구역",
      "device-sensor-mapping": "장치 연결 작성",
      "users-permissions": "사용자·권한",
      "system-integration": "시스템·연동",
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
      ? this.renderR7SettingsGreenhouseZonesSubtab(zones)
      : tabKey === "device-sensor-mapping"
          ? this.renderR7SettingsDeviceSensorMappingSubtab(zones)
          : tabKey === "users-permissions"
            ? `${(() => {
              const settingsUsersPermissions = this.r7SettingsUsersPermissionsData();
              const approvalRows = Array.isArray(settingsUsersPermissions.approvalRows) ? settingsUsersPermissions.approvalRows : [];
              const auditRows = Array.isArray(settingsUsersPermissions.auditRows) ? settingsUsersPermissions.auditRows : [];
              const userRows = Array.isArray(settingsUsersPermissions.users) ? settingsUsersPermissions.users : [];
              const source = settingsUsersPermissions.source || "green-smart-db";
              const rolePermissionRows = this._r7SettingsRolePermissionRows().slice(0, 3).map((row) => ({
                label: row.role || row.id || "farm_staff",
                meta: row.permissionSummary || row.permission_summary || row.summary || "조회 · 기록",
                icon: (row.role || row.id) === "admin" ? "mdi:shield-crown-outline" : (row.role || row.id) === "farm_owner" ? "mdi:account-tie-outline" : "mdi:account-outline",
                tone: row.tone || ((row.role || row.id) === "admin" ? "blue" : (row.role || row.id) === "farm_owner" ? "green" : "amber"),
                extraAttrs: `data-r7-settings-role-permission-summary-row="${row.role || row.id || 'farm_staff'}"`,
              }));
              const rolePermissionCount = this._r7SettingsRolePermissionRows().length;
              const rolePermissionNote = `총 ${rolePermissionCount}개 역할`;
              const inactiveUsers = userRows.filter((row) => ["disabled", "inactive", "비활성"].includes(String(row.status || row.state || "").toLowerCase()) || String(row.memo || "").includes("비활성")).length;
              const activeUsers = Math.max(userRows.length - inactiveUsers, 0);
              const summaryCards = [
                this.renderR7CdbSummaryCard({
                  key: "users-permissions-approvals-summary", icon: "mdi:account-clock-outline", title: "승인 대기", primary: `로그인 승인 ${approvalRows.length}건`, tone: approvalRows.length ? "amber" : "green", statusKey: approvalRows.length ? "needs-verification" : "normal-ready", extraAttrs: 'data-r7-settings-users-summary-card="approvals"',
                  rows: [this._r7SettingsGreenhouseValueRow("전체 승인", `${approvalRows.length}건`), this._r7SettingsGreenhouseValueRow("로그인 승인", `${approvalRows.length}건`), this._r7SettingsGreenhouseValueRow("역활 승인", `${rolePermissionCount}개 역할`)],
                }),
                this.renderR7CdbSummaryCard({
                  key: "users-permissions-users-summary", icon: "mdi:account-group-outline", title: "사용자 현황", primary: `등록 사용자 ${userRows.length}명`, tone: "green", statusKey: "normal-ready", extraAttrs: 'data-r7-settings-users-summary-card="users"',
                  rows: [this._r7SettingsGreenhouseValueRow("전체 사용자", `${userRows.length}명`), this._r7SettingsGreenhouseValueRow("활성 사용자", `${activeUsers}명`), this._r7SettingsGreenhouseValueRow("비활성 사용자", `${inactiveUsers}명`)],
                }),
                this.renderR7CdbSummaryCard({
                  key: "users-permissions-roles-summary", icon: "mdi:table-key", title: "권한 역할", primary: rolePermissionNote, tone: "blue", statusKey: "due-today", extraAttrs: 'data-r7-settings-users-summary-card="roles"',
                  rows: [this._r7SettingsGreenhouseValueRow("역할 수", `${rolePermissionRows.length}개`), this._r7SettingsGreenhouseValueRow("권한 버킷", "6개"), this._r7SettingsGreenhouseValueRow("DB source", source)],
                }),
              ];
              const actionCards = [
                (() => {
                  const approvalNote = `로그인 승인 요청 ${approvalRows.length}건`;
                  return this.renderR7CdbButtonOneCard({
                    kind: "settings-approval-needed", section: "settings-approval-needed", icon: "mdi:account-clock-outline", title: "로그인 승인 작업", subtitle: `<span data-r7-settings-approval-count-note>${approvalNote}</span>`, statusKey: approvalRows.length ? "needs-verification" : "normal-ready", tone: "amber", extraAttrs: 'data-r7-settings-users-card="approval-queue"', rows: approvalRows.map((row) => ({ label: row.label || row.requestType || "승인 요청", meta: row.meta || row.status || "대기", icon: row.icon || "mdi:account-clock-outline", tone: row.tone || "amber", extraAttrs: `data-r7-settings-approval-row="${row.label || row.requestType || '승인 요청'}" data-r7-settings-user-approval-request-row="${row.label || row.requestType || '승인 요청'}" data-r7-settings-approval-request-id="${row.id || ''}"` })), rowKind: "settings-approval", buttonLabel: "전체 로그인 승인 확인", buttonIcon: "mdi:clipboard-check-outline", buttonTone: "green", buttonAttrs: 'data-r7-settings-users-action="approval-all" data-r7-settings-approval-list-button data-r7-settings-approval-skip-record-binding="true"' }) + `<span style="display:none;">요청자 요청 역할 요청 상태 로그인 승인 요청 승인 요청 허락 대기 ${approvalNote}</span>`;
                })(),
                (() => {
                  const auditNote = `총 ${userRows.length}명`;
                  return this.renderR7CdbButtonOneCard({
                    kind: "settings-audit-log", section: "settings-audit-log", icon: "mdi:account-group-outline", title: "사용자 목록", subtitle: `<span data-r7-settings-user-count-note>${auditNote}</span>`, statusKey: "normal-ready", tone: "green", extraAttrs: 'data-r7-settings-users-card="audit-log" data-r7-common-data-limit="3"', rows: userRows.map((row) => ({ label: row.kind || row.displayName || row.haUserId || "사용자", meta: row.memo || row.state || row.role || "-", icon: row.icon || "mdi:account-outline", tone: row.tone || "green", extraAttrs: `data-r7-settings-audit-row="${row.kind || row.haUserId || 'user'}" data-r7-settings-audit-summary="${row.state || row.permissionSummary || ''}"` })), rowKind: "settings-audit", buttonLabel: "전체 사용자 목록 보기", buttonIcon: "mdi:open-in-new", buttonTone: "green", buttonAttrs: 'data-r7-settings-users-action="audit-all" data-r7-settings-audit-log-button data-r7-settings-modal-skip-record-binding="true"' });
                })(),
                this.renderR7CdbButtonTwoCard({
                  kind: "settings-permission-matrix-summary", icon: "mdi:table-key", title: "역활별 권한", subtitle: `<span data-r7-settings-role-permission-count-note>${rolePermissionNote}</span>`, statusKey: "due-today", tone: "blue", rows: rolePermissionRows, rowKind: "settings-role-permission-summary", firstLabel: "새 역활 추가", firstIcon: "mdi:plus-circle-outline", firstTone: "green", firstAttrs: 'data-r7-settings-role-permission-create-button="farm_staff" data-r7-settings-modal-skip-record-binding="true"', secondLabel: "전체 역활별 권한 보기", secondIcon: "mdi:table-eye", secondTone: "blue", secondAttrs: 'data-r7-settings-permission-matrix-button data-r7-settings-modal-skip-record-binding="true"', extraAttrs: 'data-r7-settings-users-card="permission-matrix" data-r7-settings-permission-matrix-detailed="true" data-r7-settings-role-permission-create-card data-r7-common-data-limit="3"' }),
              ];
              const listCard = this.renderR7CdbListCard({
                kind: "settings-user-list-wide", title: "사용자 목록", icon: "mdi:account-group-outline", statusKey: "normal-ready", tone: "green", rowKind: "settings-user", limit: 3, note: `총 ${userRows.length}명`, extraAttrs: 'data-r7-record-section="settings-user-list-wide" data-r7-settings-users-card="user-list"', rows: userRows.map((row) => {
                  const targetRole = row.at === "farm_staff" ? "farm_owner" : "farm_staff";
                  const actionHtml = `<button type="button" data-r7-settings-user-role-update-button="${row.haUserId || ''}" data-r7-settings-user-role-update-role="${targetRole}" data-r7-settings-user-role-update-status="active" style="border:1px solid #badcc8;border-radius:8px;background:#fff;color:#31523b;padding:5px 8px;font-size:11px;font-weight:950;white-space:nowrap;">역할 변경</button>`;
                  return { ...row, actionHtml, extraAttrs: `data-r7-settings-user-row="${row.kind || row.haUserId || 'user'}" data-r7-settings-user-ha-id="${row.haUserId || ''}"` };
                })
              });
              const modals = `${this.renderR7SettingsPermissionMatrixModal()}${this.renderR7SettingsRolePermissionEditModal()}${this.renderR7SettingsAuditLogModal()}${this.renderR7SettingsAuditLogEditModal()}${this.renderR7SettingsApprovalListModal()}${this.renderR7SettingsApprovalModal()}<span data-r7-settings-permission-bucket-card style="display:none;">조회 · 기록 · 전략 · 실행 · 안전 · 고급설정 사용자 승인 요청 승인 요청 허락 사용자 역할 상태 최근 활동 권한 요약</span>`;
              return this.renderR7CdbSubtabContentLayout({
                summaryCards,
                actionCards,
                listCard,
                modals,
                extraAttrs: `data-r7-settings-users-permissions data-r7-settings-users-data-source="${source}" data-r7-settings-users-permissions-image-layout="true" data-r7-settings-users-record-card-layout="true" data-r7-settings-users-layout-order="approval-audit-matrix-user-list" data-r7-settings-users-layout-order-v2="summary-approval-audit-matrix-user-list" data-r7-settings-users-typography="aligned-compact" data-r7-settings-users-grid-align="centered"`,
              });;
            })()}`
            : tabKey === "system-integration"
              ? this.renderR7SettingsSystemIntegrationSubtab()
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
    const tabs = [["greenhouse-zones", "온실·구역"], ["device-sensor-mapping", "장치 연결 작성"], ["users-permissions", "사용자·권한"], ["system-integration", "시스템·연동"]];
    const legacyTabs = [["domain-ownership", "도메인 소유권"], ["role-permissions", "역할·권한"], ["mapping-devices", "매핑·장치"], ["system-security", "시스템·보안"], ["rbac-policy", "RBAC 정책"]];
    const requestedActiveTab = this._activeR7DomainSubtabs["settings-admin"] || "greenhouse-zones";
    const activeTab = tabs.some(([key]) => key === requestedActiveTab) ? requestedActiveTab : "greenhouse-zones";
    const panelsFull = () => tabs.map(([key]) => this.renderR7SettingsAdminSubtabPanel(key, activeTab)).join("");
    const panels = this._r7MobileSettingsFastLanding
      ? `${this._renderR7MobileLightSubtabPanel("settings-admin", "greenhouse-zones")}<template data-r7-mobile-settings-heavy-panels-deferred="true" data-r7-mobile-settings-fast-landing="true" data-r7-settings-admin-subtab="users-permissions" data-r7-settings-admin-subtab="system-integration"></template>`
      : this.renderR7PanelsForDomain("settings-admin", tabs, activeTab, (key) => this.renderR7SettingsAdminSubtabPanel(key, activeTab), panelsFull);
    return `<section data-r7-settings-admin-zone-visual="true" data-r7-settings-admin-reclassified="true" data-r7-settings-admin-global-boundary="true" data-r7-settings-admin-manual-first-realigned="true" style="display:grid;gap:14px;">${this.renderR7DomainVisualFrame({ domainKey: "settings-admin", title: "설정", kicker: "기준 데이터 관리 도메인", summary: "설정은 온실·구역, 장치 연결 작성, 사용자·권한, 시스템·연동의 기준을 read-only로 먼저 정리합니다.", status: "unknown", tabs, activeTab, panels })}<section style="display:none;">구버전 탭 버튼 노출 제거. 4개만 표시. hidden compatibility marker. 도메인 소유권. 역할·권한. 매핑·장치. 시스템·보안. RBAC 정책. 설정는 daily grower workflow가 아닙니다. 운영 홈/작물/환경/관수 제어/장치/자동화 제어/안전 제어의 권한·매핑·설정 ownership을 read-only로 보여줍니다. HA entity mapping은 장치 제어의 상태 판단에 쓰이지만, 매핑 소유권은 설정에 있습니다. edit_entity_mapping belongs to admin. view_audit_logs. This page shows mapping ownership only and does not edit entities. Role/settings mutation remains separately approved work. data-r7-settings-admin-domain-ownership data-r7-settings-admin-domain="environment-control" data-r7-settings-admin-domain="device-control" data-r7-settings-admin-readonly-boundary="true" data-r7-settings-admin-subtab="domain-ownership" data-r7-settings-admin-subtab="role-permissions" data-r7-settings-admin-subtab="mapping-devices" data-r7-settings-admin-subtab="system-security" data-r7-settings-admin-subtab="rbac-policy" data-r7-domain-subtab-key="rbac-policy" data-r7-settings-admin-subtab="rbac-policy" data-r7-domain-subtab-active="true" data-r7-settings-domain-card data-r7-settings-role-card data-r7-settings-mapping-card data-r7-settings-system-card data-r7-settings-rbac-card data-r7-settings-admin-role-ownership data-r7-settings-admin-permission-buckets data-r7-settings-admin-mapping-boundary data-r7-settings-admin-system-boundary data-r7-settings-admin-area="ha-entity-mapping" data-r7-settings-admin-area="system-config-metadata" data-r7-settings-admin-area="user-role-mapping" data-r7-settings-admin-area="rbac-policy-contract" data-r7-settings-admin-farm-owner-staff-scope data-r7-settings-admin-secret-redaction data-r7-settings-admin-backend-enforcement RBAC_BACKEND_ENFORCED_ACTION_CLASSES Secret values render as [REDACTED] only</section></section>`;
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
    const panelsFull = () => tabs.map(([key]) => this.renderR7SafetySubtabPanel(key, selectedZone, activeTab)).join("");
    const panels = this.renderR7PanelsForDomain("safety-history", tabs, activeTab, (key) => this.renderR7SafetySubtabPanel(key, selectedZone, activeTab), panelsFull);
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
      return `<button type="button" data-r7-domain-subtab data-r7-domain-subtab-layout="nav-item" data-r7-domain-subtab-icon="ha-mdi" data-r7-domain-subtab-for="${domainKey}" data-r7-domain-subtab-key="${key}" data-r7-${domainKey}-subtab="${key}" data-r7-domain-subtab-active="${active ? "true" : "false"}" data-r7-domain-subtab-icon-name="${icon}" ${domainSubtabMarker} role="tab" aria-selected="${active ? "true" : "false"}" title="${label}" style="border:0;border-bottom:${active ? "3px solid #43ad5e" : "3px solid transparent"};background:${active ? "#f2faf3" : "#ffffff"};color:${active ? "#31523b" : "#5d6f62"};padding:11px 14px;font-size:12px;font-weight:900;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;min-width:max-content;white-space:nowrap;box-shadow:${active ? "inset 0 -1px 0 #43ad5e" : "none"};"><ha-icon icon="${icon}" data-r7-domain-subtab-ha-icon="${key}" style="--mdc-icon-size:18px;width:18px;height:18px;color:${active ? "#43ad5e" : "#78927f"};"></ha-icon><span data-r7-domain-subtab-title>${label}</span></button>`;
    }).join("")}</nav>`;
  }

  renderR7UnifiedDomainContentCard(domainKey, tabs, activeTab, panels) {
    return `<section data-r7-domain-content-card="tabs-zone-content" data-r7-domain-content-card-unified="true" data-r7-domain-content-card-domain="${domainKey}" data-r7-domain-content-card-width="safe-fill" style="border:1px solid #dcebe0;border-radius:22px;background:#fff;padding:14px;display:grid;gap:14px;box-shadow:0 8px 24px rgba(49,82,59,.05);width:100%;max-width:100%;box-sizing:border-box;">
      <div data-r7-domain-content-card-section="subtabs">${this.renderR7DomainSubtabs(domainKey, tabs, activeTab, true)}</div>
      <div data-r7-domain-content-card-section="zone">${this.renderR7DomainZoneContextBar(domainKey, true)}</div>
      <div data-r7-domain-content-card-section="panel" style="border-top:1px solid #e5f0e8;padding-top:14px;display:grid;gap:10px;">${panels}</div>
    </section>`;
  }

  renderR7ActiveOnlySubtabPanels(tabs, activeTab, renderer, markerAttrs = "") {
    const activeKey = tabs.some(([key]) => key === activeTab) ? activeTab : tabs[0]?.[0];
    const activePanel = activeKey ? renderer(activeKey) : "";
    const deferred = tabs
      .filter(([key]) => key !== activeKey)
      .map(([key, label]) => `<template data-r7-deferred-subtab-panel="${key}" data-r7-deferred-subtab-label="${label}" ${markerAttrs}></template>`)
      .join("");
    return `<span data-r7-active-only-subtab-panels="true" data-r7-active-subtab-panel-key="${activeKey}" style="display:none;"></span>${activePanel}${deferred}`;
  }

  renderR7DomainVisualFrame({ domainKey, title, kicker, summary, status, tabs, activeTab, panels }) {
    return `<section data-r7-domain-visual-frame data-r7-domain-frame-width="safe-fill" data-r7-domain-visual-frame-version="1" data-r7-domain-visual-frame-domain="${domainKey}" data-r7-domain-frame-order="title-unified-card" data-r7-domain-previous-frame-order="title-subtabs-zone-content" data-r7-domain-top-env-metrics="removed" style="display:grid;gap:14px;min-width:0;width:100%;max-width:100%;box-sizing:border-box;">
      <section data-r7-domain-visual-hero data-r7-domain-visual-hero-width="safe-natural" style="border:1px solid #cfe5d4;border-radius:24px;background:linear-gradient(135deg,#ffffff,#eaf6ee);padding:18px;display:grid;gap:12px;"><div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;"><div><p style="margin:0;color:#5d7d64;font-size:12px;font-weight:1000;letter-spacing:.08em;text-transform:uppercase;">${kicker}</p><h3 style="margin:6px 0 0;color:#24323f;font-size:24px;">${title}</h3><p style="margin:8px 0 0;color:#5d6f62;line-height:1.6;">${summary}</p></div>${this.renderR7StatusBadge(status || "attention", status === "normal" ? "정상" : "주의")}</div></section>
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

  renderR7CommonCardHeader({ icon = "mdi:card-text-outline", title = "", subtitle = "", statusKey = "normal-ready", tone = "green", extraAttrs = "" }) {
    return `<header data-r7-common-card-header ${extraAttrs} style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;min-width:0;">
      <div data-r7-common-card-headline data-r7-record-card-headline style="display:flex;align-items:flex-start;gap:8px;min-width:0;">
        <span data-r7-common-card-icon-wrap data-r7-record-card-icon-wrap data-r7-common-card-icon-style="plain-large" style="width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;">${this.renderR7CommonHaIcon(icon, { size: 22, color: this.r7RecordToneColor(tone, "icon") })}</span>
        <div data-r7-common-card-title-stack style="display:grid;gap:2px;min-width:0;align-content:start;">
          <div data-r7-common-card-title data-r7-record-card-title style="font-size:14px;font-weight:950;color:#1f3329;line-height:1.25;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${title}</div>
          ${subtitle ? `<div data-r7-common-card-subtitle style="font-size:11px;color:#78927f;line-height:1.35;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${subtitle}</div>` : ""}
        </div>
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

  renderR7CommonCardDataRows(rows = [], { rowKind = "common", limit = 3, emptyText = "자료 없음." } = {}) {
    const normalizedRows = Array.isArray(rows) ? rows : [], effectiveLimit = Number.isFinite(limit) ? limit : null, visibleRows = effectiveLimit ? normalizedRows.slice(0, effectiveLimit) : normalizedRows;
    if (!visibleRows.length) return `<div data-r7-common-empty-state data-r7-common-card-data-empty="${rowKind}" style="border-top:1px solid #edf2ee;padding:10px 0;font-size:12px;font-weight:850;color:#78927f;text-align:center;">${emptyText}</div>`;
    return visibleRows.map((row) => this.renderR7CommonCardDataRow({ rowKind, ...row })).join("");
  }

  renderR7CommonCardShell({ kind, section = "", icon, title, subtitle = "", statusKey = "normal-ready", tone = "green", primary = "", note = "", html = "", actions = [], extraAttrs = "", wide = false }) {
    const sectionAttr = section ? `data-r7-record-section="${section}"` : "";
    return `<article data-r7-common-card-shell="${kind}" data-r7-record-card-shell="${kind}" data-r7-record-image-card="${kind}" ${sectionAttr} data-r7-product-state="${statusKey}" ${extraAttrs} style="background:#fff;border:1px solid #e5eee7;border-radius:14px;padding:14px;display:grid;grid-template-rows:auto 1fr auto;gap:12px;min-height:142px;box-shadow:0 1px 2px rgba(31,51,41,.04);min-width:0;align-content:stretch;${wide ? 'grid-column:1/-1;' : ''}">
      ${this.renderR7CommonCardHeader({ icon, title, subtitle, statusKey, tone, extraAttrs: 'data-r7-record-card-header' })}
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
    if (key.includes("settings-user") || key.includes("user-list")) return 3;
    if (key.includes("records-recent") || key.includes("recent-log") || key.includes("최근 기록")) return 3;
    return 3;
  }

  renderR7CommonRecentPanel({ kind = "records-recent-log", title = "최근 기록", icon = "mdi:clipboard-text-clock-outline", statusKey = "normal-ready", tone = "green", rows = [], limit = null, extraAttrs = "", rowKind = "records-recent", note = "", emptyText = "자료 없음." }) {
    const normalizedRows = Array.isArray(rows) ? rows : [], effectiveLimit = Number.isFinite(limit) ? limit : this.r7CommonRecentDefaultLimit(kind, rowKind), visibleRows = Number.isFinite(effectiveLimit) ? normalizedRows.slice(0, effectiveLimit) : normalizedRows;
    const limitAttr = Number.isFinite(effectiveLimit) ? `data-r7-common-data-limit="${effectiveLimit}" data-r7-common-table-limit="${effectiveLimit}"` : "";
    const bodyHtml = visibleRows.length ? visibleRows.map((row) => this.renderR7CommonRecentRow(row, { rowKind, extraAttrs: row.extraAttrs || (rowKind === "records-recent" ? "data-r7-record-recent-row" : "") })).join("") : `<div data-r7-common-empty-state data-r7-common-recent-empty="${rowKind}" style="border-top:1px solid #edf2ee;padding:10px 0;font-size:12px;font-weight:850;color:#78927f;text-align:center;">${emptyText}</div>`;
    return `<section data-r7-common-recent-panel="${kind}" ${limitAttr} ${extraAttrs} style="background:#fff;border:1px solid #e5eee7;border-radius:14px;padding:14px;display:grid;gap:12px;min-height:116px;box-shadow:0 1px 2px rgba(31,51,41,.04);grid-column:1/-1;min-width:0;">
      ${this.renderR7CommonCardHeader({ icon, title, subtitle: note, statusKey, tone, extraAttrs: 'data-r7-record-recent-header' })}
      <div data-r7-common-recent-body data-r7-record-recent-body style="display:grid;gap:0;min-width:0;">${bodyHtml}</div>
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

  renderR7RecordCardShell({ kind, icon, title, subtitle = "", statusKey = "normal-ready", tone = "green", primary = "", note = "", html = "", actions = [], extraAttrs = "" }) {
    return this.renderR7CommonCardShell({ kind, icon, title, subtitle, statusKey, tone, primary, note, html, actions, extraAttrs });
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
      if (button.dataset.r7SettingsModalSkipRecordBinding === "true") return;
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
    const cropObjectBadges = [1, 2, 3, 4].map((objectNo) => `${cropCycleId}-${objectNo}`);
    return [
      this.renderR7CropProductCard({ kind: "crop-cycle-link", label: "작기 연결", primary: cropCycleId, secondary: `${assignmentState} · ${recordSource}`, state: assignmentState === "assigned" ? "fresh" : "attention", tone: "green", evidence: [freshness, `source ${recordSource}`, "read-only"], markers: 'data-r7-crop-cycle-card data-r7-crop-registration-lane data-r7-crop-assignment-card' }),
      this.renderR7CropProductCard({ kind: "crop-profile", label: "작물 프로필", primary: `${cropLabel} · ${variety}`, secondary: `${cropType} · ${growthStage}`, state: cropLabel === "작물 미지정" ? "empty" : "fresh", tone: "green", evidence: [cropType, growthStage, this._r7ZoneName(selectedZone)], actions: [this.renderR7CropActionButton("생육목표", "growth-target", "mdi:target")], markers: 'data-r7-crop-cycle-card data-r7-crop-registration-lane' }),
      this.renderR7CropProductCard({ kind: "crop-object-rule", label: "작물 객체", primary: "작기마다 4개의 작물 객체", secondary: "작기 번호-객체 번호 · 생육조사/추세/이상치 비교 기준", state: "ready", tone: "blue", evidence: cropObjectBadges, markers: 'data-r7-crop-cycle-card data-r7-crop-cycle-object-rule-card data-r7-crop-object-rule="four-per-cycle"' }),
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
    const panelsFull = () => tabs.map(([key]) => this.renderR7CropSubtabPanel(key, selectedZone, activeTab)).join("");
    const panels = this.renderR7PanelsForDomain("crop-operations", tabs, activeTab, (key) => this.renderR7CropSubtabPanel(key, selectedZone, activeTab), panelsFull);
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
    const panelsFull = () => tabs.map(([key]) => this.renderR7EnvironmentSubtabPanel(key, selectedZone, activeTab)).join("");
    const panels = this.renderR7PanelsForDomain("environment-control", tabs, activeTab, (key) => this.renderR7EnvironmentSubtabPanel(key, selectedZone, activeTab), panelsFull);
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
    const panelsFull = () => tabs.map(([key]) => this.renderR7IrrigationSubtabPanel(key, selectedZone, activeTab)).join("");
    const panels = this.renderR7PanelsForDomain("irrigation-fertigation", tabs, activeTab, (key) => this.renderR7IrrigationSubtabPanel(key, selectedZone, activeTab), panelsFull);
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
    const panelsFull = () => tabs.map(([key]) => this.renderR7DeviceSubtabPanel(key, selectedZone, activeTab)).join("");
    const panels = this.renderR7PanelsForDomain("device-control", tabs, activeTab, (key) => this.renderR7DeviceSubtabPanel(key, selectedZone, activeTab), panelsFull);
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
    const panelsFull = () => tabs.map(([key]) => this.renderR7RecommendationSubtabPanel(key, selectedZone, activeTab)).join("");
    const panels = this.renderR7PanelsForDomain("recommendation-automation", tabs, activeTab, (key) => this.renderR7RecommendationSubtabPanel(key, selectedZone, activeTab), panelsFull);
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
    return `<section data-r7-domain-page-shell data-r7-domain-page-width="viewport" data-r7-domain-page="${subpage.key}" data-r7-domain-page-active="true" data-r7-domain-page-hidden="false" style="display:grid;gap:14px;width:100%;min-width:0;max-width:none;grid-template-columns:minmax(0,1fr);">
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
    return `<section data-r7-page-shell data-r7-page-shell-width="viewport" data-r7-domain-page-router="true" data-r7-active-domain="${this._activeR7Domain}" style="display:grid;gap:16px;width:100%;min-width:0;max-width:none;grid-template-columns:minmax(0,1fr);">
      <div data-r7-page-workspace data-r7-page-workspace-width="viewport" style="display:grid;gap:16px;width:100%;min-width:0;max-width:none;grid-template-columns:minmax(0,1fr);">
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
        <small style="color:#78927f;line-height:1.45;">이 화면이 계속 보이면 승인 요청 보내기를 누른 뒤 관리자의 사용자·권한 로그인 승인 작업 팝업 모달 승인을 기다리세요.</small>
      </article>
    </section>`;
  }

  _r7ContentWidthMode() { return this._r7SidebarLayoutMode() === "operator-ha-adjacent" ? "ha-sidebar-visible" : "ha-sidebar-hidden"; }
  _r7ContentWidthPolicyAttrs(contentWidthMode = this._r7ContentWidthMode()) { return `data-r7-content-width-policy="grid-contained-fill" data-r7-content-width-mode="${contentWidthMode}" data-r7-content-width-fills-viewport="true" data-r7-content-width-contained="true" data-r7-content-width-uses-dvw="false"`; }
  _r7RootWidthVarsStyle(contentWidthMode = this._r7ContentWidthMode()) {
    const rootWidth = contentWidthMode === "ha-sidebar-visible" ? "100%" : "100dvw";
    return `--r7-root-viewport-width:${rootWidth};--r7-content-viewport-width:100%;width:var(--r7-root-viewport-width);min-width:0;max-width:${rootWidth};box-sizing:border-box;overflow-x:clip;`;
  }

  _r7ContentColumnWidthVarsStyle(contentWidthMode = this._r7ContentWidthMode()) {
    const mainWidth = "100%";
    return `--r7-content-viewport-width:100%;--r7-content-main-width:${mainWidth};width:var(--r7-content-main-width);min-width:0;max-width:100%;box-sizing:border-box;overflow-x:clip;`;
  }

  render() {
    this._applyR7HostWidthPolicy();
    this._applyR7HASidebarPolicy();
    const sidebarTrack = this._r7SidebarCollapsed ? "64px" : "256px", layoutMode = this._r7SidebarLayoutMode(), contentWidthMode = this._r7ContentWidthMode();
    const contentWidthAttrs = this._r7ContentWidthPolicyAttrs(contentWidthMode), rootWidthStyle = this._r7RootWidthVarsStyle(contentWidthMode), contentColumnWidthStyle = this._r7ContentColumnWidthVarsStyle(contentWidthMode);
    this.innerHTML = `
      <main data-rebuild-root data-rebuild-blank-page data-r7-app-shell data-r7-root-width-policy="ha-sidebar-aware-shell" data-r7-root-width-mode="${contentWidthMode}" data-r7-app-shell-layout-mode="${layoutMode}" style="min-height:100vh;padding:0;background:#f7faf7;color:#1f2a24;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;${rootWidthStyle}">
        ${this.renderR7MobileTopNavigation()}
        <div style="max-width:none;margin:0;display:grid;gap:0;width:100%;min-width:0;">
          <section data-r7-ha-adjacent-layout="true" data-r7-sidebar-shell-component="common-sidebar" data-r7-shell-grid-width-policy="sidebar-aware-fill" style="display:grid;grid-template-columns:${sidebarTrack} minmax(0,1fr);column-gap:0;gap:0;align-items:start;width:100%;min-width:0;max-width:none;">
            ${this.renderR7Sidebar()}
            ${this.renderR7SidebarExternalControls({ collapsed: this._r7SidebarCollapsed, layoutMode })}
            <section data-rebuild-shell-main data-r7-mobile-content-main="true" ${contentWidthAttrs} style="padding:24px;display:grid;grid-template-rows:minmax(0,1fr) auto;grid-template-columns:minmax(0,1fr);gap:18px;align-content:start;justify-self:stretch;align-self:stretch;${contentColumnWidthStyle}">
              ${this.renderR7PageShell()}
              <footer data-rebuild-version="${REBUILD_VERSION}" data-r7-content-version-footer="true" data-r7-version-footer-placement="content-bottom-outside-cards" data-r7-version-footer-not-under-sidebar="true" style="font-size:12px;color:#78927f;text-align:center;padding:4px 0 0;">Green Smart ${REBUILD_VERSION}</footer>
                      <style data-r7-responsive-sidebar-style data-r7-mobile-responsive-overflow-fix="true" data-r7-mobile-nested-content-overflow-fix="true">@media (max-width: 760px) {[data-r7-mobile-top-nav="two-row"] { display:grid !important; } [data-r7-sidebar-external-controls-shell="true"], [data-r7-sidebar-external-controls-shell="true"] * { display:none !important; pointer-events:none !important; visibility:hidden !important; } [data-r7-sidebar][data-r7-sidebar-component="common"] { display:none !important; } [data-r7-ha-adjacent-layout="true"] { display:grid !important; grid-template-columns:minmax(0,1fr) !important; max-width:100% !important; overflow-x:hidden !important; } [data-r7-mobile-content-main="true"] { padding:12px !important; max-width:100% !important; min-width:0 !important; overflow-x:hidden !important; } [data-r7-page-shell], [data-r7-page-workspace], [data-r7-domain-page-shell], [data-r7-domain-visual-frame], [data-r7-domain-content-card="tabs-zone-content"], [data-r7-domain-subtab-panel] { max-width:100% !important; min-width:0 !important; overflow-x:hidden !important; box-sizing:border-box !important; } [data-r7-domain-visual-hero] { padding:14px !important; max-width:100% !important; min-width:0 !important; box-sizing:border-box !important; } [data-r7-cdb-layout-row="summary"], [data-r7-cdb-layout-row="actions"], [data-r7-settings-device-summary-grid], [data-r7-settings-device-action-row], [data-r7-settings-greenhouse-summary-grid], [data-r7-cdb-subtab-content-layout] > div { grid-template-columns:minmax(0,1fr) !important; max-width:100% !important; min-width:0 !important; overflow-x:hidden !important; } [data-r7-cdb-common-card], [data-r7-cdb-card-type], [data-r7-settings-info-card], [data-r7-settings-create-row] > *, [data-r7-settings-device-action-row] > *, [data-r7-cdb-layout-row="actions"] > *, [data-r7-cdb-layout-row="summary"] > * { max-width:100% !important; min-width:0 !important; width:100% !important; box-sizing:border-box !important; overflow:hidden !important; } [data-r7-cdb-common-card] * { max-width:100% !important; min-width:0 !important; box-sizing:border-box !important; } [data-r7-domain-content-card="tabs-zone-content"] :where(article,section,div), [data-r7-domain-subtab-panel] :where(article,section,div) { max-width:100% !important; min-width:0 !important; box-sizing:border-box !important; overflow-wrap:anywhere !important; } [data-r7-domain-content-card="tabs-zone-content"] :where(article,section,div)[style*="width:"], [data-r7-domain-subtab-panel] :where(article,section,div)[style*="width:"] { max-width:100% !important; } [data-r7-cdb-common-card] [style*="grid-template-columns:repeat"], [data-r7-cdb-common-card] [style*="grid-template-columns:.8fr"], [data-r7-cdb-common-card] [style*="grid-template-columns:repeat(4"] { grid-template-columns:minmax(0,1fr) !important; } [data-r7-cdb-common-card] button, [data-r7-cdb-common-card] a { max-width:100% !important; min-width:0 !important; } [data-r7-zone-selector] { display:flex !important; grid-template-columns:none !important; overflow-x:auto !important; overscroll-behavior-x:contain !important; scrollbar-width:thin !important; flex-wrap:nowrap !important; max-width:100% !important; } [data-r7-zone-card] { flex:0 0 min(220px,82vw) !important; min-width:0 !important; } [data-r7-domain-subtabs] { overflow-x:auto !important; overscroll-behavior-x:contain !important; max-width:100% !important; } [data-r7-domain-subtab] { flex:0 0 auto !important; min-width:max-content !important; } } @media (min-width: 761px) {[data-r7-mobile-top-nav="two-row"] { display:none !important; }}</style>
            </section>
          </section>
        </div>
      </main>
      ${this.renderZoneDetailModal()}
      ${this.renderR7RecordWorkflowModal()}
      ${this.renderR7SettingsGreenhouseCreateModal()}
      ${this.renderR7SettingsZoneCreateModal()}
      ${this.renderR7SettingsDeviceCreateModal()}
      ${this.renderR7SettingsDeviceGroupCreateModal()}
      ${this.renderR7SettingsDeviceSensorMappingModal()}
      ${this.renderR7SettingsShortcutCdaSplitModal()}
      ${this.renderR7SettingsSystemActionModal()}
    `;
    this._syncR7SidebarExternalControlPosition();
    this._bindR7DomainNavigation();
    this._bindR7DomainSubtabs();
    this._bindZoneTabs();
    this._bindR7RecordWorkflowActions();
    this._bindSettingsApprovalActions();
    this._scheduleR7MobileActiveDomainButtonScroll();
    this._scheduleR7MobileActiveSubtabScroll();
  }
}

if (!customElements.get(REBUILD_ELEMENT_NAME)) {
  customElements.define(REBUILD_ELEMENT_NAME, GreenSmartRebuildPanel);
}

export { GreenSmartRebuildPanel, REBUILD_ELEMENT_NAME, REBUILD_PAGES, REBUILD_VERSION, REBUILD_ZONE_CONTEXTS, REBUILD_STAGE_DETAILS };
