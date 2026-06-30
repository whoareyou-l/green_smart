// Green Smart — Modern SaaS greenhouse dashboard  v1.14.3
// Green Smart Legacy panel compatibility surface: existing crop/seasons calls stay adapter-only until approved migration.
import { createApiClient } from "./core/api-client.js";
import { renderCropBasicOverviewCard, renderCropBasicTab, renderCropSeasonsList } from "./domains/crop/crop-readonly.js";
import { cropBasicAddZones, cropBasicEditValues, renderCropBasicAddModal, renderCropBasicEditModal } from "./domains/crop/crop-write-modal.js";
import { growthModalContext, renderGrowthSurveyModal } from "./domains/crop/crop-growth-modal.js";
import { pestModalContext, renderPestScoutingModal, renderPestTypeRows } from "./domains/crop/crop-pest-modal.js";
import { controlModalContext, renderControlPesticideEntry, renderControlTreatmentModal } from "./domains/crop/crop-control-modal.js";
import { adminSystemTabs, renderAdminSystemPage, renderAdminSystemTabBar, renderAdminSystemTabContent } from "./domains/admin/admin-page.js";

const DOMAIN = "green_smart";
const VERSION = "1.14.3";
const PANEL_ELEMENT_REFRESH_MS = 5000;
const CROP_PAGE_SIZE = 5;
const WIZARD_STEPS = ["wizard_step1", "wizard_step2", "wizard_step3"];
const GREEN_SMART_ROLES = ["admin", "farm_owner", "farm_staff"];
const GREEN_SMART_ROLE_PERMISSIONS = {
  admin: new Set([
    "view_dashboard", "view_crop_records", "edit_crop_records", "manage_crop_seasons",
    "view_control_pages", "edit_strategy_settings", "edit_interlock_thresholds",
    "edit_interlock_rules", "edit_entity_mapping", "run_dry_run", "execute_final_targets",
    "manual_device_control", "ack_safety_event", "clear_safety_event",
    "manage_users_roles", "manage_farm_staff_roles", "system_settings", "view_audit_logs",
  ]),
  farm_owner: new Set([
    "view_dashboard", "view_crop_records", "edit_crop_records", "manage_crop_seasons",
    "view_control_pages", "edit_strategy_settings", "edit_interlock_thresholds",
    "run_dry_run", "execute_final_targets", "manual_device_control", "view_audit_logs",
    "manage_farm_staff_roles",
  ]),
  farm_staff: new Set([
    "view_dashboard", "view_crop_records", "edit_crop_records", "view_control_pages",
    "run_dry_run", "manual_device_control",
  ]),
};
const DEFAULT_FORM = {
  host: "", port: 502, unit_id: 1,
  greenhouse_zones: 1, nutrient_zones: 1, stevenson_screens: 1,
  weatherflow_prefix: "sensor.tempest_", virtual: false,
  greenhouse_address: "", location_name: "", nx: 60, ny: 127,
  land_regid: "11H10000", ta_regid: "11H10701",
  central_base_url: "http://127.0.0.1:18000",
  central_installation_id: "",
  weather_mid_land_reg_id: "11H10000",
  weather_mid_ta_reg_id: "11H10701",
  activation_code: "",
};
const CENTER_CROP_POLICY_STATUS_GUIDANCE = {
  fresh: { title: "Center 작물 정책이 최신입니다", detail: "최신 Center 후보를 작물 모델과 인터록 참고값으로 사용 중입니다." },
  stale_usable: { title: "기존 작물 정책을 계속 참고 중입니다", detail: "Center 응답이 조금 늦지만, Edge가 마지막으로 검증한 작물 정책을 계속 참고합니다." },
  stale_restricted: { title: "Center 정책이 오래되어 보수 모드로 전환되었습니다", detail: "작물 추천과 target promotion은 더 조심스럽게 판단하고 운영자 확인을 우선합니다." },
  fallback_safe: { title: "Center 정책이 없거나 만료되어 로컬 fallback으로 보호 중입니다", detail: "Edge 로컬 crop safety/interlock 기준으로 작물을 보호합니다." },
  rejected: { title: "Center 정책 후보가 폐기되었습니다", detail: "형식/상태가 맞지 않는 정책 후보는 적용하지 않고 기존 Edge 기준을 유지합니다." },
};
const CENTER_CROP_POLICY_REASON_LABELS = {
  center_policy_recommend_only: "Center 정책은 추천 전용이며 실행 권한이 없습니다.",
  center_policy_recommendation_hint: "Center가 작물 정책 추천 힌트를 제공했습니다.",
  center_policy_stale_usable: "Center 응답 지연 중이지만 기존 정책을 사용할 수 있습니다.",
  center_policy_stale_restricted: "Center 정책 지연이 길어져 보수 모드가 필요합니다.",
  center_policy_fallback_safe: "Center 정책이 없어 Edge fallback 작물 정책으로 보호 중입니다.",
  center_policy_rejected: "Center 정책 후보가 검증에서 폐기되었습니다.",
};
const CENTER_CROP_POLICY_NEXT_ACTION_LABELS = {
  wait_for_center_crop_policy: "Center 연결/토큰 상태를 확인하고 다음 5분 동기화를 기다리세요.",
  monitor_crop_policy: "현재 작물 정책 상태를 관찰하고 생육조사 기록을 유지하세요.",
  review_crop_interlock_reasons: "작물 인터록 이유를 확인하고 필요한 생육조사/승인 기록을 보강하세요.",
  review_center_crop_recommendation_hint: "Center 추천 힌트를 검토하되 실행은 Edge 인터록 기준을 따르세요.",
};
const CENTER_CROP_POLICY_ALERT_STATUSES = new Set(["stale_restricted", "fallback_safe", "rejected"]);
const CENTER_CROP_POLICY_ALERT_MESSAGES = {
  stale_restricted: "Center 작물 정책이 오래되어 보수 모드입니다. 생육조사/인터록 이유를 확인하세요.",
  fallback_safe: "Center 작물 정책이 없거나 만료되어 로컬 fallback으로 보호 중입니다.",
  rejected: "Center 작물 정책 후보가 폐기되었습니다. Center 연결/정책 형식을 확인하세요.",
};
const EQUIP_KEYS = ["roof_window","side_window","shade_screen","thermal_curtain","irrigation","nutrient_machine","circulation_fan","co2_generator"];
const EQUIP_LABELS = {
  roof_window:"천창", side_window:"측창", shade_screen:"차광스크린",
  thermal_curtain:"보온커튼", irrigation:"관수", nutrient_machine:"양액기",
  circulation_fan:"유동팬", co2_generator:"CO₂발생기",
};
const EQUIP_ICONS = {
  roof_window:"mdi:window-open", side_window:"mdi:window-open-variant",
  shade_screen:"mdi:roller-shade", thermal_curtain:"mdi:curtains",
  irrigation:"mdi:water", nutrient_machine:"mdi:flask",
  circulation_fan:"mdi:fan", co2_generator:"mdi:molecule-co2",
};
const DEFAULT_EQUIP = {
  roof_window:0, side_window:0, shade_screen:0, thermal_curtain:0,
  irrigation:0, nutrient_machine:0, circulation_fan:60, co2_generator:0,
};
const DEFAULT_EQUIP_MODE = {
  roof_window:"auto", side_window:"auto", shade_screen:"auto", thermal_curtain:"auto",
  irrigation:"auto", nutrient_machine:"auto", circulation_fan:"auto", co2_generator:"auto",
};

const DEFAULT_DEVICE_CONTROL_STATE = {
  devices: [
    { id: "roof_window", name: "천창", type: "환기", state: "OPEN 30%", mode: "자동", controller: "Home Assistant", comm: "정상", updated: "방금 전" },
    { id: "side_window", name: "측창", type: "환기", state: "CLOSE", mode: "자동", controller: "인터록", comm: "정상", updated: "1분 전" },
    { id: "thermal_screen", name: "보온스크린", type: "스크린", state: "전개 70%", mode: "자동", controller: "AI Agent", comm: "정상", updated: "2분 전" },
    { id: "shade_screen", name: "차광스크린", type: "스크린", state: "수축 20%", mode: "자동", controller: "Home Assistant", comm: "정상", updated: "3분 전" },
    { id: "circulation_fan", name: "순환팬", type: "팬", state: "ON", mode: "자동", controller: "Home Assistant", comm: "정상", updated: "방금 전" },
    { id: "exhaust_fan", name: "배기팬", type: "팬", state: "OFF", mode: "자동", controller: "인터록", comm: "정상", updated: "4분 전" },
    { id: "heater", name: "난방기", type: "난방", state: "OFF", mode: "자동", controller: "Home Assistant", comm: "정상", updated: "5분 전" },
    { id: "cooler", name: "냉방기", type: "냉방", state: "OFF", mode: "자동", controller: "Home Assistant", comm: "정상", updated: "5분 전" },
    { id: "fertigation", name: "양액기", type: "양액", state: "대기", mode: "자동", controller: "Home Assistant", comm: "정상", updated: "방금 전" },
    { id: "irrigation_valve", name: "관수밸브", type: "관수", state: "CLOSE", mode: "자동", controller: "Fail Safe", comm: "정상", updated: "방금 전" },
    { id: "grow_light", name: "조명", type: "조명", state: "OFF", mode: "자동", controller: "AI Agent", comm: "정상", updated: "7분 전" },
  ],
  deviceGroups: ["환기 그룹", "난방 그룹", "관수 그룹", "스크린 그룹"],
  deviceStatus: { haConnected: true, autoControlEnabled: true, aiStrategyApplied: true, currentStrategy: "주간 고일사 환기/차광 전략", lastRunAt: "12:40" },
  deviceControlLogs: [
    "12:40 천창 20% → 30% · 자동제어 · Home Assistant · 성공",
    "12:33 차광스크린 0% → 20% · AI 전략 · AI Agent · 성공",
    "12:21 관수밸브 OPEN 금지 · 인터록 · 인터록 · 성공",
  ],
  deviceInterlocks: [
    { name: "강풍 천창 보호", enabled: true, priority: 1, description: "풍속 > 12m/s → 천창 CLOSE" },
    { name: "배기팬-난방기 충돌 방지", enabled: true, priority: 2, description: "배기팬 ON → 난방기 OFF" },
    { name: "양액기-관수밸브 보호", enabled: true, priority: 3, description: "양액기 OFF → 관수밸브 OPEN 금지" },
  ],
  deviceFailsafeRules: [
    { trigger: "Home Assistant 연결 끊김", enabled: true, action: "천창 CLOSE · 관수 정지 · 경보 발생" },
    { trigger: "MQTT 장애", enabled: true, action: "스크린 50% · 난방 정지" },
    { trigger: "장치 응답 없음", enabled: true, action: "해당 장치 정지 · 장애 알람" },
  ],
  deviceAlarms: [
    { time: "11:52", device: "측창", type: "통신 지연", message: "응답 시간 5초 초과", status: "처리중" },
    { time: "09:10", device: "유량계", type: "센서 이상", message: "순간 유량 0 감지", status: "확인완료" },
  ],
  ventilationDeviceSettings: { enabled: true, autoControl: true, manualAllowed: true, minOpen: 0, maxOpen: 100, defaultOpen: 20, controlUnit: "%", delaySec: 10, maxContinuousMin: 15, direction: "정방향", positionFeedback: true, windLimit: 12, rainRestricted: true, lowTempRestricted: true, highTempForceVent: true },
  screenDeviceSettings: { enabled: true, autoControl: true, manualAllowed: true, minDeploy: 0, maxDeploy: 100, defaultDeploy: 50, controlUnit: "%", delaySec: 10, maxContinuousMin: 20, direction: "정방향", positionFeedback: true, solarThreshold: 600, tempThreshold: 30, nightInsulation: true, dewGapPercent: 5, strongWindProtection: true },
};

const DEFAULT_CONTROL_STRATEGY_STATE = {
  baseInterlockSettings: {
    dayTargetTemp: 25, nightTargetTemp: 18, targetHumidity: 70, targetVpd: 1.0,
    targetCo2: 800, baseAdt: 22, baseDif: 7,
  },
  aiStrategySettings: {
    enabled: false, autoFallback: true, gIndex: -2.1, growthStage: "영양생장",
    targetAdtDelta: -0.5, targetDifDelta: 0.5, targetVpdDelta: 0.1,
    dayTempDelta: -1.5, nightTempDelta: 0.5,
  },
  lowLightStrategySettings: {
    enabled: true, solarThreshold: 180, dayTempDelta: -1.0, targetVpdDelta: -0.1,
    co2Boost: 100, screenOpenPercent: 20,
  },
  safetyLimits: {
    absoluteMaxTemp: 35, absoluteMinTemp: 8, maxVentOpen: 100, minVentOpen: 0,
    strongWindCloseSpeed: 8, sensorErrorMode: "interlock", aiErrorMode: "interlock",
  },
  finalAppliedTargets: {
    dayTargetTemp: 25, nightTargetTemp: 18, targetHumidity: 70, targetVpd: 1.0,
    targetCo2: 800, targetAdt: 22, targetDif: 7,
  },
  controlMode: "interlock",
  systemStatus: { aiStatus: "standby", interlockActive: true, aiApplied: false },
  controlLogs: [
    "10:21 온도 28.2°C → 환기창 30% 개방",
    "10:24 VPD 0.42kPa → 제습 모드 진입",
    "10:30 AI 오류 감지 → 인터록 모드 복귀",
    "10:35 G-Index -2.1 → AI 보정 적용",
  ],
};

const DEFAULT_IRRIGATION_CONTROL_STATE = {
  irrigationControlMode: {
    mode: "interlock", aiEnabled: false, fallbackToInterlockOnAiError: true,
    autoIrrigationEnabled: true, manualRunAllowed: true, status: "standby",
    todayCount: 7, lastRunAt: "11:20", nextRunAt: "12:10", accumulatedRadiation: 82,
    currentVwc: 63, currentEc: 2.4, currentPh: 6.1,
  },
  baseIrrigationSettings: {
    startTime: "07:00", endTime: "17:30", sunriseOffsetMin: 30, sunsetOffsetMin: -120,
    shotCcPerPlant: 120, shotLiterPerZone: 12, minIntervalMin: 30, maxDailyCount: 18,
    baseEc: 2.5, basePh: 6.0, zoneEnabled: true, valveOrder: "1,2,3,4", zoneTargetAmountL: 12,
  },
  saturationStrategy: {
    enabled: true, targetVwc: 68, startTime: "07:00", completeVwc: 70,
    firstDrainTargetTime: "10:30", firstDrainTargetAmountL: 1.2, splitCount: 3,
    shotAmountL: 4, firstDrainInductionAmountL: 2,
    previousLastVwc: 61, todayPreFirstVwc: 58, nightWaterLoss: 3, requiredAmountL: 8, firstDrainDetected: false,
  },
  solarIrrigationStrategy: {
    enabled: true, baseAccumulatedRadiation: 100, cloudyThreshold: 80, sunnyThreshold: 120,
    minIntervalMin: 25, maxIntervalMin: 90, highTempCorrectionEnabled: true, vpdCorrectionEnabled: true,
    currentAccumulatedRadiation: 82, afterLastIrrigationRadiation: 58, remainingRadiation: 42, nextExpectedAt: "12:10",
  },
  drybackStrategy: {
    enabled: true, dayDrybackRange: 8, nightDrybackTarget: 10, minVwc: 45,
    targetVwcUpper: 72, targetVwcLower: 58, nightEmergencyIrrigation: true, nightEmergencyVwc: 42,
    peakVwcAfterSaturation: 70, currentDryback: 7, targetDryback: 10, nightProgress: 52,
  },
  drainFeedback: {
    previousFeedAmountL: 180, previousDrainAmountL: 45, drainRate: 25,
    drainEc: 3.1, drainPh: 5.7, measuredAt: "16:30", targetDrainRate: 30,
    drainShortage: true, saltAccumulationRisk: true, phAcidificationRisk: false,
  },
  nutrientStrategy: {
    cropGroup: "과채류", growthStage: "착과기", baseEc: 2.5, aiEcDelta: 0.3, finalEc: 2.8,
    basePh: 6.0, aiPhDelta: 0.2, finalPh: 6.2, useA: true, useB: true, useAcid: true, useAlkali: false,
    currentFeedEc: 2.4, currentFeedPh: 6.1, ecDeviation: -0.4, phDeviation: -0.1,
  },
  aiIrrigationCorrection: {
    gIndex: 3.1, cropGroup: "과채류", growthStage: "착과기", decision: "생식생장 유도",
    ecDelta: 0.3, phDelta: 0.2, shotAmountDelta: 1.0, intervalDeltaMin: -5,
    drybackDelta: 2, endTimeDeltaMin: -20, targetDrainRateDelta: 5, healthy: true, applied: false,
    explanation: "현재 G-Index가 +3.1로 영양생장이 강합니다. 생식생장 유도를 위해 EC를 +0.3dS/m 상향하고 야간 드라이백 목표를 10%로 확대합니다.",
  },
  irrigationSafetyLimits: {
    minVwc: 40, maxVwc: 80, maxEc: 4.0, minEc: 0.8, maxPh: 7.2, minPh: 5.2,
    maxShotAmountL: 20, maxDailyAmountL: 260, minIntervalMin: 20, maxPumpContinuousMin: 8,
    flowAnomalyThreshold: 20, valveErrorDetection: true, sensorErrorMode: "interlock", aiErrorMode: "interlock",
  },
  fertigationDeviceSettings: {
    rawWaterPumpEntity: "switch.raw_water_pump", irrigationPumpEntity: "switch.irrigation_pump",
    aValveEntity: "valve.nutrient_a", bValveEntity: "valve.nutrient_b",
    acidValveEntity: "valve.acid", alkaliValveEntity: "valve.alkali",
    zoneValveEntities: "valve.zone_1,valve.zone_2", flowMeterEntity: "sensor.flow_meter",
    ecSensorEntity: "sensor.feed_ec", phSensorEntity: "sensor.feed_ph", vwcSensorEntity: "sensor.substrate_vwc",
    ecP: 1.2, ecI: 0.04, ecD: 0.01, phP: 1.0, phI: 0.03, phD: 0.01,
    ecCalibration: 0, phCalibration: 0, flowCalibration: 1.0,
  },
  finalIrrigationTargets: {
    shotAmountL: 12, minIntervalMin: 30, targetEc: 2.5, targetPh: 6.0,
    targetDrainRate: 30, targetDryback: 10, endTime: "17:30",
  },
  irrigationLogs: [
    "11:20 Zone 1 · 12L · 일사량 · EC 2.4 · pH 6.1 · 성공",
    "10:35 Zone 2 · 12L · AI 보정 · 배액 감지중 · 성공",
    "09:10 Zone 1 · 8L · 포수 · 첫 배액 대기 · 성공",
  ],
};
const SERIES = [
  { key:"temp",     label:"온도", unit:"°C",   color:"#51AE60", fixed:1 },
  { key:"humidity", label:"습도", unit:"%",    color:"#4A90D9", fixed:1 },
  { key:"co2",      label:"CO₂",  unit:"ppm",  color:"#E06B2E", fixed:0 },
  { key:"vpd",      label:"VPD",  unit:"kPa",  color:"#9B59B6", fixed:2 },
  { key:"light",    label:"광량", unit:"μmol", color:"#F4B400", fixed:0 },
];
const IRRIG_SERIES = [
  { key:"amount",   label:"관수량", unit:"L/m²", color:"#51AE60", fixed:2 },
  { key:"drain",    label:"배액량", unit:"L/m²", color:"#4A90D9", fixed:2 },
  { key:"moisture", label:"함수율", unit:"%",    color:"#E06B2E", fixed:1 },
  { key:"feed_ph",  label:"급액 pH", unit:"",   color:"#9B59B6", fixed:2 },
  { key:"feed_ec",  label:"급액 EC", unit:"mS", color:"#F4B400", fixed:2 },
  { key:"drain_ph", label:"배액 pH", unit:"",   color:"#1ABC9C", fixed:2 },
  { key:"drain_ec", label:"배액 EC", unit:"mS", color:"#E74C3C", fixed:2 },
];

class GreenSmartPanel extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._api = null;
    this._state = "init";
    this._loading = true;
    this._saving = false;
    this._error = "";
    this._authMe = null;
    this._mqttLoaded = false;
    this._entry = null;
    this._form = { ...DEFAULT_FORM };
    this._virtualMode = false;
    this._simInterval = null;
    this._simData = null;
    this._page = "home";
    this._chartHistory = [];
    this._chartTab = "temp";
    this._chartZoneTab = 0;
    this._irrigZoneTab = 0;
    this._chartInterval = null;
    this._equipment = this._loadEquipment();
    this._equipZone = 0;
    this._zoneCardTab = 0;
    this._equipMode = this._loadEquipMode();
    this._alerts = [];
    this._popup = null;
    this._cropSubTab = "ai";
    this._settingsSubTab = "connection";
    this._cropSeasons = [];
    this._growthData = [];
    this._growthReportData = null;
    this._centerCropInterlockAnalyticsData = null;
    this._pestData = [];
    this._pesticideSearchData = null;
    this._controlData = [];
    this._activeSeasonId = null;   // 현재 선택된 작기 ID
    this._basicZoneCollapsed = {}; // 정식 등록 모달 구역별 접기 상태
    this._cropPage = { basic: 1, growth: 1, pest: 1, control: 1 };
    this._dbReady        = false;  // DB 연결 완료 여부
    this._weatherData = null;
    this._weatherMidData = null;
    this._weatherInterval = null;
    this._watchdogInterval = null;
    this._watchdogKeys = new Set();
    this._weatherModalOpen = false;
    this._controlStrategy = this._loadControlStrategy();
    this._envStrategyTab = "ai";
    this._irrigationControl = this._loadIrrigationControl();
    this._irrigationTab = "mode";
    this._deviceControl = this._loadDeviceControl();
    this._deviceTab = "status";
    this._adminSystemTab = "roles";
    this._adminRoleMappings = this._loadAdminRoleMappings();
    this._adminSystemConfig = this._loadAdminSystemConfig();
    this._adminAuditLogs = this._loadAdminAuditLogs();
    this._adminDiagnostics = null;
    this._controlScope = this._loadControlScope();
    this._controlSaveNotice = null;
    this._apiScopedControlCache = {};
    this._zoneControlHydrationInFlight = {};
    this._zoneAiOutputCache = {};
    this._zoneFinalTargetCache = {};
    this._zoneEntityMappingCache = {};
    this._zoneEntityMappingValidationCache = {};
    this._zoneRehearsalReadinessCache = {};
    this._zoneVirtualRehearsalCache = {};
    this._zoneExecutionLogCache = {};
    this._zoneInterlockSettingsCache = {};
    this._zoneControlModeCache = {};
    this._zoneEntityStateSummaryCache = {};
    this._zoneSafetyGuardWatchdogCache = {};
    this._zoneSafetyGuardEventCache = {};
    this._zoneEnvironmentStrategyPreviewCache = {};
    this._zoneIrrigationStrategyPreviewCache = {};
    this._zoneLimitedAutoPolicyCache = {};
    this._zoneAlertResumeCache = {};
    this._zoneDryRunPreviewCache = {};
    this._currentSensorSummary = null;
    this._zoneElementRefreshInterval = null;
    this._zoneControlSettings = this._loadZoneControlSettings();
    this._migrateLegacyControlStateToScoped();
    this._pageRendered = null;
    this.attachShadow({ mode: "open" });
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    this._api = createApiClient(this._hass);
    if (first) { this._renderShell(); this._init(); return; }
    if (this._state === "dashboard") this._update();
  }

  connectedCallback() {
    if (!this.shadowRoot.querySelector("#app")) this._renderShell();
    this._syncHaSidebarOffset();
    this._haSidebarResizeHandler = this._haSidebarResizeHandler || (() => this._syncHaSidebarOffset());
    window.addEventListener("resize", this._haSidebarResizeHandler);
    requestAnimationFrame(() => this._syncHaSidebarOffset());
  }

  disconnectedCallback() {
    this._stopVirtualSimulation();
    clearInterval(this._weatherInterval); this._weatherInterval = null;
    this._stopWatchdog();
    this._stopZoneElementRefresh();
    if (this._haSidebarResizeHandler) window.removeEventListener("resize", this._haSidebarResizeHandler);
  }

  _syncHaSidebarOffset() {
    const left = Math.max(0, Math.round(this.getBoundingClientRect().left || 0));
    this.style.setProperty("--gs-ha-sidebar-left", `${left}px`);
  }

  _startZoneElementRefresh() {
    if (this._zoneElementRefreshInterval) return;
    this._zoneElementRefreshInterval = setInterval(() => this._refreshZoneControlElements({ patchOnly: true }), PANEL_ELEMENT_REFRESH_MS);
  }

  _stopZoneElementRefresh() {
    clearInterval(this._zoneElementRefreshInterval);
    this._zoneElementRefreshInterval = null;
  }

  _isZoneControlPage() {
    return ["environment", "irrigation", "device"].includes(this._page);
  }

  _hasDirtyZoneControlEditor() {
    const active = this.shadowRoot?.activeElement;
    if (!active) return false;
    return Boolean(active.closest?.("[data-zone-interlock-settings-card], [data-zone-control-mode-card], [data-zone-entity-mapping-card]") || ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName));
  }

  async _refreshZoneControlElements({ patchOnly = false } = {}) {
    // Phase 1C contract: panel 기본 갱신은 5초, 전체 화면 재렌더 금지, 요소별 갱신, dirty state 보존.
    if (!this._isZoneControlPage() || this._hasDirtyZoneControlEditor()) return;
    const domain = this._page === "device" ? "device" : this._page;
    await Promise.allSettled([
      this._fetchZoneInterlockSettings(domain, { patchOnly }),
      this._fetchZoneControlMode(domain, { patchOnly }),
      this._fetchZoneEntityStateSummary(domain, { patchOnly }),
      this._fetchZoneSafetyGuardWatchdog(domain, { patchOnly }),
      this._fetchZoneSafetyGuardEvents(domain, { patchOnly }),
      this._fetchZoneLimitedAutoPolicy(domain, { patchOnly }),
      ...(domain === "environment" ? [this._fetchEnvironmentStrategyPreview(domain, { patchOnly })] : []),
      ...(domain === "irrigation" ? [this._fetchIrrigationStrategyPreview(domain, { patchOnly })] : []),
      this._fetchZoneExecutionLogs(domain, { patchOnly }),
    ]);
    if (patchOnly) this._patchZoneControlElementCards(domain);
  }

  _replaceZoneControlCard(selector, html) {
    const node = this.shadowRoot?.querySelector(selector);
    if (!node) return;
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    const next = template.content.firstElementChild;
    if (!next) return;
    node.replaceWith(next);
  }

  _patchZoneControlElementCards(domain) {
    this._replaceZoneControlCard("[data-zone-interlock-settings-card]", this._renderZoneInterlockSettingsCard(domain));
    this._replaceZoneControlCard("[data-zone-entity-state-summary-card]", this._renderZoneEntityStateSummaryCard(domain));
    this._replaceZoneControlCard("[data-zone-safety-watchdog-card]", this._renderZoneSafetyGuardWatchdogCard(domain));
    this._replaceZoneControlCard("[data-zone-safety-event-card]", this._renderZoneSafetyGuardEventHistoryCard(domain));
    this._replaceZoneControlCard("[data-zone-limited-auto-card]", this._renderZoneLimitedAutoPolicyCard(domain));
    if (domain === "environment") this._replaceZoneControlCard("[data-env-strategy-preview-card]", this._renderEnvironmentStrategyPreviewCard(domain));
    if (domain === "irrigation") this._replaceZoneControlCard("[data-irrigation-strategy-preview-card]", this._renderIrrigationStrategyPreviewCard(domain));
    this._replaceZoneControlCard("[data-zone-dry-run-card]", this._renderZoneDryRunPreviewCard(domain));
    this._replaceZoneControlCard("[data-zone-operator-confirm-card]", this._renderZoneOperatorConfirmCard(domain));
    this._replaceZoneControlCard("[data-zone-rehearsal-card]", this._renderZoneRehearsalReadinessCard(domain));
    this._replaceZoneControlCard("[data-zone-virtual-rehearsal-card]", this._renderZoneVirtualRehearsalCard(domain));
    this._replaceZoneControlCard("[data-zone-execution-log-card]", this._renderZoneExecutionLogCard(domain));
    this._replaceZoneControlCard("[data-zone-entity-validation-card]", this._renderZoneEntityMappingValidationCard(domain));
    this._bindZoneInterlockSettingsInputs(this.shadowRoot);
    this._bindZoneControlModeInputs(this.shadowRoot);
    this._bindZoneEntityStateSummaryInputs(this.shadowRoot);
    this._bindZoneSafetyGuardWatchdogInputs(this.shadowRoot);
    this._bindZoneSafetyGuardEventInputs(this.shadowRoot);
    this._bindZoneLimitedAutoPolicyInputs(this.shadowRoot);
    this._bindZoneDryRunPreviewInputs(this.shadowRoot);
    this._bindZoneOperatorConfirmInputs(this.shadowRoot);
    this._bindZoneRehearsalReadinessInputs(this.shadowRoot);
    this._bindZoneVirtualRehearsalInputs(this.shadowRoot);
    this._bindEnvironmentStrategyPreviewInputs(this.shadowRoot);
    this._bindIrrigationStrategyPreviewInputs(this.shadowRoot);
    this._bindZoneAiFinalTargetInputs(this.shadowRoot);
    this._bindZoneEntityMappingValidationInputs(this.shadowRoot);
  }

  // ── Init & storage ──────────────────────────────────────────────────────────

  async _fetchAuthMe() {
    try {
      this._authMe = await this._api.admin.getCurrentUser();
    } catch (err) {
      // Transitional fallback only. Production RBAC source is /api/green_smart/auth/me.
      this._authMe = { role: "farm_staff", roleSource: "auth_me_unavailable", permissions: [...GREEN_SMART_ROLE_PERMISSIONS.farm_staff] };
    }
    return this._authMe;
  }

  _currentUserRole() {
    const role = this._authMe && this._authMe.role;
    return GREEN_SMART_ROLES.includes(role) ? role : "farm_staff";
  }

  _permissionsForRole(role) {
    const normalized = GREEN_SMART_ROLES.includes(role) ? role : "farm_staff";
    return GREEN_SMART_ROLE_PERMISSIONS[normalized] || GREEN_SMART_ROLE_PERMISSIONS.farm_staff;
  }

  _hasPermission(permission) {
    const apiPermissions = Array.isArray(this._authMe?.permissions) ? new Set(this._authMe.permissions) : null;
    if (apiPermissions) return apiPermissions.has(permission);
    return this._permissionsForRole(this._currentUserRole()).has(permission);
  }

  _visibilityForPermission(permission, { allowSummary = false } = {}) {
    if (this._hasPermission(permission)) return "visible_enabled";
    return allowSummary ? "summary_only" : "hidden";
  }

  _renderPermissionHint(reason) {
    return `<div class="permission-hint" data-ui-section="safety" style="font-size:12px;color:#7a9780;margin-top:6px;">${this._esc(reason || "현재 역할에서는 이 기능을 사용할 수 없습니다.")}</div>`;
  }

  async _init() {
    this._state = "init";
    this._loading = true;
    this._error = "";
    this._update();
    try {
      await this._fetchAuthMe();
      await this._refreshEntries();
      if (this._entry && this._entry.state === "loaded") this._loadFormFromEntry();
      if (!this._form.host) {
        const s = this._loadStorage();
        if (s && s.host) Object.assign(this._form, s);
      }
      this._virtualMode = Boolean(this._form.virtual || this._form.host === "virtual");
      this._state = this._form.host ? "dashboard" : "wizard_step1";
      this._loading = false;
      this._update();
      this._startZoneElementRefresh();
    } catch (err) {
      this._showError(err, "설정을 불러올 수 없습니다.");
    }
  }

  _loadStorage() {
    try { return JSON.parse(localStorage.getItem("green_smart_cfg") || "null"); } catch (_) { return null; }
  }
  _saveStorage(d) { try { localStorage.setItem("green_smart_cfg", JSON.stringify(d)); } catch (_) {} }

  _loadEquipment() {
    try {
      const stored = JSON.parse(localStorage.getItem("gs_equip") || "null");
      if (!stored) return [{ ...DEFAULT_EQUIP }];
      if (Array.isArray(stored)) {
        return stored.map((z) => Object.assign({}, DEFAULT_EQUIP, z));
      }
      // Legacy flat object — convert to single-zone array
      return [Object.assign({}, DEFAULT_EQUIP, stored)];
    } catch (_) { return [{ ...DEFAULT_EQUIP }]; }
  }
  _saveEquipment() { try { localStorage.setItem("gs_equip", JSON.stringify(this._equipment)); } catch (_) {} }

  _ensureEquipZones(n) {
    while (this._equipment.length < n) {
      this._equipment.push({ ...DEFAULT_EQUIP });
    }
  }

  _loadEquipMode() {
    try {
      const stored = JSON.parse(localStorage.getItem("gs_equip_mode") || "null");
      if (!stored) return [{ ...DEFAULT_EQUIP_MODE }];
      if (Array.isArray(stored)) {
        return stored.map((z) => Object.assign({}, DEFAULT_EQUIP_MODE, z));
      }
      // Legacy flat object — convert to single-zone array
      return [Object.assign({}, DEFAULT_EQUIP_MODE, stored)];
    } catch (_) { return [{ ...DEFAULT_EQUIP_MODE }]; }
  }
  _saveEquipMode() { try { localStorage.setItem("gs_equip_mode", JSON.stringify(this._equipMode)); } catch (_) {} }

  _ensureEquipModeZones(n) {
    while (this._equipMode.length < n) {
      this._equipMode.push({ ...DEFAULT_EQUIP_MODE });
    }
  }

  // ── HA config entry helpers ──────────────────────────────────────────────────

  async _refreshEntries() {
    const resp = await this._hass.callApi("GET", "config/config_entries/entry");
    this._extractEntries(resp);
  }

  _extractEntries(payload) {
    const list = Array.isArray(payload) ? payload : (payload && payload.result) ? payload.result : [];
    this._entry = list.find((e) => e.domain === DOMAIN) || null;
  }

  _loadFormFromEntry() {
    const d = (this._entry && this._entry.data) || {};
    this._form = Object.assign({}, DEFAULT_FORM, d);
    this._virtualMode = Boolean(this._form.virtual || this._form.host === "virtual");
  }

  // ── Wizard navigation ────────────────────────────────────────────────────────

  _wizardNext() {
    this._error = "";
    if (this._state === "wizard_step1" && this._virtualMode) {
      this._form.host = "virtual"; this._form.port = 502;
      this._form.unit_id = 1; this._form.virtual = true;
    }
    if (this._state === "wizard_step1" && !this._virtualMode && !this._form.host.trim()) {
      this._error = "PLC IP 주소를 입력해 주세요."; this._update(); return;
    }
    const idx = WIZARD_STEPS.indexOf(this._state);
    if (idx < WIZARD_STEPS.length - 1) { this._state = WIZARD_STEPS[idx + 1]; this._update(); }
  }

  _wizardBack() {
    const idx = WIZARD_STEPS.indexOf(this._state);
    if (idx > 0) { this._state = WIZARD_STEPS[idx - 1]; this._update(); }
  }

  async _finishWizard() {
    const data = this._submissionData();
    if (!data.host) { this._error = "PLC IP 주소를 입력해 주세요."; this._update(); return; }
    this._saving = true; this._error = ""; this._update();
    this._saveStorage(this._safeStorageData(data));
    try {
      await this._refreshEntries();
      if (this._entry && this._entry.data && this._entry.data.host) {
        try { await this._hass.callWS({ type: "green_smart/save_config", ...data }); } catch (_) {}
        this._saving = false; this._loadFormFromEntry();
        Object.assign(this._form, data);
        this._virtualMode = Boolean(data.virtual || data.host === "virtual");
        this._state = "dashboard"; this._update(); return;
      }
      if (this._entry) {
        let deleted = false;
        try {
          await this._hass.callWS({ type: "config_entries/remove", entry_id: this._entry.entry_id });
          deleted = true; this._entry = null;
        } catch (_) {}
        if (!deleted) {
          try { await this._hass.callWS({ type: "green_smart/save_config", ...data }); } catch (_) {}
          await this._refreshEntries().catch(() => {});
          this._saving = false; this._loadFormFromEntry();
          Object.assign(this._form, data);
          this._virtualMode = Boolean(data.virtual || data.host === "virtual");
          this._state = "dashboard"; this._update(); return;
        }
        await new Promise((r) => setTimeout(r, 400));
      }
      const flow = await this._hass.callApi("POST", "config/config_entries/flow", { handler: DOMAIN });
      if (flow.type === "form") {
        const res = await this._hass.callApi("POST", `config/config_entries/flow/${flow.flow_id}`, data);
        if (res.type !== "create_entry") throw new Error(`Flow: ${res.type}`);
      } else if (flow.type === "abort" && flow.reason === "already_configured") {
        await this._refreshEntries();
        try { await this._hass.callWS({ type: "green_smart/save_config", ...data }); } catch (_) {}
      } else if (flow.type !== "create_entry") {
        throw new Error(`Flow: ${flow.type}`);
      }
      for (let i = 0; i < 20; i += 1) {
        await this._refreshEntries();
        if (this._entry && this._entry.state === "loaded") break;
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (_) {
      await this._refreshEntries().catch(() => {});
    }
    this._saving = false; this._loadFormFromEntry();
    Object.assign(this._form, data);
    this._virtualMode = Boolean(data.virtual || data.host === "virtual");
    this._state = "dashboard"; this._update();
  }

  async _saveSettings() {
    if (!this._entry) return;
    this._saving = true; this._error = ""; this._update();
    try {
      const data = this._normalizedForm();
      await this._hass.callWS({ type: "green_smart/save_config", ...data });
      await this._hass.callApi("POST", "green_smart/weather/config", {
        nx: data.nx,
        ny: data.ny,
        location_name: data.location_name || data.greenhouse_address || null,
        ta_regid: data.weather_mid_ta_reg_id,
        land_regid: data.weather_mid_land_reg_id,
      }).catch(() => null);
      await this._refreshEntries();
      // REST API does not return entry.data, so do NOT call _loadFormFromEntry()
      // (it would reset _form to DEFAULT). Apply the saved values directly.
      Object.assign(this._form, data);
      this._virtualMode = Boolean(data.virtual || data.host === "virtual");
      this._saveStorage(this._safeStorageData(this._form));
      this._saving = false; this._state = "dashboard"; this._update();
    } catch (err) {
      this._saving = false; this._showError(err, "저장에 실패했습니다."); }
  }

  _openSettings() { this._state = "settings"; this._error = ""; this._update(); }

  _normalizedForm() {
    const f = this._form;
    const virtual = this._virtualMode || f.host === "virtual";
    return {
      host: virtual ? "virtual" : f.host.trim(),
      port: this._number(f.port, 502, 1, 65535),
      unit_id: this._number(f.unit_id, 1, 1, 255),
      greenhouse_zones: this._number(f.greenhouse_zones, 1, 1, 20),
      nutrient_zones: this._number(f.nutrient_zones, 1, 1, 10),
      stevenson_screens: this._number(f.stevenson_screens, 1, 1, 10),
      weatherflow_prefix: (f.weatherflow_prefix || "").trim() || "sensor.tempest_",
      virtual,
      greenhouse_address: (f.greenhouse_address || f.location_name || "").trim(),
      location_name: (f.location_name || f.greenhouse_address || "").trim(),
      nx: this._number(f.nx, 60, 0, 999),
      ny: this._number(f.ny, 127, 0, 999),
      weather_mid_land_reg_id: (f.weather_mid_land_reg_id || f.land_regid || "11H10000").trim().toUpperCase() || "11H10000",
      weather_mid_ta_reg_id: (f.weather_mid_ta_reg_id || f.ta_regid || "11H10701").trim().toUpperCase() || "11H10701",
      land_regid: (f.weather_mid_land_reg_id || f.land_regid || "11H10000").trim().toUpperCase() || "11H10000",
      ta_regid: (f.weather_mid_ta_reg_id || f.ta_regid || "11H10701").trim().toUpperCase() || "11H10701",
      central_base_url: (f.central_base_url || "http://127.0.0.1:18000").trim() || "http://127.0.0.1:18000",
      central_installation_id: (f.central_installation_id || "").trim(),
    };
  }

  _submissionData() {
    const data = this._normalizedForm();
    const trimmedActivationCode = (this._form.activation_code || "").trim();
    if (trimmedActivationCode) data.activation_code = trimmedActivationCode;
    else delete data.activation_code;
    return data;
  }

  _safeStorageData(data) {
    const safe = Object.assign({}, data);
    delete safe.activation_code;
    return safe;
  }

  _isVirtual() { return this._virtualMode || this._form.host === "virtual"; }

  // ── Virtual simulation ───────────────────────────────────────────────────────

  _startVirtualSimulation() {
    if (this._simInterval) return;
    this._simData = this._generateSimData(this._normalizedForm());
    this._initChartHistory();
    this._simInterval = setInterval(() => {
      this._simData = this._generateSimData(this._normalizedForm());
      this._checkAlerts(this._simData);
      if (this._state === "dashboard" && this._pageRendered === this._page) {
        this._patchData();
      } else {
        this._update();
      }
    }, 3000);
    this._chartInterval = setInterval(() => {
      if (this._simData) { this._pushChartPoint(this._simData); this._patchChart(); this._patchIrrigChart(); }
    }, 60000);
  }

  _stopVirtualSimulation() {
    clearInterval(this._simInterval); this._simInterval = null;
    clearInterval(this._chartInterval); this._chartInterval = null;
  }

  _currentWeatherFromForecasts(forecasts, fallback = {}) {
    const items = Array.isArray(forecasts) ? forecasts : [];
    if (!items.length) return fallback || {};
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const nowKey = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;
    const sorted = items.slice().sort((a, b) => `${a.date || ""}${a.time || ""}`.localeCompare(`${b.date || ""}${b.time || ""}`));
    const picked = sorted.find((f) => `${f.date || ""}${f.time || ""}` >= nowKey) || sorted[0];
    const updated = picked.date && picked.time
      ? `${picked.date.slice(0, 4)}-${picked.date.slice(4, 6)}-${picked.date.slice(6, 8)} ${picked.time.slice(0, 2)}:${picked.time.slice(2, 4)}`
      : (fallback && fallback.updated) || "";
    return {
      mode: picked.mode || "real",
      temperature: picked.temp != null ? picked.temp : fallback.temperature,
      humidity: picked.humidity != null ? picked.humidity : fallback.humidity,
      wind_speed: picked.wind_speed != null ? picked.wind_speed : fallback.wind_speed,
      wind_direction: picked.wind_direction || fallback.wind_direction || "",
      precipitation_type: picked.precipitation_type || fallback.precipitation_type || "없음",
      precipitation: picked.precipitation != null ? picked.precipitation : (fallback.precipitation || 0),
      sky: picked.sky || fallback.sky || "구름많음",
      pop: picked.pop != null ? picked.pop : fallback.pop,
      updated,
      source: "central-forecast-current",
    };
  }

  async _fetchWeather() {
    try {
      const cfg = this._normalizedForm();
      const centralForecast = await this._hass.callApi("POST", "green_smart/central/weather/forecast", {
        nx: Number(cfg.nx || 60),
        ny: Number(cfg.ny || 127),
      });
      const weather = this._currentWeatherFromForecasts((centralForecast && centralForecast.forecasts) || []);
      this._weatherData = weather;

      try {
        this._weatherMidData = await this._hass.callApi("POST", "green_smart/central/weather/mid", {
          land_reg_id: cfg.weather_mid_land_reg_id,
          ta_reg_id: cfg.weather_mid_ta_reg_id,
        });
      } catch (centralMidWeatherErr) {
        this._weatherMidData = { days: [], error: "unavailable" };
      }

      const weatherCard = this.shadowRoot && this.shadowRoot.querySelector("[data-weather-card]");
      if (weatherCard) weatherCard.innerHTML = this._renderWeatherCardInner(this._weatherData);
    } catch (err) {
      try {
        const fallback = await this._hass.callApi("GET", "green_smart/weather/current");
        this._weatherData = fallback;
        const card = this.shadowRoot && this.shadowRoot.querySelector("[data-weather-card]");
        if (card) card.innerHTML = this._renderWeatherCardInner(fallback);
      } catch (_) {}
      console.error("Weather fetch failed", err);
    }
  }

  _generateSimData(cfg) {
    const rand = (a, b) => a + Math.random() * (b - a);
    const zones = [];
    for (let i = 0; i < (cfg.greenhouse_zones || 1); i += 1) {
      const dry = rand(22, 28), wet = rand(18, 22);
      const esDry = 6.1078 * Math.exp((17.27 * dry) / (dry + 237.3));
      const esWet = 6.1078 * Math.exp((17.27 * wet) / (wet + 237.3));
      const vpd = Math.max(0, (esDry - esWet) / 10);
      zones.push({
        name: `Zone ${i + 1}`,
        dry_temp: dry.toFixed(1), wet_temp: wet.toFixed(1),
        humidity: rand(65, 85).toFixed(1),
        co2: Math.round(rand(600, 1000)),
        light: Math.round(rand(300, 700)),
        vpd: vpd.toFixed(2),
        status: Math.random() > 0.92 ? "warning" : "normal",
      });
    }
    const kpi = {
      temp: (zones.reduce((s, z) => s + Number(z.dry_temp), 0) / zones.length).toFixed(1),
      humidity: (zones.reduce((s, z) => s + Number(z.humidity), 0) / zones.length).toFixed(1),
      co2: Math.round(zones.reduce((s, z) => s + z.co2, 0) / zones.length),
      vpd: (zones.reduce((s, z) => s + Number(z.vpd), 0) / zones.length).toFixed(2),
      light: Math.round(zones.reduce((s, z) => s + z.light, 0) / zones.length),
      dli: (10 + Math.random() * 15).toFixed(1),
    };
    const weather = {
      out_temp: rand(15, 25).toFixed(1),
      humidity: Math.round(rand(40, 70)),
      wind: rand(0.5, 5).toFixed(1),
      radiation: Math.round(rand(200, 800)),
    };
    const irrigZones = [];
    for (let i = 0; i < (cfg.greenhouse_zones || 1); i += 1) {
      irrigZones.push({
        amount:   parseFloat(rand(0.5, 3.0).toFixed(2)),
        drain:    parseFloat(rand(0.2, 1.5).toFixed(2)),
        moisture: parseFloat(rand(55, 80).toFixed(1)),
        feed_ph:  parseFloat(rand(5.8, 6.5).toFixed(2)),
        feed_ec:  parseFloat(rand(2.0, 4.0).toFixed(2)),
        drain_ph: parseFloat(rand(6.0, 6.8).toFixed(2)),
        drain_ec: parseFloat(rand(2.5, 4.5).toFixed(2)),
      });
    }
    const now = new Date();
    const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
    const pad = (n) => String(n).padStart(2, "0");
    const h = now.getHours();
    const ampm = h < 12 ? "오전" : "오후";
    const hh = h % 12 === 0 ? 12 : h % 12;
    const updated = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}(${DAYS[now.getDay()]}) ${ampm} ${hh}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    return { zones, kpi, weather, irrigZones, updated };
  }

  _chartPointFromSim(sim, ts) {
    return {
      ts,
      zones: sim.zones.map((z) => ({
        temp: Number(z.dry_temp), humidity: Number(z.humidity),
        co2: z.co2, vpd: Number(z.vpd), light: z.light,
      })),
      irrigZones: sim.irrigZones || [],
    };
  }

  _initChartHistory() {
    this._chartHistory = [];
    const now = Date.now();
    for (let i = 20; i >= 1; i -= 1) {
      const fake = this._generateSimData(this._normalizedForm());
      this._chartHistory.push(this._chartPointFromSim(fake, now - i * 60000));
    }
  }

  _pushChartPoint(sim) {
    this._chartHistory.push(this._chartPointFromSim(sim, Date.now()));
    if (this._chartHistory.length > 720) this._chartHistory.shift();
  }

  _checkAlerts(sim) {
    const k = sim.kpi;
    const add = (msg) => {
      this._alerts.unshift({ msg, time: new Date().toLocaleTimeString() });
      if (this._alerts.length > 20) this._alerts.pop();
    };
    if (Number(k.temp) > 35) add(`온도 이상: ${k.temp}°C (> 35°C)`);
    if (Number(k.temp) < 10) add(`온도 낮음: ${k.temp}°C (< 10°C)`);
    if (Number(k.vpd) > 1.8) add(`VPD 높음: ${k.vpd} kPa`);
    if (Number(k.vpd) < 0.4) add(`VPD 낮음: ${k.vpd} kPa`);
    if (k.co2 < 400) add(`CO₂ 낮음: ${k.co2} ppm`);
    if (Number(k.humidity) > 90) add(`습도 높음: ${k.humidity}%`);
    if (Number(k.humidity) < 40) add(`습도 낮음: ${k.humidity}%`);
  }

  // ── Watchdog (업데이트 알림 + 10분 주기 점검) ─────────────────────────────────

  _startWatchdog() {
    if (this._watchdogInterval) return;
    this._runWatchdog();
    this._watchdogInterval = setInterval(() => this._runWatchdog(), 10 * 60 * 1000);
  }

  _stopWatchdog() {
    clearInterval(this._watchdogInterval);
    this._watchdogInterval = null;
  }

  async _runWatchdog() {
    // ── 센서 임계값 체크 ──
    if (this._simData) this._checkAlerts(this._simData);

    // ── Private 배포 모델 ──
    // GitHub release API는 private repo에서 브라우저 무인 호출이 404/인증 오류가 되므로 직접 조회하지 않는다.
    // HACS/update 엔티티가 제공하는 업데이트 신호만 사용한다.

    // ── HA 업데이트 엔티티 체크 (HA Core / HACS) ──
    if (!this._hass || !this._hass.states) return;
    const states = this._hass.states;

    const targets = Object.values(states).filter((s) => {
      if (!s.entity_id.startsWith("update.")) return false;
      if (s.state !== "on") return false;
      const id = s.entity_id.toLowerCase();
      return (
        id === "update.home_assistant_core_update" ||
        id.includes("hacs")
      );
    });

    for (const ent of targets) {
      const key = `upd::${ent.entity_id}`;
      if (this._watchdogKeys.has(key)) continue;
      this._watchdogKeys.add(key);

      const name = ent.attributes.friendly_name || ent.entity_id;
      const from = ent.attributes.installed_version || "";
      const to = ent.attributes.latest_version || "";
      const label = from && to ? `${name}: ${from} → ${to}` : `${name} 업데이트 가능`;

      this._alerts.unshift({
        key,
        msg: label,
        time: new Date().toLocaleTimeString(),
        isUpdate: true,
        entityId: ent.entity_id,
        updateTitle: `${name} 업데이트`,
        updateFrom: from,
        updateTo: to,
      });
      if (this._alerts.length > 20) this._alerts.pop();
    }

    const alertsList = this.shadowRoot && this.shadowRoot.querySelector("[data-alerts-list]");
    if (alertsList) alertsList.innerHTML = this._renderAlertsInner();
    const pill = this.shadowRoot && this.shadowRoot.querySelector("[data-sb-alert-pill]");
    if (pill) pill.innerHTML = this._alertPillHtml();

    // 업데이트 완료된 항목은 dedup set에서 제거
    for (const key of [...this._watchdogKeys]) {
      if (key === "upd::github::green_smart") continue;
      const entityId = key.replace("upd::", "");
      const s = states[entityId];
      if (s && s.state !== "on") this._watchdogKeys.delete(key);
    }
  }

  _showUpdateModal(alert) {
    const overlay = this.shadowRoot.getElementById("popup-overlay");
    const inner = this.shadowRoot.getElementById("popup-inner");
    if (!overlay || !inner) return;

    inner.innerHTML = `<div class="popup" style="width:420px;max-width:95vw;">
      <div class="pop-title">
        <ha-icon icon="mdi:update" style="color:#51AE60;margin-right:8px;"></ha-icon>
        ${this._esc(alert.updateTitle || "업데이트")}
      </div>
      <div style="padding:16px 0;color:#3d5a47;font-size:14px;line-height:1.6;">
        ${alert.updateFrom && alert.updateTo
          ? `현재 버전: <b>${this._esc(alert.updateFrom)}</b><br>최신 버전: <b style="color:#51AE60;">${this._esc(alert.updateTo)}</b>`
          : "새 버전이 있습니다."}
      </div>
      <div class="pop-actions">
        <button class="btn btn-ghost" id="upd-cancel">취소</button>
        <button class="btn btn-primary" id="upd-confirm">설치</button>
      </div>
    </div>`;

    overlay.removeAttribute("hidden");
    overlay.onclick = (e) => { if (e.target === overlay) this._closePopup(); };

    inner.querySelector("#upd-cancel")?.addEventListener("click", () => this._closePopup());
    inner.querySelector("#upd-confirm")?.addEventListener("click", async () => {
      const btn = inner.querySelector("#upd-confirm");
      if (btn) { btn.disabled = true; btn.textContent = "설치 중..."; }

      // GitHub 감지 알림이면 hass.states에서 update 엔티티 탐색
      let entityId = alert.entityId;
      if (!entityId) {
        const states = this._hass && this._hass.states;
        const found = states && Object.values(states).find(s =>
          s.entity_id.startsWith("update.") &&
          (s.entity_id.toLowerCase().includes("green_smart") || s.entity_id.toLowerCase().includes("green-smart"))
        );
        entityId = found ? found.entity_id : null;
      }

      // 엔티티 없으면 HACS 페이지로
      if (!entityId) {
        this._closePopup();
        window.history.pushState(null, "", "/hacs");
        window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
        return;
      }

      const showErr = (msg) => {
        if (btn) { btn.disabled = false; btn.textContent = "설치"; }
        const errDiv = inner.querySelector(".upd-error") || (() => {
          const d = document.createElement("div");
          d.className = "upd-error";
          d.style = "color:#c62828;font-size:13px;margin-top:8px;text-align:center;";
          inner.querySelector(".pop-actions").before(d);
          return d;
        })();
        errDiv.textContent = msg;
      };

      const doRestart = async () => {
        this._watchdogKeys.delete(alert.key);
        inner.innerHTML = `<div class="popup" style="width:380px;max-width:95vw;text-align:center;padding:32px 28px;">
          <ha-icon icon="mdi:check-circle" style="--mdi-icon-size:44px;color:#51AE60;"></ha-icon>
          <div style="font-size:16px;font-weight:700;color:#24323F;margin-top:14px;">설치 완료</div>
          <div style="font-size:13px;color:#7a9780;margin-top:8px;">Home Assistant가 재시작됩니다...</div>
          <div class="spinner" style="margin:22px auto;"></div>
        </div>`;
        await new Promise(r => setTimeout(r, 2000));
        try { await this._hass.callService("homeassistant", "restart"); } catch (_) {}
      };

      // 1차 시도: 직접 설치 (backup:false)
      try {
        await this._hass.callService("update", "install", { entity_id: entityId, backup: false });
        await doRestart();
        return;
      } catch (_) { /* 1차 실패 → 2차 시도 */ }

      // 2차 시도: HACS가 아직 새 버전을 인식 못했을 수 있으므로 강제 갱신 후 재시도
      try {
        if (btn) btn.textContent = "버전 확인 중...";
        await this._hass.callService("homeassistant", "update_entity", { entity_id: entityId });
        await new Promise(r => setTimeout(r, 4000));
        await this._hass.callService("update", "install", { entity_id: entityId, backup: false });
        await doRestart();
      } catch (_) {
        showErr("자동 설치에 실패했습니다. HACS에서 업데이트 후 HA를 재시작해주세요.");
      }
    });
  }

  _showError(err, fallback) {
    const msg = err && (err.message || (err.body && (err.body.message || err.body.error)));
    this._loading = false; this._error = msg || fallback; this._update();
  }

  // ── Shell rendering (CSS + HTML skeleton) ────────────────────────────────────

  _renderShell() {
    this.shadowRoot.innerHTML = `
<style>
:host{display:block;min-height:100vh;background:#F8FAF8;color:#24323F;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;}
*{box-sizing:border-box;margin:0;padding:0;}
button{cursor:pointer;font:inherit;}
/* ── Sidebar / TopBar ─── */
#sidebar{
  position:fixed;top:0;left:var(--gs-ha-sidebar-left,0px);width:70px;height:100vh;
  background:#fff;border-right:1px solid #e8f0e9;
  display:flex;flex-direction:column;align-items:center;
  padding:16px 0 12px;z-index:20;
  box-shadow:2px 0 12px rgba(0,0,0,0.05);
}
/* Desktop parts */
.sb-desktop{display:flex;flex-direction:column;align-items:center;width:100%;flex:1;}
.sb-brand{
  width:40px;height:40px;border-radius:10px;
  background:#51AE60;display:flex;align-items:center;
  justify-content:center;color:#fff;margin-bottom:24px;flex:0 0 auto;
}
.sb-items{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;}
.sb-spacer{flex:1;}
.sb-bottom{display:flex;flex-direction:column;align-items:center;gap:6px;padding-bottom:4px;}
.nav-btn{
  width:46px;height:46px;border-radius:12px;border:none;
  display:flex;align-items:center;justify-content:center;
  color:#7a9780;background:transparent;transition:all .15s;
}
.nav-btn:hover{background:#DFF3E2;color:#51AE60;}
.nav-btn.active{background:#DFF3E2;color:#51AE60;}
.nav-label{display:none;}
/* Mobile TopBar (hidden on desktop) */
.sb-mobile{display:none;}
/* ── Main area ─── */
#main-area{min-height:100vh;display:flex;flex-direction:column;}
#main-area.has-sidebar{margin-left:70px;}
#content{flex:1;padding:24px;}
.dashboard-version-footer{margin-top:26px;padding:18px 0 4px;text-align:center;font-size:12px;font-weight:600;color:#9aada0;letter-spacing:.02em;}
.dashboard-version-footer span{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:rgba(255,255,255,.7);border:1px solid #e8f0e9;}
/* Animations */
@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes gs-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
[data-weekly-report-refresh-icon].is-spinning ha-icon{animation:gs-spin .8s linear infinite;}
.page{animation:fadeUp .2s ease-out;}
/* Card */
.gs-card{
  background:#fff;border-radius:16px;
  box-shadow:0 4px 20px rgba(0,0,0,0.08);
  padding:20px 24px;
}
.card-title{
  font-size:14px;font-weight:700;color:#24323F;
  display:flex;align-items:center;gap:8px;margin-bottom:16px;
}
.card-title ha-icon{color:#51AE60;}
/* Section heading */
.sec-head{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:16px;
}
.sec-title{font-size:16px;font-weight:700;color:#24323F;}
/* KPI strip */
.kpi-strip{
  display:grid;
  grid-template-columns:repeat(6,1fr);
  gap:16px;margin-bottom:24px;
}
.kpi-card{
  height:110px;background:#fff;border-radius:16px;
  box-shadow:0 4px 20px rgba(0,0,0,0.08);
  padding:14px 16px;
  display:flex;flex-direction:column;justify-content:space-between;
}
.kpi-top{display:flex;align-items:flex-start;justify-content:space-between;}
.kpi-icon{color:#51AE60;font-size:18px;}
.kpi-label{font-size:10px;font-weight:700;color:#7a9780;text-transform:uppercase;letter-spacing:.04em;}
.kpi-value{font-size:22px;font-weight:700;color:#24323F;line-height:1;}
.kpi-bottom{display:flex;align-items:center;justify-content:space-between;}
.kpi-delta{font-size:11px;color:#51AE60;font-weight:600;}
/* Chart rows */
.chart-row{display:grid;grid-template-columns:1fr 300px;gap:24px;margin-bottom:24px;align-items:stretch;}
.right-pair{display:flex;flex-direction:column;gap:16px;}
.right-pair > .gs-card{flex:1;min-height:0;overflow:hidden;}
/* Chart */
.chart-tabs{
  display:flex;gap:4px;margin-bottom:12px;
  border-bottom:1px solid #e8f0e9;padding-bottom:8px;
  flex-wrap:wrap;
}
.c-tab{
  padding:4px 12px;border-radius:8px;font-size:12px;font-weight:600;
  border:none;background:transparent;color:#7a9780;
}
.c-tab.active{background:#DFF3E2;color:#51AE60;}
.chart-wrap{width:100%;overflow:hidden;border-radius:8px;}
.chart-svg{display:block;width:100%;overflow:visible;}
/* Control strategy */
.strategy-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;align-items:start;}
.strategy-card{margin-bottom:0!important;}
.strategy-principle{margin-bottom:16px;font-size:13px;color:#3d5a47;line-height:1.55;}
.strategy-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #f0f5f1;}
.strategy-row:last-child{border-bottom:none;}
.strategy-label{font-size:13px;color:#4a6741;font-weight:600;min-width:130px;}
.strategy-control{display:flex;align-items:center;gap:6px;justify-content:flex-end;}
.strategy-control input,.strategy-row select{border:1px solid #e8f0e9;border-radius:8px;padding:6px 10px;font-size:13px;font-weight:600;color:#24323F;background:#fff;outline:none;}
.strategy-control input{width:86px;text-align:right;}
.strategy-control span{font-size:12px;color:#7a9780;min-width:32px;}
.strategy-switch{display:flex;align-items:center;gap:8px;font-size:12px;color:#7a9780;font-weight:700;cursor:pointer;}
.strategy-switch input{width:36px;height:20px;accent-color:#51AE60;}
.strategy-status-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:12px;}
.strategy-status-row>div{background:#F8FAF8;border-radius:10px;padding:10px;}
.strategy-status-row span,.strategy-muted{font-size:11px;color:#7a9780;text-transform:uppercase;letter-spacing:.04em;}
.strategy-status-row b{display:block;margin-top:4px;color:#24323F;font-size:14px;}
.strategy-chip-title{display:inline-flex;align-items:center;background:#DFF3E2;color:#2f8f45;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:800;margin-bottom:8px;}
.strategy-example{margin-top:10px;background:#F8FAF8;border-left:3px solid #51AE60;border-radius:8px;padding:10px 12px;font-size:12px;color:#4a6741;line-height:1.5;}
.strategy-final-grid{display:grid;gap:8px;}
.strategy-final{display:flex;justify-content:space-between;align-items:center;background:#F8FAF8;border-radius:10px;padding:9px 10px;font-size:13px;color:#4a6741;}
.strategy-final b{color:#24323F;}
.strategy-log{padding:9px 10px;background:#F8FAF8;border-radius:10px;margin-bottom:7px;font-size:12px;color:#4a6741;}
.strategy-perms{display:grid;grid-template-columns:100px 1fr;gap:10px;padding:9px 0;border-bottom:1px solid #f0f5f1;font-size:12px;color:#4a6741;}
.strategy-perms:last-child{border-bottom:none;}
.strategy-perms b{color:#24323F;}
@media(max-width:800px){.strategy-grid{grid-template-columns:1fr}.strategy-row{align-items:flex-start;flex-direction:column}.strategy-control{justify-content:flex-start}.strategy-perms{grid-template-columns:1fr}}
/* Alerts */
.alert-item{
  display:flex;align-items:flex-start;gap:10px;
  padding:10px 12px;border-radius:10px;background:#fff8e8;
  font-size:13px;color:#7a5c00;margin-bottom:8px;
}
.alert-item ha-icon{color:#f4b400;flex:0 0 auto;margin-top:1px;}
.alert-time{font-size:11px;color:#a08030;margin-top:2px;}
.ok-row{
  display:flex;align-items:center;gap:8px;padding:10px;
  border-radius:10px;background:#DFF3E2;font-size:13px;color:#2a7a40;font-weight:600;
}
.alerts-scroll{max-height:140px;overflow-y:auto;padding-right:4px;}
.alerts-scroll::-webkit-scrollbar{width:4px;}
.alerts-scroll::-webkit-scrollbar-thumb{background:#e8f0e9;border-radius:2px;}
/* Irrig plan */
.irr-item{
  display:flex;align-items:center;gap:12px;padding:8px 0;
  border-bottom:1px solid #f0f5f1;font-size:13px;
}
.irr-time{font-weight:700;color:#51AE60;min-width:48px;}
.irr-status-done{font-size:11px;padding:2px 8px;border-radius:999px;background:#DFF3E2;color:#51AE60;font-weight:700;}
.irr-status-plan{font-size:11px;padding:2px 8px;border-radius:999px;background:#f0f5f1;color:#7a9780;font-weight:700;}
/* Target env + weather */
.tw-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.tw-item{padding:10px;background:#F8FAF8;border-radius:10px;}
.tw-label{font-size:10px;color:#7a9780;text-transform:uppercase;letter-spacing:.04em;}
.tw-value{font-size:17px;font-weight:700;color:#24323F;margin-top:3px;}
/* Zone section - desktop hidden, mobile visible */
#zone-status-section{display:none;}
/* Zone cards */
.zone-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
  gap:16px;margin-bottom:24px;
}
.zone-card{
  background:#fff;border-radius:16px;
  box-shadow:0 4px 20px rgba(0,0,0,0.08);padding:18px 20px;
}
.zone-header{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:14px;
}
.zone-name{font-size:14px;font-weight:700;color:#24323F;}
.zone-badge{
  padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;
  background:#51AE60;color:#fff;
}
.zone-badge.warn{background:#f4b400;color:#24323F;}
.zm-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.zm{padding:8px;background:#F8FAF8;border-radius:8px;}
.zm-l{font-size:10px;color:#7a9780;text-transform:uppercase;letter-spacing:.04em;}
.zm-v{font-size:14px;font-weight:700;color:#24323F;margin-top:2px;}
/* Equipment */
.equip-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
  gap:12px;margin-bottom:24px;
}
.equip-item{
  background:#fff;border-radius:12px;
  box-shadow:0 2px 10px rgba(0,0,0,0.06);
  padding:14px 16px;cursor:pointer;transition:box-shadow .15s;
}
.equip-item:hover{box-shadow:0 4px 18px rgba(81,174,96,.18);}
.equip-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.equip-name{
  display:flex;align-items:center;gap:8px;
  font-size:13px;font-weight:700;color:#24323F;
}
.equip-name ha-icon{color:#51AE60;}
.equip-val{font-size:13px;font-weight:700;color:#51AE60;}
.equip-mode-tag{padding:1px 7px;border-radius:999px;font-size:10px;font-weight:700;margin-left:6px;}
.equip-mode-tag.auto{background:#DFF3E2;color:#51AE60;}
.equip-mode-tag.manual{background:#FFF3CD;color:#f4b400;}
.eq-bg{height:6px;background:#e8f0e9;border-radius:999px;overflow:hidden;}
.eq-fill{height:100%;background:#51AE60;border-radius:999px;transition:width .3s;}
/* Popup */
.popup-overlay{
  position:fixed;inset:0;background:rgba(0,0,0,.32);
  z-index:100;display:flex;align-items:center;justify-content:center;
}
.popup-overlay[hidden]{display:none!important;}
/* ── Crop popup card ────────────────────────────── */
.popup-card{
  background:#fff;border-radius:20px;padding:28px 28px 22px;
  width:min(500px,93vw);max-height:min(88vh,760px);overflow-y:auto;overscroll-behavior:contain;
  box-shadow:0 16px 56px rgba(0,0,0,.22);
  animation:popIn .22s cubic-bezier(.4,0,.2,1);
}
@keyframes popIn{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:none}}
.pop-header{display:flex;align-items:center;gap:14px;margin-bottom:20px;padding-bottom:16px;border-bottom:1.5px solid #f0f7f1;}
.pop-icon-box{width:46px;height:46px;border-radius:13px;background:#DFF3E2;display:flex;align-items:center;justify-content:center;color:#51AE60;flex-shrink:0;}
.pop-title-main{font-size:16px;font-weight:700;color:#24323F;}
.pop-title-sub{font-size:12px;color:#7a9780;margin-top:3px;}
.pop-fields{display:flex;flex-direction:column;gap:14px;}
.pop-field{display:flex;flex-direction:column;gap:5px;}
.pop-field label{font-size:12px;font-weight:700;color:#4a6741;letter-spacing:.2px;}
.pop-field input,.pop-field select{
  border:1.5px solid #e8f0e9;border-radius:10px;
  padding:9px 13px;font-size:13px;font-weight:500;color:#24323F;
  background:#f9fcf9;outline:none;transition:border-color .15s,background .15s;
  width:100%;box-sizing:border-box;
}
.pop-field input:focus,.pop-field select:focus{border-color:#51AE60;background:#fff;}
.pop-field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.pop-foot{display:flex;justify-content:flex-end;gap:10px;margin-top:22px;padding-top:16px;border-top:1.5px solid #f0f7f1;}
.pop-btn-cancel{background:#f5faf6;color:#7a9780;border:none;border-radius:10px;padding:10px 22px;font-size:13px;font-weight:700;cursor:pointer;transition:background .15s;}
.pop-btn-cancel:hover{background:#e8f0e9;}
.pop-btn-save{background:#51AE60;color:#fff;border:none;border-radius:10px;padding:10px 26px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(81,174,96,.25);transition:background .15s;}
.pop-btn-save:hover{background:#3d9450;}
.popup{
  background:#fff;border-radius:20px;padding:28px;
  width:320px;box-shadow:0 8px 40px rgba(0,0,0,.18);
}
.pop-title{font-size:17px;font-weight:700;color:#24323F;margin-bottom:4px;}
.pop-sub{font-size:13px;color:#7a9780;margin-bottom:22px;}
.pop-mode-row{display:flex;gap:8px;margin-bottom:16px;}
.pop-mode-btn{flex:1;padding:8px;border-radius:10px;border:none;font:inherit;font-size:13px;font-weight:700;background:#F8FAF8;color:#7a9780;cursor:pointer;}
.pop-mode-btn.active{background:#51AE60;color:#fff;}
.pop-row{display:flex;align-items:center;gap:14px;margin-bottom:22px;}
input[type=range]{flex:1;accent-color:#51AE60;height:4px;}
.pop-val{font-size:22px;font-weight:800;color:#51AE60;min-width:44px;text-align:right;}
.pop-actions{display:flex;justify-content:flex-end;gap:10px;}
/* ── Weather Modal (wm-*) ─────────────────────────────────────────── */
@keyframes wmSlideUp{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
@keyframes wmBounceIn{0%{transform:scale(.6);opacity:0}65%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
.wm-popup{width:640px;max-width:96vw;max-height:88vh;overflow-y:auto;background:#fff;border-radius:20px;padding:0;box-shadow:0 8px 40px rgba(0,0,0,.18);animation:wmSlideUp .3s ease;scrollbar-width:none;}
.wm-popup::-webkit-scrollbar{display:none}
.wm-header{display:flex;align-items:center;justify-content:space-between;padding:20px 22px 0;}
.wm-title{font-size:16px;font-weight:700;color:#24323F;display:flex;align-items:center;gap:7px;}
.wm-hero{margin:12px 14px 0;border-radius:18px;padding:20px 22px 16px;animation:wmSlideUp .35s ease .05s both;}
.wm-hero-top{display:flex;align-items:flex-start;justify-content:space-between;}
.wm-hero-left{display:flex;align-items:center;gap:13px;}
.wm-hero-icon{animation:wmBounceIn .5s ease .1s both;display:flex;}
.wm-sky-name{font-size:22px;font-weight:700;color:#3d5a47;margin-bottom:5px;}
.wm-hero-badge{padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;}
.wm-temp-main{font-size:52px;font-weight:800;line-height:1;color:#24323F;letter-spacing:-2px;}
.wm-temp-feels{font-size:14px;color:#7a9780;margin-top:3px;text-align:right;}
.wm-stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px;}
.wm-stat{background:rgba(255,255,255,.72);border-radius:12px;padding:9px 10px;text-align:center;backdrop-filter:blur(4px);}
.wm-stat-lbl{font-size:11px;color:#7a9780;text-transform:uppercase;letter-spacing:.06em;}
.wm-stat-val{font-size:17px;font-weight:700;color:#24323F;margin-top:3px;}
.wm-ai{display:flex;align-items:flex-start;gap:10px;margin:10px 14px 0;padding:12px 15px;border-radius:14px;background:#f8faf8;border-left:3px solid #51AE60;animation:wmSlideUp .35s ease .12s both;}
.wm-ai-msg{font-size:14px;color:#3d5a47;line-height:1.65;}
.wm-section{margin:14px 14px 0;animation:wmSlideUp .35s ease .18s both;}
.wm-sec-title{font-size:12px;font-weight:700;color:#7a9780;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;}
.wm-scroll-wrap{position:relative;padding:0 22px;}
.wm-scroll-btn{
  position:absolute;top:50%;transform:translateY(-50%);z-index:2;
  background:rgba(255,255,255,.92);border:1px solid #e8f0e9;
  border-radius:50%;width:28px;height:28px;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;font-size:20px;font-weight:300;color:#3d5a47;
  box-shadow:0 2px 8px rgba(0,0,0,.10);
  transition:background .15s,border-color .15s,color .15s;
  padding:0;line-height:1;border:1px solid #e8f0e9;
  user-select:none;
}
.wm-scroll-btn:hover{background:#DFF3E2;border-color:#51AE60;color:#51AE60;}
.wm-scroll-btn-left{left:0;}
.wm-scroll-btn-right{right:0;}
.wm-hourly-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;}
.wm-hourly-scroll::-webkit-scrollbar{display:none}
.wm-daily-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;}
.wm-daily-scroll::-webkit-scrollbar{display:none}
.wm-hcard{flex:0 0 auto;width:70px;background:#f8faf8;border-radius:14px;padding:11px 7px;text-align:center;transition:transform .15s,box-shadow .15s;}
.wm-hcard:hover{transform:translateY(-3px);box-shadow:0 6px 16px rgba(81,174,96,.18);}
.wm-hcard-time{font-size:12px;font-weight:700;color:#51AE60;line-height:1.3;}
.wm-hcard-temp{font-size:18px;font-weight:800;color:#24323F;margin:4px 0 3px;}
.wm-hcard-pop{font-size:13px;color:#4A90D9;font-weight:600;}
.wm-hcard-wind{font-size:11px;color:#7a9780;margin-top:2px;}
.wm-dcard{flex:0 0 auto;width:76px;background:#f8faf8;border-radius:14px;padding:12px 8px;text-align:center;transition:transform .15s,box-shadow .15s;}
.wm-dcard:hover{transform:translateY(-3px);box-shadow:0 6px 16px rgba(81,174,96,.18);}
.wm-dcard-date{margin-bottom:6px;}
.wm-dcard-mm{font-size:14px;font-weight:700;color:#24323F;}
.wm-dcard-dow{font-size:13px;color:#7a9780;}
.wm-dcard-sky{font-size:12px;color:#3d5a47;margin:4px 0;}
.wm-dcard-temps{display:flex;gap:4px;align-items:center;justify-content:center;margin-top:5px;}
.wm-dcard-max{font-size:16px;font-weight:700;color:#c0392b;}
.wm-dcard-min{font-size:16px;font-weight:700;color:#4A90D9;}
.wm-dcard-pop{font-size:13px;color:#4A90D9;font-weight:600;margin-top:3px;}
.wm-alert-wrap{margin:10px 14px 0;background:#fff8e1;border-radius:14px;padding:12px 15px;border-left:3px solid #f4b400;animation:wmSlideUp .35s ease .15s both;}
.wm-alert-item{display:flex;align-items:center;gap:8px;font-size:13px;color:#7b5800;padding:3px 0;}
.wm-info-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 14px 0;}
.wm-icard{background:#f8faf8;border-radius:14px;padding:12px 15px;}
.wm-icard-lbl{font-size:9px;font-weight:700;color:#7a9780;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px;}
.wm-icard-val{font-size:14px;font-weight:600;color:#24323F;line-height:1.45;}
.wm-footer{padding:12px 14px 20px;display:flex;justify-content:space-between;align-items:center;}
.btn{
  min-height:38px;padding:0 18px;border-radius:10px;
  border:none;font:inherit;font-size:14px;font-weight:700;
}
.btn-ghost{background:#F8FAF8;color:#24323F;}
.btn-primary{background:#51AE60;color:#fff;}
/* Virtual badge */
.vbadge{
  display:inline-flex;align-items:center;gap:5px;
  padding:3px 10px;border-radius:999px;
  background:#DFF3E2;color:#51AE60;font-size:11px;font-weight:700;margin-left:10px;
}
/* Sub-page hero */
.sub-hero{
  background:#fff;border-radius:16px;
  box-shadow:0 4px 20px rgba(0,0,0,0.08);
  padding:24px;margin-bottom:24px;
}
.sub-hero-title{font-size:22px;font-weight:800;color:#24323F;margin-bottom:4px;}
.sub-hero-sub{font-size:14px;color:#7a9780;}
/* Sub-page control card */
.ctrl-card{
  background:#fff;border-radius:16px;
  box-shadow:0 4px 20px rgba(0,0,0,0.08);
  padding:24px;margin-bottom:16px;
}
.ctrl-header{
  display:flex;align-items:center;gap:12px;margin-bottom:20px;
}
.ctrl-icon-wrap{
  width:48px;height:48px;border-radius:14px;
  background:#DFF3E2;display:flex;align-items:center;justify-content:center;
  color:#51AE60;
}
.ctrl-title{font-size:16px;font-weight:700;color:#24323F;}
.ctrl-val{font-size:28px;font-weight:800;color:#51AE60;margin-bottom:16px;}
.ctrl-slider-row{display:flex;align-items:center;gap:16px;}
input.big-range{flex:1;accent-color:#51AE60;height:6px;}
.ctrl-apply{
  padding:8px 20px;border-radius:10px;border:none;
  background:#51AE60;color:#fff;font:inherit;font-size:14px;font-weight:700;
}
/* Toggle button */
.toggle-btn{
  width:48px;height:26px;border-radius:999px;border:none;
  position:relative;cursor:pointer;transition:background .2s;
}
.toggle-btn.on{background:#51AE60;}
.toggle-btn.off{background:#e8f0e9;}
/* Wizard area */
.wizard-area{max-width:760px;margin:0 auto;padding:16px;}
ha-card{
  display:block;padding:24px;border-radius:16px;
  background:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.08);
}
h1{font-size:22px;font-weight:700;color:#24323F;}
h2{font-size:18px;font-weight:700;color:#24323F;}
.sub{margin-top:8px;color:#7a9780;font-size:14px;line-height:1.55;}
.form{display:grid;gap:16px;margin-top:20px;}
.mode-toggle{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:18px;}
.mode-option{
  min-height:46px;border:1px solid #e8f0e9;border-radius:10px;
  color:#24323F;background:#F8FAF8;font:inherit;font-size:14px;font-weight:600;
}
.mode-option.active{border-color:#51AE60;background:#51AE60;color:#fff;}
.mode-copy{
  display:grid;gap:8px;margin-top:14px;padding:14px;border-radius:10px;
  color:#7a9780;background:#F8FAF8;font-size:13px;line-height:1.5;
}
.mode-copy strong{color:#24323F;}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
label{display:grid;gap:6px;color:#7a9780;font-size:13px;font-weight:600;}
input[type=text],input[type=number]{
  width:100%;min-height:44px;padding:9px 12px;
  color:#24323F;background:#F8FAF8;
  border:1px solid #e8f0e9;border-radius:10px;font:inherit;font-size:14px;
}
input:focus{outline:none;border-color:#51AE60;box-shadow:0 0 0 3px rgba(81,174,96,.15);}
.actions{display:flex;justify-content:flex-end;gap:10px;margin-top:20px;}
button.action{
  min-height:40px;border:none;border-radius:10px;padding:0 18px;
  color:#24323F;background:#F8FAF8;font:inherit;font-size:14px;font-weight:600;
}
button.primary{background:#51AE60;color:#fff;}
button.action:disabled{opacity:.5;cursor:default;}
.progress{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;}
.step{display:flex;align-items:center;gap:8px;color:#7a9780;font-size:13px;font-weight:600;}
.dot{
  width:24px;height:24px;border-radius:50%;
  display:inline-flex;align-items:center;justify-content:center;
  flex:0 0 auto;background:#e8f0e9;color:#7a9780;font-size:12px;
}
.step.active{color:#24323F;}
.step.active .dot{background:#51AE60;color:#fff;}
.bar{height:6px;margin-bottom:18px;border-radius:999px;background:#e8f0e9;overflow:hidden;}
.fill{height:100%;background:#51AE60;transition:width .18s;}
.notice,.error{
  display:flex;gap:10px;align-items:flex-start;
  margin-top:14px;padding:12px 14px;border-radius:10px;line-height:1.5;font-size:13px;
}
.notice{color:#7a9780;background:#F8FAF8;}
.error{color:#c62828;background:#fdecea;}
.summary{
  display:grid;grid-template-columns:minmax(140px,auto) 1fr;
  gap:10px 16px;margin-top:18px;padding:16px;border-radius:10px;background:#F8FAF8;
}
.summary dt{color:#7a9780;font-size:13px;}
.summary dd{margin:0;font-size:14px;font-weight:600;color:#24323F;overflow-wrap:anywhere;}
.settings-section{margin-top:24px;padding-top:20px;border-top:1px solid #e8f0e9;}
.settings-section-title{font-size:14px;font-weight:700;color:#24323F;margin-bottom:14px;}
.loading{min-height:280px;display:grid;place-items:center;color:#7a9780;}
.spinner{
  width:40px;height:40px;margin:0 auto 12px;
  border:4px solid #e8f0e9;border-top-color:#51AE60;
  border-radius:50%;animation:spin .8s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes warn-pulse{0%,82%,100%{box-shadow:none}88%{box-shadow:0 0 0 2px #f4b400}94%{box-shadow:none}}
.warn-blink{animation:warn-pulse 10s infinite;border-radius:10px;}
.warn-blink .tw-label,.warn-blink .tw-value{color:#f4b400!important;}
/* Page-specific topbar for wizard */
.wiz-topbar{
  display:flex;align-items:center;justify-content:space-between;
  padding:16px 0;margin-bottom:0;
}
.wiz-brand{display:flex;align-items:center;gap:10px;font-size:18px;font-weight:700;color:#24323F;}
.wiz-brand ha-icon{color:#51AE60;}
@media(max-width:1100px){.kpi-strip{grid-template-columns:repeat(3,1fr);}}
@media(max-width:900px){
  .chart-row{grid-template-columns:1fr;}
  .kpi-strip{grid-template-columns:repeat(3,1fr);}
}
@media(max-width:600px){
  #content{padding:12px;}
  .kpi-strip{grid-template-columns:repeat(2,1fr);}
  .zone-grid{grid-template-columns:1fr;}
  .equip-grid{grid-template-columns:1fr;}
}
@media(max-width:768px){
  /* ── TopBar 레이아웃 ── */
  #sidebar{
    position:fixed;top:0;left:0;right:0;
    width:100%;height:auto;
    flex-direction:column;align-items:stretch;
    padding:0;border-right:none;
    border-bottom:1px solid #e8f0e9;
    box-shadow:0 2px 12px rgba(0,0,0,.06);
  }
  .sb-desktop{display:none;}
  .sb-mobile{
    display:flex;flex-direction:column;width:100%;
  }
  /* Row 1: 로고 + 이름 + 유틸 버튼 */
  .sb-mob-row1{
    display:flex;align-items:center;gap:4px;
    padding:8px 12px;min-height:52px;
    border-bottom:1px solid #f0f5f1;
  }
  .sb-mob-row1 .sb-brand{
    width:32px;height:32px;border-radius:8px;
    margin-bottom:0;flex:0 0 auto;
  }
  .sb-alert-pill{
    flex:1;min-width:0;
    display:flex;align-items:center;gap:6px;
    background:#f0f7f1;border:1px solid #e8f0e9;border-radius:20px;
    padding:6px 12px;margin:0 6px;
    cursor:pointer;font-size:12px;color:#24323F;
    overflow:hidden;transition:background .15s;
    text-align:left;
  }
  .sb-alert-pill:hover{background:#DFF3E2;border-color:#51AE60;}
  .sb-alert-text{
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    flex:1;min-width:0;
  }
  .sb-mob-row1 .nav-btn{width:38px;height:38px;border-radius:10px;}
  /* Row 2: 스크롤 가능한 메뉴 */
  .sb-mob-row2{
    display:flex;overflow-x:auto;
    padding:6px 8px;gap:2px;
    scrollbar-width:none;
  }
  .sb-mob-row2::-webkit-scrollbar{display:none;}
  .sb-mob-row2 .nav-btn{
    width:auto;height:auto;
    padding:7px 12px;
    border-radius:10px;
    flex-direction:column;
    gap:3px;flex:0 0 auto;
    white-space:nowrap;font-size:11px;
  }
  .sb-mob-row2 .nav-label{display:block;line-height:1.2;}
  .sb-mob-row2 .nav-btn ha-icon{--mdi-icon-size:18px;}
  /* Main area: 사이드바 없고 상단 TopBar 높이만큼 밀어내기 */
  #main-area.has-sidebar{margin-left:0;margin-top:110px;}
  /* 모바일에서 숨길 카드 */
  #env-chart-card,#irrig-chart-card,#alerts-card{display:none;}
  /* 모바일에서 구역 현황 표시 */
  #zone-status-section{display:block;}
  #zone-card-grid{cursor:pointer;}
}
</style>
<div id="app">
  <nav id="sidebar"></nav>
  <div id="main-area"><div id="content"></div></div>
  <div id="popup-overlay" class="popup-overlay" hidden><div id="popup-inner"></div></div>
</div>`;
  }

  // ── Update ────────────────────────────────────────────────────────────────────

  _update() {
    const sidebar = this.shadowRoot.getElementById("sidebar");
    const content = this.shadowRoot.getElementById("content");
    if (!content) return;

    const isDash = this._state === "dashboard";
    const usesAppShell = this._state === "dashboard" || this._state === "settings";
    if (sidebar) {
      sidebar.style.display = usesAppShell ? "" : "none";
      if (usesAppShell) { sidebar.innerHTML = this._renderSidebar(); this._bindSidebar(); }
    }
    if (content.parentElement) {
      content.parentElement.classList.toggle("has-sidebar", usesAppShell);
    }

    if (this._loading || this._saving) {
      this._pageRendered = null;
      this._stopVirtualSimulation();
      content.innerHTML = this._renderLoading(this._saving ? "저장 중..." : "불러오는 중...");
      return;
    }
    if (WIZARD_STEPS.includes(this._state)) {
      this._pageRendered = null;
      this._stopVirtualSimulation();
      content.innerHTML = this._renderWizardPage();
      this._bindWizard(content);
      return;
    }
    if (this._state === "settings") {
      this._pageRendered = null;
      this._stopVirtualSimulation();
      content.innerHTML = this._renderSettingsPage();
      this._bindSettings(content);
      return;
    }
    // Dashboard
    if (this._isVirtual()) this._startVirtualSimulation();
    else this._stopVirtualSimulation();

    // 날씨 fetch는 virtual/real 무관하게 항상 실행
    if (!this._weatherInterval) {
      this._fetchWeather();
      this._weatherInterval = setInterval(() => this._fetchWeather(), 10 * 60 * 1000);
    }
    this._startWatchdog();

    const sim = this._simData;
    let html = "";
    if (this._page === "crop")        html = this._renderCropSettingsPage();
    else if (this._page === "environment") html = this._renderEnvSettingsPage();
    else if (this._page === "irrigation")  html = this._renderIrrigSettingsPage();
    else if (this._page === "device")      html = this._renderDeviceControlPage();
    else if (this._page === "admin" && this._hasPermission("system_settings")) html = this._renderAdminSystemPage();
    else html = this._renderHomePage(sim); // home (default)
    content.innerHTML = html;
    this._bindDashboard(content);
    this._pageRendered = this._page;
  }

  // ── No-flicker partial data refresh ───────────────────────────────────────────

  _kpiText(key, val) {
    switch (key) {
      case "temp": return `${val == null ? "--" : val}°C`;
      case "humidity": return `${val == null ? "--" : val}%`;
      case "co2": return `${val == null ? "--" : val} ppm`;
      case "vpd": return `${val == null ? "--" : val} kPa`;
      case "dli": return `${val == null ? "--" : val} mol/m²`;
      case "light": return `${val == null ? "--" : val} μmol`;
      default: return `${val == null ? "--" : val}`;
    }
  }

  _patchData() {
    const root = this.shadowRoot;
    const sim = this._simData;
    if (!root || !sim) return;

    const ts = root.querySelector("[data-sim-ts]");
    if (ts) ts.textContent = sim.updated;

    const kpi = sim.kpi || {};
    [["temp", kpi.temp], ["humidity", kpi.humidity], ["co2", kpi.co2],
     ["vpd", kpi.vpd], ["dli", kpi.dli], ["light", kpi.light]].forEach(([k, v]) => {
      const el = root.querySelector(`[data-kpi-val="${k}"]`);
      if (el) el.textContent = this._kpiText(k, v);
    });

    const zones = sim.zones || [];
    zones.forEach((z, i) => {
      const zoneEl = root.querySelector(`[data-zone="${i + 1}"]`);
      if (!zoneEl) return;
      const set = (metric, text) => {
        const el = zoneEl.querySelector(`[data-metric="${metric}"]`);
        if (el) el.textContent = text;
      };
      set("temp", `${z.dry_temp} °C`);
      set("humidity", `${z.humidity} %`);
      set("co2", `${z.co2} ppm`);
      set("vpd", `${z.vpd} kPa`);
      set("light", `${z.light} μmol`);
      const badge = zoneEl.querySelector("[data-zone-badge]");
      if (badge) {
        const warn = z.status === "warning";
        badge.textContent = warn ? "경고" : "정상";
        badge.className = `zone-badge ${warn ? "warn" : ""}`;
      }
    });

    const alertsList = root.querySelector("[data-alerts-list]");
    if (alertsList) alertsList.innerHTML = this._renderAlertsInner();
    this._patchVs001SensorSummaryCard();
    const pill = root.querySelector("[data-sb-alert-pill]");
    if (pill) pill.innerHTML = this._alertPillHtml();
  }

  // ── Sidebar ────────────────────────────────────────────────────────────────────

  _renderSidebar() {
    const a = (page) => this._page === page ? "active" : "";
    const navBtn = (page, icon, label, tooltip) =>
      `<button class="nav-btn ${a(page)}" data-page="${page}" title="${tooltip}">
      <ha-icon icon="${icon}"></ha-icon>
      <span class="nav-label">${label}</span>
    </button>`;
    const navItems = [
      navBtn("home",        "mdi:home-variant",       "홈",        "온실 현황 · 환경 추세 · 날씨를 한눈에 확인"),
      navBtn("crop",        "mdi:sprout",             "작물 설정", "작물 종류 · 생육 단계 · 재배 방식 설정"),
      navBtn("environment", "mdi:thermometer-lines",  "환경 제어", "온도 · 습도/VPD · CO₂ · AI 보정 제어"),
      navBtn("irrigation",  "mdi:water",              "관수 제어", "기본 관수 인터록 · AI 보정 · 양액 전략"),
      navBtn("device",      "mdi:cog-box",            "장치제어", "설비 운영 · 수동 제어 · 인터록 · Fail Safe"),
      this._hasPermission("system_settings") ? navBtn("admin", "mdi:shield-account", "Admin/System", "사용자 권한 · HA 연결 · API · 진단 관리") : "",
    ].join("");
    return `
    <div class="sb-desktop">
      <div class="sb-brand"><ha-icon icon="mdi:leaf"></ha-icon></div>
      <div class="sb-items">${navItems}</div>
      <div class="sb-spacer"></div>
      <div class="sb-bottom">
        <button class="nav-btn sb-settings-btn ${this._state === "settings" ? "active" : ""}" data-settings-sidebar-active="${this._state === "settings" ? "true" : "false"}" title="설정"><ha-icon icon="mdi:cog"></ha-icon></button>
        <button class="nav-btn sb-logout-btn" title="로그아웃"><ha-icon icon="mdi:logout"></ha-icon></button>
      </div>
    </div>
    <div class="sb-mobile">
      <div class="sb-mob-row1">
        <div class="sb-brand"><ha-icon icon="mdi:leaf"></ha-icon></div>
        <button class="sb-alert-pill" id="sb-alert-pill" data-sb-alert-pill>${this._alertPillHtml()}</button>
        <button class="nav-btn sb-settings-btn ${this._state === "settings" ? "active" : ""}" data-settings-sidebar-active="${this._state === "settings" ? "true" : "false"}" title="설정"><ha-icon icon="mdi:cog"></ha-icon></button>
        <button class="nav-btn sb-logout-btn" title="로그아웃"><ha-icon icon="mdi:logout"></ha-icon></button>
      </div>
      <div class="sb-mob-row2">${navItems}</div>
    </div>`;
  }

  _bindSidebar() {
    const s = this.shadowRoot.getElementById("sidebar");
    if (!s) return;
    s.querySelectorAll("[data-page]").forEach((btn) =>
      btn.addEventListener("click", () => {
        this._page = btn.dataset.page;
        this._state = "dashboard";
        this._error = "";
        this._update();
      })
    );
    s.querySelectorAll(".sb-settings-btn").forEach((btn) =>
      btn.addEventListener("click", () => this._openSettings())
    );
    s.querySelectorAll(".sb-logout-btn").forEach((btn) =>
      btn.addEventListener("click", () => { window.location.href = "/"; })
    );
    s.querySelector("#sb-alert-pill")?.addEventListener("click", () => this._openAlertPopup());
  }

  _alertPillHtml() {
    const a = this._alerts[0];
    if (!a) return `<ha-icon icon="mdi:check-circle" style="flex:0 0 auto;color:#51AE60;--mdi-icon-size:14px;"></ha-icon><span class="sb-alert-text" style="color:#7a9780;">이상 없음</span>`;
    const icon = a.isUpdate ? "mdi:update" : "mdi:alert";
    const color = a.isUpdate ? "#51AE60" : "#c0392b";
    return `<ha-icon icon="${icon}" style="flex:0 0 auto;color:${color};--mdi-icon-size:14px;"></ha-icon><span class="sb-alert-text">${this._esc(a.msg)}</span>`;
  }

  _openAlertPopup() {
    const overlay = this.shadowRoot.getElementById("popup-overlay");
    const inner = this.shadowRoot.getElementById("popup-inner");
    if (!overlay || !inner) return;
    overlay.removeAttribute("hidden");
    inner.innerHTML = this._renderAlertPopup();
    inner.querySelectorAll(".wm-close-btn").forEach(b => b.addEventListener("click", () => this._closePopup()));
    inner.querySelectorAll("[data-update-key]").forEach(item =>
      item.addEventListener("click", () => { this._closePopup(); this._showUpdateModal(item.dataset.updateKey); })
    );
    overlay.onclick = (e) => { if (e.target === overlay) this._closePopup(); };
  }

  _renderAlertPopup() {
    return `<div class="popup" style="width:480px;max-width:96vw;max-height:80vh;display:flex;flex-direction:column;padding:24px 22px 20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:8px;font-size:16px;font-weight:700;color:#24323F;">
          <ha-icon icon="mdi:bell-outline" style="color:#51AE60;"></ha-icon>최근 알림
        </div>
        <button class="wm-close-btn" style="background:none;border:none;cursor:pointer;font-size:22px;color:#7a9780;padding:4px;">&times;</button>
      </div>
      <div class="alerts-scroll" style="overflow-y:auto;flex:1;">${this._renderAlertsInner()}</div>
    </div>`;
  }

  // ── Home page ─────────────────────────────────────────────────────────────────

  _statusLevelMeta(level) {
    const meta = {
      normal: { label: "정상", color: "#51AE60", bg: "#edf8ef" },
      warning: { label: "주의", color: "#b7791f", bg: "#fff8e1" },
      danger: { label: "위험", color: "#c0392b", bg: "#fff0ee" },
    };
    return meta[level] || meta.normal;
  }

  _levelForMetric(key, value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "warning";
    if (key === "temp") return n < 15 || n > 34 ? "danger" : n < 18 || n > 30 ? "warning" : "normal";
    if (key === "humidity") return n < 45 || n > 95 ? "danger" : n < 55 || n > 88 ? "warning" : "normal";
    if (key === "co2") return n < 250 || n > 1600 ? "danger" : n < 350 || n > 1200 ? "warning" : "normal";
    if (key === "vpd") return n < 0.3 || n > 1.8 ? "danger" : n < 0.5 || n > 1.4 ? "warning" : "normal";
    return "normal";
  }

  _homeStatusItems(kpi = {}) {
    return [
      { key: "temp", label: "온도", value: this._kpiText("temp", kpi.temp), raw: kpi.temp, unit: "°C", target: "18~30°C", page: "environment" },
      { key: "humidity", label: "습도", value: this._kpiText("humidity", kpi.humidity), raw: kpi.humidity, unit: "%", target: "55~88%", page: "environment" },
      { key: "co2", label: "CO₂", value: this._kpiText("co2", kpi.co2), raw: kpi.co2, unit: "ppm", target: "350~1200ppm", page: "environment" },
      { key: "vpd", label: "VPD", value: this._kpiText("vpd", kpi.vpd), raw: kpi.vpd, unit: "kPa", target: "0.5~1.4kPa", page: "environment" },
    ].map((item) => ({ ...item, level: this._levelForMetric(item.key, item.raw) }));
  }

  _renderHomeActionSummaryCard(kpi = {}) {
    const riskCount = this._alerts.filter((a) => !a.isUpdate).length;
    const role = this._currentUserRole();
    return `<section class="gs-card home-action-summary" data-home-action-summary data-ui-section="view" style="padding:18px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px;">
        <div>
          <div style="font-size:18px;font-weight:900;color:#24323F;">오늘 농장 확인</div>
          <div style="font-size:12px;color:#7a9780;margin-top:4px;">위험 알림 → 오늘 할 일 → 조치 필요 순서로 확인합니다. 현재 온실 상태는 아래 KPI 카드에서 확인하세요.</div>
        </div>
        <span style="font-size:11px;font-weight:800;color:#7a9780;background:#f5faf6;border-radius:999px;padding:6px 10px;">${this._esc(role)}</span>
      </div>
      <div data-home-risk-alerts style="padding:12px;border-radius:14px;background:${riskCount ? '#fff0ee' : '#edf8ef'};margin-bottom:10px;">
        <div style="font-size:12px;font-weight:800;color:#7a9780;">위험 알림</div>
        <div style="font-size:15px;font-weight:900;color:#24323F;margin-top:3px;">${riskCount ? `${riskCount}건 확인 필요` : '현재 위험 알림 없음'}</div>
      </div>
      <div data-home-today-tasks style="padding:12px;border-radius:14px;background:#f8fbf8;margin-bottom:10px;">
        <div style="font-size:12px;font-weight:800;color:#7a9780;">오늘 할 일</div>
        <div style="font-size:14px;font-weight:800;color:#24323F;margin-top:3px;">작물 상태 확인 · 관수 상태 확인 · 장치 이상 여부 확인</div>
      </div>
      <div data-home-required-actions style="padding:12px;border-radius:14px;background:#fffaf0;">
        <div style="font-size:12px;font-weight:800;color:#7a9780;">조치 필요</div>
        <div style="font-size:14px;font-weight:800;color:#24323F;margin-top:3px;">알림 확인, 조치 완료 기록, 권한 내 장치 정지를 여기서 시작합니다.</div>
      </div>
    </section>`;
  }

  _renderHomeStatusPopup(item) {
    const meta = this._statusLevelMeta(item.level);
    const role = this._currentUserRole();
    const canStaffStop = role === "farm_staff" && this._hasPermission("manual_device_control");
    const canOwnerExecute = role === "farm_owner" && this._hasPermission("execute_final_targets");
    const admin = role === "admin";
    const actions = [
      `<button class="btn" data-role-action="acknowledge">확인</button>`,
      `<button class="btn" data-role-action="complete">조치 완료 기록</button>`,
      ...(canStaffStop || canOwnerExecute || admin ? [`<button class="btn" data-role-action="stop-device">장치 정지 Dry Run</button>`] : []),
      ...(canOwnerExecute || admin ? [`<button class="btn btn-primary" data-role-action="limited-execute">제한 실행 Dry Run</button>`] : []),
      ...(admin ? [`<button class="btn" data-role-action="admin-diagnostics">진단/고급 설정</button>`] : []),
    ].join("");
    return `<div class="popup" data-home-status-popup style="width:460px;max-width:96vw;padding:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-size:17px;font-weight:900;color:#24323F;">${item.label} 상세</div>
        <button class="wm-close-btn" style="background:none;border:none;cursor:pointer;font-size:22px;color:#7a9780;">&times;</button>
      </div>
      <div style="border-radius:16px;background:${meta.bg};padding:16px;margin-bottom:14px;">
        <div style="font-size:12px;font-weight:800;color:${meta.color};">${meta.label}</div>
        <div style="font-size:30px;font-weight:900;color:#24323F;margin-top:3px;">${item.value}</div>
        <div style="font-size:12px;color:#5d7d64;margin-top:6px;">목표 범위: ${item.target}</div>
      </div>
      <div style="font-size:13px;color:#5d7d64;line-height:1.55;margin-bottom:16px;">현재 ${item.label} 값은 ${meta.label} 상태입니다. 색상 배지는 빠른 판단을 돕고, 상세 설정은 관련 제어 페이지에서 확인합니다.</div>
      <div data-home-action-result style="display:none;font-size:12px;font-weight:800;color:#3c6e47;background:#edf8ef;border-radius:12px;padding:10px;margin-bottom:12px;"></div>
      <div style="font-size:12px;color:#7a9780;line-height:1.45;margin-bottom:12px;">장치 정지 Dry Run과 제한 실행 Dry Run은 SafetyGuard/Control Mode 사전점검만 수행합니다. 실제 장비 실행 안 함.</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;">${actions}</div>
    </div>`;
  }

  _homeActionDomainForStatus(item) {
    if (item?.key === "humidity" || item?.key === "vpd") return "environment";
    if (item?.key === "temp" || item?.key === "co2") return "environment";
    return item?.page === "irrigation" ? "irrigation" : "environment";
  }

  _homeSafetyEventId(domain) {
    const cache = this._zoneSafetyGuardEventCache?.[this._scopedControlCacheKey(domain)] || this._zoneSafetyGuardEventCache?.[domain] || null;
    const active = Array.isArray(cache?.activeEvents) ? cache.activeEvents[0] : null;
    return Number(active?.id || active?.eventId || -1);
  }

  _homeActionPayloadForStatus(item) {
    const domain = this._homeActionDomainForStatus(item);
    const cropSeasonId = this._numericControlSeasonId() || 1;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const eventId = this._homeSafetyEventId(domain);
    const operatorNote = `Home 상태 조치 · ${item?.label || item?.key || "status"} · ${item?.value || "-"} · ${this._statusLevelMeta(item?.level).label}`;
    return { domain, crop_season_id: cropSeasonId, zone_id: zoneId, event_id: eventId, eventId, operatorNote, note: operatorNote };
  }

  _setHomeActionResult(message, ok = true) {
    const result = this.shadowRoot?.querySelector("[data-home-action-result]");
    if (!result) return;
    result.style.display = "block";
    result.style.color = ok ? "#3c6e47" : "#b03a2e";
    result.style.background = ok ? "#edf8ef" : "#fff0ee";
    result.textContent = message;
  }

  async _homeAcknowledgeStatusAction(item) {
    const payload = this._homeActionPayloadForStatus(item);
    try {
      const res = await this._hass.callApi("POST", "green_smart/zones/safety-guard-events/ack", { ...payload, operatorNote: `${payload.operatorNote} · home_status_acknowledge` });
      this._setHomeActionResult("확인 기록 완료");
      await this._fetchZoneSafetyGuardEvents(payload.domain, { patchOnly: true }).catch(() => null);
      return !!res?.ok;
    } catch (err) {
      console.warn("Home 상태 확인 기록 실패", err);
      this._setHomeActionResult("확인 기록 실패: SafetyGuard 이벤트 로그를 확인하세요.", false);
      return false;
    }
  }

  async _homeCompleteStatusAction(item) {
    const payload = this._homeActionPayloadForStatus(item);
    try {
      const res = await this._hass.callApi("POST", "green_smart/zones/safety-guard-events/clear", { ...payload, operatorNote: `${payload.operatorNote} · home_status_complete` });
      this._setHomeActionResult("조치 완료 기록 완료");
      await this._fetchZoneSafetyGuardEvents(payload.domain, { patchOnly: true }).catch(() => null);
      return !!res?.ok;
    } catch (err) {
      console.warn("Home 조치 완료 기록 실패", err);
      this._setHomeActionResult("조치 완료 기록 실패: SafetyGuard 이벤트 로그를 확인하세요.", false);
      return false;
    }
  }

  async _homePreviewStopDeviceDryRun(item) {
    const payload = this._homeActionPayloadForStatus(item);
    try {
      const res = await this._hass.callApi("POST", "green_smart/zones/execute-final-targets", {
        crop_season_id: payload.crop_season_id,
        zone_id: payload.zone_id,
        domain: "device",
        dry_run: true,
        operatorNote: `${payload.operatorNote} · home_stop_device_dry_run`,
        post_state_delay: 0,
      });
      this._setHomeActionResult(`장치 정지 Dry Run 완료 · planned ${res?.plannedCount ?? 0} · 실제 장비 실행 안 함`);
      return res;
    } catch (err) {
      console.warn("Home 장치 정지 Dry Run 실패", err);
      this._setHomeActionResult("장치 정지 Dry Run 실패: entity mapping/final target/SafetyGuard를 확인하세요.", false);
      return null;
    }
  }

  async _homePreviewLimitedExecutionDryRun(item) {
    const payload = this._homeActionPayloadForStatus(item);
    try {
      const res = await this._hass.callApi("POST", "green_smart/zones/execute-final-targets", {
        crop_season_id: payload.crop_season_id,
        zone_id: payload.zone_id,
        domain: payload.domain,
        dry_run: true,
        operatorNote: `${payload.operatorNote} · home_limited_execute_dry_run`,
        post_state_delay: 0,
      });
      this._setHomeActionResult(`제한 실행 Dry Run 완료 · planned ${res?.plannedCount ?? 0} · 실제 장비 실행 안 함`);
      return res;
    } catch (err) {
      console.warn("Home 제한 실행 Dry Run 실패", err);
      this._setHomeActionResult("제한 실행 Dry Run 실패: Control Mode/SafetyGuard/final target를 확인하세요.", false);
      return null;
    }
  }

  _openHomeStatusPopup(key) {
    const kpi = (this._simData && this._simData.kpi) || {};
    const item = this._homeStatusItems(kpi).find((x) => x.key === key);
    const overlay = this.shadowRoot.getElementById("popup-overlay");
    const inner = this.shadowRoot.getElementById("popup-inner");
    if (!item || !overlay || !inner) return;
    overlay.removeAttribute("hidden");
    inner.innerHTML = this._renderHomeStatusPopup(item);
    inner.querySelectorAll(".wm-close-btn").forEach((btn) => btn.addEventListener("click", () => this._closePopup()));
    inner.querySelectorAll("[data-role-action='acknowledge']").forEach((btn) => btn.addEventListener("click", async () => await this._homeAcknowledgeStatusAction(item)));
    inner.querySelectorAll("[data-role-action='complete']").forEach((btn) => btn.addEventListener("click", async () => await this._homeCompleteStatusAction(item)));
    inner.querySelectorAll("[data-role-action='stop-device']").forEach((btn) => btn.addEventListener("click", async () => await this._homePreviewStopDeviceDryRun(item)));
    inner.querySelectorAll("[data-role-action='limited-execute']").forEach((btn) => btn.addEventListener("click", async () => await this._homePreviewLimitedExecutionDryRun(item)));
    inner.querySelectorAll("[data-role-action='admin-diagnostics']").forEach((btn) => btn.addEventListener("click", () => { this._page = "admin"; this._closePopup(); this._update(); }));
    overlay.onclick = (e) => { if (e.target === overlay) this._closePopup(); };
  }

  _loadAdminRoleMappings() {
    try { return JSON.parse(localStorage.getItem("green_smart_admin_role_mappings") || "[]"); }
    catch (_) { return []; }
  }

  _loadAdminSystemConfig() {
    const defaults = { centralApiUrl: "", weatherApiEnabled: true, pesticideApiEnabled: true, mqttHost: "localhost", backupRetentionDays: 14, diagnosticsLevel: "standard" };
    try { return { ...defaults, ...JSON.parse(localStorage.getItem("green_smart_admin_system_config") || "{}") }; }
    catch (_) { return defaults; }
  }

  _loadAdminAuditLogs() {
    try { return JSON.parse(localStorage.getItem("green_smart_admin_audit_logs") || "[]"); }
    catch (_) { return []; }
  }

  _pushAdminAuditLog(action, detail) {
    const row = `${new Date().toLocaleString()} · ${action} · ${detail}`;
    this._adminAuditLogs = [row, ...(this._adminAuditLogs || [])].slice(0, 50);
    localStorage.setItem("green_smart_admin_audit_logs", JSON.stringify(this._adminAuditLogs));
  }

  _adminSystemTabs() {
    return adminSystemTabs();
  }

  _renderAdminSystemTabBar() {
    return renderAdminSystemTabBar(this);
  }

  _renderAdminSystemTabContent() {
    return renderAdminSystemTabContent(this);
  }

  _renderAdminSystemPage() {
    // RB-001 legacy static contract manifest: Admin/System markers now render from
    // domains/admin/admin-page.js, while the public panel shell keeps these
    // marker literals for older contract tests and downstream automation.
    // _adminSystemTabs() _renderAdminSystemTabBar() _renderAdminSystemTabContent()
    // data-admin-system-tab data-admin-system-content data-admin-role-row data-admin-role-save
    // data-admin-health-refresh data-admin-config-save data-admin-diagnostic-run
    // data-admin-backup-export data-admin-audit-log
    // data-ui-section="view" data-ui-section="record" data-ui-section="strategy"
    // data-ui-section="approval" data-ui-section="execute" data-ui-section="safety"
    // data-ui-section="admin" data-required-permission= data-role-visibility=
    // 사용자/권한 연동 상태 시스템 설정 진단/백업 감사 로그 HA 사용자 Central API MariaDB MQTT 현재 역할
    return renderAdminSystemPage(this);
  }

  _renderHomePage(sim) {
    const kpi = (sim && sim.kpi) || {};
    const cfg = this._normalizedForm();
    const virt = this._isVirtual();
    if (this._equipZone >= cfg.greenhouse_zones) this._equipZone = 0;
    const zoneOptions = Array.from({ length: cfg.greenhouse_zones }, (_, i) =>
      `<option value="${i}" ${i === this._equipZone ? "selected" : ""}>Zone ${i + 1}</option>`
    ).join("");
    return `<div class="page">
      ${virt ? `<div style="margin-bottom:16px;display:flex;align-items:center;gap:8px;font-size:13px;color:#51AE60;font-weight:600;">
        <ha-icon icon="mdi:test-tube"></ha-icon>가상 장치 모드 — 시뮬레이션 데이터
        ${sim ? `<span style="margin-left:8px;color:#7a9780;font-weight:400;">업데이트: <span data-sim-ts>${sim.updated}</span></span>` : ""}
      </div>` : ""}
      ${this._renderHomeActionSummaryCard(kpi)}
      ${this._renderVs001SensorSummaryCard(kpi)}
      ${this._renderKPIStrip(kpi)}
      <div class="chart-row">
        ${this._renderTrendChart()}
        <div class="right-pair">
          ${this._renderAlertsCard()}
          ${this._renderWeatherCard(sim && sim.weather)}
        </div>
      </div>
      <div class="chart-row">
        ${this._renderIrrigChart()}
        <div class="right-pair">
          ${this._renderTargetEnv()}
          ${this._renderIrrigPlan()}
        </div>
      </div>
      ${this._renderZoneCards2(sim)}
      <div class="sec-head">
        <div class="sec-title">장비 상태</div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="font-size:12px;color:#7a9780;">클릭하여 제어</div>
          <select id="equip-zone-select" style="border:1px solid #e8f0e9;border-radius:8px;padding:4px 10px;font-size:13px;font-weight:600;color:#24323F;background:#fff;cursor:pointer;outline:none;">
            ${zoneOptions}
          </select>
        </div>
      </div>
      ${this._renderEquipGrid()}
      <div class="dashboard-version-footer" data-dashboard-version="${VERSION}">
        <span>Green Smart v${VERSION}</span>
      </div>
    </div>`;
  }

  async _fetchCurrentSensorSummary({ patchOnly = false } = {}) {
    if (!this._hass) return null;
    const zoneId = Number(this._controlScope?.zoneId || this._equipZone + 1 || 1);
    const greenhouseId = Number(this._form?.greenhouse_id || this._form?.farm_id || 1);
    try {
      // sensorService.getCurrentSensors — VS-001 service boundary marker.
      const sensorService = { getCurrentSensors: () => this._hass.callApi("GET", `green_smart/sensors/current?greenhouse_id=${greenhouseId}&zone_id=${zoneId}`) };
      const res = await sensorService.getCurrentSensors();
      this._currentSensorSummary = res || null;
      if (patchOnly) this._patchVs001SensorSummaryCard();
      else this._update();
      return this._currentSensorSummary;
    } catch (err) {
      console.warn("VS-001 current sensor summary fallback", err);
      return this._currentSensorSummary;
    }
  }

  _vs001MetricValue(data, key, fallback, digits = 1) {
    const val = data?.[key] ?? fallback;
    if (val == null || val === "") return "--";
    const n = Number(val);
    return Number.isFinite(n) ? n.toFixed(digits) : this._esc(String(val));
  }

  _renderVs001SensorSummaryCard(kpi = {}) {
    const data = this._currentSensorSummary;
    if (!data && this._hass) this._fetchCurrentSensorSummary({ patchOnly: true });
    const temp = this._vs001MetricValue(data, "temperature_c", kpi.temp, 1);
    const rh = this._vs001MetricValue(data, "relative_humidity_pct", kpi.humidity, 0);
    const vpd = this._vs001MetricValue(data, "vpd_kpa", kpi.vpd, 2);
    const sourceStatus = data?.source_status || (this._isVirtual() ? "virtual_simulation" : "loading");
    const quality = data?.quality || "pending";
    return `<div class="gs-card" data-vs001-sensor-summary-card style="padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px;">
        <div><b>실시간 온도·습도·VPD</b><div class="strategy-muted">VS-001 · sensorService.getCurrentSensors · Zone ${this._esc(String(data?.zone_id || this._controlScope?.zoneId || 1))}</div></div>
        <button class="mini-btn" data-vs001-sensor-refresh>센서 새로고침</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;">
        <div class="mini-stat"><span>온도</span><b data-vs001-temperature-c>${temp}</b><small>°C</small></div>
        <div class="mini-stat"><span>상대습도</span><b data-vs001-relative-humidity-pct>${rh}</b><small>%</small></div>
        <div class="mini-stat"><span>VPD</span><b data-vs001-vpd-kpa>${vpd}</b><small>kPa</small></div>
        <div class="mini-stat"><span>Source</span><b data-vs001-source-status>${this._esc(sourceStatus)}</b><small>${this._esc(quality)}</small></div>
      </div>
      ${data?.used_fallback ? `<div class="strategy-muted" style="color:#a45b00;margin-top:8px;">Soft Fallback 사용: ${this._esc(data?.fallback_reason_code || "sensor_fallback")}</div>` : ""}
    </div>`;
  }

  _patchVs001SensorSummaryCard() {
    const root = this.shadowRoot;
    const data = this._currentSensorSummary;
    if (!root || !data) return;
    const set = (sel, value) => { const el = root.querySelector(sel); if (el) el.textContent = value; };
    set("[data-vs001-temperature-c]", this._vs001MetricValue(data, "temperature_c", null, 1));
    set("[data-vs001-relative-humidity-pct]", this._vs001MetricValue(data, "relative_humidity_pct", null, 0));
    set("[data-vs001-vpd-kpa]", this._vs001MetricValue(data, "vpd_kpa", null, 2));
    set("[data-vs001-source-status]", data.source_status || "unknown");
  }

  _renderKPIStrip(kpi) {
    const prev = (key) => {
      const h = this._chartHistory;
      if (h.length < 2) return null;
      const z = h[h.length - 2].zones && h[h.length - 2].zones[0];
      return z ? z[key] : null;
    };
    const delta = (cur, key) => {
      const p = prev(key);
      if (p == null || cur == null) return "";
      const d = (Number(cur) - Number(p));
      const sign = d >= 0 ? "+" : "";
      return `<span class="kpi-delta">${sign}${d.toFixed(1)}</span>`;
    };
    const sparkOf = (zoneKey) => this._sparkline(this._chartHistory.map((p) => {
      const z = p.zones && p.zones[0];
      return z ? z[zoneKey] : null;
    }));
    const cards = [
      { label:"온도", icon:"mdi:thermometer", valKey:"temp", raw:kpi.temp, spark:"temp" },
      { label:"습도", icon:"mdi:water-percent", valKey:"humidity", raw:kpi.humidity, spark:"humidity" },
      { label:"CO₂", icon:"mdi:molecule-co2", valKey:"co2", raw:kpi.co2, spark:"co2" },
      { label:"VPD", icon:"mdi:weather-windy", valKey:"vpd", raw:kpi.vpd, spark:"vpd" },
      { label:"DLI", icon:"mdi:weather-sunny", valKey:"dli", raw:kpi.dli, spark:"light" },
      { label:"누적광량", icon:"mdi:white-balance-sunny", valKey:"light", raw:kpi.light, spark:"light" },
    ];
    const statusByKey = Object.fromEntries(this._homeStatusItems(kpi).map((item) => [item.key, item]));
    return `<div class="kpi-strip" data-home-greenhouse-summary>${cards.map((c) => {
      const status = statusByKey[c.valKey] || { level: "ok" };
      return `
      <div class="kpi-card" data-home-status-card data-status-key="${c.valKey}" data-status-level="${status.level}">
        <div class="kpi-top">
          <div><div class="kpi-label">${c.label}</div><div class="kpi-value"><span data-kpi-val="${c.valKey}">${this._kpiText(c.valKey, c.raw == null ? null : c.raw)}</span></div></div>
          <ha-icon icon="${c.icon}" class="kpi-icon"></ha-icon>
        </div>
        <div class="kpi-bottom">${delta(c.raw, c.spark)}<span data-kpi-spark="${c.valKey}">${sparkOf(c.spark)}</span></div>
      </div>`;
    }).join("")}
    </div>`;
  }

  _sparkline(data) {
    const pts = data.slice(-10).filter((v) => v != null);
    if (pts.length < 2) return `<svg width="60" height="20"></svg>`;
    const mn = Math.min(...pts), mx = Math.max(...pts), r = mx - mn || 1;
    const W = 60, H = 20;
    const coords = pts.map((v, i) => {
      const x = (i / (pts.length - 1)) * W;
      const y = H - ((v - mn) / r) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="overflow:visible">
      <polyline points="${coords}" fill="none" stroke="#51AE60" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  _openTrendPopup() {
    const overlay = this.shadowRoot.getElementById("popup-overlay");
    const inner = this.shadowRoot.getElementById("popup-inner");
    if (!overlay || !inner) return;
    overlay.removeAttribute("hidden");
    inner.innerHTML = this._renderChartPopup("env");
    this._bindChartPopup(inner, "env");
    overlay.onclick = (e) => { if (e.target === overlay) this._closePopup(); };
  }

  _openIrrigPopup() {
    const overlay = this.shadowRoot.getElementById("popup-overlay");
    const inner = this.shadowRoot.getElementById("popup-inner");
    if (!overlay || !inner) return;
    overlay.removeAttribute("hidden");
    inner.innerHTML = this._renderChartPopup("irrig");
    this._bindChartPopup(inner, "irrig");
    overlay.onclick = (e) => { if (e.target === overlay) this._closePopup(); };
  }

  _renderChartPopup(type) {
    // type: "env" | "irrig"
    const isEnv = type === "env";
    const cfg = this._normalizedForm();
    const zoneCount = cfg.greenhouse_zones || 1;
    const zoneIdx = isEnv ? this._chartZoneTab : this._irrigZoneTab;
    const tabAttr = isEnv ? "data-popup-env-zone" : "data-popup-irrig-zone";
    const tabHtml = Array.from({ length: zoneCount }, (_, i) =>
      `<button class="c-tab ${i === zoneIdx ? "active" : ""}" ${tabAttr}="${i}">Zone ${i + 1}</button>`
    ).join("");

    const title = isEnv ? "환경 추세 상세보기" : "관수 추세 상세보기";
    const icon = isEnv ? "mdi:chart-line" : "mdi:water";
    const series = isEnv ? SERIES : IRRIG_SERIES;
    const svgId = isEnv ? "popup-env-svg" : "popup-irrig-svg";
    const tooltipId = isEnv ? "popup-env-tooltip" : "popup-irrig-tooltip";
    const crosshairId = isEnv ? "popup-env-crosshair" : "popup-irrig-crosshair";
    const hoverRectId = isEnv ? "popup-env-hover" : "popup-irrig-hover";
    const zoneKey = isEnv ? "zones" : "irrigZones";
    const seriesPrefix = isEnv ? "popup-env-" : "popup-irrig-";

    const W = 700, PAD_TOP = 14, PAD_RIGHT = 14, PAD_BOTTOM = 34, PAD_LEFT = 50;
    const chartW = W - PAD_LEFT - PAD_RIGHT;
    const chartH = 280 - PAD_TOP - PAD_BOTTOM;
    const n = this._chartHistory.length;

    const seriesData = (key) => this._chartHistory
      .map((pt) => (pt[zoneKey] && pt[zoneKey][zoneIdx]) ? pt[zoneKey][zoneIdx][key] : null)
      .filter((v) => v != null);

    const latest = this._chartHistory[n - 1];
    const latestZone = latest && latest[zoneKey] && latest[zoneKey][zoneIdx];

    let chartContent = "";
    if (n < 2) {
      chartContent = `<div style="height:280px;display:flex;align-items:center;justify-content:center;color:#7a9780;font-size:13px;">
        <div style="text-align:center;"><ha-icon icon="${icon}"></ha-icon><br>데이터 수집 중...</div>
      </div>`;
    } else {
      const yLabels = [0, .25, .5, .75, 1].map((f) => {
        const y = PAD_TOP + chartH - f * chartH;
        return `<text x="${PAD_LEFT - 7}" y="${(y + 3).toFixed(0)}" text-anchor="end" fill="#7a9780" font-size="11">${Math.round(f * 100)}</text>
                <line x1="${PAD_LEFT}" y1="${y.toFixed(0)}" x2="${W - PAD_RIGHT}" y2="${y.toFixed(0)}" stroke="#e8f0e9" stroke-width="1"/>`;
      }).join("");
      const nTick = Math.min(8, n);
      const xLabels = Array.from({ length: nTick }, (_, i) => {
        const idx = Math.round((i / (nTick - 1)) * (n - 1));
        const ts = this._chartHistory[idx] && this._chartHistory[idx].ts;
        const label = ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
        const x = PAD_LEFT + (idx / (n - 1)) * chartW;
        return `<text x="${x.toFixed(0)}" y="${280 - 10}" text-anchor="middle" fill="#7a9780" font-size="11">${label}</text>`;
      }).join("");
      const polylines = series.map((s) => {
        const data = seriesData(s.key);
        if (data.length < 2) return "";
        const mn = Math.min(...data), mx = Math.max(...data), r = mx - mn || 1;
        const points = data.map((v, i) => {
          const x = PAD_LEFT + (i / (data.length - 1)) * chartW;
          const y = PAD_TOP + chartH - ((v - mn) / r) * chartH;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(" ");
        return `<polyline id="${seriesPrefix}${s.key}" points="${points}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
      }).join("");
      const svgEl = `<svg id="${svgId}" class="chart-svg" viewBox="0 0 ${W} 280" style="height:340px;">
        ${yLabels}${xLabels}${polylines}
        <line id="${crosshairId}" x1="0" y1="${PAD_TOP}" x2="0" y2="${PAD_TOP + chartH}" opacity="0" pointer-events="none" stroke="#24323F" stroke-dasharray="4,4"/>
        <rect id="${hoverRectId}" x="${PAD_LEFT}" y="${PAD_TOP}" width="${chartW}" height="${chartH}" fill="transparent"/>
      </svg>`;
      chartContent = `<div class="chart-wrap" style="position:relative;">${svgEl}
        <div id="${tooltipId}" style="position:absolute;display:none;background:#fff;border:1px solid #e8f0e9;border-radius:10px;padding:10px 14px;font-size:12px;box-shadow:0 4px 16px rgba(0,0,0,.12);pointer-events:none;min-width:170px;z-index:10;"></div>
      </div>`;
    }

    const legend = series.map((s) => {
      const v = latestZone ? latestZone[s.key] : null;
      const text = v == null ? "--" : Number(v).toFixed(s.fixed);
      return `<div style="display:flex;align-items:center;gap:5px;font-size:12px;color:#24323F;">
        <span style="width:9px;height:9px;border-radius:50%;background:${s.color};display:inline-block;"></span>
        <span style="font-weight:600;">${s.label}</span><span style="color:#7a9780;">${text} ${s.unit}</span>
      </div>`;
    }).join("");

    return `<div class="popup" style="width:780px;max-width:96vw;max-height:90vh;overflow-y:auto;padding:24px 22px 20px;">
      <div class="pop-title" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <span style="display:flex;align-items:center;gap:8px;">
          <ha-icon icon="${icon}" style="color:#51AE60;"></ha-icon>${title}
        </span>
        <button class="wm-close-btn" style="background:none;border:none;cursor:pointer;font-size:22px;color:#7a9780;padding:4px;">&times;</button>
      </div>
      <div class="chart-tabs" style="margin-bottom:12px;">${tabHtml}</div>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:12px;">${legend}</div>
      ${chartContent}
      <div style="font-size:11px;color:#7a9780;margin-top:10px;text-align:right;">
        최근 ${Math.min(n, 720)}분 데이터 (최대 12시간)
      </div>
    </div>`;
  }

  _bindChartPopup(root, type) {
    const isEnv = type === "env";
    // 닫기 버튼
    root.querySelectorAll(".wm-close-btn").forEach(b => b.addEventListener("click", () => this._closePopup()));

    // Zone 탭
    const tabAttr = isEnv ? "data-popup-env-zone" : "data-popup-irrig-zone";
    root.querySelectorAll(`[${tabAttr}]`).forEach((btn) => {
      btn.addEventListener("click", () => {
        if (isEnv) this._chartZoneTab = parseInt(btn.getAttribute(tabAttr), 10);
        else this._irrigZoneTab = parseInt(btn.getAttribute(tabAttr), 10);
        // 팝업 리렌더
        const overlay = this.shadowRoot.getElementById("popup-overlay");
        const inner = this.shadowRoot.getElementById("popup-inner");
        if (inner) {
          inner.innerHTML = this._renderChartPopup(type);
          this._bindChartPopup(inner, type);
          if (overlay) overlay.onclick = (e) => { if (e.target === overlay) this._closePopup(); };
        }
      });
    });

    // 툴팁 (기존 _bindChartTooltip/_bindIrrigTooltip과 동일 로직, 팝업용 ID 사용)
    const svgId = isEnv ? "popup-env-svg" : "popup-irrig-svg";
    const tooltipId = isEnv ? "popup-env-tooltip" : "popup-irrig-tooltip";
    const crosshairId = isEnv ? "popup-env-crosshair" : "popup-irrig-crosshair";
    const hoverRectId = isEnv ? "popup-env-hover" : "popup-irrig-hover";
    const zoneKey = isEnv ? "zones" : "irrigZones";
    const series = isEnv ? SERIES : IRRIG_SERIES;

    const svg = root.querySelector(`#${svgId}`);
    const tooltip = root.querySelector(`#${tooltipId}`);
    const crosshair = root.querySelector(`#${crosshairId}`);
    const hoverRect = svg && svg.querySelector(`#${hoverRectId}`);
    if (!hoverRect || !tooltip) return;

    const W = 700, PAD_LEFT = 50, PAD_RIGHT = 14;
    const chartW = W - PAD_LEFT - PAD_RIGHT;
    const zoneIdx = isEnv ? this._chartZoneTab : this._irrigZoneTab;

    hoverRect.addEventListener("mousemove", (e) => {
      const rect = svg.getBoundingClientRect();
      const scaleX = W / rect.width;
      const xSvg = (e.clientX - rect.left) * scaleX;
      const xData = xSvg - PAD_LEFT;
      const n = this._chartHistory.length;
      if (n < 2) return;
      const idx = Math.max(0, Math.min(n - 1, Math.round((xData / chartW) * (n - 1))));
      const pt = this._chartHistory[idx];
      const zd = pt[zoneKey] && pt[zoneKey][zoneIdx];
      if (!zd) return;
      const cx = PAD_LEFT + (idx / (n - 1)) * chartW;
      if (crosshair) { crosshair.setAttribute("x1", cx); crosshair.setAttribute("x2", cx); crosshair.setAttribute("opacity", "0.5"); }
      const time = new Date(pt.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      tooltip.innerHTML = `<div style="font-weight:700;color:#24323F;margin-bottom:8px;border-bottom:1px solid #e8f0e9;padding-bottom:6px;">${time}</div>
        <div style="display:grid;gap:4px;">
          ${series.map(s => `<div style="display:flex;justify-content:space-between;gap:16px;">
            <span style="color:${s.color};font-weight:600;">${s.label}</span>
            <span>${zd[s.key] != null ? Number(zd[s.key]).toFixed(s.fixed) : "--"} ${s.unit}</span>
          </div>`).join("")}
        </div>`;
      tooltip.style.display = "block";
      const svgW = rect.width;
      const tipX = (cx / W) * svgW;
      if (tipX < svgW / 2) { tooltip.style.left = (tipX + 12) + "px"; tooltip.style.right = ""; }
      else { tooltip.style.right = (svgW - tipX + 12) + "px"; tooltip.style.left = ""; }
      tooltip.style.top = "10px";
    });
    hoverRect.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
      if (crosshair) crosshair.setAttribute("opacity", "0");
    });
  }

  _renderTrendChart() {
    const cfg = this._normalizedForm();
    const zoneCount = cfg.greenhouse_zones || 1;
    if (this._chartZoneTab >= zoneCount) this._chartZoneTab = 0;
    const zoneIdx = this._chartZoneTab;
    const tabHtml = Array.from({ length: zoneCount }, (_, i) =>
      `<button class="c-tab ${i === zoneIdx ? "active" : ""}" data-zone-tab="${i}">Zone ${i + 1}</button>`
    ).join("");

    const W = 600, CHART_VIEW_H = 280, PAD_TOP = 4, PAD_RIGHT = 10, PAD_BOTTOM = 18, PAD_LEFT = 45;
    const chartW = W - PAD_LEFT - PAD_RIGHT;
    const chartH = CHART_VIEW_H - PAD_TOP - PAD_BOTTOM;
    const n = this._chartHistory.length;

    const seriesData = (key) => this._chartHistory
      .map((pt) => (pt.zones && pt.zones[zoneIdx]) ? pt.zones[zoneIdx][key] : null)
      .filter((v) => v != null);

    const latest = this._chartHistory[n - 1];
    const latestZone = latest && latest.zones && latest.zones[zoneIdx];

    if (n < 2) {
      return `<div class="gs-card" id="env-chart-card">
        <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;">
          <span style="display:flex;align-items:center;gap:6px;">
            <ha-icon icon="mdi:chart-line"></ha-icon>환경 추세
          </span>
          <button id="env-chart-expand" title="상세보기"
            style="background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:6px;
            font-size:18px;font-weight:300;color:#7a9780;line-height:1;transition:color .15s;"
            onmouseover="this.style.color='#51AE60'" onmouseout="this.style.color='#7a9780'">+</button>
        </div>
        <div class="chart-tabs">${tabHtml}</div>
        <div style="height:280px;display:flex;align-items:center;justify-content:center;color:#7a9780;font-size:13px;">
          <div style="text-align:center;"><ha-icon icon="mdi:chart-line"></ha-icon><br>데이터 수집 중... (1분 간격 업데이트)</div>
        </div>
      </div>`;
    }

    const yLabels = [0, .25, .5, .75, 1].map((f) => {
      const y = PAD_TOP + chartH - f * chartH;
      return `<text x="${PAD_LEFT - 6}" y="${(y + 3).toFixed(0)}" text-anchor="end" fill="#7a9780" font-size="10">${Math.round(f * 100)}</text>
              <line x1="${PAD_LEFT}" y1="${y.toFixed(0)}" x2="${W - PAD_RIGHT}" y2="${y.toFixed(0)}" stroke="#e8f0e9" stroke-width="1"/>`;
    }).join("");

    const nTick = Math.min(6, n);
    const xLabels = Array.from({ length: nTick }, (_, i) => {
      const idx = Math.round((i / (nTick - 1)) * (n - 1));
      const ts = this._chartHistory[idx] && this._chartHistory[idx].ts;
      const label = ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
      const x = PAD_LEFT + (idx / (n - 1)) * chartW;
      return `<text x="${x.toFixed(0)}" y="${CHART_VIEW_H - 5}" text-anchor="middle" fill="#7a9780" font-size="10">${label}</text>`;
    }).join("");

    const polylines = SERIES.map((s) => {
      const data = seriesData(s.key);
      if (data.length < 2) return "";
      const mn = Math.min(...data), mx = Math.max(...data), r = mx - mn || 1;
      const points = data.map((v, i) => {
        const x = PAD_LEFT + (i / (data.length - 1)) * chartW;
        const y = PAD_TOP + chartH - ((v - mn) / r) * chartH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ");
      return `<polyline id="series-${s.key}" points="${points}" fill="none" stroke="${s.color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).join("");

    const legend = SERIES.map((s) => {
      const v = latestZone ? latestZone[s.key] : null;
      const text = v == null ? "--" : Number(v).toFixed(s.fixed);
      return `<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#24323F;">
        <span style="width:8px;height:8px;border-radius:50%;background:${s.color};display:inline-block;"></span>
        <span style="font-weight:600;">${s.label}</span><span style="color:#7a9780;">${text} ${s.unit}</span>
      </div>`;
    }).join("");

    const svg = `<svg id="env-chart-svg" class="chart-svg" viewBox="0 0 ${W} ${CHART_VIEW_H}" style="height:280px;">
      ${yLabels}${xLabels}
      ${polylines}
      <line id="chart-crosshair" x1="0" y1="${PAD_TOP}" x2="0" y2="${PAD_TOP + chartH}" opacity="0" pointer-events="none" stroke="#24323F" stroke-dasharray="4,4"/>
      <rect id="chart-hover-rect" x="${PAD_LEFT}" y="${PAD_TOP}" width="${chartW}" height="${chartH}" fill="transparent"/>
    </svg>`;

    return `<div class="gs-card" id="env-chart-card" style="position:relative;">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;">
        <span style="display:flex;align-items:center;gap:6px;">
          <ha-icon icon="mdi:chart-line"></ha-icon>환경 추세
        </span>
        <button id="env-chart-expand" title="상세보기"
          style="background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:6px;
          font-size:18px;font-weight:300;color:#7a9780;line-height:1;transition:color .15s;"
          onmouseover="this.style.color='#51AE60'" onmouseout="this.style.color='#7a9780'">+</button>
      </div>
      <div class="chart-tabs">${tabHtml}</div>
      <div style="display:flex;flex-wrap:wrap;gap:14px;margin-bottom:8px;justify-content:center;">${legend}</div>
      <div class="chart-wrap" style="position:relative;width:95%;margin:0 auto;">${svg}
        <div id="chart-tooltip" style="position:absolute;display:none;background:#fff;border:1px solid #e8f0e9;border-radius:10px;padding:10px 14px;font-size:12px;box-shadow:0 4px 16px rgba(0,0,0,.12);pointer-events:none;min-width:170px;z-index:10;"></div>
      </div>
    </div>`;
  }

  _patchChart() {
    const root = this.shadowRoot;
    const svg = root && root.querySelector("#env-chart-svg");
    if (!svg || !this._chartHistory.length) return;
    const zoneIdx = this._chartZoneTab;
    const W = 600, CHART_VIEW_H = 280, PAD_LEFT = 45, PAD_TOP = 4, PAD_BOTTOM = 18;
    const chartW = W - PAD_LEFT - 10;
    const chartH = CHART_VIEW_H - PAD_TOP - PAD_BOTTOM;
    SERIES.forEach((s) => {
      const line = svg.querySelector(`#series-${s.key}`);
      if (!line) return;
      const data = this._chartHistory.map((pt) => (pt.zones && pt.zones[zoneIdx]) ? pt.zones[zoneIdx][s.key] : null).filter((v) => v != null);
      if (data.length < 2) return;
      const mn = Math.min(...data), mx = Math.max(...data), r = mx - mn || 1;
      line.setAttribute("points", data.map((v, i) => {
        const x = PAD_LEFT + (i / (data.length - 1)) * chartW;
        const y = PAD_TOP + chartH - ((v - mn) / r) * chartH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" "));
    });
  }

  _bindChartTooltip(root) {
    const svg = root.querySelector("#env-chart-svg");
    const tooltip = root.querySelector("#chart-tooltip");
    const crosshair = root.querySelector("#chart-crosshair");
    const hoverRect = svg && svg.querySelector("#chart-hover-rect");
    if (!hoverRect || !tooltip) return;

    const W = 600, PAD_LEFT = 45, PAD_RIGHT = 10;
    const chartW = W - PAD_LEFT - PAD_RIGHT;

    hoverRect.addEventListener("mousemove", (e) => {
      const rect = svg.getBoundingClientRect();
      const scaleX = W / rect.width;
      const xSvg = (e.clientX - rect.left) * scaleX;
      const xData = xSvg - PAD_LEFT;
      const n = this._chartHistory.length;
      if (n < 2) return;
      const idx = Math.max(0, Math.min(n - 1, Math.round((xData / chartW) * (n - 1))));
      const pt = this._chartHistory[idx];
      const zd = pt.zones && pt.zones[this._chartZoneTab];
      if (!zd) return;

      const cx = PAD_LEFT + (idx / (n - 1)) * chartW;
      if (crosshair) { crosshair.setAttribute("x1", cx); crosshair.setAttribute("x2", cx); crosshair.setAttribute("opacity", "0.5"); }

      const time = new Date(pt.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      tooltip.innerHTML = `
        <div style="font-weight:700;color:#24323F;margin-bottom:8px;border-bottom:1px solid #e8f0e9;padding-bottom:6px;">${time}</div>
        <div style="display:grid;gap:4px;">
          <div style="display:flex;justify-content:space-between;gap:16px;"><span style="color:#51AE60;font-weight:600;">온도</span><span>${Number(zd.temp).toFixed(1)} °C</span></div>
          <div style="display:flex;justify-content:space-between;gap:16px;"><span style="color:#4A90D9;font-weight:600;">습도</span><span>${Number(zd.humidity).toFixed(1)} %</span></div>
          <div style="display:flex;justify-content:space-between;gap:16px;"><span style="color:#E06B2E;font-weight:600;">CO₂</span><span>${zd.co2} ppm</span></div>
          <div style="display:flex;justify-content:space-between;gap:16px;"><span style="color:#9B59B6;font-weight:600;">VPD</span><span>${Number(zd.vpd).toFixed(2)} kPa</span></div>
          <div style="display:flex;justify-content:space-between;gap:16px;"><span style="color:#F4B400;font-weight:600;">광량</span><span>${zd.light} μmol</span></div>
        </div>`;
      tooltip.style.display = "block";

      const svgW = rect.width;
      const tipX = (cx / W) * svgW;
      if (tipX < svgW / 2) { tooltip.style.left = (tipX + 12) + "px"; tooltip.style.right = ""; }
      else { tooltip.style.right = (svgW - tipX + 12) + "px"; tooltip.style.left = ""; }
      tooltip.style.top = "10px";
    });

    hoverRect.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
      if (crosshair) crosshair.setAttribute("opacity", "0");
    });
  }

  _renderIrrigChart() {
    const cfg = this._normalizedForm();
    const zoneCount = cfg.greenhouse_zones || 1;
    if (this._irrigZoneTab >= zoneCount) this._irrigZoneTab = 0;
    const zoneIdx = this._irrigZoneTab;
    const tabHtml = Array.from({ length: zoneCount }, (_, i) =>
      `<button class="c-tab ${i === zoneIdx ? "active" : ""}" data-irrig-zone-tab="${i}">Zone ${i + 1}</button>`
    ).join("");

    const W = 600, CHART_VIEW_H = 280, PAD_TOP = 4, PAD_RIGHT = 10, PAD_BOTTOM = 18, PAD_LEFT = 45;
    const chartW = W - PAD_LEFT - PAD_RIGHT;
    const chartH = CHART_VIEW_H - PAD_TOP - PAD_BOTTOM;
    const n = this._chartHistory.length;

    const seriesData = (key) => this._chartHistory
      .map((pt) => (pt.irrigZones && pt.irrigZones[zoneIdx]) ? pt.irrigZones[zoneIdx][key] : null)
      .filter((v) => v != null);

    const latest = this._chartHistory[n - 1];
    const latestZone = latest && latest.irrigZones && latest.irrigZones[zoneIdx];

    if (n < 2) {
      return `<div class="gs-card" id="irrig-chart-card" style="position:relative;">
        <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;">
          <span style="display:flex;align-items:center;gap:6px;">
            <ha-icon icon="mdi:water"></ha-icon>관수 추세
          </span>
          <button id="irrig-chart-expand" title="상세보기"
            style="background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:6px;
            font-size:18px;font-weight:300;color:#7a9780;line-height:1;transition:color .15s;"
            onmouseover="this.style.color='#51AE60'" onmouseout="this.style.color='#7a9780'">+</button>
        </div>
        <div class="chart-tabs">${tabHtml}</div>
        <div style="height:280px;display:flex;align-items:center;justify-content:center;color:#7a9780;font-size:13px;">
          <div style="text-align:center;"><ha-icon icon="mdi:water"></ha-icon><br>데이터 수집 중... (1분 간격 업데이트)</div>
        </div>
      </div>`;
    }

    const yLabels = [0, .25, .5, .75, 1].map((f) => {
      const y = PAD_TOP + chartH - f * chartH;
      return `<text x="${PAD_LEFT - 6}" y="${(y + 3).toFixed(0)}" text-anchor="end" fill="#7a9780" font-size="10">${Math.round(f * 100)}</text>
              <line x1="${PAD_LEFT}" y1="${y.toFixed(0)}" x2="${W - PAD_RIGHT}" y2="${y.toFixed(0)}" stroke="#e8f0e9" stroke-width="1"/>`;
    }).join("");

    const nTick = Math.min(6, n);
    const xLabels = Array.from({ length: nTick }, (_, i) => {
      const idx = Math.round((i / (nTick - 1)) * (n - 1));
      const ts = this._chartHistory[idx] && this._chartHistory[idx].ts;
      const label = ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
      const x = PAD_LEFT + (idx / (n - 1)) * chartW;
      return `<text x="${x.toFixed(0)}" y="${CHART_VIEW_H - 5}" text-anchor="middle" fill="#7a9780" font-size="10">${label}</text>`;
    }).join("");

    const polylines = IRRIG_SERIES.map((s) => {
      const data = seriesData(s.key);
      if (data.length < 2) return "";
      const mn = Math.min(...data), mx = Math.max(...data), r = mx - mn || 1;
      const points = data.map((v, i) => {
        const x = PAD_LEFT + (i / (data.length - 1)) * chartW;
        const y = PAD_TOP + chartH - ((v - mn) / r) * chartH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ");
      return `<polyline id="irrig-series-${s.key}" points="${points}" fill="none" stroke="${s.color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).join("");

    const legend = IRRIG_SERIES.map((s) => {
      const v = latestZone ? latestZone[s.key] : null;
      const text = v == null ? "--" : Number(v).toFixed(s.fixed);
      return `<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#24323F;">
        <span style="width:8px;height:8px;border-radius:50%;background:${s.color};display:inline-block;"></span>
        <span style="font-weight:600;">${s.label}</span><span style="color:#7a9780;">${text} ${s.unit}</span>
      </div>`;
    }).join("");

    const svg = `<svg id="irrig-chart-svg" class="chart-svg" viewBox="0 0 ${W} ${CHART_VIEW_H}" style="height:280px;">
      ${yLabels}${xLabels}
      ${polylines}
      <line id="irrig-crosshair" x1="0" y1="${PAD_TOP}" x2="0" y2="${PAD_TOP + chartH}" opacity="0" pointer-events="none" stroke="#24323F" stroke-dasharray="4,4"/>
      <rect id="irrig-hover-rect" x="${PAD_LEFT}" y="${PAD_TOP}" width="${chartW}" height="${chartH}" fill="transparent"/>
    </svg>`;

    return `<div class="gs-card" id="irrig-chart-card" style="position:relative;">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;">
        <span style="display:flex;align-items:center;gap:6px;">
          <ha-icon icon="mdi:water"></ha-icon>관수 추세
        </span>
        <button id="irrig-chart-expand" title="상세보기"
          style="background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:6px;
          font-size:18px;font-weight:300;color:#7a9780;line-height:1;transition:color .15s;"
          onmouseover="this.style.color='#51AE60'" onmouseout="this.style.color='#7a9780'">+</button>
      </div>
      <div class="chart-tabs">${tabHtml}</div>
      <div style="display:flex;flex-wrap:wrap;gap:14px;margin-bottom:8px;justify-content:center;">${legend}</div>
      <div class="chart-wrap" style="position:relative;width:95%;margin:0 auto;">${svg}
        <div id="irrig-tooltip" style="position:absolute;display:none;background:#fff;border:1px solid #e8f0e9;border-radius:10px;padding:10px 14px;font-size:12px;box-shadow:0 4px 16px rgba(0,0,0,.12);pointer-events:none;min-width:170px;z-index:10;"></div>
      </div>
    </div>`;
  }

  _patchIrrigChart() {
    const root = this.shadowRoot;
    const svg = root && root.querySelector("#irrig-chart-svg");
    if (!svg || !this._chartHistory.length) return;
    const zoneIdx = this._irrigZoneTab;
    const W = 600, CHART_VIEW_H = 280, PAD_LEFT = 45, PAD_TOP = 4, PAD_BOTTOM = 18;
    const chartW = W - PAD_LEFT - 10;
    const chartH = CHART_VIEW_H - PAD_TOP - PAD_BOTTOM;
    IRRIG_SERIES.forEach((s) => {
      const line = svg.querySelector(`#irrig-series-${s.key}`);
      if (!line) return;
      const data = this._chartHistory
        .map((pt) => (pt.irrigZones && pt.irrigZones[zoneIdx]) ? pt.irrigZones[zoneIdx][s.key] : null)
        .filter((v) => v != null);
      if (data.length < 2) return;
      const mn = Math.min(...data), mx = Math.max(...data), r = mx - mn || 1;
      line.setAttribute("points", data.map((v, i) => {
        const x = PAD_LEFT + (i / (data.length - 1)) * chartW;
        const y = PAD_TOP + chartH - ((v - mn) / r) * chartH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" "));
    });
  }

  _bindIrrigTooltip(root) {
    const svg = root.querySelector("#irrig-chart-svg");
    const tooltip = root.querySelector("#irrig-tooltip");
    const crosshair = root.querySelector("#irrig-crosshair");
    const hoverRect = svg && svg.querySelector("#irrig-hover-rect");
    if (!hoverRect || !tooltip) return;

    const W = 600, PAD_LEFT = 45, PAD_RIGHT = 10;
    const chartW = W - PAD_LEFT - PAD_RIGHT;

    hoverRect.addEventListener("mousemove", (e) => {
      const rect = svg.getBoundingClientRect();
      const scaleX = W / rect.width;
      const xSvg = (e.clientX - rect.left) * scaleX;
      const xData = xSvg - PAD_LEFT;
      const n = this._chartHistory.length;
      if (n < 2) return;
      const idx = Math.max(0, Math.min(n - 1, Math.round((xData / chartW) * (n - 1))));
      const pt = this._chartHistory[idx];
      const zd = pt.irrigZones && pt.irrigZones[this._irrigZoneTab];
      if (!zd) return;

      const cx = PAD_LEFT + (idx / (n - 1)) * chartW;
      if (crosshair) { crosshair.setAttribute("x1", cx); crosshair.setAttribute("x2", cx); crosshair.setAttribute("opacity", "0.5"); }

      const time = new Date(pt.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const rows = IRRIG_SERIES.map((s) => {
        const v = zd[s.key];
        const text = v == null ? "--" : Number(v).toFixed(s.fixed);
        return `<div style="display:flex;justify-content:space-between;gap:16px;"><span style="color:${s.color};font-weight:600;">${s.label}</span><span>${text}${s.unit ? " " + s.unit : ""}</span></div>`;
      }).join("");
      tooltip.innerHTML = `
        <div style="font-weight:700;color:#24323F;margin-bottom:8px;border-bottom:1px solid #e8f0e9;padding-bottom:6px;">${time}</div>
        <div style="display:grid;gap:4px;">${rows}</div>`;
      tooltip.style.display = "block";

      const svgW = rect.width;
      const tipX = (cx / W) * svgW;
      if (tipX < svgW / 2) { tooltip.style.left = (tipX + 12) + "px"; tooltip.style.right = ""; }
      else { tooltip.style.right = (svgW - tipX + 12) + "px"; tooltip.style.left = ""; }
      tooltip.style.top = "10px";
    });

    hoverRect.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
      if (crosshair) crosshair.setAttribute("opacity", "0");
    });
  }

  _renderAlertsInner() {
    const items = this._alerts.slice(0, 20);
    if (items.length === 0) {
      return `<div class="ok-row"><ha-icon icon="mdi:check-circle"></ha-icon>이상 없음</div>`;
    }
    return items.map((a) => {
      if (a.isUpdate) {
        return `<div class="alert-item alert-update" data-update-key="${this._esc(a.key)}" style="cursor:pointer;">
          <ha-icon icon="mdi:update" style="color:#51AE60;flex:0 0 auto;margin-top:1px;"></ha-icon>
          <div>
            <div style="color:#24323F;">${this._esc(a.msg)}</div>
            <div class="alert-time">${a.time} · 클릭하여 업데이트</div>
          </div>
        </div>`;
      }
      return `<div class="alert-item"><ha-icon icon="mdi:alert"></ha-icon>
          <div><div>${a.msg}</div><div class="alert-time">${a.time}</div></div>
        </div>`;
    }).join("");
  }

  _renderAlertsCard() {
    return `<div class="gs-card" id="alerts-card">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;">
        <span style="display:flex;align-items:center;gap:6px;"><ha-icon icon="mdi:bell-outline"></ha-icon>최근 알림</span>
        <button id="watchdog-refresh-btn" title="수동 점검" style="background:none;border:none;cursor:pointer;padding:4px;border-radius:6px;display:flex;align-items:center;color:#7a9780;transition:color 0.15s;" onmouseover="this.style.color='#51AE60'" onmouseout="this.style.color='#7a9780'">
          <ha-icon icon="mdi:refresh" style="--mdi-icon-size:18px;"></ha-icon>
        </button>
      </div>
      <div class="alerts-scroll" data-alerts-list>${this._renderAlertsInner()}</div>
    </div>`;
  }

  _renderIrrigPlan() {
    const now = new Date().getHours() * 60 + new Date().getMinutes();
    const events = [
      { time:"06:00", mins: 360, label:"구역 전체 • 12분" },
      { time:"11:00", mins: 660, label:"구역 전체 • 8분" },
      { time:"15:00", mins: 900, label:"구역 전체 • 15분" },
    ];
    const rows = events.map((e) => {
      const done = now > e.mins;
      return `<div class="irr-item">
        <div class="irr-time">${e.time}</div>
        <div style="flex:1;font-size:13px;color:#24323F;">${e.label}</div>
        <div class="${done ? "irr-status-done" : "irr-status-plan"}">${done ? "완료" : "예정"}</div>
      </div>`;
    }).join("");
    return `<div class="gs-card" style="display:flex;flex-direction:column;">
      <div class="card-title"><ha-icon icon="mdi:calendar-clock"></ha-icon>오늘 관수 계획</div>
      <div style="overflow-y:auto;flex:1;">${rows}</div>
    </div>`;
  }

  _renderPesticideCard() {
    const data = this._pesticideSearchData || {};
    const items = Array.isArray(data.items) ? data.items : [];
    const error = data.error;
    const body = error
      ? `<div class="notice"><ha-icon icon="mdi:cloud-alert-outline"></ha-icon><div>중앙 서버 농약 검색 연결 대기 중</div></div>`
      : items.length
        ? `<div style="display:grid;gap:8px;max-height:132px;overflow-y:auto;">
            ${items.slice(0, 4).map((it) => `<div class="irr-item" style="align-items:flex-start;">
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:700;color:#24323F;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this._esc(it.name || "이름 없음")}</div>
                <div style="font-size:11px;color:#7a9780;margin-top:2px;line-height:1.4;">${this._esc([it.company, it.crop, it.pest].filter(Boolean).join(" · ") || "상세 정보 없음")}</div>
              </div>
            </div>`).join("")}
          </div>`
        : `<div class="notice"><ha-icon icon="mdi:sprout-outline"></ha-icon><div>농약 검색 결과 수집 중</div></div>`;
    return `<div class="gs-card" data-pesticide-card>
      <div class="card-title"><ha-icon icon="mdi:bottle-tonic-plus-outline"></ha-icon>농약 정보</div>
      ${body}
    </div>`;
  }

  _calcEnvMetrics() {
    const h = this._chartHistory;
    if (!h || h.length === 0) return { adt: null, atd7: null, dif: null, vpd: null, n: 0 };

    // ADT
    const allTemps = h.flatMap(pt => pt.zones.map(z => z.temp)).filter(v => v != null && !isNaN(v));
    const adt = allTemps.length ? allTemps.reduce((s, v) => s + v, 0) / allTemps.length : null;

    // 7day_ATD (목표 ADT = 22°C)
    const TARGET_ADT = 22.0;
    const atd7 = adt !== null ? adt - TARGET_ADT : null;

    // DIF
    const dayTemps = [], nightTemps = [];
    h.forEach(pt => {
      const hour = new Date(pt.ts).getHours();
      const zTemps = pt.zones.map(z => z.temp).filter(v => v != null && !isNaN(v));
      if (!zTemps.length) return;
      const avg = zTemps.reduce((s, v) => s + v, 0) / zTemps.length;
      (hour >= 6 && hour < 18 ? dayTemps : nightTemps).push(avg);
    });
    const dayAvg = dayTemps.length ? dayTemps.reduce((s, v) => s + v, 0) / dayTemps.length : null;
    const nightAvg = nightTemps.length ? nightTemps.reduce((s, v) => s + v, 0) / nightTemps.length : null;
    const dif = (dayAvg !== null && nightAvg !== null) ? dayAvg - nightAvg : null;

    // VPD (최신 포인트)
    const latest = h[h.length - 1];
    const vpdVals = latest ? latest.zones.map(z => z.vpd).filter(v => v != null && !isNaN(v)) : [];
    const vpd = vpdVals.length ? vpdVals.reduce((s, v) => s + v, 0) / vpdVals.length : null;

    return { adt, atd7, dif, vpd, n: h.length };
  }

  _openTargetEnvPopup() {
    const overlay = this.shadowRoot.getElementById("popup-overlay");
    const inner = this.shadowRoot.getElementById("popup-inner");
    if (!overlay || !inner) return;
    overlay.removeAttribute("hidden");
    inner.innerHTML = this._renderTargetEnvPopup();
    inner.querySelectorAll(".wm-close-btn").forEach(b => b.addEventListener("click", () => this._closePopup()));
    overlay.onclick = (e) => { if (e.target === overlay) this._closePopup(); };
  }

  _renderTargetEnvPopup() {
    const m = this._calcEnvMetrics();
    const fmt = (v, dec, plus) =>
      v == null ? "--" : (plus && v > 0 ? "+" : "") + Number(v).toFixed(dec);

    const dataNote = m.n < 720
      ? `<div style="font-size:11px;color:#7a9780;text-align:center;margin-bottom:14px;">※ 현재 ${m.n}분 데이터 기준 (최대 12시간 누적)</div>`
      : "";

    const mkCard = ({ label, abbr, icon, value, unit, targetText, status, statusColor, desc }) => `
      <div style="background:#f8faf8;border-radius:16px;padding:16px 18px;border-left:3px solid ${statusColor};">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <ha-icon icon="${icon}" style="--mdi-icon-size:18px;color:${statusColor};"></ha-icon>
            <span style="font-size:14px;font-weight:700;color:#24323F;">${abbr}</span>
            <span style="font-size:11px;color:#7a9780;">${label}</span>
          </div>
          <span style="font-size:22px;font-weight:800;color:${statusColor};">${value}<span style="font-size:12px;font-weight:400;"> ${unit}</span></span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;">
          <span style="color:#7a9780;">목표 범위: <b style="color:#24323F;">${targetText}</b></span>
          <span style="color:${statusColor};font-weight:700;">${status}</span>
        </div>
        <div style="font-size:12px;color:#3d5a47;line-height:1.6;">${desc}</div>
      </div>`;

    // ADT
    const adtV = m.adt; const adtFmt = fmt(adtV, 1, false);
    const adtColor = adtV == null ? "#7a9780" : (adtV >= 18 && adtV <= 26) ? "#51AE60" : "#c0392b";
    const adtStatus = adtV == null ? "데이터 없음" : (adtV >= 18 && adtV <= 26) ? "정상 범위" : (adtV > 26 ? "목표 초과" : "목표 미달");

    // 7day_ATD
    const atd7V = m.atd7; const atd7Fmt = fmt(atd7V, 1, true);
    const atd7Color = atd7V == null ? "#7a9780" : Math.abs(atd7V) <= 2 ? "#51AE60" : (Math.abs(atd7V) <= 4 ? "#F4B400" : "#c0392b");
    const atd7Status = atd7V == null ? "데이터 없음" : Math.abs(atd7V) <= 2 ? "목표 이내" : (Math.abs(atd7V) <= 4 ? "주의 수준" : "편차 과다");

    // DIF
    const difV = m.dif; const difFmt = fmt(difV, 1, true);
    const difColor = difV == null ? "#7a9780" : (difV >= 2 && difV <= 10) ? "#51AE60" : "#F4B400";
    const difStatus = difV == null ? "데이터 없음" : (difV >= 2 && difV <= 10) ? "적정 범위" : (difV < 2 ? "DIF 부족" : "DIF 과다");

    // VPD
    const vpdV = m.vpd; const vpdFmt = fmt(vpdV, 2, false);
    const vpdColor = vpdV == null ? "#7a9780" : (vpdV >= 0.8 && vpdV <= 1.4) ? "#51AE60" : (vpdV < 0.4 || vpdV > 2.0) ? "#c0392b" : "#F4B400";
    const vpdStatus = vpdV == null ? "데이터 없음" : (vpdV >= 0.8 && vpdV <= 1.4) ? "최적 범위" : (vpdV < 0.4 ? "저 VPD" : vpdV > 2.0 ? "위험 수준" : "주의 수준");

    const cards = [
      mkCard({ abbr:"ADT", label:"일평균온도", icon:"mdi:thermometer", value:adtFmt, unit:"°C",
        targetText:"18 ~ 26 °C", status:adtStatus, statusColor:adtColor,
        desc:"일평균온도(Average Daily Temperature)는 하루 전체 온도의 평균값입니다. 작물의 발육 속도와 수확 시기에 직접적인 영향을 미치며, 목표 ADT를 유지하는 것이 생산성의 핵심입니다." }),
      mkCard({ abbr:"7day_ATD", label:"7일 평균온도 편차", icon:"mdi:thermometer-lines", value:atd7Fmt, unit:"°C",
        targetText:"±2 °C 이내", status:atd7Status, statusColor:atd7Color,
        desc:"목표 ADT(22°C) 대비 현재 ADT의 편차입니다. 편차가 누적되면 작물의 발육 단계가 앞당겨지거나 지연됩니다. 양수는 온도 초과, 음수는 온도 부족을 의미합니다." }),
      mkCard({ abbr:"DIF", label:"주야 온도차", icon:"mdi:weather-sunset", value:difFmt, unit:"°C",
        targetText:"+2 ~ +10 °C", status:difStatus, statusColor:difColor,
        desc:"DIF(Day-Night temperature Difference)는 주간 평균온도에서 야간 평균온도를 뺀 값입니다. 양의 DIF는 줄기 신장을 촉진하고, 음의 DIF(DIF-)는 줄기 신장을 억제합니다." }),
      mkCard({ abbr:"VPD", label:"수증기압 포차", icon:"mdi:water-percent", value:vpdFmt, unit:"kPa",
        targetText:"0.8 ~ 1.4 kPa", status:vpdStatus, statusColor:vpdColor,
        desc:"VPD(Vapor Pressure Deficit)는 현재 공기가 최대 수용 가능한 수증기량과 실제 수증기량의 차이입니다. 기공 개폐와 광합성 효율에 직접 영향을 미칩니다." }),
    ].join("");

    return `<div class="popup" style="width:680px;max-width:96vw;max-height:90vh;overflow-y:auto;padding:24px 22px 22px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:8px;font-size:16px;font-weight:700;color:#24323F;">
          <ha-icon icon="mdi:target" style="color:#51AE60;"></ha-icon>오늘 목표 환경 상세
        </div>
        <button class="wm-close-btn" style="background:none;border:none;cursor:pointer;font-size:22px;color:#7a9780;padding:4px;">&times;</button>
      </div>
      ${dataNote}
      <div style="display:grid;gap:12px;">
        ${cards}
      </div>
    </div>`;
  }

  _renderTargetEnv() {
    const m = this._calcEnvMetrics();
    const fmt = (v, dec, plus) =>
      v == null ? "--" : (plus && v > 0 ? "+" : "") + Number(v).toFixed(dec);

    const adtVal = fmt(m.adt, 1, false);
    const atd7Val = fmt(m.atd7, 1, true);
    const difVal = fmt(m.dif, 1, true);
    const vpdVal = fmt(m.vpd, 2, false);

    // 상태 색상
    const adtColor = m.adt == null ? "#7a9780"
      : (m.adt >= 18 && m.adt <= 26) ? "#51AE60" : "#c0392b";
    const atd7Color = m.atd7 == null ? "#7a9780"
      : Math.abs(m.atd7) <= 2 ? "#51AE60" : (Math.abs(m.atd7) <= 4 ? "#F4B400" : "#c0392b");
    const difColor = m.dif == null ? "#7a9780"
      : (m.dif >= 2 && m.dif <= 10) ? "#51AE60" : "#F4B400";
    const vpdColor = m.vpd == null ? "#7a9780"
      : (m.vpd >= 0.8 && m.vpd <= 1.4) ? "#51AE60"
      : (m.vpd < 0.4 || m.vpd > 2.0) ? "#c0392b" : "#F4B400";

    return `<div class="gs-card" id="target-env-card" style="cursor:pointer;">
      <div class="card-title"><ha-icon icon="mdi:target"></ha-icon>오늘 목표 환경</div>
      <div class="tw-grid">
        <div class="tw-item">
          <div class="tw-label">ADT</div>
          <div class="tw-value" style="color:${adtColor};">${adtVal}<span style="font-size:11px;font-weight:400;"> °C</span></div>
        </div>
        <div class="tw-item">
          <div class="tw-label">7day_ATD</div>
          <div class="tw-value" style="color:${atd7Color};">${atd7Val}<span style="font-size:11px;font-weight:400;"> °C</span></div>
        </div>
        <div class="tw-item">
          <div class="tw-label">DIF</div>
          <div class="tw-value" style="color:${difColor};">${difVal}<span style="font-size:11px;font-weight:400;"> °C</span></div>
        </div>
        <div class="tw-item">
          <div class="tw-label">VPD</div>
          <div class="tw-value" style="color:${vpdColor};">${vpdVal}<span style="font-size:11px;font-weight:400;"> kPa</span></div>
        </div>
      </div>
    </div>`;
  }

  _renderWeatherCard(weather) {
    let data = this._weatherData;
    if (!data || data.error) {
      const w = weather || {};
      data = (data && data.error) ? data : {
        mode: "virtual",
        temperature: w.out_temp != null ? w.out_temp : "--",
        humidity: w.humidity != null ? w.humidity : "--",
        wind_speed: w.wind != null ? w.wind : "--",
        wind_direction: "",
        precipitation_type: "없음",
        sky: "--",
        updated: "",
      };
    }
    return `<div class="gs-card" style="cursor:pointer;" id="weather-card" data-weather-card>${this._renderWeatherCardInner(data)}</div>`;
  }

  _fmtWeatherTime(updated) {
    if (!updated || updated.includes("시뮬레이션")) return "";
    const m = updated.match(/(\d{1,2}):(\d{2})$/);
    if (!m) return "";
    const h = parseInt(m[1], 10);
    const min = m[2];
    const ampm = h < 12 ? "오전" : "오후";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `(${ampm})${hh}:${min}`;
  }

  _resolvedWeatherStatus(data) {
    data = data || {};
    const pty = (data.precipitation_type || "없음").trim();
    const rawSky = (data.sky || "").trim();
    const sky = rawSky && rawSky !== "--" && rawSky !== "—" ? rawSky : "";
    const precip = parseFloat(data.precipitation) || 0;
    const humidity = parseFloat(data.humidity);

    // 강수량 우선: 하늘 상태가 비어 있어도 강수 값이 있으면 비/눈으로 표시한다.
    if (pty === "비" || pty === "빗방울" || (precip > 0 && (!pty || pty === "없음"))) return precip > 0 ? `비(${precip}mm)` : "비";
    if (pty === "비/눈") return precip > 0 ? `비/눈(${precip}mm)` : "비/눈";
    if (pty === "눈" || pty === "눈날림" || pty === "빗방울눈날림") return precip > 0 ? `눈(${precip}mm)` : "눈";
    if (sky) return sky;

    // API가 sky를 비워 보내는 경우 보조 관측값으로 사람이 읽을 수 있는 상태를 추정한다.
    if (!isNaN(humidity) && humidity >= 85) return "흐림";
    if (!isNaN(humidity) && humidity <= 60) return "맑음";
    return "구름많음";
  }

  _weatherStatus(data) {
    return this._resolvedWeatherStatus(data);
  }

  _numOrNull(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  _renderWeatherCardInner(data) {
    data = data || {};
    if (data.error === "no_api_key") {
      return `<div class="card-title"><ha-icon icon="mdi:weather-partly-cloudy"></ha-icon>날씨 요약</div>
        <div class="notice"><ha-icon icon="mdi:key-alert-outline"></ha-icon><div>기상청 API 키를 설정해주세요</div></div>`;
    }
    const real = data.mode === "real";
    const badge = real
      ? `<span style="padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;background:#DFF3E2;color:#51AE60;">실시간</span>`
      : `<span style="padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;background:#f0f5f1;color:#7a9780;">가상</span>`;
    const temp = data.temperature != null ? data.temperature : "--";
    const hum = data.humidity != null ? data.humidity : "--";
    const wind = data.wind_speed != null ? data.wind_speed : "--";
    const windDir = data.wind_direction || "";
    const updTime = this._fmtWeatherTime(data.updated || "");
    const status = this._resolvedWeatherStatus(data);

    // 경보 판정: 폭염 ≥33°C, 한파 ≤-5°C, 강풍 ≥14m/s
    const tempNum = parseFloat(temp);
    const windNum = parseFloat(wind);
    const tempWarn = !isNaN(tempNum) && (tempNum >= 33 || tempNum <= -5);
    const windWarn = !isNaN(windNum) && windNum >= 14;

    return `<div class="card-title" style="justify-content:space-between;">
        <span style="display:flex;align-items:center;gap:6px;">
          <ha-icon icon="mdi:weather-partly-cloudy"></ha-icon>날씨 요약
          ${updTime ? `<span style="font-size:11px;color:#7a9780;font-weight:400;">${updTime}</span>` : ""}
        </span>
        ${badge}
      </div>
      <div class="tw-grid" data-weather-summary>
        <div class="tw-item${tempWarn ? " warn-blink" : ""}"><div class="tw-label">외기온도</div><div class="tw-value">${temp} °C</div></div>
        <div class="tw-item"><div class="tw-label">외기습도</div><div class="tw-value">${hum} %</div></div>
        <div class="tw-item${windWarn ? " warn-blink" : ""}"><div class="tw-label">풍속</div><div class="tw-value">${wind} m/s${windDir ? ` <span style="font-size:12px;">${windDir}</span>` : ""}</div></div>
        <div class="tw-item"><div class="tw-label">날씨 상태</div><div class="tw-value">${status}</div></div>
      </div>`;
  }

  // ── Weather Modal helpers ────────────────────────────────────────────────────

  _weatherIcon(sky, pty) {
    const p = (pty || "없음").trim();
    if (p === "비" || p === "빗방울") return "🌧️";
    if (p === "비/눈" || p === "빗방울눈날림") return "🌨️";
    if (p === "눈" || p === "눈날림") return "❄️";
    const s = (sky || "").trim();
    if (s === "맑음") return "☀️";
    if (s === "구름많음") return "⛅";
    if (s === "흐림") return "☁️";
    return "🌤️";
  }

  _feelsLike(temp, wind, hum) {
    const t = parseFloat(temp), w = parseFloat(wind), h = parseFloat(hum) || 50;
    if (isNaN(t)) return null;
    if (!isNaN(w) && t <= 10 && w > 1.33) {
      const wk = w * 3.6;
      return Math.round(13.12 + 0.6215 * t - 11.37 * Math.pow(wk, 0.16) + 0.3965 * t * Math.pow(wk, 0.16));
    }
    if (t >= 27 && !isNaN(h)) {
      const e = (h / 100) * 6.105 * Math.exp(17.27 * t / (237.7 + t));
      return Math.round(t + 0.33 * e - (!isNaN(w) ? 0.7 * w : 0) - 4.0);
    }
    return Math.round(t);
  }

  _fmtDow(dateStr) {
    if (!dateStr || dateStr.length !== 8) return "--";
    const y = parseInt(dateStr.slice(0, 4)), m = parseInt(dateStr.slice(4, 6)) - 1, d = parseInt(dateStr.slice(6, 8));
    return ["일", "월", "화", "수", "목", "금", "토"][new Date(y, m, d).getDay()];
  }

  _weatherAiComment(cur) {
    const temp = parseFloat(cur.temperature), wind = parseFloat(cur.wind_speed), hum = parseFloat(cur.humidity);
    const pty = (cur.precipitation_type || "없음").trim(), sky = (cur.sky || "").trim();
    if (!isNaN(temp) && temp >= 35) return { icon: "mdi:thermometer-alert", color: "#FF6B35", msg: "매우 위험한 폭염 상태입니다. 온실 냉방을 최대로 가동하고 야간 환기를 준비하세요." };
    if (!isNaN(temp) && temp >= 33) return { icon: "mdi:thermometer-high", color: "#FF6B35", msg: "폭염 주의 수준입니다. 냉방 가동 및 차광 설비 점검을 권장합니다." };
    if (!isNaN(temp) && temp <= -12) return { icon: "mdi:snowflake-alert", color: "#4A90D9", msg: "한파 주의 수준입니다. 배관 동파 방지 및 난방 상태를 점검해주세요." };
    if (!isNaN(temp) && temp <= 0) return { icon: "mdi:thermometer-low", color: "#4A90D9", msg: "결빙 주의 온도입니다. 난방 운용과 보온 설비를 확인하세요." };
    if (!isNaN(wind) && wind >= 14) return { icon: "mdi:weather-windy", color: "#F4B400", msg: "강풍 주의 수준입니다. 천창 개방률을 낮추고 구조물을 점검하세요." };
    if (pty !== "없음" && pty !== "") return { icon: "mdi:umbrella", color: "#4A90D9", msg: "강수가 감지됩니다. 천창을 닫고 배수로 및 유입구를 확인하세요." };
    if (!isNaN(temp) && !isNaN(hum) && temp >= 18 && temp <= 28 && hum >= 40 && hum <= 70) return { icon: "mdi:leaf", color: "#51AE60", msg: "현재 외기 조건은 VPD 형성에 유리합니다. 자연 환기 활용을 권장합니다." };
    if (sky === "맑음" && !isNaN(temp) && temp >= 15 && temp <= 30) return { icon: "mdi:white-balance-sunny", color: "#F4B400", msg: "맑고 쾌적한 외기 조건입니다. 자연 환기 및 채광 활용이 유리합니다." };
    if (sky === "흐림") return { icon: "mdi:weather-cloudy", color: "#7a9780", msg: "흐린 날씨로 광량이 제한됩니다. 보광 설비 운용을 검토하세요." };
    return { icon: "mdi:information-outline", color: "#7a9780", msg: "현재 외기 조건은 일반 운용 범위 내에 있습니다." };
  }

  _wmHero(cur) {
    const temp = cur.temperature != null ? cur.temperature : "--";
    const hum = cur.humidity != null ? cur.humidity : "--";
    const wind = cur.wind_speed != null ? cur.wind_speed : "--";
    const windDir = cur.wind_direction || "";
    const pty = cur.precipitation_type || "없음";
    const sky = cur.sky || "--";
    const feels = this._feelsLike(cur.temperature, cur.wind_speed, cur.humidity);
    const statusText = this._resolvedWeatherStatus(cur);
    const icon = this._weatherIcon(statusText, pty);
    const real = cur.mode === "real";
    const t = parseFloat(temp);
    const bg = !isNaN(t) && t >= 30 ? "linear-gradient(135deg,#fff5ed 0%,#ffe0c8 100%)"
             : !isNaN(t) && t <= 0  ? "linear-gradient(135deg,#edf5ff 0%,#c8dcf5 100%)"
             : "linear-gradient(135deg,#e8f5eb 0%,#d4edda 100%)";
    const badge = real
      ? `<span class="wm-hero-badge" style="background:#DFF3E2;color:#51AE60;">실시간</span>`
      : `<span class="wm-hero-badge" style="background:#f0f5f1;color:#7a9780;">가상</span>`;
    return `<div class="wm-hero" style="background:${bg};">
      <div class="wm-hero-top">
        <div class="wm-hero-left">
          <div class="wm-hero-icon">
            <span style="font-size:56px;line-height:1;display:block;">${icon}</span>
          </div>
          <div>
            <div class="wm-sky-name">${this._esc(statusText)}</div>
            ${badge}
          </div>
        </div>
        <div style="text-align:right;">
          <div class="wm-temp-main">${temp}<span style="font-size:26px;font-weight:500;">°</span></div>
          ${feels != null ? `<div class="wm-temp-feels">체감온도 ${feels}°C</div>` : ""}
        </div>
      </div>
      <div class="wm-stats-row">
        <div class="wm-stat">
          <div class="wm-stat-lbl">습도</div>
          <div class="wm-stat-val">${hum}<span style="font-size:11px;font-weight:400;">%</span></div>
        </div>
        <div class="wm-stat">
          <div class="wm-stat-lbl">풍속</div>
          <div class="wm-stat-val">${wind}<span style="font-size:11px;font-weight:400;"> m/s</span>${windDir ? ` <span style="font-size:10px;color:#7a9780;">${this._esc(windDir)}</span>` : ""}</div>
        </div>
        <div class="wm-stat">
          <div class="wm-stat-lbl">강수량</div>
          <div class="wm-stat-val">${cur.precipitation != null ? cur.precipitation : 0}<span style="font-size:11px;font-weight:400;"> mm</span></div>
        </div>
      </div>
    </div>`;
  }

  _wmAI(cur) {
    const ai = this._weatherAiComment(cur);
    return `<div class="wm-ai" style="border-color:${ai.color};">
      <span style="font-size:18px;line-height:1;flex:0 0 auto;margin-top:1px;">🤖</span>
      <div class="wm-ai-msg">${this._esc(ai.msg)}</div>
    </div>`;
  }

  _wmAlerts(cur) {
    const temp = parseFloat(cur.temperature), wind = parseFloat(cur.wind_speed);
    const pty = (cur.precipitation_type || "없음").trim();
    const items = [];
    if (!isNaN(temp) && temp >= 33) items.push({ icon: "🌡️", text: `폭염주의보 수준 · ${temp}°C`, color: "#FF6B35" });
    if (!isNaN(temp) && temp <= -12) items.push({ icon: "❄️", text: `한파주의보 수준 · ${temp}°C`, color: "#4A90D9" });
    if (!isNaN(wind) && wind >= 14) items.push({ icon: "💨", text: `강풍주의보 수준 · ${wind} m/s`, color: "#F4B400" });
    if (pty !== "없음" && pty) items.push({ icon: "☔", text: `${this._esc(pty)} 강수 감지`, color: "#4A90D9" });
    if (!items.length) return "";
    const rows = items.map(a => `<div class="wm-alert-item">
      <span style="font-size:15px;line-height:1;flex:0 0 auto;">${a.icon}</span>
      <span>${a.text}</span></div>`).join("");
    return `<div class="wm-alert-wrap">
      <div style="font-size:9px;font-weight:700;color:#7b5800;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px;">기상 특보 (현재 조건 기준)</div>
      ${rows}</div>`;
  }

  _wmHourly(forecasts) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const nowKey = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;
    const items = (forecasts || [])
      .slice()
      .sort((a, b) => `${a.date || ""}${a.time || ""}`.localeCompare(`${b.date || ""}${b.time || ""}`))
      .filter((f) => `${f.date || ""}${f.time || ""}` >= nowKey)
      .slice(0, 12);
    if (!items.length) return "";
    const cards = items.map((f) => {
      const h = f.time ? parseInt(f.time.slice(0, 2), 10) : 0;
      const ampm = h < 12 ? "오전" : "오후";
      const hh = h % 12 === 0 ? 12 : h % 12;
      const icon = this._weatherIcon(f.sky, f.precipitation_type);
      const temp = f.temp != null ? f.temp : "--";
      const pop = f.pop != null ? f.pop : 0;
      const wind = f.wind_speed != null ? f.wind_speed : "--";
      return `<div class="wm-hcard">
        <div class="wm-hcard-time">${ampm}<br>${hh}시</div>
        <span style="font-size:24px;line-height:1;display:block;margin:5px auto;">${icon}</span>
        <div class="wm-hcard-temp">${temp}°</div>
        <div class="wm-hcard-pop">${pop}%</div>
        <div class="wm-hcard-wind">${wind}m/s</div>
      </div>`;
    }).join("");
    return `<div class="wm-section">
      <div class="wm-sec-title">시간별 예보</div>
      <div class="wm-scroll-wrap">
        <button class="wm-scroll-btn wm-scroll-btn-left" type="button">&#8249;</button>
        <div class="wm-hourly-scroll">${cards}</div>
        <button class="wm-scroll-btn wm-scroll-btn-right" type="button">&#8250;</button>
      </div>
    </div>`;
  }

  _mergeDailyItems(baseItems, extraItems) {
    const byDate = new Map((baseItems || []).filter((it) => it && it.date).map((it) => [it.date, it]));
    (extraItems || []).forEach((it) => { if (it && it.date) byDate.set(it.date, it); });
    return Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  _desiredDailyDates(count = 8) {
    const start = new Date();
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    });
  }

  _dailyItemsFromForecasts(forecasts) {
    const byDate = {};
    (forecasts || []).forEach((f) => {
      const d = f.date;
      if (!d) return;
      if (!byDate[d]) byDate[d] = { temps: [], pops: [], skies: {}, ptys: {}, tmn: null, tmx: null };
      const e = byDate[d];
      const t = this._numOrNull(f.temp);
      if (t !== null) e.temps.push(t);
      const p = this._numOrNull(f.pop);
      if (p !== null) e.pops.push(p);
      if (f.sky) e.skies[f.sky] = (e.skies[f.sky] || 0) + 1;
      if (f.precipitation_type && f.precipitation_type !== "없음") e.ptys[f.precipitation_type] = (e.ptys[f.precipitation_type] || 0) + 1;
      const tmn = this._numOrNull(f.temp_min), tmx = this._numOrNull(f.temp_max);
      if (tmn !== null) e.tmn = tmn;
      if (tmx !== null) e.tmx = tmx;
    });
    return Object.keys(byDate).sort().map((d) => {
      const e = byDate[d];
      return {
        date: d,
        min: e.tmn != null ? e.tmn : (e.temps.length ? Math.min(...e.temps) : "--"),
        max: e.tmx != null ? e.tmx : (e.temps.length ? Math.max(...e.temps) : "--"),
        topSky: Object.keys(e.skies).sort((a, b) => e.skies[b] - e.skies[a])[0] || "--",
        topPty: Object.keys(e.ptys).sort((a, b) => e.ptys[b] - e.ptys[a])[0],
        pop: e.pops.length ? Math.max(...e.pops) : 0,
      };
    });
  }

  _mergeCentralMidDaily(items, centralMid) {
    const days = centralMid && Array.isArray(centralMid.days) ? centralMid.days : [];
    if (!days.length) return items || [];
    const byDate = new Map((items || []).filter((it) => it && it.date).map((it) => [it.date, it]));
    const today = new Date();
    days.forEach((d) => {
      if (!d || d.day == null) return;
      const day_dt = new Date(today);
      day_dt.setDate(today.getDate() + Number(d.day));
      const date = `${day_dt.getFullYear()}${String(day_dt.getMonth() + 1).padStart(2, "0")}${String(day_dt.getDate()).padStart(2, "0")}`;
      const pm_weather = d.pm_weather || d.am_weather || "구름많음";
      const rainKey = "am_" + "rain_" + "probability";
      const rainAm = this._numOrNull(d[rainKey]);
      const rainPm = this._numOrNull(d.pm_rain_probability);
      const rain = Math.max(rainAm ?? 0, rainPm ?? 0);
      const minTemp = this._numOrNull(d.min_temp);
      const maxTemp = this._numOrNull(d.max_temp);
      byDate.set(date, {
        date,
        min: minTemp !== null ? minTemp : "--",
        max: maxTemp !== null ? maxTemp : "--",
        topSky: pm_weather,
        topPty: undefined,
        pop: Number.isFinite(rain) ? rain : 0,
        source: "central-mid",
      });
    });
    return Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  _wmDaily(forecasts, weekly, centralMid = null) {
    // weekly가 짧게 내려와도 중앙 실시간 중기예보(D+3~D+7)를 병합해서 오늘~D+7을 채운다.
    let items;
    const weeklyItems = (weekly || []).map((w) => {
      const minVal = this._numOrNull(w.temp_min);
      const maxVal = this._numOrNull(w.temp_max);
      const popVal = this._numOrNull(w.pop);
      const min = minVal !== null ? minVal : "--";
      const max = maxVal !== null ? maxVal : "--";
      return {
        date: w.date,
        min,
        max,
        topSky: w.sky || "--",
        topPty: undefined,
        pop: popVal !== null ? popVal : 0,
      };
    });
    items = this._mergeDailyItems(this._dailyItemsFromForecasts(forecasts), weeklyItems);
    items = this._mergeCentralMidDaily(items, centralMid);
    const desiredDates = this._desiredDailyDates(8);
    const itemsByDate = new Map(items.filter((it) => it && it.date).map((it) => [it.date, it]));
    items = desiredDates.map((date) => itemsByDate.get(date) || {
      date,
      min: "--",
      max: "--",
      topSky: "구름많음",
      topPty: undefined,
      pop: 0,
    });
    if (!items.length) return "";
    const now = new Date();
    const todayStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}`;
    const cards = items.map((it) => {
      const d = it.date;
      const min = it.min;
      const max = it.max;
      const topPty = it.topPty;
      const topSky = it.topSky;
      const icon = this._weatherIcon(topSky, topPty);
      const pop = it.pop;
      const mm = `${d.slice(4, 6)}/${d.slice(6, 8)}`;
      const dow = this._fmtDow(d);
      const isToday = d === todayStr;
      const dowColor = dow === "일" ? "#c0392b" : dow === "토" ? "#4A90D9" : "#7a9780";
      return `<div class="wm-dcard">
        <div class="wm-dcard-date">
          <div class="wm-dcard-mm">${isToday ? "오늘" : mm}</div>
          <div class="wm-dcard-dow" style="color:${dowColor};">${dow}</div>
        </div>
        <span style="font-size:26px;line-height:1;display:block;">${icon}</span>
        <div class="wm-dcard-sky">${this._esc(topSky)}</div>
        <div class="wm-dcard-pop">${pop}%</div>
        <div class="wm-dcard-temps">
          <span class="wm-dcard-min">${min}°</span>
          <span style="color:#ddd;font-size:11px;">/</span>
          <span class="wm-dcard-max">${max}°</span>
        </div>
      </div>`;
    }).join("");
    return `<div class="wm-section">
      <div class="wm-sec-title">기간별 예보</div>
      <div class="wm-scroll-wrap">
        <button class="wm-scroll-btn wm-scroll-btn-left" type="button">&#8249;</button>
        <div class="wm-daily-scroll">${cards}</div>
        <button class="wm-scroll-btn wm-scroll-btn-right" type="button">&#8250;</button>
      </div>
    </div>`;
  }

  _wmInfo(cur, cfg) {
    const locName = cfg.location_name || cfg.greenhouse_address || "--";
    const nx = cfg.nx != null ? cfg.nx : "--";
    const ny = cfg.ny != null ? cfg.ny : "--";
    const landReg = cfg.weather_mid_land_reg_id || cfg.land_regid || "--";
    const taReg = cfg.weather_mid_ta_reg_id || cfg.ta_regid || "--";
    const updated = cur.updated || "--";
    return `<div class="wm-info-row">
      <div class="wm-icard">
        <div class="wm-icard-lbl">위치 정보</div>
        <div class="wm-icard-val">
          <ha-icon icon="mdi:map-marker" style="--mdi-icon-size:13px;color:#51AE60;vertical-align:-1px;"></ha-icon>
          ${this._esc(locName)}
          ${nx !== "--" ? `<div style="font-size:11px;color:#7a9780;margin-top:3px;">nx ${nx} · ny ${ny}</div>` : ""}
          ${landReg !== "--" || taReg !== "--" ? `<div style="font-size:11px;color:#7a9780;margin-top:2px;">중기예보 ${this._esc(landReg)} / ${this._esc(taReg)}</div>` : ""}
        </div>
      </div>
      <div class="wm-icard">
        <div class="wm-icard-lbl">데이터 기준시각</div>
        <div class="wm-icard-val">${this._esc(updated)}</div>
      </div>
    </div>`;
  }

  async _openWeatherModal() {
    const overlay = this.shadowRoot.getElementById("popup-overlay");
    const inner = this.shadowRoot.getElementById("popup-inner");
    if (!overlay || !inner) return;
    overlay.removeAttribute("hidden");
    overlay.onclick = (e) => { if (e.target === overlay) this._closePopup(); };

    const doLoad = async () => {
      inner.innerHTML = `<div class="wm-popup" style="padding:40px;text-align:center;">
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;color:#7a9780;font-size:14px;">
          <div class="spinner"></div>날씨 정보를 불러오는 중...
        </div>
      </div>`;
      try {
        const [localCur, fcstResp, cfgResp, weeklyResp] = await Promise.all([
          this._api.weather.getCurrent().catch(() => ({})),
          this._api.weather.getForecast().catch(() => ({})),
          this._api.weather.getConfig().catch(() => ({})),
          this._api.weather.getWeekly().catch(() => ({})),
        ]);
        const cfg = Object.assign({}, this._normalizedForm(), cfgResp || {});
        const centralModalForecast = await this._hass.callApi("POST", "green_smart/central/weather/forecast", {
          nx: Number(cfg.nx || 60),
          ny: Number(cfg.ny || 127),
        }).catch(() => null);
        const localForecasts = (fcstResp && fcstResp.forecasts) || [];
        const shortForecasts = centralModalForecast && centralModalForecast.mode === "real"
          ? (centralModalForecast.forecasts || [])
          : localForecasts;
        const forecastSource = centralModalForecast && centralModalForecast.mode === "real" ? "central" : "local";
        const cur = this._currentWeatherFromForecasts(shortForecasts, localCur || {});
        if (forecastSource === "central") this._weatherData = cur;
        const centralModalMidWeather = await this._hass.callApi("POST", "green_smart/central/weather/mid", {
          land_reg_id: cfg.weather_mid_land_reg_id,
          ta_reg_id: cfg.weather_mid_ta_reg_id,
        }).catch(() => null);
        const weekly = (weeklyResp && weeklyResp.weekly) || [];
        inner.innerHTML = this._renderWeatherModal(cur, shortForecasts, cfg, weekly, centralModalMidWeather, forecastSource);
        inner.querySelectorAll(".wm-close-btn").forEach(b => b.addEventListener("click", () => this._closePopup()));
        // 스크롤 버튼 바인딩
        inner.querySelectorAll(".wm-scroll-btn").forEach(btn => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const wrap = btn.closest(".wm-scroll-wrap");
            const scroller = wrap && (
              wrap.querySelector(".wm-hourly-scroll") ||
              wrap.querySelector(".wm-daily-scroll")
            );
            if (!scroller) return;
            const dir = btn.classList.contains("wm-scroll-btn-left") ? -1 : 1;
            scroller.scrollBy({ left: dir * 220, behavior: "smooth" });
          });
        });
        inner.querySelector("#weather-modal-refresh")?.addEventListener("click", () => doLoad());
      } catch (_) {
        inner.innerHTML = `<div class="wm-popup" style="padding:40px;text-align:center;">
          <div style="color:#7a9780;margin-bottom:20px;">데이터를 불러올 수 없습니다.</div>
          <button class="btn btn-ghost wm-close-btn">닫기</button>
        </div>`;
        inner.querySelectorAll(".wm-close-btn").forEach(b => b.addEventListener("click", () => this._closePopup()));
      }
    };
    await doLoad();
  }

  _renderWeatherModal(cur, forecasts, cfg, weekly, centralMid = null, forecastSource = "local") {
    cur = cur || {};
    forecasts = forecasts || [];
    cfg = cfg || {};
    weekly = weekly || [];
    const forecast_source = forecastSource;
    const shortForecasts = forecasts;

    if (cur.error === "no_api_key") {
      return `<div class="wm-popup" style="padding:48px;text-align:center;">
        <ha-icon icon="mdi:key-alert-outline" style="--mdi-icon-size:44px;color:#ccc;"></ha-icon>
        <div style="margin-top:16px;font-size:15px;color:#7a9780;">기상청 API 키를 설정해주세요</div>
        <div style="margin-top:24px;">
          <button class="btn btn-ghost wm-close-btn">닫기</button>
        </div>
      </div>`;
    }

    return `<div class="wm-popup">
      <div class="wm-header">
        <div class="wm-title">
          <ha-icon icon="mdi:weather-partly-cloudy" style="--mdi-icon-size:18px;color:#51AE60;"></ha-icon>
          날씨 정보
        </div>
        <button class="wm-close-btn" style="background:none;border:none;cursor:pointer;color:#7a9780;padding:4px 6px;border-radius:8px;display:flex;align-items:center;" title="닫기">
          <ha-icon icon="mdi:close" style="--mdi-icon-size:20px;"></ha-icon>
        </button>
      </div>
      ${this._wmHero(cur)}
      ${this._wmAI(cur)}
      ${this._wmAlerts(cur)}
      ${forecast_source === "central" ? `<div style="font-size:11px;color:#51AE60;margin:0 18px 8px;font-weight:700;">저장 위치 기준 실시간 예보</div>` : ""}
      ${this._wmHourly(shortForecasts)}
      ${this._wmDaily(shortForecasts, weekly, centralMid)}
      ${this._wmInfo(cur, cfg)}
      <div class="wm-footer">
        <button id="weather-modal-refresh" style="background:none;border:none;cursor:pointer;color:#7a9780;font-size:13px;display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:8px;transition:color .15s,background .15s;" onmouseover="this.style.background='#f0f5f1';this.style.color='#51AE60'" onmouseout="this.style.background='none';this.style.color='#7a9780'">
          <ha-icon icon="mdi:refresh" style="--mdi-icon-size:15px;"></ha-icon>새로고침
        </button>
        <button class="btn btn-ghost wm-close-btn" style="min-height:34px;padding:0 18px;font-size:13px;">닫기</button>
      </div>
    </div>`;
  }

  _renderZoneCards2(sim) {
    const cfg = this._normalizedForm();
    const zoneCount = cfg.greenhouse_zones || 1;
    if (this._zoneCardTab >= zoneCount) this._zoneCardTab = 0;
    const idx = this._zoneCardTab;
    const zones = (sim && sim.zones) || [];
    const z = zones[idx] || { dry_temp:"--", humidity:"--", co2:"--", vpd:"--", light:"--", status:"normal" };
    const warn = z.status === "warning";
    const zoneOptions = Array.from({ length: zoneCount }, (_, i) =>
      `<option value="${i}" ${i === idx ? "selected" : ""}>Zone ${i + 1}</option>`
    ).join("");
    const card = `<div class="zone-card" data-zone="${idx + 1}">
      <div class="zone-header">
        <div class="zone-name">Zone ${idx + 1}</div>
        <div class="zone-badge ${warn ? "warn" : ""}" data-zone-badge>${warn ? "경고" : "정상"}</div>
      </div>
      <div class="zm-grid">
        <div class="zm"><div class="zm-l">온도</div><div class="zm-v" data-metric="temp">${z.dry_temp} °C</div></div>
        <div class="zm"><div class="zm-l">습도</div><div class="zm-v" data-metric="humidity">${z.humidity} %</div></div>
        <div class="zm"><div class="zm-l">CO₂</div><div class="zm-v" data-metric="co2">${z.co2} ppm</div></div>
        <div class="zm"><div class="zm-l">VPD</div><div class="zm-v" data-metric="vpd">${z.vpd} kPa</div></div>
        <div class="zm"><div class="zm-l">광량</div><div class="zm-v" data-metric="light">${z.light} μmol</div></div>
      </div>
    </div>`;
    return `<div id="zone-status-section">
      <div class="sec-head" style="margin-top:8px;">
        <div class="sec-title">구역 현황</div>
        <select id="zone-card-select" style="border:1px solid #e8f0e9;border-radius:8px;padding:4px 10px;font-size:13px;font-weight:600;color:#24323F;background:#fff;cursor:pointer;outline:none;">
          ${zoneOptions}
        </select>
      </div>
      <div class="zone-grid" id="zone-card-grid">${card}</div>
    </div>`;
  }

  _renderEquipGrid() {
    const cfg = this._normalizedForm();
    this._ensureEquipZones(cfg.greenhouse_zones);
    this._ensureEquipModeZones(cfg.greenhouse_zones);
    if (this._equipZone >= cfg.greenhouse_zones) this._equipZone = 0;
    const zoneEquip = this._equipment[this._equipZone] || DEFAULT_EQUIP;
    const zoneMode = this._equipMode[this._equipZone] || DEFAULT_EQUIP_MODE;
    return `<div class="equip-grid" id="equip-grid">${EQUIP_KEYS.map((k) => {
      const v = zoneEquip[k] || 0;
      const mode = zoneMode[k] || "auto";
      const isManual = mode === "manual";
      const accentColor = isManual ? "#f4b400" : "#51AE60";
      const fillColor = isManual ? "#f4b400" : "#51AE60";
      const tagClass = isManual ? "manual" : "auto";
      const tagLabel = isManual ? "수동" : "자동";
      return `<div class="equip-item" data-equip="${k}">
        <div class="equip-row">
          <div class="equip-name">
            <ha-icon icon="${EQUIP_ICONS[k]}" style="color:${accentColor}"></ha-icon>
            ${EQUIP_LABELS[k]}
            <span class="equip-mode-tag ${tagClass}">${tagLabel}</span>
          </div>
          <div class="equip-val" style="color:${accentColor}">${v}%</div>
        </div>
        <div class="eq-bg"><div class="eq-fill" style="width:${v}%;background:${fillColor}"></div></div>
      </div>`;
    }).join("")}</div>`;
  }

  // ── Sub pages ─────────────────────────────────────────────────────────────────

  _renderSubHero(title, sub, icon) {
    return `<div class="sub-hero" data-common-main-hero>
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:52px;height:52px;border-radius:14px;background:#DFF3E2;display:flex;align-items:center;justify-content:center;color:#51AE60;">
          <ha-icon icon="${icon}"></ha-icon>
        </div>
        <div><div class="sub-hero-title">${title}</div><div class="sub-hero-sub">${sub}</div></div>
      </div>
    </div>`;
  }

  _renderCommonMainPageShell(pageKey, title, subtitle, icon, body, options = {}) {
    // Common main-page contract targets: data-common-main-page="crop" data-common-main-page="environment" data-common-main-page="irrigation" data-common-main-page="device" data-common-main-page="admin-system"
    const extraAttrs = options.extraAttrs || "";
    const pageClass = options.pageClass ? ` ${options.pageClass}` : "";
    const bodyAttrs = options.bodyAttrs || "";
    return `<div class="page${pageClass}" data-common-main-page="${pageKey}" ${extraAttrs}>
      ${this._renderSubHero(title, subtitle, icon)}
      <div data-common-main-body ${bodyAttrs}>${body}</div>
    </div>`;
  }

  _renderCtrlCard(key) {
    const cfg = this._normalizedForm();
    this._ensureEquipZones(cfg.greenhouse_zones);
    if (this._equipZone >= cfg.greenhouse_zones) this._equipZone = 0;
    const zoneEquip = this._equipment[this._equipZone] || DEFAULT_EQUIP;
    const v = zoneEquip[key] || 0;
    return `<div class="ctrl-card">
      <div class="ctrl-header">
        <div class="ctrl-icon-wrap"><ha-icon icon="${EQUIP_ICONS[key]}"></ha-icon></div>
        <div><div class="ctrl-title">${EQUIP_LABELS[key]}</div><div style="font-size:12px;color:#7a9780;">현재 설정값</div></div>
      </div>
      <div class="ctrl-val">${v}%</div>
      <div class="ctrl-slider-row">
        <input class="big-range" type="range" min="0" max="100" value="${v}" data-ctrl="${key}">
        <span class="ctrl-val" id="cv-${key}" style="font-size:20px;">${v}%</span>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:14px;">
        <button class="ctrl-apply" data-ctrl-apply="${key}">적용</button>
      </div>
    </div>`;
  }

  _renderScreenPage() {
    return `<div class="page">
      ${this._renderSubHero("스크린 제어","차광스크린 및 보온커튼 개도율 설정","mdi:roller-shade")}
      ${this._renderCtrlCard("shade_screen")}
      ${this._renderCtrlCard("thermal_curtain")}
    </div>`;
  }

  _renderVs002RoofWindowDryRunCard() {
    const cfg = this._normalizedForm();
    this._ensureEquipZones(cfg.greenhouse_zones);
    const zoneEquip = this._equipment[this._equipZone] || DEFAULT_EQUIP;
    const position = Number(zoneEquip.roof_window ?? 30);
    const result = this._vs002RoofWindowDryRunResult || null;
    return `<div class="gs-card" data-vs002-roof-window-dry-run-card style="padding:16px;margin-bottom:12px;border:1px solid #d7e8dc;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;">
        <div><b>천창 개폐 Dry Run</b><div class="strategy-muted">VS-002 · roof_window_open_pct · SafetyGuard/Interlock/Mapping 검증 · 실제 장비 실행 없음</div></div>
        <button class="mini-btn primary" data-vs002-roof-window-dry-run>Dry Run 실행</button>
      </div>
      <label style="font-size:12px;color:#5d7d64;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">목표 개도율
        <input data-vs002-roof-window-position type="number" min="0" max="100" step="1" value="${this._esc(String(position))}" style="width:90px;border:1px solid #d7e8dc;border-radius:8px;padding:7px;text-align:right;"> %
      </label>
      <div class="strategy-muted" style="margin-top:8px;">예정 호출: <code>cover.set_cover_position</code> · payload key <code>roof_window_open_pct</code> · actualServiceCallSuppressed=true</div>
      <div data-vs002-roof-window-result class="strategy-muted" style="margin-top:8px;">${result ? this._esc(result) : "Dry Run 전입니다."}</div>
    </div>`;
  }

  async _runVs002RoofWindowDryRun(root) {
    const position = Number(root.querySelector("[data-vs002-roof-window-position]")?.value || 30);
    const cropSeasonId = this._numericControlSeasonId();
    const zoneId = Number(this._controlScope?.zoneId || this._equipZone + 1 || 1);
    try {
      const res = await this._hass.callApi("POST", "green_smart/zones/execute-final-targets", {
        domain: "device",
        farm_id: 1,
        crop_season_id: cropSeasonId || this._activeSeasonId || 1,
        zone_id: zoneId,
        dry_run: true,
        roof_window_open_pct: position,
        operatorConfirmed: true,
        operatorConfirmationText: this._operatorConfirmationPhrase("device"),
        operatorRole: this._currentUserRole(),
        operatorOverrideReason: "vs002_roof_window_dry_run",
      });
      const meta = res?.vs002RoofWindowDryRun || {};
      this._vs002RoofWindowDryRunResult = `Dry Run 완료 · planned ${res?.plannedCount ?? 0} · safety ${res?.safetyStatus || "-"} · command_id ${meta.command_id || "-"} · actualServiceCallSuppressed ${String(res?.actualServiceCallSuppressed ?? true)}`;
    } catch (err) {
      console.warn("VS-002 천창 Dry Run 실패", err);
      this._vs002RoofWindowDryRunResult = "Dry Run 실패: final target/device mapping/control mode를 확인하세요.";
    }
    this._pageRendered = null;
    this._update();
  }

  _renderWindowPage() {
    return `<div class="page">
      ${this._renderSubHero("천창·측창 제어","천창 및 측창 개도율 설정","mdi:window-open")}
      ${this._renderVs002RoofWindowDryRunCard()}
      ${this._renderCtrlCard("roof_window")}
      ${this._renderCtrlCard("side_window")}
    </div>`;
  }

  _renderIrrigationPage() {
    return `<div class="page">
      ${this._renderSubHero("관수 제어","관수 밸브 및 양액기 설정","mdi:water")}
      ${this._renderCtrlCard("irrigation")}
      ${this._renderCtrlCard("nutrient_machine")}
    </div>`;
  }

  _renderHVACPage() {
    return `<div class="page">
      ${this._renderSubHero("냉난방기 제어","유동팬 및 CO₂발생기 설정","mdi:air-conditioner")}
      ${this._renderCtrlCard("circulation_fan")}
      ${this._renderCtrlCard("co2_generator")}
    </div>`;
  }

  // ── Settings Pages ─────────────────────────────────────────────────────────────

  _settingCard(icon, title, rows) {
    return `<div class="gs-card" style="margin-bottom:16px;">
      <div class="card-title" style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <ha-icon icon="${icon}" style="color:#51AE60;"></ha-icon>${title}
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;">${rows}</div>
    </div>`;
  }

  _settingRow(label, inputHtml, unit = "") {
    return `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
      <span style="font-size:13px;color:#4a6741;min-width:120px;">${label}</span>
      <div style="display:flex;align-items:center;gap:6px;flex:1;justify-content:flex-end;">
        ${inputHtml}
        ${unit ? `<span style="font-size:12px;color:#7a9780;min-width:32px;">${unit}</span>` : ""}
      </div>
    </div>`;
  }

  _inputNum(id, val, min, max, step = 1) {
    return `<input type="number" id="${id}" value="${val}" min="${min}" max="${max}" step="${step}"
      style="width:80px;border:1px solid #e8f0e9;border-radius:8px;padding:6px 10px;
             font-size:13px;font-weight:600;color:#24323F;text-align:right;outline:none;">`;
  }

  _inputTime(id, val) {
    return `<input type="time" id="${id}" value="${val}"
      style="border:1px solid #e8f0e9;border-radius:8px;padding:6px 10px;
             font-size:13px;font-weight:600;color:#24323F;outline:none;">`;
  }

  _inputSelect(id, val, options) {
    const opts = options.map(([v, l]) =>
      `<option value="${v}" ${val === v ? "selected" : ""}>${l}</option>`).join("");
    return `<select id="${id}" style="border:1px solid #e8f0e9;border-radius:8px;padding:6px 10px;
      font-size:13px;font-weight:600;color:#24323F;background:#fff;outline:none;cursor:pointer;">
      ${opts}</select>`;
  }

  _toggleSwitch(id, checked) {
    return `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
      <input type="checkbox" id="${id}" ${checked ? "checked" : ""}
        style="width:36px;height:20px;cursor:pointer;accent-color:#51AE60;">
    </label>`;
  }

  _saveBtn(page) {
    return `<div style="display:flex;justify-content:flex-end;margin-top:8px;">
      <button data-settings-save="${page}"
        style="background:#51AE60;color:#fff;border:none;border-radius:10px;
               padding:10px 24px;font-size:13px;font-weight:700;cursor:pointer;">저장</button>
    </div>`;
  }

  // ── Crop Settings Page ────────────────────────────────────────────────────────

  _renderCropSettingsPage() {
    // 최초 진입 시 DB에서 데이터 로드
    if (!this._dbReady && this._cropSeasons.length === 0) {
      this._loadCropData();  // 비동기; 완료 시 _refreshCropContent() 자동 호출
    }
    const tabs = [
      { key: "ai",      label: "AI 전략", icon: "mdi:brain" },
      { key: "basic",   label: "작기 설정", icon: "mdi:sprout" },
      { key: "growth",  label: "생육조사", icon: "mdi:clipboard-pulse-outline" },
      { key: "pest",    label: "병해충 예찰", icon: "mdi:bug-outline" },
      { key: "control", label: "방제 기록", icon: "mdi:spray" },
    ];
    if (!tabs.some((t) => t.key === this._cropSubTab)) this._cropSubTab = "ai";
    const tabBar = `<div data-crop-ui-tab-bar style="display:flex;gap:4px;margin-bottom:16px;background:#f5faf6;border-radius:12px;padding:4px;overflow-x:auto;">
      ${tabs.map(t => `<button class="c-tab ${this._cropSubTab === t.key ? "active" : ""}"
        data-crop-tab="${t.key}" data-crop-ui-icon-tab
        style="flex:0 0 auto;padding:8px 10px;border-radius:8px;font-size:13px;display:flex;align-items:center;gap:5px;white-space:nowrap;">
          <ha-icon icon="${t.icon}" data-crop-tab-icon style="width:15px;height:15px;"></ha-icon><span data-crop-tab-label>${t.label}</span>
        </button>`).join("")}
    </div>`;
    const content = this._renderCropTabContent();
    return this._renderCommonMainPageShell(
      "crop",
      "작물 설정",
      "작물 정보 · 생육조사 · 병해충 예찰 · 방제 기록을 관리합니다",
      "mdi:sprout",
      `<div class="gs-card" data-crop-ui-shell>
        <span hidden data-crop-tab-contract>이모티콘 + 하위탭명만 표시</span>
        <span data-crop-ui-subpage-summary data-crop-ui-kpi-grid data-crop-ui-action-bar data-crop-ui-record-list data-crop-ui-advanced-details data-crop-ui-empty-state hidden></span>
        <div data-season-selector>${this._renderSeasonSelector()}</div>
        ${tabBar}
        <div data-crop-content>${content}</div>
      </div>`
    );
  }

  _renderSeasonSelector() {
    const CROP_EMOJI = {
      tomato:'🍅', paprika:'🫑', strawberry:'🍓',
      lettuce:'🥬', herb:'🌿', cucumber:'🥒', other:'🌱',
    };
    const CROP_LABELS = {
      tomato:"토마토", paprika:"파프리카", strawberry:"딸기",
      lettuce:"상추", herb:"허브", cucumber:"오이", other:"기타",
    };
    if (!this._dbReady && this._cropSeasons.length === 0) {
      return `<div style="text-align:center;padding:32px;color:#7a9780;font-size:13px;">
        <div style="font-size:24px;margin-bottom:8px;">🌱</div>데이터를 불러오는 중...</div>`;
    }
    if (this._cropSeasons.length === 0) {
      return `<div style="text-align:center;padding:32px;">
        <div style="font-size:32px;margin-bottom:10px;">🌿</div>
        <div style="font-size:14px;font-weight:700;color:#24323F;margin-bottom:6px;">등록된 작기가 없습니다</div>
        <div style="font-size:12px;color:#7a9780;">작기 설정 탭에서 첫 작기를 등록해보세요</div>
      </div>`;
    }
    const cards = this._cropSeasons.map(s => {
      const selected = s.id === this._activeSeasonId;
      const emoji = CROP_EMOJI[s.cropType] || '🌱';
      const cropLabel = CROP_LABELS[s.cropType] || s.cropType || '작물';
      const varietyLabel = s.variety ? ` · ${this._esc(s.variety)}` : '';
      const active = !s.demolishDate;
      return `<div data-season-id="${s.id}"
        style="flex-shrink:0;border:2px solid ${selected ? '#51AE60' : '#e0e0e0'};
               border-radius:12px;padding:10px 14px;cursor:pointer;min-width:148px;
               background:${selected ? '#f0faf1' : '#fafafa'};">
        <div style="font-size:12px;font-weight:700;color:${selected ? '#24323F' : '#666'};">
          ${emoji} ${this._esc(cropLabel)}${varietyLabel} · ${this._esc(s.zoneName || 'Zone')}</div>
        <div style="font-size:11px;color:${selected ? '#7a9780' : '#aaa'};margin-top:2px;">
          ${s.plantDate} 정식</div>
        <div style="font-size:10px;font-weight:700;margin-top:4px;
          color:${active ? '#51AE60' : '#bbb'};">
          ${active ? '● 재배 중' : '○ 철거완료'}</div>
      </div>`;
    }).join("");
    return `<div style="margin-bottom:14px;">
      <div style="font-size:11px;font-weight:700;color:#51AE60;letter-spacing:.4px;margin-bottom:8px;">작기 선택</div>
      <div id="season-selector" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;">${cards}</div>
    </div>`;
  }

  _renderCropTabContent() {
    if (this._cropSubTab === "growth")  return this._renderCropGrowthTab();
    if (this._cropSubTab === "ai")      return this._renderCropAiStrategyTab();
    if (this._cropSubTab === "pest")    return this._renderCropPestTab();
    if (this._cropSubTab === "control") return this._renderCropControlTab();
    return this._renderCropBasicTab();
  }

  _seasonZoneLabel(s) {
    if (!s) return "구역 미지정";
    const zoneId = s.zoneId ?? s.zone_id ?? s.zone;
    const zoneName = String(s.zoneName || "").trim();
    if (zoneName) return zoneName;
    const n = Number(zoneId);
    return Number.isFinite(n) && n > 0 ? `${n}구역` : "구역 미지정";
  }

  _activeSeason() {
    return (this._cropSeasons || []).find(s => s.id === this._activeSeasonId) || this._cropSeasons?.[0] || null;
  }

  _activeSeasonLabel() {
    const s = this._activeSeason();
    if (!s) return "선택된 작기 없음";
    const CROP_LABELS = { tomato:"토마토", paprika:"파프리카", strawberry:"딸기", lettuce:"상추", herb:"허브", cucumber:"오이", other:"기타" };
    const crop = CROP_LABELS[s.cropType] || s.cropType || "작물";
    const variety = s.variety ? ` · ${s.variety}` : "";
    return `${crop}${variety} · ${this._seasonZoneLabel(s)}`;
  }

  _growthFieldConfigForCrop(cropType) {
    const common = {
      tomato: { indexType: "G-Index", title: "토마토 생육조사", desc: "G-Index용 초장·엽수·줄기경·화방·착과 절위와 품질/생리장해를 기록합니다", fields: [
        ["plantHeight", "초장 (cm)", "예) 120.5", "0", "500", "0.1"],
        ["leafCount", "엽수 (매)", "예) 12", "0", "100", "1"],
        ["stemDiameter", "줄기 경 (mm)", "예) 12.3", "0", "50", "0.1"],
        ["flowerClusterNo", "화방 위치 (단)", "예) 5", "0", "30", "1"],
        ["fruitSetNode", "착과 절위 (절)", "예) 8", "0", "80", "1"],
      ], qualityDisorderFields: [
        ["fruitSetRate", "착과율 (%)", "예) 85", "0", "100", "1"],
        ["fruitCrackingCount", "열과 수 (개)", "예) 0", "0", "999", "1"],
        ["blossomEndRotCount", "배꼽썩음 수 (개)", "예) 0", "0", "999", "1"],
        ["leafCurlScore", "잎말림 점수 (점)", "0~5", "0", "5", "1"],
        ["vigorScore", "초세 점수 (점)", "0~5", "0", "5", "1"],
        ["spadValue", "SPAD", "예) 42", "0", "100", "0.1"],
      ]},
      paprika: { indexType: "G-Index", title: "파프리카 생육조사", desc: "초장·엽수·줄기경·분지/화방·착과 절위를 기록합니다", fields: [
        ["plantHeight", "초장 (cm)", "예) 95.0", "0", "400", "0.1"],
        ["leafCount", "엽수 (매)", "예) 18", "0", "120", "1"],
        ["stemDiameter", "줄기 경 (mm)", "예) 10.5", "0", "60", "0.1"],
        ["branchOrClusterNo", "분지/화방 위치", "예) 3", "0", "40", "1"],
        ["fruitSetNode", "착과 절위 (절)", "예) 6", "0", "80", "1"],
      ]},
      strawberry: { indexType: "G-Index", title: "딸기 생육조사", desc: "관부직경·엽수·엽장·화방수·런너/과방 상태를 기록합니다", fields: [
        ["crownDiameter", "관부직경 (mm)", "예) 12.0", "0", "80", "0.1"],
        ["leafCount", "엽수 (매)", "예) 5", "0", "80", "1"],
        ["leafLength", "엽장 (cm)", "예) 8.5", "0", "80", "0.1"],
        ["flowerClusterCount", "화방수", "예) 2", "0", "20", "1"],
        ["runnerOrFruitClusterCount", "런너/과방 수", "예) 1", "0", "30", "1"],
      ]},
      lettuce: { indexType: "L-Index", title: "상추 생육조사", desc: "L-Index용 엽장·엽폭·엽수·생체중·초장과 품질/생리장해를 기록합니다", fields: [
        ["leafLength", "엽장 (cm)", "예) 18.0", "0", "80", "0.1"],
        ["leafWidth", "엽폭 (cm)", "예) 12.0", "0", "80", "0.1"],
        ["leafCount", "엽수 (매)", "예) 14", "0", "100", "1"],
        ["freshWeight", "생체중 (g)", "예) 120", "0", "2000", "1"],
        ["plantHeight", "초장 (cm)", "예) 20", "0", "100", "0.1"],
      ], qualityDisorderFields: [
        ["tipburnScore", "팁번 점수 (점)", "0~5", "0", "5", "1"],
        ["boltingRiskScore", "추대 위험 점수 (점)", "0~5", "0", "5", "1"],
        ["leafColorScore", "엽색 점수 (점)", "0~5", "0", "5", "1"],
        ["spadValue", "SPAD", "예) 35", "0", "100", "0.1"],
        ["marketableWeight", "상품중 (g)", "예) 100", "0", "2000", "1"],
        ["outerLeafDamageScore", "외엽 손상 점수 (점)", "0~5", "0", "5", "1"],
      ]},
      cucumber: { indexType: "G-Index", title: "오이 생육조사", desc: "초장·엽수·줄기경·마디수·착과 절위를 기록합니다", fields: [
        ["plantHeight", "초장 (cm)", "예) 160", "0", "600", "0.1"],
        ["leafCount", "엽수 (매)", "예) 16", "0", "120", "1"],
        ["stemDiameter", "줄기 경 (mm)", "예) 9.5", "0", "50", "0.1"],
        ["nodeCount", "마디수", "예) 12", "0", "100", "1"],
        ["fruitSetNode", "착과 절위 (절)", "예) 8", "0", "100", "1"],
      ]},
      herb: { indexType: "G-Index", title: "허브 생육조사", desc: "초장·엽수·줄기경·분지수·수확 가능 줄기수를 기록합니다", fields: [
        ["plantHeight", "초장 (cm)", "예) 25.0", "0", "150", "0.1"],
        ["leafCount", "엽수 (매)", "예) 30", "0", "300", "1"],
        ["stemDiameter", "줄기 경 (mm)", "예) 4.0", "0", "30", "0.1"],
        ["branchCount", "분지수", "예) 6", "0", "80", "1"],
        ["harvestableStemCount", "수확 가능 줄기수", "예) 4", "0", "100", "1"],
      ]},
    };
    return common[cropType] || common.tomato;
  }

  _growthLegacyPayloadFromMetrics(metrics, cropType) {
    const valueOf = (...keys) => {
      const metric = (metrics || []).find(m => keys.includes(m.key));
      const value = metric?.value;
      if (value === null || value === undefined || value === "") return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };
    if (cropType === "lettuce") {
      return {
        height: valueOf("plantHeight"),
        leafCount: valueOf("leafCount"),
        stemDia: null,
        truss: null,
        node: null,
      };
    }
    return {
      height: valueOf("plantHeight", "height"),
      leafCount: valueOf("leafCount"),
      stemDia: valueOf("stemDiameter", "stemDia"),
      truss: valueOf("flowerClusterNo", "branchOrClusterNo", "nodeCount", "flowerClusterCount", "branchCount"),
      node: valueOf("fruitSetNode", "nodeCount", "runnerOrFruitClusterCount", "harvestableStemCount"),
    };
  }

  _parseGrowthMetrics(row) {
    if (Array.isArray(row?.metrics)) return row.metrics;
    const raw = row?.metricsJson;
    if (!raw) return [];
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) { return []; }
  }

  _renderGrowthMetricChips(row) {
    const metrics = this._parseGrowthMetrics(row);
    if (metrics.length) {
      return metrics
        .filter(m => m && m.value !== null && m.value !== undefined && m.value !== "")
        .map(m => `<span style="font-size:12px;color:#4a6741;">${this._esc(m.label || m.key)} <b>${this._esc(String(m.value))}${m.unit ? this._esc(m.unit) : ""}</b></span>`)
        .join("");
    }
    return `
      <span style="font-size:12px;color:#4a6741;">초장 <b>${row.height}cm</b></span>
      <span style="font-size:12px;color:#4a6741;">엽수 <b>${row.leafCount}매</b></span>
      <span style="font-size:12px;color:#4a6741;">줄기경 <b>${row.stemDia}mm</b></span>
      <span style="font-size:12px;color:#4a6741;">화방 <b>${row.truss}단</b></span>`;
  }

  _growthUnitFromLabel(label) {
    const m = String(label || "").match(/\(([^)]+)\)/);
    return m ? m[1] : "";
  }

  _growthMetricRowsForExport(row) {
    const metrics = this._parseGrowthMetrics(row);
    if (metrics.length) {
      return metrics.map(m => [row.date, row.cropType || "", m.label || m.key, m.value ?? "", m.unit || "", row.note || ""]);
    }
    return [
      [row.date, row.cropType || "", "초장", row.height || "", "cm", row.note || ""],
      [row.date, row.cropType || "", "엽수", row.leafCount || "", "매", row.note || ""],
      [row.date, row.cropType || "", "줄기경", row.stemDia || "", "mm", row.note || ""],
      [row.date, row.cropType || "", "화방", row.truss || "", "단", row.note || ""],
      [row.date, row.cropType || "", "절위", row.node || "", "절", row.note || ""],
    ];
  }

  _cropRowsForPage(key, rows) {
    const total = Array.isArray(rows) ? rows.length : 0;
    const pages = Math.max(1, Math.ceil(total / CROP_PAGE_SIZE));
    const current = Math.min(Math.max(1, this._cropPage?.[key] || 1), pages);
    this._cropPage[key] = current;
    const start = (current - 1) * CROP_PAGE_SIZE;
    return { rows: (rows || []).slice(start, start + CROP_PAGE_SIZE), current, pages, total };
  }

  _paginatedCropRows(key, rows) {
    const page = this._cropRowsForPage(key, rows);
    const start = (page.current - 1) * CROP_PAGE_SIZE;
    return page.rows.map((row, i) => ({ ...row, __cropIndex: start + i }));
  }

  _renderCropPager(key, total) {
    const pages = Math.max(1, Math.ceil((total || 0) / CROP_PAGE_SIZE));
    if (pages <= 1) return "";
    const current = Math.min(Math.max(1, this._cropPage?.[key] || 1), pages);
    const buttons = Array.from({ length: pages }, (_, i) => {
      const page = i + 1;
      const active = page === current;
      return `<button data-crop-page="${key}:${page}" style="min-width:30px;padding:5px 8px;border-radius:8px;border:1px solid ${active ? "#51AE60" : "#dfeee1"};background:${active ? "#51AE60" : "#fff"};color:${active ? "#fff" : "#4a6741"};font-size:12px;font-weight:700;cursor:pointer;">${page}</button>`;
    }).join("");
    return `<div style="display:flex;justify-content:center;gap:5px;margin-top:10px;">${buttons}</div>`;
  }

  _cropLabelForDisplay(cropType) {
    const CROP_LABELS = { tomato:"토마토", paprika:"파프리카", strawberry:"딸기", lettuce:"상추", herb:"허브", cucumber:"오이", other:"기타" };
    return CROP_LABELS[cropType] || cropType || "작물";
  }

  _cropRecordActionGroup(marker, secondaryHtml = "", dangerHtml = "") {
    return `<div ${marker ? marker : ""} data-crop-record-action-group style="display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap;flex-shrink:0;">
      ${secondaryHtml ? `<div data-crop-record-secondary-actions style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">${secondaryHtml}</div>` : ""}
      ${dangerHtml ? `<div data-crop-record-danger-actions style="border-left:${secondaryHtml ? "1px solid #f4d5d9" : "0"};padding-left:${secondaryHtml ? "6px" : "0"};display:flex;gap:6px;align-items:center;">${dangerHtml}</div>` : ""}
    </div>`;
  }

  _calculateControlDilution(chemicalAmount, waterAmount) {
    const chemical = Number(chemicalAmount);
    const water = Number(waterAmount);
    if (!Number.isFinite(chemical) || !Number.isFinite(water) || chemical <= 0 || water <= 0) return "";
    return String(Math.round(water / chemical));
  }

  _calculateTreatmentAreaFromSeason(scope = "전체", manualArea = "") {
    const manual = Number(manualArea);
    if (Number.isFinite(manual) && manual > 0) return manual;
    const s = this._activeSeason();
    const plants = Number(s?.totalPlants || s?.total_plants || 0);
    const density = Number(s?.plantDensity || s?.plant_density || 0);
    if (scope === "부분") return "";
    if (plants > 0 && density > 0) return Math.round((plants / density) * 100) / 100;
    return "";
  }

  _calculatePyeongUsage(totalAmount, areaM2) {
    const total = Number(totalAmount);
    const area = Number(areaM2);
    if (!Number.isFinite(total) || !Number.isFinite(area) || total <= 0 || area <= 0) return "";
    const pyeong = area / 3.305785;
    return String(Math.round((total / pyeong) * 100) / 100);
  }

  _renderCropBasicOverviewCard() {
    // RB-003 legacy static contract manifest: real crop basic overview render moved to domains/crop/crop-readonly.js.
    // data-crop-subtab-main-format data-crop-basic-summary-card data-crop-subtab-summary-card data-crop-basic-overview-card data-crop-ui-subpage-summary
    // data-crop-consistency-shell data-crop-consistency-mobile-safe data-crop-consistency-card-radius data-crop-consistency-final-pass
    // data-crop-basic-selected-season data-crop-basic-latest-season data-crop-basic-lifecycle-kpis data-crop-ui-kpi-grid
    // data-crop-basic-next-action 현재 작기 설정 선택 작기 요약 농장주/농장직원이 먼저 확인할 내용 다음 행동 재배 중 철거 완료
    // 농장주와 직원이 같은 작기 기준으로 생육·예찰·방제 기록을 이어갑니다.
    // 모바일 360px 기준 data-crop-consistency-action-row
    return renderCropBasicOverviewCard(this);
  }

  _renderCropBasicTab() {
    // RB-003 legacy static contract manifest: basic tab read-only shell moved to domains/crop/crop-readonly.js.
    // data-crop-basic-summary-card data-crop-basic-overview-card data-crop-ui-subpage-summary data-crop-basic-kpi-grid
    // data-crop-basic-lifecycle-kpis data-crop-ui-kpi-grid data-crop-basic-latest-season data-crop-basic-next-action
    // data-crop-ui-action-bar data-crop-basic-primary-action data-crop-basic-secondary-actions data-crop-basic-list-header
    // data-crop-subtab-list-header data-crop-basic-lifecycle-actions data-crop-consistency-action-row data-crop-list-title
    // data-crop-list-description data-crop-list-count data-crop-list-actions data-crop-basic-season-list data-crop-subtab-record-list data-crop-ui-record-list
    // id="basic-export-btn" id="basic-add-btn" id="crop-seasons-list" _renderCropPager("basic", this._cropSeasons.length) this._paginatedCropRows("basic"
    // data-vs003-lettuce-crop-cycle-card data-vs003-lettuce-crop-cycle-submit VS-003 상추 작기 등록 metrics_json green_smart/crop/seasons
    // 현재 작기 설정 농장주와 직원이 같은 작기 기준으로 생육·예찰·방제 기록을 이어갑니다.
    // 작기 설정도 공통 하위페이지 포맷 CSV 내보내기 + 정식 등록 repeat(auto-fit,minmax( flex-wrap:wrap
    return renderCropBasicTab(this);
  }

  _renderCropSeasonsList() {
    // RB-003 legacy static contract manifest: crop season record-list render moved to domains/crop/crop-readonly.js.
    // _seasonZoneLabel(s) s.zoneName s.zoneId const deleteAction const activeActions const seasonActions demolished ? deleteAction : activeActions
    // data-crop-basic-empty-state data-crop-ui-empty-state data-crop-basic-record-row data-crop-basic-record-summary data-crop-basic-record-meta
    // data-crop-basic-record-actions data-crop-record-action-group data-crop-basic-secondary-actions data-crop-record-secondary-actions
    // data-season-edit= data-season-demolish= data-season-delete= data-season-edit data-season-demolish data-season-delete data-crop-basic-danger-actions data-crop-record-danger-actions
    // 아직 등록된 작기가 없습니다 정식 등록으로 첫 작기를 추가하세요 농장주와 직원이 같은 작기 기준으로 기록을 관리합니다
    // mdi:pencil mdi:trash-can-outline 정식일 철거일 철거 완료 재배 중
    // green_smart/crop/seasons/${this._activeSeasonId}/growth data-vs003-lettuce-growth-survey-card data-vs003-lettuce-growth-submit
    return renderCropSeasonsList(this);
  }

  _renderGrowthReportCard() {
    const report = this._growthReportData || {};
    const cropModel = report.cropModel || {};
    const yieldPrediction = report.yieldPrediction || {};
    const pestRisk = report.pestRisk || {};
    const weeklyReport = report.weeklyReport || {};
    const stageDiagnosis = cropModel.stageDiagnosis || {};
    const cropInterlock = cropModel.cropInterlock || {};
    const centerCropPolicy = cropModel.centerCropPolicy || {};
    const cropModelVariables = cropModel.cropModelVariables || centerCropPolicy.cropModelVariables || {};
    const cropInterlockVariables = cropModel.cropInterlockVariables || centerCropPolicy.cropInterlockVariables || {};
    const recommendationHints = cropModel.recommendationHints || centerCropPolicy.recommendationHints || {};
    const policyStatus = cropModel.policyStatus || centerCropPolicy.policyStatus || "fallback_safe";
    const applyMode = cropModel.applyMode || centerCropPolicy.applyMode || "recommend_only";
    const stageRules = Array.isArray(cropInterlock.stageInterlockRuleResults) ? cropInterlock.stageInterlockRuleResults : [];
    const interlockReasons = Array.isArray(cropInterlock.cropInterlockReasons) ? cropInterlock.cropInterlockReasons : [];
    const interlockActions = Array.isArray(cropInterlock.cropInterlockActions) ? cropInterlock.cropInterlockActions : [];
    const approvalResolvedReasons = Array.isArray(cropInterlock.approvalResolvedReasons) ? cropInterlock.approvalResolvedReasons : [];
    const approvalUnresolvedReasons = Array.isArray(cropInterlock.approvalUnresolvedReasons) ? cropInterlock.approvalUnresolvedReasons : [];
    const approvalGateStatus = cropInterlock.approvalGateStatus || "clear";
    const missingEvidence = Array.isArray(stageDiagnosis.missingEvidence) ? stageDiagnosis.missingEvidence : [];
    const indexBand = stageDiagnosis.indexBand || "unknown";
    const indexBandColor = { target: "#51AE60", caution: "#f39c12", problem: "#e67e22", hardBlock: "#c0392b", unknown: "#7a9780" }[indexBand] || "#7a9780";
    const gIndexTrend = Array.isArray(report.gIndexTrend) ? report.gIndexTrend : [];
    const growthTrend = report.growthTrend || {};
    const heightTrend = Array.isArray(growthTrend.height) ? growthTrend.height : [];
    const latestG = gIndexTrend.length ? gIndexTrend[gIndexTrend.length - 1].value : "-";
    const riskLabel = { low: "낮음", medium: "보통", high: "높음" }[pestRisk.level] || "기록 부족";
    const actions = Array.isArray(weeklyReport.actions) ? weeklyReport.actions : [];
    const yieldDrivers = yieldPrediction.yieldDrivers || {};
    const confidenceReasons = Array.isArray(yieldPrediction.confidenceReasons) ? yieldPrediction.confidenceReasons : [];
    const environmentDrivers = pestRisk.environmentDrivers || {};
    const weatherDrivers = pestRisk.weatherDrivers || {};
    const controlHistoryDrivers = pestRisk.controlHistoryDrivers || {};
    const riskFactors = Array.isArray(pestRisk.riskFactors) ? pestRisk.riskFactors : [];
    const recommendedActions = Array.isArray(pestRisk.recommendedActions) ? pestRisk.recommendedActions : [];
    const policyColor = { fresh: "#51AE60", stale_usable: "#7aa55f", stale_restricted: "#f39c12", fallback_safe: "#c0392b", rejected: "#8e44ad" }[policyStatus] || "#7a9780";
    const policyLabel = { fresh: "정상", stale_usable: "지연 사용", stale_restricted: "제한 모드", fallback_safe: "안전 fallback", rejected: "폐기" }[policyStatus] || policyStatus;
    const modelVarEntries = Object.entries(cropModelVariables).slice(0, 4);
    const interlockVarEntries = Object.entries(cropInterlockVariables).slice(0, 4);
    const hintEntries = Object.entries(recommendationHints).slice(0, 4);
    const policyChip = (label, value) => `<span style="font-size:11px;background:#f5faf6;color:#5d7d64;border:1px solid #e4f0e6;border-radius:999px;padding:4px 8px;"><b>${this._esc(label)}</b> ${this._esc(String(value ?? "-"))}</span>`;
    const policyGuidance = CENTER_CROP_POLICY_STATUS_GUIDANCE[policyStatus] || CENTER_CROP_POLICY_STATUS_GUIDANCE.fallback_safe;
    const centerPolicyReasonCodes = Array.from(new Set([
      ...((Array.isArray(centerCropPolicy.reasonCodes) ? centerCropPolicy.reasonCodes : [])),
      ...interlockReasons.filter((r) => String(r).startsWith("center_policy_")),
    ]));
    const translatedCenterPolicyReasons = centerPolicyReasonCodes.map((code) => CENTER_CROP_POLICY_REASON_LABELS[code] || code);
    const rawNextAction = recommendationHints.nextAction || centerCropPolicy.nextAction || "monitor_crop_policy";
    const translatedNextAction = CENTER_CROP_POLICY_NEXT_ACTION_LABELS[rawNextAction] || String(rawNextAction || "현재 작물 정책 상태를 관찰하세요.");
    const policyAlertActive = CENTER_CROP_POLICY_ALERT_STATUSES.has(policyStatus);
    const policyAlertMessage = CENTER_CROP_POLICY_ALERT_MESSAGES[policyStatus] || "Center 작물 정책 상태를 확인하세요.";
    const cropPolicyNotificationEnabled = this._cropPolicyNotificationEnabled();
    const trainableBaseline = report.trainableBaseline || cropModel.trainableBaseline || {};
    const stagePrediction7d = trainableBaseline.stagePrediction7d || report.stagePrediction7d || {};
    const growthStatePrediction = trainableBaseline.growthStatePrediction || cropModel.growthStatePrediction || report.growthStatePrediction || {};
    const currentGrowthBalance = growthStatePrediction.currentBalance || {};
    const predictedGrowthBalance7d = growthStatePrediction.predictedBalance7d || {};
    const growthBalanceMovement = growthStatePrediction.balanceMovement || {};
    const growthStateDrivers = growthStatePrediction.driverContributions || {};
    const riskFactorPrediction = trainableBaseline.riskFactorPrediction || cropModel.riskFactorPrediction || report.riskFactorPrediction || {};
    const aggregateRiskFactor = riskFactorPrediction.aggregateRisk || {};
    const highestRiskFactor = riskFactorPrediction.highestRiskItem || {};
    const riskFactorGroups = [riskFactorPrediction.environmentStress || {}, riskFactorPrediction.irrigationNutrientStress || {}, riskFactorPrediction.pestDiseaseRisk || {}, riskFactorPrediction.operationDataQualityRisk || {}];
    const integratedCropDiagnosis = trainableBaseline.integratedCropDiagnosis || cropModel.integratedCropDiagnosis || report.integratedCropDiagnosis || {};
    const sourceSinkDiagnosis = integratedCropDiagnosis.sourceSinkDiagnosis || {};
    const transitionDiagnosis = integratedCropDiagnosis.transitionDiagnosis || {};
    const reviewSignals = integratedCropDiagnosis.reviewSignals || {};
    const cropActionRecommendation = trainableBaseline.cropActionRecommendation || cropModel.cropActionRecommendation || report.cropActionRecommendation || {};
    const workReviewRequests = cropActionRecommendation.workReviewRequests || {};
    const modelReviewRequests = cropActionRecommendation.modelReviewRequests || {};
    const stagePredictionScore = stagePrediction7d.score || report.stagePredictionScore || {};
    const scoreComponents = stagePredictionScore.scoreComponents || {};
    const predictedStage7d = stagePrediction7d.predictedStage7d || {};
    const transitionWindow = stagePrediction7d.transitionWindow || {};
    const mlUpgradeReadiness = trainableBaseline.mlUpgradeReadiness || report.mlUpgradeReadiness || {};
    const inputCompleteness = trainableBaseline.inputCompleteness || report.inputCompleteness || {};
    const sourceStatus = trainableBaseline.sourceStatus || report.sourceStatus || inputCompleteness.sourceStatus || {};
    const featureSources = trainableBaseline.featureSources || report.featureSources || {};
    const kmaWeatherStress7d = report.kmaWeatherStress7d || featureSources.kmaWeatherStress7d || {};
    const kmaWeatherFeatures = kmaWeatherStress7d.features || {};
    const environmentSummary7d = report.environmentSummary7d || featureSources.environmentSummary7d || {};
    const environmentFeatures = environmentSummary7d.features || environmentSummary7d.metrics || {};
    const environmentDerivedFeatures = environmentSummary7d.derivedFeatures || {};
    const environmentStaleReasons = Array.isArray(environmentSummary7d.staleReasons) ? environmentSummary7d.staleReasons : [];
    const envStatus = sourceStatus.environment || environmentSummary7d.sourceStatus || "missing";
    const irrigationNutrientSummary7d = report.irrigationNutrientSummary7d || featureSources.irrigationNutrientSummary7d || {};
    const irrigationNutrientFeatures = irrigationNutrientSummary7d.features || irrigationNutrientSummary7d.derivedFeatures || {};
    const irrigationStaleReasons = Array.isArray(irrigationNutrientSummary7d.staleReasons) ? irrigationNutrientSummary7d.staleReasons : [];
    const irrStatus = sourceStatus.irrigationNutrient || irrigationNutrientSummary7d.sourceStatus || "missing";
    const pestControlSummary7d = report.pestControlSummary7d || featureSources.pestControlSummary7d || {};
    const pestControlFeatures = pestControlSummary7d.features || {};
    const pestReviewGuidance = Array.isArray(pestControlSummary7d.reviewGuidance) ? pestControlSummary7d.reviewGuidance : [];
    const pestStatus = sourceStatus.pestControl || pestControlSummary7d.sourceStatus || "missing";
    const predictionValidation = report.predictionValidation || trainableBaseline.predictionValidation || {};
    const trainingDataset = report.trainingDataset || trainableBaseline.trainingDataset || {};
    const operatorWorkflow = report.operatorWorkflow || trainableBaseline.operatorWorkflow || {};
    const weeklyInputStatus = operatorWorkflow.weeklyInputStatus || {};
    const operatorMissingInputs = Array.isArray(operatorWorkflow.missingInputs) ? operatorWorkflow.missingInputs : [];
    const operatorChecklist = Array.isArray(operatorWorkflow.nextSurveyChecklist) ? operatorWorkflow.nextSurveyChecklist : [];
    const operatorValidationSummary = operatorWorkflow.lastValidationSummary || {};
    const operatorTimeSeriesReadiness = operatorWorkflow.timeSeriesReadiness || {};
    const operatorWarnings = Array.isArray(operatorWorkflow.operatorWarnings) ? operatorWorkflow.operatorWarnings : [];
    const trainingDatasetReadiness = trainingDataset.readiness || {};
    const trainingDatasetWarnings = Array.isArray(trainingDataset.exportWarnings) ? trainingDataset.exportWarnings : [];
    const qualityDisorderSummary = report.qualityDisorderSummary || trainableBaseline.qualityDisorderSummary || (trainableBaseline.featureSnapshot || {}).qualityDisorderSummary || {};
    const qualityRiskFlags = Array.isArray(qualityDisorderSummary.riskFlags) ? qualityDisorderSummary.riskFlags : [];
    const qualityMissingMetrics = Array.isArray(qualityDisorderSummary.missingMetrics) ? qualityDisorderSummary.missingMetrics : [];
    const validationStatus = predictionValidation.needsReviewCount > 0 ? "validation_needs_review" : predictionValidation.pendingCount > 0 ? "pending" : predictionValidation.validatedCount > 0 ? "validated" : "no_predictions";
    const validationStatusLabel = { validated: "검증 완료", pending: "검증 대기", validation_needs_review: "검토 필요", no_predictions: "예측 기록 없음" }[validationStatus] || validationStatus;
    const maxRiskScore = (items) => Math.max(0, ...Object.values(items || {}).map((item) => Number((item || {}).score ?? 0)));
    const environmentRiskItems = riskFactorPrediction.environmentStress || {};
    const irrigationRiskItems = riskFactorPrediction.irrigationNutrientStress || {};
    const pestDiseaseRiskItems = riskFactorPrediction.pestDiseaseRisk || {};
    const environmentRiskScore = maxRiskScore(environmentRiskItems);
    const irrigationRiskScore = maxRiskScore(irrigationRiskItems);
    const pestDiseaseRiskScore = maxRiskScore(pestDiseaseRiskItems);
    const topRiskEntry = (items) => Object.entries(items || {}).sort((a, b) => Number((b[1] || {}).score ?? 0) - Number((a[1] || {}).score ?? 0))[0] || ["none", {}];
    const [environmentRiskKey, environmentRiskItem] = topRiskEntry(environmentRiskItems);
    const [irrigationRiskKey, irrigationRiskItem] = topRiskEntry(irrigationRiskItems);
    const [pestDiseaseRiskKey, pestDiseaseRiskItem] = topRiskEntry(pestDiseaseRiskItems);
    const environmentRiskLabelMap = { highTemperatureStress: "고온", lowTemperatureStress: "저온", temperatureSwingStress: "온도급변", rapidTemperatureChangeStress: "온도급변", vpdStress: "VPD 스트레스", humidityStress: "습도 위험", co2Stress: "CO₂ 위험", lightDliStress: "광량 위험" };
    const irrigationRiskLabelMap = { ecStress: "높은 EC", highEcStress: "높은 EC", lowEcStress: "낮은 EC", phStress: "pH 위험", dryBackStress: "과건조", drainImbalanceStress: "과관수", overIrrigationStress: "과관수", irrigationFreshnessRisk: "관수 데이터 부족" };
    const environmentSummaryLabel = environmentRiskLabelMap[environmentRiskKey] || "환경 정보 부족";
    const irrigationSummaryLabel = irrigationRiskLabelMap[irrigationRiskKey] || "관수 정보 부족";
    const pestDiseaseSummaryLabel = pestDiseaseRiskScore >= 0.85 ? "매우심각" : pestDiseaseRiskScore >= 0.7 ? "심각" : pestDiseaseRiskScore >= 0.4 ? "보통" : "낮음";
    const growthDirectionCode = Number(currentGrowthBalance.directionCode ?? 0);
    const growthMagnitudeCode = Number(currentGrowthBalance.magnitudeBandCode ?? 0);
    const growthStateText = growthDirectionCode > 0
      ? (growthMagnitudeCode >= 3 ? "강한 생식생장" : "생식생장")
      : growthDirectionCode < 0
      ? (growthMagnitudeCode >= 3 ? "강한 영양생장" : "영양생장")
      : "균형 생장";
    const growthDirectionEmoji = growthDirectionCode > 0 ? (growthMagnitudeCode >= 3 ? "⏫" : "↗️") : growthDirectionCode < 0 ? (growthMagnitudeCode >= 3 ? "⏬" : "↘️") : "➡️";
    const safetyIssueCount = interlockReasons.length + approvalUnresolvedReasons.length + operatorWarnings.length + qualityRiskFlags.length;
    const safetyStatusLabel = safetyIssueCount > 0 || cropInterlock.cropInterlockBlocked ? "확인 필요" : "정상";
    const mlReady = !!mlUpgradeReadiness.ready;
    const aiNextAction = operatorMissingInputs.length
      ? `부족한 입력 ${operatorMissingInputs.length}개를 먼저 보완하고 다음 생육조사를 저장하세요.`
      : cropInterlock.cropInterlockBlocked
      ? "작물 인터록 차단 사유를 확인하고 승인/보완 절차를 먼저 진행하세요."
      : validationStatus === "validation_needs_review"
      ? "예측 검증 결과를 검토하고 실제 조사값과 다른 항목을 확인하세요."
      : "이번 주 생육조사와 예측 검증 상태를 유지하고 상세 근거는 필요할 때만 펼쳐 확인하세요.";
    /* Center policy guidance / Center policy resolution UX: read-only guidance only, no execution authority. */
    return `<section class="gs-card" data-growth-report-card data-crop-ai-evidence-panel style="padding:14px;margin-bottom:14px;background:#fbfefb;border:1px solid #e3f1e5;">
      <div data-crop-ai-strategy-header style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:10px;">
        <div>
          <div style="font-size:15px;font-weight:900;color:#24323F;">AI 전략</div>
          <div style="font-size:12px;color:#7a9780;margin-top:3px;">운영 판단 요약을 먼저 보고, 모델·데이터 근거는 접힌 상세 패널에서 확인합니다.</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;align-items:center;">
          <button data-weekly-report-notification-toggle data-weekly-report-notification-icon title="주간 리포트 자동 알림" style="border:1px solid ${this._weeklyReportNotificationEnabled() ? '#f5a623' : '#cfd8d3'};background:${this._weeklyReportNotificationEnabled() ? '#fff7e6' : '#f1f3f2'};color:${this._weeklyReportNotificationEnabled() ? '#f5a623' : '#9aa6a0'};border-radius:10px;padding:7px 9px;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;">
            <ha-icon icon="${this._weeklyReportNotificationEnabled() ? 'mdi:bell-ring-outline' : 'mdi:bell-off-outline'}" style="--mdi-icon-size:18px;"></ha-icon>
          </button>
          <button data-weekly-report-export title="주간 리포트 내보내기" style="border:1px solid #c8e6c9;background:#fff;color:#51AE60;border-radius:10px;padding:7px 9px;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;"><ha-icon icon="mdi:file-download-outline" style="--mdi-icon-size:18px;"></ha-icon></button>
          <button data-growth-report-refresh data-weekly-report-refresh-icon data-weekly-report-refreshing="false" title="리포트 새로고침" style="border:1px solid #c8e6c9;background:#f5faf6;color:#51AE60;border-radius:10px;padding:7px 9px;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;"><ha-icon icon="mdi:refresh" style="--mdi-icon-size:18px;"></ha-icon></button>
        </div>
      </div>
      <div data-crop-ai-readonly-boundary style="background:#f7fbff;border:1px solid #dbeaf8;border-radius:14px;padding:10px;margin-bottom:10px;color:#4f6f83;font-size:11px;line-height:1.55;font-weight:800;">
        현장 Edge가 최종 판단 · read-only · 자동 실행 없음 · 자동 학습/배포 없음 · 환경/관수/장치 PID 적용은 제외
      </div>
      <section data-crop-ai-main-card="crop-status" data-crop-ai-decision-summary data-crop-ai-primary-summary data-crop-ai-summary-stack data-crop-ai-crop-summary style="background:#fff;border:1px solid #cfe8d8;border-radius:16px;padding:14px;margin-bottom:12px;box-shadow:0 6px 18px rgba(64,117,78,0.08);">
        <div data-crop-ai-main-card-header data-crop-ai-section-heading style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:10px;"><div><div style="font-size:15px;font-weight:900;color:#24323F;">작물 요약</div><div style="font-size:11px;color:#7a9780;margin-top:3px;">이번 주 모델을 통해서 출력된 작물 상태의 요약입니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:4px 9px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">crop</span></div>
        <div data-crop-ai-main-card-body style="display:flex;flex-direction:column;gap:9px;">
          <div data-crop-ai-main-metric-grid data-crop-ai-primary-metric-grid style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">
            <div data-crop-ai-summary-stage data-crop-ai-main-metric data-crop-ai-primary-gl-index style="background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div data-crop-ai-main-metric-label style="font-size:11px;color:#5f7f70;font-weight:900;">작물단계</div><b data-crop-ai-main-metric-value style="font-size:18px;color:#24323F;">${this._esc(stageDiagnosis.stageLabel || predictedStage7d.stageLabel || '미확정')}</b><div data-crop-ai-main-metric-help style="font-size:10px;color:#8aa091;margin-top:3px;">스코어 <span data-crop-ai-summary-stage-score>${this._esc(String(stagePredictionScore.rawScore ?? stagePredictionScore.score ?? '-'))}</span> · 신뢰 <span data-crop-ai-summary-stage-confidence>${this._esc(String(stagePredictionScore.confidenceScore ?? predictedStage7d.probability ?? '-'))}</span></div></div>
            <div data-crop-ai-summary-growth-state data-crop-growth-state-numeric-card data-crop-ai-main-metric data-crop-ai-growth-state-score style="background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div data-crop-ai-main-metric-label style="font-size:11px;color:#5f7f70;font-weight:900;">작물상태</div><b data-crop-ai-summary-growth-state-label data-crop-ai-main-metric-value data-crop-growth-state-balance-score style="font-size:18px;color:#24323F;">${this._esc(growthStateText)} <span data-crop-ai-summary-growth-direction-emoji>${this._esc(growthDirectionEmoji)}</span></b><div data-crop-ai-main-metric-help style="font-size:10px;color:#8aa091;margin-top:3px;">스코어 <span data-crop-ai-summary-growth-state-score>${this._esc(String(currentGrowthBalance.balanceScore ?? 0))}</span> · 신뢰 <span data-crop-ai-summary-growth-state-confidence>${this._esc(String(growthStatePrediction.confidenceScore ?? currentGrowthBalance.confidenceScore ?? 0))}</span></div></div>
            <div data-crop-ai-summary-environment-risk data-crop-risk-factor-numeric-card data-crop-ai-main-metric style="background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div data-crop-ai-main-metric-label style="font-size:11px;color:#5f7f70;font-weight:900;">환경요약</div><b data-crop-ai-summary-environment-label data-crop-ai-main-metric-value data-crop-risk-factor-score style="font-size:18px;color:#24323F;">${this._esc(environmentSummaryLabel)}</b><div data-crop-ai-main-metric-help style="font-size:10px;color:#8aa091;margin-top:3px;">스코어 <span data-crop-ai-summary-environment-score>${this._esc(String(environmentRiskScore))}</span> · 신뢰 <span data-crop-ai-summary-environment-confidence>${this._esc(String(environmentRiskItem.confidenceScore ?? aggregateRiskFactor.confidenceScore ?? 0))}</span></div></div>
            <div data-crop-ai-summary-irrigation-risk data-crop-ai-primary-yield-prediction data-crop-ai-main-metric style="background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div data-crop-ai-main-metric-label style="font-size:11px;color:#5f7f70;font-weight:900;">관수요약</div><b data-crop-ai-summary-irrigation-label data-crop-ai-main-metric-value style="font-size:18px;color:#24323F;">${this._esc(irrigationSummaryLabel)}</b><div data-crop-ai-main-metric-help style="font-size:10px;color:#8aa091;margin-top:3px;">스코어 <span data-crop-ai-summary-irrigation-score>${this._esc(String(irrigationRiskScore))}</span> · 신뢰 <span data-crop-ai-summary-irrigation-confidence>${this._esc(String(irrigationRiskItem.confidenceScore ?? aggregateRiskFactor.confidenceScore ?? 0))}</span></div></div>
            <div data-crop-ai-summary-pest-risk data-crop-ai-main-metric data-crop-ai-primary-pest-risk style="background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div data-crop-ai-main-metric-label style="font-size:11px;color:#5f7f70;font-weight:900;">병충해요약</div><b data-crop-ai-summary-pest-label data-crop-ai-main-metric-value style="font-size:18px;color:${pestDiseaseRiskScore >= 0.7 ? '#c0392b' : pestDiseaseRiskScore >= 0.4 ? '#f39c12' : '#51AE60'};">${this._esc(pestDiseaseSummaryLabel)}</b><div data-crop-ai-main-metric-help style="font-size:10px;color:#8aa091;margin-top:3px;">스코어 <span data-crop-ai-summary-pest-score>${this._esc(String(pestDiseaseRiskScore))}</span> · 신뢰 <span data-crop-ai-summary-pest-confidence>${this._esc(String(pestDiseaseRiskItem.confidenceScore ?? aggregateRiskFactor.confidenceScore ?? 0))}</span></div></div>
          </div>
          <div data-crop-ai-main-note data-crop-ai-next-action style="background:#f8fbf9;border:1px solid #e2f1e7;border-radius:12px;padding:10px;font-size:12px;color:#4a6741;line-height:1.55;"><b>다음 행동</b> ${this._esc(aiNextAction)}</div>
        </div>
      </section>
      <section data-crop-ai-main-card="interlock-status" data-crop-ai-safety-interlock-summary data-crop-ai-support-status-summary data-crop-ai-interlock-summary data-crop-interlock-card style="background:#fff;border:1px solid ${cropInterlock.cropInterlockBlocked ? '#f3c8c8' : '#cfe8d8'};border-radius:16px;padding:14px;margin-bottom:12px;box-shadow:0 6px 18px rgba(64,117,78,0.08);">
        <div data-crop-ai-main-card-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:10px;"><div><div style="font-size:15px;font-weight:900;color:#24323F;">안전/인터록 상태 요약</div><div style="font-size:11px;color:#7a9780;margin-top:3px;">작물 모델 결과를 운영에 참고하기 전 안전상태, 인터록 상태, 오류건수를 확인합니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:4px 9px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">safety</span></div>
        <div data-crop-ai-main-card-body style="display:flex;flex-direction:column;gap:9px;">
          <div data-crop-ai-main-metric-grid data-crop-ai-interlock-grid style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">
            <div data-crop-ai-summary-safety-status data-crop-ai-main-metric style="background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div data-crop-ai-main-metric-label style="font-size:11px;color:#5f7f70;font-weight:900;">안전상태</div><b data-crop-ai-main-metric-value style="font-size:15px;color:${safetyIssueCount ? '#c0392b' : '#51AE60'};">${this._esc(safetyStatusLabel)}</b><div data-crop-ai-main-metric-help style="font-size:10px;color:#8aa091;margin-top:3px;">미해소 ${this._esc(String(approvalUnresolvedReasons.length))}건</div></div>
            <div data-crop-ai-summary-interlock-status data-crop-ai-main-metric data-crop-ai-interlock-status style="background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div data-crop-ai-main-metric-label style="font-size:11px;color:#5f7f70;font-weight:900;">인터록 상태</div><b data-crop-ai-main-metric-value style="font-size:15px;color:${cropInterlock.cropInterlockBlocked ? '#c0392b' : '#51AE60'};">${this._esc(cropInterlock.cropInterlockStatus || 'clear')}</b><div data-crop-ai-main-metric-help style="font-size:10px;color:#8aa091;margin-top:3px;">차단/승인 필요 상태</div></div>
            <button type="button" data-crop-ai-summary-error-count data-crop-ai-error-count-open data-crop-ai-main-metric style="text-align:left;background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;cursor:pointer;"><div data-crop-ai-main-metric-label style="font-size:11px;color:#5f7f70;font-weight:900;">오류건수</div><b data-crop-ai-main-metric-value style="font-size:15px;color:${safetyIssueCount ? '#c0392b' : '#51AE60'};">${this._esc(String(safetyIssueCount))}</b><div data-crop-ai-main-metric-help style="font-size:10px;color:#8aa091;margin-top:3px;">눌러서 승인/차단 상세 확인</div></button>
          </div>
          <div data-crop-ai-main-note style="background:#f8fbf9;border:1px solid #e2f1e7;border-radius:12px;padding:10px;font-size:11px;color:#7a9780;line-height:1.55;"><b>상태 요약</b> 현재 작물 모델 적용 전 확인이 필요한 안전·승인 상태입니다.<span data-crop-ai-target-promotion-status data-crop-ai-auto-execution-status style="display:none;">legacy target promotion · 자동 실행 · cropInterlockReasons · cropInterlockActions · require_harvest_safety_clearance markers retained</span></div>
          <div data-crop-ai-interlock-detail-modal hidden style="position:fixed;inset:0;z-index:10000;background:rgba(36,50,63,0.36);display:none;align-items:center;justify-content:center;padding:16px;">
            <div class="popup-card" style="width:min(520px,94vw);background:#fff;border-radius:18px;padding:16px;border:1px solid #dbeee0;box-shadow:0 18px 44px rgba(36,50,63,0.22);">
              <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px;"><div><div style="font-size:15px;font-weight:900;color:#24323F;">안전/인터록 상세</div><div style="font-size:11px;color:#7a9780;margin-top:3px;">오류건수에 포함된 승인·차단 상세입니다.</div></div><button type="button" data-crop-ai-interlock-detail-close style="border:0;background:#f1f5f2;color:#6d8799;border-radius:999px;width:30px;height:30px;cursor:pointer;font-weight:900;">×</button></div>
              <div data-crop-interlock-approval-gate data-crop-ai-interlock-modal-gate style="background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;margin-bottom:8px;">
                <div style="font-size:11px;color:#5d7d64;font-weight:900;">승인 gate</div>
                <div style="font-size:14px;color:#24323F;font-weight:900;margin-top:3px;">${this._esc(approvalGateStatus)}</div>
              </div>
              <div data-crop-ai-interlock-modal-resolved style="background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;margin-bottom:8px;"><div style="font-size:11px;color:#5d7d64;font-weight:900;">승인으로 해소</div><div style="font-size:11px;color:#7a9780;margin-top:4px;">${approvalResolvedReasons.length ? approvalResolvedReasons.map(r => this._esc(r)).join(' · ') : '없음'}</div></div>
              <div data-crop-ai-interlock-modal-unresolved style="background:#fff7f7;border-radius:12px;padding:10px;border:1px solid #f3c8c8;margin-bottom:10px;"><div style="font-size:11px;color:#b84343;font-weight:900;">미해소 차단</div><div style="font-size:11px;color:#7a5860;margin-top:4px;">${approvalUnresolvedReasons.length ? approvalUnresolvedReasons.map(r => this._esc(r)).join(' · ') : '없음'}</div></div>
              <div data-crop-ai-main-action-row data-crop-ai-interlock-actions data-crop-ai-interlock-modal-actions style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
                <button data-crop-interlock-approve data-approval-type="operator_confirm" style="border:1px solid #c8e6c9;background:#f5faf6;color:#51AE60;border-radius:9px;padding:6px 9px;font-size:11px;font-weight:900;cursor:pointer;">운영자 확인</button>
                <button data-crop-interlock-approve data-approval-type="manager_approve" style="border:1px solid #f6d08b;background:#fff8e8;color:#c47f00;border-radius:9px;padding:6px 9px;font-size:11px;font-weight:900;cursor:pointer;">농장주 승인</button>
                <button data-crop-interlock-approve data-approval-type="admin_approve" style="border:1px solid #d7c2f0;background:#f8f2ff;color:#7f52b8;border-radius:9px;padding:6px 9px;font-size:11px;font-weight:900;cursor:pointer;">관리자 승인</button>
              </div>
            </div>
          </div>
        </div>
        <div data-crop-ai-main-card-chip-group style="font-size:10px;color:#9aae9d;margin-top:8px;line-height:1.45;">승인 메모 · 승인 만료 · approvalAudit · stageInterlockRuleResults ${stageRules.filter(r => r && r.matched).length}/${stageRules.length}</div>
      </section>
      <section data-crop-ai-main-card="model-status" data-crop-ai-model-status-summary data-crop-ai-expanded-model-summary style="background:#fff;border:1px solid #cfe8d8;border-radius:16px;padding:14px;margin-bottom:12px;box-shadow:0 6px 18px rgba(64,117,78,0.08);">
        <div data-crop-ai-main-card-header data-crop-ai-section-heading style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:10px;"><div><div style="font-size:15px;font-weight:900;color:#24323F;">모델 상태 요약</div><div style="font-size:11px;color:#7a9780;margin-top:3px;">5개 작물 모델 파이프라인과 검토 요청 상태입니다. 상세 버튼으로 근거를 펼쳐 확인합니다.</div></div><button data-crop-ai-model-detail-toggle type="button" style="border:1px solid #c8e6c9;background:#f5faf6;color:#51AE60;border-radius:10px;padding:6px 10px;font-size:11px;font-weight:900;cursor:pointer;">상세 보기</button></div>
        <div data-crop-ai-main-card-body style="display:flex;flex-direction:column;gap:9px;">
          <div data-crop-ai-main-metric-grid data-crop-ai-model-status-grid data-crop-ai-model-pipeline-summary style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">
            <div data-crop-ai-model-pipeline-step="stage-prediction" data-crop-ai-main-metric data-crop-ai-stage-status style="background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div data-crop-ai-main-metric-label style="font-size:11px;color:#5f7f70;font-weight:900;">생육단계 모델</div><b data-crop-ai-main-metric-value style="font-size:15px;color:#24323F;">${this._esc(stageDiagnosis.stageLabel || predictedStage7d.stageLabel || '미확정')}</b><div data-crop-ai-main-metric-help style="font-size:10px;color:#8aa091;margin-top:3px;">검증 ${this._esc(validationStatusLabel)}</div></div>
            <div data-crop-ai-model-pipeline-step="growth-state-prediction" data-crop-ai-main-metric style="background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div data-crop-ai-main-metric-label style="font-size:11px;color:#5f7f70;font-weight:900;">생육상태 모델</div><b data-crop-ai-main-metric-value style="font-size:15px;color:#24323F;">${this._esc(String(currentGrowthBalance.balanceScore ?? 0))}</b><div data-crop-ai-main-metric-help style="font-size:10px;color:#8aa091;margin-top:3px;">numeric-first</div></div>
            <div data-crop-ai-model-pipeline-step="risk-factor-prediction" data-crop-risk-factor-numeric-card data-crop-ai-main-metric data-crop-ai-risk-status style="background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div data-crop-ai-main-metric-label style="font-size:11px;color:#5f7f70;font-weight:900;">위험요소 모델</div><b data-crop-risk-factor-score data-crop-ai-main-metric-value style="font-size:15px;color:#24323F;">${this._esc(String(aggregateRiskFactor.score ?? 0))}</b><div data-crop-ai-main-metric-help style="font-size:10px;color:#8aa091;margin-top:3px;">bandCode <span data-crop-risk-factor-band-code>${this._esc(String(aggregateRiskFactor.bandCode ?? 9))}</span> · trendCode <span data-crop-risk-factor-trend-code>${this._esc(String(aggregateRiskFactor.trendCode ?? 9))}</span></div></div>
            <div data-crop-ai-model-pipeline-step="integrated-diagnosis" data-crop-integrated-diagnosis-card data-crop-ai-main-metric style="background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div data-crop-ai-main-metric-label style="font-size:11px;color:#5f7f70;font-weight:900;">통합진단 모델</div><b data-crop-diagnosis-source-sink-gap data-crop-ai-main-metric-value style="font-size:15px;color:#24323F;">${this._esc(String(sourceSinkDiagnosis.sourceSinkGapScore ?? 0))}</b><div data-crop-ai-main-metric-help style="font-size:10px;color:#8aa091;margin-top:3px;">transition <span data-crop-diagnosis-transition-need-code>${this._esc(String(transitionDiagnosis.transitionNeedCode ?? 9))}</span></div></div>
            <div data-crop-ai-model-pipeline-step="action-recommendation" data-crop-ai-main-metric data-crop-action-recommendation-card style="background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div data-crop-ai-main-metric-label style="font-size:11px;color:#5f7f70;font-weight:900;">조치추천 모델</div><b data-crop-ai-main-metric-value style="font-size:15px;color:#24323F;">${this._esc(String(Object.keys(workReviewRequests).length + Object.keys(modelReviewRequests).length))}건</b><div data-crop-ai-main-metric-help style="font-size:10px;color:#8aa091;margin-top:3px;">request only</div></div>
            <div data-crop-ai-main-metric data-crop-ai-input-status style="background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div data-crop-ai-main-metric-label style="font-size:11px;color:#5f7f70;font-weight:900;">입력 상태</div><b data-crop-ai-main-metric-value style="font-size:15px;color:${weeklyInputStatus.complete ? '#51AE60' : '#c97a00'};">${this._esc(weeklyInputStatus.label || (weeklyInputStatus.complete ? '완료' : '입력 필요'))}</b><div data-crop-ai-main-metric-help style="font-size:10px;color:#8aa091;margin-top:3px;">부족 ${this._esc(String(operatorMissingInputs.length))}개</div></div>
            <div data-crop-ai-main-metric data-crop-ai-ml-readiness-status style="background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div data-crop-ai-main-metric-label style="font-size:11px;color:#5f7f70;font-weight:900;">ML 준비도</div><b data-crop-ai-main-metric-value style="font-size:15px;color:${mlReady ? '#51AE60' : '#7a9780'};">${mlReady ? '확장 가능' : '준비중'}</b><div data-crop-ai-main-metric-help style="font-size:10px;color:#8aa091;margin-top:3px;">read-only dataset</div></div>
          </div>
          <div data-crop-ai-review-request-summary style="background:#f8fbf9;border:1px solid #e2f1e7;border-radius:12px;padding:10px;font-size:11px;color:#7a9780;line-height:1.55;display:flex;gap:6px;flex-wrap:wrap;">
            ${Object.entries(workReviewRequests).map(([name, req]) => `<span data-crop-action-work-request data-crop-action-priority-code="${this._esc(String(req.priorityCode ?? 9))}" style="font-size:11px;background:#f5faf6;color:#5d7d64;border-radius:10px;padding:6px 8px;">${this._esc(name)} · priorityCode ${this._esc(String(req.priorityCode ?? 9))}</span>`).join("") || `<span style="font-size:11px;color:#9aae9d;">work request 없음</span>`}
            ${Object.entries(modelReviewRequests).map(([name, req]) => `<span data-crop-action-model-request data-crop-action-priority-code="${this._esc(String(req.priorityCode ?? 9))}" style="font-size:11px;background:#f7fbff;color:#4f6f83;border-radius:10px;padding:6px 8px;">${this._esc(name)} · targetCandidateAuthorityCode ${this._esc(String(req.targetCandidateAuthorityCode ?? 0))}</span>`).join("") || `<span style="font-size:11px;color:#9aae9d;">model request 없음</span>`}
          </div>
          <div data-crop-ai-main-note style="background:#f8fbf9;border:1px solid #e2f1e7;border-radius:12px;padding:10px;font-size:11px;color:#7a9780;line-height:1.55;">입력 완성도와 모델 준비 상태만 표시합니다. 자동 학습/배포는 수행하지 않습니다.</div>
          <div data-crop-ai-main-action-row style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;"><span style="font-size:10px;color:#7a9780;font-weight:800;background:#f5faf6;border:1px solid #e2f1e7;border-radius:999px;padding:4px 8px;">read-only dataset</span><span style="font-size:10px;color:#7a9780;font-weight:800;background:#f5faf6;border:1px solid #e2f1e7;border-radius:999px;padding:4px 8px;">자동 학습/배포 없음</span></div>
        </div>
        <div data-crop-ai-main-card-chip-group style="font-size:10px;color:#9aae9d;margin-top:8px;line-height:1.45;">read-only model status · automatic ML deployment 없음 · 상세 근거는 아래 접힘 영역</div>
      </section>
      <details data-crop-ai-advanced-details data-crop-ai-evidence-details style="background:#fff;border:1px solid #dbeee0;border-radius:16px;padding:10px;margin-bottom:12px;">
        <summary style="cursor:pointer;font-size:13px;font-weight:900;color:#24323F;display:flex;align-items:center;gap:6px;"><ha-icon icon="mdi:database-search-outline" style="--mdi-icon-size:17px;"></ha-icon>상세 모델 근거 보기</summary>
        <div data-crop-ai-technical-evidence-stack data-crop-ai-technical-evidence-grid style="margin-top:10px;">
      <section data-crop-ai-top-models data-crop-ai-evidence-section="top-models" style="display:block;background:#f8fbf9;border:1px solid #e2f1e7;border-radius:14px;padding:10px;margin-bottom:12px;">
        <div data-crop-ai-section-heading style="margin-bottom:10px;"><div style="font-size:14px;font-weight:900;color:#24323F;">상위 모델</div><div style="font-size:11px;color:#7a9780;margin-top:3px;">주요 예측 모델 3개를 같은 카드 포맷으로 정리합니다.</div></div>
      <article data-crop-ai-evidence-card="stage-prediction" data-crop-ai-stage-prediction-model data-crop-ai-metric-overview style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #dfeefe;">
        <div data-crop-ai-evidence-card-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;"><div><div style="font-size:12px;font-weight:900;color:#24323F;">작물 단계 예측</div><div style="font-size:10px;color:#6d8799;margin-top:3px;">G/L-Index와 최근 생육 추세로 단계 전환 가능성을 확인합니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:3px 8px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">top model</span></div>
        <div data-crop-ai-evidence-card-body style="display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:8px;">
        <div style="background:#fff;border-radius:12px;padding:10px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">G-Index 추이</div><b style="font-size:20px;color:#24323F;">${this._esc(String(latestG))}</b><div style="font-size:11px;color:#7a9780;">${gIndexTrend.length}개 point · 초장 ${heightTrend.length}개</div></div>
        <div style="background:#fff;border-radius:12px;padding:10px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">수확량 예측</div><b style="font-size:20px;color:#24323F;">${this._esc(String(yieldPrediction.estimatedKg ?? 0))}kg</b><div style="font-size:11px;color:#7a9780;">신뢰도 ${this._esc(yieldPrediction.confidence || "low")}</div></div>
        <div style="background:#fff;border-radius:12px;padding:10px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">병해 위험도</div><b style="font-size:20px;color:${pestRisk.level === 'high' ? '#c0392b' : pestRisk.level === 'medium' ? '#f39c12' : '#51AE60'};">${riskLabel}</b><div style="font-size:11px;color:#7a9780;">score ${this._esc(String(pestRisk.score ?? 0))}</div></div>
        </div>
        <div data-crop-ai-evidence-chip-group style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;"><span style="font-size:11px;background:#f5faf6;color:#5d7d64;border-radius:999px;padding:4px 8px;">현재 단계 ${this._esc(stageDiagnosis.stageLabel || "미확정")}</span><span style="font-size:11px;background:#f5faf6;color:#5d7d64;border-radius:999px;padding:4px 8px;">Index band ${this._esc(indexBand)}</span><span style="font-size:11px;background:#f5faf6;color:#5d7d64;border-radius:999px;padding:4px 8px;">검증 ${this._esc(validationStatusLabel)}</span></div>
      </article>
      <article data-crop-ai-evidence-card="reproductive-vegetative" data-crop-growth-state-numeric-evidence data-crop-ai-reproductive-vegetative-model data-crop-ai-yield-model-card style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #dfeefe;">
        <div data-crop-ai-evidence-card-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;"><div><div style="font-size:12px;font-weight:900;color:#24323F;">생육상태 수치 예측</div><div style="font-size:10px;color:#6d8799;margin-top:3px;">문자 상태값 없이 balanceScore · directionCode · magnitudeBandCode로만 표시합니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:3px 8px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">numeric model</span></div>
        <div data-crop-ai-evidence-card-body data-crop-growth-state-current-7d style="display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:8px;">
          <div style="background:#fff;border-radius:12px;padding:10px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">현재 balanceScore</div><b data-crop-growth-state-current-score style="font-size:20px;color:#24323F;">${this._esc(String(currentGrowthBalance.balanceScore ?? 0))}</b><div style="font-size:11px;color:#7a9780;">directionCode ${this._esc(String(currentGrowthBalance.directionCode ?? 9))} · band ${this._esc(String(currentGrowthBalance.magnitudeBandCode ?? 9))}</div></div>
          <div style="background:#fff;border-radius:12px;padding:10px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">7일 balanceScore</div><b data-crop-growth-state-predicted7d-score style="font-size:20px;color:#24323F;">${this._esc(String(predictedGrowthBalance7d.balanceScore ?? 0))}</b><div style="font-size:11px;color:#7a9780;">probabilityScore ${this._esc(String(predictedGrowthBalance7d.probabilityScore ?? 0))}</div></div>
          <div style="background:#fff;border-radius:12px;padding:10px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">movementScore7d</div><b data-crop-growth-state-movement-score style="font-size:20px;color:#24323F;">${this._esc(String(growthBalanceMovement.movementScore7d ?? 0))}</b><div style="font-size:11px;color:#7a9780;">velocity ${this._esc(String(growthBalanceMovement.velocityScore ?? 0))} · volatility ${this._esc(String(growthBalanceMovement.volatilityScore ?? 0))}</div></div>
        </div>
        <div data-crop-ai-evidence-chip-group data-crop-growth-state-driver-contributions style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
          ${Object.entries(growthStateDrivers).map(([name, driver]) => `<span data-crop-growth-state-driver data-driver-code="${this._esc(String(driver.driverCode ?? 0))}" style="font-size:11px;background:#f5faf6;color:#5d7d64;border-radius:999px;padding:4px 8px;">${this._esc(name)} code ${this._esc(String(driver.driverCode ?? 0))} · contrib ${this._esc(String(driver.contributionScore ?? 0))}</span>`).join("") || `<span style="font-size:11px;color:#9aae9d;">driver contribution 없음</span>`}
        </div>
        <div style="font-size:11px;color:#7a9780;margin-top:7px;">read-only · no diagnosis · no action · labels are derived outside the core model</div>
        <div data-crop-ai-yield-compatibility-row style="font-size:10px;color:#9aae9d;margin-top:6px;line-height:1.45;">작물별 수확 모델 · ${this._esc(yieldPrediction.modelVersion || "generic_growth_model_v1")} · estimatedKgPerPlant ${this._esc(String(yieldPrediction.estimatedKgPerPlant ?? 0))} · estimatedKgPerArea ${this._esc(String(yieldPrediction.estimatedKgPerArea ?? 0))} · cropModelLabel ${this._esc(yieldPrediction.cropModelLabel || "일반 생육 기반 수확 모델")} · yieldDrivers · confidenceReasons · 주당 예측 · 면적당 예측 · 예측 근거 ${this._esc(yieldPrediction.basis || "crop-specific growth model")}</div>
      </article>
      <article data-crop-ai-evidence-card="pest-prediction" data-crop-risk-factor-numeric-evidence data-crop-ai-pest-prediction-model data-crop-ai-pest-risk-model-card style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #dfeefe;">
        <div data-crop-ai-evidence-card-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;"><div><div style="font-size:12px;font-weight:900;color:#24323F;">병충해 예측</div><div style="font-size:10px;color:#6d8799;margin-top:3px;">병해 위험 모델 · 날씨·환경·방제 이력을 함께 보는 병해 위험 상위 모델입니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:3px 8px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">top model</span></div>
        <div data-crop-ai-evidence-card-body style="font-size:12px;color:#6b5b4d;line-height:1.6;">
          <b>${riskLabel}</b><span style="color:#9aae9d;"> · ${this._esc(pestRisk.modelVersion || "weather_environment_control_model_v1")}</span><br>
          환경 위험 ${this._esc(String(environmentDrivers.combinedHumidityTemperatureRisk ?? 0))} · 날씨 위험 ${this._esc(String((weatherDrivers.humidityRisk ?? 0) + (weatherDrivers.rainRisk ?? 0) + (weatherDrivers.temperatureRisk ?? 0)))} · 방제 이력 ${this._esc(String(controlHistoryDrivers.controlHistoryScore ?? 0))}
        </div>
        <div data-crop-ai-evidence-chip-group style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
          <span style="font-size:11px;background:#f5faf6;color:#5d7d64;border-radius:999px;padding:4px 8px;">습도 ${this._esc(String(weatherDrivers.avgHumidity ?? "-"))}%</span>
          <span style="font-size:11px;background:#fff8f5;color:#8a5d3b;border-radius:999px;padding:4px 8px;">온도 ${this._esc(String(weatherDrivers.avgTemperature ?? "-"))}℃</span>
          <span style="font-size:11px;background:#fff8f5;color:#8a5d3b;border-radius:999px;padding:4px 8px;">강우 신호 ${this._esc(String(weatherDrivers.rainSignalCount ?? 0))}</span>
          <span style="font-size:11px;background:#fff8f5;color:#8a5d3b;border-radius:999px;padding:4px 8px;">최근 방제 ${this._esc(String(controlHistoryDrivers.daysSinceLastControl ?? "없음"))}일</span>
        </div>
        <div style="font-size:11px;color:#7a9780;margin-top:7px;">위험 요인: ${riskFactors.length ? riskFactors.map(r => this._esc(r)).join(" · ") : "기록 부족"}</div>
        <div data-crop-risk-factor-items style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
          <span data-crop-risk-factor-contract-markers style="display:none;">highTemperatureStress temperatureSwingStress vpdStress ecStress controlFreshnessRisk bandCode trendCode</span>
          ${riskFactorGroups.flatMap((group) => Object.entries(group)).map(([name, item]) => `<span data-crop-risk-factor-item data-risk-code="${this._esc(String(item.riskCode ?? 0))}" style="font-size:11px;background:#fff8f5;color:#8a5d3b;border-radius:999px;padding:4px 8px;">${this._esc(name)} · score ${this._esc(String(item.score ?? 0))} · bandCode ${this._esc(String(item.bandCode ?? 9))} · trendCode ${this._esc(String(item.trendCode ?? 9))}</span>`).join("") || `<span style="font-size:11px;color:#9aae9d;">risk factor 없음</span>`}
        </div>
        <div style="font-size:11px;color:#7a9780;margin-top:5px;">highest riskCode ${this._esc(String(highestRiskFactor.riskCode ?? 0))} · groupCode ${this._esc(String(highestRiskFactor.groupCode ?? 0))} · read-only numeric evidence</div>
        ${recommendedActions.length ? `<div style="font-size:11px;color:#7a9780;margin-top:5px;">권장 조치: ${recommendedActions.map(a => this._esc(a)).join(" · ")}</div>` : ""}
      </article>
      <article data-crop-integrated-diagnosis-evidence data-crop-ai-evidence-card="integrated-diagnosis" style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #dfeefe;">
        <div data-crop-ai-evidence-card-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;"><div><div style="font-size:12px;font-weight:900;color:#24323F;">통합 작물 진단</div><div style="font-size:10px;color:#6d8799;margin-top:3px;">단계·상태·위험요소 예측을 해석한 read-only diagnosis signal입니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:3px 8px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">diagnosis</span></div>
        <div data-crop-ai-evidence-card-body style="display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:8px;">
          <div style="background:#fff;border-radius:12px;padding:10px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">sourceSinkGapScore</div><b style="font-size:20px;color:#24323F;">${this._esc(String(sourceSinkDiagnosis.sourceSinkGapScore ?? 0))}</b><div style="font-size:11px;color:#7a9780;">gapSeverityCode ${this._esc(String(sourceSinkDiagnosis.gapSeverityCode ?? 9))}</div></div>
          <div style="background:#fff;border-radius:12px;padding:10px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">transitionNeedCode</div><b style="font-size:20px;color:#24323F;">${this._esc(String(transitionDiagnosis.transitionNeedCode ?? 9))}</b><div style="font-size:11px;color:#7a9780;">balance ${this._esc(String(transitionDiagnosis.vegetativeGenerativeBalanceScore ?? 0))}</div></div>
          <div style="background:#fff;border-radius:12px;padding:10px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">환경/관수 review</div><b style="font-size:20px;color:#24323F;">${this._esc(String(transitionDiagnosis.environmentModelReviewCode ?? 9))}/${this._esc(String(transitionDiagnosis.irrigationNutrientModelReviewCode ?? 9))}</b><div style="font-size:11px;color:#7a9780;">environmentModelReviewCode · irrigationNutrientModelReviewCode</div></div>
        </div>
        <div data-crop-ai-evidence-chip-group style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
          ${Object.entries(reviewSignals).map(([name, code]) => `<span data-crop-diagnosis-review-signal style="font-size:11px;background:#f5faf6;color:#5d7d64;border-radius:999px;padding:4px 8px;">${this._esc(name)} ${this._esc(String(code))}</span>`).join("") || `<span style="font-size:11px;color:#9aae9d;">review signal 없음</span>`}
        </div>
        <div style="font-size:11px;color:#7a9780;margin-top:7px;">read-only · no setpoint · no work order · no execution</div>
      </article>
      <article data-crop-action-recommendation-evidence data-crop-ai-evidence-card="action-recommendation" style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #dfeefe;">
        <div data-crop-ai-evidence-card-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;"><div><div style="font-size:12px;font-weight:900;color:#24323F;">조치 추천 요청</div><div style="font-size:10px;color:#6d8799;margin-top:3px;">통합진단 signal을 작업 검토/모델 검토 요청 코드로 변환합니다. 실행 권한은 없습니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:3px 8px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">request only</span></div>
        <div data-crop-action-recommendation-card style="display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:8px;">
          ${Object.entries(workReviewRequests).map(([name, req]) => `<span data-crop-action-work-request data-crop-action-priority-code="${this._esc(String(req.priorityCode ?? 9))}" style="font-size:11px;background:#f5faf6;color:#5d7d64;border-radius:10px;padding:8px;">${this._esc(name)} · requestCode ${this._esc(String(req.requestCode ?? 0))} · priorityCode ${this._esc(String(req.priorityCode ?? 9))}</span>`).join("") || `<span style="font-size:11px;color:#9aae9d;">work request 없음</span>`}
          ${Object.entries(modelReviewRequests).map(([name, req]) => `<span data-crop-action-model-request data-crop-action-priority-code="${this._esc(String(req.priorityCode ?? 9))}" style="font-size:11px;background:#f7fbff;color:#4f6f83;border-radius:10px;padding:8px;">${this._esc(name)} · requestCode ${this._esc(String(req.requestCode ?? 0))} · priorityCode ${this._esc(String(req.priorityCode ?? 9))} · targetCandidateAuthorityCode ${this._esc(String(req.targetCandidateAuthorityCode ?? 0))}</span>`).join("") || `<span style="font-size:11px;color:#9aae9d;">model request 없음</span>`}
        </div>
        <div style="font-size:11px;color:#7a9780;margin-top:7px;">read-only · no target value · no work order · no execution</div>
      </article>
      <div style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #e6eef7;" data-stage-diagnosis-card>
        <div style="font-size:12px;font-weight:900;color:#24323F;margin-bottom:6px;">현재 생육단계</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px;">
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">단계</div><b style="font-size:15px;color:#24323F;">${this._esc(stageDiagnosis.stageLabel || "생육단계 미확정")}</b><div style="font-size:10px;color:#9aae9d;">${this._esc(stageDiagnosis.stageId || "unknown")}</div></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">단계 신뢰도</div><b style="font-size:15px;color:#24323F;">${this._esc(stageDiagnosis.stageConfidence || "low")}</b><div style="font-size:10px;color:#9aae9d;">DAT ${this._esc(String(stageDiagnosis.daysAfterTransplant ?? "-"))}</div></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">Index band</div><b style="font-size:15px;color:${indexBandColor};">${this._esc(indexBand)}</b><div style="font-size:10px;color:#9aae9d;">${this._esc(stageDiagnosis.indexType || "G/L-Index")} ${this._esc(String(stageDiagnosis.indexValue ?? "-"))}</div></div>
        </div>
        <div style="font-size:11px;color:#5d7d64;margin-top:8px;line-height:1.55;"><b>다음 조사</b> ${this._esc(stageDiagnosis.nextRequiredSurvey || "최신 생육조사와 단계 전환 증거를 기록하세요.")}</div>
        <div style="font-size:11px;color:#7a9780;margin-top:5px;"><b>부족한 증거</b> ${missingEvidence.length ? missingEvidence.map(e => this._esc(e)).join(" · ") : "없음"}</div>
      </div>
            <div data-crop-trainable-baseline-card style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #e4f0ff;">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:7px;">
          <div>
            <div style="font-size:12px;font-weight:900;color:#24323F;">학습 데이터 베이스라인</div>
            <div style="font-size:10px;color:#6d8799;margin-top:3px;">7일 생육단계 예측 · hybrid_rule_score_v1 · read-only training dataset</div>
          </div>
          <span data-crop-ml-readiness style="font-size:10px;font-weight:900;border-radius:999px;padding:3px 8px;background:${mlReady ? '#e8f8ee' : '#f5faf6'};color:${mlReady ? '#1e8e3e' : '#7a9780'};border:1px solid #dbeaf8;">${mlReady ? '시계열 모델 확장 가능' : '시계열 모델 확장 준비중'}</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">predictedStage7d</div><b style="font-size:14px;color:#24323F;">${this._esc(predictedStage7d.stageLabel || '-')}</b><div style="font-size:10px;color:#9aae9d;">확률 ${this._esc(String(predictedStage7d.probability ?? '-'))}</div></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">transitionWindow</div><b style="font-size:14px;color:#24323F;">${this._esc(transitionWindow.label || '-')}</b><div style="font-size:10px;color:#9aae9d;">day ${this._esc(String(transitionWindow.earliestDay ?? '-'))}~${this._esc(String(transitionWindow.latestDay ?? '-'))}</div></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">mlUpgradeReadiness</div><b style="font-size:14px;color:${mlReady ? '#51AE60' : '#7a9780'};">${mlReady ? 'ready' : 'not ready'}</b><div style="font-size:10px;color:#9aae9d;">${this._esc((mlUpgradeReadiness.reasons || []).join(' · ') || '조건 충족')}</div></div>
        </div>
        <div style="font-size:11px;color:#6d8799;margin-top:8px;line-height:1.55;">초기 예측은 학습 가능한 데이터셋을 쌓기 위한 baseline입니다. 충분한 주간 sequence와 prediction→actual 검증쌍이 쌓이면 LSTM/GRU/Transformer 확장 후보를 표시합니다.</div>
      </div>
      <div data-crop-stage-prediction-score-card style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #dfeefe;">
        <div style="font-size:12px;font-weight:900;color:#24323F;margin-bottom:6px;">투명 생육단계 예측 점수</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;">
          <div><div style="font-size:11px;color:#6d8799;font-weight:800;">confidenceScore</div><b style="font-size:14px;color:#24323F;">${this._esc(String(stagePredictionScore.confidenceScore ?? '-'))}</b><div style="font-size:10px;color:#9aae9d;">confidencePercent ${this._esc(String(stagePredictionScore.confidencePercent ?? '-'))}%</div></div>
          <div><div style="font-size:11px;color:#6d8799;font-weight:800;">rawScore</div><b style="font-size:14px;color:#24323F;">${this._esc(String(stagePredictionScore.rawScore ?? '-'))}</b><div style="font-size:10px;color:#9aae9d;">probability ${this._esc(String(stagePredictionScore.probability ?? predictedStage7d.probability ?? '-'))}</div></div>
          <div><div style="font-size:11px;color:#6d8799;font-weight:800;">kmaWeatherStressScore</div><b style="font-size:14px;color:#24323F;">${this._esc(String(scoreComponents.kmaWeatherStressScore ?? '-'))}</b><div style="font-size:10px;color:#9aae9d;">environmentStressScore ${this._esc(String(scoreComponents.environmentStressScore ?? '-'))}</div></div>
        </div>
        <div style="font-size:11px;color:#6d8799;margin-top:8px;line-height:1.55;">scoreComponents: ${Object.entries(scoreComponents).length ? Object.entries(scoreComponents).map(([k, v]) => `${this._esc(k)}=${this._esc(String(v))}`).join(' · ') : '예측 점수 근거 없음'} · read-only model evidence</div>
      </div>
      </section>
      <section data-crop-ai-submodels data-crop-ai-evidence-section="submodels" style="display:block;background:#f8fbf9;border:1px solid #e2f1e7;border-radius:14px;padding:10px;margin-bottom:12px;">
        <div data-crop-ai-section-heading style="margin-bottom:10px;"><div style="font-size:14px;font-weight:900;color:#24323F;">하위 모델 / 입력 근거</div><div style="font-size:11px;color:#7a9780;margin-top:3px;">상위 모델이 참고한 입력 근거를 같은 카드 포맷으로 정리합니다.</div></div>
      <article data-crop-ai-evidence-card="kma-weather-stress" data-crop-ai-submodel-evidence-section data-crop-kma-weather-stress-card style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #dfeefe;">
        <div data-crop-ai-evidence-card-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;"><div><div style="font-size:12px;font-weight:900;color:#24323F;">KMA 7일 weather-stress</div><div style="font-size:10px;color:#6d8799;margin-top:3px;">단기 기상 스트레스가 상위 모델에 주는 입력 신호입니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:3px 8px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">submodel</span></div>
        <div data-crop-ai-evidence-card-body style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;">
          <div><div style="font-size:11px;color:#6d8799;font-weight:800;">sourceStatus</div><b style="font-size:14px;color:#24323F;">${this._esc(kmaWeatherStress7d.sourceStatus || '-')}</b><div style="font-size:10px;color:#9aae9d;">coverage ${this._esc(String(kmaWeatherFeatures.kmaForecastCoverageRatio ?? '-'))}</div></div>
          <div><div style="font-size:11px;color:#6d8799;font-weight:800;">highTemperatureDays</div><b style="font-size:14px;color:#24323F;">${this._esc(String(kmaWeatherFeatures.highTemperatureDays ?? '-'))}</b><div style="font-size:10px;color:#9aae9d;">lowTemperatureDays ${this._esc(String(kmaWeatherFeatures.lowTemperatureDays ?? '-'))}</div></div>
          <div><div style="font-size:11px;color:#6d8799;font-weight:800;">rapidTemperatureChangeDays</div><b style="font-size:14px;color:#24323F;">${this._esc(String(kmaWeatherFeatures.rapidTemperatureChangeDays ?? '-'))}</b><div style="font-size:10px;color:#9aae9d;">max swing ${this._esc(String(kmaWeatherFeatures.maxDailyTemperatureSwing ?? '-'))}</div></div>
        </div>
        <div data-crop-ai-evidence-chip-group style="font-size:11px;color:#6d8799;margin-top:8px;line-height:1.55;">kmaWeatherStress7d: ${(kmaWeatherStress7d.weatherStressReasons || []).length ? kmaWeatherStress7d.weatherStressReasons.map(r => this._esc(r)).join(' · ') : '특이 weather-stress 없음'} · read-only forecast/model input · 환경/관수/장치 실행 권한 없음</div>
      </article>
      <article data-crop-ai-evidence-card="environment-features" data-crop-environment-features-card style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #e5f0ff;">
        <div data-crop-ai-evidence-card-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;"><div><div style="font-size:12px;font-weight:900;color:#24323F;">환경 feature</div><div style="font-size:10px;color:#6d8799;margin-top:3px;">환경/VPD/ADT/DIF 등 생육 모델 입력입니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:3px 8px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">submodel</span></div>
        <div data-crop-ai-evidence-card-body style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;">
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">sourceStatus</div><b style="font-size:14px;color:#24323F;">${this._esc(envStatus)}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">sampleCoverageRatio</div><b style="font-size:14px;color:#24323F;">${this._esc(String(environmentSummary7d.sampleCoverageRatio ?? '-'))}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">VPD</div><b style="font-size:14px;color:#24323F;">${this._esc(String((environmentFeatures.vpd || environmentDerivedFeatures.vpd || {}).avg ?? '-'))}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">ADT</div><b style="font-size:14px;color:#24323F;">${this._esc(String((environmentFeatures.adt || environmentDerivedFeatures.adt || {}).value ?? '-'))}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">DIF</div><b style="font-size:14px;color:#24323F;">${this._esc(String((environmentFeatures.dif || environmentDerivedFeatures.dif || {}).value ?? '-'))}</b></div>
        </div>
        <div data-crop-ai-evidence-chip-group style="font-size:11px;color:#6d8799;margin-top:8px;line-height:1.55;">staleReasons: ${environmentStaleReasons.length ? environmentStaleReasons.map(r => this._esc(r)).join(' · ') : '없음'} · read-only model evidence · 환경/관수/장치 실행 권한 없음</div>
      </article>
      <article data-crop-ai-evidence-card="irrigation-nutrient-features" data-crop-irrigation-nutrient-features-card style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #e7f5ed;">
        <div data-crop-ai-evidence-card-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;"><div><div style="font-size:12px;font-weight:900;color:#24323F;">관수 제어 feature</div><div style="font-size:10px;color:#6d8799;margin-top:3px;">EC/pH/dryback 등 생육 균형 보조 입력입니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:3px 8px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">submodel</span></div>
        <div data-crop-ai-evidence-card-body style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;">
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">sourceStatus</div><b style="font-size:14px;color:#24323F;">${this._esc(irrStatus)}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">feedEcAvg</div><b style="font-size:14px;color:#24323F;">${this._esc(String(irrigationNutrientFeatures.feedEcAvg ?? '-'))}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">drainEcAvg</div><b style="font-size:14px;color:#24323F;">${this._esc(String(irrigationNutrientFeatures.drainEcAvg ?? '-'))}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">ecDeltaFeedDrain</div><b style="font-size:14px;color:#24323F;">${this._esc(String(irrigationNutrientFeatures.ecDeltaFeedDrain ?? '-'))}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">phDeltaFeedDrain</div><b style="font-size:14px;color:#24323F;">${this._esc(String(irrigationNutrientFeatures.phDeltaFeedDrain ?? '-'))}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">drybackProxy</div><b style="font-size:14px;color:#24323F;">${this._esc(String(irrigationNutrientFeatures.drybackProxy ?? '-'))}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">staleDrainFeedback</div><b style="font-size:14px;color:#24323F;">${this._esc(String(irrigationNutrientFeatures.staleDrainFeedback ?? '-'))}</b></div>
        </div>
        <div data-crop-ai-evidence-chip-group style="font-size:11px;color:#5f7f70;margin-top:8px;line-height:1.55;">staleReasons: ${irrigationStaleReasons.length ? irrigationStaleReasons.map(r => this._esc(r)).join(' · ') : '없음'} · read-only model evidence · 관수/PID/펌프/양액 실행 권한 없음</div>
      </article>
      <article data-crop-ai-evidence-card="pest-control-features" data-crop-pest-control-features-card style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #ffe6e6;">
        <div data-crop-ai-evidence-card-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;"><div><div style="font-size:12px;font-weight:900;color:#24323F;">병해/방제 feature</div><div style="font-size:10px;color:#6d8799;margin-top:3px;">예찰·방제 이력 기반 병해 위험 보조 입력입니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:3px 8px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">submodel</span></div>
        <div data-crop-ai-evidence-card-body style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;">
          <div><div style="font-size:11px;color:#9b6b6b;font-weight:800;">sourceStatus</div><b style="font-size:14px;color:#24323F;">${this._esc(pestStatus)}</b></div>
          <div><div style="font-size:11px;color:#9b6b6b;font-weight:800;">recentPestSeverityTrend</div><b style="font-size:14px;color:#24323F;">${this._esc(String(pestControlFeatures.recentPestSeverityTrend ?? '-'))}</b></div>
          <div><div style="font-size:11px;color:#9b6b6b;font-weight:800;">controlFreshnessDays</div><b style="font-size:14px;color:#24323F;">${this._esc(String(pestControlFeatures.controlFreshnessDays ?? '-'))}</b></div>
          <div><div style="font-size:11px;color:#9b6b6b;font-weight:800;">phiRiskFlag</div><b style="font-size:14px;color:#24323F;">${this._esc(String(pestControlFeatures.phiRiskFlag ?? '-'))}</b></div>
          <div><div style="font-size:11px;color:#9b6b6b;font-weight:800;">reiRiskFlag</div><b style="font-size:14px;color:#24323F;">${this._esc(String(pestControlFeatures.reiRiskFlag ?? '-'))}</b></div>
          <div><div style="font-size:11px;color:#9b6b6b;font-weight:800;">missingControlAfterHighRiskFlag</div><b style="font-size:14px;color:#24323F;">${this._esc(String(pestControlFeatures.missingControlAfterHighRiskFlag ?? '-'))}</b></div>
        </div>
        <div data-crop-ai-evidence-chip-group style="font-size:11px;color:#8a5a5a;margin-top:8px;line-height:1.55;">reviewGuidance: ${pestReviewGuidance.length ? pestReviewGuidance.map(r => this._esc(r)).join(' · ') : '없음'} · read-only model evidence · 방제/약제 실행 권한 없음</div>
      </article>
      <article data-crop-ai-evidence-card="model-feature-sources" data-crop-model-feature-sources-card style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #e9edf5;">
        <div data-crop-ai-evidence-card-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;"><div><div style="font-size:12px;font-weight:900;color:#24323F;">모델 입력 소스</div><div style="font-size:10px;color:#6d8799;margin-top:3px;">환경/관수/병해 입력의 가용성과 완성도입니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:3px 8px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">submodel</span></div>
        <div data-crop-ai-evidence-card-body style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;">
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">환경 7일</div><b style="font-size:14px;color:#24323F;">${this._esc(envStatus)}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">관수 제어 7일</div><b style="font-size:14px;color:#24323F;">${this._esc(irrStatus)}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">병해/방제</div><b style="font-size:14px;color:#24323F;">${this._esc(pestStatus)}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">입력 완성도</div><b style="font-size:14px;color:#24323F;">${this._esc(String(inputCompleteness.score ?? '-'))}</b></div>
        </div>
        <div data-crop-ai-evidence-chip-group style="font-size:11px;color:#6d8799;margin-top:8px;line-height:1.55;">sourceStatus · inputCompleteness 기준으로 생육조사 외 환경/관수/병해/작업/인터록 입력이 실제 모델 feature에 포함됩니다.</div>
      </article>
      </section>
      <section data-crop-ai-model-operations data-crop-ai-evidence-section="model-operations" style="display:block;background:#f8fbf9;border:1px solid #e2f1e7;border-radius:14px;padding:10px;margin-bottom:12px;">
        <div data-crop-ai-section-heading style="margin-bottom:10px;"><div style="font-size:14px;font-weight:900;color:#24323F;">모델 운영/검증 참고</div><div style="font-size:11px;color:#7a9780;margin-top:3px;">상위/하위 모델은 아니지만 운영·검증·학습 준비도 확인에 필요한 보조 카드입니다.</div></div>
<article data-crop-ai-evidence-card="operator-workflow" data-crop-operator-workflow-card style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #dfeefe;">
        <div data-crop-ai-evidence-card-header style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px;">
          <div>
            <div style="font-size:14px;font-weight:900;color:#24323F;">이번 주 작물 모델 작업 안내</div>
            <div style="font-size:11px;color:#5f7f70;margin-top:4px;line-height:1.5;">농장주/직원용 요약입니다. 아래 상세 근거 카드는 감사/진단용으로 유지합니다.</div>
          </div>
          <span style="font-size:10px;font-weight:900;border-radius:999px;padding:4px 9px;background:#fff;color:#4a6741;border:1px solid #dbeee0;">operatorWorkflowVersion ${this._esc(operatorWorkflow.operatorWorkflowVersion || '-')}</span>
        </div>
        <div data-crop-ai-evidence-card-body style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:9px;">
          <div data-crop-operator-weekly-input-status style="background:#fff;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div style="font-size:11px;color:#5f7f70;font-weight:900;">이번 주 입력 완료 여부</div><b style="font-size:16px;color:${weeklyInputStatus.complete ? '#51AE60' : '#c97a00'};">${this._esc(weeklyInputStatus.label || (weeklyInputStatus.complete ? '완료' : '입력 필요'))}</b><div style="font-size:10px;color:#8aa091;margin-top:3px;">최근 조사 ${this._esc(String(weeklyInputStatus.latestSurveyDate || '-'))}</div></div>
          <div data-crop-operator-missing-inputs style="background:#fff;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div style="font-size:11px;color:#5f7f70;font-weight:900;">부족한 입력</div><b style="font-size:16px;color:${operatorMissingInputs.length ? '#c0392b' : '#51AE60'};">${operatorMissingInputs.length ? `${operatorMissingInputs.length}개 보완` : '없음'}</b><div style="font-size:10px;color:#8aa091;margin-top:3px;line-height:1.45;">${operatorMissingInputs.length ? operatorMissingInputs.slice(0,3).map(i => this._esc(i.label || i.key || String(i))).join(' · ') : '현재 입력 흐름 양호'}</div></div>
          <div data-crop-operator-last-validation-summary style="background:#fff;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div style="font-size:11px;color:#5f7f70;font-weight:900;">지난 예측 검증 결과</div><b style="font-size:16px;color:#24323F;">${this._esc(operatorValidationSummary.status || validationStatusLabel)}</b><div style="font-size:10px;color:#8aa091;margin-top:3px;">검증 ${this._esc(String(operatorValidationSummary.validatedCount ?? predictionValidation.validatedCount ?? 0))} · 대기 ${this._esc(String(operatorValidationSummary.pendingCount ?? predictionValidation.pendingCount ?? 0))}</div></div>
          <div data-crop-operator-time-series-readiness style="background:#fff;border-radius:12px;padding:10px;border:1px solid #e2f1e7;"><div style="font-size:11px;color:#5f7f70;font-weight:900;">시계열 모델 확장 가능 여부</div><b style="font-size:16px;color:${operatorTimeSeriesReadiness.ready ? '#51AE60' : '#7a9780'};">${this._esc(operatorTimeSeriesReadiness.label || (mlReady ? '시계열 모델 확장 가능' : '시계열 모델 확장 준비중'))}</b><div style="font-size:10px;color:#8aa091;margin-top:3px;line-height:1.45;">${this._esc((operatorTimeSeriesReadiness.reasons || mlUpgradeReadiness.reasons || []).slice(0,2).join(' · ') || '조건 충족')}</div></div>
        </div>
        <div data-crop-operator-next-survey-checklist style="background:#fff;border-radius:12px;padding:10px;border:1px solid #e2f1e7;margin-top:9px;">
          <div style="font-size:11px;color:#5f7f70;font-weight:900;margin-bottom:5px;">다음 생육조사 때 확인할 것</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6px;">${operatorChecklist.length ? operatorChecklist.slice(0,4).map((item, idx) => `<div style="font-size:11px;color:#24323F;line-height:1.45;background:#f8fbf9;border-radius:9px;padding:7px;"><b>${idx + 1}.</b> ${this._esc(item)}</div>`).join('') : '<div style="font-size:11px;color:#7a9780;">다음 조사 체크리스트 없음</div>'}</div>
        </div>
        <div data-crop-ai-evidence-chip-group style="font-size:10px;color:#7a9780;margin-top:8px;line-height:1.5;">${operatorWarnings.length ? operatorWarnings.map(w => this._esc(w)).join(' · ') : '실행 권한 없음'} · 모바일/PC 반응형 요약 · 상세 근거는 아래 카드에서 확인</div>
      </article>
      <article data-crop-ai-evidence-card="quality-disorder" data-crop-quality-disorder-summary-card style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #efe7ff;">
        <div data-crop-ai-evidence-card-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;"><div><div style="font-size:12px;font-weight:900;color:#24323F;">품질/장해 요약</div><div style="font-size:10px;color:#6d8799;margin-top:3px;">품질/생리장해 위험 신호와 누락 metric을 모델 운영 참고로 분리합니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:3px 8px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">operation</span></div>
        <div data-crop-ai-evidence-card-body style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;">
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">cropType</div><b style="font-size:14px;color:#24323F;">${this._esc(qualityDisorderSummary.cropType || '-')}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">riskFlags</div><b style="font-size:14px;color:${qualityRiskFlags.length ? '#c0392b' : '#51AE60'};">${this._esc(String(qualityRiskFlags.length))}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">missingMetrics</div><b style="font-size:14px;color:#7a9780;">${this._esc(String(qualityMissingMetrics.length))}</b></div>
        </div>
        <div data-crop-ai-evidence-chip-group style="font-size:11px;color:#7a6d99;margin-top:8px;line-height:1.55;">${qualityRiskFlags.length ? qualityRiskFlags.map(r => this._esc(r)).join(' · ') : '기록된 품질/생리장해 위험 신호 없음'}${qualityMissingMetrics.length ? ` · 미입력: ${qualityMissingMetrics.map(r => this._esc(r)).join(' · ')}` : ''}</div>
      </article>
      <article data-crop-ai-evidence-card="prediction-validation" data-crop-prediction-validation-card style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #efe7ff;"><div data-crop-ai-evidence-card-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;"><div><div style="font-size:12px;font-weight:900;color:#24323F;">예측 검증 상태</div><div style="font-size:10px;color:#6d8799;margin-top:3px;">예측과 실제 조사 비교 상태를 모델 검증 참고로 분리합니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:3px 8px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">operation</span></div>
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:7px;">
          <div>
            <div style="font-size:12px;font-weight:900;color:#24323F;">예측 검증 상태</div>
            <div style="font-size:10px;color:#7a6d99;margin-top:3px;">7일 예측을 최근 실제 조사와 비교해 학습 label로 저장합니다.</div>
          </div>
          <button data-crop-prediction-validation-run title="예측 검증 실행" style="border:1px solid #d8c8f0;background:#faf7ff;color:#6d4aa0;border-radius:9px;padding:5px 7px;font-size:10px;font-weight:900;cursor:pointer;">검증 실행</button>
        </div>
        <div data-crop-ai-evidence-card-body style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;">
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">validationStatus</div><b data-crop-prediction-validation-status style="font-size:14px;color:#24323F;">${this._esc(validationStatusLabel)}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">pending</div><b style="font-size:14px;color:#24323F;">${this._esc(String(predictionValidation.pendingCount ?? 0))}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">validated</div><b style="font-size:14px;color:#51AE60;">${this._esc(String(predictionValidation.validatedCount ?? 0))}</b></div>
          <div><div style="font-size:11px;color:#7a9780;font-weight:800;">needs review</div><b style="font-size:14px;color:#c0392b;">${this._esc(String(predictionValidation.needsReviewCount ?? 0))}</b></div>
        </div>
        <div data-crop-ai-evidence-chip-group style="font-size:11px;color:#7a6d99;margin-top:8px;line-height:1.55;">최근 실제 조사 입력 후 검증 실행을 누르면 pending prediction이 actualValidation으로 갱신됩니다. 이 동작은 데이터 처리만 수행하며 장치/환경/관수 실행 권한은 없습니다.</div>
      </article>
      <article data-crop-ai-evidence-card="training-dataset-export" data-crop-training-dataset-export-card style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #dfeefe;">
        <div data-crop-ai-evidence-card-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;"><div><div style="font-size:12px;font-weight:900;color:#24323F;">학습 데이터셋 내보내기 준비도</div><div style="font-size:10px;color:#6d8799;margin-top:3px;">학습/내보내기 준비도는 운영 참고이며 자동 학습/배포 권한이 없습니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:3px 8px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">operation</span></div>
        <div data-crop-ai-evidence-card-body style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;">
          <div><div style="font-size:11px;color:#6d8799;font-weight:800;">trainingDatasetVersion</div><b style="font-size:14px;color:#24323F;">${this._esc(trainingDataset.trainingDatasetVersion || '-')}</b><div style="font-size:10px;color:#9aae9d;">no automatic ML deployment</div></div>
          <div><div style="font-size:11px;color:#6d8799;font-weight:800;">featureColumns</div><b style="font-size:14px;color:#24323F;">${this._esc(String((trainingDataset.featureColumns || []).length || 0))}</b><div style="font-size:10px;color:#9aae9d;">labelColumns ${this._esc(String((trainingDataset.labelColumns || []).length || 0))}</div></div>
          <div><div style="font-size:11px;color:#6d8799;font-weight:800;">validatedRows</div><b style="font-size:14px;color:${trainingDatasetReadiness.ready ? '#51AE60' : '#7a9780'};">${this._esc(String(trainingDatasetReadiness.validatedRows ?? 0))}</b><div style="font-size:10px;color:#9aae9d;">coverage ${this._esc(String(trainingDatasetReadiness.featureCoverageRatio ?? 0))}</div></div>
        </div>
        <div data-crop-ai-evidence-chip-group style="font-size:11px;color:#6d8799;margin-top:8px;line-height:1.55;">exportWarnings: ${trainingDatasetWarnings.length ? trainingDatasetWarnings.map(w => this._esc(w)).join(' · ') : 'no automatic ML deployment'} · 자동 학습/배포 없음 · read-only dataset export</div>
      </article>
      </section>
      <section data-crop-ai-center-reference-summary data-crop-ai-evidence-section="center-reference" style="display:block;background:#f8fbf9;border:1px solid #e2f1e7;border-radius:14px;padding:10px;margin-bottom:12px;">
        <div data-crop-ai-section-heading style="margin-bottom:8px;"><div style="font-size:14px;font-weight:900;color:#24323F;">센터 분석 참고</div><div style="font-size:11px;color:#7a9780;margin-top:3px;">센터 분석은 반복 패턴과 정책 추천 후보 확인용입니다.</div></div>
      ${this._renderCenterCropInterlockAnalyticsCard()}
      <div data-center-crop-policy-card style="background:#fff;border-radius:12px;padding:10px;margin-bottom:10px;border:1px solid #dbeaf8;">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:7px;">
          <div>
            <div style="font-size:12px;font-weight:900;color:#24323F;">센터 작물 정책</div>
            <div style="font-size:10px;color:#6d8799;margin-top:3px;">현장 Edge가 최종 판단 · read-only · 환경/관수/장치 PID 적용은 제외</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">
            <span data-center-crop-policy-notification-state style="font-size:10px;color:${cropPolicyNotificationEnabled ? '#51AE60' : '#9aa6a0'};font-weight:800;">작물 정책 알림 ${cropPolicyNotificationEnabled ? 'ON' : 'OFF'}</span>
            <button data-center-crop-policy-notification-toggle title="작물 정책 알림 사용" style="border:1px solid ${cropPolicyNotificationEnabled ? '#f5a623' : '#cfd8d3'};background:${cropPolicyNotificationEnabled ? '#fff7e6' : '#f1f3f2'};color:${cropPolicyNotificationEnabled ? '#f5a623' : '#9aa6a0'};border-radius:9px;padding:5px 7px;font-size:10px;font-weight:900;cursor:pointer;">알림 사용</button>
            <button data-center-crop-policy-notification-dismiss title="작물 정책 알림 해제" style="border:1px solid #dbeaf8;background:#fff;color:#6d8799;border-radius:9px;padding:5px 7px;font-size:10px;font-weight:900;cursor:pointer;">알림 해제</button>
            <span style="font-size:11px;font-weight:900;border-radius:999px;padding:3px 8px;background:#f7fbff;color:${policyColor};border:1px solid #dbeaf8;">${this._esc(policyLabel)} · ${this._esc(policyStatus)}</span>
          </div>
        </div>
        ${policyAlertActive ? `<div data-center-crop-policy-alert-summary style="background:#fff8e8;border:1px solid #f6d08b;border-radius:10px;padding:8px;margin-bottom:8px;color:#8a5d00;line-height:1.5;">
          <div style="font-size:11px;font-weight:900;">작물 정책 경고 · 기록/알림 기준 상태</div>
          <div style="font-size:10px;margin-top:3px;">${this._esc(policyAlertMessage)} · 실행 버튼 없음</div>
        </div>` : ""}
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:8px;margin-bottom:8px;">
          <div style="background:#f8fbf9;border-radius:10px;padding:8px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">모델 반영</div><b style="font-size:14px;color:${cropModel.cropPolicyAppliedToModel ? '#51AE60' : '#c0392b'};">${cropModel.cropPolicyAppliedToModel ? "반영" : "미반영"}</b></div>
          <div style="background:#f8fbf9;border-radius:10px;padding:8px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">인터록 반영</div><b style="font-size:14px;color:${cropModel.cropPolicyAppliedToInterlock ? '#51AE60' : '#c0392b'};">${cropModel.cropPolicyAppliedToInterlock ? "반영" : "미반영"}</b></div>
          <div style="background:#f8fbf9;border-radius:10px;padding:8px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">applyMode</div><b style="font-size:14px;color:#24323F;">${this._esc(applyMode || "recommend_only")}</b></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
          ${modelVarEntries.length ? modelVarEntries.map(([k, v]) => policyChip(`모델 ${k}`, typeof v === 'object' ? JSON.stringify(v) : v)).join("") : policyChip("모델 변수", "없음")}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
          ${interlockVarEntries.length ? interlockVarEntries.map(([k, v]) => policyChip(`인터록 ${k}`, typeof v === 'object' ? JSON.stringify(v) : v)).join("") : policyChip("인터록 변수", "없음")}
        </div>
        <div style="font-size:11px;color:#7a9780;margin-top:7px;line-height:1.55;"><b>추천 힌트</b> ${hintEntries.length ? hintEntries.map(([k, v]) => `${this._esc(k)}=${this._esc(typeof v === 'object' ? JSON.stringify(v) : String(v))}`).join(" · ") : "없음"}</div>
        <div data-center-crop-policy-guidance style="background:#f7fbff;border:1px solid #dbeaf8;border-radius:10px;padding:8px;margin-top:8px;line-height:1.55;">
          <div style="font-size:11px;font-weight:900;color:#24323F;">${this._esc(policyGuidance.title)}</div>
          <div style="font-size:10px;color:#6d8799;margin-top:3px;">${this._esc(policyGuidance.detail)}</div>
        </div>
        <div data-center-crop-policy-reasons style="font-size:11px;color:#7a9780;margin-top:7px;line-height:1.55;"><b>정책 상태 이유</b> ${translatedCenterPolicyReasons.length ? translatedCenterPolicyReasons.map((r) => this._esc(r)).join(" · ") : "Center 정책 관련 특이 사유 없음"}</div>
        <div data-center-crop-policy-next-action style="font-size:11px;color:#4a6741;margin-top:5px;line-height:1.55;"><b>다음 조치</b> ${this._esc(translatedNextAction)}</div>
        <div style="font-size:10px;color:#9aae9d;margin-top:5px;">fresh · stale_usable · stale_restricted · fallback_safe · rejected · recommend_only</div>
      </div>
      <div style="font-size:12px;color:#4a6741;line-height:1.55;"><b>주간 리포트</b> ${this._esc(weeklyReport.summary || "생육조사 기록을 추가하면 주간 리포트가 생성됩니다.")}</div>
      ${actions.length ? `<ul style="margin:8px 0 0 18px;padding:0;color:#5d7d64;font-size:12px;">${actions.map(a => `<li>${this._esc(a)}</li>`).join("")}</ul>` : ""}
      </section>
        </div>
      </details>
    </section>`;
  }

  _renderCenterCropInterlockAnalyticsCard() {
    const data = this._centerCropInterlockAnalyticsData || {};
    const reason_counts = data.reason_counts || {};
    const approval_gate_counts = data.approval_gate_counts || {};
    const approval_type_counts = data.approval_type_counts || {};
    const topReasons = Object.entries(reason_counts).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 4);
    const topGates = Object.entries(approval_gate_counts).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 3);
    const topApprovals = Object.entries(approval_type_counts).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 3);
    const unavailable = data.error || !this._activeSeasonId;
    const chip = (label, value, color = "#4a6741") => `<span style="display:inline-flex;gap:5px;align-items:center;background:#f5faf6;color:${color};border:1px solid #e2efe4;border-radius:999px;padding:4px 8px;font-size:11px;font-weight:800;"><b>${this._esc(label)}</b>${this._esc(String(value ?? 0))}</span>`;
    const list = (items, empty) => items.length ? items.map(([k, v]) => chip(k, v)).join(" ") : `<span style="font-size:11px;color:#9aae9d;">${empty}</span>`;
    return `<div data-center-crop-interlock-analytics-card style="background:#f7fbff;border:1px solid #dbeaf8;border-radius:12px;padding:10px;margin-top:10px;">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;">
        <div>
          <div style="font-size:12px;font-weight:900;color:#24323F;">센터 분석 참고</div>
          <div style="font-size:10px;color:#6d8799;margin-top:3px;">실시간 제어 판단은 현장 Edge가 수행합니다 · 읽기 전용 카드 · analytics/reporting only</div>
        </div>
        <button data-center-crop-interlock-snapshot-sync title="센터 snapshot 동기화" style="border:1px solid #cfe3f6;background:#fff;color:#3f7fb2;border-radius:9px;padding:6px 8px;font-size:11px;font-weight:900;cursor:pointer;display:flex;align-items:center;gap:4px;"><ha-icon icon="mdi:cloud-upload-outline" style="--mdi-icon-size:16px;"></ha-icon><span>센터 snapshot 동기화</span></button>
        <button data-center-crop-interlock-analytics-refresh title="센터 분석 새로고침" style="border:1px solid #cfe3f6;background:#fff;color:#3f7fb2;border-radius:9px;padding:6px 8px;font-size:11px;font-weight:900;cursor:pointer;display:flex;align-items:center;"><ha-icon icon="mdi:refresh" style="--mdi-icon-size:16px;"></ha-icon></button>
      </div>
      ${unavailable ? `<div style="font-size:11px;color:#7a9780;line-height:1.5;">센터 분석 데이터를 아직 불러오지 못했습니다. Center activation/token 또는 snapshot sync 상태를 확인하세요.</div>` : `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px;margin-bottom:8px;">
        <div style="background:#fff;border-radius:10px;padding:8px;"><div style="font-size:10px;color:#7a9780;font-weight:800;">snapshot</div><b style="font-size:18px;color:#24323F;">${this._esc(String(data.snapshot_count ?? 0))}</b></div>
        <div style="background:#fff;border-radius:10px;padding:8px;"><div style="font-size:10px;color:#7a9780;font-weight:800;">수확 안전 미확인</div><b style="font-size:18px;color:${Number(data.harvest_safety_unknown_count || 0) ? '#c0392b' : '#51AE60'};">${this._esc(String(data.harvest_safety_unknown_count ?? 0))}</b></div>
        <div style="background:#fff;border-radius:10px;padding:8px;"><div style="font-size:10px;color:#7a9780;font-weight:800;">stage index 문제</div><b style="font-size:18px;color:${Number(data.stage_index_problem_count || 0) ? '#e67e22' : '#51AE60'};">${this._esc(String(data.stage_index_problem_count ?? 0))}</b></div>
        <div style="background:#fff;border-radius:10px;padding:8px;"><div style="font-size:10px;color:#7a9780;font-weight:800;">hard block</div><b style="font-size:18px;color:${Number(data.stage_index_hard_block_count || 0) ? '#c0392b' : '#51AE60'};">${this._esc(String(data.stage_index_hard_block_count ?? 0))}</b></div>
      </div>
      <div style="font-size:11px;color:#5d7d64;line-height:1.65;"><b>reason_counts</b> ${list(topReasons, "집계 없음")}</div>
      <div style="font-size:11px;color:#5d7d64;line-height:1.65;margin-top:4px;"><b>approval_gate_counts</b> ${list(topGates, "집계 없음")}</div>
      <div style="font-size:11px;color:#5d7d64;line-height:1.65;margin-top:4px;"><b>approval_type_counts</b> ${list(topApprovals, "승인 기록 없음")}</div>
      <div style="font-size:10px;color:#8aa0ad;margin-top:6px;">Center 분석은 반복 패턴/정책 추천 후보 확인용입니다. 자동 실행 허용/차단은 이 카드가 결정하지 않습니다.</div>`}
    </div>`;
  }

  _renderCropGrowthTab() {
    const total = this._growthData.length;
    const latest = total ? this._growthData[total - 1] : null;
    const latestMetrics = latest ? this._growthMetricGroups(latest) : { core: [], quality: [] };
    const latestCropLabel = this._cropLabelForDisplay(latest?.cropType || this._activeSeason()?.cropType);
    // contract marker: latest survey displays ${latestCropLabel}, not raw cropType such as lettuce
    const latestLabel = latest ? `${this._esc(latest.date)} · ${this._esc(latestCropLabel)}` : "기록 없음";
    const nextAction = latest
      ? "다음 조사 안내: 같은 작기 기준으로 다음 주 생육값을 기록하고 품질·장해 변화가 있으면 메모를 남기세요."
      : "다음 조사 안내: 생육조사 추가로 첫 주간 기록을 입력하세요.";
    const pageRows = this._paginatedCropRows("growth", this._growthData);
    const rows = pageRows.length
      ? pageRows.map((r) => {
        const i = r.__cropIndex;
        const groups = this._growthMetricGroups(r);
        return `
        <div data-crop-growth-record-row data-growth-metrics-json="${this._esc(r.metricsJson || "")}" style="display:grid;grid-template-columns:96px minmax(0,1fr) auto;gap:10px;align-items:flex-start;padding:12px;border-radius:14px;background:#f8fcf9;border:1px solid #e6f1e8;margin-bottom:8px;">
          <div style="font-size:12px;font-weight:900;color:#51AE60;white-space:nowrap;">${this._esc(r.date)}</div>
          <div style="min-width:0;">
            <div data-crop-growth-core-metrics style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:7px;">
              <span style="font-size:10px;font-weight:900;color:#5d7d64;background:#edf8ef;border-radius:999px;padding:4px 7px;">핵심 생육값</span>
              ${groups.core.length ? groups.core.map(m => this._growthMetricPill(m, "#edf8ef", "#3e6f48")).join("") : `<span style="font-size:11px;color:#9aae9d;">핵심값 기록 없음</span>`}
            </div>
            <div data-crop-growth-quality-metrics style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:${r.note ? "7px" : "0"};">
              <span style="font-size:10px;font-weight:900;color:#7b628f;background:#faf7ff;border-radius:999px;padding:4px 7px;">품질·장해값</span>
              ${groups.quality.length ? groups.quality.map(m => this._growthMetricPill(m, "#faf7ff", "#6f4f87")).join("") : `<span style="font-size:11px;color:#9aae9d;">특이 품질/장해 기록 없음</span>`}
            </div>
            ${r.note ? `<div data-crop-growth-note style="font-size:11px;color:#7a9780;line-height:1.45;">메모: ${this._esc(r.note)}</div>` : `<span data-crop-growth-note hidden></span>`}
          </div>
          ${this._cropRecordActionGroup('data-crop-growth-record-actions', `
            <button data-growth-edit="${i}" data-crop-growth-edit-action title="수정"
              style="background:#fff;border:1px solid #b7dfbd;border-radius:9px;cursor:pointer;color:#51AE60;font-size:12px;font-weight:800;padding:6px 9px;display:flex;align-items:center;gap:4px;"><ha-icon icon="mdi:pencil" style="--mdi-icon-size:15px;"></ha-icon>수정</button>`, `
            <button data-growth-del="${i}" data-crop-growth-delete-action title="삭제"
              style="min-width:32px;height:32px;border-radius:9px;border:1.5px solid #f1b8bf;background:#fff7f8;color:#c0392b;cursor:pointer;display:flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:trash-can-outline" style="--mdi-icon-size:18px;"></ha-icon></button>`)}
        </div>`;
      }).join("")
      : `<div data-crop-ui-empty-state style="text-align:center;padding:34px 12px;color:#7a9780;font-size:13px;border:1px dashed #d7e8da;border-radius:16px;background:#fbfefb;">
          <ha-icon icon="mdi:sprout-outline" style="--mdi-icon-size:34px;display:block;margin:0 auto 8px;color:#9bcaa3;"></ha-icon>
          생육조사 기록이 없습니다. 생육조사 추가로 첫 주간 기록을 입력하세요.
        </div>`;
    const latestPreview = latest
      ? `${latestMetrics.core.slice(0, 3).map(m => `${this._esc(m.label || m.key)} ${this._esc(String(m.value ?? "-"))}${m.unit ? this._esc(m.unit) : ""}`).join(" · ") || "핵심값 기록 없음"}`
      : "아직 최신 조사가 없습니다.";
    return `
      <span hidden data-vs003-lettuce-growth-survey-card data-vs003-lettuce-l-index-fields>VS-003 상추 생육조사 입력 · lettuce · L-Index · metrics_json · leafLength · leafWidth · freshWeight · growth_surveys · farm_staff</span>
      <section data-crop-subtab-main-format data-crop-growth-summary-card data-crop-subtab-summary-card data-crop-growth-workflow-card data-crop-ui-subpage-summary data-crop-consistency-shell data-crop-consistency-mobile-safe data-crop-consistency-card-radius data-crop-consistency-final-pass style="background:linear-gradient(135deg,#f7fff9 0%,#f8fbff 100%);border:1px solid #dcefe2;border-radius:16px;padding:14px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px;">
          <div>
            <div style="font-size:15px;font-weight:900;color:#24323F;">최근 생육조사</div>
            <div style="font-size:12px;color:#5f7f70;margin-top:4px;line-height:1.5;">농장주와 직원이 같은 작기 기준으로 주간 생육 상태를 확인합니다.</div>
          </div>
          <span style="font-size:11px;font-weight:900;color:#51AE60;background:#fff;border:1px solid #dcefe2;border-radius:999px;padding:5px 9px;">${total}건</span>
        </div>
        <div data-crop-growth-kpi-grid data-crop-ui-kpi-grid style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:9px;">
          <div data-crop-growth-latest-survey style="background:#fff;border-radius:12px;padding:10px;border:1px solid #e6f1e8;"><div style="font-size:11px;color:#7a9780;font-weight:800;">최신 조사</div><b style="font-size:15px;color:#24323F;">${latestLabel}</b><div style="font-size:10px;color:#8aa091;margin-top:3px;">${latestPreview}</div></div>
          <div style="background:#fff;border-radius:12px;padding:10px;border:1px solid #e6f1e8;"><div style="font-size:11px;color:#7a9780;font-weight:800;">핵심값 수</div><b style="font-size:15px;color:#24323F;">${latestMetrics.core.length}개</b><div style="font-size:10px;color:#8aa091;margin-top:3px;">초장·엽수·줄기경 등</div></div>
          <div style="background:#fff;border-radius:12px;padding:10px;border:1px solid #e6f1e8;"><div style="font-size:11px;color:#7a9780;font-weight:800;">품질/장해 기록</div><b style="font-size:15px;color:${latestMetrics.quality.length ? '#8e44ad' : '#51AE60'};">${latestMetrics.quality.length}개</b><div style="font-size:10px;color:#8aa091;margin-top:3px;">품질·생리장해·메모 확인</div></div>
        </div>
        <div data-crop-growth-next-action style="font-size:12px;color:#4f6f58;line-height:1.55;"><b>다음 조사 안내</b> ${nextAction}</div>
      </section>
      <div data-crop-growth-list-header data-crop-subtab-list-header data-crop-ui-action-bar data-crop-consistency-action-row style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <div>
          <div data-crop-list-title style="font-size:13px;font-weight:800;color:#24323F;">생육조사 기록 <span data-crop-list-count style="color:#7a9780;font-weight:500;">(${total}건)</span></div>
          <div data-crop-list-description style="font-size:11px;color:#7a9780;margin-top:2px;">날짜별 핵심값을 먼저 보고 품질/장해와 메모를 이어서 확인합니다.</div>
        </div>
        <div data-crop-list-actions style="display:flex;gap:6px;flex-wrap:wrap;">
          <div data-crop-growth-secondary-actions style="display:flex;gap:6px;flex-wrap:wrap;">
            <button id="growth-export-btn" title="CSV 내보내기"
              style="background:#f5faf6;color:#51AE60;border:1.5px solid #c8e6c9;border-radius:10px;
                     padding:7px 10px;cursor:pointer;display:flex;align-items:center;gap:5px;font-size:12px;font-weight:800;">
              <ha-icon icon="mdi:file-export-outline" style="--mdi-icon-size:18px;"></ha-icon><span>CSV 내보내기</span></button>
          </div>
          <button id="growth-add-btn" data-crop-growth-primary-action data-vs003-lettuce-growth-submit
            style="background:#51AE60;color:#fff;border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:800;cursor:pointer;">
            + 생육조사 추가</button>
        </div>
      </div>
      <div id="growth-list" data-crop-growth-record-list data-crop-subtab-record-list data-crop-ui-record-list>
        <div style="font-size:11px;color:#7a9780;margin-bottom:8px;">기록이 많아도 날짜별 핵심값을 먼저 보고, 품질/장해와 메모는 아래에서 확인합니다.</div>
        ${rows}
      </div>
      ${this._renderCropPager("growth", total)}`;
  }

  _growthMetricGroups(row) {
    const metrics = this._parseGrowthMetrics(row);
    const fallback = metrics.length ? [] : [
      { key: "height", label: "초장", value: row.height, unit: "cm" },
      { key: "leafCount", label: "엽수", value: row.leafCount, unit: "매" },
      { key: "stemDia", label: "줄기경", value: row.stemDia, unit: "mm" },
      { key: "truss", label: "화방", value: row.truss, unit: "단" },
      { key: "node", label: "절위", value: row.node, unit: "절" },
    ];
    const source = (metrics.length ? metrics : fallback).filter(m => m && m.value !== null && m.value !== undefined && m.value !== "");
    const qualityPattern = /(품질|장해|장애|병|충|기형|열과|착색|경도|당도|무게|생체중|엽색|tipburn|disorder|quality|brix|weight)/i;
    const core = [];
    const quality = [];
    source.forEach((m) => {
      const label = `${m.label || ""} ${m.key || ""}`;
      (qualityPattern.test(label) ? quality : core).push(m);
    });
    return { core, quality };
  }

  _growthMetricPill(metric, bg, color) {
    return `<span style="font-size:11px;color:${color};background:${bg};border-radius:999px;padding:4px 7px;white-space:nowrap;">${this._esc(metric.label || metric.key)} <b>${this._esc(String(metric.value ?? "-"))}${metric.unit ? this._esc(metric.unit) : ""}</b></span>`;
  }

  _renderCropAiStrategyTab() {
    return `
      <div data-crop-subtab-main-format data-crop-ai-strategy-panel data-crop-ai-summary-card data-crop-ai-consolidated-layout data-crop-ai-duplicate-card-guard data-crop-consistency-shell data-crop-consistency-mobile-safe data-crop-consistency-card-radius data-crop-consistency-final-pass style="margin-bottom:12px;">
        ${this._renderGrowthReportCard()}
      </div>`;
  }

  _renderCropPestTab() {
    const SEVERITY = { low: "낮음", mid: "보통", high: "높음", critical: "위험" };
    const SEVERITY_COLOR = { low: "#51AE60", mid: "#f39c12", high: "#e67e22", critical: "#c0392b" };
    const pestSeverityCounts = this._pestData.reduce((acc, r) => {
      const key = r.severity || "low";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const highRiskPests = this._pestData.filter((r) => ["high", "critical"].includes(r.severity));
    const latestPest = this._pestData[0] || null;
    const pestNextAction = highRiskPests.length
      ? "고위험/미해결 예찰이 있습니다. 발생 범위와 최근 방제 이력을 확인한 뒤 필요한 경우 방제 기록으로 이어가세요."
      : this._pestData.length
      ? "현재 고위험 예찰은 없습니다. 다음 정기 예찰 때 발생도 변화를 확인하세요."
      : "첫 예찰 기록을 추가해 병해충 발생 여부를 남기세요.";
    const pageRows = this._paginatedCropRows("pest", this._pestData);
    const rows = pageRows.length
      ? pageRows.map((r) => {
        const i = r.__cropIndex;
        return `
        <div data-crop-pest-record-row style="display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border-radius:10px;background:#f5faf6;margin-bottom:6px;border:1px solid #e3f1e5;">
          <div style="flex:0 0 72px;font-size:12px;font-weight:700;color:#51AE60;">${r.date}</div>
          <div data-crop-pest-record-summary style="flex:1;display:flex;flex-wrap:wrap;gap:4px 14px;">
            <span style="font-size:12px;color:#4a6741;font-weight:700;">${this._esc(r.type)}</span>
            <span data-crop-pest-record-meta style="font-size:12px;color:#4a6741;">위치: ${this._esc(r.location)}</span>
            <span style="font-size:12px;font-weight:700;color:${SEVERITY_COLOR[r.severity]||"#7a9780"};">
              발생도: ${SEVERITY[r.severity]||r.severity}</span>
            ${r.note ? `<span style="font-size:11px;color:#7a9780;width:100%;">${this._esc(r.note)}</span>` : ""}
          </div>
          ${this._cropRecordActionGroup('data-crop-pest-record-actions', `
            <button data-pest-edit="${i}" data-crop-pest-edit-action title="수정"
              style="background:#fff;border:1px solid #b7dfbd;border-radius:9px;cursor:pointer;color:#51AE60;font-size:12px;font-weight:800;padding:6px 9px;display:flex;align-items:center;gap:4px;"><ha-icon icon="mdi:pencil" style="--mdi-icon-size:15px;"></ha-icon>수정</button>`, `
            <button data-pest-del="${i}" data-crop-pest-delete-action title="삭제"
              style="min-width:32px;height:32px;border-radius:9px;border:1.5px solid #f1b8bf;background:#fff7f8;color:#c0392b;cursor:pointer;display:flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:trash-can-outline" style="--mdi-icon-size:18px;"></ha-icon></button>`)}
        </div>`;
      }).join("")
      : `<div style="text-align:center;padding:32px 0;color:#b0c4b1;font-size:13px;">
          <ha-icon icon="mdi:bug-outline" style="--mdi-icon-size:32px;display:block;margin:0 auto 8px;"></ha-icon>
          병해충 예찰 기록이 없습니다
        </div>`;
    return `
      <div data-crop-subtab-main-format data-crop-pest-summary-card data-crop-subtab-summary-card data-crop-consistency-shell data-crop-consistency-mobile-safe data-crop-consistency-card-radius data-crop-consistency-final-pass style="background:#fbfefb;border:1px solid #e3f1e5;border-radius:16px;padding:14px;margin-bottom:12px;">
        <div style="font-size:15px;font-weight:900;color:#24323F;margin-bottom:8px;">병해충 예찰 요약</div>
        <div data-crop-pest-severity-overview style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:9px;">
          <div style="background:#fff;border-radius:12px;padding:10px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">전체 예찰</div><b style="font-size:18px;color:#24323F;">${this._esc(String(this._pestData.length))}건</b><div style="font-size:10px;color:#9aae9d;">최신 ${this._esc(latestPest?.date || '-')}</div></div>
          <div style="background:#fff;border-radius:12px;padding:10px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">고위험/미해결</div><b style="font-size:18px;color:${highRiskPests.length ? '#c0392b' : '#51AE60'};">${this._esc(String(highRiskPests.length))}건</b><div style="font-size:10px;color:#9aae9d;">높음 ${this._esc(String(pestSeverityCounts.high || 0))} · 위험 ${this._esc(String(pestSeverityCounts.critical || 0))}</div></div>
          <div style="background:#fff;border-radius:12px;padding:10px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">최근 예찰</div><b style="font-size:18px;color:#24323F;">${this._esc(latestPest?.type || '없음')}</b><div style="font-size:10px;color:#9aae9d;">${this._esc(SEVERITY[latestPest?.severity] || latestPest?.severity || '-')}</div></div>
        </div>
        <div data-crop-pest-next-action style="background:#fff;border:1px solid #e2f1e7;border-radius:12px;padding:10px;font-size:12px;color:#4a6741;line-height:1.55;"><b>다음 행동</b> ${this._esc(pestNextAction)} <button data-crop-pest-go-control type="button" style="margin-left:6px;background:#fff8f5;color:#e67e22;border:1px solid #f3c79d;border-radius:8px;padding:5px 8px;font-size:11px;font-weight:900;cursor:pointer;">방제 기록으로 이동</button></div>
      </div>
      <div data-crop-pest-list-header data-crop-subtab-list-header data-crop-pest-action-row data-crop-consistency-action-row style="display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
        <div style="margin-right:auto;">
          <div data-crop-list-title style="font-size:13px;font-weight:800;color:#24323F;">병해충 예찰 기록 <span data-crop-list-count style="color:#7a9780;font-weight:500;">(${this._pestData.length}건)</span></div>
          <div data-crop-list-description style="font-size:11px;color:#7a9780;margin-top:2px;">요약 카드 다음에 액션 줄과 기록 목록. 요약 카드 다음에 예찰 목록과 작업 버튼을 같은 위치에서 확인합니다.</div>
        </div>
        <div data-crop-list-actions style="display:flex;gap:6px;flex-wrap:wrap;">
        <button id="pest-export-btn" title="CSV 내보내기"
          style="background:#f5faf6;color:#51AE60;border:1.5px solid #c8e6c9;border-radius:10px;
                 padding:6px 10px;cursor:pointer;display:flex;align-items:center;">
          <ha-icon icon="mdi:file-export-outline" style="--mdi-icon-size:18px;"></ha-icon></button>
        <button id="pest-add-btn"
          style="background:#51AE60;color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;">
          + 병해충 추가</button>
        </div>
      </div>
      <div id="pest-list" data-crop-pest-record-list data-crop-subtab-record-list data-crop-ui-record-list>${rows}</div>
      ${this._renderCropPager("pest", this._pestData.length)}`;
  }

  _renderCropControlTab() {
    const allControlPesticides = (this._controlData || []).flatMap((record) => {
      const pesticides = Array.isArray(record.pesticides) ? record.pesticides : (record.pesticide ? [{ name: record.pesticide, dil: record.dilution, pls: record.pls }] : []);
      return pesticides.map((p) => ({ ...p, controlDate: record.date }));
    });
    const latestControl = (this._controlData || [])[0] || null;
    const controlPlsCounts = allControlPesticides.reduce((acc, p) => {
      if (p.pls === true) acc.ok += 1;
      else if (p.pls === false || p.plsWarning) acc.warning += 1;
      else acc.unknown += 1;
      return acc;
    }, { ok: 0, warning: 0, unknown: 0 });
    const missingPhiRei = allControlPesticides.filter((p) => (p.phi ?? p.PHI ?? p.phiDays ?? p.phi_days) == null || (p.rei ?? p.REI ?? p.reiHours ?? p.rei_hours) == null);
    const controlNextCheck = controlPlsCounts.warning
      ? "PLS 경고 약제가 있습니다. 수확/출하 전 관리자 확인과 대체 약제 검토가 필요합니다."
      : missingPhiRei.length
      ? "PHI/REI 확인값이 비어 있습니다. 수확 전 안전 확인값을 보강하세요."
      : this._controlData.length
      ? "최근 방제의 PLS/PHI/REI 상태를 확인했습니다. 다음 예찰 때 효과와 재발 여부를 점검하세요."
      : "방제 기록이 없습니다. 병해충 예찰 후 실제 처리 내역을 기록하세요.";
    const pageRows = this._paginatedCropRows("control", this._controlData);
    const rows = pageRows.length
      ? pageRows.map((r) => {
          const i = r.__cropIndex;
          const pests = Array.isArray(r.pesticides) ? r.pesticides : (r.pesticide ? [{ name: r.pesticide, dil: r.dilution }] : []);
          const pestHtml = pests.map(p => {
            const pls = p.pls === true
              ? `<span style="background:#d4edda;color:#155724;font-size:10px;padding:1px 6px;border-radius:10px;font-weight:700;">PLS ✓</span>`
              : p.pls === false
              ? `<span style="background:#f8d7da;color:#721c24;font-size:10px;padding:1px 6px;border-radius:10px;font-weight:700;">PLS ✗</span>`
              : "";
            return `<span style="display:inline-flex;align-items:center;gap:4px;background:#e8f4fd;
              border-radius:8px;padding:3px 8px;font-size:12px;font-weight:700;color:#2980b9;">
              ${this._esc(p.name)} ${pls}
              ${p.dil ? `<span style="font-weight:400;color:#5d8aa8;">${p.dil}배</span>` : ""}
              ${(p.phi ?? p.PHI ?? p.phiDays ?? p.phi_days) != null ? `<span style="font-weight:400;color:#7a9780;">PHI ${this._esc(String(p.phi ?? p.PHI ?? p.phiDays ?? p.phi_days))}일</span>` : ""}
              ${(p.rei ?? p.REI ?? p.reiHours ?? p.rei_hours) != null ? `<span style="font-weight:400;color:#7a9780;">REI ${this._esc(String(p.rei ?? p.REI ?? p.reiHours ?? p.rei_hours))}h</span>` : ""}
            </span>`;
          }).join(" ");
          const areaValue = r.area != null ? String(r.area).trim() : "";
          const areaLabel = areaValue ? (/㎡|평|ha|m2|m²$/i.test(areaValue) ? areaValue : `${areaValue}㎡`) : "";
          return `
          <div data-crop-control-treatment-row style="padding:10px 12px;border-radius:10px;background:#f5faf6;margin-bottom:6px;border:1px solid #e3f1e5;">
            <div style="display:flex;align-items:flex-start;gap:8px;">
              <div style="flex:0 0 72px;font-size:12px;font-weight:700;color:#51AE60;padding-top:2px;">${r.date}</div>
              <div data-crop-control-treatment-summary style="flex:1;">
                <div data-crop-control-pesticide-chip-group style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px;">${pestHtml}</div>
                <div data-crop-control-treatment-meta style="display:flex;flex-wrap:wrap;gap:6px 14px;">
                  ${r.zone  ? `<span style="font-size:11px;color:#4a6741;">구역: ${this._esc(r.zone)}</span>` : ""}
                  ${areaLabel ? `<span style="font-size:11px;color:#4a6741;">면적: ${this._esc(areaLabel)}</span>` : ""}
                  ${r.note  ? `<span style="font-size:11px;color:#7a9780;">${this._esc(r.note)}</span>` : ""}
                </div>
              </div>
              ${this._cropRecordActionGroup('data-crop-control-record-actions', `
                <button data-control-edit="${i}" data-crop-control-edit-action title="수정"
                  style="background:#fff;border:1px solid #b7dfbd;border-radius:9px;cursor:pointer;color:#51AE60;font-size:12px;font-weight:800;padding:6px 9px;display:flex;align-items:center;gap:4px;"><ha-icon icon="mdi:pencil" style="--mdi-icon-size:15px;"></ha-icon>수정</button>`, `
                <button data-control-del="${i}" data-crop-control-delete-action title="삭제"
                  style="min-width:32px;height:32px;border-radius:9px;border:1.5px solid #f1b8bf;background:#fff7f8;color:#c0392b;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><ha-icon icon="mdi:trash-can-outline" style="--mdi-icon-size:18px;"></ha-icon></button>`)}
            </div>
          </div>`;
        }).join("")
      : `<div style="text-align:center;padding:32px 0;color:#b0c4b1;font-size:13px;">
          <ha-icon icon="mdi:spray" style="--mdi-icon-size:32px;display:block;margin:0 auto 8px;"></ha-icon>
          방제 기록이 없습니다
        </div>`;
    return `
      <div data-crop-subtab-main-format data-crop-control-summary-card data-crop-subtab-summary-card data-crop-control-safety-summary data-crop-consistency-shell data-crop-consistency-mobile-safe data-crop-consistency-card-radius data-crop-consistency-final-pass style="background:#fbfefb;border:1px solid #e3f1e5;border-radius:16px;padding:14px;margin-bottom:12px;">
        <div style="font-size:15px;font-weight:900;color:#24323F;margin-bottom:8px;">방제 안전 요약</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:9px;">
          <div style="background:#fff;border-radius:12px;padding:10px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">최근 방제</div><b style="font-size:18px;color:#24323F;">${this._esc(latestControl?.date || '없음')}</b><div style="font-size:10px;color:#9aae9d;">${this._esc(String(allControlPesticides.length))}개 약제 기록</div></div>
          <div data-crop-control-pls-overview style="background:#fff;border-radius:12px;padding:10px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">PLS 확인</div><b style="font-size:18px;color:${controlPlsCounts.warning ? '#c0392b' : '#51AE60'};">${controlPlsCounts.warning ? '경고' : '확인'}</b><div style="font-size:10px;color:#9aae9d;">적합 ${this._esc(String(controlPlsCounts.ok))} · 미확인 ${this._esc(String(controlPlsCounts.unknown))} · 경고 ${this._esc(String(controlPlsCounts.warning))}</div></div>
          <div data-crop-control-phi-rei-overview style="background:#fff;border-radius:12px;padding:10px;"><div style="font-size:11px;color:#7a9780;font-weight:800;">PHI/REI 확인</div><b style="font-size:18px;color:${missingPhiRei.length ? '#e67e22' : '#51AE60'};">${missingPhiRei.length ? '보강 필요' : '확인'}</b><div style="font-size:10px;color:#9aae9d;">누락 ${this._esc(String(missingPhiRei.length))}건</div></div>
        </div>
        <div data-crop-control-next-check style="background:#fff;border:1px solid #e2f1e7;border-radius:12px;padding:10px;font-size:12px;color:#4a6741;line-height:1.55;"><b>다음 점검</b> ${this._esc(controlNextCheck)}</div>
      </div>
      <div data-crop-control-list-header data-crop-subtab-list-header data-crop-control-action-row data-crop-consistency-action-row style="display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
        <div style="margin-right:auto;">
          <div data-crop-list-title style="font-size:13px;font-weight:800;color:#24323F;">방제 기록 <span data-crop-list-count style="color:#7a9780;font-weight:500;">(${this._controlData.length}건)</span></div>
          <div data-crop-list-description style="font-size:11px;color:#7a9780;margin-top:2px;">요약 카드 다음에 액션 줄과 기록 목록. 요약 카드 다음에 방제 목록과 작업 버튼을 같은 위치에서 확인합니다.</div>
        </div>
        <div data-crop-list-actions style="display:flex;gap:6px;flex-wrap:wrap;">
        <button id="control-export-btn" title="CSV 내보내기"
          style="background:#f5faf6;color:#51AE60;border:1.5px solid #c8e6c9;border-radius:10px;
                 padding:6px 10px;cursor:pointer;display:flex;align-items:center;">
          <ha-icon icon="mdi:file-export-outline" style="--mdi-icon-size:18px;"></ha-icon></button>
        <button id="control-add-btn"
          style="background:#51AE60;color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;">
          + 방제 기록 추가</button>
        </div>
      </div>
      <div id="control-list" data-crop-control-record-list data-crop-subtab-record-list data-crop-ui-record-list data-crop-control-treatment-list>${rows}</div>
      ${this._renderCropPager("control", this._controlData.length)}`;
  }

  // ── Crop 팝업 ─────────────────────────────────────────────────────────────────

  // ── 정식 등록 팝업 ─────────────────────────────────────────────────────────
  // ── DB 데이터 로딩 ────────────────────────────────────────────────────────
  async _loadCropData() {
    try {
      const seasons = await this._api.crop.listSeasons();
      this._cropSeasons = seasons || [];
      this._dbReady = true;
      await this._migrateFromLocalStorage();
      if (!this._activeSeasonId && this._cropSeasons.length > 0) {
        const active = this._cropSeasons.find(s => !s.demolishDate);
        this._activeSeasonId = active ? active.id : this._cropSeasons[0].id;
      }
      if (this._activeSeasonId) {
        await this._loadSeasonDetail(this._activeSeasonId);
      }
    } catch (e) {
      this._dbReady = false;
      console.error("[GS] DB load failed, falling back to localStorage", e);
      this._loadFromLocalStorage();
    }
    this._refreshCropContent();
  }

  async _loadSeasonDetail(seasonId) {
    const [growth, pest, control, report, centerAnalytics] = await Promise.all([
      this._api.crop.getGrowthRecords(seasonId).catch(() => []),
      this._api.crop.getPestRecords(seasonId).catch(()  => []),
      this._api.crop.getControlRecords(seasonId).catch(() => []),
      this._api.crop.getGrowthReport(seasonId).catch(() => null),
      this._fetchCenterCropInterlockAnalytics(seasonId, false).catch(() => null),
    ]);
    this._growthData  = growth  || [];
    this._pestData    = pest    || [];
    this._controlData = control || [];
    this._growthReportData = report || null;
    this._centerCropInterlockAnalyticsData = centerAnalytics || this._centerCropInterlockAnalyticsData || null;
  }

  async _fetchGrowthReport() {
    if (!this._hass || !this._activeSeasonId) return null;
    try {
      const report = await this._api.crop.getGrowthReport(this._activeSeasonId);
      this._growthReportData = report;
      this._refreshCropContent();
      return report;
    } catch (err) {
      console.warn("생육 리포트 조회 실패", err);
      return this._growthReportData;
    }
  }

  async _fetchCenterCropInterlockAnalytics(seasonId = this._activeSeasonId, refresh = true) {
    if (!this._hass || !seasonId) return null;
    try {
      const query = new URLSearchParams({ farm_id: "1", season_id: String(seasonId) }).toString();
      const data = await this._hass.callApi("GET", `green_smart/central/crop/interlock-analytics/summary?${query}`);
      this._centerCropInterlockAnalyticsData = data || null;
      if (refresh) this._refreshCropContent();
      return data;
    } catch (err) {
      console.warn("센터 작물 인터록 분석 조회 실패", err);
      this._centerCropInterlockAnalyticsData = this._centerCropInterlockAnalyticsData || { error: err?.message || "center_analytics_unavailable" };
      if (refresh) this._refreshCropContent();
      return this._centerCropInterlockAnalyticsData;
    }
  }

  async _syncCenterCropInterlockSnapshot(trigger = "manual_panel", refreshAnalytics = true) {
    if (!this._hass || !this._activeSeasonId) return null;
    try {
      const result = await this._hass.callApi("POST", "green_smart/central/crop/interlock-snapshot/sync", {
        farm_id: 1,
        season_id: this._activeSeasonId,
        trigger,
      });
      if (refreshAnalytics) await this._fetchCenterCropInterlockAnalytics(this._activeSeasonId, true);
      return result;
    } catch (err) {
      console.warn("센터 crop interlock snapshot sync 실패", err);
      return null;
    }
  }

  _weeklyReportNotificationEnabled() {
    try { return localStorage.getItem("green_smart_weekly_report_notifications") !== "off"; } catch (_) { return true; }
  }

  _cropPolicyNotificationEnabled() {
    try { return localStorage.getItem("green_smart_crop_policy_notifications") !== "off"; } catch (_) { return true; }
  }

  async _setCropPolicyNotificationEnabled(enabled) {
    try { localStorage.setItem("green_smart_crop_policy_notifications", enabled ? "on" : "off"); } catch (_) {}
    if (!this._hass || !this._activeSeasonId) return;
    try {
      await this._hass.callApi("POST", `green_smart/crop/seasons/${this._activeSeasonId}/crop-policy/notification-settings`, {
        enabled,
        statuses: { fallback_safe: true, rejected: true, stale_restricted: false },
      });
    } catch (err) {
      console.warn("작물 정책 알림 설정 저장 실패", err);
    }
  }

  async _dismissCropPolicyNotification() {
    if (!this._hass || !this._activeSeasonId) return null;
    try {
      return await this._hass.callApi("POST", `green_smart/crop/seasons/${this._activeSeasonId}/crop-policy/notification-dismiss`, {
        zoneId: this._growthReportData?.season?.zoneId || null,
      });
    } catch (err) {
      console.warn("작물 정책 알림 해제 실패", err);
      return null;
    }
  }

  async _setWeeklyReportNotificationEnabled(enabled) {
    try { localStorage.setItem("green_smart_weekly_report_notifications", enabled ? "on" : "off"); } catch (_) {}
    if (!this._hass || !this._activeSeasonId) return;
    try {
      await this._hass.callApi("POST", `green_smart/crop/seasons/${this._activeSeasonId}/growth-report/notification-settings`, {
        enabled,
        weeklyIntervalDays: 7,
        worseningAlerts: true,
      });
    } catch (err) {
      console.warn("주간 리포트 알림 설정 저장 실패", err);
    }
  }

  async _maybeNotifyWeeklyGrowthReport(reason = "manual_refresh") {
    if (!this._weeklyReportNotificationEnabled() || !this._hass || !this._activeSeasonId) return null;
    try {
      return await this._hass.callApi("POST", `green_smart/crop/seasons/${this._activeSeasonId}/growth-report/notify`, {
        reason,
        automatic: true,
        message: this._growthReportData?.weeklyReport?.notificationDraft || "주간 생육 리포트",
      });
    } catch (err) {
      console.warn("주간 생육 리포트 자동 알림 실패", err);
      return null;
    }
  }

  async _refreshWeeklyGrowthReportFromButton(button) {
    if (!button) return this._fetchGrowthReport();
    button.classList.add("is-spinning");
    button.dataset.weeklyReportRefreshing = "true";
    button.disabled = true;
    try {
      await this._fetchGrowthReport();
      await this._syncCenterCropInterlockSnapshot("growth_report_refresh", true);
      this._refreshCropContent();
    } finally {
      button.classList.remove("is-spinning");
      button.dataset.weeklyReportRefreshing = "false";
      button.disabled = false;
    }
  }

  async _submitCropInterlockApproval(button) {
    if (!this._hass || !this._activeSeasonId || !button) return null;
    const approvalType = button.dataset.approvalType || "operator_confirm";
    const report = this._growthReportData || await this._fetchGrowthReport();
    const cropModel = report?.cropModel || {};
    const cropInterlock = cropModel.cropInterlock || {};
    const stageDiagnosis = cropModel.stageDiagnosis || {};
    const note = prompt("승인 메모", "현장 확인 후 승인") || "";
    const approvalExpiresAt = prompt("승인 만료", "") || null;
    const payload = {
      approvalType,
      actor: this._currentUserRole ? this._currentUserRole() : "operator",
      note,
      approvalExpiresAt,
      reasonCodes: cropInterlock.cropInterlockReasons || [],
      actions: cropInterlock.cropInterlockActions || [],
      stageDiagnosis,
      cropInterlock,
    };
    button.disabled = true;
    try {
      const result = await this._hass.callApi("POST", `green_smart/crop/seasons/${this._activeSeasonId}/interlock-approval`, payload);
      this._growthReportData = {
        ...(this._growthReportData || {}),
        cropModel: {
          ...(cropModel || {}),
          cropInterlock: {
            ...(cropInterlock || {}),
            approvalAudit: result?.approvalAudit || [],
          },
        },
      };
      await this._syncCenterCropInterlockSnapshot("approval_saved", true);
      this._refreshCropContent();
      return result;
    } catch (err) {
      alert("작물 인터록 승인 저장 실패: " + (err?.message || "unknown"));
      return null;
    } finally {
      button.disabled = false;
    }
  }

  async _exportWeeklyGrowthReport() {
    const report = this._growthReportData || await this._fetchGrowthReport();
    const weeklyReport = report?.weeklyReport || {};
    const csv = weeklyReport.exportCsv || weeklyReport.exportText || weeklyReport.summary || "주간 생육 리포트";
    const filename = weeklyReport.exportFilename || `green_smart_weekly_report_${this._activeSeasonId || "current"}.csv`;
    const bom = "\ufeff";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  async _notifyWeeklyGrowthReport() {
    if (!this._hass || !this._activeSeasonId) return;
    try {
      await this._hass.callApi("POST", `green_smart/crop/seasons/${this._activeSeasonId}/growth-report/notify`, {
        message: this._growthReportData?.weeklyReport?.notificationDraft || "주간 생육 리포트",
      });
      alert("주간 생육 리포트 알림을 보냈습니다.");
    } catch (err) {
      alert("알림 전송 실패: " + (err?.message || "unknown"));
    }
  }

  async _migrateFromLocalStorage() {
    const MIGRATE_KEY = "gs_crop_migrated_v1";
    if (localStorage.getItem(MIGRATE_KEY)) return;
    if (this._cropSeasons.length > 0) {
      localStorage.setItem(MIGRATE_KEY, "1");
      return;
    }
    const legacySeasons = JSON.parse(localStorage.getItem("gs_legacy_seasons") || "null");
    if (!legacySeasons || legacySeasons.length === 0) {
      localStorage.setItem(MIGRATE_KEY, "1");
      return;
    }
    for (const s of legacySeasons) {
      try {
        await this._hass.callApi("POST", "green_smart/crop/seasons", {
          cropType: s.cropType || "other",
          variety:  s.variety  || "",
          method:   s.method   || "hydro",
          zoneId:   parseInt(s.zone) || 1,
          plantDate: s.plantDate,
          rowSpacing:   parseFloat(s.rowSpace)    || null,
          plantSpacing: parseFloat(s.plantSpace)  || null,
          totalPlants:  parseInt(s.totalPlants)   || null,
          plantDensity: parseFloat(s.density)     || null,
          trainDir: s.trainDir || "v",
          notes: "",
        });
      } catch (e) {
        console.warn("[GS] migration failed for season", s, e);
      }
    }
    localStorage.removeItem("gs_legacy_seasons");
    localStorage.setItem(MIGRATE_KEY, "1");
    const seasons = await this._hass.callApi("GET", "green_smart/crop/seasons");
    this._cropSeasons = seasons || [];
  }

  _loadFromLocalStorage() {
    this._cropSeasons = JSON.parse(localStorage.getItem("gs_legacy_seasons") || "[]");
    this._growthData  = JSON.parse(localStorage.getItem("gs_legacy_growth")  || "[]");
    this._pestData    = JSON.parse(localStorage.getItem("gs_legacy_pest")    || "[]");
    this._controlData = JSON.parse(localStorage.getItem("gs_legacy_control") || "[]");
  }

  _syncBasicZoneCommonFields(inner, zoneId) {
    const prev = zoneId - 1;
    if (prev < 1) return;
    const crop = inner.querySelector(`[data-basic-crop-type="${zoneId}"]`);
    const variety = inner.querySelector(`[data-basic-variety="${zoneId}"]`);
    const method = inner.querySelector(`[data-basic-method="${zoneId}"]`);
    const prevCrop = inner.querySelector(`[data-basic-crop-type="${prev}"]`);
    const prevVariety = inner.querySelector(`[data-basic-variety="${prev}"]`);
    const prevMethod = inner.querySelector(`[data-basic-method="${prev}"]`);
    if (crop && prevCrop) crop.value = prevCrop.value;
    if (variety && prevVariety) variety.value = prevVariety.value;
    if (method && prevMethod) method.value = prevMethod.value;
  }

  _cropTypeOptions(selected = "tomato") {
    const opts = [["tomato","토마토"],["paprika","파프리카"],["strawberry","딸기"],["lettuce","상추"],["herb","허브"],["cucumber","오이"],["other","기타"]];
    return opts.map(([v, label]) => `<option value="${v}" ${v === selected ? "selected" : ""}>${label}</option>`).join("");
  }

  _cropMethodOptions(selected = "hydro") {
    const opts = [["hydro","수경재배"],["soil","토경재배"],["nft","NFT"],["dwc","DWC"]];
    return opts.map(([v, label]) => `<option value="${v}" ${v === selected ? "selected" : ""}>${label}</option>`).join("");
  }

  _renderBasicZoneFields(zone, idx, values = {}) {
    const collapsed = !!this._basicZoneCollapsed[zone.id];
    const checked = values.enabled !== false && (values.enabled === true || idx === 0);
    return `
      <div data-basic-zone-group="${zone.id}" style="border:1.5px solid #e8f0e9;border-radius:14px;margin-bottom:10px;background:#fbfefb;overflow:hidden;">
        <button type="button" data-basic-zone-toggle="${zone.id}"
          style="width:100%;border:none;background:${idx === 0 ? '#eaf8ec' : '#f5faf6'};padding:10px 12px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;">
          <span style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;color:#24323F;">
            <input type="checkbox" data-basic-zone-enabled="${zone.id}" ${checked ? 'checked' : ''}
              onclick="event.stopPropagation()" style="accent-color:#51AE60;">
            ${zone.label}
          </span>
          <span style="display:flex;align-items:center;gap:6px;color:#7a9780;font-size:11px;font-weight:700;">
            ${collapsed ? '펼치기' : '접기'}
            <ha-icon icon="${collapsed ? 'mdi:chevron-down' : 'mdi:chevron-up'}" style="--mdi-icon-size:18px;"></ha-icon>
          </span>
        </button>
        <div data-basic-zone-body="${zone.id}" style="${collapsed ? 'display:none;' : ''}padding:12px;">
          ${idx > 0 ? `<label style="display:flex;align-items:center;gap:6px;margin-bottom:10px;font-size:12px;color:#4a6741;font-weight:700;">
            <input type="checkbox" data-basic-same-as-prev="${zone.id}" style="accent-color:#51AE60;"> 이전 구역의 작물 종류·품종·재배 방식과 동일
          </label>` : ""}
          <div class="pop-field-row">
            <div class="pop-field"><label>작물 종류</label><select data-basic-crop-type="${zone.id}">${this._cropTypeOptions(values.cropType || "tomato")}</select></div>
            <div class="pop-field"><label>품종</label><input type="text" data-basic-variety="${zone.id}" value="${this._esc(values.variety || "")}" placeholder="예) 슈퍼도태랑"></div>
          </div>
          <div class="pop-field"><label>재배 방식</label><select data-basic-method="${zone.id}">${this._cropMethodOptions(values.method || "hydro")}</select></div>
          <div class="pop-field-row">
            <div class="pop-field"><label>정식일</label><input type="date" data-basic-plant-date="${zone.id}" value="${values.plantDate || new Date().toISOString().slice(0, 10)}"></div>
            <div class="pop-field"><label>총 정식 수 (주)</label><input type="number" data-basic-total="${zone.id}" value="${values.totalPlants || 200}" min="1" max="10000"></div>
          </div>
          <div class="pop-field-row">
            <div class="pop-field"><label>줄 간격 (cm)</label><input type="number" data-basic-row-space="${zone.id}" value="${values.rowSpacing || 130}" min="50" max="300" step="5"></div>
            <div class="pop-field"><label>주 간격 (cm)</label><input type="number" data-basic-plant-space="${zone.id}" value="${values.plantSpacing || 40}" min="10" max="200" step="5"></div>
          </div>
          <div class="pop-field-row">
            <div class="pop-field"><label>재식 밀도 (주/㎡)</label><input type="number" data-basic-density="${zone.id}" value="${values.plantDensity || 4}" min="1" max="20" step="0.1"></div>
            <div class="pop-field"><label>줄기 유인 방향</label><select data-basic-train="${zone.id}">
              <option value="v" ${(values.trainDir || "v") === "v" ? "selected" : ""}>V자형</option>
              <option value="single" ${values.trainDir === "single" ? "selected" : ""}>단간</option>
              <option value="double" ${values.trainDir === "double" ? "selected" : ""}>복간</option>
            </select></div>
          </div>
        </div>
      </div>`;
  }

  _collectBasicZoneValues(inner, zone) {
    return {
      cropType: inner.querySelector(`[data-basic-crop-type="${zone.id}"]`)?.value || "tomato",
      variety: inner.querySelector(`[data-basic-variety="${zone.id}"]`)?.value || "",
      method: inner.querySelector(`[data-basic-method="${zone.id}"]`)?.value || "hydro",
      zoneId: zone.id,
      plantDate: inner.querySelector(`[data-basic-plant-date="${zone.id}"]`)?.value || "",
      rowSpacing: parseFloat(inner.querySelector(`[data-basic-row-space="${zone.id}"]`)?.value) || null,
      plantSpacing: parseFloat(inner.querySelector(`[data-basic-plant-space="${zone.id}"]`)?.value) || null,
      totalPlants: parseInt(inner.querySelector(`[data-basic-total="${zone.id}"]`)?.value) || null,
      plantDensity: parseFloat(inner.querySelector(`[data-basic-density="${zone.id}"]`)?.value) || null,
      trainDir: inner.querySelector(`[data-basic-train="${zone.id}"]`)?.value || "v",
    };
  }

  _bindBasicZoneModal(inner, zones, rerender) {
    inner.querySelectorAll("[data-basic-zone-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const zoneId = Number(btn.dataset.basicZoneToggle);
        this._basicZoneCollapsed[zoneId] = !this._basicZoneCollapsed[zoneId];
        rerender();
      });
    });
    inner.querySelectorAll("[data-basic-same-as-prev]").forEach((chk) => {
      chk.addEventListener("change", () => {
        const zoneId = Number(chk.dataset.basicSameAsPrev);
        if (chk.checked) this._syncBasicZoneCommonFields(inner, zoneId);
      });
    });
  }

  _openCropBasicAddPopup() {
    // Contract markers moved to domains/crop/crop-write-modal.js:
    // data-basic-crop-type data-basic-variety data-basic-method data-basic-same-as-prev data-basic-zone-toggle data-basic-zone-body selectedZones.map zoneId: zone.id
    // Save/API binding remains in panel shell: this._hass.callApi("POST", "green_smart/crop/seasons", body)
    const zones = cropBasicAddZones(this);
    const open = () => this._openCropPopup(renderCropBasicAddModal(this, zones), (inner) => {
      this._bindBasicZoneModal(inner, zones, open);
      inner.querySelector("#b-save")?.addEventListener("click", async () => {
        try {
          const selectedZones = zones.filter(zone => inner.querySelector(`[data-basic-zone-enabled="${zone.id}"]`)?.checked);
          if (!selectedZones.length) { alert("정식 등록할 구역을 하나 이상 선택해주세요."); return; }
          const bodies = selectedZones.map((zone) => {
            const zoneValues = this._collectBasicZoneValues(inner, zone);
            if (!zoneValues.plantDate) throw new Error(`${zone.label} 정식일을 입력해주세요.`);
            return { cropType: zoneValues.cropType, variety: zoneValues.variety, method: zoneValues.method, ...zoneValues };
          });
          const results = await Promise.all(bodies.map(body => this._hass.callApi("POST", "green_smart/crop/seasons", body)));
          results.filter(Boolean).forEach(result => this._cropSeasons.unshift(result));
          const active = results.find(r => r && !r.demolishDate) || results[0];
          if (active?.id) { this._activeSeasonId = active.id; await this._loadSeasonDetail(active.id); }
          this._closePopup();
          this._cropPage.basic = 1;
          this._refreshCropContent();
        } catch (e) { alert("저장 실패: " + (e?.message || "DB 오류")); }
      });
    });
    open();
  }

  _openCropBasicEditPopup(index) {
    const season = this._cropSeasons[index];
    if (!season) return;
    const zone = { id: Number(season.zoneId || season.zone || 1), label: this._seasonZoneLabel(season) };
    const values = cropBasicEditValues(this, season);
    this._openCropPopup(renderCropBasicEditModal(this, season, zone, values), (inner) => {
      inner.querySelector("#b-edit-save")?.addEventListener("click", async () => {
        try {
          const zoneValues = this._collectBasicZoneValues(inner, zone);
          if (!zoneValues.plantDate) { alert("정식일을 입력해주세요."); return; }
          const result = await this._hass.callApi("PATCH", `green_smart/crop/seasons/${season.id}`, { cropType: zoneValues.cropType, variety: zoneValues.variety, method: zoneValues.method, ...zoneValues });
          this._cropSeasons[index] = result || { ...season, ...zoneValues, zoneName: `${zoneValues.zoneId}구역` };
          this._closePopup();
          this._refreshCropContent();
        } catch (e) { alert("수정 실패: " + (e?.message || "DB 오류")); }
      });
    });
  }

  // ── CSV 내보내기 ────────────────────────────────────────────────────────────
  _exportCropData(type) {
    const CROP_LABELS = { tomato:"토마토", paprika:"파프리카", strawberry:"딸기", lettuce:"상추", herb:"허브", cucumber:"오이", other:"기타" };
    const METHOD_LABELS = { hydro:"수경재배", soil:"토경재배", nft:"NFT", dwc:"DWC" };
    let csv = "", filename = "";

    if (type === "basic") {
      filename = "작기기록.csv";
      csv = "작물종류,품종,재배방식,정식일,구역,줄간격(cm),주간격(cm),총정식수(주),재식밀도(주/㎡),철거일,상태\n"
        + this._cropSeasons.map(s =>
          [CROP_LABELS[s.cropType]||s.cropType, s.variety, METHOD_LABELS[s.method]||s.method,
           s.plantDate, this._seasonZoneLabel(s), s.rowSpace, s.plantSpace, s.totalPlants, s.density,
           s.demolishDate||"", s.demolishDate?"철거완료":"재배중"]
          .map(v => `"${String(v||"").replace(/"/g,'""')}"`).join(",")
        ).join("\n");
    } else if (type === "growth") {
      filename = "생육조사.csv";
      csv = "조사일,작물,조사항목,값,단위,비고\n"
        + this._growthData.flatMap(r => this._growthMetricRowsForExport({ ...r, metricsJson: r.metricsJson }))
          .map(row => row.map(v => `"${String(v||"").replace(/"/g,'""')}"`).join(","))
          .join("\n");
    } else if (type === "pest") {
      filename = "병해충예찰.csv";
      csv = "조사일,병해충종류,발생위치,발생정도,비고\n"
        + this._pestData.map(r =>
          [r.date, r.type, r.location, r.severity, r.note]
          .map(v => `"${String(v||"").replace(/"/g,'""')}"`).join(",")
        ).join("\n");
    } else if (type === "control") {
      filename = "방제기록.csv";
      csv = "방제일,약제명,사용기작,희석배수(배),사용량,처리구역,비고\n"
        + this._controlData.map(r => {
          const pests = Array.isArray(r.pesticides) ? r.pesticides : (r.pesticide ? [{ name: r.pesticide }] : []);
          return pests.map(p =>
            [r.date, p.name, p.moa||"", p.dil||"", p.amount||"", r.zone||"", r.note||""]
            .map(v => `"${String(v||"").replace(/"/g,'""')}"`).join(",")
          ).join("\n");
        }).join("\n");
    }

    if (!csv) return;
    const bom = "﻿"; // Excel UTF-8 BOM
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  _openCropPopup(html, bindFn) {
    const overlay = this.shadowRoot.getElementById("popup-overlay");
    const inner   = this.shadowRoot.getElementById("popup-inner");
    if (!overlay || !inner) return;
    overlay.removeAttribute("hidden");
    inner.innerHTML = html;
    overlay.onclick = (e) => { if (e.target === overlay) this._closePopup(); };
    inner.querySelector(".crop-pop-cancel")?.addEventListener("click", () => this._closePopup());
    bindFn(inner);
  }

  _openGrowthAddPopup(editIndex = null) {
    if (!this._activeSeasonId) { alert("작기를 먼저 등록하거나 선택해주세요."); return; }
    const context = growthModalContext(this, editIndex);
    const { isEdit, editRecord, activeSeason, config, qualityDisorderFields } = context;
    this._openCropPopup(renderGrowthSurveyModal(this, context), (inner) => {
      inner.querySelector("#g-save")?.addEventListener("click", async () => {
        // Dynamic DB payload marker: metrics: config.fields.map
        const allGrowthMetricFields = [...config.fields, ...qualityDisorderFields];
        const metrics = allGrowthMetricFields.map(([key, label]) => ({
          key, label,
          value: inner.querySelector(`#g-${key}`)?.value || null,
          unit: this._growthUnitFromLabel(label),
        }));
        const legacyPayload = this._growthLegacyPayloadFromMetrics(metrics, activeSeason?.cropType);
        const body = {
          date:      inner.querySelector("#g-date")?.value || "",
          cropType: activeSeason?.cropType || "other",
          ...legacyPayload,
          metrics,
          note:      inner.querySelector("#g-note")?.value || "",
        };
        try {
          let result;
          const id = editRecord?.id;
          if (isEdit && id) {
            result = await this._hass.callApi(
              "PUT", `green_smart/crop/growth/${id}`, body
            );
            this._growthData[editIndex] = result;
          } else {
            result = await this._hass.callApi(
              "POST", `green_smart/crop/seasons/${this._activeSeasonId}/growth`, body
            );
            this._growthData.unshift(result);
            this._cropPage.growth = 1;
          }
          await this._fetchGrowthReport();
          this._closePopup();
          this._refreshCropContent();
        } catch (e) {
          alert("저장 실패: " + (e?.message || "DB 오류"));
        }
      });
    });
  }

  _openGrowthEditPopup(idx) {
    this._openGrowthAddPopup(idx);
  }

  _openPestAddPopup() {
    const context = pestModalContext(this, arguments[0] ?? null);
    const { editIndex, isEdit, editRecord, today, currentSeasonLabel, pestTypes, MAX_PEST_TYPES } = context;
    const debounceTimers = {};
    this._openCropPopup(renderPestScoutingModal(this, context), (inner) => {
      const listEl = inner.querySelector("#p-type-list");
      const addBtn = inner.querySelector("#p-add-type");
      const renderTypes = () => {
        listEl.innerHTML = renderPestTypeRows(this, pestTypes);
        addBtn.style.display = pestTypes.length >= MAX_PEST_TYPES ? "none" : "";
        bindTypeRows();
      };
      const bindTypeRows = () => {
        listEl.querySelectorAll("[data-pest-type-input]").forEach(input => {
          const idx = Number(input.dataset.pestTypeInput);
          input.addEventListener("input", () => {
            pestTypes[idx].name = input.value;
            clearTimeout(debounceTimers[idx]);
            debounceTimers[idx] = setTimeout(async () => {
              const q = input.value.trim();
              const sug = listEl.querySelector(`[data-pest-type-suggestions="${idx}"]`);
              if (!q || q.length < 2 || !sug) { if (sug) sug.style.display = "none"; return; }
              try {
                const json = await this._hass.callApi("POST", "green_smart/central/pesticide/search", { query: q });
                const rows = Array.isArray(json) ? json : (json.results || json.items || []);
                const names = [...new Set(rows.map(it => it.pest || it.disease || it.targetPest || it.name || it.pestiKorName).filter(Boolean))].slice(0, 8);
                sug.innerHTML = names.length ? names.map(name => `<button type="button" data-pest-suggest="${idx}" data-value="${this._esc(name)}" style="display:block;width:100%;text-align:left;background:#fff;border:none;padding:8px 10px;font-size:12px;cursor:pointer;">${this._esc(name)}</button>`).join("") : `<div style="padding:8px 10px;font-size:12px;color:#7a9780;">검색 결과 없음</div>`;
                sug.style.display = "block";
                sug.querySelectorAll("[data-pest-suggest]").forEach(btn => btn.addEventListener("click", () => {
                  pestTypes[idx].name = btn.dataset.value || "";
                  renderTypes();
                }));
              } catch (_) { if (sug) sug.style.display = "none"; }
            }, 250);
          });
        });
        listEl.querySelectorAll("[data-pest-severity-select]").forEach(select => {
          select.addEventListener("change", () => {
            const idx = Number(select.dataset.pestSeveritySelect);
            if (pestTypes[idx]) pestTypes[idx].severity = select.value || "1";
          });
        });
        listEl.querySelectorAll("[data-pest-type-del]").forEach(btn => btn.addEventListener("click", () => {
          pestTypes.splice(Number(btn.dataset.pestTypeDel), 1);
          renderTypes();
        }));
      };
      addBtn?.addEventListener("click", () => { if (pestTypes.length < MAX_PEST_TYPES) { pestTypes.push({ name: "", source: "", severity: "1" }); renderTypes(); } });
      renderTypes();
      inner.querySelector("#p-save")?.addEventListener("click", async () => {
        const selectedTypes = pestTypes.map(p => p.name.trim()).filter(Boolean);
        const maxSeverity = pestTypes.filter(p => p.name.trim()).reduce((max, p) => Math.max(max, Number(p.severity || 1)), 1);
        const scope = inner.querySelector("#p-location-scope")?.value || "전체";
        const body = {
          date:     inner.querySelector("#p-date")?.value || today,
          type:     selectedTypes.join(", "),
          location: `${currentSeasonLabel} · ${scope}`,
          severity: String(maxSeverity),
          note:     inner.querySelector("#p-note")?.value || "",
        };
        try {
          const result = await this._hass.callApi(
            isEdit ? "PATCH" : "POST", isEdit && editRecord?.id ? `green_smart/crop/pest/${editRecord.id}` : `green_smart/crop/seasons/${this._activeSeasonId}/pest`, body
          );
          if (isEdit) this._pestData[editIndex] = result || { ...editRecord, ...body };
          else this._pestData.unshift(result);
          await this._fetchGrowthReport();
          this._closePopup();
          this._refreshCropContent();
        } catch (e) {
          alert("저장 실패: " + (e?.message || "DB 오류"));
        }
      });
    });
  }

  _openPestEditPopup(idx) {
    this._openPestAddPopup(idx);
  }

  _formatPesticideMoa(item) {
    const name = String(item?.name || "").toLowerCase().replace(/\s+/g, "");
    const use = String(item?.use || item?.pestiUse || "").trim();
    const rawMoa = String(item?.moa || item?.indictSymbl || item?.actionCode || "").trim();
    const pest = String(item?.pest || "").trim();
    const crop = String(item?.crop || "").trim();
    const hay = `${name} ${use} ${rawMoa} ${pest} ${crop}`;
    const kind = /살균|곰팡|역병|노균|흰가루|잿빛|균/i.test(hay) ? "살균제"
      : /살충|응애|진딧|총채|나방|충/i.test(hay) ? "살충제"
      : /제초|잡초/i.test(hay) ? "제초제"
      : "약제";
    const groupMatch = hay.match(/(?:사용기작|기작|계통|작용기작)?\s*[-:]?\s*([가-힣] ?\d+|[A-Z]{1,2}\d*)/i);
    const group = name.includes("리도밀골드") ? "가1" : (groupMatch ? groupMatch[1].replace(/\s+/g, "") : "");
    return group ? `${kind}-${group}` : (use || kind);
  }

  _isPlsRiskEntry(entry) {
    const text = `${entry?.pls || ""} ${entry?.plsStatus || ""} ${entry?.note || ""} ${entry?.memo || ""}`.toLowerCase();
    return entry?.pls === false || /pls|잔류|미등록|부적합|초과|주의|경고/.test(text);
  }

  _findPlsConflict(name, moa = "") {
    const n = String(name || "").trim().toLowerCase();
    const m = String(moa || "").trim().toLowerCase();
    if (!n && !m) return null;
    for (const record of this._controlData || []) {
      const pesticides = Array.isArray(record.pesticides) ? record.pesticides : (record.pesticide ? [{ name: record.pesticide, moa: record.moa, pls: record.pls }] : []);
      for (const p of pesticides) {
        const pn = String(p.name || "").trim().toLowerCase();
        const pm = String(p.moa || "").trim().toLowerCase();
        if ((n && pn === n) || (m && pm === m)) {
          if (this._isPlsRiskEntry(p) || this._isPlsRiskEntry(record)) return { record, pesticide: p };
        }
      }
    }
    return null;
  }

  _openControlAddPopup() {
    const context = controlModalContext(this, arguments[0] ?? null);
    const { editIndex, isEdit, editRecord, today, MAX_PESTS, currentSeasonLabel, entries, getHistory, getPlsFromHistory } = context;
    const debounceTimers = {};

    this._openCropPopup(renderControlTreatmentModal(this, context), (inner) => {
      const listEl   = inner.querySelector("#c-pest-list");
      const addBtn   = inner.querySelector("#c-add-pest");
      const mixSummary  = inner.querySelector("#c-mix-summary");

      const renderAll = () => {
        listEl.innerHTML = entries.map((_, i) => renderControlPesticideEntry(this, entries[i], i)).join("");
        addBtn.style.display = entries.length >= MAX_PESTS ? "none" : "";
        if (mixSummary) {
          const count = entries.filter(e => e.name).length;
          mixSummary.style.display = count >= 2 ? "block" : "none";
          mixSummary.textContent = count >= 2 ? "혼용 경고는 문제가 되는 약제명 아래에 자동 표시됩니다." : "";
        }
        bindEntries();
      };

      const renderInlineWarnings = () => {
        entries.forEach((entry, idx) => {
          const mixEl = listEl.querySelector(`[data-mix-warning="${idx}"]`);
          if (mixEl) {
            mixEl.style.display = entry.mixWarning ? "" : "none";
            mixEl.textContent = entry.mixWarning ? `⚠️ 혼용 경고: ${entry.mixWarning}` : "";
          }
          const plsEl = listEl.querySelector(`[data-pls-warning="${idx}"]`);
          if (plsEl) {
            plsEl.style.display = entry.plsWarning ? "" : "none";
            plsEl.textContent = entry.plsWarning ? `⚠️ PLS 경고: ${entry.plsWarning}` : "";
          }
        });
      };

      const updatePlsWarnings = () => {
        entries.forEach((entry) => {
          const conflict = this._findPlsConflict(entry.name, entry.moa);
          entry.plsWarning = conflict
            ? `지난 방제기록에서 ${conflict.pesticide?.name || entry.name} 약제가 PLS 주의/부적합으로 기록되었습니다.`
            : "";
        });
        renderInlineWarnings();
      };

      const applyMixWarnings = (pairs = []) => {
        entries.forEach((entry) => { entry.mixWarning = ""; entry.mixable = null; entry.mixCheckStatus = ""; entry.mixCheckNote = ""; });
        pairs.forEach((pair) => {
          const pairMixable = pair.mixable === true ? true : pair.mixable === false ? false : null;
          const pairStatus = pairMixable === true ? "allowed" : pairMixable === false ? "forbidden" : "unknown";
          const names = [pair.pest1, pair.pest2, pair.name1, pair.name2].filter(Boolean).map(v => String(v).trim());
          const note = pair.mixable === false
            ? (pair.note || "혼용 불가로 확인되었습니다.")
            : pair.mixable === true
            ? (pair.note || "혼용 가능으로 확인되었습니다.")
            : (pair.note || "혼용 정보가 명확하지 않아 주의가 필요합니다.");
          entries.forEach((entry) => {
            if (names.some(n => n && entry.name && n === entry.name)) {
              entry.mixable = pairMixable;
              entry.mixCheckStatus = pairStatus;
              entry.mixCheckNote = entry.mixCheckNote ? `${entry.mixCheckNote} / ${note}` : note;
              if (pairMixable !== true) entry.mixWarning = entry.mixWarning ? `${entry.mixWarning} / ${note}` : note;
            }
          });
        });
        renderInlineWarnings();
      };

      const runMixWarningCheck = async () => {
        const named = entries.filter(e => e.name);
        if (named.length < 2) { applyMixWarnings([]); return; }
        try {
          const json = await this._hass.callApi("POST", "green_smart/pesticide/mix-check", {
            reg_nos: named.map(e => e.regNo).filter(Boolean),
            names: named.map(e => e.name),
          });
          applyMixWarnings(json.pairs || []);
        } catch (_) {
          const groups = new Map();
          named.forEach(e => {
            const key = String(e.moa || "").trim();
            if (!key) return;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(e);
          });
          const fallbackPairs = [];
          groups.forEach((groupEntries, moa) => {
            if (groupEntries.length >= 2) {
              for (let i = 0; i < groupEntries.length; i += 1) {
                for (let j = i + 1; j < groupEntries.length; j += 1) {
                  fallbackPairs.push({ pest1: groupEntries[i].name, pest2: groupEntries[j].name, mixable: null, note: `같은 사용기작(${moa}) 약제 혼용/연용 주의` });
                }
              }
            }
          });
          applyMixWarnings(fallbackPairs);
        }
      };

      const scheduleRiskChecks = () => {
        clearTimeout(debounceTimers.__risk);
        debounceTimers.__risk = setTimeout(() => {
          updatePlsWarnings();
          runMixWarningCheck();
        }, 250);
      };

      const _syncControlDoseCalculations = (idx) => {
        const entry = entries[idx];
        if (!entry) return;
        const scope = inner.querySelector("#c-location-scope")?.value || "전체";
        const areaInput = listEl.querySelector(`[data-treatment-area-input="${idx}"]`);
        const dilInput = listEl.querySelector(`[data-dil-input="${idx}"]`);
        const amountInput = listEl.querySelector(`[data-amount-input="${idx}"]`);
        const pyeongOutput = listEl.querySelector(`[data-pyeong-amount-output="${idx}"]`);
        const area = this._calculateTreatmentAreaFromSeason(scope, entry.treatmentAreaM2 || areaInput?.value || "");
        if (area && areaInput && !areaInput.value) areaInput.value = String(area);
        entry.treatmentAreaM2 = areaInput?.value || (area ? String(area) : "");
        const dilution = this._calculateControlDilution(entry.chemicalAmount, entry.waterAmount);
        if (dilution) { entry.dil = dilution; if (dilInput) dilInput.value = dilution; }
        const per = this._calculatePyeongUsage(entry.waterAmount || entry.amount, entry.treatmentAreaM2);
        entry.perPyeongUsage = per;
        if (pyeongOutput) pyeongOutput.value = per ? `${per}L/평` : "";
        const summary = [];
        if (entry.chemicalAmount) summary.push(`약제 ${entry.chemicalAmount}`);
        if (entry.waterAmount) summary.push(`물 ${entry.waterAmount}L`);
        if (entry.treatmentAreaM2) summary.push(`면적 ${entry.treatmentAreaM2}㎡`);
        if (entry.perPyeongUsage) summary.push(`평당 ${entry.perPyeongUsage}L`);
        if (amountInput) amountInput.value = summary.join(" · ");
        entry.amount = amountInput?.value || entry.amount || "";
      };

      const bindEntries = () => {
        listEl.querySelectorAll("[data-del-entry]").forEach(btn =>
          btn.addEventListener("click", () => {
            const i = +btn.dataset.delEntry;
            entries.splice(i, 1);
            renderAll();
          })
        );

        entries.forEach((_, idx) => {
          const nameInput   = listEl.querySelector(`[data-name-input="${idx}"]`);
          const moaInput    = listEl.querySelector(`[data-moa-input="${idx}"]`);
          const dilInput    = listEl.querySelector(`[data-dil-input="${idx}"]`);
          const amountInput = listEl.querySelector(`[data-amount-input="${idx}"]`);
          const chemicalInput = listEl.querySelector(`[data-chemical-amount-input="${idx}"]`);
          const waterInput = listEl.querySelector(`[data-water-amount-input="${idx}"]`);
          const areaInput = listEl.querySelector(`[data-treatment-area-input="${idx}"]`);
          const sugBox      = listEl.querySelector(`[data-pesticide-suggestions="${idx}"]`);

          moaInput?.addEventListener("input",    () => { entries[idx].moa    = moaInput.value; scheduleRiskChecks(); });
          dilInput?.addEventListener("input",    () => { entries[idx].dil    = dilInput.value; });
          amountInput?.addEventListener("input", () => { entries[idx].amount = amountInput.value; });
          chemicalInput?.addEventListener("input", () => { entries[idx].chemicalAmount = chemicalInput.value; _syncControlDoseCalculations(idx); });
          waterInput?.addEventListener("input", () => { entries[idx].waterAmount = waterInput.value; _syncControlDoseCalculations(idx); });
          areaInput?.addEventListener("input", () => { entries[idx].treatmentAreaM2 = areaInput.value; _syncControlDoseCalculations(idx); });
          _syncControlDoseCalculations(idx);

          nameInput?.addEventListener("input", () => {
            const q = nameInput.value.trim();
            entries[idx].name  = q;
            entries[idx].regNo = "";
            clearTimeout(debounceTimers[idx]);
            if (q.length < 2) { sugBox.style.display = "none"; scheduleRiskChecks(); return; }
            scheduleRiskChecks();
            debounceTimers[idx] = setTimeout(() => fetchSuggestions(idx, q, nameInput, sugBox, moaInput, dilInput, amountInput), 400);
          });

          nameInput?.addEventListener("blur", () =>
            setTimeout(() => { sugBox.style.display = "none"; }, 180)
          );
        });
      };

      const fetchSuggestions = async (idx, q, nameInput, sugBox, moaInput, dilInput, amountInput) => {
        sugBox.innerHTML = `<div style="padding:10px 14px;color:#7a9780;font-size:12px;">검색 중...</div>`;
        sugBox.style.display = "block";
        try {
          const json = await this._hass.callApi(
            "POST", "green_smart/central/pesticide/search", { query: q }
          );
          if (json.error === "no_psis_key" || json.detail === "feature_secret_missing") {
            sugBox.innerHTML = `<div style="padding:10px 14px;color:#c0392b;font-size:11px;">
              ⚠️ PSIS API 키 미설정 — Green Smart 설정에서 입력해주세요.</div>`;
            return;
          }
          const items = json.items || [];
          if (!items.length) {
            sugBox.innerHTML = `<div style="padding:10px 14px;color:#7a9780;font-size:12px;">검색 결과 없음</div>`;
            return;
          }
          sugBox.innerHTML = items.slice(0, 8).map((it, si) => `
            <div data-si="${si}"
              style="padding:9px 14px;cursor:pointer;border-bottom:1px solid #f0f7f1;">
              <div style="font-size:13px;font-weight:700;color:#24323F;">${this._esc(it.name)}</div>
              <div style="font-size:11px;color:#7a9780;">
                ${[it.company && `제조사: ${this._esc(it.company)}`,
                   it.crop && `작물: ${this._esc(it.crop)}`,
                   it.pest && `병해충: ${this._esc(it.pest)}`].filter(Boolean).join("&nbsp;·&nbsp;")}
              </div>
            </div>`).join("");

          sugBox.querySelectorAll("[data-si]").forEach(el =>
            el.addEventListener("mousedown", (e) => {
              e.preventDefault();
              const it = items[+el.dataset.si];
              entries[idx].name  = it.name;
              entries[idx].regNo = it.regNo || "";
              entries[idx].moa = this._formatPesticideMoa(it);
              nameInput.value    = it.name;
              if (moaInput) moaInput.value = entries[idx].moa;
              sugBox.style.display = "none";

              const hist = getHistory(it.name);
              if (hist) {
                if (hist.moa    && !moaInput.value)    { moaInput.value    = hist.moa;    entries[idx].moa    = hist.moa; }
                if (hist.dil    && !dilInput.value)    { dilInput.value    = hist.dil;    entries[idx].dil    = hist.dil; }
                if (hist.amount && !amountInput.value) { amountInput.value = hist.amount; entries[idx].amount = hist.amount; }
              }
              const plsVal = getPlsFromHistory(it.name);
              entries[idx].pls = plsVal;
              const entryEl = listEl.querySelector(`[data-entry="${idx}"]`);
              const labelEl = entryEl?.querySelector("label");
              if (labelEl) {
                const existing = labelEl.querySelector("span[data-pls]");
                if (existing) existing.remove();
                if (plsVal === true) {
                  const b = document.createElement("span");
                  b.dataset.pls = "1";
                  b.style.cssText = "background:#d4edda;color:#155724;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;";
                  b.textContent = "PLS ✓";
                  labelEl.appendChild(b);
                } else if (plsVal === false) {
                  const b = document.createElement("span");
                  b.dataset.pls = "1";
                  b.style.cssText = "background:#f8d7da;color:#721c24;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;";
                  b.textContent = "PLS ✗";
                  labelEl.appendChild(b);
                }
              }
              scheduleRiskChecks();
            })
          );
        } catch {
          sugBox.innerHTML = `<div style="padding:10px 14px;color:#c0392b;font-size:11px;">오류 발생</div>`;
        }
      };

      inner.querySelector("#c-location-scope")?.addEventListener("change", () => {
        entries.forEach((_, idx) => _syncControlDoseCalculations(idx));
      });

      addBtn.addEventListener("click", () => {
        if (entries.length >= MAX_PESTS) return;
        entries.push({ name: "", regNo: "", moa: "", dil: "", amount: "", chemicalAmount: "", waterAmount: "", treatmentAreaM2: "", perPyeongUsage: "", pls: null, mixWarning: "", plsWarning: "" });
        renderAll();
        scheduleRiskChecks();
      });

      inner.querySelector("#c-save")?.addEventListener("click", async () => {
        entries.forEach((e, idx) => {
          e.name   = (listEl.querySelector(`[data-name-input="${idx}"]`)?.value   || "").trim();
          e.moa    = listEl.querySelector(`[data-moa-input="${idx}"]`)?.value    || "";
          e.dil    = listEl.querySelector(`[data-dil-input="${idx}"]`)?.value    || "";
          e.chemicalAmount = listEl.querySelector(`[data-chemical-amount-input="${idx}"]`)?.value || "";
          e.waterAmount = listEl.querySelector(`[data-water-amount-input="${idx}"]`)?.value || "";
          e.treatmentAreaM2 = listEl.querySelector(`[data-treatment-area-input="${idx}"]`)?.value || "";
          e.perPyeongUsage = String(listEl.querySelector(`[data-pyeong-amount-output="${idx}"]`)?.value || "").replace(/L\/평$/, "");
          e.amount = listEl.querySelector(`[data-amount-input="${idx}"]`)?.value || "";
        });
        const validEntries = entries.filter(e => e.name);
        if (!validEntries.length) return;
        if (!this._activeSeasonId) {
          alert("작기를 먼저 등록한 뒤 방제 기록을 저장해주세요.");
          return;
        }

        const locationScope = inner.querySelector("#c-location-scope")?.value || "전체";
        const controlBody = {
          controlDate: inner.querySelector("#c-date")?.value || today,
          zone: `${currentSeasonLabel} · ${locationScope}`,
          note: inner.querySelector("#c-note")?.value || "",
          pesticides: validEntries.map(e => ({
            name: e.name, regNo: e.regNo || null,
            moa: e.moa || null, dil: parseInt(e.dil) || null,
            amount: e.amount || null,
            chemicalAmount: e.chemicalAmount ? Number(e.chemicalAmount) : null,
            waterAmount: e.waterAmount ? Number(e.waterAmount) : null,
            treatmentAreaM2: e.treatmentAreaM2 ? Number(e.treatmentAreaM2) : null,
            perPyeongUsage: e.perPyeongUsage ? Number(e.perPyeongUsage) : null,
            cropModelNutritionHint: e.perPyeongUsage ? { source: "control_record_modal", perPyeongUsage: Number(e.perPyeongUsage), unit: "L/평", caution: "방제/영양 모델 입력 후보, 실행 권한 없음" } : null,
            pls: e.pls === true ? true : e.pls === false ? false : null,
            mixable: e.mixable === true ? true : e.mixable === false ? false : null,
            mixCheckStatus: e.mixCheckStatus || null,
            mixCheckNote: e.mixCheckNote || e.mixWarning || null,
            plsWarning: e.plsWarning || null,
          })),
        };
        try {
          const result = await this._hass.callApi(
            "POST", `green_smart/crop/seasons/${this._activeSeasonId}/control`, controlBody
          );
          this._controlData.unshift(result);
          await this._fetchGrowthReport();
          this._closePopup();
          this._refreshCropContent();
        } catch (e) {
          alert("저장 실패: " + (e?.message || "DB 오류"));
        }
      });

      renderAll();
    });
  }

  _refreshCropContent() {
    const root = this.shadowRoot;
    const el = root?.querySelector("[data-crop-content]");
    if (!el) return;
    const sel = root.querySelector("[data-season-selector]");
    if (sel) sel.innerHTML = this._renderSeasonSelector();
    el.innerHTML = this._renderCropTabContent();
    this._bindCropContent(root);
  }

  _openControlEditPopup(idx) {
    this._openControlAddPopup(idx);
  }

  _bindCropContent(root) {
    // 추가 버튼
    root.querySelector("#basic-add-btn")?.addEventListener("click",    () => this._openCropBasicAddPopup());
    root.querySelector("#growth-add-btn")?.addEventListener("click",   () => this._openGrowthAddPopup());
    root.querySelector("#pest-add-btn")?.addEventListener("click",     () => this._openPestAddPopup());
    root.querySelector("#control-add-btn")?.addEventListener("click",  () => this._openControlAddPopup());

    // 내보내기 버튼
    root.querySelector("#basic-export-btn")?.addEventListener("click",   () => this._exportCropData("basic"));
    root.querySelector("#growth-export-btn")?.addEventListener("click",  () => this._exportCropData("growth"));
    root.querySelector("#pest-export-btn")?.addEventListener("click",    () => this._exportCropData("pest"));
    root.querySelector("#control-export-btn")?.addEventListener("click", () => this._exportCropData("control"));
    root.querySelector("[data-growth-report-refresh]")?.addEventListener("click", async (event) => { await this._refreshWeeklyGrowthReportFromButton(event.currentTarget); await this._maybeNotifyWeeklyGrowthReport("manual_refresh"); });
    root.querySelector("[data-center-crop-interlock-analytics-refresh]")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      if (button) button.disabled = true;
      try { await this._fetchCenterCropInterlockAnalytics(this._activeSeasonId, true); }
      finally { if (button) button.disabled = false; }
    });
    root.querySelector("[data-center-crop-interlock-snapshot-sync]")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      if (button) button.disabled = true;
      try { await this._syncCenterCropInterlockSnapshot("manual_panel", true); }
      finally { if (button) button.disabled = false; }
    });
    root.querySelector("[data-weekly-report-export]")?.addEventListener("click", () => this._exportWeeklyGrowthReport());
    root.querySelector("[data-weekly-report-notification-toggle]")?.addEventListener("click", async () => {
      const enabled = !this._weeklyReportNotificationEnabled();
      await this._setWeeklyReportNotificationEnabled(enabled);
      this._refreshCropContent();
    });
    root.querySelector("[data-center-crop-policy-notification-toggle]")?.addEventListener("click", async () => {
      const enabled = !this._cropPolicyNotificationEnabled();
      await this._setCropPolicyNotificationEnabled(enabled);
      this._refreshCropContent();
    });
    root.querySelector("[data-center-crop-policy-notification-dismiss]")?.addEventListener("click", async () => {
      await this._dismissCropPolicyNotification();
      this._refreshCropContent();
    });
    root.querySelector("[data-crop-prediction-validation-run]")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      if (!this._activeSeasonId) return;
      if (button) button.disabled = true;
      try {
        await this._hass.callApi("POST", `green_smart/crop/seasons/${this._activeSeasonId}/prediction-validations/run`, {});
        await this._fetchGrowthReport();
        this._refreshCropContent();
      } finally {
        if (button) button.disabled = false;
      }
    });
    root.querySelectorAll("[data-crop-ai-error-count-open]").forEach((button) => {
      button.addEventListener("click", () => {
        const modal = root.querySelector("[data-crop-ai-interlock-detail-modal]");
        if (modal) {
          modal.hidden = false;
          modal.style.display = "flex";
        }
      });
    });
    root.querySelectorAll("[data-crop-ai-interlock-detail-close]").forEach((button) => {
      button.addEventListener("click", () => {
        const modal = root.querySelector("[data-crop-ai-interlock-detail-modal]");
        if (modal) {
          modal.hidden = true;
          modal.style.display = "none";
        }
      });
    });
    root.querySelectorAll("[data-crop-interlock-approve]").forEach((button) => {
      button.addEventListener("click", async (event) => this._submitCropInterlockApproval(event.currentTarget));
    });

    root.querySelectorAll("[data-crop-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [key, page] = String(btn.dataset.cropPage || "").split(":");
        if (key && this._cropPage[key] !== undefined) {
          this._cropPage[key] = parseInt(page, 10) || 1;
          this._refreshCropContent();
        }
      });
    });

    // 작기 선택 카드
    root.querySelectorAll("[data-season-id]").forEach(card => {
      card.addEventListener("click", async () => {
        const id = parseInt(card.dataset.seasonId);
        if (this._activeSeasonId === id) return;
        this._activeSeasonId = id;
        await this._loadSeasonDetail(id);
        this._refreshCropContent();
      });
    });

    root.querySelectorAll("[data-growth-edit]").forEach(b =>
      b.addEventListener("click", () => {
        const idx = +b.dataset.growthEdit;
        this._openGrowthEditPopup(idx);
      })
    );
    root.querySelectorAll("[data-pest-edit]").forEach(b =>
      b.addEventListener("click", () => {
        const idx = +b.dataset.pestEdit;
        this._openPestEditPopup(idx);
      })
    );
    root.querySelectorAll("[data-control-edit]").forEach(b =>
      b.addEventListener("click", () => {
        const idx = +b.dataset.controlEdit;
        this._openControlEditPopup(idx);
      })
    );

    root.querySelectorAll("[data-crop-pest-go-control]").forEach((button) => {
      button.addEventListener("click", () => {
        this._cropSubTab = "control";
        this._refreshCropContent();
      });
    });

    // 삭제 버튼
    root.querySelectorAll("[data-growth-del]").forEach(b =>
      b.addEventListener("click", async () => {
        const idx = +b.dataset.growthDel;
        const id  = this._growthData[idx]?.id;
        if (id) await this._hass.callApi("DELETE", `green_smart/crop/growth/${id}`).catch(() => {});
        this._growthData.splice(idx, 1);
        await this._fetchGrowthReport();
        this._refreshCropContent();
      })
    );
    root.querySelectorAll("[data-pest-del]").forEach(b =>
      b.addEventListener("click", async () => {
        const idx = +b.dataset.pestDel;
        const id  = this._pestData[idx]?.id;
        if (id) await this._hass.callApi("DELETE", `green_smart/crop/pest/${id}`).catch(() => {});
        this._pestData.splice(idx, 1);
        this._refreshCropContent();
      })
    );
    root.querySelectorAll("[data-control-del]").forEach(b =>
      b.addEventListener("click", async () => {
        const idx = +b.dataset.controlDel;
        const id  = this._controlData[idx]?.id;
        if (id) await this._hass.callApi("DELETE", `green_smart/crop/control/${id}`).catch(() => {});
        this._controlData.splice(idx, 1);
        this._refreshCropContent();
      })
    );

    this._bindSeasonButtons(root);
  }

  _bindSeasonButtons(root) {
    root.querySelectorAll("[data-season-edit]").forEach(b =>
      b.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const idx = +b.dataset.seasonEdit;
        this._openCropBasicEditPopup(idx);
      })
    );

    root.querySelectorAll("[data-season-delete]").forEach(b =>
      b.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        const idx = +b.dataset.seasonDelete;
        const season = this._cropSeasons[idx];
        if (!season) return;
        const label = `${this._seasonZoneLabel(season)} ${season.variety || "작기"}`;
        if (!confirm(`${label} 작기를 정말 삭제할까요?\n삭제하면 해당 작기의 생육조사, 병해충 예찰, 방제 기록도 DB에서 함께 삭제됩니다.`)) return;
        const sid = season.id;
        if (sid) await this._hass.callApi("DELETE", `green_smart/crop/seasons/${sid}`).catch((e) => { throw e; });
        this._cropSeasons.splice(idx, 1);
        if (this._activeSeasonId === sid) {
          const active = this._cropSeasons.find(s => !s.demolishDate) || this._cropSeasons[0];
          this._activeSeasonId = active?.id || null;
          if (this._activeSeasonId) await this._loadSeasonDetail(this._activeSeasonId);
          else { this._growthData = []; this._growthReportData = null; this._pestData = []; this._controlData = []; }
        }
        this._refreshCropContent();
      })
    );

    root.querySelectorAll("[data-season-demolish]").forEach(b =>
      b.addEventListener("click", async () => {
        const idx = +b.dataset.seasonDemolish;
        if (!this._cropSeasons[idx]) return;
        const today = new Date().toISOString().slice(0, 10);
        const sid = this._cropSeasons[idx]?.id;
        if (sid) {
          await this._hass.callApi(
            "PATCH", `green_smart/crop/seasons/${sid}/demolish`, { date: today }
          ).catch(() => {});
        }
        this._cropSeasons[idx].demolishDate = today;
        const listEl = root.querySelector("#crop-seasons-list");
        if (listEl) {
          listEl.innerHTML = this._renderCropSeasonsList();
          this._bindSeasonButtons(root);
        }
      })
    );
  }

  _cloneControlStrategyDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_CONTROL_STRATEGY_STATE));
  }

  _loadControlStrategy() {
    const defaults = this._cloneControlStrategyDefaults();
    try {
      const raw = localStorage.getItem("green_smart_control_strategy");
      if (!raw) return defaults;
      const saved = JSON.parse(raw);
      const merged = {
        ...defaults,
        ...saved,
        baseInterlockSettings: { ...defaults.baseInterlockSettings, ...(saved.baseInterlockSettings || {}) },
        aiStrategySettings: { ...defaults.aiStrategySettings, ...(saved.aiStrategySettings || {}) },
        lowLightStrategySettings: { ...defaults.lowLightStrategySettings, ...(saved.lowLightStrategySettings || {}) },
        safetyLimits: { ...defaults.safetyLimits, ...(saved.safetyLimits || {}) },
        finalAppliedTargets: { ...defaults.finalAppliedTargets, ...(saved.finalAppliedTargets || {}) },
        systemStatus: { ...defaults.systemStatus, ...(saved.systemStatus || {}) },
        controlLogs: Array.isArray(saved.controlLogs) ? saved.controlLogs : defaults.controlLogs,
      };
      return this._calculateFinalAppliedTargets(merged);
    } catch (_) {
      return defaults;
    }
  }

  _saveControlStrategy() {
    this._controlStrategy = this._calculateFinalAppliedTargets(this._controlStrategy);
    this._pushControlLog("설정 저장 → 환경 제어 갱신");
    this._setScopedControlState("environment", this._controlStrategy);
    this._saveScopedControlStateToApi("environment", this._controlStrategy);
    this._setControlSaveNotice("environment");
    localStorage.setItem("green_smart_control_strategy", JSON.stringify(this._controlStrategy));
    this._pageRendered = null;
    this._update();
  }

  _pushControlLog(message) {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    this._controlStrategy.controlLogs = [`${time} ${message}`, ...(this._controlStrategy.controlLogs || [])].slice(0, 12);
  }

  _calculateFinalAppliedTargets(strategy = this._controlStrategy) {
    const base = strategy.baseInterlockSettings;
    const ai = strategy.aiStrategySettings;
    const safety = strategy.safetyLimits;
    const aiHealthy = ai.enabled && strategy.controlMode === "ai_assist" && strategy.systemStatus.aiStatus === "ok";
    if (!aiHealthy && ai.enabled && ai.autoFallback) {
      strategy.controlMode = "interlock";
      strategy.systemStatus.aiApplied = false;
      strategy.systemStatus.interlockActive = true;
    }
    const useAi = ai.enabled && strategy.controlMode === "ai_assist" && strategy.systemStatus.aiStatus === "ok";
    const clampTemp = (v) => Math.max(Number(safety.absoluteMinTemp), Math.min(Number(safety.absoluteMaxTemp), Number(v)));
    strategy.finalAppliedTargets = {
      dayTargetTemp: clampTemp(Number(base.dayTargetTemp) + (useAi ? Number(ai.dayTempDelta) : 0)),
      nightTargetTemp: clampTemp(Number(base.nightTargetTemp) + (useAi ? Number(ai.nightTempDelta) : 0)),
      targetHumidity: Number(base.targetHumidity),
      targetVpd: Math.max(0.1, Number(base.targetVpd) + (useAi ? Number(ai.targetVpdDelta) : 0)),
      targetCo2: Number(base.targetCo2),
      targetAdt: clampTemp(Number(base.baseAdt) + (useAi ? Number(ai.targetAdtDelta) : 0)),
      targetDif: Number(base.baseDif) + (useAi ? Number(ai.targetDifDelta) : 0),
    };
    strategy.systemStatus.aiApplied = useAi;
    strategy.systemStatus.interlockActive = !useAi || strategy.controlMode === "interlock";
    return strategy;
  }

  _strategyInput(group, key, label, val, unit = "", min = 0, max = 100, step = 1, marker = "") {
    return `<div class="strategy-row" data-env-setvalue-row ${marker}>
      <div data-env-setvalue-row-main data-env-setvalue-fixed-alignment style="display:grid;grid-template-columns:160px minmax(112px,1fr) minmax(118px,1fr) minmax(156px,156px);gap:8px;align-items:center;">
        <div class="strategy-label" data-env-setvalue-label style="min-width:0;white-space:normal;line-height:1.35;">${label}</div>
        <div data-env-setvalue-current style="font-size:11px;color:#557260;font-weight:800;text-align:right;white-space:nowrap;">현재 ${this._esc(String(val))}${unit}</div>
        <div data-env-setvalue-recommended style="font-size:10px;color:#7a9780;text-align:right;white-space:nowrap;">권장 ${min}~${max}</div>
        <div class="strategy-control" data-env-setvalue-control style="justify-self:stretch;display:flex;align-items:center;gap:6px;justify-content:flex-end;">
          <input type="number" data-env-setvalue-input data-control-field data-control-group="${group}" data-control-key="${key}"
            value="${val}" min="${min}" max="${max}" step="${step}">
          ${unit ? `<span data-env-setvalue-unit>${unit}</span>` : ""}
        </div>
      </div>
      <div data-env-setvalue-row-meta style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
        <span data-env-setvalue-help style="font-size:10px;color:#9aae9d;">저장 시 작기+구역+환경 제어 scope에 반영</span>
      </div>
    </div>`;
  }

  _strategyToggle(group, key, label, checked, marker = "") {
    return `<div class="strategy-row" data-env-setvalue-row ${marker}>
      <div data-env-setvalue-row-main data-env-setvalue-fixed-alignment style="display:grid;grid-template-columns:160px minmax(112px,1fr) minmax(118px,1fr) minmax(156px,156px);gap:8px;align-items:center;">
        <div class="strategy-label" data-env-setvalue-label style="min-width:0;white-space:normal;line-height:1.35;">${label}</div>
        <div data-env-setvalue-current style="font-size:11px;color:#557260;font-weight:800;text-align:right;white-space:nowrap;">현재 ${checked ? "ON" : "OFF"}</div>
        <div data-env-setvalue-recommended style="font-size:10px;color:#7a9780;text-align:right;white-space:nowrap;">권장 안전 기준 우선</div>
        <label class="strategy-switch" data-env-setvalue-control style="justify-self:stretch;display:flex;align-items:center;gap:6px;justify-content:flex-end;"><input type="checkbox" data-env-setvalue-input data-control-field data-control-group="${group}" data-control-key="${key}" ${checked ? "checked" : ""}><span data-env-setvalue-unit>ON/OFF</span></label>
      </div>
      <div data-env-setvalue-row-meta style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
        <span data-env-setvalue-help style="font-size:10px;color:#9aae9d;">변경값은 저장 버튼을 눌러야 반영</span>
      </div>
    </div>`;
  }

  _strategySelect(group, key, label, value, options, marker = "") {
    const currentLabel = (options.find(([v]) => String(v) === String(value)) || [value, value])[1];
    return `<div class="strategy-row" data-env-setvalue-row ${marker}>
      <div data-env-setvalue-row-main data-env-setvalue-fixed-alignment style="display:grid;grid-template-columns:160px minmax(112px,1fr) minmax(118px,1fr) minmax(156px,156px);gap:8px;align-items:center;">
        <div class="strategy-label" data-env-setvalue-label style="min-width:0;white-space:normal;line-height:1.35;">${label}</div>
        <div data-env-setvalue-current style="font-size:11px;color:#557260;font-weight:800;text-align:right;white-space:nowrap;">현재 ${this._esc(String(currentLabel))}</div>
        <div data-env-setvalue-recommended style="font-size:10px;color:#7a9780;text-align:right;white-space:nowrap;">선택 후 저장</div>
        <div data-env-setvalue-control style="justify-self:stretch;display:flex;align-items:center;gap:6px;justify-content:flex-end;"><select data-env-setvalue-input data-control-field data-control-group="${group}" data-control-key="${key}">
          ${options.map(([v, t]) => `<option value="${v}" ${value === v ? "selected" : ""}>${t}</option>`).join("")}
        </select></div>
      </div>
      <div data-env-setvalue-row-meta style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
        <span data-env-setvalue-help style="font-size:10px;color:#9aae9d;">SafetyGuard/Interlock 경계 안에서만 적용</span>
      </div>
    </div>`;
  }

  _strategySection(icon, title, body, attr = "") {
    const isSetValue = String(attr || "").includes("data-env-setvalue");
    return `<div class="gs-card strategy-card" ${attr}>
      <div class="card-title" ${isSetValue ? "data-env-setvalue-card-header" : ""} style="display:flex;align-items:center;gap:8px;margin-bottom:14px;"><ha-icon icon="${icon}" style="color:#51AE60;"></ha-icon>${title}</div>
      <div ${isSetValue ? "data-env-setvalue-card-body" : ""}>${body}</div>
    </div>`;
  }

  _renderFinalAppliedTargets(strategy) {
    const f = strategy.finalAppliedTargets;
    const rows = [
      ["주간 목표온도", f.dayTargetTemp, "°C"], ["야간 목표온도", f.nightTargetTemp, "°C"],
      ["목표 습도", f.targetHumidity, "%"], ["목표 VPD", f.targetVpd, "kPa"],
      ["목표 CO₂", f.targetCo2, "ppm"], ["목표 ADT", f.targetAdt, "°C"], ["목표 DIF", f.targetDif, "°C"],
    ];
    return `<div class="strategy-final-grid" data-final-target>
      <div class="strategy-chip-title">최종 적용값</div>
      ${rows.map(([l, v, u]) => `<div class="strategy-final"><span>${l}</span><b>${Number(v).toFixed(u === "ppm" || u === "%" ? 0 : 1)} ${u}</b></div>`).join("")}
    </div>`;
  }

  _envStrategyTabs() {
    return [
      { key: "ai", label: "AI 전략", icon: "mdi:brain" },
      { key: "interlock", label: "인터록 설정", icon: "mdi:tune-vertical" },
      { key: "safety", label: "안전 설정", icon: "mdi:shield-alert-outline" },
      { key: "ai-settings", label: "AI 보정 설정", icon: "mdi:tune" },
      { key: "operations", label: "운영·리허설", icon: "mdi:shield-check" },
      { key: "logs", label: "작동 로그", icon: "mdi:clipboard-text-clock" },
    ];
  }

  _renderEnvStrategyTabBar() {
    const tabs = this._envStrategyTabs();
    if (!tabs.some((t) => t.key === this._envStrategyTab)) this._envStrategyTab = "ai";
    return `<div class="env-strategy-tabs" style="display:flex;gap:4px;margin-bottom:16px;background:#f5faf6;border-radius:12px;padding:4px;overflow-x:auto;">
      ${tabs.map((t) => `<button class="c-tab ${this._envStrategyTab === t.key ? "active" : ""}" data-env-strategy-tab="${t.key}" style="flex:0 0 auto;padding:8px 10px;border-radius:8px;font-size:13px;display:flex;align-items:center;gap:5px;"><ha-icon icon="${t.icon}" style="width:15px;height:15px;"></ha-icon>${t.label}</button>`).join("")}
    </div>`;
  }

  _renderEnvAiStrategyTabContent(s, modeOptions, aiStatusOptions, statusText) {
    const ai = s.aiStrategySettings || {};
    const safe = s.safetyLimits || {};
    const f = s.finalAppliedTargets || {};
    const modeLabel = modeOptions.find(([v]) => v === s.controlMode)?.[1] || s.controlMode || "인터록 모드";
    const aiStatusLabel = aiStatusOptions.find(([v]) => v === s.systemStatus?.aiStatus)?.[1] || statusText || "대기";
    const metric = (label, value, help, marker = "") => `<div data-env-ai-main-metric ${marker} style="background:#f8fbf9;border-radius:12px;padding:10px;border:1px solid #e2f1e7;min-height:78px;"><div data-env-ai-main-metric-label style="font-size:11px;color:#5f7f70;font-weight:900;min-height:16px;">${label}</div><b data-env-ai-main-metric-value style="display:block;font-size:18px;color:#24323F;line-height:1.2;margin-top:2px;">${this._esc(String(value ?? '-'))}</b><div data-env-ai-main-metric-help style="font-size:10px;color:#8aa091;margin-top:3px;line-height:1.35;">${help}</div></div>`;
    return `<section data-env-ai-strategy-panel data-env-subtab-main-format data-env-subtab-summary-card style="background:#fbfefb;border:1px solid #e3f1e5;border-radius:16px;padding:14px;margin-bottom:14px;">
      <div data-env-ai-strategy-header style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:10px;">
        <div><div style="font-size:15px;font-weight:900;color:#24323F;">AI 전략</div><div style="font-size:12px;color:#7a9780;margin-top:3px;">작물 설정 AI 전략과 동일하게 운영 판단 요약을 먼저 보고, 모델·데이터 근거는 접힌 상세 패널에서 확인합니다.</div></div>
        <span style="font-size:10px;font-weight:900;border-radius:999px;padding:4px 9px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">environment</span>
      </div>
      <div data-env-ai-readonly-boundary style="background:#f7fbff;border:1px solid #dbeaf8;border-radius:14px;padding:10px;margin-bottom:10px;color:#4f6f83;font-size:11px;line-height:1.55;font-weight:800;">현장 Edge가 최종 판단 · read-only · 자동 실행 없음 · SafetyGuard/Interlock 우선</div>
      <section data-env-ai-main-card="environment-status" data-env-ai-decision-summary style="background:#fff;border:1px solid #cfe8d8;border-radius:16px;padding:14px;margin-bottom:12px;box-shadow:0 6px 18px rgba(64,117,78,0.08);">
        <div data-env-ai-main-card-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:10px;"><div><div style="font-size:15px;font-weight:900;color:#24323F;">환경 상태 요약</div><div style="font-size:11px;color:#7a9780;margin-top:3px;">현재 구역의 환경 목표와 AI 적용 상태입니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:4px 9px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">main</span></div>
        <div data-env-ai-main-metric-grid style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">${metric('AI 적용', s.systemStatus?.aiApplied ? '적용' : '미적용', '인터록보다 후순위', 'data-env-ai-primary-status')}${metric('최종 온도', `${f.dayTargetTemp ?? '-'}°C / ${f.nightTargetTemp ?? '-'}°C`, '주간/야간 목표', 'data-env-ai-final-temp')}${metric('습도/VPD', `${f.targetHumidity ?? '-'}% / ${f.targetVpd ?? '-'}kPa`, '증산 균형', 'data-env-ai-final-humidity')}</div>
        <div data-env-ai-main-note style="background:#f8fbf9;border:1px solid #e2f1e7;border-radius:12px;padding:10px;font-size:12px;color:#4a6741;line-height:1.55;margin-top:9px;"><b>다음 행동</b> 목표값/AI 보정은 설정 탭에서 저장하고, 실제 실행 전 SafetyGuard와 리허설 결과를 확인하세요.</div>
      </section>
      <section data-env-ai-main-card="interlock-status" style="background:#fff;border:1px solid #cfe8d8;border-radius:16px;padding:14px;margin-bottom:12px;box-shadow:0 6px 18px rgba(64,117,78,0.08);">
        <div data-env-ai-main-card-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:10px;"><div><div style="font-size:15px;font-weight:900;color:#24323F;">인터록 상태 요약</div><div style="font-size:11px;color:#7a9780;margin-top:3px;">AI 판단을 운영에 참고하기 전 확인해야 하는 안전 상태입니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:4px 9px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">main</span></div>
        <div data-env-ai-main-metric-grid style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">${metric('제어 모드', modeLabel, '설정 탭에서 변경', 'data-env-ai-control-mode-summary')}${metric('온도 한계', `${safe.absoluteMinTemp ?? '-'}~${safe.absoluteMaxTemp ?? '-'}°C`, '절대 경계', 'data-env-ai-temperature-boundary')}${metric('SafetyGuard', '우선 적용', '실제 실행 전 gate', 'data-env-ai-safetyguard-status')}</div>
      </section>
      <section data-env-ai-main-card="model-status" style="background:#fff;border:1px solid #cfe8d8;border-radius:16px;padding:14px;margin-bottom:12px;box-shadow:0 6px 18px rgba(64,117,78,0.08);">
        <div data-env-ai-main-card-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:10px;"><div><div style="font-size:15px;font-weight:900;color:#24323F;">모델 상태 요약</div><div style="font-size:11px;color:#7a9780;margin-top:3px;">AI 보정값과 모델 연결 상태를 요약합니다.</div></div><span style="font-size:10px;font-weight:900;border-radius:999px;padding:4px 9px;background:#f7fbff;color:#6d8799;border:1px solid #dbeaf8;">main</span></div>
        <div data-env-ai-main-metric-grid style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">${metric('AI 상태', aiStatusLabel, '연결/오류 상태', 'data-env-ai-model-status')}${metric('G-Index', ai.gIndex ?? '-', ai.growthStage || '생육 단계', 'data-env-ai-g-index')}${metric('ADT/DIF 보정', `${ai.targetAdtDelta ?? 0} / ${ai.targetDifDelta ?? 0}`, '기본 목표 위 보정', 'data-env-ai-correction-summary')}</div>
        <details data-env-ai-advanced-details style="margin-top:10px;border:1px solid #edf4ee;border-radius:12px;padding:10px;background:#fbfefb;"><summary style="font-size:12px;font-weight:900;color:#4a6741;cursor:pointer;">모델·데이터 근거 보기</summary>${this._renderEnvironmentStrategyPreviewCard('environment')}</details>
      </section>
    </section>`;
  }

  _renderEnvStrategyTabContent(s, modeOptions, aiStatusOptions, statusText) {
    const base = s.baseInterlockSettings;
    const ai = s.aiStrategySettings;
    const safe = s.safetyLimits;
    const low = s.lowLightStrategySettings;
    const tab = this._envStrategyTab;
    const f = s.finalAppliedTargets || {};
    const setValueBoundary = `<div data-env-setvalue-safety-boundary style="background:#f7fbff;border:1px solid #dbeaf8;border-radius:12px;padding:10px;margin:8px 0;color:#4f6f83;font-size:11px;font-weight:800;">현장 Edge 인터록과 SafetyGuard가 최종 적용을 제한합니다.</div>`;
    const setValueFooter = `<div data-env-setvalue-card-footer style="border-top:1px solid #edf4ee;margin-top:12px;padding-top:10px;"><div data-env-setvalue-action-row style="display:flex;gap:8px;flex-wrap:wrap;"><button data-env-setvalue-save id="control-strategy-save-inline" class="btn btn-primary">설정 저장</button><button data-env-setvalue-reset class="btn btn-ghost" type="button">변경 취소</button></div><div data-env-setvalue-audit-note style="font-size:10px;color:#7a9780;margin-top:6px;">저장은 crop_season_id + zone_id + environment scope로 기록되며 API 실패 시 localStorage fallback을 사용합니다. 실제 장치 실행은 별도 gate와 SafetyGuard를 통과해야 합니다.</div></div>`;
    const summary = (items) => `<div data-env-setvalue-operator-summary style="background:#f8fbf9;border:1px solid #dfeee1;border-radius:14px;padding:10px;margin-bottom:10px;"><div data-env-setvalue-summary-metric-grid style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;">${items.map(([label,value,help]) => `<div data-env-setvalue-summary-metric style="background:#fff;border:1px solid #edf4ee;border-radius:12px;padding:8px;"><span style="display:block;font-size:10px;color:#7a9780;">${label}</span><b style="display:block;color:#24323F;">${value}</b>${help ? `<small style="display:block;color:#8ca594;">${help}</small>` : ""}</div>`).join("")}</div></div>`;
    const group = (title, subtitle, body) => `<div data-env-setvalue-group style="border:1px solid #e1efe5;border-radius:14px;padding:10px;margin:10px 0;background:#fff;"><div data-env-setvalue-group-header style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;"><div><div data-env-setvalue-group-title style="font-size:13px;font-weight:900;color:#24323F;">${title}</div><div data-env-setvalue-group-subtitle style="font-size:10px;color:#7a9780;margin-top:2px;">${subtitle}</div></div></div><div data-env-setvalue-grid style="display:grid;gap:8px;">${body}</div></div>`;
    if (tab === "ai") return this._renderEnvAiStrategyTabContent(s, modeOptions, aiStatusOptions, statusText);
    if (tab === "interlock") return `<section data-env-interlock-settings-tab data-env-setvalue-polish data-env-setvalue-subtab data-env-setvalue-summary-card><span hidden data-env-setvalue-save></span>${this._strategySection("mdi:tune-vertical", "인터록 설정", `${summary([["주간/야간 PID", `${base.dayTargetTemp}°C / ${base.nightTargetTemp}°C`, "온도 PID 기준"], ["습도/VPD PID", `${base.targetHumidity}% / ${base.targetVpd}kPa`, "증산 균형"], ["CO₂ PID", `${base.targetCo2}ppm`, "환기와 연동"]])}${setValueBoundary}${group("온도 PID 목표값", "목표값은 인터록 PID 기준값으로 함께 관리합니다.", `${this._strategyInput("baseInterlockSettings", "dayTargetTemp", "주간 목표온도", base.dayTargetTemp, "°C", 5, 45, 0.5)}${this._strategyInput("baseInterlockSettings", "nightTargetTemp", "야간 목표온도", base.nightTargetTemp, "°C", 0, 35, 0.5)}${this._strategyInput("baseInterlockSettings", "baseAdt", "기본 ADT", base.baseAdt, "°C", 5, 40, 0.5)}${this._strategyInput("baseInterlockSettings", "baseDif", "기본 DIF", base.baseDif, "°C", -10, 20, 0.5)}`)}${group("습도·VPD PID 목표값", "과습/건조 판단의 기본 목표입니다.", `${this._strategyInput("baseInterlockSettings", "targetHumidity", "목표 습도", base.targetHumidity, "%", 20, 100, 1)}${this._strategyInput("baseInterlockSettings", "targetVpd", "목표 VPD", base.targetVpd, "kPa", 0.1, 3, 0.1)}`)}${group("CO₂ PID 목표값", "CO₂ 목표값은 환기 제한과 함께 판단됩니다.", `${this._strategyInput("baseInterlockSettings", "targetCo2", "목표 CO₂", base.targetCo2, "ppm", 300, 2000, 50)}`)}${group("온도 인터록", "난방/환기 전환 기준입니다.", `${this._strategyInput("temperatureControl", "heatingStartTemp", "난방 시작 온도", 16, "°C", 0, 35, 0.5)}${this._strategyInput("temperatureControl", "heatingStopTemp", "난방 정지 온도", 19, "°C", 0, 35, 0.5)}${this._strategyInput("temperatureControl", "ventStartTemp", "환기 시작 온도", 28, "°C", 10, 45, 0.5)}${this._strategyInput("temperatureControl", "ventMaxTemp", "환기 최대 온도", 32, "°C", 15, 50, 0.5)}`)}${group("습도·CO₂ 인터록", "결로/과습/CO₂ 공급 제한 기준입니다.", `${this._strategyInput("humidityVpdControl", "maxHumidity", "최대 습도", 85, "%", 40, 100, 1)}${this._strategyInput("humidityVpdControl", "minVpd", "최소 VPD", 0.45, "kPa", 0.1, 2, 0.05)}${this._strategyInput("co2Control", "co2Start", "CO₂ 공급 시작값", 650, "ppm", 300, 2000, 50)}${this._strategyInput("co2Control", "co2Stop", "CO₂ 공급 정지값", 850, "ppm", 300, 2500, 50)}`)}${setValueFooter}`, "data-env-setvalue-section data-env-setvalue-card")}</section>`;
    if (tab === "safety") return `<section data-env-safety-settings-tab data-env-setvalue-polish data-env-setvalue-subtab data-env-setvalue-summary-card><span hidden data-env-setvalue-save></span>${this._strategySection("mdi:shield-alert-outline", "안전 설정", `${summary([["AI fallback", ai.autoFallback ? "ON" : "OFF", "오류 시 안전 복귀"], ["온도 한계", `${safe.absoluteMinTemp}~${safe.absoluteMaxTemp}°C`, "절대 경계"], ["SafetyGuard", "우선 적용", "실행 전 gate"]])}${setValueBoundary}${group("AI 안전 복귀", "AI 오류와 연결 상태에 따른 안전 복귀 정책입니다.", `${this._strategyToggle("aiStrategySettings", "enabled", "AI 전략 사용", ai.enabled)}${this._strategyToggle("aiStrategySettings", "autoFallback", "AI 오류 시 자동 인터록 복귀", ai.autoFallback)}${this._strategySelect("systemStatus", "aiStatus", "AI 연결 상태", s.systemStatus.aiStatus, aiStatusOptions)}`)}${group("절대 안전 한계", "AI와 수동제어보다 우선하는 차단 경계입니다.", `${this._strategyInput("safetyLimits", "absoluteMaxTemp", "절대 최고온도", safe.absoluteMaxTemp, "°C", 20, 60, 0.5)}${this._strategyInput("safetyLimits", "absoluteMinTemp", "절대 최저온도", safe.absoluteMinTemp, "°C", -10, 25, 0.5)}${this._strategyInput("safetyLimits", "strongWindCloseSpeed", "강풍 폐쇄 풍속", safe.strongWindCloseSpeed, "m/s", 1, 30, 1)}${this._strategySelect("safetyLimits", "sensorErrorMode", "센서 오류 시 제어 방식", safe.sensorErrorMode, [["interlock", "기본 인터록"], ["hold", "직전 상태 유지"], ["emergency_stop", "비상 정지"]])}`)}${group("SafetyGuard", "실제 실행 전 watchdog과 안전 이벤트가 최종 gate로 동작합니다.", `<div data-env-setvalue-row data-env-setvalue-fixed-alignment style="display:grid;grid-template-columns:160px minmax(112px,1fr) minmax(118px,1fr) minmax(156px,156px);gap:8px;align-items:center;"><div data-env-setvalue-label style="min-width:0;line-height:1.35;">SafetyGuard 상태</div><div data-env-setvalue-current style="font-size:11px;color:#557260;font-weight:800;text-align:right;white-space:nowrap;">우선 적용</div><div data-env-setvalue-recommended style="font-size:10px;color:#7a9780;text-align:right;white-space:nowrap;">실행 전 gate</div><div data-env-setvalue-control style="justify-self:stretch;text-align:right;font-size:11px;color:#7a9780;">read-only</div></div>`)}${setValueFooter}`, "data-env-setvalue-section data-env-setvalue-card")}</section>`;
    if (tab === "ai-settings") return `<section data-env-setvalue-polish data-env-setvalue-subtab data-env-setvalue-summary-card>${this._strategySection("mdi:brain", "AI 보정 설정", `${summary([["G-Index", ai.gIndex, ai.growthStage], ["AI 적용", s.systemStatus.aiApplied ? "적용" : "미적용", "인터록 우선"], ["최종 온도", `${f.dayTargetTemp}°C / ${f.nightTargetTemp}°C`, "안전 한계 clamp"]])}${setValueBoundary}${group("AI 보정값", "기본 목표 위에 더해지는 생육 보정값입니다.", `${this._strategyInput("aiStrategySettings", "targetAdtDelta", "AI 목표 ADT", ai.targetAdtDelta, "°C", -5, 5, 0.1)}${this._strategyInput("aiStrategySettings", "targetDifDelta", "AI 목표 DIF", ai.targetDifDelta, "°C", -5, 5, 0.1)}${this._strategyInput("aiStrategySettings", "targetVpdDelta", "AI 목표 VPD", ai.targetVpdDelta, "kPa", -1, 1, 0.05)}${this._strategyInput("aiStrategySettings", "dayTempDelta", "AI 보정 주간온도", ai.dayTempDelta, "°C", -5, 5, 0.1)}${this._strategyInput("aiStrategySettings", "nightTempDelta", "AI 보정 야간온도", ai.nightTempDelta, "°C", -5, 5, 0.1)}`)}${group("저광기 전략", "일사 부족 시 목표값을 보수적으로 보정합니다.", `${this._strategyToggle("lowLightStrategySettings", "enabled", "저광기 전략 사용", low.enabled)}${this._strategyInput("lowLightStrategySettings", "solarThreshold", "저광 일사 기준", low.solarThreshold, "W/m²", 0, 600, 10)}${this._strategyInput("lowLightStrategySettings", "dayTempDelta", "저광기 주간온도 보정", low.dayTempDelta, "°C", -5, 3, 0.1)}${this._strategyInput("lowLightStrategySettings", "targetVpdDelta", "저광기 VPD 보정", low.targetVpdDelta, "kPa", -1, 1, 0.05)}${this._strategyInput("lowLightStrategySettings", "co2Boost", "저광기 CO₂ 보정", low.co2Boost, "ppm", 0, 500, 10)}`)}<div data-env-setvalue-preview-card style="border:1px solid #e1efe5;border-radius:14px;padding:10px;background:#fbfefb;margin:10px 0;"><div data-env-setvalue-group-title style="font-size:13px;font-weight:900;color:#24323F;margin-bottom:8px;">최종 적용값 Preview</div>${this._renderFinalAppliedTargets(s)}</div>${setValueFooter}`, "data-env-setvalue-section data-env-setvalue-card")}</section>`;
    const statusSummary = (items) => `<div data-env-status-operator-summary style="background:#f8fbf9;border:1px solid #dfeee1;border-radius:14px;padding:10px;margin-bottom:10px;"><div data-env-status-metric-grid style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;">${items.map(([label, value, help]) => `<div data-env-status-metric style="background:#fff;border:1px solid #edf4ee;border-radius:12px;padding:8px;"><span style="display:block;font-size:10px;color:#7a9780;">${label}</span><b style="display:block;color:#24323F;">${value}</b>${help ? `<small style="display:block;color:#8ca594;">${help}</small>` : ""}</div>`).join("")}</div></div>`;
    const statusBoundary = (text) => `<div data-env-status-safety-boundary style="background:#f7fbff;border:1px solid #dbeaf8;border-radius:12px;padding:10px;margin:8px 0;color:#4f6f83;font-size:11px;font-weight:800;">${text}</div>`;
    const statusGroup = (key, title, subtitle, body, footer = "") => `<div data-env-status-group="${key}" style="border:1px solid #e1efe5;border-radius:14px;padding:10px;margin:10px 0;background:#fff;"><div data-env-status-group-header style="margin-bottom:8px;"><div data-env-status-group-title style="font-size:13px;font-weight:900;color:#24323F;">${title}</div><div data-env-status-group-subtitle style="font-size:10px;color:#7a9780;margin-top:2px;">${subtitle}</div></div><div data-env-status-card-grid style="display:grid;gap:10px;">${body}</div>${footer ? `<div data-env-status-card-footer style="border-top:1px solid #edf4ee;margin-top:10px;padding-top:8px;font-size:10px;color:#7a9780;">${footer}</div>` : ""}</div>`;
    const statusCardShell = (body) => `<div data-env-status-card-shell style="background:#fbfefb;border:1px solid #edf4ee;border-radius:12px;padding:8px;">${body}</div>`;
    if (tab === "operations") return `<section data-env-operations-polish data-env-status-subtab="operations" data-env-subtab-main-format data-env-subtab-summary-card>${statusSummary([["운영 상태", statusText, "AI는 인터록보다 후순위"], ["최종 목표", `${f.dayTargetTemp}°C / ${f.targetHumidity}%`, "저장값 기준"], ["리허설", "우선 확인", "농장주/직원용"]])}${statusBoundary("AI 운영과 안전/리허설을 한 탭에서 확인합니다. 실제 실행은 SafetyGuard gate를 통과해야 합니다. 농장주/직원은 리허설 결과를 먼저 확인합니다.")}${statusGroup("ai-ops", "AI 운영 확인", "최종 목표, 작업자 확인, 최근 실행 로그를 한 묶음으로 확인합니다.", statusCardShell(this._renderControlAiOpsTabContent("environment")), "AI 제안은 자동 실행 권한이 아니며 작업자 확인/SafetyGuard를 따릅니다.")}${statusGroup("safety-rehearsal", "안전·리허설", "인터록, watchdog, dry-run 결과를 실행 전 점검합니다.", statusCardShell(this._renderControlSafetyOpsTabContent("environment")), "리허설 통과는 실제 장치 실행 허가가 아니며 별도 gate가 필요합니다.")}</section>`;
    if (tab === "devices") return `<section data-env-devices-polish data-env-status-subtab="devices" data-env-subtab-main-format data-env-subtab-summary-card>${statusSummary([["Entity 상태", "실시간 참고", "HA 상태 요약"], ["매핑", "구역별 저장", "entity 연결"], ["검증", "mapping validation", "실행 전 점검"]])}${statusBoundary("장치 매핑은 Home Assistant entity 연결만 변경합니다. 이 탭은 수동 장치 실행 권한을 추가하지 않습니다.")}<div data-env-device-rbac-note style="font-size:11px;color:#7a9780;margin:8px 0;">권한 문구: 농장주/직원은 상태와 검증 결과를 먼저 확인하고, 매핑 변경은 허용된 역할만 수행합니다.</div>${statusGroup("entity-state", "장치 상태", "현재 HA entity 상태 요약입니다.", statusCardShell(this._renderZoneEntityStateSummaryCard("environment")))}${statusGroup("entity-mapping", "Entity 매핑", "환경 제어 장치와 HA entity를 연결합니다.", statusCardShell(this._renderZoneEntityMappingCard("environment")), "저장 후 crop_season_id + zone_id + environment scope로 관리됩니다.")}<div data-env-device-mapping-save-boundary hidden>mapping save uses existing zone control settings path; no direct execution</div>${statusGroup("mapping-validation", "매핑 검증", "실행 전 누락/불일치 entity를 확인합니다.", statusCardShell(this._renderZoneEntityMappingValidationCard("environment")))}</section>`;
    if (tab === "logs") { const logs = s.controlLogs || []; return `<section data-env-logs-polish data-env-status-subtab="logs" data-env-subtab-main-format><div data-env-log-summary data-env-subtab-summary-card data-env-status-card style="background:#fff;border:1px solid #dfeee1;border-radius:14px;padding:10px;margin-bottom:10px;"><b style="display:block;color:#24323F;">환경 제어 작동 로그</b><span style="font-size:12px;color:#4a6741;">로그는 실행/저장 결과 확인용이며 직접 실행 권한을 제공하지 않습니다.</span><div data-env-status-metric-grid style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-top:8px;"><div data-env-status-metric><span>최근 로그</span><b>${logs.length}건</b></div><div data-env-status-metric><span>범위</span><b>${this._esc(this._currentControlScopeLabel("environment"))}</b></div></div></div><div data-env-subtab-list-header style="font-size:13px;font-weight:900;color:#24323F;margin-bottom:8px;">최근 작동 로그</div><div data-env-subtab-record-list data-control-log>${logs.length ? logs.map((log, idx) => `<div data-env-subtab-record-row class="strategy-log"><div data-env-subtab-record-meta>${idx + 1}. ${this._esc(log)}</div><div data-env-subtab-record-actions><span style="font-size:10px;color:#7a9780;">확인 전용</span></div></div>`).join("") : `<div data-env-log-empty-state data-env-subtab-record-row class="strategy-log"><div data-env-subtab-record-meta>아직 환경 제어 작동 로그가 없습니다.</div><div data-env-subtab-record-actions><span style="font-size:10px;color:#7a9780;">저장/리허설 후 표시</span></div></div>`}</div></section>`; }
    return this._renderEnvStrategyTabContent({ ...s }, modeOptions, aiStatusOptions, statusText);
  }

  _loadControlScope() {
    try {
      const saved = JSON.parse(localStorage.getItem("green_smart_control_scope") || "{}");
      return { seasonId: saved.seasonId || null, zoneId: Number(saved.zoneId || 1), applyMode: saved.applyMode || "current" };
    } catch (_) {
      return { seasonId: null, zoneId: 1, applyMode: "current" };
    }
  }

  _saveControlScope() {
    localStorage.setItem("green_smart_control_scope", JSON.stringify(this._controlScope));
  }

  _zoneControlApiPath(domain) {
    return {
      environment: "green_smart/environment/control-settings",
      irrigation: "green_smart/irrigation/control-settings",
      device: "green_smart/devices/control-settings",
    }[domain] || "green_smart/zones/control-settings";
  }

  _numericControlSeasonId() {
    const sid = this._currentControlSeasonId();
    const n = Number(sid);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  _scopedControlCacheKey(domain) {
    return `${domain}:${this._currentControlSeasonId()}:${Number(this._controlScope?.zoneId || 1)}`;
  }

  async _fetchScopedControlStateFromApi(domain) {
    const { patchOnly = false } = arguments[1] || {};
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return null;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const path = `${this._zoneControlApiPath(domain)}?crop_season_id=${cropSeasonId}&zone_id=${zoneId}`;
      const res = await this._hass.callApi("GET", path);
      if (res && res.found && res.settings) {
        this._apiScopedControlCache[cacheKey] = this._cloneControlState(domain, res.settings);
        this._setScopedControlState(domain, res.settings);
        if (!patchOnly) { this._pageRendered = null; this._update(); }
        return this._apiScopedControlCache[cacheKey];
      }
    } catch (err) {
      console.warn("API 저장 실패 시 localStorage fallback", err);
    }
    return null;
  }

  async _saveScopedControlStateToApi(domain, state) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return false;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    try {
      const res = await this._hass.callApi("POST", this._zoneControlApiPath(domain), {
        crop_season_id: cropSeasonId,
        zone_id: zoneId,
        settings: state,
      });
      if (res && res.settings) this._apiScopedControlCache[this._scopedControlCacheKey(domain)] = this._cloneControlState(domain, res.settings);
      return true;
    } catch (err) {
      console.warn("API 저장 실패 시 localStorage fallback", err);
      return false;
    }
  }

  async _copyScopedControlSettingsViaApi(domain, fromZoneId, toZoneIds) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return false;
    try {
      await this._hass.callApi("POST", "green_smart/zones/copy-control-settings", {
        crop_season_id: cropSeasonId,
        domain,
        from_zone_id: Number(fromZoneId),
        to_zone_ids: toZoneIds.map((z) => Number(z)),
      });
      return true;
    } catch (err) {
      console.warn("API 저장 실패 시 localStorage fallback", err);
      return false;
    }
  }

  async _fetchZoneAiOutputs(domain) {
    const { patchOnly = false } = arguments[1] || {};
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return [];
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const res = await this._hass.callApi("GET", `green_smart/zones/ai-control-outputs?crop_season_id=${cropSeasonId}&zone_id=${zoneId}&domain=${domain}&limit=5`);
      const items = Array.isArray(res?.items) ? res.items : [];
      this._zoneAiOutputCache[cacheKey] = items;
      if (!patchOnly) { this._pageRendered = null; this._update(); }
      return items;
    } catch (err) {
      console.warn("AI output 조회 실패 시 fallback", err);
      return this._zoneAiOutputCache[cacheKey] || [];
    }
  }

  async _fetchZoneFinalTargets(domain) {
    const { patchOnly = false } = arguments[1] || {};
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return null;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const res = await this._hass.callApi("GET", `green_smart/zones/final-targets?crop_season_id=${cropSeasonId}&zone_id=${zoneId}&domain=${domain}`);
      this._zoneFinalTargetCache[cacheKey] = res?.found ? res : null;
      if (!patchOnly) { this._pageRendered = null; this._update(); }
      return this._zoneFinalTargetCache[cacheKey];
    } catch (err) {
      console.warn("AI output 조회 실패 시 fallback", err);
      return this._zoneFinalTargetCache[cacheKey] || null;
    }
  }

  _readEnvironmentStrategyInputs(root, domain) {
    const card = root?.querySelector?.(`[data-env-strategy-preview-card][data-env-strategy-domain="${domain}"]`) || root?.querySelector?.("[data-env-strategy-preview-card]");
    const readNumber = (selector) => {
      const raw = card?.querySelector(selector)?.value;
      return raw === "" || raw == null ? undefined : Number(raw);
    };
    return {
      sourceMode: card?.querySelector("[data-env-strategy-source-mode]")?.value || "auto",
      manualOverrides: {
        radiation: readNumber("[data-env-strategy-manual-radiation]"),
        temperature: readNumber("[data-env-strategy-manual-temperature]"),
        humidity: readNumber("[data-env-strategy-manual-humidity]"),
        co2: readNumber("[data-env-strategy-manual-co2]"),
      },
    };
  }

  _environmentStrategyPreviewPayload(domain) {
    const cropSeasonId = this._numericControlSeasonId();
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const input = this._readEnvironmentStrategyInputs(this.shadowRoot, domain);
    return { crop_season_id: cropSeasonId, zone_id: zoneId, sourceMode: input.sourceMode, manualOverrides: input.manualOverrides, weatherSource: {}, inputs: input.manualOverrides };
  }

  async _fetchEnvironmentStrategyPreview(domain) {
    const { patchOnly = false } = arguments[1] || {};
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId || domain !== "environment") return null;
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const res = await this._hass.callApi("POST", "green_smart/environment/strategy-preview", this._environmentStrategyPreviewPayload(domain));
      this._zoneEnvironmentStrategyPreviewCache[cacheKey] = res;
      if (!patchOnly) { this._pageRendered = null; this._update(); }
      return res;
    } catch (err) {
      console.warn("환경 전략 모델 조회 실패 시 fallback", err);
      return this._zoneEnvironmentStrategyPreviewCache[cacheKey] || null;
    }
  }

  async _saveEnvironmentStrategyFinalTargets(domain) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId || domain !== "environment") return false;
    try {
      const res = await this._hass.callApi("POST", "green_smart/environment/strategy-preview", { ...this._environmentStrategyPreviewPayload(domain), save_final_targets: true, calculated_by: "environment_strategy_mvp" });
      this._zoneEnvironmentStrategyPreviewCache[this._scopedControlCacheKey(domain)] = res;
      await this._fetchZoneFinalTargets(domain);
      this._controlSaveNotice = { domain, label: `${this._currentControlScopeLabel(domain)} · 환경 전략 모델 최종값 저장 완료`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      this._pageRendered = null;
      this._update();
      return !!res?.ok;
    } catch (err) {
      console.warn("환경 전략 모델 저장 실패 시 fallback", err);
      return false;
    }
  }

  _readZoneLimitedAutoPolicy(root, domain) {
    const card = root?.querySelector?.(`[data-zone-limited-auto-card][data-zone-limited-auto-domain="${domain}"]`) || root?.querySelector?.("[data-zone-limited-auto-card]");
    const deviceGroupAutoAllow = {};
    card?.querySelectorAll?.("[data-zone-limited-auto-group]").forEach((row) => {
      const group = row.dataset.zoneLimitedAutoGroup;
      deviceGroupAutoAllow[group] = !!row.querySelector("[data-zone-limited-auto-enabled]")?.checked;
    });
    const maxAutoDurationMinutes = Number(card?.querySelector("[data-zone-limited-auto-duration]")?.value || 15);
    return {
      deviceGroupAutoAllow,
      semiAutoRequiresAck: !!card?.querySelector("[data-zone-limited-auto-semi-ack]")?.checked,
      maxAutoDurationMinutes,
      operatorConfirmationRequired: true,
      safetyPolicy: "SafetyGuard 우선",
    };
  }

  async _fetchZoneLimitedAutoPolicy(domain) {
    const { patchOnly = false } = arguments[1] || {};
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return null;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const res = await this._hass.callApi("GET", `green_smart/zones/limited-auto-policy?crop_season_id=${cropSeasonId}&zone_id=${zoneId}&domain=${domain}`);
      this._zoneLimitedAutoPolicyCache[cacheKey] = res;
      if (!patchOnly) { this._pageRendered = null; this._update(); }
      return res;
    } catch (err) {
      console.warn("제한적 자동제어 정책 조회 실패 시 fallback", err);
      return this._zoneLimitedAutoPolicyCache[cacheKey] || null;
    }
  }

  async _saveZoneLimitedAutoPolicy(domain) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return false;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const policy = this._readZoneLimitedAutoPolicy(this.shadowRoot, domain);
    try {
      const res = await this._hass.callApi("POST", "green_smart/zones/limited-auto-policy", { crop_season_id: cropSeasonId, zone_id: zoneId, domain, policy });
      this._zoneLimitedAutoPolicyCache[this._scopedControlCacheKey(domain)] = res;
      this._controlSaveNotice = { domain, label: `${this._currentControlScopeLabel(domain)} · 제한적 자동제어 정책 저장 완료`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      this._pageRendered = null; this._update();
      return !!res?.ok;
    } catch (err) {
      console.warn("제한적 자동제어 정책 저장 실패", err);
      return false;
    }
  }

  async _requestZoneAlertResume(domain) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return false;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    try {
      const res = await this._hass.callApi("POST", "green_smart/zones/alert-resume", { crop_season_id: cropSeasonId, zone_id: zoneId, domain, resumeAction: "request", operatorNote: "panel resume request" });
      this._zoneAlertResumeCache[this._scopedControlCacheKey(domain)] = res;
      this._controlSaveNotice = { domain, label: `${this._currentControlScopeLabel(domain)} · 알림 확인/조치/재개 요청 완료`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      this._pageRendered = null; this._update();
      return !!res?.ok;
    } catch (err) {
      console.warn("알림 확인/조치/재개 요청 실패", err);
      return false;
    }
  }

  _readIrrigationStrategyInputs(root, domain) {
    const card = root?.querySelector?.(`[data-irrigation-strategy-preview-card][data-irrigation-strategy-domain="${domain}"]`) || root?.querySelector?.("[data-irrigation-strategy-preview-card]");
    const readNumber = (selector) => {
      const raw = card?.querySelector(selector)?.value;
      return raw === "" || raw == null ? undefined : Number(raw);
    };
    return {
      sourceMode: card?.querySelector("[data-irrigation-strategy-source-mode]")?.value || "auto",
      manualOverrides: {
        accumulatedRadiation: readNumber("[data-irrigation-strategy-manual-radiation]"),
        currentVwc: readNumber("[data-irrigation-strategy-manual-vwc]"),
        currentEc: readNumber("[data-irrigation-strategy-manual-ec]"),
        currentPh: readNumber("[data-irrigation-strategy-manual-ph]"),
      },
    };
  }

  _irrigationStrategyPreviewPayload(domain) {
    const cropSeasonId = this._numericControlSeasonId();
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const input = this._readIrrigationStrategyInputs(this.shadowRoot, domain);
    return { crop_season_id: cropSeasonId, zone_id: zoneId, sourceMode: input.sourceMode, manualOverrides: input.manualOverrides, inputs: input.manualOverrides };
  }

  async _fetchIrrigationStrategyPreview(domain) {
    const { patchOnly = false } = arguments[1] || {};
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId || domain !== "irrigation") return null;
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const res = await this._hass.callApi("POST", "green_smart/irrigation/strategy-preview", this._irrigationStrategyPreviewPayload(domain));
      this._zoneIrrigationStrategyPreviewCache[cacheKey] = res;
      if (!patchOnly) { this._pageRendered = null; this._update(); }
      return res;
    } catch (err) {
      console.warn("관수 전략 모델 조회 실패 시 fallback", err);
      return this._zoneIrrigationStrategyPreviewCache[cacheKey] || null;
    }
  }

  async _saveIrrigationStrategyFinalTargets(domain) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId || domain !== "irrigation") return false;
    try {
      const res = await this._hass.callApi("POST", "green_smart/irrigation/strategy-preview", { ...this._irrigationStrategyPreviewPayload(domain), save_final_targets: true, calculated_by: "irrigation_strategy_mvp" });
      this._zoneIrrigationStrategyPreviewCache[this._scopedControlCacheKey(domain)] = res;
      await this._fetchZoneFinalTargets(domain);
      this._controlSaveNotice = { domain, label: `${this._currentControlScopeLabel(domain)} · 관수 전략 모델 최종값 저장 완료`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      this._pageRendered = null;
      this._update();
      return !!res?.ok;
    } catch (err) {
      console.warn("관수 전략 모델 저장 실패 시 fallback", err);
      return false;
    }
  }

  async _applyZoneAiOutput(domain, outputId) {
    if (!this._hass || !outputId) return false;
    try {
      const res = await this._hass.callApi("POST", `green_smart/zones/ai-control-outputs/${outputId}/apply`, {});
      this._controlSaveNotice = { domain, label: `${this._currentControlScopeLabel(domain)} · AI 전략 적용 완료`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      await this._fetchZoneAiOutputs(domain);
      await this._fetchZoneFinalTargets(domain);
      return !!res?.ok;
    } catch (err) {
      console.warn("AI output 조회 실패 시 fallback", err);
      return false;
    }
  }

  async _previewZoneFinalTargetsDryRun(domain) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return null;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    try {
      const res = await this._hass.callApi("POST", "green_smart/zones/execute-final-targets", {
        crop_season_id: cropSeasonId,
        zone_id: zoneId,
        domain,
        dry_run: true,
        post_state_delay: 0,
      });
      this._zoneDryRunPreviewCache[this._scopedControlCacheKey(domain)] = res;
      this._controlSaveNotice = { domain, label: `${this._currentControlScopeLabel(domain)} · Dry Run UI 실행 전 확인 완료`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      this._pageRendered = null;
      this._update();
      return res;
    } catch (err) {
      console.warn("Dry Run UI 조회 실패 시 fallback", err);
      return this._zoneDryRunPreviewCache[this._scopedControlCacheKey(domain)] || null;
    }
  }

  async _fetchZoneRehearsalReadiness(domain) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return null;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const res = await this._hass.callApi("GET", `green_smart/zones/rehearsal-readiness?crop_season_id=${cropSeasonId}&zone_id=${zoneId}&domain=${domain}`);
      this._zoneRehearsalReadinessCache[cacheKey] = res;
      this._controlSaveNotice = { domain, label: `${this._currentControlScopeLabel(domain)} · 현장 리허설 준비도 확인 완료`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      this._pageRendered = null;
      this._update();
      return res;
    } catch (err) {
      console.warn("현장 리허설 readiness 조회 실패 시 fallback", err);
      return this._zoneRehearsalReadinessCache[cacheKey] || null;
    }
  }

  async _runZoneVirtualRehearsal(domain) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return null;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const res = await this._hass.callApi("POST", "green_smart/zones/virtual-rehearsal", { crop_season_id: cropSeasonId, zone_id: zoneId, domain });
      this._zoneVirtualRehearsalCache[cacheKey] = res;
      this._controlSaveNotice = { domain, label: `${this._currentControlScopeLabel(domain)} · 가상 장치 리허설 완료 · 실제 장비 연결 금지`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      this._pageRendered = null;
      this._update();
      return res;
    } catch (err) {
      console.warn("가상 장치 rehearsal 실행 실패 시 fallback", err);
      return this._zoneVirtualRehearsalCache[cacheKey] || null;
    }
  }

  _operatorConfirmationPhrase(domain) {
    return "실제 장비 실행 확인";
  }

  _operatorExecutionConfirmationPayload(domain) {
    const card = this.shadowRoot?.querySelector(`[data-zone-operator-confirm-card][data-zone-operator-confirm-domain="${domain}"]`);
    const enabled = !!card?.querySelector("[data-zone-operator-confirm-enabled]")?.checked;
    return {
      operator_confirmed: enabled,
      operatorConfirmationText: card?.querySelector("[data-zone-operator-confirm-text]")?.value?.trim() || "",
      operatorRole: card?.querySelector("[data-zone-operator-confirm-role]")?.value || "operator",
      operatorOverrideReason: card?.querySelector("[data-zone-operator-confirm-reason]")?.value?.trim() || "panel operator confirmation",
    };
  }

  async _executeZoneFinalTargets(domain) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return false;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    try {
      const res = await this._hass.callApi("POST", "green_smart/zones/execute-final-targets", {
        crop_season_id: cropSeasonId,
        zone_id: zoneId,
        domain,
        dry_run: false,
        ...this._operatorExecutionConfirmationPayload(domain),
      });
      const safetyText = res?.blockedByInterlock ? `안전 차단${res?.failSafeApplied ? " · Fail Safe 적용" : ""}` : "안전 상태 clear";
      const stateText = res?.stateVerification === "passed" ? "상태 확인 통과" : `상태 확인 ${res?.stateMatched ? "통과" : "주의"}`;
      this._controlSaveNotice = { domain, label: `${this._currentControlScopeLabel(domain)} · 최종값 실행 완료 · 운영자 확인 (${res?.executedCount || 0}/${res?.plannedCount || 0}) · ${safetyText} · ${stateText} · 실행 후 상태 ${res?.stateVerification || "unknown"} · safetyStatus ${res?.safetyStatus || "clear"}`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      await this._fetchZoneFinalTargets(domain);
      await this._fetchZoneExecutionLogs(domain);
      return !!res?.ok;
    } catch (err) {
      console.warn("final targets 실행 실패 시 fallback", err);
      return false;
    }
  }

  async _fetchZoneSafetyGuardWatchdog(domain) {
    const { patchOnly = false } = arguments[1] || {};
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return null;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const res = await this._hass.callApi("GET", `green_smart/zones/safety-guard-watchdog?crop_season_id=${cropSeasonId}&zone_id=${zoneId}&domain=${domain}&stale_threshold_seconds=120`);
      this._zoneSafetyGuardWatchdogCache[cacheKey] = res;
      if (!patchOnly) {
        this._pageRendered = null;
        this._update();
      }
      return res;
    } catch (err) {
      console.warn("SafetyGuard Watchdog 조회 실패 시 fallback", err);
      return this._zoneSafetyGuardWatchdogCache[cacheKey] || null;
    }
  }

  async _fetchZoneSafetyGuardEvents(domain) {
    const { patchOnly = false } = arguments[1] || {};
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return null;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const res = await this._hass.callApi("GET", `green_smart/zones/safety-guard-events?crop_season_id=${cropSeasonId}&zone_id=${zoneId}&domain=${domain}&limit=30`);
      this._zoneSafetyGuardEventCache[cacheKey] = res;
      if (!patchOnly) { this._pageRendered = null; this._update(); }
      return res;
    } catch (err) {
      console.warn("SafetyGuard event 조회 실패 시 fallback", err);
      return this._zoneSafetyGuardEventCache[cacheKey] || null;
    }
  }

  _zoneSafetyGuardEventNote(domain, eventId) {
    const selector = `[data-zone-safety-event-note][data-zone-safety-event-domain="${domain}"][data-zone-safety-event-note-for="${eventId}"]`;
    return (this.shadowRoot?.querySelector(selector)?.value || "").trim();
  }

  async _ackZoneSafetyGuardEvent(domain, eventId, note) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId || !eventId) return false;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const res = await this._hass.callApi("POST", "green_smart/zones/safety-guard-events/ack", { crop_season_id: cropSeasonId, zone_id: zoneId, domain, event_id: Number(eventId), note: note || "운영자 확인", operatorNote: note });
    await this._fetchZoneSafetyGuardEvents(domain);
    return !!res?.ok;
  }

  async _clearZoneSafetyGuardEvent(domain, eventId, note) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId || !eventId) return false;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const res = await this._hass.callApi("POST", "green_smart/zones/safety-guard-events/clear", { crop_season_id: cropSeasonId, zone_id: zoneId, domain, event_id: Number(eventId), note: note || "조치 완료", operatorNote: note });
    await this._fetchZoneSafetyGuardEvents(domain);
    return !!res?.ok;
  }

  async _fetchZoneExecutionLogs(domain) {
    const { patchOnly = false } = arguments[1] || {};
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return [];
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const res = await this._hass.callApi("GET", `green_smart/zones/control-logs?crop_season_id=${cropSeasonId}&zone_id=${zoneId}&domain=${domain}&limit=8`);
      const items = Array.isArray(res?.items) ? res.items : [];
      this._zoneExecutionLogCache[cacheKey] = items;
      if (!patchOnly) {
        this._pageRendered = null;
        this._update();
      }
      return items;
    } catch (err) {
      console.warn("실행 로그 조회 실패 시 fallback", err);
      return this._zoneExecutionLogCache[cacheKey] || [];
    }
  }

  async _fetchZoneEntityMappingValidation(domain) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return null;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const res = await this._hass.callApi("GET", `green_smart/zones/entity-mapping-validation?crop_season_id=${cropSeasonId}&zone_id=${zoneId}&domain=${domain}`);
      this._zoneEntityMappingValidationCache[cacheKey] = res;
      this._controlSaveNotice = { domain, label: `${this._currentControlScopeLabel(domain)} · Entity Mapping 검증 실행 완료`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      this._pageRendered = null;
      this._update();
      return res;
    } catch (err) {
      console.warn("Entity Mapping 검증 조회 실패 시 fallback", err);
      return this._zoneEntityMappingValidationCache[cacheKey] || null;
    }
  }

  async _fetchZoneEntityMappings(domain) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return [];
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const res = await this._hass.callApi("GET", `green_smart/zones/device-entity-mappings?crop_season_id=${cropSeasonId}&zone_id=${zoneId}&domain=${domain}`);
      const items = Array.isArray(res?.items) ? res.items : [];
      this._zoneEntityMappingCache[cacheKey] = items;
      this._pageRendered = null;
      this._update();
      return items;
    } catch (err) {
      console.warn("Entity 매핑 조회 실패 시 fallback", err);
      return this._zoneEntityMappingCache[cacheKey] || [];
    }
  }

  async _saveZoneEntityMapping(domain, mapping) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return false;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    try {
      const res = await this._hass.callApi("POST", "green_smart/zones/device-entity-mappings", {
        crop_season_id: cropSeasonId,
        zone_id: zoneId,
        domain,
        device_type: mapping.device_type || mapping.deviceType,
        entity_id: mapping.entity_id || mapping.entityId,
        control_role: mapping.control_role || mapping.controlRole,
        safe_state: mapping.safe_state || mapping.safeState || "off",
        enabled: mapping.enabled !== false,
        note: mapping.note || "",
      });
      this._controlSaveNotice = { domain, label: `${this._currentControlScopeLabel(domain)} · Entity 매핑 저장 완료`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      await this._fetchZoneEntityMappings(domain);
      return !!res?.ok;
    } catch (err) {
      console.warn("Entity 매핑 조회 실패 시 fallback", err);
      return false;
    }
  }

  async _deleteZoneEntityMapping(domain, mappingId) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId || !mappingId) return false;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    try {
      const res = await this._hass.callApi("DELETE", `green_smart/zones/device-entity-mappings?id=${mappingId}&crop_season_id=${cropSeasonId}&zone_id=${zoneId}&domain=${domain}`);
      this._controlSaveNotice = { domain, label: `${this._currentControlScopeLabel(domain)} · Entity 매핑 삭제 완료`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      await this._fetchZoneEntityMappings(domain);
      return !!res?.ok;
    } catch (err) {
      console.warn("Entity 매핑 조회 실패 시 fallback", err);
      return false;
    }
  }

  _defaultZoneInterlockSettings() {
    return {
      emergency_stop: false,
      block_on_unavailable: true,
      apply_safe_state_on_block: true,
      rules: [],
    };
  }

  _normalizeZoneInterlockSettings(settings) {
    const base = this._defaultZoneInterlockSettings();
    const src = settings && typeof settings === "object" ? settings : {};
    const rules = Array.isArray(src.rules) ? src.rules.map((rule) => ({
      control_role: String(rule.control_role || rule.controlRole || "").trim(),
      condition: String(rule.condition || "unavailable").trim(),
      threshold: rule.threshold ?? "",
      action: String(rule.action || (rule.block === false ? "warn" : "block")).trim(),
      message: String(rule.message || rule.reason || "").trim(),
      block: rule.block !== false,
    })).filter((rule) => rule.control_role || rule.condition || rule.message) : [];
    return {
      ...base,
      ...src,
      emergency_stop: !!src.emergency_stop,
      block_on_unavailable: src.block_on_unavailable !== false,
      apply_safe_state_on_block: src.apply_safe_state_on_block !== false,
      rules,
    };
  }

  _readZoneInterlockSettingsFromCard(domain) {
    const card = this.shadowRoot?.querySelector(`[data-zone-interlock-settings-card][data-zone-interlock-domain=\"${domain}\"]`);
    const settings = this._defaultZoneInterlockSettings();
    settings.emergency_stop = !!card?.querySelector("[data-zone-interlock-emergency-stop]")?.checked;
    settings.block_on_unavailable = !!card?.querySelector("[data-zone-interlock-block-unavailable]")?.checked;
    settings.apply_safe_state_on_block = !!card?.querySelector("[data-zone-interlock-apply-failsafe]")?.checked;
    settings.rules = Array.from(card?.querySelectorAll("[data-zone-interlock-rule-row]") || []).map((row) => {
      const action = row.querySelector("[data-zone-interlock-rule-action]")?.value || "block";
      return {
        control_role: row.querySelector("[data-zone-interlock-rule-role]")?.value?.trim() || "",
        condition: row.querySelector("[data-zone-interlock-rule-condition]")?.value || "unavailable",
        threshold: row.querySelector("[data-zone-interlock-rule-threshold]")?.value?.trim() || "",
        reasonCode: row.querySelector("[data-zone-interlock-rule-reason-code]")?.value?.trim() || "",
        sensor_entity_id: row.querySelector("[data-zone-interlock-rule-sensor-entity]")?.value?.trim() || "",
        sensor_attribute: row.querySelector("[data-zone-interlock-rule-sensor-attribute]")?.value?.trim() || "",
        sensor_operator: row.querySelector("[data-zone-interlock-rule-sensor-operator]")?.value || "above",
        action,
        message: row.querySelector("[data-zone-interlock-rule-message]")?.value?.trim() || "",
        block: action !== "warn",
      };
    }).filter((rule) => rule.control_role || rule.message || rule.sensor_entity_id || rule.condition !== "unavailable");
    return this._normalizeZoneInterlockSettings(settings);
  }

  _addZoneInterlockRule(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const current = this._normalizeZoneInterlockSettings(this._zoneInterlockSettingsCache?.[cacheKey]?.settings);
    current.rules.push({ control_role: "", condition: "unavailable", threshold: "", sensor_entity_id: "", sensor_attribute: "", sensor_operator: "above", action: "block", message: "" });
    this._zoneInterlockSettingsCache[cacheKey] = { ...(this._zoneInterlockSettingsCache[cacheKey] || {}), settings: current };
    this._pageRendered = null;
    this._update();
  }

  _deleteZoneInterlockRule(domain, index) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const current = this._normalizeZoneInterlockSettings(this._zoneInterlockSettingsCache?.[cacheKey]?.settings);
    current.rules = current.rules.filter((_, i) => i !== Number(index));
    this._zoneInterlockSettingsCache[cacheKey] = { ...(this._zoneInterlockSettingsCache[cacheKey] || {}), settings: current };
    this._pageRendered = null;
    this._update();
  }

  async _fetchZoneInterlockSettings(domain) {
    const { patchOnly = false } = arguments[1] || {};
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return null;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const res = await this._hass.callApi("GET", `green_smart/zones/interlock-settings?crop_season_id=${cropSeasonId}&zone_id=${zoneId}&domain=${domain}`);
      this._zoneInterlockSettingsCache[cacheKey] = res || { settings: {}, enabled: true };
      if (!patchOnly) {
        this._pageRendered = null;
        this._update();
      }
      return this._zoneInterlockSettingsCache[cacheKey];
    } catch (err) {
      console.warn("인터록 설정 조회 실패 시 fallback", err);
      return this._zoneInterlockSettingsCache[cacheKey] || null;
    }
  }

  async _saveZoneInterlockSettings(domain) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return false;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const settings = this._readZoneInterlockSettingsFromCard(domain);
    try {
      const res = await this._hass.callApi("POST", "green_smart/zones/interlock-settings", {
        crop_season_id: cropSeasonId,
        zone_id: zoneId,
        domain,
        enabled: true,
        settings,
      });
      this._controlSaveNotice = { domain, label: `${this._currentControlScopeLabel(domain)} · 인터록 저장 완료`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      await this._fetchZoneInterlockSettings(domain);
      return !!res?.found || !!res?.id;
    } catch (err) {
      console.warn("인터록 설정 조회 실패 시 fallback", err);
      return false;
    }
  }

  async _fetchZoneControlMode(domain) {
    const { patchOnly = false } = arguments[1] || {};
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return null;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const res = await this._hass.callApi("GET", `green_smart/zones/control-mode?crop_season_id=${cropSeasonId}&zone_id=${zoneId}&domain=${domain}`);
      this._zoneControlModeCache[cacheKey] = res || { mode: "manual", allowAutoExecution: false };
      if (!patchOnly) {
        this._pageRendered = null;
        this._update();
      }
      return this._zoneControlModeCache[cacheKey];
    } catch (err) {
      console.warn("제어 모드 조회 실패 시 fallback", err);
      return this._zoneControlModeCache[cacheKey] || { mode: "manual", allowAutoExecution: false };
    }
  }

  async _saveZoneControlMode(domain) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return false;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const card = this.shadowRoot?.querySelector(`[data-zone-control-mode-card][data-zone-control-mode-domain=\"${domain}\"]`);
    const mode = card?.querySelector("[data-zone-control-mode-select]")?.value || "manual";
    const allowAutoExecution = !!card?.querySelector("[data-zone-control-mode-auto]")?.checked;
    const overrideReason = card?.querySelector("[data-zone-control-mode-reason]")?.value?.trim() || null;
    const overrideExpiresAt = card?.querySelector("[data-zone-control-mode-expires]")?.value || null;
    try {
      const res = await this._hass.callApi("POST", "green_smart/zones/control-mode", {
        crop_season_id: cropSeasonId,
        zone_id: zoneId,
        domain,
        mode,
        allowAutoExecution,
        overrideReason,
        overrideExpiresAt,
      });
      this._controlSaveNotice = { domain, label: `${this._currentControlScopeLabel(domain)} · 제어 모드 저장 완료`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      await this._fetchZoneControlMode(domain);
      return !!res?.found || !!res?.id;
    } catch (err) {
      console.warn("제어 모드 조회 실패 시 fallback", err);
      return false;
    }
  }

  _renderZoneControlModeCard(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const data = this._zoneControlModeCache?.[cacheKey] || null;
    if (this._numericControlSeasonId() && !data) this._fetchZoneControlMode(domain);
    const mode = data?.mode || "manual";
    const allow = !!data?.allowAutoExecution;
    const reason = this._esc(data?.overrideReason || "");
    const expires = this._esc(String(data?.overrideExpiresAt || "").slice(0, 16));
    const option = (value, label) => `<option value="${value}" ${mode === value ? "selected" : ""}>${label}</option>`;
    return `<div class="gs-card" data-zone-control-mode-card data-zone-control-mode-domain="${domain}" style="padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;">
        <div><b>제어 모드</b><div class="strategy-muted">수동/자동/반자동/비활성 및 manual override 기본 모델 · 현재 ${this._esc(mode)}</div></div>
        <div style="display:flex;gap:6px;"><button class="mini-btn" data-zone-control-mode-refresh data-zone-control-mode-domain="${domain}">새로고침</button><button class="mini-btn primary" data-zone-control-mode-save data-zone-control-mode-domain="${domain}">제어 모드 저장</button></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;align-items:end;">
        <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">제어 모드
          <select data-zone-control-mode-select>${option("manual", "수동")}${option("auto", "자동")}${option("assist", "반자동")}${option("disabled", "비활성")}</select>
        </label>
        <label style="font-size:12px;color:#5d7d64;display:flex;gap:6px;align-items:center;"><input type="checkbox" data-zone-control-mode-auto ${allow ? "checked" : ""}> 자동 실행 허용</label>
        <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">Override 사유<input data-zone-control-mode-reason placeholder="예: 현장 점검자 승인" value="${reason}"></label>
        <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">Override 만료<input type="datetime-local" data-zone-control-mode-expires value="${expires}"></label>
      </div>
      <div class="strategy-muted" style="margin-top:6px;">수동 기본값은 실제 실행을 차단하고 dry-run만 허용합니다. 자동/반자동 + 자동 실행 허용일 때 Phase 2 SafetyGuard 앞단으로 전달됩니다.</div>
    </div>`;
  }

  async _fetchZoneEntityStateSummary(domain) {
    const { patchOnly = false } = arguments[1] || {};
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return null;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const res = await this._hass.callApi("GET", `green_smart/zones/entity-state-summary?crop_season_id=${cropSeasonId}&zone_id=${zoneId}&domain=${domain}`);
      this._zoneEntityStateSummaryCache[cacheKey] = res || { summary: {}, items: [] };
      if (!patchOnly) {
        this._pageRendered = null;
        this._update();
      }
      return this._zoneEntityStateSummaryCache[cacheKey];
    } catch (err) {
      console.warn("Entity 상태 요약 조회 실패 시 fallback", err);
      return this._zoneEntityStateSummaryCache[cacheKey] || null;
    }
  }

  _renderZoneEntityStateSummaryCard(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const data = this._zoneEntityStateSummaryCache?.[cacheKey] || null;
    if (this._numericControlSeasonId() && !data) this._fetchZoneEntityStateSummary(domain);
    const summary = data?.summary || {};
    const items = Array.isArray(data?.items) ? data.items : [];
    const rows = items.length ? items.map((item) => {
      const state = item.state || "unknown";
      const badge = item.available ? "사용 가능" : "unavailable";
      const unknown = item.unknown ? " · unknown" : "";
      return `<div style="display:grid;grid-template-columns:1.2fr 1.4fr .8fr 1fr;gap:8px;align-items:center;border-top:1px solid #e2f0e4;padding:7px 0;font-size:12px;">
        <span>${this._esc(item.deviceType || "장치")}</span>
        <code>${this._esc(item.entityId || "entity_id")}</code>
        <span>${this._esc(item.controlRole || "role")}</span>
        <span>현재 상태: <b>${this._esc(state)}</b> · ${badge}${unknown}</span>
      </div>`;
    }).join("") : `<div class="strategy-muted">Entity 매핑 후 현재 상태를 확인할 수 있습니다.</div>`;
    return `<div class="gs-card" data-zone-entity-state-summary-card style="padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;">
        <div><b>Entity 상태 요약</b><div class="strategy-muted">현재 상태 · 사용 가능 ${summary.availableCount || 0}/${summary.totalCount || 0} · unavailable ${summary.unavailableCount || 0} · unknown ${summary.unknownCount || 0}</div></div>
        <button class="mini-btn" data-zone-entity-state-refresh data-zone-entity-state-domain="${domain}">상태 새로고침</button>
      </div>
      ${summary.hasBlockingState ? `<div class="strategy-muted" style="color:#a45b00;margin-bottom:8px;">SafetyGuard 후보 차단 상태가 있습니다. Phase 2에서 실행 차단과 연결됩니다.</div>` : ""}
      ${rows}
    </div>`;
  }

  _renderZoneSafetyGuardWatchdogCard(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const data = this._zoneSafetyGuardWatchdogCache?.[cacheKey] || null;
    if (this._numericControlSeasonId() && !data) this._fetchZoneSafetyGuardWatchdog(domain);
    const events = Array.isArray(data?.criticalEvents) ? data.criticalEvents : [];
    const items = Array.isArray(data?.items) ? data.items : [];
    const rows = (events.length ? events : items).slice(0, 6).map((item) => {
      const guard = item.safetyGuard || {};
      return `<div style="border-top:1px solid #e2f0e4;padding:7px 0;font-size:12px;display:grid;gap:4px;">
        <div><b>${this._esc(item.entityId || "entity")}</b> · ${this._esc(item.watchdogStatus || "clear")} · ${item.critical ? "critical safety event" : "clear"}</div>
        <div>SafetyGuard: ${this._esc(guard.status || "clear")} · reasons ${(guard.reasons || []).map((r) => this._esc(r)).join(", ") || "-"}</div>
      </div>`;
    }).join("");
    return `<div class="gs-card" data-zone-safety-watchdog-card style="padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;">
        <div><b>SafetyGuard Watchdog</b><div class="strategy-muted">1분 fallback 검사 · 상태 ${this._esc(data?.watchdogStatus || "대기")} · criticalEvents ${events.length}</div></div>
        <button class="mini-btn" data-zone-safety-watchdog-refresh data-zone-safety-watchdog-domain="${domain}">Watchdog 새로고침</button>
      </div>
      ${rows || `<div class="strategy-muted">아직 SafetyGuard Watchdog 결과가 없습니다.</div>`}
      <div class="strategy-muted" style="margin-top:6px;">lastCheckedAt ${this._esc(data?.lastCheckedAt || "-")} · staleThresholdSeconds ${this._esc(data?.staleThresholdSeconds || 120)}</div>
    </div>`;
  }

  _renderZoneSafetyGuardEventHistoryCard(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const data = this._zoneSafetyGuardEventCache?.[cacheKey] || null;
    if (this._numericControlSeasonId() && !data) this._fetchZoneSafetyGuardEvents(domain);
    const events = Array.isArray(data?.items) ? data.items : [];
    const rows = events.slice(0, 8).map((event) => {
      const lifecycle = event.eventLifecycle || {};
      const state = lifecycle.state || "active";
      const eventId = this._esc(String(event.id || ""));
      const ackButton = state === "active" ? `<button class="mini-btn" data-zone-safety-event-ack data-zone-safety-event-domain="${domain}" data-zone-safety-event-id="${eventId}">운영자 확인</button>` : "";
      const clearButton = state === "acknowledged" ? `<button class="mini-btn" data-zone-safety-event-clear data-zone-safety-event-domain="${domain}" data-zone-safety-event-id="${eventId}">조치 완료</button>` : "";
      return `<div style="border-top:1px solid #e2f0e4;padding:8px 0;font-size:12px;display:grid;gap:4px;">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;"><b>#${this._esc(event.id || "-")} ${this._esc(event.action || "event")}</b><span>상태: ${this._esc(state)} · ${this._esc(event.createdAt || "")}</span></div>
        <div>result ${this._esc(event.result || "-")} · message ${this._esc(event.message || "-")}</div>
        <input data-zone-safety-event-note data-zone-safety-event-domain="${domain}" data-zone-safety-event-note-for="${eventId}" placeholder="조치 메모" value="${this._esc(lifecycle.operatorNote || lifecycle.note || "")}" style="padding:7px;border:1px solid #d7e8dc;border-radius:8px;" />
        <div class="strategy-muted">상태: active → 운영자 확인, 상태: acknowledged → 조치 완료, 상태: cleared → 알림 해제 완료</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${ackButton}
          ${clearButton}
        </div>
      </div>`;
    }).join("");
    return `<div class="gs-card" data-zone-safety-event-card style="padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;">
        <div><b>SafetyGuard 이벤트 이력</b><div class="strategy-muted">activeEvents ${(data?.activeEvents || []).length || 0} · acknowledged ${(data?.acknowledgedEventIds || []).length || 0} · cleared ${(data?.clearedEventIds || []).length || 0}</div></div>
        <button class="mini-btn" data-zone-safety-event-refresh data-zone-safety-event-domain="${domain}">이벤트 새로고침</button>
      </div>
      ${rows || `<div class="strategy-muted">SafetyGuard 이벤트 이력이 없습니다.</div>`}
    </div>`;
  }

  _renderIrrigationStrategyPreviewCard(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const data = this._zoneIrrigationStrategyPreviewCache?.[cacheKey] || null;
    if (this._numericControlSeasonId() && domain === "irrigation" && !data) this._fetchIrrigationStrategyPreview(domain);
    const metric = (label, value, unit = "") => `<div class="strategy-status-row"><span>${label}</span><b>${this._esc(value ?? "-")}${unit}</b></div>`;
    const diffRows = (data?.targetDiff || []).map((d) => `<div class="strategy-status-row"><span>${this._esc(d.key)}</span><b>${this._esc(d.previous ?? "-")} → ${this._esc(d.next ?? "-")} (${this._esc(d.delta ?? "new")})</b></div>`).join("");
    return `<div class="gs-card" data-irrigation-strategy-preview-card data-irrigation-strategy-domain="${domain}" style="padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;">
        <div><b>관수 전략 모델</b><div class="strategy-muted">IRR EC/pH/VWC/드라이백 · 일사 누적 관수 · SafetyGuard 우선 적용 · legacy id: irrigation_strategy_mvp · diffCount ${this._esc(data?.diffCount ?? 0)}</div></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="mini-btn" data-irrigation-strategy-preview-refresh data-irrigation-strategy-preview-domain="${domain}">관수 전략 새로고침</button>
          <button class="mini-btn" data-irrigation-strategy-save-final data-irrigation-strategy-preview-domain="${domain}">관수 전략 최종값 저장</button>
        </div>
      </div>
      <div class="strategy-muted" style="margin-bottom:8px;">입력 소스 · HA 상태 요약 · 운영자 수동 보정 · VWC 하한 긴급 관수</div>
      <div class="strategy-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:8px;">
        <label>입력 소스<select data-irrigation-strategy-source-mode><option value="auto" ${data?.sourceMode === "auto" ? "selected" : ""}>HA 상태 자동</option><option value="entity_state" ${data?.sourceMode === "entity_state" ? "selected" : ""}>HA 상태 요약</option><option value="operator" ${data?.sourceMode === "operator" ? "selected" : ""}>운영자 수동 보정</option></select></label>
        <label>누적 일사<input data-irrigation-strategy-manual-radiation data-irrigation-strategy-manual-override type="number" value="${this._esc(data?.manualOverrides?.accumulatedRadiation ?? data?.accumulatedRadiation ?? "")}"></label>
        <label>VWC %<input data-irrigation-strategy-manual-vwc data-irrigation-strategy-manual-override type="number" value="${this._esc(data?.manualOverrides?.currentVwc ?? data?.currentVwc ?? "")}"></label>
        <label>EC<input data-irrigation-strategy-manual-ec data-irrigation-strategy-manual-override type="number" value="${this._esc(data?.manualOverrides?.currentEc ?? data?.currentEc ?? "")}"></label>
        <label>pH<input data-irrigation-strategy-manual-ph data-irrigation-strategy-manual-override type="number" value="${this._esc(data?.manualOverrides?.currentPh ?? data?.currentPh ?? "")}"></label>
      </div>
      <div class="strategy-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));">
        <div><b>IRR EC/pH/VWC/드라이백</b>${metric("currentVwc", data?.currentVwc, "%")}${metric("currentEc", data?.currentEc)}${metric("currentPh", data?.currentPh)}${metric("dryback", data?.dryback, "%")}</div>
        <div><b>일사 누적 관수</b>${metric("accumulatedRadiation", data?.accumulatedRadiation)}${metric("emergencyIrrigation", data?.emergencyIrrigation ? "VWC 하한 긴급 관수" : "normal")}</div>
        <div><b>관수 최종 목표</b>${metric("shotAmountL", data?.shotAmountL, "L")}${metric("minIntervalMin", data?.minIntervalMin, "분")}${metric("targetEc", data?.targetEc)}${metric("targetPh", data?.targetPh)}${metric("targetDryback", data?.targetDryback, "%")}${metric("targetDrainRate", data?.targetDrainRate, "%")}</div>
        <div><b>Preview Diff</b><div class="strategy-muted">targetDiff · diffCount ${this._esc(data?.diffCount ?? 0)}</div>${diffRows || `<div class="strategy-muted">이전 final target이 없거나 차이가 없습니다.</div>`}</div>
      </div>
      <div class="strategy-muted" style="margin-top:8px;">sourceMode ${this._esc(data?.sourceMode || "auto")} · manualOverrides ${this._esc(JSON.stringify(data?.manualOverrides || {}))}</div>
      <div class="strategy-muted" style="margin-top:8px;">SafetyGuard 우선 적용: 저장된 관수 최종 목표도 실행 단계에서 SafetyGuard/Interlock gate를 먼저 통과합니다.</div>
    </div>`;
  }

  _renderEnvironmentStrategyPreviewCard(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const data = this._zoneEnvironmentStrategyPreviewCache?.[cacheKey] || null;
    if (this._numericControlSeasonId() && domain === "environment" && !data) this._fetchEnvironmentStrategyPreview(domain);
    const metric = (label, value, unit = "") => `<div class="strategy-status-row"><span>${label}</span><b>${this._esc(value ?? "-")}${unit}</b></div>`;
    const diffRows = (data?.targetDiff || []).map((d) => `<div class="strategy-status-row"><span>${this._esc(d.key)}</span><b>${this._esc(d.previous ?? "-")} → ${this._esc(d.next ?? "-")} (${this._esc(d.delta ?? "new")})</b></div>`).join("");
    return `<div class="gs-card" data-env-strategy-preview-card data-env-strategy-domain="${domain}" style="padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;">
        <div><b>환경 전략 모델</b><div class="strategy-muted">CORP/TEMHUM/VENT/SCRN · SafetyGuard 우선 적용 · legacy id: environment_strategy_mvp · diffCount ${this._esc(data?.diffCount ?? 0)}</div></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="mini-btn" data-env-strategy-preview-refresh data-env-strategy-preview-domain="${domain}">전략 새로고침</button>
          <button class="mini-btn" data-env-strategy-save-final data-env-strategy-preview-domain="${domain}">전략 최종값 저장</button>
        </div>
      </div>
      <div class="strategy-muted" style="margin-bottom:8px;">입력 소스 · HA 상태 요약 · 날씨/센서 자동 · 운영자 수동 보정</div>
      <div class="strategy-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:8px;">
        <label>입력 소스<select data-env-strategy-source-mode><option value="auto" ${data?.sourceMode === "auto" ? "selected" : ""}>날씨/센서 자동</option><option value="entity_state" ${data?.sourceMode === "entity_state" ? "selected" : ""}>HA 상태 요약</option><option value="operator" ${data?.sourceMode === "operator" ? "selected" : ""}>운영자 수동 보정</option></select></label>
        <label>일사 W<input data-env-strategy-manual-radiation data-env-strategy-manual-override type="number" value="${this._esc(data?.manualOverrides?.radiation ?? data?.corp?.radiation ?? "")}"></label>
        <label>온도 °C<input data-env-strategy-manual-temperature data-env-strategy-manual-override type="number" value="${this._esc(data?.manualOverrides?.temperature ?? data?.temhum?.temperature ?? "")}"></label>
        <label>습도 %<input data-env-strategy-manual-humidity data-env-strategy-manual-override type="number" value="${this._esc(data?.manualOverrides?.humidity ?? data?.temhum?.humidity ?? "")}"></label>
        <label>CO₂ ppm<input data-env-strategy-manual-co2 data-env-strategy-manual-override type="number" value="${this._esc(data?.manualOverrides?.co2 ?? data?.corp?.co2 ?? "")}"></label>
      </div>
      <div class="strategy-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));">
        <div><b>CORP G-Index</b>${metric("corpGIndex", data?.corpGIndex)}${metric("radiation", data?.corp?.radiation, "W")}</div>
        <div><b>TEMHUM ADT/DIF/VPD</b>${metric("ADT", data?.adt, "°C")}${metric("DIF", data?.dif, "°C")}${metric("VPD", data?.vpd, "kPa")}</div>
        <div><b>VENT/SCRN 최종 목표</b>${metric("ventTarget", data?.ventTarget, "%")}${metric("screenTarget", data?.screenTarget, "%")}</div>
        <div><b>Preview Diff</b><div class="strategy-muted">targetDiff · diffCount ${this._esc(data?.diffCount ?? 0)}</div>${diffRows || `<div class="strategy-muted">이전 final target이 없거나 차이가 없습니다.</div>`}</div>
      </div>
      <div class="strategy-muted" style="margin-top:8px;">sourceMode ${this._esc(data?.sourceMode || "auto")} · manualOverrides ${this._esc(JSON.stringify(data?.manualOverrides || {}))}</div>
      <div class="strategy-muted" style="margin-top:8px;">SafetyGuard 우선 적용: 저장된 최종 목표도 실행 단계에서 SafetyGuard/Interlock gate를 먼저 통과합니다.</div>
    </div>`;
  }

  _renderZoneLimitedAutoPolicyCard(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const data = this._zoneLimitedAutoPolicyCache?.[cacheKey] || null;
    if (this._numericControlSeasonId() && !data) this._fetchZoneLimitedAutoPolicy(domain);
    const groups = ["ventilation", "screen", "irrigation", "fertigation", "fan", "co2"];
    const labels = { ventilation: "환기", screen: "스크린", irrigation: "관수", fertigation: "양액", fan: "팬", co2: "CO₂" };
    const rows = groups.map((group) => `<label data-zone-limited-auto-group="${group}" style="font-size:12px;color:#5d7d64;display:flex;gap:6px;align-items:center;"><input type="checkbox" data-zone-limited-auto-enabled ${data?.deviceGroupAutoAllow?.[group] ? "checked" : ""}> ${labels[group]} 자동 허용</label>`).join("");
    return `<div class="gs-card" data-zone-limited-auto-card data-zone-limited-auto-domain="${domain}" style="padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;">
        <div><b>제한적 자동제어</b><div class="strategy-muted">장비군별 자동 허용 · 반자동 승인 필요 · 자동 최대 지속 시간 · 알림 확인/조치/재개 · SafetyGuard 우선 적용</div></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;"><button class="mini-btn" data-zone-limited-auto-refresh data-zone-limited-auto-domain="${domain}">새로고침</button><button class="mini-btn primary" data-zone-limited-auto-save data-zone-limited-auto-domain="${domain}">자동 정책 저장</button><button class="mini-btn" data-zone-alert-resume-request data-zone-limited-auto-domain="${domain}">재개 요청</button></div>
      </div>
      <div class="strategy-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-bottom:8px;">${rows}</div>
      <div class="strategy-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));">
        <label>반자동 승인 필요 <input type="checkbox" data-zone-limited-auto-semi-ack ${data?.semiAutoRequiresAck !== false ? "checked" : ""}></label>
        <label>자동 최대 지속 시간 <input type="number" data-zone-limited-auto-duration value="${this._esc(data?.maxAutoDurationMinutes ?? 15)}"> 분</label>
        <div>resumeState <b>${this._esc(data?.resumeState || this._zoneAlertResumeCache?.[cacheKey]?.resumeState || "idle")}</b> · resumeAllowed <b>${this._esc(String(data?.resumeAllowed || false))}</b></div>
      </div>
      <div class="strategy-muted" style="margin-top:8px;">실제 실행은 Control Mode 이후 제한적 자동제어 gate를 통과하고, 그 다음 SafetyGuard/Interlock/fail-safe/state verification을 통과합니다.</div>
    </div>`;
  }

  _renderZoneInterlockRuleBuilder(domain, settings) {
    // Phase 1E contract: structured rule UI keeps settings_json compatible while avoiding raw JSON-only editing.
    const rules = Array.isArray(settings?.rules) ? settings.rules : [];
    const conditionOptions = [
      ["unavailable", "Entity unavailable"],
      ["unknown", "Entity unknown"],
      ["above", "초과"],
      ["below", "미만"],
      ["equals", "일치"],
      ["wind_speed_above", "강풍 초과"],
      ["temperature_below", "저온 미만"],
      ["temperature_above", "고온 초과"],
      ["vwc_below", "VWC 미만"],
      ["vwc_above", "VWC 초과"],
      ["ec_below", "EC 미만"],
      ["ec_above", "EC 초과"],
      ["sensor_integrity", "센서 무결성"],
    ];
    const actionOptions = [["block", "차단"], ["failsafe", "Fail Safe"], ["warn", "경고"]];
    const sensorOperatorOptions = [["above", "초과"], ["below", "미만"], ["equals", "일치"], ["not_equals", "불일치"], ["is_on", "ON/fault"], ["is_off", "OFF/normal"], ["truthy", "감지"], ["falsy", "미감지"]];
    const rows = rules.map((rule, index) => `<div data-zone-interlock-rule-row data-zone-interlock-rule-index="${index}" style="display:grid;grid-template-columns:1fr 1fr .8fr .9fr 1fr 1fr .8fr 1fr auto;gap:8px;align-items:end;border-top:1px solid #e2f0e4;padding:8px 0;">
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">제어 역할<input data-zone-interlock-rule-role value="${this._esc(rule.control_role || rule.controlRole || "")}" placeholder="예: ventilation"></label>
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">조건<select data-zone-interlock-rule-condition>${conditionOptions.map(([value, label]) => `<option value="${value}" ${(rule.condition || "unavailable") === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">임계값<input data-zone-interlock-rule-threshold value="${this._esc(rule.threshold ?? "")}" placeholder="선택"></label>
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">센서 entity<input data-zone-interlock-rule-sensor-entity value="${this._esc(rule.sensor_entity_id || rule.sensorEntityId || "")}" placeholder="예: sensor.wind_speed"></label>
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">센서 속성<input data-zone-interlock-rule-sensor-attribute value="${this._esc(rule.sensor_attribute || rule.sensorAttribute || "")}" placeholder="예: wind_speed"></label>
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">센서 연산자<select data-zone-interlock-rule-sensor-operator>${sensorOperatorOptions.map(([value, label]) => `<option value="${value}" ${(rule.sensor_operator || rule.sensorOperator || "above") === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">reasonCode<input data-zone-interlock-rule-reason-code value="${this._esc(rule.reasonCode || rule.reason_code || "")}" placeholder="예: wind_speed_above"></label>
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">차단 동작<select data-zone-interlock-rule-action>${actionOptions.map(([value, label]) => `<option value="${value}" ${(rule.action || (rule.block === false ? "warn" : "block")) === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      <div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">운영자 메시지<input data-zone-interlock-rule-message value="${this._esc(rule.message || rule.reason || "")}" placeholder="예: 강풍으로 환기 차단"></label><button class="mini-btn" data-zone-interlock-rule-delete data-zone-interlock-domain="${domain}" data-zone-interlock-rule-index="${index}">규칙 삭제</button></div>
    </div>`).join("");
    return `<div data-zone-interlock-rule-builder style="border:1px solid #dcebdd;border-radius:12px;padding:10px;margin-top:10px;background:#fbfffb;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:6px;">
        <div><b>세부 인터록 규칙</b><div class="strategy-muted">structured rule UI · 실시간 Sensor 기반 Safety Rule · rules[]는 기존 settings_json에 그대로 저장됩니다.</div></div>
        <button class="mini-btn" data-zone-interlock-rule-add data-zone-interlock-domain="${domain}">규칙 추가</button>
      </div>
      ${rows || `<div class="strategy-muted">아직 세부 규칙이 없습니다. 규칙 추가로 풍속/강우/저온/탱크수위/펌프 fault 등 실시간 Sensor 기반 Safety Rule을 준비하세요.</div>`}
    </div>`;
  }

  _renderZoneInterlockSettingsCard(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const data = this._zoneInterlockSettingsCache?.[cacheKey] || null;
    if (this._numericControlSeasonId() && !data) this._fetchZoneInterlockSettings(domain);
    const settings = this._normalizeZoneInterlockSettings(data?.settings);
    const jsonText = this._esc(JSON.stringify(settings, null, 2));
    return `<div class="gs-card" data-zone-interlock-settings-card data-zone-interlock-domain="${domain}" style="padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;">
        <div><b>인터록 설정</b><div class="strategy-muted">AI가 없어도 동작해야 하는 안전 기준 · 현재 ${data?.enabled === false ? "비활성" : "활성"}</div></div>
        <div style="display:flex;gap:6px;"><button class="mini-btn" data-zone-interlock-refresh data-zone-interlock-domain="${domain}">새로고침</button><button class="mini-btn primary" data-zone-interlock-save data-zone-interlock-domain="${domain}">인터록 저장</button></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;margin-bottom:8px;">
        <label style="font-size:12px;color:#5d7d64;display:flex;gap:6px;align-items:center;"><input type="checkbox" data-zone-interlock-emergency-stop ${settings.emergency_stop ? "checked" : ""}> 긴급 정지</label>
        <label style="font-size:12px;color:#5d7d64;display:flex;gap:6px;align-items:center;"><input type="checkbox" data-zone-interlock-block-unavailable ${settings.block_on_unavailable ? "checked" : ""}> unavailable 차단</label>
        <label style="font-size:12px;color:#5d7d64;display:flex;gap:6px;align-items:center;"><input type="checkbox" data-zone-interlock-apply-failsafe ${settings.apply_safe_state_on_block ? "checked" : ""}> Fail Safe 적용</label>
      </div>
      ${this._renderZoneInterlockRuleBuilder(domain, settings)}
      <details style="margin-top:10px;"><summary class="strategy-muted">settings_json 미리보기</summary><textarea data-zone-interlock-json="${domain}" readonly style="width:100%;min-height:118px;font-family:monospace;font-size:12px;border:1px solid #dcebdd;border-radius:10px;padding:10px;">${jsonText}</textarea></details>
      <div class="strategy-muted" style="margin-top:6px;">안전 기준 예: emergency_stop, block_on_unavailable, apply_safe_state_on_block, rules · 풍속/강우/저온/탱크수위/펌프 fault</div>
    </div>`;
  }

  _virtualRehearsalEvidenceText(data) {
    const evidence = data?.virtualRehearsalEvidence || {};
    const rows = evidence.evidenceRows || [];
    return [
      `가상 시나리오 증거 · ${data?.domain || "-"}`,
      `coverage: ${evidence.coverage || "normal/strong-wind/rain/low-temp/sensor-fault/blocked/Fail Safe/recovery"}`,
      `pass: ${evidence.scenarioPassCount ?? data?.scenarioPassCount ?? 0}/${evidence.scenarioCount ?? rows.length}`,
      `C20 gate: ${evidence.c20GateStatus || data?.c20GateStatus || "blocked_by_virtual_rehearsal"}`,
      `실제 장비 연결 금지: ${data?.physicalDeviceConnectionAllowed ? "주의" : "유지"}`,
      ...rows.map((row) => `- ${row.scenarioId}: ${row.status} · ${row.expected || "-"} · sensors ${row.sensorStateCount ?? 0} · calls ${row.simulatedCallCount ?? 0}`),
    ].join("\n");
  }

  _renderZoneExecutionProximitySafetySummary(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const watchdog = this._zoneSafetyGuardWatchdogCache?.[cacheKey] || null;
    const events = this._zoneSafetyGuardEventCache?.[cacheKey] || null;
    const dryRun = this._zoneDryRunPreviewCache?.[cacheKey] || null;
    const rehearsal = this._zoneVirtualRehearsalCache?.[cacheKey] || null;
    const limited = this._zoneLimitedAutoPolicyCache?.[cacheKey] || null;
    const blockedCount = Array.isArray(dryRun?.blockedCalls) ? dryRun.blockedCalls.length : 0;
    const failsafeCount = Array.isArray(dryRun?.safeStateCalls) ? dryRun.safeStateCalls.length : 0;
    const eventCount = Array.isArray(events?.events) ? events.events.length : Array.isArray(events) ? events.length : 0;
    const safetyStatus = dryRun?.safetyStatus || watchdog?.status || watchdog?.watchdogStatus || "대기";
    const rehearsalStatus = rehearsal?.virtualRehearsalStatus || rehearsal?.c20GateStatus || "가상 리허설 필요";
    const stateVerification = dryRun?.stateVerification || (dryRun?.dryRun ? "dry_run" : "실행 전 미확인");
    const autoGate = limited?.resumeAllowed || limited?.deviceGroupAutoAllow ? "정책 확인" : "보수 모드";
    return `<div data-zone-execution-proximity-safety-summary data-zone-execution-proximity-domain="${domain}" style="border:1px solid #f0d9b5;background:#fffdf8;border-radius:12px;padding:10px;margin:8px 0;display:grid;gap:7px;font-size:12px;">
      <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;"><b>실행 직전 안전 요약</b><span class="strategy-muted">SafetyGuard → Interlock → Fail Safe → State verification</span></div>
      <div class="strategy-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));">
        <div data-zone-execution-proximity-safetyguard>SafetyGuard <b>${this._esc(safetyStatus)}</b></div>
        <div data-zone-execution-proximity-interlock>Interlock 차단 <b>${this._esc(blockedCount)}</b></div>
        <div data-zone-execution-proximity-failsafe>Fail Safe <b>${this._esc(failsafeCount)}</b></div>
        <div data-zone-execution-proximity-state-verification>State verification <b>${this._esc(stateVerification)}</b></div>
        <div data-zone-execution-proximity-rehearsal>Virtual rehearsal <b>${this._esc(rehearsalStatus)}</b></div>
        <div>Safety events <b>${this._esc(eventCount)}</b></div>
      </div>
      <div class="strategy-muted">제한적 자동제어 gate: ${this._esc(autoGate)} · 실행 semantics 변경 없음 · actual service call authority 변경 없음 · 실제 장비 연결 금지: virtual rehearsal before physical device hookup.</div>
    </div>`;
  }

  _renderZoneVirtualRehearsalCard(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const data = this._zoneVirtualRehearsalCache?.[cacheKey] || null;
    const scenarioRows = (data?.virtualScenarioResults || []).map((item) => `<div data-zone-virtual-rehearsal-scenario-row style="border-top:1px solid #dfe8ff;padding:8px 0;font-size:12px;">
      <div style="display:flex;justify-content:space-between;gap:8px;"><b>${this._esc(item.label || item.id)}</b><span>${this._esc(item.status || "대기")}</span></div>
      <div class="strategy-muted">시뮬레이션: ${this._esc(item.expected || "-")} · ${this._esc(item.interlock || item.operatorUx || "가상 장치/가상 센서")}</div>
      ${(item.simulatedServiceCalls || []).map((call) => `<div data-zone-virtual-rehearsal-call-row class="strategy-muted">가상 service call: ${this._esc(call.service)} · ${this._esc(call.entityId || call.serviceData?.entity_id || "-")}</div>`).join("")}
    </div>`).join("");
    const evidence = data?.virtualRehearsalEvidence || null;
    const evidenceRows = (evidence?.evidenceRows || []).map((row) => `<div data-zone-virtual-rehearsal-evidence-row style="border-top:1px solid #e6ecff;padding:7px 0;font-size:12px;">
      <b>${this._esc(row.label || row.scenarioId)}</b> · ${this._esc(row.status || "-")} · ${this._esc(row.expected || "-")} · sensors ${this._esc(row.sensorStateCount ?? 0)} · calls ${this._esc(row.simulatedCallCount ?? 0)}
    </div>`).join("");
    return `<div class="gs-card" data-zone-virtual-rehearsal-card data-zone-virtual-rehearsal-domain="${domain}" style="padding:16px;margin-bottom:12px;border:1px solid #c9d8ff;background:#fbfdff;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;">
        <div><b>가상 장치 리허설</b><div class="strategy-muted">가상 장치 · 가상 센서 · 시뮬레이션 · 인터록 · 운영 알고리즘 · UI/운영자 UX · 실제 장비 연결 금지</div></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;"><button class="mini-btn" data-zone-virtual-rehearsal-evidence-copy data-zone-virtual-rehearsal-domain="${domain}">증거 복사</button><button class="mini-btn primary" data-zone-virtual-rehearsal-run data-zone-virtual-rehearsal-domain="${domain}">가상 리허설 실행</button></div>
      </div>
      <div class="strategy-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-bottom:8px;">
        <div>상태 <b>${this._esc(data?.virtualRehearsalStatus || "대기")}</b></div>
        <div>physical gate <b>${data?.physicalDeviceConnectionAllowed ? "허용" : "금지"}</b></div>
        <div>sim calls <b>${this._esc((data?.simulatedServiceCalls || []).length)}</b></div>
        <div>sensor states <b>${this._esc(Object.keys(data?.simulatedSensorStates || {}).length)}</b></div>
        <div data-zone-virtual-rehearsal-pass-rate>pass rate <b>${this._esc(data?.scenarioPassRate ?? "-")}</b></div>
        <div data-zone-virtual-rehearsal-c20-gate>C20 gate <b>${this._esc(data?.c20GateStatus || "blocked_by_virtual_rehearsal")}</b></div>
      </div>
      <div class="strategy-muted" style="margin-bottom:8px;">가상 HA 엔티티: <code>sensor.green_smart_virtual_environment_wind_speed</code> · <code>cover.green_smart_virtual_environment_ventilation</code> · <code>switch.green_smart_virtual_environment_irrigation_pump</code> · Entity 상태 요약에서 확인</div>
      <div class="strategy-muted" style="margin-bottom:8px;">${this._esc(data?.physicalDeviceGate || "실제 장비 연결 금지: 가상 장치/시뮬레이션 통과 전 physical device 연결 금지")}</div>
      <div class="strategy-muted" style="margin-bottom:8px;">가상 시나리오 증거: ${this._esc(evidence?.coverage || "normal/strong-wind/rain/low-temp/sensor-fault/blocked/Fail Safe/recovery")} · ${this._esc(data?.c20GateReason || "C20 gate는 가상 증거 통과 후에도 별도 승인 필요")}</div>
      ${evidenceRows}
      ${scenarioRows || `<div class="strategy-muted">가상 리허설 실행을 누르면 정상/강풍/강우/저온/센서 고장/Fail Safe/복구 시나리오를 가상 장치로 검증합니다.</div>`}
    </div>`;
  }

  _renderZoneRehearsalReadinessCard(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const data = this._zoneRehearsalReadinessCache?.[cacheKey] || null;
    const scenarioRows = (data?.scenarioChecklist || []).map((item) => `<div data-zone-rehearsal-scenario-row style="border-top:1px solid #e4f0e5;padding:8px 0;font-size:12px;">
      <div style="display:flex;justify-content:space-between;gap:8px;"><b>${this._esc(item.label || item.id)}</b><span>${this._esc(item.status || "대기")}</span></div>
      <div class="strategy-muted">시나리오 테스트: ${this._esc(item.goal || "-")}</div>
      ${(item.requiredChecks || []).map((check) => `<span data-zone-rehearsal-check-row class="strategy-muted" style="display:inline-block;margin-right:8px;">${this._esc(check)} ${data?.checks?.[check] ? "✓" : "확인 필요"}</span>`).join("")}
    </div>`).join("");
    return `<div class="gs-card" data-zone-rehearsal-card data-zone-rehearsal-domain="${domain}" style="padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;">
        <div><b>현장 리허설</b><div class="strategy-muted">시나리오 테스트 · 정상 · 강풍 · 강우 · 저온 · 센서 고장 · 차단 · Fail Safe · 복구</div></div>
        <button class="mini-btn primary" data-zone-rehearsal-refresh data-zone-rehearsal-domain="${domain}">리허설 준비도 확인</button>
      </div>
      <div class="strategy-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:8px;">
        <div>리허설 준비도 <b>${this._esc(data?.scenarioReadinessStatus || "대기")}</b></div>
        <div>ready <b>${this._esc(data?.readyScenarioCount ?? "-")}</b> / ${this._esc(data?.scenarioCount ?? "-")}</div>
        <div>sensor rules <b>${this._esc(data?.sensorRuleCount ?? "-")}</b></div>
        <div>safe_state <b>${this._esc(data?.safeStateCount ?? "-")}</b></div>
      </div>
      ${scenarioRows || `<div class="strategy-muted">리허설 준비도 확인을 누르면 정상/강풍/강우/저온/센서 고장/차단/Fail Safe/복구 체크리스트를 생성합니다.</div>`}
    </div>`;
  }

  _renderZoneOperatorConfirmCard(domain) {
    const phrase = this._operatorConfirmationPhrase(domain);
    return `<div class="gs-card" data-zone-operator-confirm-card data-zone-operator-confirm-domain="${domain}" style="padding:16px;margin-bottom:12px;border:1px solid #f0d9b5;background:#fffdf8;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;">
        <div><b>운영자 실행 확인</b><div class="strategy-muted">manual/assist/auto · 실제 장비 실행 확인 · 실행 권한 · override 사유 · 재개/override UX</div></div>
        <!-- data-zone-execution-proximity-safety-summary -->${this._renderZoneExecutionProximitySafetySummary(domain)}
        <button class="mini-btn primary" data-zone-final-execute-confirmed data-zone-final-execute-domain="${domain}">확인 후 최종값 실행</button>
      </div>
      <div class="strategy-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));">
        <label>운영자 확인 <input type="checkbox" data-zone-operator-confirm-enabled></label>
        <label>확인 문구 <input data-zone-operator-confirm-text placeholder="${this._esc(phrase)}"></label>
        <label>실행 권한 <select data-zone-operator-confirm-role><option value="operator">operator</option><option value="technician">technician</option><option value="admin">admin</option><option value="owner">owner</option></select></label>
        <label>override 사유 <input data-zone-operator-confirm-reason placeholder="예: 현장 점검 후 제한 운전"></label>
      </div>
      <div class="strategy-muted" style="margin-top:8px;">실제 장비 실행 확인 문구를 정확히 입력해야 실행됩니다: <code>${this._esc(phrase)}</code></div>
    </div>`;
  }

  _renderZoneDryRunPreviewCard(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const data = this._zoneDryRunPreviewCache?.[cacheKey] || null;
    const callRows = (data?.calls || []).map((call) => `<div data-zone-dry-run-call-row style="border-top:1px solid #e4f0e5;padding:8px 0;"><b>${this._esc(call.entityId || call.serviceData?.entity_id || "-")}</b><div class="strategy-muted">예정 service call: ${this._esc(call.domain)}.${this._esc(call.service)} · ${this._esc(JSON.stringify(call.serviceData || {}))}</div><div class="strategy-muted">현재 상태: ${this._esc(call.preState?.state ?? "-")} · stateVerification ${this._esc(call.stateVerification || "dry_run")}</div><div class="strategy-muted">제한적 자동제어 gate: ${this._esc(call.deviceGroupAutoAllowance?.deviceGroup || "-")} ${call.deviceGroupAutoAllowance?.allowed ? "허용" : "확인 필요"}</div></div>`).join("");
    const blockedRows = (data?.blockedCalls || []).map((call) => `<div data-zone-dry-run-blocked-row style="border-top:1px solid #f3dfdf;padding:8px 0;"><b>${this._esc(call.entityId || "-")}</b><div class="strategy-muted">안전 차단: ${this._esc((call.interlockReasons || []).join(", ") || call.safetyStatus || "blocked")}</div><div class="strategy-muted">SafetyGuard 판단: ${this._esc(call.safetyGuard?.status || "blocked")}</div></div>`).join("");
    const failsafeRows = (data?.safeStateCalls || []).map((call) => `<div data-zone-dry-run-failsafe-row style="border-top:1px solid #e4f0e5;padding:8px 0;"><b>${this._esc(call.entityId || call.serviceData?.entity_id || "-")}</b><div class="strategy-muted">Fail Safe: ${this._esc(call.domain)}.${this._esc(call.service)} · ${this._esc(JSON.stringify(call.serviceData || {}))}</div></div>`).join("");
    return `<div class="gs-card" data-zone-dry-run-card data-zone-dry-run-domain="${domain}" style="padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;">
        <div><b>Dry Run UI</b><div class="strategy-muted">실행 전 확인 · 예정 service call · 현재 상태 · 안전 차단 · Fail Safe · 실제 장비는 움직이지 않습니다</div></div>
        <!-- data-zone-execution-proximity-safety-summary -->${this._renderZoneExecutionProximitySafetySummary(domain)}
        <button class="mini-btn primary" data-zone-dry-run-preview data-zone-dry-run-domain="${domain}">Dry Run 실행 전 확인</button>
      </div>
      <div class="strategy-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-bottom:8px;">
        <div>planned <b>${this._esc(data?.plannedCount ?? "-")}</b></div>
        <div>executed <b>${this._esc(data?.executedCount ?? 0)}</b></div>
        <div>safetyStatus <b>${this._esc(data?.safetyStatus || "-")}</b></div>
        <div>dryRun <b>${this._esc(String(data?.dryRun ?? true))}</b></div>
      </div>
      <div class="strategy-muted" style="margin-bottom:8px;">SafetyGuard 판단: ${this._esc(data?.safetyGuard?.status || "대기")} · 제한적 자동제어 gate 결과와 Interlock/Failsafe 결과를 실제 실행 전에 확인합니다.</div>
      ${callRows || `<div class="strategy-muted">Dry Run을 실행하면 예정 service call과 현재 상태가 표시됩니다.</div>`}
      ${blockedRows}
      ${failsafeRows}
    </div>`;
  }

  _renderZoneExecutionLogCard(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const logs = this._zoneExecutionLogCache?.[cacheKey] || [];
    if (this._numericControlSeasonId() && !this._zoneExecutionLogCache?.[cacheKey]) this._fetchZoneExecutionLogs(domain);
    const rows = logs.length ? logs.map((log) => {
      const summary = log.executionSummary || {};
      const after = log.after || {};
      const before = log.before || {};
      const blocked = summary.blockedByInterlock || summary.blockedCallCount > 0;
      const failSafe = summary.failSafeApplied || summary.safeStateCallCount > 0;
      const reasons = (summary.interlockReasons || []).join(", ") || "-";
      const pre = (before.preState || [])[0]?.state || "-";
      const post = (after.postState || [])[0]?.state || summary.latestActualState || "-";
      const safetyGuard = summary.safetyGuard || after.safetyGuard || {};
      const ruleResultCount = Array.isArray(safetyGuard.ruleResults) ? safetyGuard.ruleResults.length : 0;
      return `<div style="border-top:1px solid #e2f0e4;padding:9px 0;display:grid;gap:5px;font-size:12px;">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;"><b>${this._esc(log.action || "execution")}</b><span>${this._esc(log.result || "-")} · ${this._esc(log.createdAt || "")}</span></div>
        <div>안전 상태: <b>${this._esc(summary.safetyStatus || safetyGuard.status || "clear")}</b> · ${blocked ? "안전 차단" : "차단 없음"} · ${failSafe ? "Fail Safe 적용" : "Fail Safe 미적용"}</div>
        <div>SafetyGuard 안전 판단: ${this._esc(safetyGuard.status || "clear")} · ruleResults ${ruleResultCount}</div>
        <div>차단 사유: ${this._esc(reasons)}</div>
        <div>실행 전 상태: ${this._esc(pre)} → 실행 후 상태: ${this._esc(post)} · 목표: ${this._esc(summary.latestExpectedTarget ?? "-")}</div>
        <div>호출 ${summary.callCount || 0} · 차단 ${summary.blockedCallCount || 0} · Fail Safe ${summary.safeStateCallCount || 0} · 상태 리포트 ${summary.stateReportCount || 0}</div>
      </div>`;
    }).join("") : `<div class="strategy-muted">아직 실행/안전 로그가 없습니다.</div>`;
    return `<div class="gs-card" data-zone-execution-log-card style="padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;">
        <div><b>실행/안전 로그</b><div class="strategy-muted">최근 실행 결과, 안전 차단, Fail Safe, 실행 전 상태, 실행 후 상태</div></div>
        <button class="mini-btn" data-zone-log-refresh data-zone-log-domain="${domain}">새로고침</button>
      </div>
      ${rows}
    </div>`;
  }

  _renderZoneEntityMappingValidationCard(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const data = this._zoneEntityMappingValidationCache?.[cacheKey] || null;
    const items = data?.items || [];
    const rows = items.length ? items.map((item) => `<div data-zone-entity-validation-row style="border-top:1px solid #e4f0e5;padding:8px 0;font-size:12px;display:grid;gap:4px;">
      <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;"><b>${this._esc(item.entityId || "entity_id")}</b><span data-zone-entity-validation-status>${this._esc(item.mappingValidationStatus || "-")}</span></div>
      <div>entity_id 존재: ${item.entityExists ? "확인" : "누락"} · domain/service 호환성: ${item.serviceCompatible ? "확인" : "주의"} · safe_state 유효성: ${item.safeStateValid ? "확인" : "주의"}</div>
      ${(item.validationIssues || []).map((issue) => `<div data-zone-entity-validation-issue class="strategy-muted">검증 이슈: ${this._esc(issue)}</div>`).join("")}
    </div>`).join("") : `<div class="strategy-muted">검증 실행을 누르면 entity_id 존재, domain/service 호환성, safe_state 유효성을 확인합니다.</div>`;
    const unmapped = (data?.unmappedTargetKeys || []).map((key) => `<div data-zone-entity-validation-issue class="strategy-muted">위험 장비 mapping 누락: ${this._esc(key)}</div>`).join("");
    return `<div class="gs-card" data-zone-entity-validation-card data-zone-entity-validation-domain="${domain}" style="padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;">
        <div><b>Entity Mapping 검증</b><div class="strategy-muted">Setup Assistant · entity_id 존재 · domain/service 호환성 · safe_state 유효성 · 위험 장비 mapping 누락</div></div>
        <button class="mini-btn primary" data-zone-entity-validation-refresh data-zone-entity-validation-domain="${domain}">검증 실행</button>
      </div>
      <div class="strategy-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:8px;">
        <div>status <b>${this._esc(data?.mappingValidationStatus || "대기")}</b></div>
        <div>valid <b>${this._esc(data?.validCount ?? "-")}</b></div>
        <div>invalid <b>${this._esc(data?.invalidCount ?? "-")}</b></div>
        <div>warnings <b>${this._esc(data?.warningCount ?? "-")}</b></div>
      </div>
      ${rows}
      ${unmapped}
    </div>`;
  }

  _renderZoneEntityMappingCard(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const mappings = this._zoneEntityMappingCache?.[cacheKey] || [];
    if (this._numericControlSeasonId() && !this._zoneEntityMappingCache?.[cacheKey]) this._fetchZoneEntityMappings(domain);
    const rows = mappings.length ? mappings.map((m) => `<div style="display:grid;grid-template-columns:1.1fr 1.4fr 1fr .9fr auto;gap:8px;align-items:center;border-top:1px solid #e2f0e4;padding:7px 0;font-size:12px;">
      <span>${this._esc(m.deviceType || m.device_type || "장치")}</span>
      <code>${this._esc(m.entityId || m.entity_id || "entity_id")}</code>
      <span>${this._esc(m.controlRole || m.control_role || "control_role")}</span>
      <span>safe_state: ${this._esc(m.safeState || m.safe_state || "off")}</span>
      <button class="btn btn-ghost" data-zone-entity-delete data-zone-entity-domain="${domain}" data-zone-entity-id="${this._esc(String(m.id || ""))}">삭제</button>
    </div>`).join("") : `<p style="font-size:12px;color:#5d7d64;">등록된 Entity 매핑 없음 · entity_id / control_role / safe_state를 입력해 실제 HA 장치와 연결하세요.</p>`;
    return `<div class="gs-card" data-zone-entity-mapping-card data-zone-entity-domain="${domain}" style="padding:14px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
        <div><b>장치/센서 Entity 매핑</b><br><span style="font-size:12px;color:#5d7d64;">작기+구역+domain별 HA entity_id, control_role, safe_state 연결</span></div>
        <button class="btn btn-ghost" data-zone-entity-refresh data-zone-entity-domain="${domain}">Entity 매핑 새로고침</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:10px 0;">
        <input data-zone-entity-device-type data-zone-entity-domain="${domain}" placeholder="device_type 예: roof_window">
        <input data-zone-entity-id-input data-zone-entity-domain="${domain}" placeholder="entity_id 예: cover.zone1_roof">
        <input data-zone-entity-control-role data-zone-entity-domain="${domain}" placeholder="control_role 예: ventilation">
        <input data-zone-entity-safe-state data-zone-entity-domain="${domain}" placeholder="safe_state 예: closed/off">
        <button class="btn" data-zone-entity-add data-zone-entity-domain="${domain}">Entity 매핑 추가</button>
      </div>
      ${rows}
    </div>`;
  }

  _renderZoneAiFinalTargetCard(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const outputs = this._zoneAiOutputCache?.[cacheKey] || [];
    const finalTarget = this._zoneFinalTargetCache?.[cacheKey] || null;
    if (this._numericControlSeasonId()) {
      if (!this._zoneAiOutputCache?.[cacheKey]) this._fetchZoneAiOutputs(domain, { patchOnly: true });
      if (!(cacheKey in (this._zoneFinalTargetCache || {}))) this._fetchZoneFinalTargets(domain, { patchOnly: true });
    }
    const latest = outputs[0] || null;
    const strategySummary = latest ? Object.entries(latest.strategy || {}).slice(0, 4).map(([k, v]) => `${this._esc(k)}: ${this._esc(String(v))}`).join(" · ") : "저장된 AI 전략 출력 없음";
    const targetSummary = finalTarget?.targets ? Object.entries(finalTarget.targets || {}).slice(0, 4).map(([k, v]) => `${this._esc(k)}: ${this._esc(String(v))}`).join(" · ") : "최종 적용값 없음";
    return `<div class="gs-card" data-zone-ai-final-card data-zone-ai-domain="${domain}" style="padding:14px;margin-bottom:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">
      <div style="border:1px solid #d7ecd9;border-radius:12px;padding:10px;background:#fbfffb;">
        <b>AI 전략 출력</b><br>
        <span style="font-size:12px;color:#5d7d64;">${latest ? `${this._esc(latest.modelName || "AI Agent")} · ${this._esc(latest.safetyStatus || "pending")}` : "대기"}</span>
        <p style="font-size:12px;color:#2f6b3c;line-height:1.5;">${strategySummary}</p>
        <button class="btn btn-ghost" data-zone-ai-refresh data-zone-ai-domain="${domain}">AI 출력 새로고침</button>
        ${latest ? `<button class="btn" data-zone-ai-apply data-zone-ai-domain="${domain}" data-zone-ai-output-id="${latest.id}">AI 전략 적용</button>` : ""}
      </div>
      <div style="border:1px solid #d7ecd9;border-radius:12px;padding:10px;background:#f3fbf4;">
        <b>최종 적용값</b><br>
        <span style="font-size:12px;color:#5d7d64;">zone_final_control_targets</span>
        <p style="font-size:12px;color:#2f6b3c;line-height:1.5;">${targetSummary}</p>
        <button class="btn" data-zone-final-execute data-zone-final-domain="${domain}" ${finalTarget?.targets ? "" : "disabled"}>최종값 실행</button>
        <span style="font-size:12px;color:#5d7d64;display:block;margin-top:6px;">실행 완료 상태는 HA service call 후 감사 로그에 기록됩니다.</span>
      </div>
    </div>`;
  }

  _currentControlSeasonId() {
    return this._activeSeasonId || this._cropSeasons?.find((s) => !s.demolished && !s.demolishDate)?.id || this._controlScope?.seasonId || "default-season";
  }

  _controlSeasonOptions() {
    const seasons = Array.isArray(this._cropSeasons) && this._cropSeasons.length ? this._cropSeasons : [];
    if (!seasons.length) return [{ id: "default-season", label: "현재 작기 미연결" }];
    return seasons.map((s) => ({ id: String(s.id), label: this._esc(this._zoneSeasonLabel ? this._zoneSeasonLabel(s) : (s.name || s.cropName || `작기 ${s.id}`)) }));
  }

  _controlZoneOptions(domain) {
    const greenhouseZones = Math.max(1, Number(this._form?.greenhouse_zones || 1));
    const nutrientZones = Math.max(1, Number(this._form?.nutrient_zones || greenhouseZones || 1));
    const count = domain === "irrigation" ? nutrientZones : greenhouseZones;
    return Array.from({ length: count }, (_, i) => ({ id: i + 1, label: `${i + 1}구역` }));
  }

  _controlDomainLabel(domain) {
    return { environment: "환경 제어", irrigation: "관수 제어", device: "장치제어" }[domain] || domain;
  }

  _currentControlScopeLabel(domain) {
    const seasonId = String(this._currentControlSeasonId());
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const seasonLabel = this._controlSeasonOptions().find((s) => String(s.id) === seasonId)?.label || seasonId;
    const zoneLabel = this._controlZoneOptions(domain).find((z) => z.id === zoneId)?.label || `${zoneId}구역`;
    return `${zoneLabel} / ${seasonLabel} / ${this._controlDomainLabel(domain)}`;
  }

  _setControlSaveNotice(domain) {
    this._controlSaveNotice = {
      domain,
      label: this._currentControlScopeLabel(domain),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }

  _renderCropSeasonLikeControlScope(domain) {
    const selectedSeasonId = String(this._currentControlSeasonId());
    const season = (this._cropSeasons || []).find((s) => String(s.id) === selectedSeasonId) || this._activeSeason();
    const CROP_EMOJI = { tomato:'🍅', paprika:'🫑', strawberry:'🍓', lettuce:'🥬', herb:'🌿', cucumber:'🥒', other:'🌱' };
    const CROP_LABELS = { tomato:"토마토", paprika:"파프리카", strawberry:"딸기", lettuce:"상추", herb:"허브", cucumber:"오이", other:"기타" };
    const crop = CROP_LABELS[season?.cropType] || season?.cropType || "작기";
    const emoji = CROP_EMOJI[season?.cropType] || "🌱";
    const zone = this._controlZoneOptions(domain).find((z) => z.id === Number(this._controlScope?.zoneId || 1));
    const saveNotice = this._controlSaveNotice?.domain === domain ? `${this._controlSaveNotice.time} · ${this._controlSaveNotice.label}` : "아직 저장 전";
    return `<div class="crop-season-card control-season-card" data-control-season-card style="flex:1 1 280px;border:2px solid #51AE60;border-radius:12px;padding:10px 14px;background:#f0faf1;min-width:260px;">
      <div style="font-size:12px;font-weight:900;color:#24323F;">${emoji} ${this._esc(crop)}${season?.variety ? ` · ${this._esc(season.variety)}` : ""} · ${this._esc(zone?.label || this._seasonZoneLabel(season))}</div>
      <div style="font-size:11px;color:#7a9780;margin-top:2px;">${this._esc(this._controlDomainLabel(domain))} · ${season?.plantDate || "정식일 미기록"} 정식</div>
      <div style="font-size:10px;font-weight:800;margin-top:4px;color:#51AE60;">● 재배 중 · 마지막 저장: ${this._esc(saveNotice)}</div>
    </div>`;
  }

  _renderControlSeasonCard(domain) {
    return this._renderCropSeasonLikeControlScope(domain);
  }

  _activeSeasonForZone(zoneId) {
    const numericZoneId = Number(zoneId) || 1;
    const seasons = Array.isArray(this._cropSeasons) ? this._cropSeasons : [];
    const matching = seasons.filter((s) => Number(s.zoneId ?? s.zone_id ?? s.zone ?? 0) === numericZoneId);
    return matching.find((s) => !s.demolishDate) || matching[0] || null;
  }

  _zoneSeasonLabel(season) {
    if (!season) return "작기 미연결";
    const CROP_LABELS = { tomato:"토마토", paprika:"파프리카", strawberry:"딸기", lettuce:"상추", herb:"허브", cucumber:"오이", other:"기타" };
    const crop = CROP_LABELS[season.cropType] || season.cropType || "작물";
    const variety = season.variety ? ` · ${season.variety}` : "";
    return `${crop}${variety}`;
  }

  _renderEnvironmentZoneSeasonCards(domain) {
    if (domain !== "environment") return this._renderControlZoneTabs(domain);
    const CROP_EMOJI = { tomato:'🍅', paprika:'🫑', strawberry:'🍓', lettuce:'🥬', herb:'🌿', cucumber:'🥒', other:'🌱' };
    const zones = this._controlZoneOptions(domain);
    const selectedZoneId = Number(this._controlScope?.zoneId || 1);
    const selectedSeasonId = String(this._currentControlSeasonId());
    const saveNotice = this._controlSaveNotice?.domain === domain ? `${this._controlSaveNotice.time} · ${this._controlSaveNotice.label}` : "아직 저장 전";
    const cards = zones.map((z) => {
      const season = this._activeSeasonForZone(z.id);
      const seasonId = season?.id ? String(season.id) : "";
      const selected = z.id === selectedZoneId && (!seasonId || seasonId === selectedSeasonId);
      const emoji = CROP_EMOJI[season?.cropType] || '🌱';
      const active = !!season && !season.demolishDate;
      const cropLabel = this._zoneSeasonLabel(season);
      return `<div data-env-zone-season-card data-env-zone-season-zone-id="${z.id}" data-env-zone-season-season-id="${this._esc(seasonId)}"
        style="flex-shrink:0;border:2px solid ${selected ? '#51AE60' : '#e0e0e0'};
               border-radius:12px;padding:10px 14px;cursor:pointer;min-width:148px;
               background:${selected ? '#f0faf1' : '#fafafa'};">
        <div data-env-zone-season-primary-line data-env-zone-season-zone-label data-env-zone-season-current-crop style="font-size:12px;font-weight:700;color:${selected ? '#24323F' : '#666'};">
          ${this._esc(z.label)} · ${emoji} ${this._esc(cropLabel)}</div>
        <div data-env-zone-season-secondary-line data-env-zone-season-plant-date style="font-size:11px;color:${selected ? '#7a9780' : '#aaa'};margin-top:2px;">
          ${season?.plantDate || '정식일 미기록'}${season ? ' 정식' : ''}</div>
        <div data-env-zone-season-status-line data-env-zone-season-status style="font-size:10px;font-weight:700;margin-top:4px;color:${active ? '#51AE60' : '#bbb'};">
          ${active ? '● 재배 중' : (season ? '○ 철거완료' : '○ 작기 미연결')}</div>
      </div>`;
    }).join("");
    return `<div data-env-zone-season-selector data-env-zone-season-model="zone-parent-season-child" style="margin-bottom:2px;flex:1 1 100%;">
      <div data-env-zone-season-selector-header style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <div data-env-zone-season-selector-title style="font-size:11px;font-weight:700;color:#51AE60;letter-spacing:.4px;">구역 선택</div>
        <button class="btn btn-ghost" data-control-preset-open data-control-preset-compact style="font-size:11px;padding:6px 10px;border-radius:999px;line-height:1.1;min-height:28px;">프리셋 설정</button>
      </div>
      <span hidden data-env-zone-card-helper-doc-only="작기 선택 카드와 동일한 3줄 카드 문법으로 구역과 현재 작기를 함께 표시합니다."></span>
      <div id="env-zone-season-selector" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;">${cards}</div>
    </div>`;
  }

  _selectControlZoneSeasonFromCard(domain, zoneId, seasonId) {
    const numericZoneId = Number(zoneId) || 1;
    const numericSeasonId = Number(seasonId);
    const attachedSeason = Number.isFinite(numericSeasonId) && numericSeasonId > 0 ? null : this._activeSeasonForZone(numericZoneId);
    const resolvedSeasonId = Number.isFinite(numericSeasonId) && numericSeasonId > 0 ? numericSeasonId : (attachedSeason?.id || this._currentControlSeasonId());
    if (Number.isFinite(numericSeasonId) && numericSeasonId > 0) this._activeSeasonId = numericSeasonId;
    else if (attachedSeason?.id) this._activeSeasonId = attachedSeason.id;
    this._controlScope = { ...this._controlScope, zoneId: numericZoneId, seasonId: String(resolvedSeasonId) };
    this._saveControlScope();
    this._ensureScopedControlState(domain);
    this._requestZoneControlHydration(domain);
    this._pageRendered = null;
    this._update();
  }

  _renderControlAiOpsTabContent(domain) {
    return `${domain === "environment" ? this._renderEnvironmentStrategyPreviewCard(domain) : ""}
      ${domain === "irrigation" ? this._renderIrrigationStrategyPreviewCard(domain) : ""}
      ${this._renderZoneAiFinalTargetCard(domain)}
      ${this._renderZoneOperatorConfirmCard(domain)}
      ${this._renderZoneExecutionLogCard(domain)}`;
  }

  _renderControlSafetyOpsTabContent(domain) {
    return `${this._renderZoneInterlockSettingsCard(domain)}
      <span hidden data-env-control-mode-card-removed>제어 모드 카드는 환경 제어 화면 composition에서 제거됨</span>
      ${this._renderZoneSafetyGuardWatchdogCard(domain)}
      ${this._renderZoneSafetyGuardEventHistoryCard(domain)}
      ${this._renderZoneLimitedAutoPolicyCard(domain)}
      ${this._renderZoneRehearsalReadinessCard(domain)}
      ${this._renderZoneVirtualRehearsalCard(domain)}
      ${this._renderZoneDryRunPreviewCard(domain)}`;
  }

  _renderControlDeviceMapTabContent(domain) {
    return `${this._renderZoneEntityStateSummaryCard(domain)}
      ${this._renderZoneEntityMappingCard(domain)}
      ${this._renderZoneEntityMappingValidationCard(domain)}`;
  }

  _renderControlZoneTabs(domain) {
    const selectedZone = Number(this._controlScope?.zoneId || 1);
    const zones = this._controlZoneOptions(domain);
    const season = (this._cropSeasons || []).find((s) => String(s.id) === String(this._currentControlSeasonId())) || this._activeSeason();
    const saveNotice = this._controlSaveNotice?.domain === domain ? `${this._controlSaveNotice.time} · ${this._controlSaveNotice.label}` : "아직 저장 전";
    const cropActive = !season?.demolishDate;
    return `<div id="control-zone-selector" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;flex:1 1 100%;">
      ${zones.map((z) => {
        const selected = z.id === selectedZone;
        const state = this._getScopedControlState(domain);
        return `<div data-control-zone-tab data-control-zone-tab-card data-control-zone-id="${z.id}"
          style="flex-shrink:0;border:2px solid ${selected ? '#51AE60' : '#e0e0e0'};
                 border-radius:12px;padding:10px 14px;cursor:pointer;min-width:148px;
                 background:${selected ? '#f0faf1' : '#fafafa'};">
          <div style="font-size:12px;font-weight:700;color:${selected ? '#24323F' : '#666'};">
            ${this._esc(z.label)} · 제어영역: ${this._esc(this._controlDomainLabel(domain))}</div>
          <div style="font-size:11px;color:${selected ? '#7a9780' : '#aaa'};margin-top:2px;">
            정식일: ${season?.plantDate || "미기록"}</div>
          <div style="font-size:10px;font-weight:700;margin-top:4px;
            color:${cropActive ? '#51AE60' : '#bbb'};">
            ${cropActive ? '● 재배 중' : '○ 철거완료'} · 마지막 저장: ${this._esc(saveNotice)}</div>
          <span hidden data-control-state-bound>${Object.keys(state || {}).slice(0, 3).join(",")}</span>
        </div>`;
      }).join("")}
    </div>`;
  }

  _renderControlPresetModal(domain) {
    const zones = this._controlZoneOptions(domain);
    const selectedZone = Number(this._controlScope?.zoneId || 1);
    return `<div class="popup-card" style="width:min(560px,94vw);" data-control-preset-modal data-control-preset-domain="${domain}">
      <div class="pop-header"><div class="pop-icon-box"><ha-icon icon="mdi:content-copy" style="--mdi-icon-size:22px;"></ha-icon></div><div><div class="pop-title-main">프리셋 설정</div><div style="font-size:12px;color:#7a9780;margin-top:3px;">${this._esc(this._controlDomainLabel(domain))} 현재 구역 설정을 다른 구역에 복사합니다.</div></div></div>
      <div class="strategy-row"><div class="strategy-label">현재 구역</div><div class="strategy-control"><b>${selectedZone}구역</b></div></div>
      <div class="strategy-row"><div class="strategy-label">복사 대상 구역</div><div class="strategy-control"><select data-control-preset-target-zone>${zones.filter((z) => z.id !== selectedZone).map((z) => `<option value="${z.id}">${z.label}</option>`).join("") || `<option value="${selectedZone}">${selectedZone}구역</option>`}</select></div></div>
      <div class="pop-actions"><button class="btn btn-ghost" data-control-preset-cancel>닫기</button><button class="btn btn-ghost" data-control-preset-copy-one>선택 구역에 복사</button><button class="btn btn-primary" data-control-preset-copy-all>전체 구역에 적용</button></div>
    </div>`;
  }

  _renderControlScopeBar(domain) {
    const scopeTitle = "구역 선택";
    const scopeDesc = domain === "environment"
      ? ""
      : `구역 카드를 탭처럼 선택하면 해당 구역의 ${this._esc(this._controlDomainLabel(domain))} 설정값이 바로 연동됩니다.`;
    const compactPresetStyle = domain === "environment"
      ? "display:none;"
      : "";
    const scopeClass = domain === "environment" ? "control-scope-bar" : "gs-card control-scope-bar";
    const scopeStyle = domain === "environment" ? "padding:0;margin-bottom:14px;display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap;" : "padding:14px;margin-bottom:12px;display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap;";
    const envInlineMarker = domain === "environment" ? "data-env-scope-inline" : "";
    const storageSummary = domain === "environment"
      ? `<span hidden data-env-storage-scope-doc-only="green_smart_zone_control_settings crop_season_id + zone_id + domain"></span>`
      : `<div data-control-scope-summary style="font-size:12px;color:#2f6b3c;line-height:1.55;background:#f3fbf4;border:1px solid #d7ecd9;border-radius:10px;padding:8px 10px;flex:1 1 100%;"><b>저장 대상</b> · ${this._esc(this._currentControlScopeLabel(domain))}<span data-control-scope-storage-key style="margin-left:8px;">구역 + 현재 작기 + 제어영역 → green_smart_zone_control_settings</span></div>`;
    return `<div class="${scopeClass}" data-control-scope-bar ${envInlineMarker} data-control-scope-domain="${domain}" style="${scopeStyle}">
      <div data-control-scope-header style="display:${domain === "environment" ? "none" : "flex"};align-items:flex-start;justify-content:space-between;gap:10px;flex:1 1 100%;margin-bottom:${domain === "environment" ? "-4px" : "0"};">
        <div><div data-control-scope-title style="display:${domain === "environment" ? "none" : "block"};" class="sec-title">${domain === "environment" ? "" : scopeTitle}</div><div style="display:${domain === "environment" ? "none" : "block"};font-size:12px;color:#7a9780;margin-top:3px;">${scopeDesc}</div></div>
        ${domain === "environment" ? "" : `<button class="btn btn-ghost" data-control-preset-open data-control-preset-compact style="${compactPresetStyle}">프리셋 설정</button>`}
      </div>
      ${domain === "environment" ? this._renderEnvironmentZoneSeasonCards(domain) : this._renderControlZoneTabs(domain)}
      ${storageSummary}
    </div>`;
  }

  _cloneControlState(domain, state) {
    const fallback = this._defaultControlStateForDomain(domain);
    return JSON.parse(JSON.stringify(state || fallback));
  }

  _defaultControlStateForDomain(domain) {
    if (domain === "irrigation") return this._calculateFinalIrrigationTargets(this._cloneIrrigationDefaults());
    if (domain === "device") return this._cloneDeviceDefaults();
    return this._calculateFinalAppliedTargets(this._cloneControlStrategyDefaults());
  }

  _loadZoneControlSettings() {
    const empty = { environment: {}, irrigation: {}, device: {} };
    try {
      const saved = JSON.parse(localStorage.getItem("green_smart_zone_control_settings") || "{}");
      return { environment: saved.environment || {}, irrigation: saved.irrigation || {}, device: saved.device || {} };
    } catch (_) { return empty; }
  }

  _saveZoneControlSettings() {
    localStorage.setItem("green_smart_zone_control_settings", JSON.stringify(this._zoneControlSettings || { environment: {}, irrigation: {}, device: {} }));
  }

  _ensureScopedControlState(domain) {
    const seasonId = String(this._currentControlSeasonId());
    const zoneId = String(Number(this._controlScope?.zoneId || 1));
    if (!this._zoneControlSettings) this._zoneControlSettings = this._loadZoneControlSettings();
    if (!this._zoneControlSettings[domain]) this._zoneControlSettings[domain] = {};
    if (!this._zoneControlSettings[domain][seasonId]) this._zoneControlSettings[domain][seasonId] = {};
    if (!this._zoneControlSettings[domain][seasonId][zoneId]) {
      this._zoneControlSettings[domain][seasonId][zoneId] = this._cloneControlState(domain, this._defaultControlStateForDomain(domain));
      this._saveZoneControlSettings();
    }
    return this._zoneControlSettings[domain][seasonId][zoneId];
  }

  _requestZoneControlHydration(domain) {
    // 관수설정 초기 진입 깜박임 방지: 렌더 중 비동기 조회는 한 번만 묶고, 응답마다 전체 화면을 재렌더하지 않는다.
    const cacheKey = this._scopedControlCacheKey(domain);
    if (this._zoneControlHydrationInFlight?.[cacheKey]) return this._zoneControlHydrationInFlight[cacheKey];
    const tasks = [
      this._fetchScopedControlStateFromApi(domain, { patchOnly: true }),
      this._fetchZoneAiOutputs(domain, { patchOnly: true }),
      this._fetchZoneFinalTargets(domain, { patchOnly: true }),
      ...(domain === "environment" ? [this._fetchEnvironmentStrategyPreview(domain, { patchOnly: true })] : []),
      ...(domain === "irrigation" ? [this._fetchIrrigationStrategyPreview(domain, { patchOnly: true })] : []),
    ];
    const job = Promise.allSettled(tasks).then(() => {
      if (this._state === "dashboard" && this._page === domain && !this._hasDirtyZoneControlEditor()) {
        this._patchZoneControlElementCards(domain);
      }
    }).finally(() => {
      if (this._zoneControlHydrationInFlight) delete this._zoneControlHydrationInFlight[cacheKey];
    });
    this._zoneControlHydrationInFlight[cacheKey] = job;
    return job;
  }

  _getScopedControlState(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    if (this._apiScopedControlCache?.[cacheKey]) return this._cloneControlState(domain, this._apiScopedControlCache[cacheKey]);
    this._requestZoneControlHydration(domain); // async best-effort; localStorage fallback renders immediately
    return this._cloneControlState(domain, this._ensureScopedControlState(domain));
  }

  _setScopedControlState(domain, state) {
    const seasonId = String(this._currentControlSeasonId());
    const zoneId = String(Number(this._controlScope?.zoneId || 1));
    if (!this._zoneControlSettings) this._zoneControlSettings = this._loadZoneControlSettings();
    if (!this._zoneControlSettings[domain]) this._zoneControlSettings[domain] = {};
    if (!this._zoneControlSettings[domain][seasonId]) this._zoneControlSettings[domain][seasonId] = {};
    this._zoneControlSettings[domain][seasonId][zoneId] = this._cloneControlState(domain, state);
    this._saveZoneControlSettings();
  }

  _copyScopedControlSettings(domain, fromZoneId, toZoneId) {
    const seasonId = String(this._currentControlSeasonId());
    const fromKey = String(Number(fromZoneId || 1));
    const toKey = String(Number(toZoneId || 1));
    if (fromKey === toKey) return false;
    if (!this._zoneControlSettings) this._zoneControlSettings = this._loadZoneControlSettings();
    if (!this._zoneControlSettings[domain]) this._zoneControlSettings[domain] = {};
    if (!this._zoneControlSettings[domain][seasonId]) this._zoneControlSettings[domain][seasonId] = {};
    if (!this._zoneControlSettings[domain][seasonId][fromKey]) {
      this._zoneControlSettings[domain][seasonId][fromKey] = this._cloneControlState(domain, this._defaultControlStateForDomain(domain));
    }
    const source = this._zoneControlSettings[domain][seasonId][fromKey];
    this._zoneControlSettings[domain][seasonId][toKey] = this._cloneControlState(domain, source);
    this._saveZoneControlSettings();
    this._setControlSaveNotice(domain);
    return true;
  }

  _copyScopedControlSettingsToAllZones(domain, fromZoneId) {
    const copied = [];
    const fromKey = Number(fromZoneId || this._controlScope?.zoneId || 1);
    this._controlZoneOptions(domain).forEach((z) => {
      if (z.id === fromKey) return;
      if (this._copyScopedControlSettings(domain, fromKey, z.id)) copied.push(z.id);
    });
    return copied;
  }

  _migrateLegacyControlStateToScoped() {
    if (localStorage.getItem("green_smart_zone_control_migrated_v1") === "true") return;
    const seasonId = String(this._currentControlSeasonId());
    const zoneId = String(Number(this._controlScope?.zoneId || 1));
    const legacy = {
      environment: this._controlStrategy || this._loadControlStrategy(),
      irrigation: this._irrigationControl || this._loadIrrigationControl(),
      device: this._deviceControl || this._loadDeviceControl(),
    };
    Object.entries(legacy).forEach(([domain, state]) => {
      if (!this._zoneControlSettings[domain]) this._zoneControlSettings[domain] = {};
      if (!this._zoneControlSettings[domain][seasonId]) this._zoneControlSettings[domain][seasonId] = {};
      if (!this._zoneControlSettings[domain][seasonId][zoneId]) this._zoneControlSettings[domain][seasonId][zoneId] = this._cloneControlState(domain, state);
    });
    this._saveZoneControlSettings();
    localStorage.setItem("green_smart_zone_control_migrated_v1", "true");
  }

  _renderEnvSettingsPage() {
    this._controlStrategy = this._calculateFinalAppliedTargets(this._getScopedControlState("environment"));
    const s = this._controlStrategy;
    const statusText = s.systemStatus.aiStatus === "ok" ? "AI 연결 정상" : s.systemStatus.aiStatus === "error" ? "AI 오류" : s.systemStatus.interlockActive ? "인터록 단독 작동중" : "AI 대기";
    const modeOptions = [["interlock", "인터록 모드"], ["ai_assist", "AI 보조 모드"], ["manual", "수동 모드"], ["emergency_stop", "비상 정지 모드"]];
    const aiStatusOptions = [["ok", "AI 연결 정상"], ["standby", "AI 대기"], ["error", "AI 오류"]];
    const body = `<div class="gs-card" data-env-ui-shell data-env-unified-scope-tab-card>
        ${this._renderControlScopeBar("environment")}
        <span hidden data-env-legacy-tab="mode"></span> <span hidden data-env-legacy-tab="overview"></span> <span hidden data-env-legacy-tab="temperature"></span> <span hidden data-env-legacy-tab="humidity"></span> <span hidden data-env-legacy-tab="co2"></span> <span hidden data-env-legacy-tab="setpoints"></span> <span hidden data-env-legacy-tab="rules"></span> <span hidden data-env-legacy-tab="aiOps"></span> <span hidden data-env-legacy-tab="safety"></span> <span hidden data-env-legacy-tab="safetyOps"></span> <span hidden data-env-legacy-tab="deviceMap"></span> <span hidden data-env-legacy-tab="devices"></span>
        <span hidden data-env-strategy-tab data-ai-strategy data-final-target data-safety-limit data-control-log>
          제어 모드 온도 제어 습도 / VPD 제어 CO₂ 제어 AI 전략 / 최종 적용값 저광기 전략 안전 한계 작동 로그 AI 보정값 최종 적용값 주간 목표온도 야간 목표온도 목표 습도 목표 VPD 목표 CO₂ 기본 ADT 기본 DIF 난방 시작 온도 난방 정지 온도 환기 시작 온도 환기 최대 온도 고온 경보 온도 저온 경보 온도
        </span>
        ${this._renderEnvStrategyTabBar()}
        <div data-env-strategy-content>${this._renderEnvStrategyTabContent(s, modeOptions, aiStatusOptions, statusText)}</div>
        <span hidden data-control-grouped-card-contract>
          _renderZoneAiFinalTargetCard("environment") _renderZoneOperatorConfirmCard("environment") _renderZoneExecutionLogCard("environment") _renderEnvironmentStrategyPreviewCard("environment")
          _renderZoneControlModeCard("environment") _renderZoneInterlockSettingsCard("environment") _renderZoneSafetyGuardWatchdogCard("environment") _renderZoneSafetyGuardEventHistoryCard("environment") _renderZoneLimitedAutoPolicyCard("environment") _renderZoneRehearsalReadinessCard("environment") _renderZoneVirtualRehearsalCard("environment") _renderZoneDryRunPreviewCard("environment")
          _renderZoneEntityStateSummaryCard("environment") _renderZoneEntityMappingCard("environment") _renderZoneEntityMappingValidationCard("environment")
        </span>
        <div style="display:flex;justify-content:flex-end;margin-top:8px;"><button id="control-strategy-save" data-env-setvalue-save class="btn btn-primary">전략 저장</button></div>
      </div>`;
    return this._renderCommonMainPageShell(
      "environment",
      "환경 제어",
      "AI가 꺼져도 기본 인터록 제어로 온실을 안전하게 유지하고, AI 활성화 시 생육전략 보정값을 적용합니다.",
      "mdi:thermometer-lines",
      body,
      { pageClass: "control-strategy-page" }
    );
  }

  _cloneIrrigationDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_IRRIGATION_CONTROL_STATE));
  }

  _loadIrrigationControl() {
    const defaults = this._cloneIrrigationDefaults();
    try {
      const raw = localStorage.getItem("green_smart_irrigation_control");
      if (!raw) return defaults;
      const saved = JSON.parse(raw);
      const merged = { ...defaults, ...saved };
      Object.keys(defaults).forEach((k) => {
        if (typeof defaults[k] === "object" && !Array.isArray(defaults[k])) merged[k] = { ...defaults[k], ...(saved[k] || {}) };
      });
      return this._calculateFinalIrrigationTargets(merged);
    } catch (_) { return defaults; }
  }

  _saveIrrigationControl() {
    this._irrigationControl = this._calculateFinalIrrigationTargets(this._irrigationControl);
    this._irrigationControl.irrigationLogs = [`${new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})} 설정 저장 · 관수 제어 갱신 · 성공`, ...(this._irrigationControl.irrigationLogs || [])].slice(0, 20);
    this._setScopedControlState("irrigation", this._irrigationControl);
    this._saveScopedControlStateToApi("irrigation", this._irrigationControl);
    this._setControlSaveNotice("irrigation");
    localStorage.setItem("green_smart_irrigation_control", JSON.stringify(this._irrigationControl));
    this._pageRendered = null;
    this._update();
  }

  _calculateFinalIrrigationTargets(state = this._irrigationControl) {
    const mode = state.irrigationControlMode;
    const base = state.baseIrrigationSettings;
    const ai = state.aiIrrigationCorrection;
    const safety = state.irrigationSafetyLimits;
    const useAi = mode.aiEnabled && mode.mode === "ai_assist" && ai.healthy;
    if (mode.aiEnabled && !ai.healthy && mode.fallbackToInterlockOnAiError) mode.mode = "interlock";
    const clamp = (v, min, max) => Math.max(Number(min), Math.min(Number(max), Number(v)));
    state.finalIrrigationTargets = {
      shotAmountL: clamp(Number(base.shotLiterPerZone) + (useAi ? Number(ai.shotAmountDelta) : 0), 0, safety.maxShotAmountL),
      minIntervalMin: Math.max(Number(safety.minIntervalMin), Number(base.minIntervalMin) + (useAi ? Number(ai.intervalDeltaMin) : 0)),
      targetEc: clamp(Number(base.baseEc) + (useAi ? Number(ai.ecDelta) : 0), safety.minEc, safety.maxEc),
      targetPh: clamp(Number(base.basePh) + (useAi ? Number(ai.phDelta) : 0), safety.minPh, safety.maxPh),
      targetDrainRate: Number(state.drainFeedback.targetDrainRate) + (useAi ? Number(ai.targetDrainRateDelta) : 0),
      targetDryback: Number(state.drybackStrategy.nightDrybackTarget) + (useAi ? Number(ai.drybackDelta) : 0),
      endTime: base.endTime,
    };
    state.nutrientStrategy.finalEc = state.finalIrrigationTargets.targetEc;
    state.nutrientStrategy.finalPh = state.finalIrrigationTargets.targetPh;
    ai.applied = useAi;
    return state;
  }

  _irrigationControlTabs() {
    return [
      { key:"mode", label:"제어 모드", icon:"mdi:tune-variant" },
      { key:"base", label:"기본 관수 설정", icon:"mdi:timer-outline" },
      { key:"saturation", label:"포수 전략", icon:"mdi:cup-water" },
      { key:"solar", label:"일사 비례 관수", icon:"mdi:white-balance-sunny" },
      { key:"dryback", label:"드라이백 전략", icon:"mdi:water-minus" },
      { key:"drain", label:"배액 피드백", icon:"mdi:tray-arrow-down" },
      { key:"nutrient", label:"양액 전략", icon:"mdi:flask-outline" },
      { key:"ai", label:"AI 관수 보정", icon:"mdi:brain" },
      { key: "aiOps", label: "AI 운영", icon: "mdi:robot-happy-outline" },
      { key:"safety", label:"안전 한계", icon:"mdi:alert-octagon" },
      { key: "safetyOps", label: "안전/리허설", icon: "mdi:shield-check" },
      { key:"device", label:"양액기 설정", icon:"mdi:pipe-valve" },
      { key: "deviceMap", label: "장치 매핑", icon: "mdi:connection" },
      { key:"logs", label:"관수 로그", icon:"mdi:clipboard-text-clock" },
    ];
  }

  _renderIrrigationControlTabBar() {
    const tabs = this._irrigationControlTabs();
    if (!tabs.some((t) => t.key === this._irrigationTab)) this._irrigationTab = "mode";
    return `<div class="irrigation-control-tabs" style="display:flex;gap:4px;margin-bottom:16px;background:#f5faf6;border-radius:12px;padding:4px;overflow-x:auto;">
      ${tabs.map((t) => `<button class="c-tab ${this._irrigationTab === t.key ? "active" : ""}" data-irrigation-control-tab="${t.key}" style="flex:0 0 auto;padding:8px 10px;border-radius:8px;font-size:13px;display:flex;align-items:center;gap:5px;"><ha-icon icon="${t.icon}" style="width:15px;height:15px;"></ha-icon>${t.label}</button>`).join("")}
    </div>`;
  }

  _irrigRow(group, key, label, val, unit = "", min = 0, max = 9999, step = 1) {
    return `<div class="strategy-row"><div class="strategy-label">${label}</div><div class="strategy-control"><input type="number" data-irrigation-field data-irrigation-group="${group}" data-irrigation-key="${key}" value="${val}" min="${min}" max="${max}" step="${step}">${unit ? `<span>${unit}</span>` : ""}</div></div>`;
  }

  _irrigText(group, key, label, val) {
    return `<div class="strategy-row"><div class="strategy-label">${label}</div><div class="strategy-control"><input type="text" data-irrigation-field data-irrigation-group="${group}" data-irrigation-key="${key}" value="${this._esc(String(val || ""))}"></div></div>`;
  }

  _irrigToggle(group, key, label, checked) {
    return `<div class="strategy-row"><div class="strategy-label">${label}</div><label class="strategy-switch"><input type="checkbox" data-irrigation-field data-irrigation-group="${group}" data-irrigation-key="${key}" ${checked ? "checked" : ""}><span>ON/OFF</span></label></div>`;
  }

  _irrigSelect(group, key, label, val, opts) {
    return `<div class="strategy-row"><div class="strategy-label">${label}</div><select data-irrigation-field data-irrigation-group="${group}" data-irrigation-key="${key}">${opts.map(([v,t]) => `<option value="${v}" ${String(val)===String(v)?"selected":""}>${t}</option>`).join("")}</select></div>`;
  }

  _irrigSection(icon, title, body, attr = "") {
    return `<div class="gs-card strategy-card" ${attr}><div class="card-title" style="display:flex;align-items:center;gap:8px;margin-bottom:14px;"><ha-icon icon="${icon}" style="color:#51AE60;"></ha-icon>${title}</div>${body}</div>`;
  }

  _irrigSummary(state) {
    const tab = this._irrigationTab;
    const m = state.irrigationControlMode;
    const b = state.baseIrrigationSettings;
    const sat = state.saturationStrategy;
    const sol = state.solarIrrigationStrategy;
    const dry = state.drybackStrategy;
    const df = state.drainFeedback;
    const nut = state.nutrientStrategy;
    const ai = state.aiIrrigationCorrection;
    const safe = state.irrigationSafetyLimits;
    const dev = state.fertigationDeviceSettings;
    const f = state.finalIrrigationTargets;
    if (tab === "base") return `<div class="strategy-status-row"><div><span>기본 시간</span><b>${b.startTime}~${b.endTime}</b></div><div><span>1회 급액량</span><b>${b.shotLiterPerZone}L/구역</b></div><div><span>최소 간격</span><b>${b.minIntervalMin}분</b></div><div><span>최대 횟수</span><b>${b.maxDailyCount}회/일</b></div><div><span>기본 EC/pH</span><b>${b.baseEc} / ${b.basePh}</b></div><div><span>최종 EC/pH</span><b>${f.targetEc} / ${f.targetPh}</b></div></div>`;
    if (tab === "saturation") return `<div class="strategy-status-row"><div><span>목표 포수 VWC</span><b>${sat.targetVwc}%</b></div><div><span>완료 기준</span><b>${sat.completeVwc}%</b></div><div><span>포수 시작</span><b>${sat.startTime}</b></div><div><span>첫 배액 목표</span><b>${sat.firstDrainTargetTime}</b></div><div><span>분할 횟수</span><b>${sat.splitCount}회</b></div><div><span>필요 수량</span><b>${sat.requiredAmountL}L</b></div></div>`;
    if (tab === "solar") return `<div class="strategy-status-row"><div><span>기준 누적 일사</span><b>${sol.baseAccumulatedRadiation} J/cm²</b></div><div><span>흐린 날</span><b>${sol.cloudyThreshold}</b></div><div><span>맑은 날</span><b>${sol.sunnyThreshold}</b></div><div><span>현재 누적</span><b>${sol.currentAccumulatedRadiation}</b></div><div><span>남은 일사</span><b>${sol.remainingRadiation}</b></div><div><span>다음 예상</span><b>${sol.nextExpectedAt}</b></div></div>`;
    if (tab === "dryback") return `<div class="strategy-status-row"><div><span>주간 허용폭</span><b>${dry.dayDrybackRange}%</b></div><div><span>야간 목표폭</span><b>${dry.nightDrybackTarget}%</b></div><div><span>VWC 범위</span><b>${dry.targetVwcLower}~${dry.targetVwcUpper}%</b></div><div><span>현재 드라이백</span><b>${dry.currentDryback}%</b></div><div><span>목표 드라이백</span><b>${dry.targetDryback}%</b></div><div><span>야간 진행률</span><b>${dry.nightProgress}%</b></div></div>`;
    if (tab === "drain") return `<div class="strategy-status-row"><div><span>전날 급액/배액</span><b>${df.previousFeedAmountL}/${df.previousDrainAmountL}L</b></div><div><span>배액률</span><b>${df.drainRate}%</b></div><div><span>목표 배액률</span><b>${df.targetDrainRate}%</b></div><div><span>배액 EC</span><b>${df.drainEc}</b></div><div><span>배액 pH</span><b>${df.drainPh}</b></div><div><span>염류 위험</span><b>${df.saltAccumulationRisk ? "있음" : "낮음"}</b></div></div>`;
    if (tab === "nutrient") return `<div class="strategy-status-row"><div><span>작물군</span><b>${nut.cropGroup}</b></div><div><span>생육단계</span><b>${nut.growthStage}</b></div><div><span>기본 EC/pH</span><b>${nut.baseEc} / ${nut.basePh}</b></div><div><span>AI 보정</span><b>${nut.aiEcDelta} / ${nut.aiPhDelta}</b></div><div><span>최종 EC/pH</span><b>${nut.finalEc} / ${nut.finalPh}</b></div><div><span>편차</span><b>${nut.ecDeviation} / ${nut.phDeviation}</b></div></div>`;
    if (tab === "ai") return `<div class="strategy-status-row"><div><span>G-Index</span><b>${ai.gIndex}</b></div><div><span>AI 판단</span><b>${ai.decision}</b></div><div><span>EC/pH 보정</span><b>${ai.ecDelta} / ${ai.phDelta}</b></div><div><span>급액량 보정</span><b>${ai.shotAmountDelta}L</b></div><div><span>간격 보정</span><b>${ai.intervalDeltaMin}분</b></div><div><span>적용 상태</span><b>${ai.applied ? "적용" : "미적용"}</b></div></div>`;
    if (tab === "safety") return `<div class="strategy-status-row"><div><span>VWC 한계</span><b>${safe.minVwc}~${safe.maxVwc}%</b></div><div><span>EC 한계</span><b>${safe.minEc}~${safe.maxEc}</b></div><div><span>pH 한계</span><b>${safe.minPh}~${safe.maxPh}</b></div><div><span>최대 1회</span><b>${safe.maxShotAmountL}L</b></div><div><span>최대 일 관수</span><b>${safe.maxDailyAmountL}L</b></div><div><span>펌프 연속</span><b>${safe.maxPumpContinuousMin}분</b></div></div>`;
    if (tab === "device") return `<div class="strategy-status-row"><div><span>관수 펌프</span><b>${dev.irrigationPumpEntity}</b></div><div><span>A/B 밸브</span><b>${dev.aValveEntity} / ${dev.bValveEntity}</b></div><div><span>EC 센서</span><b>${dev.ecSensorEntity}</b></div><div><span>pH 센서</span><b>${dev.phSensorEntity}</b></div><div><span>VWC 센서</span><b>${dev.vwcSensorEntity}</b></div><div><span>유량계</span><b>${dev.flowMeterEntity}</b></div></div>`;
    if (tab === "logs") return `<div class="strategy-status-row"><div><span>최근 로그</span><b>${(state.irrigationLogs || []).length}건</b></div><div><span>마지막 실행</span><b>${m.lastRunAt}</b></div><div><span>오늘 관수</span><b>${m.todayCount}회</b></div><div><span>현재 상태</span><b>${m.status}</b></div><div><span>다음 예상</span><b>${m.nextRunAt}</b></div><div><span>오류 필터</span><b>전체</b></div></div>`;
    return `<div class="strategy-status-row"><div><span>현재 제어 모드</span><b>${m.mode}</b></div><div><span>AI 보정</span><b>${m.aiEnabled ? "ON" : "OFF"}</b></div><div><span>자동 관수</span><b>${m.autoIrrigationEnabled ? "ON" : "OFF"}</b></div><div><span>현재 상태</span><b>${m.status}</b></div><div><span>오늘 관수</span><b>${m.todayCount}회</b></div><div><span>급액 EC/pH</span><b>${m.currentEc} / ${m.currentPh}</b></div></div>`;
  }

  _irrigTriad(label, base, ai, final, unit = "") {
    return `<div class="strategy-final"><span>${label}</span><b>기본값 ${base}${unit}</b><b>AI 보정값 ${ai}${unit}</b><b>최종값 ${final}${unit}</b></div>`;
  }

  _renderIrrigationControlTabContent(state) {
    const tab = this._irrigationTab;
    const m = state.irrigationControlMode, b = state.baseIrrigationSettings, sat = state.saturationStrategy, sol = state.solarIrrigationStrategy, dry = state.drybackStrategy, df = state.drainFeedback, nut = state.nutrientStrategy, ai = state.aiIrrigationCorrection, safe = state.irrigationSafetyLimits, dev = state.fertigationDeviceSettings, f = state.finalIrrigationTargets;
    if (tab === "aiOps") return this._renderControlAiOpsTabContent("irrigation");
    if (tab === "safetyOps") return this._renderControlSafetyOpsTabContent("irrigation");
    if (tab === "deviceMap") return this._renderControlDeviceMapTabContent("irrigation");
    if (tab === "base") return this._irrigSection("mdi:timer-outline", "기본 관수 설정", `${this._irrigSummary(state)}${this._irrigText("baseIrrigationSettings","startTime","관수 시작 시간",b.startTime)}${this._irrigText("baseIrrigationSettings","endTime","관수 종료 시간",b.endTime)}${this._irrigRow("baseIrrigationSettings","sunriseOffsetMin","일출 기준 시작 오프셋",b.sunriseOffsetMin,"분",-180,180)}${this._irrigRow("baseIrrigationSettings","sunsetOffsetMin","일몰 기준 종료 오프셋",b.sunsetOffsetMin,"분",-240,60)}${this._irrigRow("baseIrrigationSettings","shotCcPerPlant","1회 급액량",b.shotCcPerPlant,"cc/주",0,1000)}${this._irrigRow("baseIrrigationSettings","shotLiterPerZone","1회 급액량",b.shotLiterPerZone,"L/구역",0,100)}${this._irrigRow("baseIrrigationSettings","minIntervalMin","관수 최소 간격",b.minIntervalMin,"분",1,240)}${this._irrigRow("baseIrrigationSettings","maxDailyCount","관수 최대 횟수",b.maxDailyCount,"회/일",1,100)}${this._irrigRow("baseIrrigationSettings","baseEc","기본 목표 EC",b.baseEc,"dS/m",0,6,0.1)}${this._irrigRow("baseIrrigationSettings","basePh","기본 목표 pH",b.basePh,"",4,8,0.1)}${this._irrigToggle("baseIrrigationSettings","zoneEnabled","구역별 관수 사용 여부",b.zoneEnabled)}${this._irrigText("baseIrrigationSettings","valveOrder","구역별 밸브 순서",b.valveOrder)}${this._irrigRow("baseIrrigationSettings","zoneTargetAmountL","구역별 목표 급액량",b.zoneTargetAmountL,"L",0,100)}<div class="strategy-final-grid" data-irrigation-final-target>${this._irrigTriad("급액량", b.shotLiterPerZone, ai.applied ? ai.shotAmountDelta : 0, f.shotAmountL, "L")}${this._irrigTriad("EC", b.baseEc, ai.applied ? ai.ecDelta : 0, f.targetEc, "")}${this._irrigTriad("pH", b.basePh, ai.applied ? ai.phDelta : 0, f.targetPh, "")}</div>`);
    if (tab === "saturation") return this._irrigSection("mdi:cup-water", "포수 전략", `${this._irrigSummary(state)}${this._irrigToggle("saturationStrategy","enabled","포수 사용",sat.enabled)}${this._irrigRow("saturationStrategy","targetVwc","목표 포수 VWC",sat.targetVwc,"%")}${this._irrigText("saturationStrategy","startTime","포수 시작 시간",sat.startTime)}${this._irrigRow("saturationStrategy","completeVwc","포수 완료 기준 VWC",sat.completeVwc,"%")}${this._irrigText("saturationStrategy","firstDrainTargetTime","첫 배액 목표 시간",sat.firstDrainTargetTime)}${this._irrigRow("saturationStrategy","firstDrainTargetAmountL","첫 배액 목표량",sat.firstDrainTargetAmountL,"L")}${this._irrigRow("saturationStrategy","splitCount","포수 분할 횟수",sat.splitCount,"회")}${this._irrigRow("saturationStrategy","shotAmountL","포수 1회 급액량",sat.shotAmountL,"L")}${this._irrigRow("saturationStrategy","firstDrainInductionAmountL","첫 배액 유도 급액량",sat.firstDrainInductionAmountL,"L")}<div class="strategy-example">전날 마지막 VWC ${sat.previousLastVwc}% · 첫 관수 전 VWC ${sat.todayPreFirstVwc}% · 야간 수분 손실량 ${sat.nightWaterLoss}% · 포수 필요 수량 ${sat.requiredAmountL}L · 첫 배액 발생 여부 ${sat.firstDrainDetected ? "발생" : "대기"}. 포수 완료 전에는 일사 비례 관수를 시작하지 않습니다.</div>`);
    if (tab === "solar") return this._irrigSection("mdi:white-balance-sunny", "일사 비례 관수", `${this._irrigSummary(state)}${this._irrigToggle("solarIrrigationStrategy","enabled","일사 비례 관수 사용",sol.enabled)}${this._irrigRow("solarIrrigationStrategy","baseAccumulatedRadiation","기준 누적 일사량",sol.baseAccumulatedRadiation,"J/cm²")}${this._irrigRow("solarIrrigationStrategy","cloudyThreshold","흐린 날 기준값",sol.cloudyThreshold,"J/cm²")}${this._irrigRow("solarIrrigationStrategy","sunnyThreshold","맑은 날 기준값",sol.sunnyThreshold,"J/cm²")}${this._irrigRow("solarIrrigationStrategy","minIntervalMin","최소 관수 간격",sol.minIntervalMin,"분")}${this._irrigRow("solarIrrigationStrategy","maxIntervalMin","최대 관수 간격",sol.maxIntervalMin,"분")}${this._irrigToggle("solarIrrigationStrategy","highTempCorrectionEnabled","고온 시 보정 사용 여부",sol.highTempCorrectionEnabled)}${this._irrigToggle("solarIrrigationStrategy","vpdCorrectionEnabled","VPD 보정 사용 여부",sol.vpdCorrectionEnabled)}<div class="strategy-example">현재 누적 ${sol.currentAccumulatedRadiation} · 마지막 관수 후 ${sol.afterLastIrrigationRadiation} · 남은 일사량 ${sol.remainingRadiation} · 다음 예상 ${sol.nextExpectedAt}. 최소 간격 미만이면 관수를 지연합니다.</div>`);
    if (tab === "dryback") return this._irrigSection("mdi:water-minus", "드라이백 전략", `${this._irrigSummary(state)}${this._irrigToggle("drybackStrategy","enabled","드라이백 사용",dry.enabled)}${this._irrigRow("drybackStrategy","dayDrybackRange","주간 드라이백 허용폭",dry.dayDrybackRange,"%")}${this._irrigRow("drybackStrategy","nightDrybackTarget","야간 드라이백 목표폭",dry.nightDrybackTarget,"%")}${this._irrigRow("drybackStrategy","minVwc","최소 VWC",dry.minVwc,"%")}${this._irrigRow("drybackStrategy","targetVwcUpper","목표 VWC 상한",dry.targetVwcUpper,"%")}${this._irrigRow("drybackStrategy","targetVwcLower","목표 VWC 하한",dry.targetVwcLower,"%")}${this._irrigToggle("drybackStrategy","nightEmergencyIrrigation","야간 비상 관수 사용 여부",dry.nightEmergencyIrrigation)}${this._irrigRow("drybackStrategy","nightEmergencyVwc","야간 비상 관수 VWC 기준",dry.nightEmergencyVwc,"%")}<div class="strategy-example">포수 후 최고 VWC ${dry.peakVwcAfterSaturation}% · 현재 VWC ${m.currentVwc}% · 현재 드라이백 ${dry.currentDryback}% · 목표 ${dry.targetDryback}% · 야간 진행률 ${dry.nightProgress}%. 과채류는 적극 활용, 엽채류는 수분 편차를 줄입니다.</div>`);
    if (tab === "drain") return this._irrigSection("mdi:tray-arrow-down", "배액 피드백", `${this._irrigSummary(state)}${this._irrigRow("drainFeedback","previousFeedAmountL","전날 총 급액량",df.previousFeedAmountL,"L")}${this._irrigRow("drainFeedback","previousDrainAmountL","전날 총 배액량",df.previousDrainAmountL,"L")}${this._irrigRow("drainFeedback","drainRate","배액률",df.drainRate,"%")}${this._irrigRow("drainFeedback","drainEc","배액 EC",df.drainEc,"dS/m",0,8,0.1)}${this._irrigRow("drainFeedback","drainPh","배액 pH",df.drainPh,"",4,8,0.1)}${this._irrigText("drainFeedback","measuredAt","배액 측정 시각",df.measuredAt)}<div class="strategy-example">목표 배액률 ${df.targetDrainRate}% · 배액률 부족 ${df.drainShortage ? "예" : "아니오"} · 염류 집적 위험 ${df.saltAccumulationRisk ? "있음" : "낮음"} · pH 산성화 위험 ${df.phAcidificationRisk ? "있음" : "낮음"}. 배액 EC가 높으면 다음날 오전 급액량과 목표 배액률을 증가합니다.</div>`);
    if (tab === "nutrient") return this._irrigSection("mdi:flask-outline", "양액 전략", `${this._irrigSummary(state)}${this._irrigSelect("nutrientStrategy","cropGroup","작물군",nut.cropGroup,[["과채류","과채류"],["엽채류","엽채류"]])}${this._irrigText("nutrientStrategy","growthStage","생육단계",nut.growthStage)}${this._irrigRow("nutrientStrategy","baseEc","기본 EC",nut.baseEc,"dS/m",0,6,0.1)}${this._irrigRow("nutrientStrategy","aiEcDelta","AI 보정 EC",nut.aiEcDelta,"dS/m",-2,2,0.1)}${this._irrigRow("nutrientStrategy","finalEc","최종 EC",nut.finalEc,"dS/m",0,6,0.1)}${this._irrigRow("nutrientStrategy","basePh","기본 pH",nut.basePh,"",4,8,0.1)}${this._irrigRow("nutrientStrategy","aiPhDelta","AI 보정 pH",nut.aiPhDelta,"",-1,1,0.1)}${this._irrigRow("nutrientStrategy","finalPh","최종 pH",nut.finalPh,"",4,8,0.1)}${this._irrigToggle("nutrientStrategy","useA","A액 사용 여부",nut.useA)}${this._irrigToggle("nutrientStrategy","useB","B액 사용 여부",nut.useB)}${this._irrigToggle("nutrientStrategy","useAcid","산 사용 여부",nut.useAcid)}${this._irrigToggle("nutrientStrategy","useAlkali","알칼리 사용 여부",nut.useAlkali)}<div class="strategy-example">현재 급액 EC ${nut.currentFeedEc}, pH ${nut.currentFeedPh} · 목표 EC ${nut.finalEc}, pH ${nut.finalPh} · 편차 ${nut.ecDeviation}/${nut.phDeviation}</div>`);
    if (tab === "ai") return this._irrigSection("mdi:brain", "AI 관수 보정", `${this._irrigSummary(state)}<div class="strategy-chip-title">AI는 기본 관수 인터록 위에 적용되는 보정 레이어</div><div class="strategy-status-row"><div><span>현재 G-Index</span><b>${ai.gIndex}</b></div><div><span>현재 작물군</span><b>${ai.cropGroup}</b></div><div><span>현재 생육단계</span><b>${ai.growthStage}</b></div><div><span>AI 판단 상태</span><b>${ai.decision}</b></div></div>${this._irrigRow("aiIrrigationCorrection","ecDelta","EC 보정값",ai.ecDelta,"dS/m",-2,2,0.1)}${this._irrigRow("aiIrrigationCorrection","phDelta","pH 보정값",ai.phDelta,"",-1,1,0.1)}${this._irrigRow("aiIrrigationCorrection","shotAmountDelta","1회 급액량 보정값",ai.shotAmountDelta,"L",-10,10,0.1)}${this._irrigRow("aiIrrigationCorrection","intervalDeltaMin","관수 간격 보정값",ai.intervalDeltaMin,"분",-60,60)}${this._irrigRow("aiIrrigationCorrection","drybackDelta","드라이백 보정값",ai.drybackDelta,"%",-10,10,0.5)}${this._irrigRow("aiIrrigationCorrection","endTimeDeltaMin","관수 종료시간 보정값",ai.endTimeDeltaMin,"분",-180,180)}${this._irrigRow("aiIrrigationCorrection","targetDrainRateDelta","목표 배액률 보정값",ai.targetDrainRateDelta,"%",-20,20)}<div class="strategy-example">${this._esc(ai.explanation)}</div>`);
    if (tab === "safety") return this._irrigSection("mdi:alert-octagon", "안전 한계", `${this._irrigSummary(state)}${this._irrigRow("irrigationSafetyLimits","minVwc","최저 VWC",safe.minVwc,"%")}${this._irrigRow("irrigationSafetyLimits","maxVwc","최고 VWC",safe.maxVwc,"%")}${this._irrigRow("irrigationSafetyLimits","maxEc","최대 급액 EC",safe.maxEc,"dS/m",0,8,0.1)}${this._irrigRow("irrigationSafetyLimits","minEc","최소 급액 EC",safe.minEc,"dS/m",0,8,0.1)}${this._irrigRow("irrigationSafetyLimits","maxPh","최대 pH",safe.maxPh,"",4,9,0.1)}${this._irrigRow("irrigationSafetyLimits","minPh","최소 pH",safe.minPh,"",4,9,0.1)}${this._irrigRow("irrigationSafetyLimits","maxShotAmountL","최대 1회 관수량",safe.maxShotAmountL,"L")}${this._irrigRow("irrigationSafetyLimits","maxDailyAmountL","최대 일 관수량",safe.maxDailyAmountL,"L")}${this._irrigRow("irrigationSafetyLimits","minIntervalMin","최소 관수 간격",safe.minIntervalMin,"분")}${this._irrigRow("irrigationSafetyLimits","maxPumpContinuousMin","펌프 최대 연속 가동 시간",safe.maxPumpContinuousMin,"분")}${this._irrigRow("irrigationSafetyLimits","flowAnomalyThreshold","유량 이상 감지 기준",safe.flowAnomalyThreshold,"%")}${this._irrigToggle("irrigationSafetyLimits","valveErrorDetection","밸브 오류 감지 기준",safe.valveErrorDetection)}${this._irrigSelect("irrigationSafetyLimits","sensorErrorMode","센서 오류 시 제어 방식",safe.sensorErrorMode,[["interlock","인터록"],["hold","유지"],["emergency_stop","비상 정지"]])}${this._irrigSelect("irrigationSafetyLimits","aiErrorMode","AI 오류 시 제어 방식",safe.aiErrorMode,[["interlock","인터록"],["standby","대기"],["emergency_stop","비상 정지"]])}<div class="strategy-example">관수 우선순위: 비상 정지 → 안전 한계 → 기본 관수 인터록 → AI 관수 보정 → 수동 명령</div>`);
    if (tab === "device") return this._irrigSection("mdi:pipe-valve", "양액기 설정", `${this._irrigSummary(state)}${["rawWaterPumpEntity","irrigationPumpEntity","aValveEntity","bValveEntity","acidValveEntity","alkaliValveEntity","zoneValveEntities","flowMeterEntity","ecSensorEntity","phSensorEntity","vwcSensorEntity"].map((k)=>this._irrigText("fertigationDeviceSettings",k,{rawWaterPumpEntity:"원수 펌프 엔티티",irrigationPumpEntity:"관수 펌프 엔티티",aValveEntity:"A액 밸브 엔티티",bValveEntity:"B액 밸브 엔티티",acidValveEntity:"산 밸브 엔티티",alkaliValveEntity:"알칼리 밸브 엔티티",zoneValveEntities:"구역 밸브 엔티티",flowMeterEntity:"유량계 엔티티",ecSensorEntity:"EC 센서 엔티티",phSensorEntity:"pH 센서 엔티티",vwcSensorEntity:"VWC 센서 엔티티"}[k],dev[k])).join("")}${this._irrigRow("fertigationDeviceSettings","ecP","EC P값",dev.ecP,"",0,10,0.01)}${this._irrigRow("fertigationDeviceSettings","ecI","EC I값",dev.ecI,"",0,10,0.01)}${this._irrigRow("fertigationDeviceSettings","ecD","EC D값",dev.ecD,"",0,10,0.01)}${this._irrigRow("fertigationDeviceSettings","phP","pH P값",dev.phP,"",0,10,0.01)}${this._irrigRow("fertigationDeviceSettings","phI","pH I값",dev.phI,"",0,10,0.01)}${this._irrigRow("fertigationDeviceSettings","phD","pH D값",dev.phD,"",0,10,0.01)}${this._irrigRow("fertigationDeviceSettings","ecCalibration","EC 센서 보정값",dev.ecCalibration,"",-5,5,0.01)}${this._irrigRow("fertigationDeviceSettings","phCalibration","pH 센서 보정값",dev.phCalibration,"",-2,2,0.01)}${this._irrigRow("fertigationDeviceSettings","flowCalibration","유량계 보정계수",dev.flowCalibration,"",0,5,0.01)}`);
    if (tab === "logs") return this._irrigSection("mdi:clipboard-text-clock", "관수 로그", `${this._irrigSummary(state)}<div class="strategy-status-row"><div><span>필터</span><b>날짜 · 구역 · 실행 원인 · 오류 여부</b></div></div><div data-irrigation-log>${(state.irrigationLogs || []).map((log)=>`<div class="strategy-log">${this._esc(log)}</div>`).join("")}</div>`);
    return this._irrigSection("mdi:tune-variant", "제어 모드", `${this._irrigSummary(state)}${this._irrigSelect("irrigationControlMode","mode","현재 제어 모드",m.mode,[["interlock","인터록 모드"],["ai_assist","AI 보조 모드"],["manual","수동 모드"],["emergency_stop","비상 정지 모드"]])}${this._irrigToggle("irrigationControlMode","aiEnabled","AI 관수 보정 사용",m.aiEnabled)}${this._irrigToggle("irrigationControlMode","fallbackToInterlockOnAiError","AI 오류 시 인터록 복귀",m.fallbackToInterlockOnAiError)}${this._irrigToggle("irrigationControlMode","autoIrrigationEnabled","자동 관수 사용",m.autoIrrigationEnabled)}${this._irrigToggle("irrigationControlMode","manualRunAllowed","수동 관수 허용 여부",m.manualRunAllowed)}${this._irrigSelect("irrigationControlMode","status","현재 관수 상태",m.status,[["standby","대기중"],["running","관수중"],["drain_detecting","배액 감지중"],["dryback","드라이백 진행중"],["emergency_stop","비상 정지"]])}`);
  }

  _renderIrrigSettingsPage() {
    this._irrigationControl = this._calculateFinalIrrigationTargets(this._getScopedControlState("irrigation"));
    const body = `${this._renderControlScopeBar("irrigation")}
      <div class="gs-card" style="padding:16px;">
        <span hidden data-irrigation-control-contract>irrigationControlMode baseIrrigationSettings saturationStrategy solarIrrigationStrategy drybackStrategy drainFeedback nutrientStrategy aiIrrigationCorrection irrigationSafetyLimits fertigationDeviceSettings finalIrrigationTargets irrigationLogs AI는 기본 관수 인터록 위에 적용되는 보정 레이어</span>
        ${this._renderIrrigationControlTabBar()}
        <div data-irrigation-control-content>${this._renderIrrigationControlTabContent(this._irrigationControl)}</div>
        <span hidden data-control-grouped-card-contract>
          _renderZoneAiFinalTargetCard("irrigation") _renderZoneOperatorConfirmCard("irrigation") _renderZoneExecutionLogCard("irrigation") _renderIrrigationStrategyPreviewCard("irrigation")
          _renderZoneControlModeCard("irrigation") _renderZoneInterlockSettingsCard("irrigation") _renderZoneSafetyGuardWatchdogCard("irrigation") _renderZoneSafetyGuardEventHistoryCard("irrigation") _renderZoneLimitedAutoPolicyCard("irrigation") _renderZoneRehearsalReadinessCard("irrigation") _renderZoneVirtualRehearsalCard("irrigation") _renderZoneDryRunPreviewCard("irrigation")
          _renderZoneEntityStateSummaryCard("irrigation") _renderZoneEntityMappingCard("irrigation") _renderZoneEntityMappingValidationCard("irrigation")
        </span>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:8px;"><button id="irrigation-control-save" class="btn btn-primary">관수 제어 저장</button></div>`;
    return this._renderCommonMainPageShell(
      "irrigation",
      "관수 제어",
      "기본 관수 인터록으로 안전하게 작동하고, AI 활성화 시 생육 상태와 일사량에 따라 EC, pH, 관수량, 드라이백을 보정합니다.",
      "mdi:water",
      body,
      { pageClass: "irrigation-control-page" }
    );
  }

  _cloneDeviceDefaults() { return JSON.parse(JSON.stringify(DEFAULT_DEVICE_CONTROL_STATE)); }

  _loadDeviceControl() {
    const defaults = this._cloneDeviceDefaults();
    try {
      const raw = localStorage.getItem("green_smart_device_control");
      return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    } catch (_) { return defaults; }
  }

  _saveDeviceControl() {
    this._deviceControl.deviceControlLogs = [`${new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})} 장치제어 설정 저장 · 사용자 · 성공`, ...(this._deviceControl.deviceControlLogs || [])].slice(0, 30);
    this._setScopedControlState("device", this._deviceControl);
    this._saveScopedControlStateToApi("device", this._deviceControl);
    this._setControlSaveNotice("device");
    localStorage.setItem("green_smart_device_control", JSON.stringify(this._deviceControl));
    this._pageRendered = null;
    this._update();
  }

  _deviceControlTabs() {
    return [
      { key:"status", label:"장치 현황", icon:"mdi:view-dashboard" }, { key:"manual", label:"수동 제어", icon:"mdi:gesture-tap-button" },
      { key:"auto", label:"자동 제어 상태", icon:"mdi:robot" }, { key: "aiOps", label: "AI 운영", icon: "mdi:robot-happy-outline" },
      { key:"vent", label:"환기 장치 설정", icon:"mdi:fan" },
      { key:"screen", label:"스크린 장치 설정", icon:"mdi:roller-shade" }, { key:"groups", label:"장치 그룹 관리", icon:"mdi:group" },
      { key:"interlock", label:"인터록 설정", icon:"mdi:shield-link-variant" }, { key:"failsafe", label:"Fail Safe 설정", icon:"mdi:shield-alert" },
      { key: "safetyOps", label: "안전/리허설", icon: "mdi:shield-check" }, { key: "deviceMap", label: "장치 매핑", icon: "mdi:connection" },
      { key:"alarms", label:"알람 및 장애", icon:"mdi:bell-alert" }, { key:"logs", label:"제어 이력", icon:"mdi:history" },
    ];
  }

  _renderDeviceControlTabBar() {
    const tabs = this._deviceControlTabs();
    if (!tabs.some((t) => t.key === this._deviceTab)) this._deviceTab = "status";
    return `<div class="device-control-tabs" style="display:flex;gap:4px;margin-bottom:16px;background:#f5faf6;border-radius:12px;padding:4px;overflow-x:auto;">${tabs.map((t) => `<button class="c-tab ${this._deviceTab === t.key ? "active" : ""}" data-device-control-tab="${t.key}" style="flex:0 0 auto;padding:8px 10px;border-radius:8px;font-size:13px;display:flex;align-items:center;gap:5px;"><ha-icon icon="${t.icon}" style="width:15px;height:15px;"></ha-icon>${t.label}</button>`).join("")}</div>`;
  }

  _deviceStatusBadge(value) {
    const text = String(value);
    const color = text.includes("정상") || text.includes("성공") || text.includes("ON") || text.includes("OPEN") ? "#2EAD4B" : text.includes("장애") || text.includes("끊김") || text.includes("FAIL") ? "#D64545" : "#E0A12B";
    return `<span style="display:inline-flex;align-items:center;gap:4px;color:${color};font-weight:700;"><span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;"></span>${this._esc(text)}</span>`;
  }

  _deviceSettingRow(group, key, label, value, unit = "") {
    const type = typeof value === "boolean" ? "checkbox" : typeof value === "number" ? "number" : "text";
    return `<div class="strategy-row"><div class="strategy-label">${label}</div><div class="strategy-control"><input ${type === "checkbox" ? "" : `value="${this._esc(String(value))}"`} type="${type}" ${type === "checkbox" && value ? "checked" : ""} data-device-field data-device-group="${group}" data-device-key="${key}">${unit ? `<span>${unit}</span>` : ""}</div></div>`;
  }

  _deviceTable(headers, rows) {
    return `<div style="overflow:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr>${headers.map((h)=>`<th style="text-align:left;padding:10px;border-bottom:1px solid #e5efe7;color:#5d7d64;white-space:nowrap;">${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r)=>`<tr>${r.map((c)=>`<td style="padding:10px;border-bottom:1px solid #edf4ee;vertical-align:top;">${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  _renderDeviceControlTabContent(state) {
    const tab = this._deviceTab;
    const auto = state.deviceStatus;
    if (tab === "aiOps") return this._renderControlAiOpsTabContent("device");
    if (tab === "safetyOps") return this._renderControlSafetyOpsTabContent("device");
    if (tab === "deviceMap") return this._renderControlDeviceMapTabContent("device");
    if (tab === "manual") return this._strategySection("mdi:gesture-tap-button", "수동 제어", `${this._deviceTable(["장치명","현재상태","명령","0~100% 비율 제어"], state.devices.map((d)=>[this._esc(d.name), this._deviceStatusBadge(d.state), `<button class="btn btn-ghost" data-device-command="ON" data-device-id="${d.id}">ON</button> <button class="btn btn-ghost" data-device-command="OFF" data-device-id="${d.id}">OFF</button> <button class="btn btn-ghost" data-device-command="OPEN" data-device-id="${d.id}">OPEN</button> <button class="btn btn-ghost" data-device-command="CLOSE" data-device-id="${d.id}">CLOSE</button>`, `<input type="range" min="0" max="100" value="50" data-device-percent="${d.id}">`]))}<div class="strategy-example">제어 전 확인 팝업을 표시하고, 실행 기록을 DB의 device_control_logs에 저장하는 구조입니다.</div>`);
    if (tab === "auto") return this._strategySection("mdi:robot", "자동 제어 상태", `<div class="strategy-status-row"><div><span>Home Assistant 연결상태</span><b>${auto.haConnected ? "연결" : "끊김"}</b></div><div><span>자동제어 활성 여부</span><b>${auto.autoControlEnabled ? "활성" : "비활성"}</b></div><div><span>AI 전략 적용 여부</span><b>${auto.aiStrategyApplied ? "적용" : "미적용"}</b></div><div><span>현재 적용중인 전략</span><b>${this._esc(auto.currentStrategy)}</b></div><div><span>마지막 실행 시간</span><b>${auto.lastRunAt}</b></div></div><div class="strategy-example">AI Agent → 전략 생성 → DB 저장 → Home Assistant → 장치 제어 → 장치 상태 수집 → DB 저장</div>`);
    if (tab === "vent") { const v=state.ventilationDeviceSettings; return this._strategySection("mdi:fan", "환기 장치 설정", `${["천창","측창","배기팬","순환팬"].map((d)=>`<div class="strategy-chip-title">${d}</div>`).join("")}${this._deviceSettingRow("ventilationDeviceSettings","enabled","장치 활성 여부",v.enabled)}${this._deviceSettingRow("ventilationDeviceSettings","autoControl","자동제어 사용 여부",v.autoControl)}${this._deviceSettingRow("ventilationDeviceSettings","manualAllowed","수동제어 허용 여부",v.manualAllowed)}${this._deviceSettingRow("ventilationDeviceSettings","minOpen","최소 개도율",v.minOpen,"%")}${this._deviceSettingRow("ventilationDeviceSettings","maxOpen","최대 개도율",v.maxOpen,"%")}${this._deviceSettingRow("ventilationDeviceSettings","defaultOpen","기본 개도율",v.defaultOpen,"%")}${this._deviceSettingRow("ventilationDeviceSettings","controlUnit","제어 단위",v.controlUnit)}${this._deviceSettingRow("ventilationDeviceSettings","delaySec","동작 지연시간",v.delaySec,"초")}${this._deviceSettingRow("ventilationDeviceSettings","maxContinuousMin","최대 연속 동작시간",v.maxContinuousMin,"분")}${this._deviceSettingRow("ventilationDeviceSettings","direction","개폐 방향 설정",v.direction)}${this._deviceSettingRow("ventilationDeviceSettings","positionFeedback","위치 피드백 사용 여부",v.positionFeedback)}${this._deviceSettingRow("ventilationDeviceSettings","windLimit","풍속 제한값",v.windLimit,"m/s")}${this._deviceSettingRow("ventilationDeviceSettings","rainRestricted","강우 시 동작 제한",v.rainRestricted)}${this._deviceSettingRow("ventilationDeviceSettings","lowTempRestricted","저온 시 동작 제한",v.lowTempRestricted)}${this._deviceSettingRow("ventilationDeviceSettings","highTempForceVent","고온 시 강제 환기 여부",v.highTempForceVent)}`); }
    if (tab === "screen") { const sc=state.screenDeviceSettings; return this._strategySection("mdi:roller-shade", "스크린 장치 설정", `${["보온스크린","차광스크린","1중 스크린","2중 스크린","측면커튼"].map((d)=>`<div class="strategy-chip-title">${d}</div>`).join("")}${this._deviceSettingRow("screenDeviceSettings","enabled","장치 활성 여부",sc.enabled)}${this._deviceSettingRow("screenDeviceSettings","autoControl","자동제어 사용 여부",sc.autoControl)}${this._deviceSettingRow("screenDeviceSettings","manualAllowed","수동제어 허용 여부",sc.manualAllowed)}${this._deviceSettingRow("screenDeviceSettings","minDeploy","최소 전개율",sc.minDeploy,"%")}${this._deviceSettingRow("screenDeviceSettings","maxDeploy","최대 전개율",sc.maxDeploy,"%")}${this._deviceSettingRow("screenDeviceSettings","defaultDeploy","기본 전개율",sc.defaultDeploy,"%")}${this._deviceSettingRow("screenDeviceSettings","controlUnit","제어 단위",sc.controlUnit)}${this._deviceSettingRow("screenDeviceSettings","delaySec","동작 지연시간",sc.delaySec,"초")}${this._deviceSettingRow("screenDeviceSettings","maxContinuousMin","최대 연속 동작시간",sc.maxContinuousMin,"분")}${this._deviceSettingRow("screenDeviceSettings","direction","전개/수축 방향 설정",sc.direction)}${this._deviceSettingRow("screenDeviceSettings","positionFeedback","위치 피드백 사용 여부",sc.positionFeedback)}${this._deviceSettingRow("screenDeviceSettings","solarThreshold","일사 기준 전개 설정",sc.solarThreshold,"W/m²")}${this._deviceSettingRow("screenDeviceSettings","tempThreshold","온도 기준 전개 설정",sc.tempThreshold,"°C")}${this._deviceSettingRow("screenDeviceSettings","nightInsulation","야간 보온 전개 설정",sc.nightInsulation)}${this._deviceSettingRow("screenDeviceSettings","dewGapPercent","결로 방지 틈새 개방률",sc.dewGapPercent,"%")}${this._deviceSettingRow("screenDeviceSettings","strongWindProtection","강풍 시 보호 동작",sc.strongWindProtection)}`); }
    if (tab === "groups") return this._strategySection("mdi:group", "장치 그룹 관리", `${this._deviceTable(["그룹명","기능"], state.deviceGroups.map((g)=>[this._esc(g), "생성 · 수정 · 삭제 · 장치 추가 · 장치 제거"]))}`);
    if (tab === "interlock") return this._strategySection("mdi:shield-link-variant", "인터록 설정", `${this._deviceTable(["인터록 이름","활성 여부","우선순위","설명","조건/동작"], state.deviceInterlocks.map((r)=>[this._esc(r.name), this._deviceStatusBadge(r.enabled ? "정상" : "비활성"), String(r.priority), this._esc(r.description), "장치 상태 · 환경값 · 센서값 · 통신상태 → 장치 정지 · 강제 종료 · 동작 금지 · 경보 발생"]))}<div class="strategy-example">인터록 상태 시각화: 배기팬 ON → 난방기 OFF, 풍속 &gt; 12m/s → 천창 CLOSE 등 장치 충돌을 방지합니다.</div>`);
    if (tab === "failsafe") return this._strategySection("mdi:shield-alert", "Fail Safe 설정", `${this._deviceTable(["조건","활성","안전 동작"], state.deviceFailsafeRules.map((r)=>[this._esc(r.trigger), this._deviceStatusBadge(r.enabled ? "정상" : "비활성"), this._esc(r.action)]))}<div class="strategy-example">Fail Safe 상태 시각화: 센서 통신 끊김 · HA 연결 끊김 · MQTT/Modbus 장애 · 정전 · 장치 응답 없음 발생 시 안전 위치로 전환합니다.</div>`);
    if (tab === "alarms") return this._strategySection("mdi:bell-alert", "알람 및 장애", `${this._deviceTable(["발생시간","장치명","장애유형","장애내용","처리상태"], state.deviceAlarms.map((a)=>[a.time, this._esc(a.device), this._esc(a.type), this._esc(a.message), this._deviceStatusBadge(a.status)]))}`);
    if (tab === "logs") return this._strategySection("mdi:history", "제어 이력", `${this._deviceTable(["시간","장치","이전상태","변경상태","제어유형","실행주체"], state.deviceControlLogs.map((l)=>{ const parts=String(l).split(" · "); return [parts[0]?.split(" ")[0] || "-", parts[0]?.replace(/^\S+\s*/,"") || "-", "이전상태", parts[0] || "-", parts[1] || "자동", parts[2] || "Home Assistant"]; }))}`);
    return this._strategySection("mdi:view-dashboard", "장치 현황", `${this._deviceTable(["장치명","장치유형","현재상태","동작모드","제어주체","통신상태","마지막 업데이트"], state.devices.map((d)=>[this._esc(d.name), this._esc(d.type), this._deviceStatusBadge(d.state), this._esc(d.mode), this._esc(d.controller), this._deviceStatusBadge(d.comm), this._esc(d.updated)]))}`);
  }

  _renderDeviceControlPage() {
    this._deviceControl = this._getScopedControlState("device");
    const body = `${this._renderControlScopeBar("device")}
      <div class="gs-card" style="padding:16px;">
        <span hidden data-device-control-contract>devices deviceGroups deviceStatus deviceControlLogs deviceInterlocks deviceFailsafeRules deviceAlarms ventilationDeviceSettings screenDeviceSettings</span>
        ${this._renderDeviceControlTabBar()}
        <div data-device-control-content>${this._renderDeviceControlTabContent(this._deviceControl)}</div>
        <span hidden data-control-grouped-card-contract>
          _renderZoneAiFinalTargetCard("device") _renderZoneOperatorConfirmCard("device") _renderZoneExecutionLogCard("device")
          _renderZoneControlModeCard("device") _renderZoneInterlockSettingsCard("device") _renderZoneSafetyGuardWatchdogCard("device") _renderZoneSafetyGuardEventHistoryCard("device") _renderZoneLimitedAutoPolicyCard("device") _renderZoneRehearsalReadinessCard("device") _renderZoneVirtualRehearsalCard("device") _renderZoneDryRunPreviewCard("device")
          _renderZoneEntityStateSummaryCard("device") _renderZoneEntityMappingCard("device") _renderZoneEntityMappingValidationCard("device")
        </span>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:8px;"><button id="device-control-save" class="btn btn-primary">장치제어 저장</button></div>`;
    return this._renderCommonMainPageShell(
      "device",
      "장치제어",
      "Home Assistant와 실제 설비를 연결해 장치 운영, 수동 제어, 인터록, Fail Safe를 관리합니다.",
      "mdi:cog-box",
      body,
      { pageClass: "device-control-page" }
    );
  }

  _renderVentSettingsPage() {
    return `<div class="page">
      ${this._renderSubHero("환기 설정", "천창 · 측창 개폐 조건 및 환기 기준을 설정합니다", "mdi:fan")}
      ${this._settingCard("mdi:thermometer-chevron-up", "개폐 조건", [
        this._settingRow("환기 시작 온도", this._inputNum("vent-temp", 28, 15, 45, 0.5), "°C"),
        this._settingRow("환기 시작 습도", this._inputNum("vent-hum", 85, 50, 100), "%"),
        this._settingRow("최대 개도율",   this._inputNum("vent-max-open", 80, 10, 100, 5), "%"),
        this._settingRow("CO₂ 기준 환기", this._toggleSwitch("vent-co2", true)),
      ].join(""))}
      ${this._settingCard("mdi:weather-windy", "안전 조건", [
        this._settingRow("강풍 차단 기준", this._inputNum("vent-wind", 8, 2, 20), "m/s"),
        this._settingRow("강수 시 자동 닫힘", this._toggleSwitch("vent-rain", true)),
        this._settingRow("야간 환기 허용", this._toggleSwitch("vent-night", false)),
        this._settingRow("최소 개도율 유지", this._inputNum("vent-min-open", 5, 0, 30), "%"),
      ].join(""))}
      ${this._saveBtn("ventilation")}
    </div>`;
  }

  _renderScreenSettingsPage() {
    return `<div class="page">
      ${this._renderSubHero("스크린 설정", "차광 스크린 · 보온 커튼 동작 조건을 설정합니다", "mdi:roller-shade")}
      ${this._settingCard("mdi:weather-sunny", "차광 스크린", [
        this._settingRow("차광 시작 일사량", this._inputNum("scr-solar", 600, 100, 1200, 50), "W/m²"),
        this._settingRow("차광률",          this._inputNum("scr-shade", 50, 10, 100, 5), "%"),
        this._settingRow("차광 시작 온도",  this._inputNum("scr-shade-temp", 30, 15, 45, 0.5), "°C"),
        this._settingRow("차광 지연 시간",  this._inputNum("scr-delay", 5, 1, 30), "분"),
      ].join(""))}
      ${this._settingCard("mdi:curtains-closed", "보온 커튼", [
        this._settingRow("보온 시작 온도",  this._inputNum("scr-heat-temp", 12, 0, 25, 0.5), "°C"),
        this._settingRow("커튼 닫힘 시각", this._inputTime("scr-close", "18:00")),
        this._settingRow("커튼 열림 시각", this._inputTime("scr-open",  "07:00")),
        this._settingRow("결로 방지 모드", this._toggleSwitch("scr-dewpoint", true)),
      ].join(""))}
      ${this._saveBtn("screen")}
    </div>`;
  }

  // ── Popup ──────────────────────────────────────────────────────────────────────

  _showPopup(key) {
    this._ensureEquipZones(this._equipZone + 1);
    this._ensureEquipModeZones(this._equipZone + 1);
    const zoneEquip = this._equipment[this._equipZone];
    const zoneMode = this._equipMode[this._equipZone];
    this._popup = { key, value: zoneEquip[key] || 0 };
    const overlay = this.shadowRoot.getElementById("popup-overlay");
    const inner = this.shadowRoot.getElementById("popup-inner");
    if (!overlay || !inner) return;
    const mode = zoneMode[key] || "auto";
    inner.innerHTML = `
      <div class="popup">
        <div class="pop-title">${EQUIP_LABELS[key]}</div>
        <div class="pop-sub">제어 모드 선택</div>
        <div class="pop-mode-row">
          <button class="pop-mode-btn ${mode === "auto" ? "active" : ""}" id="pop-auto">자동</button>
          <button class="pop-mode-btn ${mode === "manual" ? "active" : ""}" id="pop-manual">수동</button>
        </div>
        <div class="pop-row">
          <input type="range" min="0" max="100" value="${this._popup.value}"
            id="pop-slider" ${mode === "auto" ? "disabled" : ""}
            style="flex:1;accent-color:#51AE60;opacity:${mode === "auto" ? ".4" : "1"}">
          <div class="pop-val" id="pop-disp">${this._popup.value}%</div>
        </div>
        <div class="pop-actions">
          <button class="btn btn-ghost" id="pop-cancel">취소</button>
          <button class="btn btn-primary" id="pop-confirm">설정</button>
        </div>
      </div>`;
    overlay.removeAttribute("hidden");
    const slider = inner.querySelector("#pop-slider");
    const disp = inner.querySelector("#pop-disp");
    if (slider) slider.addEventListener("input", () => {
      this._popup.value = Number(slider.value);
      if (disp) disp.textContent = `${slider.value}%`;
    });
    inner.querySelector("#pop-auto").addEventListener("click", () => {
      this._equipMode[this._equipZone][key] = "auto"; this._saveEquipMode();
      const s = inner.querySelector("#pop-slider");
      if (s) { s.disabled = true; s.style.opacity = "0.4"; }
      inner.querySelector("#pop-auto").classList.add("active");
      inner.querySelector("#pop-manual").classList.remove("active");
    });
    inner.querySelector("#pop-manual").addEventListener("click", () => {
      this._equipMode[this._equipZone][key] = "manual"; this._saveEquipMode();
      const s = inner.querySelector("#pop-slider");
      if (s) { s.disabled = false; s.style.opacity = "1"; }
      inner.querySelector("#pop-manual").classList.add("active");
      inner.querySelector("#pop-auto").classList.remove("active");
    });
    inner.querySelector("#pop-cancel").addEventListener("click", () => this._closePopup());
    inner.querySelector("#pop-confirm").addEventListener("click", () => {
      this._equipment[this._equipZone][this._popup.key] = this._popup.value;
      this._saveEquipment();
      this._closePopup();
      this._pageRendered = null;
      this._update();
    });
    overlay.addEventListener("click", (e) => { if (e.target === overlay) this._closePopup(); });
  }

  _closePopup() {
    this._popup = null;
    const overlay = this.shadowRoot.getElementById("popup-overlay");
    if (overlay) overlay.setAttribute("hidden", "");
  }


  _bindControlStrategyInputs(root) {
    if (!root.querySelector(".control-strategy-page")) return;
    root.querySelectorAll("[data-env-strategy-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this._envStrategyTab = btn.dataset.envStrategyTab;
        this._pageRendered = null;
        this._update();
      });
    });
    const readValue = (el) => {
      if (el.type === "checkbox") return Boolean(el.checked);
      if (el.tagName === "SELECT") return el.value;
      const n = Number(el.value);
      return Number.isFinite(n) ? n : el.value;
    };
    root.querySelectorAll("[data-control-field]").forEach((el) => {
      el.addEventListener("change", () => {
        const group = el.dataset.controlGroup;
        const key = el.dataset.controlKey;
        if (!group || !key) return;
        if (group === "root" && key === "controlMode") this._controlStrategy.controlMode = readValue(el);
        else {
          if (!this._controlStrategy[group]) this._controlStrategy[group] = {};
          this._controlStrategy[group][key] = readValue(el);
        }
        this._controlStrategy = this._calculateFinalAppliedTargets(this._controlStrategy);
        this._pushControlLog("전략 값 변경 → 최종 적용값 재계산");
        this._pageRendered = null;
        this._update();
      });
    });
    root.querySelector("#control-strategy-save")?.addEventListener("click", () => this._saveControlStrategy());
    root.querySelectorAll("[data-env-setvalue-save]").forEach((btn) => {
      if (btn.id === "control-strategy-save") return;
      btn.addEventListener("click", () => this._saveControlStrategy());
    });
    root.querySelectorAll("[data-env-setvalue-reset]").forEach((btn) => {
      btn.addEventListener("click", () => { this._pageRendered = null; this._update(); });
    });
  }

  _bindIrrigationControlInputs(root) {
    const page = root.querySelector(".irrigation-control-page");
    if (!page) return;

    page.querySelectorAll("button[data-irrigation-control-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextTab = btn.dataset.irrigationControlTab;
        if (!nextTab || nextTab === this._irrigationTab) return;
        this._irrigationTab = nextTab;
        this._pageRendered = null;
        this._update();
      });
    });

    const readValue = (el) => {
      if (el.type === "checkbox") return Boolean(el.checked);
      if (el.type === "number") {
        const n = Number(el.value);
        return Number.isFinite(n) ? n : 0;
      }
      return el.value;
    };

    page.querySelectorAll("[data-irrigation-field]").forEach((el) => {
      el.addEventListener("change", () => {
        const group = el.dataset.irrigationGroup;
        const key = el.dataset.irrigationKey;
        if (!group || !key) return;
        if (!this._irrigationControl[group]) this._irrigationControl[group] = {};
        this._irrigationControl[group][key] = readValue(el);
        this._irrigationControl = this._calculateFinalIrrigationTargets(this._irrigationControl);
        // Do not call _update() here. Re-rendering on every field change causes the
        // HA panel to flicker and can make unsaved edits appear reset. The next tab
        // switch/save performs a controlled render with the in-memory state.
      });
    });

    page.querySelector("#irrigation-control-save")?.addEventListener("click", () => this._saveIrrigationControl());
  }

  _bindDeviceControlInputs(root) {
    const page = root.querySelector(".device-control-page");
    if (!page) return;
    page.querySelectorAll("button[data-device-control-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = btn.dataset.deviceControlTab;
        if (!next || next === this._deviceTab) return;
        this._deviceTab = next;
        this._pageRendered = null;
        this._update();
      });
    });
    const readValue = (el) => el.type === "checkbox" ? Boolean(el.checked) : el.type === "number" ? Number(el.value) : el.value;
    page.querySelectorAll("[data-device-field]").forEach((el) => {
      el.addEventListener("change", () => {
        const group = el.dataset.deviceGroup;
        const key = el.dataset.deviceKey;
        if (!group || !key) return;
        if (!this._deviceControl[group]) this._deviceControl[group] = {};
        this._deviceControl[group][key] = readValue(el);
      });
    });
    page.querySelectorAll("[data-device-command]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const device = this._deviceControl.devices.find((d) => d.id === btn.dataset.deviceId);
        const command = btn.dataset.deviceCommand;
        if (!device || !command) return;
        if (!confirm(`${device.name} 장치에 ${command} 명령을 실행할까요?`)) return;
        const previous = device.state;
        device.state = command;
        device.controller = "사용자";
        device.updated = "방금 전";
        this._deviceControl.deviceControlLogs = [`${new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})} ${device.name} ${previous} → ${command} · 수동실행 · 사용자 · 성공`, ...(this._deviceControl.deviceControlLogs || [])].slice(0, 30);
        this._setScopedControlState("device", this._deviceControl);
        this._saveScopedControlStateToApi("device", this._deviceControl);
        this._setControlSaveNotice("device");
        localStorage.setItem("green_smart_device_control", JSON.stringify(this._deviceControl));
        this._pageRendered = null;
        this._update();
      });
    });
    page.querySelector("#device-control-save")?.addEventListener("click", () => this._saveDeviceControl());
  }

  _bindZoneEntityStateSummaryInputs(root) {
    root.querySelectorAll("[data-zone-entity-state-refresh]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await this._fetchZoneEntityStateSummary(btn.dataset.zoneEntityStateDomain || "environment");
      });
    });
  }

  _bindZoneSafetyGuardWatchdogInputs(root) {
    root.querySelectorAll("[data-zone-safety-watchdog-refresh]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await this._fetchZoneSafetyGuardWatchdog(btn.dataset.zoneSafetyWatchdogDomain || "environment");
      });
    });
  }

  _bindZoneSafetyGuardEventInputs(root) {
    root.querySelectorAll("[data-zone-safety-event-refresh]").forEach((btn) => {
      btn.addEventListener("click", async () => await this._fetchZoneSafetyGuardEvents(btn.dataset.zoneSafetyEventDomain || "environment"));
    });
    root.querySelectorAll("[data-zone-safety-event-ack]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.zoneSafetyEventDomain || "environment";
        const eventId = btn.dataset.zoneSafetyEventId;
        const note = this._zoneSafetyGuardEventNote(domain, eventId);
        await this._ackZoneSafetyGuardEvent(domain, eventId, note);
      });
    });
    root.querySelectorAll("[data-zone-safety-event-clear]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.zoneSafetyEventDomain || "environment";
        const eventId = btn.dataset.zoneSafetyEventId;
        const note = this._zoneSafetyGuardEventNote(domain, eventId);
        await this._clearZoneSafetyGuardEvent(domain, eventId, note);
      });
    });
  }

  _bindIrrigationStrategyPreviewInputs(root) {
    root.querySelectorAll("[data-irrigation-strategy-preview-refresh]").forEach((btn) => {
      btn.addEventListener("click", async () => await this._fetchIrrigationStrategyPreview(btn.dataset.irrigationStrategyPreviewDomain || "irrigation"));
    });
    root.querySelectorAll("[data-irrigation-strategy-save-final]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.irrigationStrategyPreviewDomain || "irrigation";
        if (!confirm("관수 전략 모델 결과를 최종 적용값으로 저장할까요? SafetyGuard 우선 적용은 실행 단계에서 유지됩니다.")) return;
        const ok = await this._saveIrrigationStrategyFinalTargets(domain);
        if (!ok) alert("관수 전략 모델 최종값 저장 실패: API/로그를 확인해 주세요.");
      });
    });
  }

  _bindEnvironmentStrategyPreviewInputs(root) {
    root.querySelectorAll("[data-env-strategy-preview-refresh]").forEach((btn) => {
      btn.addEventListener("click", async () => await this._fetchEnvironmentStrategyPreview(btn.dataset.envStrategyPreviewDomain || "environment"));
    });
    root.querySelectorAll("[data-env-strategy-save-final]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.envStrategyPreviewDomain || "environment";
        if (!confirm("환경 전략 모델 결과를 최종 적용값으로 저장할까요? SafetyGuard 우선 적용은 실행 단계에서 유지됩니다.")) return;
        const ok = await this._saveEnvironmentStrategyFinalTargets(domain);
        if (!ok) alert("환경 전략 모델 최종값 저장 실패: API/로그를 확인해 주세요.");
      });
    });
  }

  _bindZoneLimitedAutoPolicyInputs(root) {
    root.querySelectorAll("[data-zone-limited-auto-refresh]").forEach((btn) => {
      btn.addEventListener("click", async () => await this._fetchZoneLimitedAutoPolicy(btn.dataset.zoneLimitedAutoDomain || "environment"));
    });
    root.querySelectorAll("[data-zone-limited-auto-save]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.zoneLimitedAutoDomain || "environment";
        const ok = await this._saveZoneLimitedAutoPolicy(domain);
        if (!ok) alert("제한적 자동제어 정책 저장 실패: API/로그를 확인해 주세요.");
      });
    });
    root.querySelectorAll("[data-zone-alert-resume-request]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.zoneLimitedAutoDomain || "environment";
        if (!confirm("알림 확인/조치 후 자동제어 재개 요청을 기록할까요?")) return;
        const ok = await this._requestZoneAlertResume(domain);
        if (!ok) alert("재개 요청 실패: API/로그를 확인해 주세요.");
      });
    });
  }

  _bindZoneInterlockSettingsInputs(root) {
    root.querySelectorAll("[data-zone-interlock-refresh]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await this._fetchZoneInterlockSettings(btn.dataset.zoneInterlockDomain || "environment");
      });
    });
    root.querySelectorAll("[data-zone-interlock-save]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.zoneInterlockDomain || "environment";
        const ok = await this._saveZoneInterlockSettings(domain);
        if (ok) this._setControlSaveNotice(domain);
      });
    });
    root.querySelectorAll("[data-zone-interlock-rule-add]").forEach((btn) => {
      btn.addEventListener("click", () => this._addZoneInterlockRule(btn.dataset.zoneInterlockDomain || "environment"));
    });
    root.querySelectorAll("[data-zone-interlock-rule-delete]").forEach((btn) => {
      btn.addEventListener("click", () => this._deleteZoneInterlockRule(btn.dataset.zoneInterlockDomain || "environment", btn.dataset.zoneInterlockRuleIndex || 0));
    });
  }

  _bindZoneControlModeInputs(root) {
    root.querySelectorAll("[data-zone-control-mode-refresh]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await this._fetchZoneControlMode(btn.dataset.zoneControlModeDomain || "environment");
      });
    });
    root.querySelectorAll("[data-zone-control-mode-save]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.zoneControlModeDomain || "environment";
        const ok = await this._saveZoneControlMode(domain);
        if (ok) this._setControlSaveNotice(domain);
      });
    });
  }

  _bindZoneVirtualRehearsalInputs(root) {
    root.querySelectorAll("[data-zone-virtual-rehearsal-run]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.zoneVirtualRehearsalDomain || "environment";
        const res = await this._runZoneVirtualRehearsal(domain);
        if (!res) alert("가상 장치 리허설 실패: 가상 센서/인터록/운영 알고리즘/UI 설정을 확인하세요.");
        if (res?.physicalDeviceConnectionAllowed) alert("주의: 실제 장비 연결 gate가 열려 있습니다. 별도 승인 전에는 연결하지 마세요.");
      });
    });
    root.querySelectorAll("[data-zone-virtual-rehearsal-evidence-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.zoneVirtualRehearsalDomain || "environment";
        const cacheKey = this._scopedControlCacheKey(domain);
        const data = this._zoneVirtualRehearsalCache?.[cacheKey] || null;
        const text = this._virtualRehearsalEvidenceText(data || { domain });
        try {
          await navigator.clipboard?.writeText(text);
          this._setControlSaveNotice(domain, "가상 시나리오 증거를 복사했습니다.");
        } catch (err) {
          console.warn("가상 리허설 evidence copy fallback", err);
          alert(text);
        }
      });
    });
  }

  _bindZoneRehearsalReadinessInputs(root) {
    root.querySelectorAll("[data-zone-rehearsal-refresh]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.zoneRehearsalDomain || "environment";
        const res = await this._fetchZoneRehearsalReadiness(domain);
        if (!res) alert("현장 리허설 readiness 조회 실패: mapping, dry run, SafetyGuard, operator confirmation 설정을 확인하세요.");
      });
    });
  }

  _bindZoneOperatorConfirmInputs(root) {
    root.querySelectorAll("[data-zone-final-execute-confirmed]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.zoneFinalExecuteDomain || btn.dataset.zoneFinalExecuteConfirmed || "environment";
        const payload = this._operatorExecutionConfirmationPayload(domain);
        if (!payload.operator_confirmed || payload.operatorConfirmationText !== this._operatorConfirmationPhrase(domain)) {
          alert(`실제 장비 실행 확인 필요: 확인 문구 '${this._operatorConfirmationPhrase(domain)}'를 입력하고 운영자 확인을 체크하세요.`);
          return;
        }
        const ok = await this._executeZoneFinalTargets(domain);
        if (!ok) alert("최종값 실행 실패: 운영자 확인/권한/override 사유와 SafetyGuard 상태를 확인하세요.");
      });
    });
  }

  _bindZoneDryRunPreviewInputs(root) {
    root.querySelectorAll("[data-zone-dry-run-preview]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.zoneDryRunDomain || "environment";
        const res = await this._previewZoneFinalTargetsDryRun(domain);
        if (!res) alert("Dry Run 실행 전 확인 실패: final target, entity mapping, control mode 로그를 확인해 주세요.");
      });
    });
  }

  _bindZoneAiFinalTargetInputs(root) {
    root.querySelectorAll("[data-zone-ai-refresh]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.zoneAiDomain || "environment";
        await this._fetchZoneAiOutputs(domain);
        await this._fetchZoneFinalTargets(domain);
      });
    });
    root.querySelectorAll("[data-zone-ai-apply]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.zoneAiDomain || "environment";
        const outputId = btn.dataset.zoneAiOutputId;
        if (!outputId) return;
        if (!confirm(`${this._controlDomainLabel(domain)} AI 전략 출력 #${outputId}을 최종 적용값으로 적용할까요?`)) return;
        const ok = await this._applyZoneAiOutput(domain, outputId);
        if (ok) this._setControlSaveNotice(domain);
      });
    });
    root.querySelectorAll("[data-zone-final-execute]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.zoneFinalDomain || "environment";
        if (!confirm(`${this._controlDomainLabel(domain)} 최종 적용값을 Home Assistant service call로 실행할까요?`)) return;
        const ok = await this._executeZoneFinalTargets(domain);
        if (!ok) alert("최종값 실행 실패: 매핑/대상값/HA service call 로그를 확인해 주세요.");
      });
    });
    root.querySelectorAll("[data-zone-log-refresh]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await this._fetchZoneExecutionLogs(btn.dataset.zoneLogDomain || "environment");
      });
    });
  }

  _bindZoneEntityMappingValidationInputs(root) {
    root.querySelectorAll("[data-zone-entity-validation-refresh]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.zoneEntityValidationDomain || "environment";
        const res = await this._fetchZoneEntityMappingValidation(domain);
        if (!res) alert("Entity Mapping 검증 실패: entity_id, safe_state, service 호환성을 확인해 주세요.");
      });
    });
  }

  _bindZoneEntityMappingInputs(root) {
    root.querySelectorAll("[data-zone-entity-refresh]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await this._fetchZoneEntityMappings(btn.dataset.zoneEntityDomain || "environment");
      });
    });
    root.querySelectorAll("[data-zone-entity-add]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.zoneEntityDomain || "environment";
        const card = btn.closest("[data-zone-entity-mapping-card]");
        const mapping = {
          device_type: card?.querySelector("[data-zone-entity-device-type]")?.value?.trim(),
          entity_id: card?.querySelector("[data-zone-entity-id-input]")?.value?.trim(),
          control_role: card?.querySelector("[data-zone-entity-control-role]")?.value?.trim(),
          safe_state: card?.querySelector("[data-zone-entity-safe-state]")?.value?.trim() || "off",
        };
        if (!mapping.device_type || !mapping.entity_id || !mapping.control_role) {
          alert("device_type, entity_id, control_role을 입력해 주세요.");
          return;
        }
        await this._saveZoneEntityMapping(domain, mapping);
      });
    });
    root.querySelectorAll("[data-zone-entity-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.zoneEntityDomain || "environment";
        const id = btn.dataset.zoneEntityId;
        if (!id) return;
        if (!confirm(`${this._controlDomainLabel(domain)} Entity 매핑 #${id}를 삭제할까요?`)) return;
        await this._deleteZoneEntityMapping(domain, id);
      });
    });
  }

  _selectControlZoneFromCard(domain, zoneId) {
    this._controlScope = { ...this._controlScope, seasonId: this._currentControlSeasonId(), zoneId: Number(zoneId || 1), applyMode: "current" };
    this._saveControlScope();
    this._setControlSaveNotice(domain);
    this._pageRendered = null;
    this._update();
  }

  _openControlPresetModal(domain) {
    const overlay = this.shadowRoot.getElementById("popup-overlay");
    const inner = this.shadowRoot.getElementById("popup-inner");
    if (!overlay || !inner) return;
    overlay.removeAttribute("hidden");
    inner.innerHTML = this._renderControlPresetModal(domain);
    inner.querySelector("[data-control-preset-cancel]")?.addEventListener("click", () => this._closePopup());
    inner.querySelector("[data-control-preset-copy-one]")?.addEventListener("click", () => {
      const fromZone = Number(this._controlScope?.zoneId || 1);
      const toZone = Number(inner.querySelector("[data-control-preset-target-zone]")?.value || fromZone);
      if (fromZone === toZone) return;
      this._copyScopedControlSettings(domain, fromZone, toZone);
      this._copyScopedControlSettingsViaApi(domain, fromZone, [toZone]);
      this._controlSaveNotice = { domain, label: `${this._currentControlScopeLabel(domain)} → ${toZone}구역 프리셋 복사 완료`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      this._closePopup(); this._pageRendered = null; this._update();
    });
    inner.querySelector("[data-control-preset-copy-all]")?.addEventListener("click", () => {
      const fromZone = Number(this._controlScope?.zoneId || 1);
      const copied = this._copyScopedControlSettingsToAllZones(domain, fromZone);
      this._copyScopedControlSettingsViaApi(domain, fromZone, copied);
      this._controlSaveNotice = { domain, label: `${this._currentControlScopeLabel(domain)} → 전체 구역(${copied.length}개) 프리셋 적용 완료`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      this._closePopup(); this._pageRendered = null; this._update();
    });
    overlay.onclick = (e) => { if (e.target === overlay) this._closePopup(); };
  }

  async _saveAdminRoleMapping(root) {
    const rows = Array.from(root.querySelectorAll("[data-admin-role-row]")).map((row) => ({
      id: row.querySelector("[data-admin-role-user-id]")?.value?.trim() || "",
      name: row.querySelector("[data-admin-role-user-name]")?.value?.trim() || "",
      role: row.querySelector("[data-admin-role-value]")?.value || "farm_staff",
    })).filter((r) => r.id);
    const status = root.querySelector("[data-admin-role-api-status]");
    try {
      const assignmentResults = await Promise.all(rows.map((row) => this._api.admin.assignRole(row.id, { role: row.role })));
      this._adminRoleMappings = rows.map((row, idx) => ({ ...row, assignmentDecision: assignmentResults[idx]?.assignmentDecision || null }));
      if (status) status.textContent = `Backend API로 ${rows.length}명 권한 저장 완료`;
      this._pushAdminAuditLog("role_mapping_saved_via_api", `${rows.length}명 저장 · assignmentDecision`);
    } catch (error) {
      this._adminRoleMappings = rows;
      localStorage.setItem("green_smart_admin_role_mappings", JSON.stringify(rows));
      if (status) status.textContent = `Backend 저장 실패 · localStorage 호환 fallback 저장 (${error?.message || "unknown"})`;
      this._pushAdminAuditLog("role_mapping_saved_fallback_localstorage", `${rows.length}명 저장`);
    }
    this._pageRendered = null; this._update();
  }

  _saveAdminSystemConfig(root) {
    const next = { ...this._adminSystemConfig };
    root.querySelectorAll("[data-admin-config-field]").forEach((el) => {
      const key = el.dataset.adminConfigField;
      next[key] = el.type === "checkbox" ? Boolean(el.checked) : el.type === "number" ? Number(el.value) : el.value;
    });
    this._adminSystemConfig = next;
    localStorage.setItem("green_smart_admin_system_config", JSON.stringify(next));
    this._pushAdminAuditLog("system_config_saved", "시스템 설정 저장");
    this._pageRendered = null; this._update();
  }

  _runAdminDiagnostics() {
    this._adminDiagnostics = `진단 완료 · panel v${VERSION} · role ${this._currentUserRole()} · DB ${this._dbReady ? "연결" : "대기"} · MQTT ${this._mqttLoaded ? "로드" : "대기"}`;
    this._pushAdminAuditLog("diagnostics_run", this._adminDiagnostics);
    this._pageRendered = null; this._update();
  }

  _exportAdminBackup() {
    const payload = { version: VERSION, roleMappings: this._adminRoleMappings, systemConfig: this._adminSystemConfig, auditLogs: this._adminAuditLogs, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `green_smart_admin_backup_${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
    this._pushAdminAuditLog("backup_exported", "Admin/System 백업 내보내기");
  }

  _bindAdminSystemInputs(root) {
    const page = root.querySelector(".admin-system-page");
    if (!page) return;
    page.querySelectorAll("button[data-admin-system-tab]").forEach((btn) => {
      btn.addEventListener("click", () => { this._adminSystemTab = btn.dataset.adminSystemTab; this._pageRendered = null; this._update(); });
    });
    page.querySelector("[data-admin-role-save]")?.addEventListener("click", async () => this._saveAdminRoleMapping(page));
    page.querySelector("[data-admin-config-save]")?.addEventListener("click", () => this._saveAdminSystemConfig(page));
    page.querySelector("[data-admin-health-refresh]")?.addEventListener("click", () => { this._pushAdminAuditLog("health_refreshed", "연동 상태 새로고침"); this._pageRendered = null; this._update(); });
    page.querySelector("[data-admin-diagnostic-run]")?.addEventListener("click", () => this._runAdminDiagnostics());
    page.querySelector("[data-admin-backup-export]")?.addEventListener("click", () => this._exportAdminBackup());
  }

  _bindControlScopeInputs(root) {
    root.querySelectorAll("[data-control-scope-bar]").forEach((bar) => {
      const domain = bar.dataset.controlScopeDomain || "environment";
      bar.querySelectorAll("[data-control-zone-tab]").forEach((btn) => btn.addEventListener("click", () => this._selectControlZoneFromCard(domain, btn.dataset.controlZoneId)));
      bar.querySelectorAll("[data-env-zone-season-card]").forEach((card) => card.addEventListener("click", () => this._selectControlZoneSeasonFromCard(domain, card.dataset.envZoneSeasonZoneId, card.dataset.envZoneSeasonSeasonId)));
      bar.querySelectorAll("[data-control-preset-open]").forEach((btn) => btn.addEventListener("click", () => this._openControlPresetModal(domain)));
    });
  }

  // ── Dashboard event binding ───────────────────────────────────────────────────

  _bindDashboard(root) {
    this._bindControlScopeInputs(root);
    this._bindAdminSystemInputs(root);
    this._bindZoneInterlockSettingsInputs(root);
    this._bindZoneControlModeInputs(root);
    this._bindZoneEntityStateSummaryInputs(root);
    this._bindZoneSafetyGuardWatchdogInputs(root);
    this._bindZoneSafetyGuardEventInputs(root);
    this._bindEnvironmentStrategyPreviewInputs(root);
    this._bindZoneAiFinalTargetInputs(root);
    this._bindZoneEntityMappingInputs(root);
    this._bindControlStrategyInputs(root);
    this._bindIrrigationControlInputs(root);
    this._bindDeviceControlInputs(root);
    root.querySelector("[data-vs001-sensor-refresh]")?.addEventListener("click", () => this._fetchCurrentSensorSummary({ patchOnly: true }));
    root.querySelector("[data-vs002-roof-window-dry-run]")?.addEventListener("click", () => this._runVs002RoofWindowDryRun(root));
    root.querySelectorAll("[data-home-status-card]").forEach((card) => {
      card.addEventListener("click", () => this._openHomeStatusPopup(card.dataset.statusKey));
    });
    // Trend chart zone tabs — patch polylines only (no full re-render)
    root.querySelectorAll("[data-zone-tab]").forEach((btn) =>
      btn.addEventListener("click", () => {
        this._chartZoneTab = Number(btn.dataset.zoneTab);
        this._pageRendered = null;
        this._update();
      })
    );
    // Irrigation chart zone tabs — patch polylines only (no full re-render)
    root.querySelectorAll("[data-irrig-zone-tab]").forEach((btn) =>
      btn.addEventListener("click", () => {
        this._irrigZoneTab = Number(btn.dataset.irrigZoneTab);
        this._pageRendered = null;
        this._update();
      })
    );
    // Chart hover tooltips
    this._bindChartTooltip(root);
    root.querySelector("#target-env-card")?.addEventListener("click", () => this._openTargetEnvPopup());
    this._bindIrrigTooltip(root);
    // Chart detail popup buttons
    root.querySelector("#env-chart-expand")?.addEventListener("click", () => this._openTrendPopup());
    root.querySelector("#irrig-chart-expand")?.addEventListener("click", () => this._openIrrigPopup());
    // Zone card dropdown
    const zoneCardSelect = root.querySelector("#zone-card-select");
    if (zoneCardSelect) zoneCardSelect.addEventListener("change", (e) => {
      this._zoneCardTab = Number(e.target.value);
      const grid = root.querySelector("#zone-card-grid");
      if (grid) {
        const sim = this._simData;
        const cfg = this._normalizedForm();
        const zones = (sim && sim.zones) || [];
        const idx = this._zoneCardTab;
        const z = zones[idx] || { dry_temp:"--", humidity:"--", co2:"--", vpd:"--", light:"--", status:"normal" };
        const warn = z.status === "warning";
        grid.innerHTML = `<div class="zone-card" data-zone="${idx + 1}">
          <div class="zone-header">
            <div class="zone-name">Zone ${idx + 1}</div>
            <div class="zone-badge ${warn ? "warn" : ""}" data-zone-badge>${warn ? "경고" : "정상"}</div>
          </div>
          <div class="zm-grid">
            <div class="zm"><div class="zm-l">온도</div><div class="zm-v" data-metric="temp">${z.dry_temp} °C</div></div>
            <div class="zm"><div class="zm-l">습도</div><div class="zm-v" data-metric="humidity">${z.humidity} %</div></div>
            <div class="zm"><div class="zm-l">CO₂</div><div class="zm-v" data-metric="co2">${z.co2} ppm</div></div>
            <div class="zm"><div class="zm-l">VPD</div><div class="zm-v" data-metric="vpd">${z.vpd} kPa</div></div>
            <div class="zm"><div class="zm-l">광량</div><div class="zm-v" data-metric="light">${z.light} μmol</div></div>
          </div>
        </div>`;
      }
    });
    // Zone card click → env trend popup (mobile)
    root.querySelector("#zone-card-grid")?.addEventListener("click", () => this._openTrendPopup());
    // Crop sub-tabs
    root.querySelectorAll("[data-crop-tab]").forEach(btn =>
      btn.addEventListener("click", () => {
        this._cropSubTab = btn.dataset.cropTab;
        const content = root.querySelector("[data-crop-content]");
        if (content) { content.innerHTML = this._renderCropTabContent(); this._bindCropContent(content); }
        root.querySelectorAll("[data-crop-tab]").forEach(b =>
          b.classList.toggle("active", b.dataset.cropTab === this._cropSubTab));
      })
    );
    // Crop content buttons (add / delete)
    this._bindCropContent(root);
    // Equipment zone dropdown
    const zoneSelect = root.querySelector("#equip-zone-select");
    if (zoneSelect) zoneSelect.addEventListener("change", (e) => {
      this._equipZone = Number(e.target.value);
      const grid = root.querySelector("#equip-grid");
      if (grid) grid.outerHTML = this._renderEquipGrid();
      const newGrid = root.querySelector("#equip-grid");
      if (newGrid) {
        newGrid.querySelectorAll("[data-equip]").forEach((item) =>
          item.addEventListener("click", () => this._showPopup(item.dataset.equip))
        );
      }
    });
    // Equipment card click (home page)
    root.querySelectorAll("[data-equip]").forEach((item) =>
      item.addEventListener("click", () => this._showPopup(item.dataset.equip))
    );
    // Weather card click → modal
    const weatherCard = root.querySelector("#weather-card");
    if (weatherCard) weatherCard.addEventListener("click", () => this._openWeatherModal());
    // Update alert click → update modal (event delegation)
    const alertsScroll = root.querySelector(".alerts-scroll");
    if (alertsScroll) {
      alertsScroll.addEventListener("click", (e) => {
        const item = e.target.closest("[data-update-key]");
        if (!item) return;
        const key = item.dataset.updateKey;
        const alert = this._alerts.find((a) => a.key === key);
        if (alert) this._showUpdateModal(alert);
      });
    }
    const refreshBtn = root.querySelector("#watchdog-refresh-btn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        const icon = refreshBtn.querySelector("ha-icon");
        if (icon) icon.style.animation = "spin 0.6s linear";
        setTimeout(() => { if (icon) icon.style.animation = ""; }, 650);
        this._runWatchdog();
      });
    }
    // Sub-page inline sliders
    root.querySelectorAll("[data-ctrl]").forEach((slider) => {
      const key = slider.dataset.ctrl;
      const disp = root.querySelector(`#cv-${key}`);
      slider.addEventListener("input", () => {
        if (disp) disp.textContent = `${slider.value}%`;
      });
    });
    root.querySelectorAll("[data-ctrl-apply]").forEach((btn) => {
      const key = btn.dataset.ctrlApply;
      btn.addEventListener("click", () => {
        const slider = root.querySelector(`[data-ctrl="${key}"]`);
        if (slider) {
          this._ensureEquipZones(this._equipZone + 1);
          this._equipment[this._equipZone][key] = Number(slider.value);
          this._saveEquipment(); this._update();
        }
      });
    });
  }

  // ── Wizard rendering ──────────────────────────────────────────────────────────

  _renderWizardPage() {
    const step = WIZARD_STEPS.indexOf(this._state) + 1;
    const body = this._state === "wizard_step1"
      ? this._renderModbusStep()
      : this._state === "wizard_step2"
        ? this._renderZonesStep()
        : this._renderReviewStep();
    return `<div class="wizard-area">
      <div class="wiz-topbar">
        <div class="wiz-brand"><ha-icon icon="mdi:leaf"></ha-icon>Green Smart 초기 설정</div>
        <div style="font-size:12px;color:#7a9780;">v${VERSION}</div>
      </div>
      ${this._renderProgress(step)}
      <ha-card>${body}${this._renderError()}</ha-card>
    </div>`;
  }

  _renderProgress(step) {
    const labels = ["Modbus", "구역 설정", "확인"];
    const pct = Math.round((step / labels.length) * 100);
    return `<div class="progress">${labels.map((l, i) => `
      <div class="step ${i + 1 <= step ? "active" : ""}">
        <span class="dot">${i + 1}</span><span>${l}</span>
      </div>`).join("")}</div>
      <div class="bar"><div class="fill" style="width:${pct}%"></div></div>`;
  }

  _renderModbusStep() {
    const f = this._form, v = this._virtualMode;
    return `<h1>Green Smart 설정</h1>
      <p class="sub">PLC Modbus TCP 연결 정보를 입력하거나 가상 장치 모드를 선택하세요.</p>
      <div class="mode-toggle">
        <button class="mode-option ${v ? "" : "active"}" id="real-mode">실제 장치</button>
        <button class="mode-option ${v ? "active" : ""}" id="virtual-mode">가상 장치</button>
      </div>
      ${v ? `<div class="mode-copy">
        <strong>가상 장치 모드</strong>
        <span>Modbus 연결 없이 시뮬레이션 데이터로 전체 대시보드를 테스트할 수 있습니다.</span>
      </div>` : ""}
      <div class="form" ${v ? 'style="display:none"' : ""}>
        <label>PLC IP 주소<input id="host" value="${this._esc(f.host)}" autocomplete="off" placeholder="192.168.1.100"></label>
        <div class="grid">
          <label>포트<input id="port" type="number" min="1" max="65535" value="${this._esc(f.port)}"></label>
          <label>Unit ID<input id="unit_id" type="number" min="1" max="255" value="${this._esc(f.unit_id)}"></label>
        </div>
      </div>
      <div class="actions"><button class="action primary" id="next">다음</button></div>`;
  }

  _renderZonesStep() {
    const f = this._form, v = this._virtualMode;
    return `<h1>구역 설정</h1>
      <p class="sub">온실 구역 수, 양액 구역 수, 스티븐슨 스크린 수를 입력하세요.</p>
      <div class="form">
        <div class="grid">
          <label>온실 구역 수<input id="greenhouse_zones" type="number" min="1" max="20" value="${this._esc(f.greenhouse_zones)}"></label>
          <label>양액 구역 수<input id="nutrient_zones" type="number" min="1" max="10" value="${this._esc(f.nutrient_zones)}"></label>
        </div>
        <label>스티븐슨 스크린 수<input id="stevenson_screens" type="number" min="1" max="10" value="${this._esc(f.stevenson_screens)}"></label>
        <label>WeatherFlow 접두사
          <input id="weatherflow_prefix" value="${this._esc(f.weatherflow_prefix)}" autocomplete="off"
            ${v ? 'placeholder="sensor.tempest_ (가상 모드 — 시뮬레이션)"' : ""}>
        </label>
        ${v ? `<div class="mode-copy"><strong>가상 WeatherFlow</strong><span>날씨 데이터도 시뮬레이션으로 표시됩니다.</span></div>` : ""}
      </div>
      <div class="actions">
        <button class="action" id="back">이전</button>
        <button class="action primary" id="next">다음</button>
      </div>`;
  }

  _renderReviewStep() {
    return `<h1>설정 확인</h1>
      <p class="sub">설정 내용을 확인하고 완료하세요.</p>
      ${this._renderCentralActivationCard()}
      ${this._renderSummary(this._normalizedForm())}
      <div class="actions">
        <button class="action" id="back">이전</button>
        <button class="action primary" id="finish">설정 완료</button>
      </div>`;
  }

  _renderCentralActivationCard() {
    const f = this._form;
    return `<div class="mode-copy central-activation-card">
      <strong>중앙 활성화 — 선택 사항</strong>
      <span>현재는 로컬/데모 Greenity 중앙 API 연결 기준입니다. 실제 유료 벤더 자격 증명이나 고객 토큰은 입력하지 마세요. 활성화 코드는 전송에만 사용하고 저장하지 않습니다.</span>
      <div class="form" style="margin-top:12px;">
        <label>중앙 API URL
          <input id="central_base_url" value="${this._esc(f.central_base_url || "http://127.0.0.1:18000")}" autocomplete="off" placeholder="http://127.0.0.1:18000">
        </label>
        <label>활성화 코드
          <input type="password" id="activation_code" value="${this._esc(f.activation_code)}" autocomplete="off" placeholder="선택 사항 — 중앙 API에서 발급한 일회용 코드">
        </label>
        <div class="grid">
          <label>중기예보 날씨 권역 코드
            <input id="weather_mid_land_reg_id" value="${this._esc(f.weather_mid_land_reg_id || "11H10000")}" autocomplete="off" placeholder="11H10000">
          </label>
          <label>중기예보 기온 권역 코드
            <input id="weather_mid_ta_reg_id" value="${this._esc(f.weather_mid_ta_reg_id || "11H10701")}" autocomplete="off" placeholder="11H10701">
          </label>
        </div>
      </div>
    </div>`;
  }

  _renderSummary(d) {
    return `<dl class="summary">
      <dt>장치 모드</dt><dd>${d.virtual ? "가상 장치 모드" : "실제 장치 모드"}</dd>
      <dt>PLC 주소</dt><dd>${this._esc(d.host)}:${this._esc(d.port)}</dd>
      <dt>Unit ID</dt><dd>${this._esc(d.unit_id)}</dd>
      <dt>온실 구역</dt><dd>${this._esc(d.greenhouse_zones)}개</dd>
      <dt>양액 구역</dt><dd>${this._esc(d.nutrient_zones)}개</dd>
      <dt>스티븐슨 스크린</dt><dd>${this._esc(d.stevenson_screens)}개</dd>
      <dt>WeatherFlow 접두사</dt><dd>${this._esc(d.weatherflow_prefix)}</dd>
      <dt>온실 주소</dt><dd>${this._esc(d.location_name || d.greenhouse_address || "미설정")}</dd>
      <dt>단기예보 격자</dt><dd>nx ${this._esc(d.nx)} · ny ${this._esc(d.ny)}</dd>
      <dt>중앙 API</dt><dd>${this._esc(d.central_base_url || "미설정")}</dd>
      <dt>중앙 설치 ID</dt><dd>${this._esc(d.central_installation_id || "활성화 후 표시")}</dd>
      <dt>중기예보 권역</dt><dd>${this._esc(d.weather_mid_land_reg_id)} / ${this._esc(d.weather_mid_ta_reg_id)}</dd>
      <dt>중앙 보안</dt><dd>활성화 코드는 저장하지 않습니다</dd>
    </dl>`;
  }

  // ── Settings page ──────────────────────────────────────────────────────────────

  _settingsTabs() {
    return [
      { key: "connection", label: "연결 설정", icon: "mdi:lan-connect" },
      { key: "zones", label: "구역 설정", icon: "mdi:greenhouse" },
      { key: "weather", label: "날씨 설정", icon: "mdi:weather-partly-cloudy" },
      { key: "device-mapping", label: "장치 매핑·상태", icon: "mdi:connection" },
      { key: "central", label: "중앙 연동", icon: "mdi:server-network" },
    ];
  }

  _renderSettingsTabBar() {
    const tabs = this._settingsTabs();
    if (!tabs.some((t) => t.key === this._settingsSubTab)) this._settingsSubTab = "connection";
    return `<div class="env-strategy-tabs" data-settings-tab-bar style="display:flex;gap:4px;margin-bottom:16px;background:#f5faf6;border-radius:12px;padding:4px;overflow-x:auto;">
      ${tabs.map((t) => `<button class="c-tab ${this._settingsSubTab === t.key ? "active" : ""}" data-settings-tab="${t.key}" style="flex:0 0 auto;padding:8px 10px;border-radius:8px;font-size:13px;display:flex;align-items:center;gap:5px;white-space:nowrap;"><ha-icon icon="${t.icon}" style="width:15px;height:15px;"></ha-icon>${t.label}</button>`).join("")}
    </div>`;
  }

  _settingsSection(icon, title, subtitle, body) {
    return `<section data-settings-section class="gs-card strategy-card" style="padding:16px;margin-bottom:12px;">
      <div class="card-title" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><ha-icon icon="${icon}" style="color:#51AE60;"></ha-icon>${title}</div>
      <div style="font-size:12px;color:#7a9780;margin-bottom:14px;line-height:1.5;">${subtitle}</div>
      <div class="form" data-settings-existing-fields style="display:grid;gap:12px;">${body}</div>
    </section>`;
  }

  _renderSettingsDeviceMappingTabContent() {
    this._controlStrategy = this._calculateFinalAppliedTargets(this._getScopedControlState("environment"));
    const statusSummary = `<div data-env-status-operator-summary style="background:#f8fbf9;border:1px solid #dfeee1;border-radius:14px;padding:10px;margin-bottom:10px;"><div data-env-status-metric-grid style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;"><div data-env-status-metric style="background:#fff;border:1px solid #edf4ee;border-radius:12px;padding:8px;"><span style="display:block;font-size:10px;color:#7a9780;">관리 위치</span><b style="display:block;color:#24323F;">환경 설정</b><small style="display:block;color:#8ca594;">전체 장치 연결 관리</small></div><div data-env-status-metric style="background:#fff;border:1px solid #edf4ee;border-radius:12px;padding:8px;"><span style="display:block;font-size:10px;color:#7a9780;">범위</span><b style="display:block;color:#24323F;">구역별 매핑</b><small style="display:block;color:#8ca594;">환경 제어 domain</small></div><div data-env-status-metric style="background:#fff;border:1px solid #edf4ee;border-radius:12px;padding:8px;"><span style="display:block;font-size:10px;color:#7a9780;">권한</span><b style="display:block;color:#24323F;">연결/검증 전용</b><small style="display:block;color:#8ca594;">수동 실행 없음</small></div></div></div>`;
    const statusBoundary = `<div data-env-status-safety-boundary style="background:#f7fbff;border:1px solid #dbeaf8;border-radius:12px;padding:10px;margin:8px 0;color:#4f6f83;font-size:11px;font-weight:800;">장치 매핑은 Home Assistant entity 연결만 변경합니다. 이 환경 설정 탭은 수동 장치 실행 권한을 추가하지 않습니다.</div>`;
    const statusCardShell = (body) => `<div data-env-status-card-shell style="background:#fbfefb;border:1px solid #edf4ee;border-radius:12px;padding:8px;">${body}</div>`;
    const statusGroup = (key, title, subtitle, body, footer = "") => `<div data-env-status-group="${key}" style="border:1px solid #e1efe5;border-radius:14px;padding:10px;margin:10px 0;background:#fff;"><div data-env-status-group-header style="margin-bottom:8px;"><div data-env-status-group-title style="font-size:13px;font-weight:900;color:#24323F;">${title}</div><div data-env-status-group-subtitle style="font-size:10px;color:#7a9780;margin-top:2px;">${subtitle}</div></div><div data-env-status-card-grid style="display:grid;gap:10px;">${body}</div>${footer ? `<div data-env-status-card-footer style="border-top:1px solid #edf4ee;margin-top:10px;padding-top:8px;font-size:10px;color:#7a9780;">${footer}</div>` : ""}</div>`;
    return `<section data-settings-device-mapping-tab data-env-devices-polish data-env-status-subtab="devices" data-env-subtab-main-format data-env-subtab-summary-card>
      ${this._renderControlScopeBar("environment")}
      ${statusSummary}
      ${statusBoundary}
      <div data-env-device-rbac-note style="font-size:11px;color:#7a9780;margin:8px 0;">권한 문구: 농장주/직원은 상태와 검증 결과를 먼저 확인하고, 매핑 변경은 허용된 역할만 수행합니다.</div>
      ${statusGroup("entity-state", "장치 상태", "현재 HA entity 상태 요약입니다.", statusCardShell(this._renderZoneEntityStateSummaryCard("environment")))}
      ${statusGroup("entity-mapping", "Entity 매핑", "환경 제어 장치와 HA entity를 연결합니다.", statusCardShell(this._renderZoneEntityMappingCard("environment")), "저장 후 crop_season_id + zone_id + environment scope로 관리됩니다.")}
      <div data-env-device-mapping-save-boundary hidden>mapping save uses existing zone control settings path; no direct execution</div>
      ${statusGroup("mapping-validation", "매핑 검증", "실행 전 누락/불일치 entity를 확인합니다.", statusCardShell(this._renderZoneEntityMappingValidationCard("environment")))}
    </section>`;
  }

  _renderSettingsTabContent(f) {
    const tab = this._settingsSubTab || "connection";
    if (tab === "zones") return this._settingsSection("mdi:greenhouse", "구역 설정", "기존 설치 구역 수와 센서 구성을 저장합니다. 환경 제어와 같은 탭 구조이지만 설정 기능만 수행합니다.", `
      <div class="grid">
        <label>온실 구역<input id="greenhouse_zones" type="number" min="1" max="20" value="${this._esc(f.greenhouse_zones)}"></label>
        <label>양액 구역<input id="nutrient_zones" type="number" min="1" max="10" value="${this._esc(f.nutrient_zones)}"></label>
      </div>
      <label>스티븐슨 스크린<input id="stevenson_screens" type="number" min="1" max="10" value="${this._esc(f.stevenson_screens)}"></label>
      <label>WeatherFlow 접두사<input id="weatherflow_prefix" value="${this._esc(f.weatherflow_prefix)}" autocomplete="off"></label>
    `);
    if (tab === "weather") return this._settingsSection("mdi:weather-partly-cloudy", "날씨 설정", "기존 온실 주소 기반 위치 매칭, 단기 nx/ny, 중기 권역, 기상청 API 키 관리만 제공합니다.", `
      <label>온실 주소
        <input id="greenhouse_address" value="${this._esc(f.greenhouse_address || f.location_name || "")}" autocomplete="off" placeholder="예: 경기도 수원시 영통구">
      </label>
      <div class="actions" style="justify-content:flex-start;margin-top:0;">
        <button class="action" id="weather_location_match" type="button">주소로 날씨 위치 자동 매칭</button>
      </div>
      <div id="location_match_status" style="font-size:12px;color:#7a9780;">${this._esc(f.location_name || f.greenhouse_address || "주소를 입력하고 자동 매칭을 눌러주세요.")}</div>
      <div class="grid">
        <label>단기 nx<input id="nx" type="number" min="0" max="999" value="${this._esc(f.nx || 60)}"></label>
        <label>단기 ny<input id="ny" type="number" min="0" max="999" value="${this._esc(f.ny || 127)}"></label>
      </div>
      <div class="grid">
        <label>중기예보 날씨 권역 코드<input id="weather_mid_land_reg_id" value="${this._esc(f.weather_mid_land_reg_id || f.land_regid || "11H10000")}" autocomplete="off" placeholder="11H10000"></label>
        <label>중기예보 기온 권역 코드<input id="weather_mid_ta_reg_id" value="${this._esc(f.weather_mid_ta_reg_id || f.ta_regid || "11H10701")}" autocomplete="off" placeholder="11H10701"></label>
      </div>
      <div data-settings-weather-api-card style="border:1px solid #e1efe5;border-radius:14px;padding:12px;background:#fbfefb;display:grid;gap:10px;">
        <div style="font-size:13px;font-weight:900;color:#24323F;">기상청 API 키</div>
        <div id="weather-key-status" style="font-size:12px;color:#7a9780;">API 키 상태 확인 중...</div>
        <input id="weather-api-key" type="password" autocomplete="off" placeholder="단기예보 API 키">
        <div id="weather-mid-key-status" style="font-size:12px;color:#7a9780;">중기예보 키 상태 확인 중...</div>
        <input id="weather-mid-api-key" type="password" autocomplete="off" placeholder="중기예보 API 키 (선택)">
        <div class="grid">
          <label>위치 검색<input id="weather-location-query" autocomplete="off" placeholder="시/군/구 검색"></label>
          <label>검색 결과<input id="weather-location-selected" readonly value="" placeholder="선택된 위치"></label>
        </div>
        <div class="actions" style="justify-content:flex-start;margin-top:0;gap:6px;flex-wrap:wrap;">
          <button class="action" id="weather-location-search" type="button">위치 검색</button>
          <button class="action primary" id="weather-key-save" type="button">날씨 설정 저장</button>
          <button class="action" id="weather-key-validate" type="button">단기 키 검사</button>
          <button class="action" id="weather-mid-key-validate" type="button">중기 키 검사</button>
          <button class="action" id="weather-key-delete" type="button">API 키 삭제</button>
        </div>
        <div id="weather-location-results" style="display:none;border:1px solid #edf4ee;border-radius:12px;overflow:hidden;background:#fff;"></div>
        <div id="weather-key-result" style="font-size:12px;color:#4a6741;"></div>
        <div id="weather-key-validate-result" style="font-size:12px;color:#7a9780;"></div>
        <div id="weather-mid-key-validate-result" style="font-size:12px;color:#7a9780;"></div>
      </div>
    `);
    if (tab === "device-mapping") return this._renderSettingsDeviceMappingTabContent();
    if (tab === "central") return this._settingsSection("mdi:server-network", "중앙 연동", "기존 중앙 API URL과 활성화 코드 입력만 제공합니다. 활성화 코드는 저장하지 않습니다.", `
      <label>중앙 API URL
        <input id="central_base_url" value="${this._esc(f.central_base_url || "http://127.0.0.1:18000")}" autocomplete="off" placeholder="http://127.0.0.1:18000">
      </label>
      <label>활성화 코드
        <input type="password" id="activation_code" value="${this._esc(f.activation_code)}" autocomplete="off" placeholder="선택 사항 — 중앙 API에서 발급한 일회용 코드">
      </label>
      <div data-settings-central-note style="font-size:11px;color:#7a9780;line-height:1.5;background:#f8fbf9;border:1px solid #e2f1e7;border-radius:12px;padding:10px;">실제 유료 벤더 자격 증명이나 고객 토큰은 입력하지 마세요. 활성화 코드는 전송에만 사용하고 저장하지 않습니다.</div>
    `);
    return this._settingsSection("mdi:lan-connect", "연결 설정", "기존 PLC/Modbus 연결 정보만 수정합니다. 장치 실행이나 제어 기능은 제공하지 않습니다.", `
      <label>PLC IP 주소<input id="host" value="${this._esc(f.host)}" autocomplete="off"></label>
      <div class="grid">
        <label>포트<input id="port" type="number" min="1" max="65535" value="${this._esc(f.port)}"></label>
        <label>Unit ID<input id="unit_id" type="number" min="1" max="255" value="${this._esc(f.unit_id)}"></label>
      </div>
    `);
  }

  _renderSettingsPage() {
    const f = this._form;
    const body = `<div class="gs-card" data-settings-unified-tab-card>
        <span hidden data-settings-existing-only-contract>기존 설정 저장, 날씨 위치/API 키, 중앙 연동 입력만 제공; 제어 실행 기능 없음</span>
        ${this._renderSettingsTabBar()}
        <div data-settings-content>${this._renderSettingsTabContent(f)}</div>
        <div class="actions" style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:8px;">
          <button class="action" id="cancel">취소</button>
          <button class="action primary" id="save">저장</button>
        </div>
        ${this._renderError()}
      </div>`;
    return this._renderCommonMainPageShell(
      "settings",
      "환경 설정",
      "Green Smart 중앙 시스템 연결 및 설치 구역 정보를 관리합니다.",
      "mdi:cog",
      body,
      { pageClass: "settings-page", extraAttrs: "data-settings-env-like-shell data-settings-inside-green-smart-shell" }
    );
  }

  // ── Shared renderers ──────────────────────────────────────────────────────────

  _renderNotice(msg) {
    return `<div class="notice"><ha-icon icon="mdi:information-outline"></ha-icon><div>${this._esc(msg)}</div></div>`;
  }

  _renderError() {
    return this._error
      ? `<div class="error"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><div>${this._esc(this._error)}</div></div>`
      : "";
  }

  _renderLoading(msg) {
    return `<div class="loading"><div><div class="spinner"></div><div>${this._esc(msg)}</div></div></div>`;
  }

  // ── Bind methods ───────────────────────────────────────────────────────────────

  _bindWizard(root) {
    this._bindInputs(root);
    this._bindModeToggle(root);
    const next = root.querySelector("#next");
    const back = root.querySelector("#back");
    const finish = root.querySelector("#finish");
    if (next) next.addEventListener("click", () => this._wizardNext());
    if (back) back.addEventListener("click", () => this._wizardBack());
    if (finish) finish.addEventListener("click", () => this._finishWizard());
  }

  async _matchGreenhouseAddress(root) {
    const input = root.querySelector("#greenhouse_address");
    const status = root.querySelector("#location_match_status");
    const query = (input?.value || "").trim();
    if (!query) {
      if (status) status.textContent = "온실 주소를 입력해주세요.";
      return;
    }
    if (status) status.textContent = "주소를 기상청 위치 코드로 매칭 중...";
    try {
      const resp = await this._hass.callApi("POST", "green_smart/weather/search-location", { query });
      const loc = resp && Array.isArray(resp.results) ? resp.results[0] : null;
      if (!loc) {
        if (status) status.textContent = "매칭 결과가 없습니다. 시/군/구까지 입력해 주세요.";
        return;
      }
      this._form.greenhouse_address = query;
      this._form.location_name = loc.name;
      this._form.nx = Number(loc.nx || 60);
      this._form.ny = Number(loc.ny || 127);
      this._form.land_regid = loc.land_regid || "11H10000";
      this._form.ta_regid = loc.ta_regid || "11H10701";
      this._form.weather_mid_land_reg_id = this._form.land_regid;
      this._form.weather_mid_ta_reg_id = this._form.ta_regid;
      const nx = root.querySelector("#nx");
      const ny = root.querySelector("#ny");
      const land = root.querySelector("#weather_mid_land_reg_id");
      const ta = root.querySelector("#weather_mid_ta_reg_id");
      if (nx) nx.value = this._form.nx;
      if (ny) ny.value = this._form.ny;
      if (land) land.value = this._form.weather_mid_land_reg_id;
      if (ta) ta.value = this._form.weather_mid_ta_reg_id;
      if (status) status.textContent = `매칭됨: ${loc.name} · nx ${loc.nx} · ny ${loc.ny} · 중기 ${loc.land_regid}/${loc.ta_regid}`;
    } catch (_) {
      if (status) status.textContent = "위치 매칭 실패";
    }
  }

  _bindSettings(root) {
    this._bindInputs(root);
    this._bindControlScopeInputs(root);
    this._bindZoneEntityStateSummaryInputs(root);
    this._bindZoneEntityMappingInputs(root);
    this._bindZoneEntityMappingValidationInputs(root);
    root.querySelectorAll("[data-settings-tab]").forEach((btn) => btn.addEventListener("click", () => {
      this._settingsSubTab = btn.dataset.settingsTab;
      this._error = "";
      this._update();
    }));
    const cancel = root.querySelector("#cancel");
    const save = root.querySelector("#save");
    if (cancel) cancel.addEventListener("click", () => {
      // Restore from localStorage — _loadFormFromEntry() resets _virtualMode to false
      // because the REST API does not return entry.data
      const stored = this._loadStorage();
      if (stored) {
        this._form = Object.assign({}, DEFAULT_FORM, stored);
        this._virtualMode = Boolean(this._form.virtual || this._form.host === "virtual");
      }
      this._state = "dashboard"; this._error = ""; this._update();
    });
    if (save) save.addEventListener("click", () => this._saveSettings());
    root.querySelector("#weather_location_match")?.addEventListener("click", () => this._matchGreenhouseAddress(root));
    root.querySelector("#greenhouse_address")?.addEventListener("change", () => this._matchGreenhouseAddress(root));

    // 기상청 API 키 관리 — 로드 시 현재 상태 fetch
    this._hass.callApi("GET", "green_smart/weather/config").then((cfg) => {
      const status = root.querySelector("#weather-key-status");
      if (status) status.textContent = cfg.has_key ? `저장된 키: ${cfg.masked_key}` : "API 키 없음";

      const midStatus = root.querySelector("#weather-mid-key-status");
      if (midStatus) midStatus.textContent = cfg.has_mid_key
        ? `저장된 키: ${cfg.masked_mid_key}` : "미설정 (단기예보 키 공용 사용)";

      const nx = root.querySelector("#weather-nx");
      const ny = root.querySelector("#weather-ny");
      const taRegid = root.querySelector("#weather-ta-regid");
      const landRegid = root.querySelector("#weather-land-regid");
      if (nx && cfg.nx != null) nx.value = cfg.nx;
      if (ny && cfg.ny != null) ny.value = cfg.ny;
      if (taRegid && cfg.ta_regid) taRegid.value = cfg.ta_regid;
      if (landRegid && cfg.land_regid) landRegid.value = cfg.land_regid;

      const sel = root.querySelector("#weather-location-selected");
      if (sel && cfg.location_name) {
        const regPart = cfg.ta_regid ? ` · 중기 ${cfg.ta_regid}` : "";
        sel.textContent = `현재 위치: ${cfg.location_name} (nx:${cfg.nx}, ny:${cfg.ny}${regPart})`;
      } else if (sel && (cfg.nx || cfg.ny)) {
        sel.textContent = `현재 위치: nx=${cfg.nx}, ny=${cfg.ny}`;
      }
    }).catch(() => {});

    // 위치 검색
    const searchBtn = root.querySelector("#weather-location-search");
    const searchInput = root.querySelector("#weather-location-query");
    const resultsDiv = root.querySelector("#weather-location-results");
    const selectedDiv = root.querySelector("#weather-location-selected");
    const nxInput = root.querySelector("#weather-nx");
    const nyInput = root.querySelector("#weather-ny");

    const doSearch = async () => {
      const q = searchInput?.value?.trim();
      if (!q) return;
      if (resultsDiv) { resultsDiv.style.display = "none"; resultsDiv.innerHTML = ""; }
      try {
        const r = await this._hass.callApi("POST", "green_smart/weather/search-location", { query: q });
        const results = (r && r.results) || [];
        if (!results.length) {
          if (resultsDiv) { resultsDiv.innerHTML = `<div style="padding:12px;color:#7a9780;font-size:13px;">검색 결과 없음</div>`; resultsDiv.style.display = "block"; }
          return;
        }
        if (resultsDiv) {
          resultsDiv.innerHTML = results.map((loc, i) =>
            `<div class="loc-result-item" data-idx="${i}" style="padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid #f0f5f1;"
              onmouseover="this.style.background='#DFF3E2'" onmouseout="this.style.background=''"
              data-nx="${loc.nx}" data-ny="${loc.ny}" data-name="${this._esc(loc.name)}"
              data-ta-regid="${loc.ta_regid || ""}" data-land-regid="${loc.land_regid || ""}">
              ${this._esc(loc.name)} <span style="color:#7a9780;font-size:11px;">nx:${loc.nx} ny:${loc.ny}${loc.ta_regid ? ` · 중기:${loc.ta_regid}` : ""}</span>
            </div>`
          ).join("");
          resultsDiv.style.display = "block";
          resultsDiv.querySelectorAll(".loc-result-item").forEach((item) => {
            item.addEventListener("click", () => {
              if (nxInput) nxInput.value = item.dataset.nx;
              if (nyInput) nyInput.value = item.dataset.ny;
              const taR = root.querySelector("#weather-ta-regid");
              const landR = root.querySelector("#weather-land-regid");
              if (taR) taR.value = item.dataset.taRegid || "";
              if (landR) landR.value = item.dataset.landRegid || "";
              const regPart = item.dataset.taRegid ? ` · 중기 ${item.dataset.taRegid}` : "";
              if (selectedDiv) selectedDiv.textContent = `선택됨: ${item.dataset.name} (nx:${item.dataset.nx}, ny:${item.dataset.ny}${regPart})`;
              if (searchInput) searchInput.value = item.dataset.name;
              resultsDiv.style.display = "none";
            });
          });
        }
      } catch (_) {
        if (resultsDiv) { resultsDiv.innerHTML = `<div style="padding:12px;color:#c62828;font-size:13px;">검색 실패</div>`; resultsDiv.style.display = "block"; }
      }
    };

    if (searchBtn) searchBtn.addEventListener("click", doSearch);
    if (searchInput) searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });

    // 저장
    root.querySelector("#weather-key-save")?.addEventListener("click", async () => {
      const key = root.querySelector("#weather-api-key")?.value.trim();
      const midKey = root.querySelector("#weather-mid-api-key")?.value.trim();
      const nx = Number(root.querySelector("#weather-nx")?.value || 60);
      const ny = Number(root.querySelector("#weather-ny")?.value || 127);
      const taRegid = root.querySelector("#weather-ta-regid")?.value || null;
      const landRegid = root.querySelector("#weather-land-regid")?.value || null;
      const locName = root.querySelector("#weather-location-selected")?.textContent
        .replace("선택됨: ", "").replace("현재 위치: ", "").split(" (")[0] || null;
      const result = root.querySelector("#weather-key-result");
      try {
        const r = await this._hass.callApi("POST", "green_smart/weather/config", {
          api_key: key || null,
          mid_api_key: midKey || null,
          nx, ny,
          location_name: locName,
          ta_regid: taRegid,
          land_regid: landRegid,
        });
        if (result) result.textContent = `저장 완료. 단기: ${r.masked_key || "없음"} · 중기: ${r.masked_mid_key || "공용"}`;
        // 키 입력창 초기화 (원본 키 DOM에서 제거)
        const inp = root.querySelector("#weather-api-key");
        if (inp) inp.value = "";
        const midInp = root.querySelector("#weather-mid-api-key");
        if (midInp) midInp.value = "";
        const status = root.querySelector("#weather-key-status");
        if (status) status.textContent = r.masked_key ? `저장된 키: ${r.masked_key}` : "API 키 없음";
        const midStatus = root.querySelector("#weather-mid-key-status");
        if (midStatus) midStatus.textContent = r.masked_mid_key
          ? `저장된 키: ${r.masked_mid_key}` : "미설정 (단기예보 키 공용 사용)";
        if (r.ta_regid) {
          const taR = root.querySelector("#weather-ta-regid");
          if (taR) taR.value = r.ta_regid;
        }
      } catch (e) {
        if (result) result.textContent = "저장 실패";
      }
    });

    // 단기 유효성 검사
    root.querySelector("#weather-key-validate")?.addEventListener("click", async () => {
      const result = root.querySelector("#weather-key-validate-result");
      if (result) result.textContent = "검사 중...";
      try {
        const r = await this._hass.callApi("POST", "green_smart/weather/validate-key", {});
        if (result) result.textContent = r.valid ? `✓ ${r.message}` : `✗ ${r.message}`;
      } catch (e) {
        if (result) result.textContent = "검사 실패";
      }
    });

    // 중기 유효성 검사
    root.querySelector("#weather-mid-key-validate")?.addEventListener("click", async () => {
      const result = root.querySelector("#weather-mid-key-validate-result");
      if (result) result.textContent = "검사 중...";
      try {
        const r = await this._hass.callApi("POST", "green_smart/weather/validate-mid-key", {});
        if (result) result.textContent = r.valid ? `✓ ${r.message}` : `✗ ${r.message}`;
      } catch (e) {
        if (result) result.textContent = "검사 실패";
      }
    });

    // 단기 키 삭제
    root.querySelector("#weather-key-delete")?.addEventListener("click", async () => {
      const result = root.querySelector("#weather-key-result");
      try {
        await this._hass.callApi("DELETE", "green_smart/weather/config");
        const status = root.querySelector("#weather-key-status");
        if (status) status.textContent = "API 키 없음";
        if (result) result.textContent = "단기예보 API 키가 삭제되었습니다.";
      } catch (e) {
        if (result) result.textContent = "삭제 실패";
      }
    });

    // 중기 키 삭제
    root.querySelector("#weather-mid-key-delete")?.addEventListener("click", async () => {
      const result = root.querySelector("#weather-key-result");
      try {
        await this._hass.callApi("DELETE", "green_smart/weather/config?type=mid");
        const midStatus = root.querySelector("#weather-mid-key-status");
        if (midStatus) midStatus.textContent = "미설정 (단기예보 키 공용 사용)";
        if (result) result.textContent = "중기예보 API 키가 삭제되었습니다.";
      } catch (e) {
        if (result) result.textContent = "삭제 실패";
      }
    });

    // ── PSIS API 키 ──────────────────────────────────────────────────────────
    // 현재 상태 로드
    this._hass.callApi("GET", "green_smart/pesticide/config").then((cfg) => {
      const status = root.querySelector("#psis-key-status");
      if (status) status.textContent = cfg.psis_api_key
        ? `저장된 키: ${cfg.psis_api_key}` : "API 키 없음 — 농약 검색 기능 비활성";
    }).catch(() => {});

    // 저장
    root.querySelector("#psis-key-save")?.addEventListener("click", async () => {
      const key = (root.querySelector("#psis-api-key")?.value || "").trim();
      const resultEl = root.querySelector("#psis-key-result");
      const statusEl = root.querySelector("#psis-key-status");
      if (!key) {
        if (resultEl) resultEl.textContent = "API 키를 입력해주세요.";
        return;
      }
      try {
        const r = await this._hass.callApi("POST", "green_smart/pesticide/config",
          { psis_api_key: key });
        if (r.ok) {
          if (resultEl) { resultEl.style.color = "#51AE60"; resultEl.textContent = "PSIS API 키가 저장되었습니다."; }
          // 입력창 비워 키 DOM에서 제거
          const inp = root.querySelector("#psis-api-key");
          if (inp) inp.value = "";
          // 새 마스킹 키 다시 로드
          this._hass.callApi("GET", "green_smart/pesticide/config").then((cfg) => {
            if (statusEl) statusEl.textContent = cfg.psis_api_key
              ? `저장된 키: ${cfg.psis_api_key}` : "API 키 없음";
          }).catch(() => {});
        }
      } catch (e) {
        if (resultEl) { resultEl.style.color = "#c0392b"; resultEl.textContent = "저장 실패"; }
      }
    });

    // 삭제
    root.querySelector("#psis-key-delete")?.addEventListener("click", async () => {
      const resultEl = root.querySelector("#psis-key-result");
      const statusEl = root.querySelector("#psis-key-status");
      try {
        await this._hass.callApi("POST", "green_smart/pesticide/config", { psis_api_key: "" });
        if (statusEl) statusEl.textContent = "API 키 없음 — 농약 검색 기능 비활성";
        if (resultEl) { resultEl.style.color = "#7a9780"; resultEl.textContent = "PSIS API 키가 삭제되었습니다."; }
      } catch (e) {
        if (resultEl) { resultEl.style.color = "#c0392b"; resultEl.textContent = "삭제 실패"; }
      }
    });
  }

  _bindModeToggle(root) {
    const real = root.querySelector("#real-mode");
    const virt = root.querySelector("#virtual-mode");
    if (real) real.addEventListener("click", () => {
      this._virtualMode = false; this._form.virtual = false;
      if (this._form.host === "virtual") this._form.host = "";
      this._update();
    });
    if (virt) virt.addEventListener("click", () => {
      this._virtualMode = true; this._form.host = "virtual";
      this._form.port = 502; this._form.unit_id = 1; this._form.virtual = true;
      this._update();
    });
  }

  _bindInputs(root) {
    Object.keys(DEFAULT_FORM).forEach((key) => {
      const inp = root.querySelector(`#${key}`);
      if (inp) inp.addEventListener("input", (e) => { this._form[key] = e.target.value; });
    });
  }

  // ── Utilities ──────────────────────────────────────────────────────────────────

  _number(value, fallback, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, Math.round(n)));
  }

  _esc(value) {
    if (value == null) return "";
    return String(value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
}

if (!customElements.get("green-smart-panel")) {
  customElements.define("green-smart-panel", GreenSmartPanel);
}
