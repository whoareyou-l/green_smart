"""HA HTTP Views — 날씨 + 농약 API 엔드포인트 (인증 필수, API 키 노출 없음)."""
from __future__ import annotations

import logging
import urllib.parse
from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from .weather_api import (
    WeatherStore, fetch_current, fetch_forecast, fetch_weekly_forecast,
    validate_key, validate_mid_key, DUMMY_CURRENT, _dummy_forecast,
)
from .kma_grid import search_locations

_LOGGER = logging.getLogger(__name__)


class WeatherCurrentView(HomeAssistantView):
    """GET /api/green_smart/weather/current"""
    url = "/api/green_smart/weather/current"
    name = "api:green_smart:weather:current"
    requires_auth = True

    def __init__(self, store: WeatherStore) -> None:
        self._store = store

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        # PLC 가상 모드와 무관하게 API 키가 있으면 실제 데이터 반환
        try:
            data = await fetch_current(hass, self._store)
            # data에 API 키 없음 — fetch_current 보장
            return self.json(data)
        except RuntimeError as exc:
            if "no_api_key" in str(exc):
                # API 키 없음 → 가상 더미 데이터 (에러 응답 대신 표시 가능한 데이터)
                return self.json(DUMMY_CURRENT)
            _LOGGER.warning("날씨 조회 실패 (키 마스킹됨)")  # 메시지에 키 없음
            stale = self._store.get_stale("current")
            return self.json(stale if stale else DUMMY_CURRENT)


class WeatherForecastView(HomeAssistantView):
    """GET /api/green_smart/weather/forecast"""
    url = "/api/green_smart/weather/forecast"
    name = "api:green_smart:weather:forecast"
    requires_auth = True

    def __init__(self, store: WeatherStore) -> None:
        self._store = store

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            data = await fetch_forecast(hass, self._store)
            return self.json({"forecasts": data})
        except RuntimeError as exc:
            if "no_api_key" in str(exc):
                return self.json({"forecasts": _dummy_forecast()})
            _LOGGER.warning("예보 조회 실패 (키 마스킹됨)")
            stale = self._store.get_stale("forecast")
            return self.json({"forecasts": stale if stale else _dummy_forecast()})


class WeatherWeeklyView(HomeAssistantView):
    """GET /api/green_smart/weather/weekly — 단기+중기 통합 7일 예보."""
    url = "/api/green_smart/weather/weekly"
    name = "api:green_smart:weather:weekly"
    requires_auth = True

    def __init__(self, store: WeatherStore) -> None:
        self._store = store

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            data = await fetch_weekly_forecast(hass, self._store)
            return self.json({"weekly": data})
        except RuntimeError as exc:
            if "no_api_key" in str(exc):
                return self.json({"error": "no_api_key"})
            _LOGGER.warning("주간 예보 조회 실패 (키 마스킹됨)")
            stale = self._store.get_stale("weekly")
            return self.json({"weekly": stale or []})


class WeatherConfigView(HomeAssistantView):
    """GET/POST/DELETE /api/green_smart/weather/config — API 키 설정 관리."""
    url = "/api/green_smart/weather/config"
    name = "api:green_smart:weather:config"
    requires_auth = True

    def __init__(self, store: WeatherStore) -> None:
        self._store = store

    async def get(self, request: web.Request) -> web.Response:
        """현재 설정 상태 반환 — 마스킹된 키만 포함."""
        masked = await self._store.get_masked_key()
        masked_mid = await self._store.get_masked_mid_key()
        nx, ny = await self._store.get_location()
        location_name = await self._store.get_location_name()
        ta_regid, land_regid = await self._store.get_regids()
        return self.json({
            "has_key": masked is not None,
            "masked_key": masked,  # 원본 키 아님
            "has_mid_key": masked_mid is not None,
            "masked_mid_key": masked_mid,  # 원본 키 아님
            "nx": nx,
            "ny": ny,
            "location_name": location_name,
            "ta_regid": ta_regid,
            "land_regid": land_regid,
        })

    async def post(self, request: web.Request) -> web.Response:
        """API 키 + 위치 저장."""
        try:
            body = await request.json()
        except Exception:
            return self.json({"success": False, "error": "invalid_json"}, 400)

        api_key = body.get("api_key") or None  # 빈 문자열 → None
        mid_api_key = body.get("mid_api_key") or None
        nx = int(body.get("nx", 60))
        ny = int(body.get("ny", 127))
        location_name = body.get("location_name") or None
        ta_regid = body.get("ta_regid") or None
        land_regid = body.get("land_regid") or None

        # ta_regid/land_regid가 없으면 location_name으로 계산
        if (not ta_regid or not land_regid) and location_name:
            from .kma_grid import get_regids
            ta_regid, land_regid = get_regids(location_name)

        await self._store.save_config(
            api_key, nx, ny, location_name,
            mid_api_key=mid_api_key,
            ta_regid=ta_regid,
            land_regid=land_regid,
        )
        # 응답에 원본 키 절대 미포함
        return self.json({
            "success": True,
            "masked_key": await self._store.get_masked_key(),
            "masked_mid_key": await self._store.get_masked_mid_key(),
            "location_name": location_name,
            "ta_regid": ta_regid,
            "land_regid": land_regid,
        })

    async def delete(self, request: web.Request) -> web.Response:
        """API 키 삭제. ?type=mid 파라미터로 중기예보 키만 삭제 가능."""
        key_type = request.rel_url.query.get("type", "short")
        if key_type == "mid":
            await self._store.delete_mid_api_key()
        else:
            await self._store.delete_api_key()
        return self.json({"success": True})


class WeatherValidateKeyView(HomeAssistantView):
    """POST /api/green_smart/weather/validate-key — 저장된 키 유효성 검사."""
    url = "/api/green_smart/weather/validate-key"
    name = "api:green_smart:weather:validate-key"
    requires_auth = True

    def __init__(self, store: WeatherStore) -> None:
        self._store = store

    async def post(self, request: web.Request) -> web.Response:
        api_key = await self._store.get_api_key()
        if not api_key:
            return self.json({"valid": False, "message": "API 키가 설정되지 않았습니다"})

        hass = request.app["hass"]
        nx, ny = await self._store.get_location()
        valid = await validate_key(api_key, nx, ny, hass=hass)
        # 응답에 원본 키 없음
        return self.json({
            "valid": valid,
            "message": "API 키가 유효합니다" if valid else "API 키가 유효하지 않습니다",
        })


class WeatherValidateMidKeyView(HomeAssistantView):
    """POST /api/green_smart/weather/validate-mid-key — 중기예보 키 유효성 검사."""
    url = "/api/green_smart/weather/validate-mid-key"
    name = "api:green_smart:weather:validate-mid-key"
    requires_auth = True

    def __init__(self, store: WeatherStore) -> None:
        self._store = store

    async def post(self, request: web.Request) -> web.Response:
        api_key = await self._store.get_mid_api_key()
        if not api_key:
            return self.json({"valid": False, "message": "중기예보 API 키가 설정되지 않았습니다"})
        hass = request.app["hass"]
        ta_regid, _ = await self._store.get_regids()
        valid = await validate_mid_key(api_key, ta_regid, hass=hass)
        return self.json({
            "valid": valid,
            "message": "중기예보 API 키가 유효합니다" if valid else "중기예보 API 키가 유효하지 않습니다",
        })


class WeatherLocationSearchView(HomeAssistantView):
    """POST /api/green_smart/weather/search-location — 읍면동/시군구 격자 검색."""
    url = "/api/green_smart/weather/search-location"
    name = "api:green_smart:weather:search-location"
    requires_auth = True

    async def post(self, request: web.Request) -> web.Response:
        try:
            body = await request.json()
        except Exception:
            return self.json({"results": [], "error": "invalid_json"}, 400)
        query = (body.get("query") or "").strip()
        if not query:
            return self.json({"results": []})
        results = search_locations(query, max_results=5)
        return self.json({"results": results})


# ── 농약안전정보시스템 (PSIS) ──────────────────────────────────────────────────

PSIS_BASE = "https://apis.data.go.kr/1390802/psis/pesticideInfoList"


class PesticideSearchView(HomeAssistantView):
    """GET /api/green_smart/pesticide/search?q=농약명 — PSIS 농약 검색 프록시."""
    url = "/api/green_smart/pesticide/search"
    name = "api:green_smart:pesticide:search"
    requires_auth = True

    def __init__(self, store: WeatherStore) -> None:
        self._store = store

    async def get(self, request: web.Request) -> web.Response:
        query = (request.query.get("q") or "").strip()
        if not query:
            return self.json({"items": [], "error": "empty_query"}, 400)
        if len(query) < 1:
            return self.json({"items": []})

        api_key = await self._store.get_psis_api_key()
        if not api_key:
            return self.json({"items": [], "error": "no_psis_key"}, 503)

        hass = request.app["hass"]
        params = {
            "serviceKey": api_key,
            "pestnm": query,
            "numOfRows": "20",
            "pageNo": "1",
            "type": "json",
        }
        url = PSIS_BASE + "?" + urllib.parse.urlencode(params)
        try:
            async with hass.helpers.aiohttp_client.async_get_clientsession().get(
                url, timeout=10
            ) as resp:
                if resp.status != 200:
                    _LOGGER.warning("PSIS API 응답 오류: %s", resp.status)
                    return self.json({"items": [], "error": "upstream_error"}, 502)
                raw = await resp.json(content_type=None)
        except Exception as exc:
            _LOGGER.warning("PSIS API 호출 실패 (키 마스킹됨): %s", type(exc).__name__)
            return self.json({"items": [], "error": "network_error"}, 502)

        # PSIS 응답 파싱
        try:
            body = raw.get("body") or raw.get("response", {}).get("body", {})
            items_raw = body.get("items") or []
            if isinstance(items_raw, dict):
                items_raw = items_raw.get("item") or []
            items = [
                {
                    "name":    i.get("pestNm") or i.get("pestnm") or "",
                    "company": i.get("companyNm") or i.get("companynm") or "",
                    "regNo":   i.get("regNo") or i.get("regno") or "",
                    "crop":    i.get("crpNm") or i.get("crpnm") or "",
                    "pest":    i.get("prtcPestNm") or i.get("prtcpestnm") or "",
                }
                for i in (items_raw if isinstance(items_raw, list) else [])
                if i.get("pestNm") or i.get("pestnm")
            ]
            return self.json({"items": items})
        except Exception as exc:
            _LOGGER.warning("PSIS 응답 파싱 실패: %s", type(exc).__name__)
            return self.json({"items": [], "error": "parse_error"}, 500)


class PesticideKeyConfigView(HomeAssistantView):
    """POST /api/green_smart/pesticide/config — PSIS API 키 저장."""
    url = "/api/green_smart/pesticide/config"
    name = "api:green_smart:pesticide:config"
    requires_auth = True

    def __init__(self, store: WeatherStore) -> None:
        self._store = store

    async def post(self, request: web.Request) -> web.Response:
        try:
            body = await request.json()
        except Exception:
            return self.json({"ok": False, "error": "invalid_json"}, 400)
        key = (body.get("psis_api_key") or "").strip()
        if not key:
            await self._store.delete_psis_api_key()
            return self.json({"ok": True, "action": "deleted"})
        await self._store.save_psis_api_key(key)
        return self.json({"ok": True, "action": "saved"})

    async def get(self, request: web.Request) -> web.Response:
        masked = await self._store.get_masked_psis_key()
        return self.json({"psis_api_key": masked or ""})


class PesticideMixCheckView(HomeAssistantView):
    """POST /api/green_smart/pesticide/mix-check — 혼용 가능 여부 일괄 조회."""
    url  = "/api/green_smart/pesticide/mix-check"
    name = "api:green_smart:pesticide:mix-check"
    requires_auth = True

    MIX_BASE = "https://apis.data.go.kr/1390802/psis/pesticideMixPosblInfo"

    def __init__(self, store: WeatherStore) -> None:
        self._store = store

    async def post(self, request: web.Request) -> web.Response:
        try:
            body = await request.json()
        except Exception:
            return self.json({"pairs": [], "error": "invalid_json"}, 400)

        reg_nos = body.get("reg_nos", [])   # 등록번호 목록
        names   = body.get("names",   [])   # 약제명 목록 (표시용)

        if len(reg_nos) < 2:
            return self.json({"pairs": [], "error": "need_2_or_more"})

        api_key = await self._store.get_psis_api_key()
        if not api_key:
            return self.json({"pairs": [], "error": "no_psis_key"})

        hass    = request.app["hass"]
        session = hass.helpers.aiohttp_client.async_get_clientsession()
        pairs   = []

        for i in range(len(reg_nos)):
            for j in range(i + 1, len(reg_nos)):
                rn1, rn2 = reg_nos[i], reg_nos[j]
                n1  = names[i] if i < len(names) else rn1
                n2  = names[j] if j < len(names) else rn2

                if not rn1 or not rn2:
                    continue

                params = {
                    "serviceKey": api_key,
                    "regNo1": rn1,
                    "regNo2": rn2,
                    "type": "json",
                }
                url = self.MIX_BASE + "?" + urllib.parse.urlencode(params)
                try:
                    async with session.get(url, timeout=10) as resp:
                        raw = await resp.json(content_type=None)
                    bd   = raw.get("body") or raw.get("response", {}).get("body", {})
                    itms = bd.get("items") or []
                    if isinstance(itms, dict):
                        itms = itms.get("item") or []
                    if not itms:
                        mixable, note = None, "혼용 정보 없음"
                    else:
                        it  = itms[0] if isinstance(itms, list) else itms
                        yn  = (it.get("mixPosblAt") or it.get("mixposblat") or "").upper()
                        mixable = yn == "Y" if yn in ("Y", "N") else None
                        note = it.get("mixtureNote") or it.get("mixturenote") or ""
                except Exception as exc:
                    _LOGGER.warning("혼용조회 실패(%s/%s): %s", rn1, rn2, type(exc).__name__)
                    mixable, note = None, "조회 실패"

                pairs.append({
                    "pest1": n1, "pest2": n2,
                    "regNo1": rn1, "regNo2": rn2,
                    "mixable": mixable,
                    "note": note,
                })

        return self.json({"pairs": pairs})
