"""기상청 API 통신 및 API 키 보안 관리."""
from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Any

import aiohttp
try:
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.aiohttp_client import async_get_clientsession
    from homeassistant.helpers.storage import Store
except ModuleNotFoundError:  # Allow isolated helper-contract tests without a full HA package.
    HomeAssistant = Any

    def async_get_clientsession(hass):
        raise RuntimeError("Home Assistant aiohttp client session is unavailable outside HA runtime")

    class Store:  # type: ignore[no-redef]
        def __init__(self, *args, **kwargs):
            raise RuntimeError("Home Assistant storage is unavailable outside HA runtime")

_LOGGER = logging.getLogger(__name__)

STORAGE_KEY = "green_smart_weather"
STORAGE_VERSION = 1
CACHE_TTL = 600  # 10분
KMA_BASE = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0"
KMA_MID_BASE = "https://apis.data.go.kr/1360000/MidFcstInfoService"

PTY_MAP = {"0":"없음","1":"비","2":"비/눈","3":"눈","5":"빗방울","6":"빗방울눈날림","7":"눈날림"}
SKY_MAP = {"1":"맑음","3":"구름많음","4":"흐림"}
WIND_DIRS = ["북","북북동","북동","동북동","동","동남동","남동","남남동","남","남남서","남서","서남서","서","서북서","북서","북북서"]


def _mask_key(key: str) -> str:
    """API 키 마스킹 — 마지막 4자리만 노출."""
    if not key:
        return "****"
    if len(key) <= 4:
        return "****"
    return "****" + key[-4:]


def _wind_dir(deg: float) -> str:
    return WIND_DIRS[round(deg / 22.5) % 16]


def _ncst_base_time() -> tuple[str, str]:
    """초단기실황 base_date, base_time 계산."""
    now = datetime.now()
    if now.minute < 10:
        base = (now - timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
    else:
        base = now.replace(minute=0, second=0, microsecond=0)
    return base.strftime("%Y%m%d"), base.strftime("%H%M")


def _fcst_base_time() -> tuple[str, str]:
    """단기예보 base_date, base_time 계산."""
    hours = [2, 5, 8, 11, 14, 17, 20, 23]
    now = datetime.now()
    cur = now.hour * 60 + now.minute
    base_hour = 23
    base_date = now
    for h in reversed(hours):
        if cur >= h * 60 + 10:
            base_hour = h
            break
    else:
        base_date = now - timedelta(days=1)
        base_hour = 23
    return base_date.strftime("%Y%m%d"), f"{base_hour:02d}00"


def _mid_base_time() -> str:
    """중기예보 발표시각(tmFc) 계산 — 매일 06:00/18:00 발표, 30분 뒤 조회 가능."""
    now = datetime.now()
    if now.hour > 18 or (now.hour == 18 and now.minute >= 30):
        base = now.replace(hour=18, minute=0, second=0, microsecond=0)
    elif now.hour > 6 or (now.hour == 6 and now.minute >= 30):
        base = now.replace(hour=6, minute=0, second=0, microsecond=0)
    else:
        base = (now - timedelta(days=1)).replace(hour=18, minute=0, second=0, microsecond=0)
    return base.strftime("%Y%m%d%H%M")


# ── 더미 데이터 (virtual mode) ────────────────────────────────────────────────

DUMMY_CURRENT = {
    "mode": "virtual",
    "temperature": 22.5,
    "humidity": 65,
    "wind_speed": 2.3,
    "wind_direction_deg": 225.0,
    "wind_direction": "남서",
    "precipitation": 0.0,
    "precipitation_type": "없음",
    "sky": "맑음",
    "radiation": 450,
    "updated": "시뮬레이션 데이터",
}

def _dummy_forecast() -> list[dict]:
    import random
    now = datetime.now()
    result = []
    for i in range(24):
        t = now + timedelta(hours=i)
        result.append({
            "date": t.strftime("%Y%m%d"),
            "time": t.strftime("%H00"),
            "temp": round(22 + random.uniform(-3, 5), 1),
            "humidity": random.randint(55, 80),
            "sky": random.choice(["맑음","구름많음","흐림"]),
            "precipitation_type": "없음",
            "pop": random.randint(0, 30),
            "wind_speed": round(random.uniform(0.5, 5), 1),
            "wind_direction": random.choice(["북","남","동","서","남서"]),
        })
    return result


# ── WeatherStore ───────────────────────────────────────────────────────────────

class WeatherStore:
    """API 키와 위치 설정을 HA Storage에 안전하게 보관."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._hass = hass
        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._cache: dict[str, Any] = {}

    async def get_api_key(self) -> str | None:
        """원본 API 키 반환 — 백엔드 내부 전용."""
        data = await self._store.async_load() or {}
        return data.get("api_key")

    async def get_masked_key(self) -> str | None:
        """마스킹된 키 반환 — frontend에 전달해도 안전."""
        key = await self.get_api_key()
        return _mask_key(key) if key else None

    async def get_mid_api_key(self) -> str | None:
        """중기예보 API 키 — 없으면 단기예보 키로 폴백."""
        data = await self._store.async_load() or {}
        return data.get("mid_api_key") or data.get("api_key")

    async def get_masked_mid_key(self) -> str | None:
        """마스킹된 중기예보 키 반환."""
        data = await self._store.async_load() or {}
        key = data.get("mid_api_key")
        return _mask_key(key) if key else None

    async def get_regids(self) -> tuple[str, str]:
        """저장된 ta_regid, land_regid 반환. 없으면 location_name으로 계산."""
        data = await self._store.async_load() or {}
        ta = data.get("ta_regid")
        land = data.get("land_regid")
        if ta and land:
            return ta, land
        from .kma_grid import get_regids as _gr
        return _gr(data.get("location_name") or "")

    async def get_location(self) -> tuple[int, int]:
        data = await self._store.async_load() or {}
        return int(data.get("nx", 60)), int(data.get("ny", 127))

    async def get_location_name(self) -> str | None:
        data = await self._store.async_load() or {}
        return data.get("location_name")

    async def save_config(
        self,
        api_key: str | None,
        nx: int,
        ny: int,
        location_name: str | None = None,
        mid_api_key: str | None = None,
        ta_regid: str | None = None,
        land_regid: str | None = None,
    ) -> None:
        data = await self._store.async_load() or {}
        if api_key is not None:
            data["api_key"] = api_key
        if mid_api_key is not None:
            data["mid_api_key"] = mid_api_key
        data["nx"] = nx
        data["ny"] = ny
        if location_name is not None:
            data["location_name"] = location_name
        if ta_regid is not None:
            data["ta_regid"] = ta_regid
        if land_regid is not None:
            data["land_regid"] = land_regid
        await self._store.async_save(data)
        self._cache.clear()  # 저장 후 모든 캐시 무효화 → 다음 API 호출에서 새 키 사용

    async def delete_api_key(self) -> None:
        data = await self._store.async_load() or {}
        data.pop("api_key", None)
        await self._store.async_save(data)

    async def delete_mid_api_key(self) -> None:
        data = await self._store.async_load() or {}
        data.pop("mid_api_key", None)
        await self._store.async_save(data)

    # ── PSIS 농약안전정보 API 키 ────────────────────────────────────────────────

    async def get_psis_api_key(self) -> str | None:
        """PSIS API 키 반환 — 백엔드 내부 전용."""
        data = await self._store.async_load() or {}
        return data.get("psis_api_key")

    async def get_masked_psis_key(self) -> str | None:
        """마스킹된 PSIS 키 반환 — frontend에 전달해도 안전."""
        key = await self.get_psis_api_key()
        return _mask_key(key) if key else None

    async def save_psis_api_key(self, key: str) -> None:
        data = await self._store.async_load() or {}
        data["psis_api_key"] = key
        await self._store.async_save(data)
        self._cache.clear()

    async def delete_psis_api_key(self) -> None:
        data = await self._store.async_load() or {}
        data.pop("psis_api_key", None)
        await self._store.async_save(data)

    # ── 캐시 헬퍼 ──────────────────────────────────────────────────────────────

    def get_cached(self, key: str) -> dict | None:
        entry = self._cache.get(key, {})
        if entry.get("data") and time.time() - entry.get("ts", 0) < CACHE_TTL:
            return entry["data"]
        return None

    def set_cached(self, key: str, data: dict) -> None:
        self._cache[key] = {"data": data, "ts": time.time()}

    def get_stale(self, key: str) -> dict | None:
        """캐시 만료 시에도 이전 데이터 반환 (rate limit 방지)."""
        return self._cache.get(key, {}).get("data")


# ── 기상청 API 호출 ─────────────────────────────────────────────────────────────

async def _kma_get(session: aiohttp.ClientSession, endpoint: str, params: dict) -> dict:
    """기상청 API GET — API 키를 params에 포함하지만 로그/에러에 노출 안 함."""
    url = f"{KMA_BASE}/{endpoint}"
    # params에 serviceKey 포함 — URL이 로그에 찍히지 않도록 주의
    try:
        async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            if resp.status != 200:
                raise RuntimeError(f"KMA API HTTP {resp.status}")
            body = await resp.json(content_type=None)
    except aiohttp.ClientError as exc:
        # exc 메시지에 URL(키 포함) 노출 방지
        raise RuntimeError("KMA API 연결 실패") from None

    header = body.get("response", {}).get("header", {})
    if header.get("resultCode") not in ("00", None):
        msg = header.get("resultMsg", "Unknown")
        # resultMsg에는 키 없음 — 안전하게 로깅
        raise RuntimeError(f"KMA API 오류: {msg}")

    items = body.get("response", {}).get("body", {}).get("items", {}).get("item", [])
    return items


async def _mid_kma_get(session: aiohttp.ClientSession, endpoint: str, params: dict) -> dict:
    """기상청 중기예보 API GET — API 키를 params에 포함하지만 로그/에러에 노출 안 함."""
    url = f"{KMA_MID_BASE}/{endpoint}"
    try:
        async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            if resp.status != 200:
                raise RuntimeError(f"KMA MID API HTTP {resp.status}")
            body = await resp.json(content_type=None)
    except aiohttp.ClientError:
        # exc 메시지에 URL(키 포함) 노출 방지
        raise RuntimeError("KMA 중기예보 연결 실패") from None

    header = body.get("response", {}).get("header", {})
    if header.get("resultCode") not in ("00", None):
        raise RuntimeError(f"KMA 중기예보 오류: {header.get('resultMsg', '')}")

    items = body.get("response", {}).get("body", {}).get("items", {}).get("item", [])
    return items[0] if items else {}


async def fetch_current(hass: HomeAssistant, store: WeatherStore) -> dict:
    """현재 날씨 데이터 반환. 캐시 우선, 실패 시 stale 사용."""
    cached = store.get_cached("current")
    if cached:
        return cached

    api_key = await store.get_api_key()
    if not api_key:
        raise RuntimeError("no_api_key")

    nx, ny = await store.get_location()
    base_date, base_time = _ncst_base_time()

    params = {
        "serviceKey": api_key,   # 원본 키 — URL 파라미터로만 사용
        "numOfRows": 10,
        "pageNo": 1,
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": nx,
        "ny": ny,
    }

    try:
        session = async_get_clientsession(hass)
        # 초단기실황 + 초단기예보 병렬 호출 (예보에서 SKY 추출)
        sky_params = {**params, "numOfRows": 60}
        ncst_task = _kma_get(session, "getUltraSrtNcst", params)
        fcst_task = _kma_get(session, "getUltraSrtFcst", sky_params)
        items, fcst_items = await asyncio.gather(ncst_task, fcst_task, return_exceptions=True)
        if isinstance(items, Exception):
            stale = store.get_stale("current")
            if stale:
                return stale
            raise items
        if isinstance(fcst_items, Exception):
            fcst_items = []
    except RuntimeError:
        stale = store.get_stale("current")
        if stale:
            return stale
        raise

    raw = {item["category"]: item["obsrValue"] for item in items}

    # 초단기예보에서 첫 번째 SKY 값 추출
    sky = next(
        (SKY_MAP.get(str(i.get("fcstValue", "1")), "맑음")
         for i in fcst_items if isinstance(i, dict) and i.get("category") == "SKY"),
        "맑음",
    )

    result = {
        "mode": "real",
        "temperature": float(raw.get("T1H", 0)),
        "humidity": int(raw.get("REH", 0)),
        "wind_speed": float(raw.get("WSD", 0)),
        "wind_direction_deg": float(raw.get("VEC", 0)),
        "wind_direction": _wind_dir(float(raw.get("VEC", 0))),
        "precipitation": _parse_rn1(raw.get("RN1", "0")),
        "precipitation_type": PTY_MAP.get(raw.get("PTY", "0"), "없음"),
        "sky": sky,
        "updated": f"{base_date[:4]}-{base_date[4:6]}-{base_date[6:]} {base_time[:2]}:{base_time[2:]}",
    }
    # API 키는 result에 절대 포함하지 않음
    store.set_cached("current", result)
    return result


def _parse_rn1(val: str) -> float:
    """강수량 파싱 — '강수없음', '1mm 미만' 등 처리."""
    if not val or val in ("강수없음", "-"):
        return 0.0
    try:
        return float(val.replace("mm 미만", "").replace("mm", "").strip())
    except ValueError:
        return 0.0


async def fetch_forecast(hass: HomeAssistant, store: WeatherStore) -> list[dict]:
    """단기예보 반환. 캐시 우선, 실패 시 stale."""
    cached = store.get_cached("forecast")
    if cached:
        return cached

    api_key = await store.get_api_key()
    if not api_key:
        raise RuntimeError("no_api_key")

    nx, ny = await store.get_location()
    base_date, base_time = _fcst_base_time()

    params = {
        "serviceKey": api_key,
        "numOfRows": 1000,
        "pageNo": 1,
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": nx,
        "ny": ny,
    }

    try:
        session = async_get_clientsession(hass)
        items = await _kma_get(session, "getVilageFcst", params)
    except RuntimeError:
        stale = store.get_stale("forecast")
        if stale:
            return stale
        raise

    grouped: dict[str, dict] = {}
    for item in items:
        key = f"{item['fcstDate']}_{item['fcstTime']}"
        if key not in grouped:
            grouped[key] = {"date": item["fcstDate"], "time": item["fcstTime"]}
        grouped[key][item["category"]] = item["fcstValue"]

    result = []
    for key in sorted(grouped.keys())[:48]:
        f = grouped[key]
        result.append({
            "date": f["date"],
            "time": f["time"],
            "temp": f.get("TMP", "--"),
            "humidity": f.get("REH", "--"),
            "sky": SKY_MAP.get(f.get("SKY", "1"), "맑음"),
            "precipitation_type": PTY_MAP.get(f.get("PTY", "0"), "없음"),
            "pop": f.get("POP", "0"),
            "wind_speed": f.get("WSD", "--"),
            "wind_direction": _wind_dir(float(f.get("VEC", "0"))),
            "temp_min": f.get("TMN"),
            "temp_max": f.get("TMX"),
        })

    # API 키 result에 절대 없음
    store.set_cached("forecast", result)
    return result


async def fetch_weekly_forecast(hass: HomeAssistant, store: WeatherStore) -> list[dict]:
    """단기예보(D+0~D+2) daily 집계 + 중기예보(D+3~D+7) 결합. 7일치 daily 리스트 반환."""
    cached = store.get_cached("weekly")
    if cached:
        return cached

    api_key = await store.get_api_key()
    if not api_key:
        raise RuntimeError("no_api_key")

    mid_api_key = await store.get_mid_api_key()  # 중기예보용 (없으면 api_key 폴백)
    nx, ny = await store.get_location()
    ta_regid, land_regid = await store.get_regids()  # Store에서 가져오기 (폴백 포함)
    tmfc = _mid_base_time()

    session = async_get_clientsession(hass)

    # ── 단기예보 (D+0~D+2) ─────────────────────────────────────────────────────
    base_date, base_time = _fcst_base_time()
    short_params = {
        "serviceKey": api_key,
        "numOfRows": 1000,
        "pageNo": 1,
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": nx,
        "ny": ny,
    }
    try:
        short_items = await _kma_get(session, "getVilageFcst", short_params)
    except RuntimeError:
        short_items = []

    # 단기예보 → 날짜별 집계
    by_date: dict[str, dict] = {}
    for item in short_items:
        d = item.get("fcstDate")
        if not d:
            continue
        if d not in by_date:
            by_date[d] = {"temps": [], "pops": [], "skies": {}, "tmn": None, "tmx": None}
        e = by_date[d]
        cat, val = item.get("category"), item.get("fcstValue")
        if cat == "TMP":
            try:
                e["temps"].append(float(val))
            except (ValueError, TypeError):
                pass
        elif cat == "POP":
            try:
                e["pops"].append(int(val))
            except (ValueError, TypeError):
                pass
        elif cat == "SKY":
            sky = SKY_MAP.get(str(val), "맑음")
            e["skies"][sky] = e["skies"].get(sky, 0) + 1
        elif cat == "TMN":
            try:
                e["tmn"] = float(val)
            except (ValueError, TypeError):
                pass
        elif cat == "TMX":
            try:
                e["tmx"] = float(val)
            except (ValueError, TypeError):
                pass

    short_dates = sorted(by_date.keys())[:3]
    short_daily = []
    for d in short_dates:
        e = by_date[d]
        tmn = e["tmn"] if e["tmn"] is not None else (min(e["temps"]) if e["temps"] else None)
        tmx = e["tmx"] if e["tmx"] is not None else (max(e["temps"]) if e["temps"] else None)
        top_sky = max(e["skies"], key=e["skies"].get) if e["skies"] else "맑음"
        pop = max(e["pops"]) if e["pops"] else 0
        short_daily.append({
            "date": d,
            "sky": top_sky,
            "pop": pop,
            "temp_min": round(tmn, 1) if tmn is not None else None,
            "temp_max": round(tmx, 1) if tmx is not None else None,
            "source": "short",
        })

    # ── 중기예보 (D+3~D+7) ─────────────────────────────────────────────────────
    mid_params_common = {
        "serviceKey": mid_api_key,   # 중기예보 전용 키 (폴백 포함)
        "numOfRows": 10,
        "pageNo": 1,
        "dataType": "JSON",
        "tmFc": tmfc,
    }

    try:
        ta_item = await _mid_kma_get(session, "getMidTa", {**mid_params_common, "regId": ta_regid})
    except RuntimeError:
        ta_item = {}

    try:
        land_item = await _mid_kma_get(session, "getMidLandFcst", {**mid_params_common, "regId": land_regid})
    except RuntimeError:
        land_item = {}

    # D+3~D+7 날짜 계산 (base_date 기준)
    base_dt = datetime.strptime(base_date, "%Y%m%d")
    mid_daily = []
    for offset in range(3, 8):  # D+3 ~ D+7
        day_dt = base_dt + timedelta(days=offset)
        d = day_dt.strftime("%Y%m%d")
        n = offset  # 3~7

        # 기온
        try:
            tmn = float(ta_item.get(f"taMin{n}", 0))
            tmx = float(ta_item.get(f"taMax{n}", 0))
        except (ValueError, TypeError):
            tmn, tmx = None, None

        # 하늘/강수확률 (Am/Pm 중 나쁜 쪽)
        if n <= 7:
            wf_am = land_item.get(f"wf{n}Am", "")
            wf_pm = land_item.get(f"wf{n}Pm", "")
            rn_am = int(land_item.get(f"rnSt{n}Am", 0) or 0)
            rn_pm = int(land_item.get(f"rnSt{n}Pm", 0) or 0)
            # 오후 기준 (더 나쁜 날씨)
            sky = wf_pm or wf_am or "맑음"
            pop = max(rn_am, rn_pm)
        else:
            sky = land_item.get(f"wf{n}", "맑음")
            pop = int(land_item.get(f"rnSt{n}", 0) or 0)

        # 중기예보 하늘 텍스트 → 단순화
        sky = _normalize_mid_sky(sky)

        mid_daily.append({
            "date": d,
            "sky": sky,
            "pop": pop,
            "temp_min": round(tmn, 1) if tmn is not None else None,
            "temp_max": round(tmx, 1) if tmx is not None else None,
            "source": "mid",
        })

    result = short_daily + mid_daily
    store.set_cached("weekly", result)
    return result


def _normalize_mid_sky(text: str) -> str:
    """중기예보 하늘 텍스트 → 단기예보와 동일한 카테고리로 정규화."""
    if not text:
        return "맑음"
    t = text.strip()
    if "비" in t and "눈" in t:
        return "비/눈"
    if "비" in t or "소나기" in t:
        return "비"
    if "눈" in t:
        return "눈"
    if "흐림" in t:
        return "흐림"
    if "구름많음" in t or "구름 많음" in t:
        return "구름많음"
    return "맑음"


async def validate_key(api_key: str, nx: int = 60, ny: int = 127, hass: HomeAssistant | None = None) -> bool:
    """API 키 유효성 검사. 예외 발생 시 마스킹 처리."""
    base_date, base_time = _ncst_base_time()
    params = {
        "serviceKey": api_key,
        "numOfRows": 1,
        "pageNo": 1,
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": nx,
        "ny": ny,
    }
    try:
        if hass is not None:
            session = async_get_clientsession(hass)
            await _kma_get(session, "getUltraSrtNcst", params)
        else:
            async with aiohttp.ClientSession() as session:
                await _kma_get(session, "getUltraSrtNcst", params)
        return True
    except RuntimeError:
        return False
    except Exception:
        return False


async def validate_mid_key(api_key: str, ta_regid: str, hass: HomeAssistant) -> bool:
    """중기기온예보 API 키 유효성 검사 — getMidTa 1회 호출."""
    try:
        session = async_get_clientsession(hass)
        tmfc = _mid_base_time()
        params = {
            "serviceKey": api_key,
            "numOfRows": 1,
            "pageNo": 1,
            "dataType": "JSON",
            "regId": ta_regid or "11B10101",
            "tmFc": tmfc,
        }
        item = await _mid_kma_get(session, "getMidTa", params)
        return bool(item)
    except Exception:
        return False
