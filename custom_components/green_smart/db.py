"""MariaDB 커넥션 풀 및 공통 쿼리 헬퍼."""
from __future__ import annotations
import logging
import os
import aiomysql
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)
_pool: aiomysql.Pool | None = None


def _db_cfg() -> dict:
    """환경변수에서 DB 접속 정보 반환."""
    return {
        "host":     os.environ.get("DB_HOST", "127.0.0.1"),
        "port":     int(os.environ.get("DB_PORT", "3306")),
        "user":     os.environ.get("DB_USER", "gs_user"),
        "password": os.environ.get("DB_PASSWORD", ""),
        "db":       os.environ.get("DB_NAME", "green_smart"),
    }


async def get_pool(hass: HomeAssistant) -> aiomysql.Pool:
    """커넥션 풀 싱글톤 반환 (최초 호출 시 생성)."""
    global _pool
    if _pool is None or _pool.closed:
        cfg = _db_cfg()
        _pool = await aiomysql.create_pool(
            host=cfg["host"],
            port=cfg["port"],
            user=cfg["user"],
            password=cfg["password"],
            db=cfg["db"],
            charset="utf8mb4",
            autocommit=True,
            minsize=2,
            maxsize=10,
        )
        _LOGGER.info(
            "green_smart DB pool created (host=%s db=%s)", cfg["host"], cfg["db"]
        )
    return _pool


async def fetchall(hass: HomeAssistant, sql: str, args: tuple = ()) -> list[dict]:
    """SELECT → list[dict]. date/datetime 값은 ISO string으로 자동 변환."""
    pool = await get_pool(hass)
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(sql, args)
            rows = await cur.fetchall()
    result = []
    for row in rows:
        result.append(
            {k: (v.isoformat() if hasattr(v, "isoformat") else v) for k, v in row.items()}
        )
    return result


async def fetchone(hass: HomeAssistant, sql: str, args: tuple = ()) -> dict | None:
    """SELECT 단건 → dict | None."""
    rows = await fetchall(hass, sql, args)
    return rows[0] if rows else None


async def execute(hass: HomeAssistant, sql: str, args: tuple = ()) -> int:
    """INSERT/UPDATE/DELETE → lastrowid(INSERT) 또는 rowcount."""
    pool = await get_pool(hass)
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(sql, args)
            return cur.lastrowid if cur.lastrowid else cur.rowcount


async def close_pool() -> None:
    """풀 종료 — HA 언로드 시 호출."""
    global _pool
    if _pool and not _pool.closed:
        _pool.close()
        await _pool.wait_closed()
        _pool = None
