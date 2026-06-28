// Green Smart panel API client — RB-002
// Thin adapter over Home Assistant hass.callApi. It must not change route paths or response shapes.

function normalizeApiError(error, method, path) {
  const normalized = error instanceof Error ? error : new Error(String(error || "API request failed"));
  normalized.method = method;
  normalized.path = path;
  normalized.status = error?.status || error?.code || null;
  normalized.message = error?.message || normalized.message || "API request failed";
  return normalized;
}

export function createApiClient(hass) {
  async function request(method, path, payload) {
    try {
      if (payload === undefined) return await hass.callApi(method, path);
      return await hass.callApi(method, path, payload);
    } catch (error) {
      throw normalizeApiError(error, method, path);
    }
  }

  return {
    request,
    admin: {
      getCurrentUser: () => request("GET", "green_smart/auth/me"),
    },
    crop: {
      listSeasons: () => request("GET", "green_smart/crop/seasons"),
      getGrowthRecords: (seasonId) => request("GET", `green_smart/crop/seasons/${seasonId}/growth`),
      getPestRecords: (seasonId) => request("GET", `green_smart/crop/seasons/${seasonId}/pest`),
      getControlRecords: (seasonId) => request("GET", `green_smart/crop/seasons/${seasonId}/control`),
      getGrowthReport: (seasonId) => request("GET", `green_smart/crop/seasons/${seasonId}/growth-report`),
    },
    weather: {
      getCurrent: () => request("GET", "green_smart/weather/current"),
      getForecast: () => request("GET", "green_smart/weather/forecast"),
      getConfig: () => request("GET", "green_smart/weather/config"),
      getWeekly: () => request("GET", "green_smart/weather/weekly"),
    },
    zone: {
      getControlSettings: (domain) => request("GET", `green_smart/zones/control-settings?domain=${domain}`),
      executeFinalTargets: (payload) => request("POST", "green_smart/zones/execute-final-targets", payload),
    },
  };
}
