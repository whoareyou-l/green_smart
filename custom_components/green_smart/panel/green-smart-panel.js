// Green Smart — Modern SaaS greenhouse dashboard  v1.8.1
const DOMAIN = "green_smart";
const VERSION = "1.8.1";
const WIZARD_STEPS = ["wizard_step1", "wizard_step2", "wizard_step3"];
const DEFAULT_FORM = {
  host: "", port: 502, unit_id: 1,
  greenhouse_zones: 1, nutrient_zones: 1, stevenson_screens: 1,
  weatherflow_prefix: "sensor.tempest_", virtual: false,
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
    this._controlData = [];
    this._activeSeasonId = null;   // 현재 선택된 작기 ID
    this._dbReady        = false;  // DB 연결 완료 여부
    this._weatherData = null;
    this._weatherInterval = null;
    this._watchdogInterval = null;
    this._watchdogKeys = new Set();
    this._weatherModalOpen = false;
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
  }

  disconnectedCallback() {
    this._stopVirtualSimulation();
    clearInterval(this._weatherInterval); this._weatherInterval = null;
    this._stopWatchdog();
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
    const data = this._normalizedForm();
    if (!data.host) { this._error = "PLC IP 주소를 입력해 주세요."; this._update(); return; }
    this._saving = true; this._error = ""; this._update();
    this._saveStorage(data);
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
      await this._refreshEntries();
      // REST API does not return entry.data, so do NOT call _loadFormFromEntry()
      // (it would reset _form to DEFAULT). Apply the saved values directly.
      Object.assign(this._form, data);
      this._virtualMode = Boolean(data.virtual || data.host === "virtual");
      this._saveStorage(this._form);
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
    };
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

  async _fetchWeather() {
    try {
      const data = await this._hass.callApi("GET", "green_smart/weather/current");
      this._weatherData = data;
      const card = this.shadowRoot && this.shadowRoot.querySelector("[data-weather-card]");
      if (card) card.innerHTML = this._renderWeatherCardInner(data);
    } catch (_) {}
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
  position:fixed;top:0;left:0;width:70px;height:100vh;
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
    else if (this._page === "ventilation") html = this._renderVentSettingsPage();
    else if (this._page === "screen")      html = this._renderScreenSettingsPage();
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
      navBtn("environment", "mdi:thermometer-lines",  "환경 설정", "온도 · 습도 · CO₂ · VPD 목표값 설정"),
      navBtn("irrigation",  "mdi:water",              "관수 설정", "관수 주기 · 관수량 · EC · pH 설정"),
      navBtn("ventilation", "mdi:fan",                "환기 설정", "천창 · 측창 개폐 조건 및 환기 기준 설정"),
      navBtn("screen",      "mdi:roller-shade",       "스크린 설정","차광 스크린 · 보온 커튼 동작 조건 설정"),
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

    const W = 600, PAD_TOP = 10, PAD_RIGHT = 10, PAD_BOTTOM = 30, PAD_LEFT = 45;
    const chartW = W - PAD_LEFT - PAD_RIGHT;
    const chartH = 220 - PAD_TOP - PAD_BOTTOM;
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
      return `<text x="${x.toFixed(0)}" y="${220 - 8}" text-anchor="middle" fill="#7a9780" font-size="10">${label}</text>`;
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

    const svg = `<svg id="env-chart-svg" class="chart-svg" viewBox="0 0 ${W} 220" style="height:280px;">
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
    const W = 600, PAD_LEFT = 45, PAD_TOP = 10;
    const chartW = W - PAD_LEFT - 10;
    const chartH = 220 - PAD_TOP - 30;
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

    const W = 600, PAD_TOP = 10, PAD_RIGHT = 10, PAD_BOTTOM = 30, PAD_LEFT = 45;
    const chartW = W - PAD_LEFT - PAD_RIGHT;
    const chartH = 220 - PAD_TOP - PAD_BOTTOM;
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
      return `<text x="${x.toFixed(0)}" y="${220 - 8}" text-anchor="middle" fill="#7a9780" font-size="10">${label}</text>`;
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

    const svg = `<svg id="irrig-chart-svg" class="chart-svg" viewBox="0 0 ${W} 220" style="height:280px;">
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
    const W = 600, PAD_LEFT = 45, PAD_TOP = 10;
    const chartW = W - PAD_LEFT - 10;
    const chartH = 220 - PAD_TOP - 30;
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

  _weatherStatus(data) {
    const pty = (data.precipitation_type || "없음").trim();
    const sky = data.sky || "--";
    const precip = parseFloat(data.precipitation) || 0;
    if (pty === "비" || pty === "빗방울") return precip > 0 ? `비(${precip}mm)` : "비";
    if (pty === "비/눈") return precip > 0 ? `비/눈(${precip}mm)` : "비/눈";
    if (pty === "눈" || pty === "눈날림" || pty === "빗방울눈날림") return precip > 0 ? `눈(${precip}mm)` : "눈";
    return sky === "--" ? "—" : sky;
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
    const status = this._weatherStatus(data);

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
      <div class="tw-grid">
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
    const icon = this._weatherIcon(sky, pty);
    const real = cur.mode === "real";
    const t = parseFloat(temp);
    const bg = !isNaN(t) && t >= 30 ? "linear-gradient(135deg,#fff5ed 0%,#ffe0c8 100%)"
             : !isNaN(t) && t <= 0  ? "linear-gradient(135deg,#edf5ff 0%,#c8dcf5 100%)"
             : "linear-gradient(135deg,#e8f5eb 0%,#d4edda 100%)";
    const badge = real
      ? `<span class="wm-hero-badge" style="background:#DFF3E2;color:#51AE60;">실시간</span>`
      : `<span class="wm-hero-badge" style="background:#f0f5f1;color:#7a9780;">가상</span>`;
    let statusText = sky;
    if (pty !== "없음" && pty) {
      const precip = cur.precipitation != null && cur.precipitation > 0 ? `(${cur.precipitation}mm)` : "";
      statusText = `${pty}${precip}`;
    }
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
    const items = forecasts.slice(0, 12);
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

  _wmDaily(forecasts, weekly) {
    // weekly(7일치)가 있으면 우선 사용, 없으면 forecasts에서 날짜별 집계(3일치)
    let items;
    if (weekly && weekly.length > 0) {
      items = weekly.map((w) => {
        const min = Number.isFinite(Number(w.temp_min)) ? Number(w.temp_min) : "--";
        const max = Number.isFinite(Number(w.temp_max)) ? Number(w.temp_max) : "--";
        return {
          date: w.date,
          min,
          max,
          topSky: w.sky || "--",
          topPty: undefined,
          pop: Number.isFinite(Number(w.pop)) ? Number(w.pop) : 0,
        };
      });
    } else {
      const byDate = {};
      forecasts.forEach((f) => {
        const d = f.date;
        if (!d) return;
        if (!byDate[d]) byDate[d] = { temps: [], pops: [], skies: {}, ptys: {}, tmn: null, tmx: null };
        const e = byDate[d];
        const t = Number(f.temp);
        if (Number.isFinite(t)) e.temps.push(t);
        const p = Number(f.pop);
        if (Number.isFinite(p)) e.pops.push(p);
        if (f.sky) e.skies[f.sky] = (e.skies[f.sky] || 0) + 1;
        if (f.precipitation_type && f.precipitation_type !== "없음") e.ptys[f.precipitation_type] = (e.ptys[f.precipitation_type] || 0) + 1;
        const tmn = Number(f.temp_min), tmx = Number(f.temp_max);
        if (Number.isFinite(tmn)) e.tmn = tmn;
        if (Number.isFinite(tmx)) e.tmx = tmx;
      });
      items = Object.keys(byDate).sort().map((d) => {
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
    const locName = cfg.location_name || "--";
    const nx = cfg.nx != null ? cfg.nx : "--";
    const ny = cfg.ny != null ? cfg.ny : "--";
    const updated = cur.updated || "--";
    return `<div class="wm-info-row">
      <div class="wm-icard">
        <div class="wm-icard-lbl">위치 정보</div>
        <div class="wm-icard-val">
          <ha-icon icon="mdi:map-marker" style="--mdi-icon-size:13px;color:#51AE60;vertical-align:-1px;"></ha-icon>
          ${this._esc(locName)}
          ${nx !== "--" ? `<div style="font-size:11px;color:#7a9780;margin-top:3px;">nx ${nx} · ny ${ny}</div>` : ""}
          ${cfg.ta_regid ? `<div style="font-size:11px;color:#7a9780;margin-top:2px;">중기예보 ${this._esc(cfg.ta_regid)}</div>` : ""}
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
        const [cur, fcstResp, cfgResp, weeklyResp] = await Promise.all([
          this._hass.callApi("GET", "green_smart/weather/current").catch(() => ({})),
          this._hass.callApi("GET", "green_smart/weather/forecast").catch(() => ({})),
          this._hass.callApi("GET", "green_smart/weather/config").catch(() => ({})),
          this._hass.callApi("GET", "green_smart/weather/weekly").catch(() => ({})),
        ]);
        const forecasts = (fcstResp && fcstResp.forecasts) || [];
        const cfg = cfgResp || {};
        const weekly = (weeklyResp && weeklyResp.weekly) || [];
        inner.innerHTML = this._renderWeatherModal(cur, forecasts, cfg, weekly);
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

  _renderWeatherModal(cur, forecasts, cfg, weekly) {
    cur = cur || {};
    forecasts = forecasts || [];
    cfg = cfg || {};
    weekly = weekly || [];

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
      ${this._wmHourly(forecasts)}
      ${this._wmDaily(forecasts, weekly)}
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
      <div id="crop-seasons-list">${this._renderCropSeasonsList()}</div>`;
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
    return this._cropSeasons.map((s, i) => {
      const demolished = !!s.demolishDate;
      const cropLabel  = CROP_LABELS[s.cropType] || s.cropType || "작물";
      const methodLabel = METHOD_LABELS[s.method] || s.method || "";
      const statusBadge = demolished
        ? `<span style="background:#f5f5f5;color:#9e9e9e;font-size:10px;font-weight:700;
             padding:2px 8px;border-radius:20px;">철거 완료</span>`
        : `<span style="background:#d4edda;color:#155724;font-size:10px;font-weight:700;
             padding:2px 8px;border-radius:20px;">재배 중</span>`;
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
                  Zone ${s.zone || "?"}
                </span>
                ${methodLabel ? `<span style="font-size:12px;color:#7a9780;">${methodLabel}</span>` : ""}
                ${s.totalPlants ? `<span style="font-size:12px;color:#7a9780;">${s.totalPlants}주</span>` : ""}
              </div>
            </div>
            ${!demolished ? `
              <button data-season-demolish="${i}"
                style="background:#fff3cd;color:#856404;border:1.5px solid #ffc107;border-radius:8px;
                       padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;">
                철거
              </button>` : ""}
          </div>
        </div>`;
    }).join("");
  }

  _renderCropGrowthTab() {
    const rows = this._growthData.length
      ? this._growthData.map((r, i) => `
        <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;background:#f5faf6;margin-bottom:6px;">
          <div style="flex:0 0 72px;font-size:12px;font-weight:700;color:#51AE60;">${r.date}</div>
          <div style="flex:1;display:flex;flex-wrap:wrap;gap:6px 14px;">
            <span style="font-size:12px;color:#4a6741;">초장 <b>${r.height}cm</b></span>
            <span style="font-size:12px;color:#4a6741;">엽수 <b>${r.leafCount}매</b></span>
            <span style="font-size:12px;color:#4a6741;">줄기경 <b>${r.stemDia}mm</b></span>
            <span style="font-size:12px;color:#4a6741;">화방 <b>${r.truss}단</b></span>
            ${r.note ? `<span style="font-size:11px;color:#7a9780;">${this._esc(r.note)}</span>` : ""}
          </div>
          <button data-growth-del="${i}" title="삭제"
            style="background:none;border:none;cursor:pointer;color:#c0392b;font-size:16px;padding:2px 6px;">✕</button>
        </div>`).join("")
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
      <div id="growth-list">${rows}</div>`;
  }

  _renderCropPestTab() {
    const SEVERITY = { low: "낮음", mid: "보통", high: "높음", critical: "위험" };
    const SEVERITY_COLOR = { low: "#51AE60", mid: "#f39c12", high: "#e67e22", critical: "#c0392b" };
    const rows = this._pestData.length
      ? this._pestData.map((r, i) => `
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
        </div>`).join("")
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
      <div id="pest-list">${rows}</div>`;
  }

  _renderCropControlTab() {
    const rows = this._controlData.length
      ? this._controlData.map((r, i) => {
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
      <div id="control-list">${rows}</div>`;
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

  _openCropBasicAddPopup() {
    const today = new Date().toISOString().slice(0, 10);
    this._openCropPopup(`
      <div class="popup-card" style="width:min(520px,93vw);">
        <div class="pop-header">
          <div class="pop-icon-box"><ha-icon icon="mdi:sprout" style="--mdi-icon-size:22px;"></ha-icon></div>
          <div>
            <div class="pop-title-main">정식 등록</div>
            <div class="pop-title-sub">새 작기를 등록합니다</div>
          </div>
        </div>
        <div class="pop-fields">
          <!-- 작물 정보 -->
          <div style="font-size:11px;font-weight:700;color:#51AE60;letter-spacing:.4px;margin-bottom:6px;">작물 정보</div>
          <div class="pop-field-row">
            <div class="pop-field">
              <label>작물 종류</label>
              <select id="b-crop-type">
                <option value="tomato">토마토</option><option value="paprika">파프리카</option>
                <option value="strawberry">딸기</option><option value="lettuce">상추</option>
                <option value="herb">허브</option><option value="cucumber">오이</option>
                <option value="other">기타</option>
              </select>
            </div>
            <div class="pop-field">
              <label>품종</label>
              <input type="text" id="b-variety" placeholder="예) 슈퍼도태랑">
            </div>
          </div>
          <div class="pop-field">
            <label>재배 방식</label>
            <select id="b-method">
              <option value="hydro">수경재배</option><option value="soil">토경재배</option>
              <option value="nft">NFT</option><option value="dwc">DWC</option>
            </select>
          </div>
          <!-- 정식 정보 -->
          <div style="height:1px;background:#f0f7f1;margin:8px 0;"></div>
          <div style="font-size:11px;font-weight:700;color:#51AE60;letter-spacing:.4px;margin-bottom:6px;">정식 정보</div>
          <div class="pop-field-row">
            <div class="pop-field">
              <label>정식일</label>
              <input type="date" id="b-plant-date" value="${today}">
            </div>
            <div class="pop-field">
              <label>재배 구역</label>
              <select id="b-zone">
                <option value="1">Zone 1</option><option value="2">Zone 2</option>
                <option value="3">Zone 3</option><option value="4">Zone 4</option>
              </select>
            </div>
          </div>
          <!-- 재식 설계 -->
          <div style="height:1px;background:#f0f7f1;margin:8px 0;"></div>
          <div style="font-size:11px;font-weight:700;color:#51AE60;letter-spacing:.4px;margin-bottom:6px;">재식 설계</div>
          <div class="pop-field-row">
            <div class="pop-field"><label>줄 간격 (cm)</label><input type="number" id="b-row-space" value="130" min="50" max="300" step="5"></div>
            <div class="pop-field"><label>주 간격 (cm)</label><input type="number" id="b-plant-space" value="40" min="10" max="200" step="5"></div>
          </div>
          <div class="pop-field-row">
            <div class="pop-field"><label>총 정식 수 (주)</label><input type="number" id="b-total" value="200" min="1" max="10000"></div>
            <div class="pop-field"><label>재식 밀도 (주/㎡)</label><input type="number" id="b-density" value="4" min="1" max="20" step="0.1"></div>
          </div>
          <div class="pop-field">
            <label>줄기 유인 방향</label>
            <select id="b-train">
              <option value="v">V자형</option><option value="single">단간</option><option value="double">복간</option>
            </select>
          </div>
        </div>
        <div class="pop-foot">
          <button class="crop-pop-cancel pop-btn-cancel">취소</button>
          <button id="b-save" class="pop-btn-save">정식 등록</button>
        </div>
      </div>`, (inner) => {
      inner.querySelector("#b-save")?.addEventListener("click", async () => {
        const plantDate = inner.querySelector("#b-plant-date")?.value || "";
        if (!plantDate) { alert("정식일을 입력해주세요."); return; }
        const body = {
          cropType:     inner.querySelector("#b-crop-type")?.value   || "tomato",
          variety:      inner.querySelector("#b-variety")?.value     || "",
          method:       inner.querySelector("#b-method")?.value      || "hydro",
          zoneId:       parseInt(inner.querySelector("#b-zone")?.value) || 1,
          plantDate,
          rowSpacing:   parseFloat(inner.querySelector("#b-row-space")?.value)   || null,
          plantSpacing: parseFloat(inner.querySelector("#b-plant-space")?.value) || null,
          totalPlants:  parseInt(inner.querySelector("#b-total")?.value)         || null,
          plantDensity: parseFloat(inner.querySelector("#b-density")?.value)     || null,
          trainDir:     inner.querySelector("#b-train")?.value       || "v",
        };
        try {
          const result = await this._hass.callApi("POST", "green_smart/crop/seasons", body);
          this._cropSeasons.unshift(result);
          this._activeSeasonId = result.id;
          this._closePopup();
          this._refreshCropContent();
        } catch (e) {
          alert("저장 실패: " + (e?.message || "DB 오류"));
        }
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
           s.plantDate, `Zone ${s.zone}`, s.rowSpace, s.plantSpace, s.totalPlants, s.density,
           s.demolishDate||"", s.demolishDate?"철거완료":"재배중"]
          .map(v => `"${String(v||"").replace(/"/g,'""')}"`).join(",")
        ).join("\n");
    } else if (type === "growth") {
      filename = "생육조사.csv";
      csv = "조사일,초장(cm),엽수(매),줄기경(mm),화방(단),절위(절),비고\n"
        + this._growthData.map(r =>
          [r.date, r.height, r.leafCount, r.stemDia, r.truss, r.node, r.note]
          .map(v => `"${String(v||"").replace(/"/g,'""')}"`).join(",")
        ).join("\n");
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
    const today = new Date().toISOString().slice(0, 10);
    this._openCropPopup(`
      <div class="popup-card">
        <div class="pop-header">
          <div class="pop-icon-box"><ha-icon icon="mdi:sprout" style="--mdi-icon-size:22px;"></ha-icon></div>
          <div>
            <div class="pop-title-main">생육조사 추가</div>
            <div class="pop-title-sub">생육 측정 데이터를 기록합니다</div>
          </div>
        </div>
        <div class="pop-fields">
          <div class="pop-field">
            <label>조사일</label>
            <input type="date" id="g-date" value="${today}">
          </div>
          <div class="pop-field-row">
            <div class="pop-field"><label>초장 (cm)</label><input type="number" id="g-height" placeholder="예) 120.5" min="0" max="500" step="0.1"></div>
            <div class="pop-field"><label>엽수 (매)</label><input type="number" id="g-leaf" placeholder="예) 12" min="0" max="100"></div>
          </div>
          <div class="pop-field-row">
            <div class="pop-field"><label>줄기 경 (mm)</label><input type="number" id="g-stem" placeholder="예) 12.3" min="0" max="50" step="0.1"></div>
            <div class="pop-field"><label>화방 위치 (단)</label><input type="number" id="g-truss" placeholder="예) 5" min="0" max="30"></div>
          </div>
          <div class="pop-field-row">
            <div class="pop-field"><label>절위 (절)</label><input type="number" id="g-node" placeholder="예) 18" min="0" max="50"></div>
            <div class="pop-field"><label>비고</label><input type="text" id="g-note" placeholder="메모"></div>
          </div>
        </div>
        <div class="pop-foot">
          <button class="crop-pop-cancel pop-btn-cancel">취소</button>
          <button id="g-save" class="pop-btn-save">저장</button>
        </div>
      </div>`, (inner) => {
      inner.querySelector("#g-save")?.addEventListener("click", async () => {
        const body = {
          date:      inner.querySelector("#g-date")?.value || "",
          height:    parseFloat(inner.querySelector("#g-height")?.value) || null,
          leafCount: parseInt(inner.querySelector("#g-leaf")?.value)     || null,
          stemDia:   parseFloat(inner.querySelector("#g-stem")?.value)   || null,
          truss:     parseInt(inner.querySelector("#g-truss")?.value)    || null,
          node:      parseInt(inner.querySelector("#g-node")?.value)     || null,
          note:      inner.querySelector("#g-note")?.value || "",
        };
        try {
          const result = await this._hass.callApi(
            "POST", `green_smart/crop/seasons/${this._activeSeasonId}/growth`, body
          );
          this._growthData.unshift(result);
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

  _openControlAddPopup() {
    const today = new Date().toISOString().slice(0, 10);
    const MAX_PESTS = 5;

    // ── 로컬 상태 ───────────────────────────────────────────────────────────────
    const entries = [{ name: "", regNo: "", moa: "", dil: "", amount: "", pls: null }];
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
          <!-- 혼용 확인 -->
          <div id="c-mix-wrap" style="display:none;">
            <button id="c-mix-check"
              style="background:#fff3cd;color:#856404;border:1.5px solid #ffc107;border-radius:10px;
                     padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;width:100%;">
              🔍 혼용 가능 여부 확인
            </button>
            <div id="c-mix-result" style="margin-top:8px;"></div>
          </div>
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
              <div data-sug="${idx}"
                style="display:none;position:absolute;left:0;right:0;
                  background:#fff;border:1.5px solid #e8f0e9;border-radius:12px;
                  box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:300;
                  max-height:200px;overflow-y:auto;margin-top:2px;top:100%;"></div>
            </div>
            <!-- 사용기작 / 희석배수 -->
            <div class="pop-field-row" style="margin-bottom:10px;">
              <div class="pop-field">
                <label>사용기작</label>
                <input type="text" data-moa-input="${idx}"
                  value="${this._esc(e.moa)}" placeholder="예) 살균 - DMI계">
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
      const mixWrap  = inner.querySelector("#c-mix-wrap");

      const renderAll = () => {
        listEl.innerHTML = entries.map((_, i) => entryHtml(i)).join("");
        addBtn.style.display = entries.length >= MAX_PESTS ? "none" : "";
        mixWrap.style.display = entries.length >= 2 ? "block" : "none";
        bindEntries();
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
          const sugBox      = listEl.querySelector(`[data-sug="${idx}"]`);

          // 필드 변경 → entries 동기화
          moaInput?.addEventListener("input",    () => { entries[idx].moa    = moaInput.value; });
          dilInput?.addEventListener("input",    () => { entries[idx].dil    = dilInput.value; });
          amountInput?.addEventListener("input", () => { entries[idx].amount = amountInput.value; });

          // 약제명 입력 → 디바운스 자동완성
          nameInput?.addEventListener("input", () => {
            const q = nameInput.value.trim();
            entries[idx].name  = q;
            entries[idx].regNo = "";
            clearTimeout(debounceTimers[idx]);
            if (q.length < 2) { sugBox.style.display = "none"; return; }
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
            "GET", `green_smart/pesticide/search?q=${encodeURIComponent(q)}`
          );
          if (json.error === "no_psis_key") {
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
              nameInput.value    = it.name;
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
            })
          );
        } catch {
          sugBox.innerHTML = `<div style="padding:10px 14px;color:#c0392b;font-size:11px;">오류 발생</div>`;
        }
      };

      // ── 약제 추가 버튼 ────────────────────────────────────────────────────────
      addBtn.addEventListener("click", () => {
        if (entries.length >= MAX_PESTS) return;
        entries.push({ name: "", regNo: "", moa: "", dil: "", amount: "", pls: null });
        renderAll();
      });

      // ── 혼용 확인 ─────────────────────────────────────────────────────────────
      inner.querySelector("#c-mix-check")?.addEventListener("click", async () => {
        const named = entries.filter(e => e.name);
        if (named.length < 2) return;
        const mixBtn = inner.querySelector("#c-mix-check");
        const mixResult = inner.querySelector("#c-mix-result");
        mixBtn.textContent = "🔍 조회 중...";
        mixBtn.disabled = true;
        try {
          const json = await this._hass.callApi("POST", "green_smart/pesticide/mix-check", {
            reg_nos: named.map(e => e.regNo),
            names:   named.map(e => e.name),
          });
          const pairs = json.pairs || [];
          if (!pairs.length) {
            mixResult.innerHTML = `<div style="font-size:12px;color:#7a9780;padding:8px;">혼용 정보가 없습니다.</div>`;
          } else {
            mixResult.innerHTML = pairs.map(p => {
              const ok = p.mixable === true, ng = p.mixable === false;
              const bg    = ok ? "#d4edda" : ng ? "#f8d7da" : "#fff3cd";
              const color = ok ? "#155724" : ng ? "#721c24" : "#856404";
              const icon  = ok ? "✅" : ng ? "❌" : "⚠️";
              const label = ok ? "혼용 가능" : ng ? "혼용 불가" : "정보 없음";
              return `<div style="background:${bg};border-radius:8px;padding:8px 12px;margin-bottom:6px;">
                <span style="font-weight:700;color:${color};font-size:12px;">${icon} ${this._esc(p.pest1)} + ${this._esc(p.pest2)}: ${label}</span>
                ${p.note ? `<div style="font-size:11px;color:${color};margin-top:3px;">${this._esc(p.note)}</div>` : ""}
              </div>`;
            }).join("");
          }
        } catch {
          mixResult.innerHTML = `<div style="font-size:12px;color:#c0392b;">혼용 조회 실패</div>`;
        } finally {
          mixBtn.textContent = "🔍 혼용 가능 여부 확인";
          mixBtn.disabled = false;
        }
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

  _renderEnvSettingsPage() {
    return `<div class="page">
      ${this._renderSubHero("환경 설정", "온도 · 습도 · CO₂ · VPD 목표값을 설정합니다", "mdi:thermometer-lines")}
      ${this._settingCard("mdi:thermometer", "온도 설정", [
        this._settingRow("주간 목표 온도", this._inputNum("env-day-temp", 25, 10, 45, 0.5), "°C"),
        this._settingRow("야간 목표 온도", this._inputNum("env-night-temp", 18, 5, 35, 0.5), "°C"),
        this._settingRow("최대 허용 온도", this._inputNum("env-max-temp", 35, 20, 50, 0.5), "°C"),
        this._settingRow("DIF 목표",       this._inputNum("env-dif", 7, -5, 20, 0.5), "°C"),
      ].join(""))}
      ${this._settingCard("mdi:water-percent", "습도 / CO₂ / VPD", [
        this._settingRow("목표 습도",     this._inputNum("env-humidity", 70, 30, 95), "%"),
        this._settingRow("목표 CO₂",     this._inputNum("env-co2", 800, 400, 2000, 50), "ppm"),
        this._settingRow("목표 VPD",     this._inputNum("env-vpd", 1.0, 0.1, 3.0, 0.1), "kPa"),
        this._settingRow("ADT 목표",     this._inputNum("env-adt", 22, 10, 35, 0.5), "°C"),
      ].join(""))}
      ${this._saveBtn("environment")}
    </div>`;
  }

  _renderIrrigSettingsPage() {
    return `<div class="page">
      ${this._renderSubHero("관수 설정", "관수 주기 · 관수량 · EC · pH 목표값을 설정합니다", "mdi:water")}
      ${this._settingCard("mdi:timer-outline", "관수 일정", [
        this._settingRow("관수 시작 시각", this._inputTime("irrig-start", "07:00")),
        this._settingRow("관수 종료 시각", this._inputTime("irrig-end", "18:00")),
        this._settingRow("관수 주기",     this._inputNum("irrig-interval", 60, 5, 360, 5), "분"),
        this._settingRow("1회 관수 시간", this._inputNum("irrig-duration", 3, 1, 60), "분"),
      ].join(""))}
      ${this._settingCard("mdi:flask-outline", "양액 설정", [
        this._settingRow("목표 EC",    this._inputNum("irrig-ec", 2.5, 0.5, 6.0, 0.1), "mS/cm"),
        this._settingRow("목표 pH",    this._inputNum("irrig-ph", 6.0, 4.0, 8.0, 0.1), ""),
        this._settingRow("1회 관수량", this._inputNum("irrig-amount", 150, 50, 1000, 10), "mL/주"),
        this._settingRow("배액률 목표",this._inputNum("irrig-drain", 30, 10, 60), "%"),
      ].join(""))}
      ${this._saveBtn("irrigation")}
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

  // ── Dashboard event binding ───────────────────────────────────────────────────

  _bindDashboard(root) {
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
      ${this._renderSummary(this._normalizedForm())}
      <div class="actions">
        <button class="action" id="back">이전</button>
        <button class="action primary" id="finish">설정 완료</button>
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
    </dl>`;
  }

  // ── Settings page ──────────────────────────────────────────────────────────────

  _renderSettingsPage() {
    const f = this._form;
    return `<div class="wizard-area">
      <div class="wiz-topbar">
        <div class="wiz-brand"><ha-icon icon="mdi:leaf"></ha-icon>Green Smart 설정</div>
      </div>
      <ha-card>
        <h1>설정 변경</h1>
        <p class="sub">저장된 Green Smart 설정을 수정합니다.</p>
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
        </div>
        <div class="settings-section">
          <div class="settings-section-title">기상청 API 설정</div>

          <!-- 단기예보 API -->
          <div style="margin-bottom:14px;">
            <div style="font-size:12px;font-weight:700;color:#3d5a47;margin-bottom:6px;">단기예보 API 키</div>
            <div id="weather-key-status" style="font-size:12px;color:#7a9780;margin-bottom:6px;">로딩 중...</div>
            <div class="form" style="margin-bottom:0;">
              <label>
                <div style="display:flex;gap:8px;align-items:flex-end;">
                  <input type="password" id="weather-api-key" autocomplete="off" placeholder="기상청 단기예보 서비스 API 키" style="flex:1;">
                  <button id="weather-key-validate" style="white-space:nowrap;flex:0 0 auto;">검사</button>
                </div>
              </label>
            </div>
            <div id="weather-key-validate-result" style="font-size:12px;color:#7a9780;margin-top:4px;"></div>
          </div>

          <!-- 중기예보 API -->
          <div style="margin-bottom:14px;">
            <div style="font-size:12px;font-weight:700;color:#3d5a47;margin-bottom:6px;">중기예보 API 키</div>
            <div id="weather-mid-key-status" style="font-size:12px;color:#7a9780;margin-bottom:6px;">로딩 중...</div>
            <div class="form" style="margin-bottom:0;">
              <label>
                <div style="display:flex;gap:8px;align-items:flex-end;">
                  <input type="password" id="weather-mid-api-key" autocomplete="off" placeholder="기상청 중기예보 서비스 API 키 (없으면 단기예보 키 사용)" style="flex:1;">
                  <button id="weather-mid-key-validate" style="white-space:nowrap;flex:0 0 auto;">검사</button>
                </div>
              </label>
            </div>
            <div id="weather-mid-key-validate-result" style="font-size:12px;color:#7a9780;margin-top:4px;"></div>
          </div>

          <!-- 위치 설정 -->
          <div class="form">
            <label>설치 위치 (읍면동/시군구 검색)
              <div style="display:flex;gap:8px;">
                <input type="text" id="weather-location-query" placeholder="예: 강남구  /  수원시 영통구  /  제주시">
                <button id="weather-location-search" style="white-space:nowrap;">검색</button>
              </div>
            </label>
            <!-- 검색 결과 드롭다운 -->
            <div id="weather-location-results" style="display:none; border:1px solid #e8f0e9; border-radius:10px; background:#fff; overflow:hidden; margin-top:4px;"></div>
            <!-- 선택된 위치 표시 -->
            <div id="weather-location-selected" style="font-size:13px; color:#51AE60; font-weight:600; margin-top:6px; min-height:20px;"></div>
            <!-- 숨겨진 위치 값 -->
            <input type="hidden" id="weather-nx" value="60">
            <input type="hidden" id="weather-ny" value="127">
            <input type="hidden" id="weather-ta-regid" value="">
            <input type="hidden" id="weather-land-regid" value="">
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
            <button class="action primary" id="weather-key-save">저장</button>
            <button class="action" id="weather-key-delete">단기 키 삭제</button>
            <button class="action" id="weather-mid-key-delete">중기 키 삭제</button>
          </div>
          <div id="weather-key-result" style="font-size:13px;color:#7a9780;margin-top:12px;"></div>
        </div>

        <!-- ── 농약안전정보시스템 (PSIS) API ─────────────────────────── -->
        <div class="settings-section">
          <div class="settings-section-title">농약안전정보시스템 (PSIS) API 설정</div>
          <div style="font-size:12px;color:#7a9780;margin-bottom:12px;line-height:1.6;">
            방제 기록 팝업에서 농약 검색 기능을 사용하려면 API 키가 필요합니다.<br>
            <a href="https://www.data.go.kr" target="_blank"
              style="color:#51AE60;text-decoration:none;">공공데이터포털(data.go.kr)</a>에서
            <b>농촌진흥청_농약안전정보시스템_농약목록정보</b>를 신청하세요.
          </div>
          <div id="psis-key-status" style="font-size:12px;color:#7a9780;margin-bottom:6px;">로딩 중...</div>
          <div class="form" style="margin-bottom:0;">
            <label>
              <div style="display:flex;gap:8px;align-items:flex-end;">
                <input type="password" id="psis-api-key" autocomplete="off"
                  placeholder="농약안전정보시스템 서비스 API 키" style="flex:1;">
                <button id="psis-key-save" style="white-space:nowrap;flex:0 0 auto;">저장</button>
                <button id="psis-key-delete" style="white-space:nowrap;flex:0 0 auto;background:#f5f5f5;color:#7a9780;">삭제</button>
              </div>
            </label>
          </div>
          <div id="psis-key-result" style="font-size:12px;color:#7a9780;margin-top:6px;"></div>
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

customElements.define("green-smart-panel", GreenSmartPanel);
