// Green Smart Admin/System page shell — RB-001
// Pure render helpers. Lifecycle, binding, storage, and customElements registration remain in green-smart-panel.js.

export function adminSystemTabs() {
  return [
    { key: "roles", label: "사용자/권한", icon: "mdi:account-key" },
    { key: "health", label: "연동 상태", icon: "mdi:heart-pulse" },
    { key: "config", label: "시스템 설정", icon: "mdi:cog" },
    { key: "diagnostics", label: "진단/백업", icon: "mdi:tools" },
    { key: "audit", label: "감사 로그", icon: "mdi:clipboard-text-clock" },
  ];
}

export function renderAdminSystemTabBar(panel) {
  const tabs = adminSystemTabs();
  if (!tabs.some((t) => t.key === panel._adminSystemTab)) panel._adminSystemTab = "roles";
  return `<div class="admin-system-tabs" style="display:flex;gap:4px;margin-bottom:16px;background:#f5faf6;border-radius:12px;padding:4px;overflow-x:auto;">
    ${tabs.map((t) => `<button class="c-tab ${panel._adminSystemTab === t.key ? "active" : ""}" data-admin-system-tab="${t.key}" style="flex:0 0 auto;padding:8px 10px;border-radius:8px;font-size:13px;display:flex;align-items:center;gap:5px;"><ha-icon icon="${t.icon}" style="width:15px;height:15px;"></ha-icon>${t.label}</button>`).join("")}
  </div>`;
}

export function renderAdminSystemTabContent(panel) {
  const tab = panel._adminSystemTab;
  const role = panel._currentUserRole();
  if (tab === "health") return panel._strategySection("mdi:heart-pulse", "연동 상태", `
    <div class="strategy-status-row">
      <div><span>HA 사용자</span><b>${panel._esc(panel._authMe?.name || panel._authMe?.id || "현재 세션")}</b></div>
      <div><span>Green Smart 역할</span><b>${panel._esc(role)}</b></div>
      <div><span>Central API</span><b>${panel._adminSystemConfig.centralApiUrl ? "설정됨" : "미설정"}</b></div>
      <div><span>MariaDB</span><b>${panel._dbReady ? "연결" : "대기/미확인"}</b></div>
      <div><span>MQTT</span><b>${panel._mqttLoaded ? "로드됨" : "대기"}</b></div>
    </div>
    <button class="btn btn-primary" data-admin-health-refresh>연동 상태 새로고침</button>`);
  if (tab === "config") return panel._strategySection("mdi:cog", "시스템 설정", `
    <div class="strategy-row"><div class="strategy-label">Central API URL</div><div class="strategy-control"><input data-admin-config-field="centralApiUrl" value="${panel._esc(panel._adminSystemConfig.centralApiUrl)}" placeholder="https://central.example.com"></div></div>
    <div class="strategy-row"><div class="strategy-label">날씨 API 사용</div><label class="strategy-switch"><input type="checkbox" data-admin-config-field="weatherApiEnabled" ${panel._adminSystemConfig.weatherApiEnabled ? "checked" : ""}><span>ON/OFF</span></label></div>
    <div class="strategy-row"><div class="strategy-label">농약 API 사용</div><label class="strategy-switch"><input type="checkbox" data-admin-config-field="pesticideApiEnabled" ${panel._adminSystemConfig.pesticideApiEnabled ? "checked" : ""}><span>ON/OFF</span></label></div>
    <div class="strategy-row"><div class="strategy-label">MQTT Host</div><div class="strategy-control"><input data-admin-config-field="mqttHost" value="${panel._esc(panel._adminSystemConfig.mqttHost)}"></div></div>
    <div class="strategy-row"><div class="strategy-label">백업 보관일</div><div class="strategy-control"><input type="number" data-admin-config-field="backupRetentionDays" value="${panel._adminSystemConfig.backupRetentionDays}" min="1" max="365"><span>일</span></div></div>
    <button class="btn btn-primary" data-admin-config-save>시스템 설정 저장</button>`);
  if (tab === "diagnostics") return panel._strategySection("mdi:tools", "진단/백업", `
    <div class="strategy-example">HA config, DB schema, API route, panel version, RBAC marker를 점검하고 백업 JSON을 내보냅니다.</div>
    <div data-admin-diagnostic-result style="font-size:12px;color:#5d7d64;margin:8px 0;">${panel._esc(panel._adminDiagnostics || "아직 진단 전")}</div>
    <button class="btn btn-primary" data-admin-diagnostic-run>진단 실행</button>
    <button class="btn btn-ghost" data-admin-backup-export>백업 내보내기</button>`);
  if (tab === "audit") return panel._strategySection("mdi:clipboard-text-clock", "감사 로그", `
    <div data-admin-audit-log>${(panel._adminAuditLogs || []).map((l) => `<div style="padding:8px;border-bottom:1px solid #edf4ee;font-size:12px;">${panel._esc(l)}</div>`).join("") || `<div style="font-size:12px;color:#7a9780;">감사 로그가 없습니다.</div>`}</div>`);
  const rows = [
    { id: panel._authMe?.id || "ha-current-user", name: panel._authMe?.name || "현재 HA 사용자", role },
    ...(panel._adminRoleMappings || []),
  ];
  return panel._strategySection("mdi:account-key", "사용자/권한", `
    <div class="strategy-example" data-admin-role-backend-enforced data-required-permission="manage_farm_staff_roles">HA 사용자 ID를 Green Smart 역할에 매핑합니다. API 권한은 backend에서 다시 검증해야 합니다. backend permission enforcement · farm_owner는 farm_staff 역할만 배정/해제</div>
    <div data-admin-role-api-status style="font-size:12px;color:#5d7d64;margin:8px 0;">역할 저장은 backend API 우선, localStorage는 호환 fallback입니다. 권한 거부 시 backend reasonCode를 확인합니다.</div>
    ${rows.map((u, idx) => `<div class="strategy-row" data-admin-role-row="${idx}">
      <div class="strategy-label">HA 사용자<br><small>${panel._esc(u.id)}</small></div>
      <div class="strategy-control"><input data-admin-role-user-id value="${panel._esc(u.id)}" placeholder="HA 사용자 ID"><input data-admin-role-user-name value="${panel._esc(u.name)}" placeholder="이름"><select data-admin-role-value><option value="admin" ${u.role === "admin" ? "selected" : ""}>admin</option><option value="farm_owner" ${u.role === "farm_owner" ? "selected" : ""}>farm_owner</option><option value="farm_staff" ${u.role === "farm_staff" ? "selected" : ""}>farm_staff</option></select></div>
    </div>`).join("")}
    <button class="btn btn-primary" data-admin-role-save>권한 매핑 저장</button>`);
}

export function renderAdminSystemPage(panel) {
  const role = panel._currentUserRole();
  const body = `<div class="gs-card" data-ui-section="view" data-required-permission="system_settings" data-role-visibility="admin" style="padding:16px;margin-bottom:14px;">
      <div style="font-size:13px;color:#7a9780;margin-bottom:4px;">현재 역할</div>
      <div style="font-size:18px;font-weight:800;color:#24323F;">${panel._esc(role)}</div>
      <div style="font-size:12px;color:#7a9780;margin-top:6px;">Admin/System은 사용자/권한, HA/DB/API 연동 상태, 시스템 설정, 진단/백업, 감사 로그를 관리합니다.</div>
    </div>
    <div class="gs-card" style="padding:16px;">
      <div hidden data-ui-section="record" data-required-permission="manage_users_roles" data-role-visibility="admin"></div>
      <div hidden data-ui-section="strategy" data-required-permission="edit_strategy_settings" data-role-visibility="admin,farm_owner"></div>
      <div hidden data-ui-section="approval" data-required-permission="edit_interlock_thresholds" data-role-visibility="admin,farm_owner"></div>
      <div hidden data-ui-section="execute" data-required-permission="execute_final_targets" data-role-visibility="admin,farm_owner"></div>
      <div hidden data-ui-section="safety" data-required-permission="edit_interlock_rules" data-role-visibility="admin"></div>
      ${renderAdminSystemTabBar(panel)}
      <div data-admin-system-content>${renderAdminSystemTabContent(panel)}</div>
    </div>`;
  return panel._renderCommonMainPageShell(
    "admin-system",
    "Admin/System",
    "HA 사용자 권한, Entity 매핑, 외부 API, 진단을 admin 전용으로 관리합니다.",
    "mdi:shield-account",
    body,
    { pageClass: "admin-system-page", extraAttrs: 'data-ui-section="admin" data-required-permission="system_settings" data-role-visibility="admin"' }
  );
}
