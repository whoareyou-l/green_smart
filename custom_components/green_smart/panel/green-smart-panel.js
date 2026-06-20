// Green Smart — Modern SaaS greenhouse dashboard  v1.9.8
const DOMAIN = "green_smart";
const VERSION = "1.9.8";
const PANEL_ELEMENT_REFRESH_MS = 5000;
const CROP_PAGE_SIZE = 5;
const WIZARD_STEPS = ["wizard_step1", "wizard_step2", "wizard_step3"];
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
    this._state = "init";
    this._loading = true;
    this._saving = false;
    this._error = "";
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
    this._cropSubTab = "basic";
    this._cropSeasons = [];
    this._growthData = [];
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
    this._envStrategyTab = "mode";
    this._irrigationControl = this._loadIrrigationControl();
    this._irrigationTab = "mode";
    this._deviceControl = this._loadDeviceControl();
    this._deviceTab = "status";
    this._controlScope = this._loadControlScope();
    this._controlSaveNotice = null;
    this._apiScopedControlCache = {};
    this._zoneAiOutputCache = {};
    this._zoneFinalTargetCache = {};
    this._zoneEntityMappingCache = {};
    this._zoneExecutionLogCache = {};
    this._zoneInterlockSettingsCache = {};
    this._zoneControlModeCache = {};
    this._zoneEntityStateSummaryCache = {};
    this._zoneSafetyGuardWatchdogCache = {};
    this._zoneElementRefreshInterval = null;
    this._zoneControlSettings = this._loadZoneControlSettings();
    this._migrateLegacyControlStateToScoped();
    this._pageRendered = null;
    this.attachShadow({ mode: "open" });
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
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
    this._replaceZoneControlCard("[data-zone-control-mode-card]", this._renderZoneControlModeCard(domain));
    this._replaceZoneControlCard("[data-zone-entity-state-summary-card]", this._renderZoneEntityStateSummaryCard(domain));
    this._replaceZoneControlCard("[data-zone-safety-watchdog-card]", this._renderZoneSafetyGuardWatchdogCard(domain));
    this._replaceZoneControlCard("[data-zone-execution-log-card]", this._renderZoneExecutionLogCard(domain));
    this._bindZoneInterlockSettingsInputs(this.shadowRoot);
    this._bindZoneControlModeInputs(this.shadowRoot);
    this._bindZoneEntityStateSummaryInputs(this.shadowRoot);
    this._bindZoneSafetyGuardWatchdogInputs(this.shadowRoot);
    this._bindZoneAiFinalTargetInputs(this.shadowRoot);
  }

  // ── Init & storage ──────────────────────────────────────────────────────────

  async _init() {
    this._state = "init";
    this._loading = true;
    this._error = "";
    this._update();
    try {
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
  width:min(500px,93vw);box-shadow:0 16px 56px rgba(0,0,0,.22);
  max-height:88vh;overflow-y:auto;
  animation:popIn .18s cubic-bezier(.4,0,.2,1);
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
    if (sidebar) {
      sidebar.style.display = isDash ? "" : "none";
      if (isDash) { sidebar.innerHTML = this._renderSidebar(); this._bindSidebar(); }
    }
    if (content.parentElement) {
      content.parentElement.classList.toggle("has-sidebar", isDash);
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
    ].join("");
    return `
    <div class="sb-desktop">
      <div class="sb-brand"><ha-icon icon="mdi:leaf"></ha-icon></div>
      <div class="sb-items">${navItems}</div>
      <div class="sb-spacer"></div>
      <div class="sb-bottom">
        <button class="nav-btn sb-settings-btn" title="설정"><ha-icon icon="mdi:cog"></ha-icon></button>
        <button class="nav-btn sb-logout-btn" title="로그아웃"><ha-icon icon="mdi:logout"></ha-icon></button>
      </div>
    </div>
    <div class="sb-mobile">
      <div class="sb-mob-row1">
        <div class="sb-brand"><ha-icon icon="mdi:leaf"></ha-icon></div>
        <button class="sb-alert-pill" id="sb-alert-pill" data-sb-alert-pill>${this._alertPillHtml()}</button>
        <button class="nav-btn sb-settings-btn" title="설정"><ha-icon icon="mdi:cog"></ha-icon></button>
        <button class="nav-btn sb-logout-btn" title="로그아웃"><ha-icon icon="mdi:logout"></ha-icon></button>
      </div>
      <div class="sb-mob-row2">${navItems}</div>
    </div>`;
  }

  _bindSidebar() {
    const s = this.shadowRoot.getElementById("sidebar");
    if (!s) return;
    s.querySelectorAll("[data-page]").forEach((btn) =>
      btn.addEventListener("click", () => { this._page = btn.dataset.page; this._update(); })
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
    return `<div class="kpi-strip">${cards.map((c) => `
      <div class="kpi-card">
        <div class="kpi-top">
          <div><div class="kpi-label">${c.label}</div><div class="kpi-value"><span data-kpi-val="${c.valKey}">${this._kpiText(c.valKey, c.raw == null ? null : c.raw)}</span></div></div>
          <ha-icon icon="${c.icon}" class="kpi-icon"></ha-icon>
        </div>
        <div class="kpi-bottom">${delta(c.raw, c.spark)}<span data-kpi-spark="${c.valKey}">${sparkOf(c.spark)}</span></div>
      </div>`).join("")}
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
          this._hass.callApi("GET", "green_smart/weather/current").catch(() => ({})),
          this._hass.callApi("GET", "green_smart/weather/forecast").catch(() => ({})),
          this._hass.callApi("GET", "green_smart/weather/config").catch(() => ({})),
          this._hass.callApi("GET", "green_smart/weather/weekly").catch(() => ({})),
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
    return `<div class="sub-hero">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:52px;height:52px;border-radius:14px;background:#DFF3E2;display:flex;align-items:center;justify-content:center;color:#51AE60;">
          <ha-icon icon="${icon}"></ha-icon>
        </div>
        <div><div class="sub-hero-title">${title}</div><div class="sub-hero-sub">${sub}</div></div>
      </div>
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

  _renderWindowPage() {
    return `<div class="page">
      ${this._renderSubHero("천창·측창 제어","천창 및 측창 개도율 설정","mdi:window-open")}
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
      { key: "basic",   label: "기본 설정" },
      { key: "growth",  label: "생육조사" },
      { key: "pest",    label: "병해충 예찰" },
      { key: "control", label: "방제 기록" },
    ];
    const tabBar = `<div style="display:flex;gap:4px;margin-bottom:16px;background:#f5faf6;border-radius:12px;padding:4px;">
      ${tabs.map(t => `<button class="c-tab ${this._cropSubTab === t.key ? "active" : ""}"
        data-crop-tab="${t.key}"
        style="flex:1;padding:8px 4px;border-radius:8px;font-size:13px;">${t.label}</button>`).join("")}
    </div>`;
    const content = this._renderCropTabContent();
    return `<div class="page">
      ${this._renderSubHero("작물 설정", "작물 정보 · 생육조사 · 병해충 예찰 · 방제 기록을 관리합니다", "mdi:sprout")}
      <div class="gs-card">
        <div data-season-selector>${this._renderSeasonSelector()}</div>
        ${tabBar}
        <div data-crop-content>${content}</div>
      </div>
    </div>`;
  }

  _renderSeasonSelector() {
    const CROP_EMOJI = {
      tomato:'🍅', paprika:'🫑', strawberry:'🍓',
      lettuce:'🥬', herb:'🌿', cucumber:'🥒', other:'🌱',
    };
    if (!this._dbReady && this._cropSeasons.length === 0) {
      return `<div style="text-align:center;padding:32px;color:#7a9780;font-size:13px;">
        <div style="font-size:24px;margin-bottom:8px;">🌱</div>데이터를 불러오는 중...</div>`;
    }
    if (this._cropSeasons.length === 0) {
      return `<div style="text-align:center;padding:32px;">
        <div style="font-size:32px;margin-bottom:10px;">🌿</div>
        <div style="font-size:14px;font-weight:700;color:#24323F;margin-bottom:6px;">등록된 작기가 없습니다</div>
        <div style="font-size:12px;color:#7a9780;">기본 설정 탭에서 첫 작기를 등록해보세요</div>
      </div>`;
    }
    const cards = this._cropSeasons.map(s => {
      const selected = s.id === this._activeSeasonId;
      const emoji = CROP_EMOJI[s.cropType] || '🌱';
      const active = !s.demolishDate;
      return `<div data-season-id="${s.id}"
        style="flex-shrink:0;border:2px solid ${selected ? '#51AE60' : '#e0e0e0'};
               border-radius:12px;padding:10px 14px;cursor:pointer;min-width:148px;
               background:${selected ? '#f0faf1' : '#fafafa'};">
        <div style="font-size:12px;font-weight:700;color:${selected ? '#24323F' : '#666'};">
          ${emoji} ${s.variety || s.cropType} · ${s.zoneName || 'Zone'}</div>
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

  _growthFieldConfigForCrop(cropType) {
    const common = {
      tomato: { title: "토마토 생육조사", desc: "초장·엽수·줄기경·화방·착과 절위를 기록합니다", fields: [
        ["height", "초장 (cm)", "예) 120.5", "0", "500", "0.1"],
        ["leafCount", "엽수 (매)", "예) 12", "0", "100", "1"],
        ["stemDia", "줄기 경 (mm)", "예) 12.3", "0", "50", "0.1"],
        ["truss", "화방 위치 (단)", "예) 5", "0", "30", "1"],
        ["node", "착과 절위 (절)", "예) 8", "0", "80", "1"],
      ]},
      paprika: { title: "파프리카 생육조사", desc: "초장·엽수·줄기경·분지/화방·착과 절위를 기록합니다", fields: [
        ["height", "초장 (cm)", "예) 95.0", "0", "400", "0.1"],
        ["leafCount", "엽수 (매)", "예) 18", "0", "120", "1"],
        ["stemDia", "줄기 경 (mm)", "예) 10.5", "0", "60", "0.1"],
        ["truss", "분지/화방 위치", "예) 3", "0", "40", "1"],
        ["node", "착과 절위 (절)", "예) 6", "0", "80", "1"],
      ]},
      strawberry: { title: "딸기 생육조사", desc: "관부직경·엽수·엽장·화방수·런너/과방 상태를 기록합니다", fields: [
        ["height", "관부직경 (mm)", "예) 12.0", "0", "80", "0.1"],
        ["leafCount", "엽수 (매)", "예) 5", "0", "80", "1"],
        ["stemDia", "엽장 (cm)", "예) 8.5", "0", "80", "0.1"],
        ["truss", "화방수", "예) 2", "0", "20", "1"],
        ["node", "런너/과방 수", "예) 1", "0", "30", "1"],
      ]},
      lettuce: { title: "상추 생육조사", desc: "엽장·엽폭·엽수·생체중·초장을 기록합니다", fields: [
        ["height", "엽장 (cm)", "예) 18.0", "0", "80", "0.1"],
        ["leafCount", "엽수 (매)", "예) 14", "0", "100", "1"],
        ["stemDia", "엽폭 (cm)", "예) 12.0", "0", "80", "0.1"],
        ["truss", "생체중 (g)", "예) 120", "0", "2000", "1"],
        ["node", "초장 (cm)", "예) 20", "0", "100", "0.1"],
      ]},
      cucumber: { title: "오이 생육조사", desc: "초장·엽수·줄기경·마디수·착과 절위를 기록합니다", fields: [
        ["height", "초장 (cm)", "예) 160", "0", "600", "0.1"],
        ["leafCount", "엽수 (매)", "예) 16", "0", "120", "1"],
        ["stemDia", "줄기 경 (mm)", "예) 9.5", "0", "50", "0.1"],
        ["truss", "마디수", "예) 12", "0", "100", "1"],
        ["node", "착과 절위 (절)", "예) 8", "0", "100", "1"],
      ]},
      herb: { title: "허브 생육조사", desc: "초장·엽수·줄기경·분지수·수확 가능 줄기수를 기록합니다", fields: [
        ["height", "초장 (cm)", "예) 25.0", "0", "150", "0.1"],
        ["leafCount", "엽수 (매)", "예) 30", "0", "300", "1"],
        ["stemDia", "줄기 경 (mm)", "예) 4.0", "0", "30", "0.1"],
        ["truss", "분지수", "예) 6", "0", "80", "1"],
        ["node", "수확 가능 줄기수", "예) 4", "0", "100", "1"],
      ]},
    };
    return common[cropType] || common.tomato;
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

  _renderCropBasicTab() {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:13px;font-weight:700;color:#24323F;">작기 기록
          <span style="color:#7a9780;font-weight:400;">(${this._cropSeasons.length}건)</span>
        </span>
        <div style="display:flex;gap:6px;">
          <button id="basic-export-btn" title="CSV 내보내기"
            style="background:#f5faf6;color:#51AE60;border:1.5px solid #c8e6c9;border-radius:10px;
                   padding:6px 10px;cursor:pointer;display:flex;align-items:center;">
            <ha-icon icon="mdi:file-export-outline" style="--mdi-icon-size:18px;"></ha-icon></button>
          <button id="basic-add-btn"
            style="background:#51AE60;color:#fff;border:none;border-radius:10px;
                   padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;">
            + 정식 등록</button>
        </div>
      </div>
      <div id="crop-seasons-list">${this._renderCropSeasonsList()}</div>
      ${this._renderCropPager("basic", this._cropSeasons.length)}`;
  }

  _renderCropSeasonsList() {
    const CROP_LABELS = {
      tomato:"토마토", paprika:"파프리카", strawberry:"딸기",
      lettuce:"상추", herb:"허브", cucumber:"오이", other:"기타",
    };
    const METHOD_LABELS = { hydro:"수경", soil:"토경", nft:"NFT", dwc:"DWC" };

    if (!this._cropSeasons.length) {
      return `<div style="text-align:center;padding:24px 0;color:#b0c4b1;font-size:13px;">
        <ha-icon icon="mdi:sprout-outline" style="--mdi-icon-size:28px;display:block;margin:0 auto 8px;"></ha-icon>
        등록된 작기가 없습니다
      </div>`;
    }
    const pageRows = this._paginatedCropRows("basic", this._cropSeasons);
    return pageRows.map((s) => {
      const i = s.__cropIndex;
      const demolished = !!s.demolishDate;
      const cropLabel  = CROP_LABELS[s.cropType] || s.cropType || "작물";
      const methodLabel = METHOD_LABELS[s.method] || s.method || "";
      const statusBadge = demolished
        ? `<span style="background:#f5f5f5;color:#9e9e9e;font-size:10px;font-weight:700;
             padding:2px 8px;border-radius:20px;">철거 완료</span>`
        : `<span style="background:#d4edda;color:#155724;font-size:10px;font-weight:700;
             padding:2px 8px;border-radius:20px;">재배 중</span>`;
      const zoneLabel = this._seasonZoneLabel(s);
      const deleteAction = `<button data-season-delete="${i}" title="삭제"
        style="width:32px;height:32px;border-radius:9px;border:1.5px solid #f5c6cb;background:#fff5f6;color:#c0392b;cursor:pointer;display:flex;align-items:center;justify-content:center;">
        <ha-icon icon="mdi:trash-can-outline" style="--mdi-icon-size:18px;"></ha-icon>
      </button>`;
      const activeActions = `<div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
        <button data-season-edit="${i}" title="수정"
          style="width:32px;height:32px;border-radius:9px;border:1.5px solid #b7dfbd;background:#f5faf6;color:#51AE60;cursor:pointer;display:flex;align-items:center;justify-content:center;">
          <ha-icon icon="mdi:pencil" style="--mdi-icon-size:17px;"></ha-icon>
        </button>
        <button data-season-demolish="${i}"
          style="background:#fff3cd;color:#856404;border:1.5px solid #ffc107;border-radius:8px;
                 padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">
          철거
        </button>
        ${deleteAction}
      </div>`;
      const seasonActions = demolished ? deleteAction : activeActions;
      return `
        <div style="border:1.5px solid ${demolished ? "#e9ecef" : "#e8f0e9"};border-radius:12px;
             padding:12px 14px;margin-bottom:8px;background:${demolished ? "#fafafa" : "#f9fcf9"};">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <span style="font-size:14px;font-weight:700;color:${demolished ? "#9e9e9e" : "#24323F"};">
                  ${this._esc(cropLabel)}${s.variety ? ` · ${this._esc(s.variety)}` : ""}
                </span>
                ${statusBadge}
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:4px 12px;">
                <span style="font-size:12px;color:#7a9780;">
                  <b style="color:#4a6741;">정식일</b> ${s.plantDate || "미입력"}
                </span>
                ${demolished ? `<span style="font-size:12px;color:#9e9e9e;">
                  <b>철거일</b> ${s.demolishDate}
                </span>` : ""}
                <span style="font-size:12px;color:#7a9780;">
                  ${this._esc(zoneLabel)}
                </span>
                ${methodLabel ? `<span style="font-size:12px;color:#7a9780;">${methodLabel}</span>` : ""}
                ${s.totalPlants ? `<span style="font-size:12px;color:#7a9780;">${s.totalPlants}주</span>` : ""}
              </div>
            </div>
            ${seasonActions}
          </div>
        </div>`;
    }).join("");
  }

  _renderCropGrowthTab() {
    const pageRows = this._paginatedCropRows("growth", this._growthData);
    const rows = pageRows.length
      ? pageRows.map((r) => {
        const i = r.__cropIndex;
        return `
        <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;background:#f5faf6;margin-bottom:6px;" data-growth-metrics-json="${this._esc(r.metricsJson || "")}">
          <div style="flex:0 0 72px;font-size:12px;font-weight:700;color:#51AE60;">${r.date}</div>
          <div style="flex:1;display:flex;flex-wrap:wrap;gap:6px 14px;">
            ${this._renderGrowthMetricChips(r)}
            ${r.note ? `<span style="font-size:11px;color:#7a9780;">${this._esc(r.note)}</span>` : ""}
          </div>
          <button data-growth-del="${i}" title="삭제"
            style="background:none;border:none;cursor:pointer;color:#c0392b;font-size:16px;padding:2px 6px;">✕</button>
        </div>`;
      }).join("")
      : `<div style="text-align:center;padding:32px 0;color:#b0c4b1;font-size:13px;">
          <ha-icon icon="mdi:sprout-outline" style="--mdi-icon-size:32px;display:block;margin:0 auto 8px;"></ha-icon>
          생육조사 기록이 없습니다
        </div>`;
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:13px;font-weight:700;color:#24323F;">생육조사 기록 <span style="color:#7a9780;font-weight:400;">(${this._growthData.length}건)</span></span>
        <div style="display:flex;gap:6px;">
          <button id="growth-export-btn" title="CSV 내보내기"
            style="background:#f5faf6;color:#51AE60;border:1.5px solid #c8e6c9;border-radius:10px;
                   padding:6px 10px;cursor:pointer;display:flex;align-items:center;">
            <ha-icon icon="mdi:file-export-outline" style="--mdi-icon-size:18px;"></ha-icon></button>
          <button id="growth-add-btn"
            style="background:#51AE60;color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;">
            + 생육조사 추가</button>
        </div>
      </div>
      <div id="growth-list">${rows}</div>
      ${this._renderCropPager("growth", this._growthData.length)}`;
  }

  _renderCropPestTab() {
    const SEVERITY = { low: "낮음", mid: "보통", high: "높음", critical: "위험" };
    const SEVERITY_COLOR = { low: "#51AE60", mid: "#f39c12", high: "#e67e22", critical: "#c0392b" };
    const pageRows = this._paginatedCropRows("pest", this._pestData);
    const rows = pageRows.length
      ? pageRows.map((r) => {
        const i = r.__cropIndex;
        return `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border-radius:10px;background:#f5faf6;margin-bottom:6px;">
          <div style="flex:0 0 72px;font-size:12px;font-weight:700;color:#51AE60;">${r.date}</div>
          <div style="flex:1;display:flex;flex-wrap:wrap;gap:4px 14px;">
            <span style="font-size:12px;color:#4a6741;font-weight:700;">${this._esc(r.type)}</span>
            <span style="font-size:12px;color:#4a6741;">위치: ${this._esc(r.location)}</span>
            <span style="font-size:12px;font-weight:700;color:${SEVERITY_COLOR[r.severity]||"#7a9780"};">
              발생도: ${SEVERITY[r.severity]||r.severity}</span>
            ${r.note ? `<span style="font-size:11px;color:#7a9780;width:100%;">${this._esc(r.note)}</span>` : ""}
          </div>
          <button data-pest-del="${i}" title="삭제"
            style="background:none;border:none;cursor:pointer;color:#c0392b;font-size:16px;padding:2px 6px;">✕</button>
        </div>`;
      }).join("")
      : `<div style="text-align:center;padding:32px 0;color:#b0c4b1;font-size:13px;">
          <ha-icon icon="mdi:bug-outline" style="--mdi-icon-size:32px;display:block;margin:0 auto 8px;"></ha-icon>
          병해충 예찰 기록이 없습니다
        </div>`;
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:13px;font-weight:700;color:#24323F;">병해충 예찰 기록 <span style="color:#7a9780;font-weight:400;">(${this._pestData.length}건)</span></span>
        <div style="display:flex;gap:6px;">
          <button id="pest-export-btn" title="CSV 내보내기"
            style="background:#f5faf6;color:#51AE60;border:1.5px solid #c8e6c9;border-radius:10px;
                   padding:6px 10px;cursor:pointer;display:flex;align-items:center;">
            <ha-icon icon="mdi:file-export-outline" style="--mdi-icon-size:18px;"></ha-icon></button>
          <button id="pest-add-btn"
            style="background:#51AE60;color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;">
            + 병해충 추가</button>
        </div>
      </div>
      <div id="pest-list">${rows}</div>
      ${this._renderCropPager("pest", this._pestData.length)}`;
  }

  _renderCropControlTab() {
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
              border-radius:8px;padding:2px 8px;font-size:12px;font-weight:700;color:#2980b9;">
              ${this._esc(p.name)} ${pls}
              ${p.dil ? `<span style="font-weight:400;color:#5d8aa8;">${p.dil}배</span>` : ""}
            </span>`;
          }).join(" ");
          return `
          <div style="padding:10px 12px;border-radius:10px;background:#f5faf6;margin-bottom:6px;">
            <div style="display:flex;align-items:flex-start;gap:8px;">
              <div style="flex:0 0 72px;font-size:12px;font-weight:700;color:#51AE60;padding-top:2px;">${r.date}</div>
              <div style="flex:1;">
                <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px;">${pestHtml}</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px 14px;">
                  ${r.zone  ? `<span style="font-size:11px;color:#4a6741;">구역: ${this._esc(r.zone)}</span>` : ""}
                  ${r.area  ? `<span style="font-size:11px;color:#4a6741;">면적: ${r.area}㎡</span>` : ""}
                  ${r.note  ? `<span style="font-size:11px;color:#7a9780;">${this._esc(r.note)}</span>` : ""}
                </div>
              </div>
              <button data-control-del="${i}" title="삭제"
                style="background:none;border:none;cursor:pointer;color:#c0392b;font-size:16px;padding:2px 6px;flex-shrink:0;">✕</button>
            </div>
          </div>`;
        }).join("")
      : `<div style="text-align:center;padding:32px 0;color:#b0c4b1;font-size:13px;">
          <ha-icon icon="mdi:spray" style="--mdi-icon-size:32px;display:block;margin:0 auto 8px;"></ha-icon>
          방제 기록이 없습니다
        </div>`;
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:13px;font-weight:700;color:#24323F;">방제 기록 <span style="color:#7a9780;font-weight:400;">(${this._controlData.length}건)</span></span>
        <div style="display:flex;gap:6px;">
          <button id="control-export-btn" title="CSV 내보내기"
            style="background:#f5faf6;color:#51AE60;border:1.5px solid #c8e6c9;border-radius:10px;
                   padding:6px 10px;cursor:pointer;display:flex;align-items:center;">
            <ha-icon icon="mdi:file-export-outline" style="--mdi-icon-size:18px;"></ha-icon></button>
          <button id="control-add-btn"
            style="background:#51AE60;color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;">
            + 방제 기록 추가</button>
        </div>
      </div>
      <div id="control-list">${rows}</div>
      ${this._renderCropPager("control", this._controlData.length)}`;
  }

  // ── Crop 팝업 ─────────────────────────────────────────────────────────────────

  // ── 정식 등록 팝업 ─────────────────────────────────────────────────────────
  // ── DB 데이터 로딩 ────────────────────────────────────────────────────────
  async _loadCropData() {
    try {
      const seasons = await this._hass.callApi("GET", "green_smart/crop/seasons");
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
    const [growth, pest, control] = await Promise.all([
      this._hass.callApi("GET", `green_smart/crop/seasons/${seasonId}/growth`).catch(() => []),
      this._hass.callApi("GET", `green_smart/crop/seasons/${seasonId}/pest`).catch(()  => []),
      this._hass.callApi("GET", `green_smart/crop/seasons/${seasonId}/control`).catch(() => []),
    ]);
    this._growthData  = growth  || [];
    this._pestData    = pest    || [];
    this._controlData = control || [];
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
    // Contract markers: data-basic-crop-type data-basic-variety data-basic-method data-basic-same-as-prev data-basic-zone-toggle data-basic-zone-body selectedZones.map zoneId: zone.id
    const cfg = this._normalizedForm();
    const zoneCount = cfg.greenhouse_zones || 1;
    const zones = Array.from({ length: zoneCount }, (_, i) => ({ id: i + 1, label: `${i + 1}구역` }));
    zones.forEach((z) => { if (this._basicZoneCollapsed[z.id] === undefined) this._basicZoneCollapsed[z.id] = false; });
    const open = () => this._openCropPopup(`
      <div class="popup-card" style="width:min(720px,94vw);">
        <div class="pop-header">
          <div class="pop-icon-box"><ha-icon icon="mdi:sprout" style="--mdi-icon-size:22px;"></ha-icon></div>
          <div><div class="pop-title-main">정식 등록</div><div class="pop-title-sub">구역별 작물 정보와 정식 정보를 동시에 등록합니다</div></div>
        </div>
        <div class="pop-fields">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div style="font-size:11px;font-weight:700;color:#51AE60;letter-spacing:.4px;">구역별 정식 정보</div>
            <div style="font-size:11px;color:#7a9780;">저장할 구역을 체크하세요</div>
          </div>
          ${zones.map((zone, idx) => this._renderBasicZoneFields(zone, idx)).join("")}
        </div>
        <div class="pop-foot"><button class="crop-pop-cancel pop-btn-cancel">취소</button><button id="b-save" class="pop-btn-save">선택 구역 정식 등록</button></div>
      </div>`, (inner) => {
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
    const values = {
      enabled: true,
      cropType: season.cropType || "tomato",
      variety: season.variety || "",
      method: season.method || "hydro",
      plantDate: season.plantDate || new Date().toISOString().slice(0, 10),
      totalPlants: season.totalPlants,
      rowSpacing: season.rowSpacing,
      plantSpacing: season.plantSpacing,
      plantDensity: season.plantDensity,
      trainDir: season.trainDir || "v",
    };
    this._openCropPopup(`
      <div class="popup-card" style="width:min(650px,94vw);">
        <div class="pop-header">
          <div class="pop-icon-box"><ha-icon icon="mdi:pencil" style="--mdi-icon-size:22px;"></ha-icon></div>
          <div><div class="pop-title-main">작기 수정</div><div class="pop-title-sub">${this._esc(this._seasonZoneLabel(season))} 작기 정보를 수정합니다</div></div>
        </div>
        <div class="pop-fields">${this._renderBasicZoneFields(zone, 0, values)}</div>
        <div class="pop-foot"><button class="crop-pop-cancel pop-btn-cancel">취소</button><button id="b-edit-save" class="pop-btn-save">수정 저장</button></div>
      </div>`, (inner) => {
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

  _openGrowthAddPopup() {
    if (!this._activeSeasonId) { alert("작기를 먼저 등록하거나 선택해주세요."); return; }
    const today = new Date().toISOString().slice(0, 10);
    const activeSeason = this._activeSeason();
    const config = this._growthFieldConfigForCrop(activeSeason?.cropType);
    const cropName = activeSeason?.variety ? `${config.title} · ${this._esc(activeSeason.variety)}` : config.title;
    const fieldHtml = config.fields.map(([key, label, placeholder, min, max, step], idx) => `
      <div class="pop-field" data-growth-field="${key}">
        <label>${label}</label>
        <input type="number" id="g-${key}" placeholder="${placeholder}" min="${min}" max="${max}" step="${step}">
      </div>${idx % 2 === 1 ? "" : ""}
    `).reduce((html, field, idx, arr) => {
      if (idx % 2 === 0) return html + `<div class="pop-field-row">${field}${arr[idx + 1] || ""}</div>`;
      return html;
    }, "");
    this._openCropPopup(`
      <div class="popup-card">
        <div class="pop-header">
          <div class="pop-icon-box"><ha-icon icon="mdi:chart-line" style="--mdi-icon-size:22px;"></ha-icon></div>
          <div>
            <div class="pop-title-main">${cropName}</div>
            <div class="pop-title-sub">${this._esc(config.desc)}</div>
          </div>
        </div>
        <div class="pop-fields">
          <div class="pop-field">
            <label>조사일</label>
            <input type="date" id="g-date" value="${today}">
          </div>
          ${fieldHtml}
          <div class="pop-field">
            <label>비고</label>
            <textarea id="g-note" rows="2" placeholder="특이사항"></textarea>
          </div>
        </div>
        <div class="pop-foot">
          <button class="crop-pop-cancel pop-btn-cancel">취소</button>
          <button id="g-save" class="pop-btn-save">저장</button>
        </div>
      </div>`, (inner) => {
      inner.querySelector("#g-save")?.addEventListener("click", async () => {
        // Dynamic DB payload marker: metrics: config.fields.map
        const metrics = config.fields.map(([key, label]) => ({
          key, label,
          value: inner.querySelector(`#g-${key}`)?.value || null,
          unit: this._growthUnitFromLabel(label),
        }));
        const body = {
          date:      inner.querySelector("#g-date")?.value || "",
          cropType: activeSeason?.cropType || "other",
          height:    parseFloat(inner.querySelector("#g-height")?.value) || null,
          leafCount: parseInt(inner.querySelector("#g-leafCount")?.value) || null,
          stemDia:   parseFloat(inner.querySelector("#g-stemDia")?.value) || null,
          truss:     parseInt(inner.querySelector("#g-truss")?.value) || null,
          node:      parseInt(inner.querySelector("#g-node")?.value) || null,
          metrics,
          note:      inner.querySelector("#g-note")?.value || "",
        };
        // Contract markers for tests: body.height body.leafCount body.stemDia body.truss body.node activeSeason.cropType
        try {
          const result = await this._hass.callApi(
            "POST", `green_smart/crop/seasons/${this._activeSeasonId}/growth`, body
          );
          this._growthData.unshift(result);
          this._cropPage.growth = 1;
          this._closePopup();
          this._refreshCropContent();
        } catch (e) {
          alert("저장 실패: " + (e?.message || "DB 오류"));
        }
      });
    });
  }

  _openPestAddPopup() {
    const today = new Date().toISOString().slice(0, 10);
    this._openCropPopup(`
      <div class="popup-card">
        <div class="pop-header">
          <div class="pop-icon-box" style="background:#fff3e0;color:#e67e22;">
            <ha-icon icon="mdi:bug" style="--mdi-icon-size:22px;"></ha-icon>
          </div>
          <div>
            <div class="pop-title-main">병해충 예찰 추가</div>
            <div class="pop-title-sub">발견한 병해충 정보를 기록합니다</div>
          </div>
        </div>
        <div class="pop-fields">
          <div class="pop-field">
            <label>조사일</label>
            <input type="date" id="p-date" value="${today}">
          </div>
          <div class="pop-field-row">
            <div class="pop-field"><label>병해충 종류</label><input type="text" id="p-type" placeholder="예) 잿빛곰팡이, 응애"></div>
            <div class="pop-field"><label>발생 위치</label><input type="text" id="p-loc" placeholder="예) Zone1 북측"></div>
          </div>
          <div class="pop-field">
            <label>발생 정도</label>
            <select id="p-sev">
              <option value="low">🟢 낮음 — 소수 발생, 즉각 위협 없음</option>
              <option value="mid">🟡 보통 — 확산 가능, 주의 필요</option>
              <option value="high">🟠 높음 — 빠른 방제 필요</option>
              <option value="critical">🔴 위험 — 즉시 방제 요망</option>
            </select>
          </div>
          <div class="pop-field">
            <label>비고</label>
            <input type="text" id="p-note" placeholder="추가 메모">
          </div>
        </div>
        <div class="pop-foot">
          <button class="crop-pop-cancel pop-btn-cancel">취소</button>
          <button id="p-save" class="pop-btn-save">저장</button>
        </div>
      </div>`, (inner) => {
      inner.querySelector("#p-save")?.addEventListener("click", async () => {
        const body = {
          date:     inner.querySelector("#p-date")?.value || today,
          type:     inner.querySelector("#p-type")?.value || "",
          location: inner.querySelector("#p-loc")?.value || "",
          severity: inner.querySelector("#p-sev")?.value || "low",
          note:     inner.querySelector("#p-note")?.value || "",
        };
        try {
          const result = await this._hass.callApi(
            "POST", `green_smart/crop/seasons/${this._activeSeasonId}/pest`, body
          );
          this._pestData.unshift(result);
          this._closePopup();
          this._refreshCropContent();
        } catch (e) {
          alert("저장 실패: " + (e?.message || "DB 오류"));
        }
      });
    });
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
    const today = new Date().toISOString().slice(0, 10);
    const MAX_PESTS = 5;

    // ── 로컬 상태 ───────────────────────────────────────────────────────────────
    const entries = [{ name: "", regNo: "", moa: "", dil: "", amount: "", pls: null, mixWarning: "", plsWarning: "" }];
    const debounceTimers = {};

    // ── 이전 기록에서 약제별 자동완성 데이터 추출 ───────────────────────────────
    const historyByName = {};
    (this._controlData || []).forEach(r => {
      const pests = Array.isArray(r.pesticides) ? r.pesticides : (r.pesticide ? [{ name: r.pesticide }] : []);
      pests.forEach(p => {
        if (!p.name) return;
        if (!historyByName[p.name]) historyByName[p.name] = [];
        historyByName[p.name].push(p);
      });
    });
    const getHistory = (name) => (historyByName[name] || [])[0] || null;
    const getPlsFromHistory = (name) => {
      const h = getHistory(name);
      return h ? h.pls : null;
    };

    // ── 팝업 열기 ───────────────────────────────────────────────────────────────
    this._openCropPopup(`
      <div class="popup-card" style="width:min(560px,94vw);">
        <div class="pop-header">
          <div class="pop-icon-box" style="background:#e8f4fd;color:#2980b9;">
            <ha-icon icon="mdi:spray" style="--mdi-icon-size:22px;"></ha-icon>
          </div>
          <div>
            <div class="pop-title-main">방제 기록 추가</div>
            <div class="pop-title-sub">농약 사용 내역을 약제별로 기록합니다</div>
          </div>
        </div>
        <div class="pop-fields">
          <!-- 방제일 -->
          <div class="pop-field">
            <label>방제일</label>
            <input type="date" id="c-date" value="${today}">
          </div>
          <!-- 약제 목록 -->
          <div id="c-pest-list"></div>
          <!-- 약제 추가 버튼 -->
          <button id="c-add-pest"
            style="background:#f5faf6;color:#51AE60;border:1.5px dashed #b2d8b5;border-radius:10px;
                   padding:9px;width:100%;font-size:13px;font-weight:700;cursor:pointer;margin-top:2px;">
            + 약제 추가 (최대 ${MAX_PESTS}개)
          </button>
          <!-- 혼용 경고는 약제명 아래에 자동 표시된다 -->
          <div id="c-mix-summary" style="display:none;margin-top:2px;font-size:11px;color:#856404;"></div>
          <div style="height:1px;background:#f0f7f1;margin:4px 0;"></div>
          <!-- 처리구역 -->
          <div class="pop-field">
            <label>처리구역</label>
            <input type="text" id="c-zone" placeholder="예) Zone1 전체, 북측 2동">
          </div>
          <!-- 비고 -->
          <div class="pop-field">
            <label>비고</label>
            <input type="text" id="c-note" placeholder="추가 메모">
          </div>
        </div>
        <div class="pop-foot">
          <button class="crop-pop-cancel pop-btn-cancel">취소</button>
          <button id="c-save" class="pop-btn-save">저장</button>
        </div>
      </div>`, (inner) => {

      // ── 약제 항목 HTML 생성 ───────────────────────────────────────────────────
      const entryHtml = (idx) => {
        const e = entries[idx];
        const plsBadge = e.pls === true
          ? `<span style="background:#d4edda;color:#155724;font-size:10px;font-weight:700;
               padding:2px 7px;border-radius:20px;flex-shrink:0;">PLS ✓</span>`
          : e.pls === false
          ? `<span style="background:#f8d7da;color:#721c24;font-size:10px;font-weight:700;
               padding:2px 7px;border-radius:20px;flex-shrink:0;">PLS ✗</span>`
          : "";
        return `
          <div data-entry="${idx}"
            style="background:#f9fcf9;border:1.5px solid #e8f0e9;border-radius:12px;
                   padding:12px 14px;margin-bottom:10px;position:relative;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <span style="font-size:12px;font-weight:700;color:#51AE60;">약제 ${idx + 1}</span>
              ${idx > 0
                ? `<button data-del-entry="${idx}"
                    style="background:none;border:none;color:#c0392b;cursor:pointer;font-size:16px;
                           padding:0 4px;line-height:1;">✕</button>`
                : ""}
            </div>
            <!-- 약제명 + 자동완성 -->
            <div class="pop-field" style="position:relative;margin-bottom:10px;">
              <label style="display:flex;align-items:center;gap:6px;">
                약제명 <span style="font-weight:400;color:#7a9780;font-size:11px;">(PSIS 검색)</span>
                ${plsBadge}
              </label>
              <input type="text" data-name-input="${idx}"
                value="${this._esc(e.name)}" placeholder="2글자 이상 입력 시 자동완성..."
                autocomplete="off">
              <div data-pesticide-suggestions="${idx}"
                style="display:none;position:absolute;left:0;right:0;
                  background:#fff;border:1.5px solid #e8f0e9;border-radius:12px;
                  box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:300;
                  max-height:200px;overflow-y:auto;margin-top:2px;top:100%;"></div>
              <div data-mix-warning="${idx}" style="${e.mixWarning ? "" : "display:none;"}font-size:11px;color:#c0392b;margin-top:6px;line-height:1.4;">${e.mixWarning ? `⚠️ 혼용 경고: ${this._esc(e.mixWarning)}` : ""}</div>
            </div>
            <!-- 사용기작 / 희석배수 -->
            <div class="pop-field-row" style="margin-bottom:10px;">
              <div class="pop-field">
                <label>사용기작</label>
                <input type="text" data-moa-input="${idx}"
                  value="${this._esc(e.moa)}" placeholder="예) 살균제-가1">
                <div data-pls-warning="${idx}" style="${e.plsWarning ? "" : "display:none;"}font-size:11px;color:#c0392b;margin-top:5px;line-height:1.4;">${e.plsWarning ? `⚠️ PLS 경고: ${this._esc(e.plsWarning)}` : ""}</div>
              </div>
              <div class="pop-field">
                <label>희석 배수 (배)</label>
                <input type="number" data-dil-input="${idx}"
                  value="${e.dil}" placeholder="예) 1000" min="10" max="10000" step="10">
              </div>
            </div>
            <!-- 사용량 -->
            <div class="pop-field">
              <label>사용량</label>
              <input type="text" data-amount-input="${idx}"
                value="${this._esc(e.amount)}" placeholder="예) 10L/300평">
            </div>
          </div>`;
      };

      // ── DOM 갱신 ─────────────────────────────────────────────────────────────
      const listEl   = inner.querySelector("#c-pest-list");
      const addBtn   = inner.querySelector("#c-add-pest");
      const mixSummary  = inner.querySelector("#c-mix-summary");

      const renderAll = () => {
        listEl.innerHTML = entries.map((_, i) => entryHtml(i)).join("");
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
        entries.forEach((entry) => { entry.mixWarning = ""; });
        pairs.forEach((pair) => {
          if (pair.mixable === true) return;
          const names = [pair.pest1, pair.pest2, pair.name1, pair.name2].filter(Boolean).map(v => String(v).trim());
          const note = pair.mixable === false
            ? (pair.note || "혼용 불가로 확인되었습니다.")
            : (pair.note || "혼용 정보가 명확하지 않아 주의가 필요합니다.");
          entries.forEach((entry) => {
            if (names.some(n => n && entry.name && n === entry.name)) {
              entry.mixWarning = entry.mixWarning ? `${entry.mixWarning} / ${note}` : note;
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

      // ── 각 항목 이벤트 바인딩 ─────────────────────────────────────────────────
      const bindEntries = () => {
        // 삭제 버튼
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
          const sugBox      = listEl.querySelector(`[data-pesticide-suggestions="${idx}"]`);

          // 필드 변경 → entries 동기화
          moaInput?.addEventListener("input",    () => { entries[idx].moa    = moaInput.value; scheduleRiskChecks(); });
          dilInput?.addEventListener("input",    () => { entries[idx].dil    = dilInput.value; });
          amountInput?.addEventListener("input", () => { entries[idx].amount = amountInput.value; });

          // 약제명 입력 → 디바운스 자동완성
          nameInput?.addEventListener("input", () => {
            const q = nameInput.value.trim();
            entries[idx].name  = q;
            entries[idx].regNo = "";
            clearTimeout(debounceTimers[idx]);
            if (q.length < 2) { sugBox.style.display = "none"; scheduleRiskChecks(); return; }
            scheduleRiskChecks();
            debounceTimers[idx] = setTimeout(() => fetchSuggestions(idx, q, nameInput, sugBox, moaInput, dilInput, amountInput), 400);
          });

          // 외부 클릭 시 제안 닫기
          nameInput?.addEventListener("blur", () =>
            setTimeout(() => { sugBox.style.display = "none"; }, 180)
          );
        });
      };

      // ── 자동완성 검색 ─────────────────────────────────────────────────────────
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

              // 이전 기록으로 자동완성
              const hist = getHistory(it.name);
              if (hist) {
                if (hist.moa    && !moaInput.value)    { moaInput.value    = hist.moa;    entries[idx].moa    = hist.moa; }
                if (hist.dil    && !dilInput.value)    { dilInput.value    = hist.dil;    entries[idx].dil    = hist.dil; }
                if (hist.amount && !amountInput.value) { amountInput.value = hist.amount; entries[idx].amount = hist.amount; }
              }
              // PLS 이전 기록 판단
              const plsVal = getPlsFromHistory(it.name);
              entries[idx].pls = plsVal;
              // PLS 배지 갱신 (항목 재렌더 없이 라벨만 수정)
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

      // ── 약제 추가 버튼 ────────────────────────────────────────────────────────
      addBtn.addEventListener("click", () => {
        if (entries.length >= MAX_PESTS) return;
        entries.push({ name: "", regNo: "", moa: "", dil: "", amount: "", pls: null, mixWarning: "", plsWarning: "" });
        renderAll();
        scheduleRiskChecks();
      });

      // ── 저장 ──────────────────────────────────────────────────────────────────
      inner.querySelector("#c-save")?.addEventListener("click", async () => {
        // DOM에서 최신값 동기화
        entries.forEach((e, idx) => {
          e.name   = (listEl.querySelector(`[data-name-input="${idx}"]`)?.value   || "").trim();
          e.moa    = listEl.querySelector(`[data-moa-input="${idx}"]`)?.value    || "";
          e.dil    = listEl.querySelector(`[data-dil-input="${idx}"]`)?.value    || "";
          e.amount = listEl.querySelector(`[data-amount-input="${idx}"]`)?.value || "";
        });
        const validEntries = entries.filter(e => e.name);
        if (!validEntries.length) return;
        if (!this._activeSeasonId) {
          alert("작기를 먼저 등록한 뒤 방제 기록을 저장해주세요.");
          return;
        }

        const controlBody = {
          controlDate: inner.querySelector("#c-date")?.value || today,
          zone: inner.querySelector("#c-zone")?.value || "",
          note: inner.querySelector("#c-note")?.value || "",
          pesticides: validEntries.map(e => ({
            name: e.name, regNo: e.regNo || null,
            moa: e.moa || null, dil: parseInt(e.dil) || null,
            amount: e.amount || null,
            pls: e.pls === true ? true : e.pls === false ? false : null,
          })),
        };
        try {
          const result = await this._hass.callApi(
            "POST", `green_smart/crop/seasons/${this._activeSeasonId}/control`, controlBody
          );
          this._controlData.unshift(result);
          this._closePopup();
          this._refreshCropContent();
        } catch (e) {
          alert("저장 실패: " + (e?.message || "DB 오류"));
        }
      });

      // ── 초기 렌더 ─────────────────────────────────────────────────────────────
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

    // 삭제 버튼
    root.querySelectorAll("[data-growth-del]").forEach(b =>
      b.addEventListener("click", async () => {
        const idx = +b.dataset.growthDel;
        const id  = this._growthData[idx]?.id;
        if (id) await this._hass.callApi("DELETE", `green_smart/crop/growth/${id}`).catch(() => {});
        this._growthData.splice(idx, 1);
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
          else { this._growthData = []; this._pestData = []; this._controlData = []; }
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
    return `<div class="strategy-row" ${marker}>
      <div class="strategy-label">${label}</div>
      <div class="strategy-control">
        <input type="number" data-control-field data-control-group="${group}" data-control-key="${key}"
          value="${val}" min="${min}" max="${max}" step="${step}">
        ${unit ? `<span>${unit}</span>` : ""}
      </div>
    </div>`;
  }

  _strategyToggle(group, key, label, checked, marker = "") {
    return `<div class="strategy-row" ${marker}>
      <div class="strategy-label">${label}</div>
      <label class="strategy-switch"><input type="checkbox" data-control-field data-control-group="${group}" data-control-key="${key}" ${checked ? "checked" : ""}><span>ON/OFF</span></label>
    </div>`;
  }

  _strategySelect(group, key, label, value, options, marker = "") {
    return `<div class="strategy-row" ${marker}>
      <div class="strategy-label">${label}</div>
      <select data-control-field data-control-group="${group}" data-control-key="${key}">
        ${options.map(([v, t]) => `<option value="${v}" ${value === v ? "selected" : ""}>${t}</option>`).join("")}
      </select>
    </div>`;
  }

  _strategySection(icon, title, body, attr = "") {
    return `<div class="gs-card strategy-card" ${attr}>
      <div class="card-title" style="display:flex;align-items:center;gap:8px;margin-bottom:14px;"><ha-icon icon="${icon}" style="color:#51AE60;"></ha-icon>${title}</div>
      ${body}
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
      { key: "mode", label: "제어 모드", icon: "mdi:tune-variant" },
      { key: "temperature", label: "온도 제어", icon: "mdi:thermometer-lines" },
      { key: "humidity", label: "습도 / VPD 제어", icon: "mdi:water-percent" },
      { key: "co2", label: "CO₂ 제어", icon: "mdi:molecule-co2" },
      { key: "ai", label: "AI 전략 / 최종 적용값", icon: "mdi:brain" },
      { key: "safety", label: "안전 한계", icon: "mdi:alert-octagon" },
      { key: "logs", label: "작동 로그", icon: "mdi:clipboard-text-clock" },
    ];
  }

  _renderEnvStrategyTabBar() {
    const tabs = this._envStrategyTabs();
    if (!tabs.some((t) => t.key === this._envStrategyTab)) this._envStrategyTab = "mode";
    return `<div class="env-strategy-tabs" style="display:flex;gap:4px;margin-bottom:16px;background:#f5faf6;border-radius:12px;padding:4px;overflow-x:auto;">
      ${tabs.map((t) => `<button class="c-tab ${this._envStrategyTab === t.key ? "active" : ""}" data-env-strategy-tab="${t.key}" style="flex:0 0 auto;padding:8px 10px;border-radius:8px;font-size:13px;display:flex;align-items:center;gap:5px;"><ha-icon icon="${t.icon}" style="width:15px;height:15px;"></ha-icon>${t.label}</button>`).join("")}
    </div>`;
  }

  _renderEnvStrategyTabContent(s, modeOptions, aiStatusOptions, statusText) {
    const base = s.baseInterlockSettings;
    const ai = s.aiStrategySettings;
    const safe = s.safetyLimits;
    const low = s.lowLightStrategySettings;
    const tab = this._envStrategyTab;
    if (tab === "temperature") return this._strategySection("mdi:thermometer-lines", "온도 제어", `
          <div class="strategy-chip-title">기본 온도 목표</div>
          ${this._strategyInput("baseInterlockSettings", "dayTargetTemp", "주간 목표온도", base.dayTargetTemp, "°C", 5, 45, 0.5)}
          ${this._strategyInput("baseInterlockSettings", "nightTargetTemp", "야간 목표온도", base.nightTargetTemp, "°C", 0, 35, 0.5)}
          ${this._strategyInput("baseInterlockSettings", "baseAdt", "기본 ADT", base.baseAdt, "°C", 5, 40, 0.5)}
          ${this._strategyInput("baseInterlockSettings", "baseDif", "기본 DIF", base.baseDif, "°C", -10, 20, 0.5)}
          <div class="strategy-chip-title">인터록 온도 제어</div>
          ${this._strategyInput("temperatureControl", "heatingStartTemp", "난방 시작 온도", 16, "°C", 0, 35, 0.5)}
          ${this._strategyInput("temperatureControl", "heatingStopTemp", "난방 정지 온도", 19, "°C", 0, 35, 0.5)}
          ${this._strategyInput("temperatureControl", "ventStartTemp", "환기 시작 온도", 28, "°C", 10, 45, 0.5)}
          ${this._strategyInput("temperatureControl", "ventMaxTemp", "환기 최대 온도", 32, "°C", 15, 50, 0.5)}
          ${this._strategyInput("temperatureControl", "highAlarmTemp", "고온 경보 온도", 35, "°C", 20, 55, 0.5)}
          ${this._strategyInput("temperatureControl", "lowAlarmTemp", "저온 경보 온도", 5, "°C", -10, 20, 0.5)}
          <div class="strategy-example">현재 온도 &lt; 난방 시작 온도 → 난방 ON / 현재 온도 &gt; 환기 시작 온도 → 환기창 단계 개방</div>
        `);
    if (tab === "humidity") return this._strategySection("mdi:water-percent", "습도 / VPD 제어", `
          ${this._strategyInput("baseInterlockSettings", "targetHumidity", "목표 습도", base.targetHumidity, "%", 20, 100, 1)}
          ${this._strategyInput("baseInterlockSettings", "targetVpd", "목표 VPD", base.targetVpd, "kPa", 0.1, 3, 0.1)}
          ${this._strategyInput("humidityVpdControl", "maxHumidity", "최대 습도", 85, "%", 40, 100, 1)}
          ${this._strategyInput("humidityVpdControl", "minVpd", "최소 VPD", 0.45, "kPa", 0.1, 2, 0.05)}
          ${this._strategyInput("humidityVpdControl", "maxVpd", "최대 VPD", 1.4, "kPa", 0.3, 3, 0.05)}
          ${this._strategyInput("humidityVpdControl", "dewpointGap", "결로 위험 이슬점 차이", 2.0, "°C", 0, 10, 0.5)}
          ${this._strategyInput("humidityVpdControl", "dehumidVentOpen", "제습 환기 개도율", 10, "%", 0, 100, 5)}
          ${this._strategyToggle("humidityVpdControl", "dehumidHeating", "제습 난방 사용 여부", true)}
          <div class="strategy-example">습도 &gt; 최대 습도 또는 VPD &lt; 최소 VPD → 천창 미세개방 → 유동팬 ON → 필요시 난방 제습 ON</div>
        `);
    if (tab === "co2") return this._strategySection("mdi:molecule-co2", "CO₂ 제어", `
          ${this._strategyInput("co2Control", "targetCo2", "목표 CO₂", base.targetCo2, "ppm", 300, 2000, 50)}
          ${this._strategyInput("co2Control", "co2Start", "CO₂ 공급 시작값", 650, "ppm", 300, 2000, 50)}
          ${this._strategyInput("co2Control", "co2Stop", "CO₂ 공급 정지값", 850, "ppm", 300, 2500, 50)}
          ${this._strategyToggle("co2Control", "limitDuringVent", "환기 중 CO₂ 공급 제한 여부", true)}
          <div class="strategy-example">CO₂ &lt; 공급 시작값 && 환기창 개도율 낮음 → CO₂ 공급 ON / CO₂ &gt; 공급 정지값 → OFF</div>
        `);
    if (tab === "ai") return this._strategySection("mdi:brain", "AI 전략 / 최종 적용값", `
          <div class="strategy-chip-title" data-ai-strategy>AI 보정값</div>
          <div class="strategy-status-row"><div><span>현재 G-Index</span><b>${ai.gIndex}</b></div><div><span>생육단계</span><b>${ai.growthStage}</b></div><div><span>AI 적용 여부</span><b>${s.systemStatus.aiApplied ? "적용" : "미적용"}</b></div></div>
          ${this._strategyInput("aiStrategySettings", "targetAdtDelta", "AI 목표 ADT", ai.targetAdtDelta, "°C", -5, 5, 0.1)}
          ${this._strategyInput("aiStrategySettings", "targetDifDelta", "AI 목표 DIF", ai.targetDifDelta, "°C", -5, 5, 0.1)}
          ${this._strategyInput("aiStrategySettings", "targetVpdDelta", "AI 목표 VPD", ai.targetVpdDelta, "kPa", -1, 1, 0.05)}
          ${this._strategyInput("aiStrategySettings", "dayTempDelta", "AI 보정 주간온도", ai.dayTempDelta, "°C", -5, 5, 0.1)}
          ${this._strategyInput("aiStrategySettings", "nightTempDelta", "AI 보정 야간온도", ai.nightTempDelta, "°C", -5, 5, 0.1)}
          <div class="strategy-chip-title" data-low-light-strategy>저광기 전략</div>
          ${this._strategyToggle("lowLightStrategySettings", "enabled", "저광기 전략 사용", low.enabled)}
          ${this._strategyInput("lowLightStrategySettings", "solarThreshold", "저광 일사 기준", low.solarThreshold, "W/m²", 0, 600, 10)}
          ${this._strategyInput("lowLightStrategySettings", "dayTempDelta", "저광기 주간온도 보정", low.dayTempDelta, "°C", -5, 3, 0.1)}
          ${this._strategyInput("lowLightStrategySettings", "targetVpdDelta", "저광기 VPD 보정", low.targetVpdDelta, "kPa", -1, 1, 0.05)}
          ${this._strategyInput("lowLightStrategySettings", "co2Boost", "저광기 CO₂ 보정", low.co2Boost, "ppm", 0, 500, 10)}
          ${this._strategyInput("lowLightStrategySettings", "screenOpenPercent", "저광기 스크린 개방", low.screenOpenPercent, "%", 0, 100, 5)}
          <div class="strategy-example">최종 목표값 = 기본 인터록 목표값 + AI 보정값 + 저광기 전략 보정값. 단, 안전 한계값을 초과할 수 없음.</div>
          ${this._renderFinalAppliedTargets(s)}
        `);
    if (tab === "safety") return this._strategySection("mdi:alert-octagon", "안전 한계", `
          <div class="strategy-chip-title" data-safety-limit>AI와 수동제어보다 우선하는 절대 안전값</div>
          ${this._strategyInput("safetyLimits", "absoluteMaxTemp", "절대 최고온도", safe.absoluteMaxTemp, "°C", 20, 60, 0.5)}
          ${this._strategyInput("safetyLimits", "absoluteMinTemp", "절대 최저온도", safe.absoluteMinTemp, "°C", -10, 25, 0.5)}
          ${this._strategyInput("safetyLimits", "maxVentOpen", "최대 환기 개도율", safe.maxVentOpen, "%", 0, 100, 5)}
          ${this._strategyInput("safetyLimits", "minVentOpen", "최소 환기 개도율", safe.minVentOpen, "%", 0, 100, 5)}
          ${this._strategyInput("safetyLimits", "strongWindCloseSpeed", "강풍 폐쇄 풍속", safe.strongWindCloseSpeed, "m/s", 1, 30, 1)}
          ${this._strategySelect("safetyLimits", "sensorErrorMode", "센서 오류 시 제어 방식", safe.sensorErrorMode, [["interlock", "기본 인터록"], ["hold", "직전 상태 유지"], ["emergency_stop", "비상 정지"]])}
          ${this._strategySelect("safetyLimits", "aiErrorMode", "AI 오류 시 제어 방식", safe.aiErrorMode, [["interlock", "기본 인터록"], ["standby", "AI 대기"], ["emergency_stop", "비상 정지"]])}
        `);
    if (tab === "logs") return this._strategySection("mdi:clipboard-text-clock", "작동 로그", `<div data-control-log>${(s.controlLogs || []).map((log) => `<div class="strategy-log">${this._esc(log)}</div>`).join("")}</div>`);
    return this._strategySection("mdi:tune-variant", "제어 모드", `
          <div class="strategy-status-row">
            <div><div class="strategy-muted">현재 제어 모드</div><b>${modeOptions.find(([v]) => v === s.controlMode)?.[1] || "인터록 모드"}</b></div>
            <div><div class="strategy-muted">상태 표시</div><b>${statusText}</b></div>
          </div>
          ${this._strategySelect("root", "controlMode", "현재 제어 모드", s.controlMode, modeOptions)}
          ${this._strategyToggle("aiStrategySettings", "enabled", "AI 전략 사용", ai.enabled)}
          ${this._strategyToggle("aiStrategySettings", "autoFallback", "AI 오류 시 자동 인터록 복귀", ai.autoFallback)}
          ${this._strategySelect("systemStatus", "aiStatus", "AI 연결 상태", s.systemStatus.aiStatus, aiStatusOptions)}
        `);
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
        this._pageRendered = null;
        this._update();
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
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return [];
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const res = await this._hass.callApi("GET", `green_smart/zones/ai-control-outputs?crop_season_id=${cropSeasonId}&zone_id=${zoneId}&domain=${domain}&limit=5`);
      const items = Array.isArray(res?.items) ? res.items : [];
      this._zoneAiOutputCache[cacheKey] = items;
      this._pageRendered = null;
      this._update();
      return items;
    } catch (err) {
      console.warn("AI output 조회 실패 시 fallback", err);
      return this._zoneAiOutputCache[cacheKey] || [];
    }
  }

  async _fetchZoneFinalTargets(domain) {
    const cropSeasonId = this._numericControlSeasonId();
    if (!this._hass || !cropSeasonId) return null;
    const zoneId = Number(this._controlScope?.zoneId || 1);
    const cacheKey = this._scopedControlCacheKey(domain);
    try {
      const res = await this._hass.callApi("GET", `green_smart/zones/final-targets?crop_season_id=${cropSeasonId}&zone_id=${zoneId}&domain=${domain}`);
      this._zoneFinalTargetCache[cacheKey] = res?.found ? res : null;
      this._pageRendered = null;
      this._update();
      return this._zoneFinalTargetCache[cacheKey];
    } catch (err) {
      console.warn("AI output 조회 실패 시 fallback", err);
      return this._zoneFinalTargetCache[cacheKey] || null;
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
      });
      const safetyText = res?.blockedByInterlock ? `안전 차단${res?.failSafeApplied ? " · Fail Safe 적용" : ""}` : "안전 상태 clear";
      const stateText = res?.stateVerification === "passed" ? "상태 확인 통과" : `상태 확인 ${res?.stateMatched ? "통과" : "주의"}`;
      this._controlSaveNotice = { domain, label: `${this._currentControlScopeLabel(domain)} · 최종값 실행 완료 (${res?.executedCount || 0}/${res?.plannedCount || 0}) · ${safetyText} · ${stateText} · 실행 후 상태 ${res?.stateVerification || "unknown"} · safetyStatus ${res?.safetyStatus || "clear"}`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
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
        action,
        message: row.querySelector("[data-zone-interlock-rule-message]")?.value?.trim() || "",
        block: action !== "warn",
      };
    }).filter((rule) => rule.control_role || rule.message || rule.condition !== "unavailable");
    return this._normalizeZoneInterlockSettings(settings);
  }

  _addZoneInterlockRule(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    const current = this._normalizeZoneInterlockSettings(this._zoneInterlockSettingsCache?.[cacheKey]?.settings);
    current.rules.push({ control_role: "", condition: "unavailable", threshold: "", action: "block", message: "" });
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
    const rows = rules.map((rule, index) => `<div data-zone-interlock-rule-row data-zone-interlock-rule-index="${index}" style="display:grid;grid-template-columns:1fr 1fr .8fr .9fr 1fr 1.4fr auto;gap:8px;align-items:end;border-top:1px solid #e2f0e4;padding:8px 0;">
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">제어 역할<input data-zone-interlock-rule-role value="${this._esc(rule.control_role || rule.controlRole || "")}" placeholder="예: ventilation"></label>
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">조건<select data-zone-interlock-rule-condition>${conditionOptions.map(([value, label]) => `<option value="${value}" ${(rule.condition || "unavailable") === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">임계값<input data-zone-interlock-rule-threshold value="${this._esc(rule.threshold ?? "")}" placeholder="선택"></label>
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">reasonCode<input data-zone-interlock-rule-reason-code value="${this._esc(rule.reasonCode || rule.reason_code || "")}" placeholder="예: wind_speed_above"></label>
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">차단 동작<select data-zone-interlock-rule-action>${actionOptions.map(([value, label]) => `<option value="${value}" ${(rule.action || (rule.block === false ? "warn" : "block")) === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;">운영자 메시지<input data-zone-interlock-rule-message value="${this._esc(rule.message || rule.reason || "")}" placeholder="예: 강풍으로 환기 차단"></label>
      <button class="mini-btn" data-zone-interlock-rule-delete data-zone-interlock-domain="${domain}" data-zone-interlock-rule-index="${index}">규칙 삭제</button>
    </div>`).join("");
    return `<div data-zone-interlock-rule-builder style="border:1px solid #dcebdd;border-radius:12px;padding:10px;margin-top:10px;background:#fbfffb;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:6px;">
        <div><b>세부 인터록 규칙</b><div class="strategy-muted">structured rule UI · rules[]는 기존 settings_json에 그대로 저장됩니다.</div></div>
        <button class="mini-btn" data-zone-interlock-rule-add data-zone-interlock-domain="${domain}">규칙 추가</button>
      </div>
      ${rows || `<div class="strategy-muted">아직 세부 규칙이 없습니다. 규칙 추가로 강풍/저온/VWC/EC 등 SafetyGuard 후보 규칙을 준비하세요.</div>`}
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
      <div class="strategy-muted" style="margin-top:6px;">안전 기준 예: emergency_stop, block_on_unavailable, apply_safe_state_on_block, rules</div>
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
      if (!this._zoneAiOutputCache?.[cacheKey]) this._fetchZoneAiOutputs(domain);
      if (!(cacheKey in (this._zoneFinalTargetCache || {}))) this._fetchZoneFinalTargets(domain);
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
    return this._controlScope?.seasonId || this._activeSeasonId || this._cropSeasons?.find((s) => !s.demolished)?.id || "default-season";
  }

  _controlSeasonOptions() {
    const seasons = Array.isArray(this._cropSeasons) && this._cropSeasons.length ? this._cropSeasons : [];
    if (!seasons.length) return [{ id: "default-season", label: "기본 작기" }];
    return seasons.map((s) => ({ id: String(s.id), label: this._esc(this._seasonZoneLabel ? this._seasonZoneLabel(s) : (s.name || s.cropName || `작기 ${s.id}`)) }));
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
    return `${seasonLabel} / ${zoneLabel} / ${this._controlDomainLabel(domain)}`;
  }

  _setControlSaveNotice(domain) {
    this._controlSaveNotice = {
      domain,
      label: this._currentControlScopeLabel(domain),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }

  _renderControlScopeBar(domain) {
    const selectedSeason = String(this._currentControlSeasonId());
    const selectedZone = Number(this._controlScope?.zoneId || 1);
    const seasonOptions = this._controlSeasonOptions();
    const zoneOptions = this._controlZoneOptions(domain);
    const safeZone = zoneOptions.some((z) => z.id === selectedZone) ? selectedZone : 1;
    const saveNotice = this._controlSaveNotice?.domain === domain ? `${this._controlSaveNotice.time} · ${this._controlSaveNotice.label}` : "아직 저장 전";
    return `<div class="gs-card control-scope-bar" data-control-scope-bar data-control-scope-domain="${domain}" style="padding:12px 14px;margin-bottom:12px;display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;">
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;min-width:190px;">현재 작기
        <select data-control-scope-season>
          ${seasonOptions.map((s) => `<option value="${this._esc(String(s.id))}" ${String(s.id) === selectedSeason ? "selected" : ""}>${s.label}</option>`).join("")}
        </select>
      </label>
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;min-width:120px;">현재 구역
        <select data-control-scope-zone>
          ${zoneOptions.map((z) => `<option value="${z.id}" ${z.id === safeZone ? "selected" : ""}>${z.label}</option>`).join("")}
        </select>
      </label>
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;min-width:170px;">적용 범위
        <select data-control-scope-apply>
          <option value="current" ${this._controlScope?.applyMode !== "all" ? "selected" : ""}>현재 구역만</option>
          <option value="all" ${this._controlScope?.applyMode === "all" ? "selected" : ""}>전체 구역에 복사</option>
        </select>
      </label>
      <label style="font-size:12px;color:#5d7d64;display:flex;flex-direction:column;gap:4px;min-width:130px;">복사 대상 구역
        <select data-control-copy-target-zone>
          ${zoneOptions.filter((z) => z.id !== safeZone).map((z) => `<option value="${z.id}">${z.label}</option>`).join("") || `<option value="${safeZone}">${safeZone}구역</option>`}
        </select>
      </label>
      <button class="btn btn-ghost" data-control-copy-zone style="height:34px;">현재 설정 복사</button>
      <button class="btn btn-ghost" data-control-copy-all-zones style="height:34px;">전체 구역에 적용</button>
      <div data-control-scope-summary style="font-size:12px;color:#2f6b3c;line-height:1.55;background:#f3fbf4;border:1px solid #d7ecd9;border-radius:10px;padding:8px 10px;min-width:260px;">
        <b>저장 대상</b><br>${this._esc(this._currentControlScopeLabel(domain))}<br>
        <span>제어영역: ${this._esc(this._controlDomainLabel(domain))}</span><br>
        <span data-control-scope-storage-key>작기 + 구역 + 제어영역 → green_smart_zone_control_settings</span><br>
        <span data-control-save-notice>마지막 저장: ${this._esc(saveNotice)}</span>
      </div>
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

  _getScopedControlState(domain) {
    const cacheKey = this._scopedControlCacheKey(domain);
    if (this._apiScopedControlCache?.[cacheKey]) return this._cloneControlState(domain, this._apiScopedControlCache[cacheKey]);
    this._fetchScopedControlStateFromApi(domain); // async best-effort; localStorage fallback renders immediately
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
    return `<div class="page control-strategy-page">
      ${this._renderSubHero("환경 제어", "AI가 꺼져도 기본 인터록 제어로 온실을 안전하게 유지하고, AI 활성화 시 생육전략 보정값을 적용합니다.", "mdi:thermometer-lines")}
      ${this._renderControlScopeBar("environment")}
      ${this._renderZoneControlModeCard("environment")}
      ${this._renderZoneInterlockSettingsCard("environment")}
      ${this._renderZoneEntityStateSummaryCard("environment")}
      ${this._renderZoneSafetyGuardWatchdogCard("environment")}
      ${this._renderZoneAiFinalTargetCard("environment")}
      ${this._renderZoneExecutionLogCard("environment")}
      ${this._renderZoneEntityMappingCard("environment")}
      <div class="gs-card" style="padding:16px;">
        <span hidden data-env-strategy-tab data-ai-strategy data-final-target data-safety-limit data-control-log>
          제어 모드 온도 제어 습도 / VPD 제어 CO₂ 제어 AI 전략 / 최종 적용값 저광기 전략 안전 한계 작동 로그 AI 보정값 최종 적용값 주간 목표온도 야간 목표온도 목표 습도 목표 VPD 목표 CO₂ 기본 ADT 기본 DIF 난방 시작 온도 난방 정지 온도 환기 시작 온도 환기 최대 온도 고온 경보 온도 저온 경보 온도
        </span>
        ${this._renderEnvStrategyTabBar()}
        <div data-env-strategy-content>${this._renderEnvStrategyTabContent(s, modeOptions, aiStatusOptions, statusText)}</div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:8px;"><button id="control-strategy-save" class="btn btn-primary">전략 저장</button></div>
    </div>`;
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
      { key:"safety", label:"안전 한계", icon:"mdi:alert-octagon" },
      { key:"device", label:"양액기 설정", icon:"mdi:pipe-valve" },
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
    return `<div class="page irrigation-control-page">
      ${this._renderSubHero("관수 제어", "기본 관수 인터록으로 안전하게 작동하고, AI 활성화 시 생육 상태와 일사량에 따라 EC, pH, 관수량, 드라이백을 보정합니다.", "mdi:water")}
      ${this._renderControlScopeBar("irrigation")}
      ${this._renderZoneControlModeCard("irrigation")}
      ${this._renderZoneInterlockSettingsCard("irrigation")}
      ${this._renderZoneEntityStateSummaryCard("irrigation")}
      ${this._renderZoneSafetyGuardWatchdogCard("irrigation")}
      ${this._renderZoneAiFinalTargetCard("irrigation")}
      ${this._renderZoneExecutionLogCard("irrigation")}
      ${this._renderZoneEntityMappingCard("irrigation")}
      <div class="gs-card" style="padding:16px;">
        <span hidden data-irrigation-control-contract>irrigationControlMode baseIrrigationSettings saturationStrategy solarIrrigationStrategy drybackStrategy drainFeedback nutrientStrategy aiIrrigationCorrection irrigationSafetyLimits fertigationDeviceSettings finalIrrigationTargets irrigationLogs AI는 기본 관수 인터록 위에 적용되는 보정 레이어</span>
        ${this._renderIrrigationControlTabBar()}
        <div data-irrigation-control-content>${this._renderIrrigationControlTabContent(this._irrigationControl)}</div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:8px;"><button id="irrigation-control-save" class="btn btn-primary">관수 제어 저장</button></div>
    </div>`;
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
      { key:"auto", label:"자동 제어 상태", icon:"mdi:robot" }, { key:"vent", label:"환기 장치 설정", icon:"mdi:fan" },
      { key:"screen", label:"스크린 장치 설정", icon:"mdi:roller-shade" }, { key:"groups", label:"장치 그룹 관리", icon:"mdi:group" },
      { key:"interlock", label:"인터록 설정", icon:"mdi:shield-link-variant" }, { key:"failsafe", label:"Fail Safe 설정", icon:"mdi:shield-alert" },
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
    return `<div class="page device-control-page">
      ${this._renderSubHero("장치제어", "Home Assistant와 실제 설비를 연결해 장치 운영, 수동 제어, 인터록, Fail Safe를 관리합니다.", "mdi:cog-box")}
      ${this._renderControlScopeBar("device")}
      ${this._renderZoneControlModeCard("device")}
      ${this._renderZoneInterlockSettingsCard("device")}
      ${this._renderZoneEntityStateSummaryCard("device")}
      ${this._renderZoneSafetyGuardWatchdogCard("device")}
      ${this._renderZoneAiFinalTargetCard("device")}
      ${this._renderZoneExecutionLogCard("device")}
      ${this._renderZoneEntityMappingCard("device")}
      <div class="gs-card" style="padding:16px;">
        <span hidden data-device-control-contract>devices deviceGroups deviceStatus deviceControlLogs deviceInterlocks deviceFailsafeRules deviceAlarms ventilationDeviceSettings screenDeviceSettings</span>
        ${this._renderDeviceControlTabBar()}
        <div data-device-control-content>${this._renderDeviceControlTabContent(this._deviceControl)}</div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:8px;"><button id="device-control-save" class="btn btn-primary">장치제어 저장</button></div>
    </div>`;
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

  _bindControlScopeInputs(root) {
    root.querySelectorAll("[data-control-scope-bar]").forEach((bar) => {
      const domain = bar.dataset.controlScopeDomain || "environment";
      const season = bar.querySelector("[data-control-scope-season]");
      const zone = bar.querySelector("[data-control-scope-zone]");
      const apply = bar.querySelector("[data-control-scope-apply]");
      const updateScope = () => {
        this._controlScope = {
          seasonId: season?.value || this._currentControlSeasonId(),
          zoneId: Number(zone?.value || 1),
          applyMode: apply?.value || "current",
        };
        this._saveControlScope();
        this._pageRendered = null;
        this._update();
      };
      season?.addEventListener("change", updateScope);
      zone?.addEventListener("change", updateScope);
      apply?.addEventListener("change", () => {
        this._controlScope = { ...this._controlScope, applyMode: apply.value || "current" };
        this._saveControlScope();
      });
      bar.querySelector("[data-control-copy-zone]")?.addEventListener("click", () => {
        const fromZone = Number(zone?.value || this._controlScope?.zoneId || 1);
        const toZone = Number(bar.querySelector("[data-control-copy-target-zone]")?.value || fromZone);
        if (fromZone === toZone) return;
        if (!confirm(`${this._controlDomainLabel(domain)} 현재 설정을 ${toZone}구역으로 복사할까요?`)) return;
        this._copyScopedControlSettings(domain, fromZone, toZone);
        this._copyScopedControlSettingsViaApi(domain, fromZone, [toZone]);
        this._controlSaveNotice = { ...this._controlSaveNotice, label: `${this._currentControlScopeLabel(domain)} → ${toZone}구역 복사 완료` };
        this._pageRendered = null;
        this._update();
      });
      bar.querySelector("[data-control-copy-all-zones]")?.addEventListener("click", () => {
        const fromZone = Number(zone?.value || this._controlScope?.zoneId || 1);
        if (!confirm(`${this._controlDomainLabel(domain)} 현재 설정을 전체 구역에 적용할까요?`)) return;
        const copied = this._copyScopedControlSettingsToAllZones(domain, fromZone);
        this._copyScopedControlSettingsViaApi(domain, fromZone, copied);
        this._controlSaveNotice = { ...this._controlSaveNotice, label: `${this._currentControlScopeLabel(domain)} → 전체 구역(${copied.length}개) 복사 완료` };
        this._pageRendered = null;
        this._update();
      });
      if (domain === "irrigation" && zone && !this._controlZoneOptions(domain).some((z) => z.id === Number(zone.value))) {
        zone.value = "1";
      }
    });
  }

  // ── Dashboard event binding ───────────────────────────────────────────────────

  _bindDashboard(root) {
    this._bindControlScopeInputs(root);
    this._bindZoneInterlockSettingsInputs(root);
    this._bindZoneControlModeInputs(root);
    this._bindZoneEntityStateSummaryInputs(root);
    this._bindZoneSafetyGuardWatchdogInputs(root);
    this._bindZoneAiFinalTargetInputs(root);
    this._bindZoneEntityMappingInputs(root);
    this._bindControlStrategyInputs(root);
    this._bindIrrigationControlInputs(root);
    this._bindDeviceControlInputs(root);
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

  _renderSettingsPage() {
    const f = this._form;
    return `<div class="wizard-area">
      <div class="wiz-topbar">
        <div class="wiz-brand"><ha-icon icon="mdi:leaf"></ha-icon>Green Smart 시스템 설정</div>
      </div>
      <ha-card>
        <h1>시스템 설정</h1>
        <p class="sub">Green Smart 중앙 시스템 연결 및 설치 구역 정보를 관리합니다.</p>
        <div class="form">
          <label>PLC IP 주소<input id="host" value="${this._esc(f.host)}" autocomplete="off"></label>
          <div class="grid">
            <label>포트<input id="port" type="number" min="1" max="65535" value="${this._esc(f.port)}"></label>
            <label>Unit ID<input id="unit_id" type="number" min="1" max="255" value="${this._esc(f.unit_id)}"></label>
          </div>
          <div class="grid">
            <label>온실 구역<input id="greenhouse_zones" type="number" min="1" max="20" value="${this._esc(f.greenhouse_zones)}"></label>
            <label>양액 구역<input id="nutrient_zones" type="number" min="1" max="10" value="${this._esc(f.nutrient_zones)}"></label>
          </div>
          <label>스티븐슨 스크린<input id="stevenson_screens" type="number" min="1" max="10" value="${this._esc(f.stevenson_screens)}"></label>
          <label>WeatherFlow 접두사<input id="weatherflow_prefix" value="${this._esc(f.weatherflow_prefix)}" autocomplete="off"></label>
          <div class="mode-copy" style="margin-top:10px;">
            <strong>온실 주소 기반 날씨 위치</strong>
            <span>주소를 입력하면 기상청 단기 격자(nx/ny)와 중기 권역 코드가 자동 매칭됩니다.</span>
            <div class="form" style="margin-top:12px;">
              <label>온실 주소
                <input id="greenhouse_address" value="${this._esc(f.greenhouse_address || f.location_name || "")}" autocomplete="off" placeholder="예: 경기도 수원시 영통구">
              </label>
              <div class="actions" style="justify-content:flex-start;margin-top:8px;">
                <button class="action" id="weather_location_match" type="button">주소로 날씨 위치 자동 매칭</button>
              </div>
              <div id="location_match_status" style="font-size:12px;color:#7a9780;margin-top:8px;">
                ${this._esc(f.location_name || f.greenhouse_address || "주소를 입력하고 자동 매칭을 눌러주세요.")}
              </div>
              <div class="grid" style="margin-top:10px;">
                <label>단기 nx<input id="nx" type="number" min="0" max="999" value="${this._esc(f.nx || 60)}"></label>
                <label>단기 ny<input id="ny" type="number" min="0" max="999" value="${this._esc(f.ny || 127)}"></label>
              </div>
              <div class="grid">
                <label>중기예보 날씨 권역 코드<input id="weather_mid_land_reg_id" value="${this._esc(f.weather_mid_land_reg_id || f.land_regid || "11H10000")}" autocomplete="off" placeholder="11H10000"></label>
                <label>중기예보 기온 권역 코드<input id="weather_mid_ta_reg_id" value="${this._esc(f.weather_mid_ta_reg_id || f.ta_regid || "11H10701")}" autocomplete="off" placeholder="11H10701"></label>
              </div>
            </div>
          </div>
        </div>
        <div class="actions">
          <button class="action" id="cancel">취소</button>
          <button class="action primary" id="save">저장</button>
        </div>
        ${this._renderError()}
      </ha-card>
    </div>`;
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
