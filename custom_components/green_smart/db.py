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


async def _ensure_column(cur, table: str, column: str, ddl: str) -> None:
    await cur.execute(
        """
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s
        """,
        (table, column),
    )
    row = await cur.fetchone()
    exists = bool(row and row[0])
    if not exists:
        await cur.execute(f"ALTER TABLE {table} ADD COLUMN {ddl}")


async def ensure_schema(hass: HomeAssistant) -> None:
    """Create the crop-management schema used by the Green Smart panel.

    Older installs can have the integration code without the new crop tables.
    Keep this idempotent so HA restarts safely bootstrap missing tables before
    the HTTP views try to read/write crop records.
    """
    statements = (
        """
        CREATE TABLE IF NOT EXISTS zones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_zones_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS crop_seasons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            greenhouse_id INT NOT NULL DEFAULT 1,
            zone_id INT NOT NULL DEFAULT 1,
            crop_type VARCHAR(50) NOT NULL DEFAULT 'other',
            variety VARCHAR(100) NOT NULL DEFAULT '',
            method VARCHAR(50) NOT NULL DEFAULT 'hydro',
            plant_date DATE NOT NULL,
            demolish_date DATE NULL,
            row_spacing DECIMAL(10,2) NULL,
            plant_spacing DECIMAL(10,2) NULL,
            total_plants INT NULL,
            plant_density DECIMAL(10,2) NULL,
            train_dir VARCHAR(20) NOT NULL DEFAULT 'v',
            notes TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL,
            KEY idx_crop_seasons_zone (zone_id),
            KEY idx_crop_seasons_deleted_plant (deleted_at, plant_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS growth_surveys (
            id INT AUTO_INCREMENT PRIMARY KEY,
            season_id INT NOT NULL,
            survey_date DATE NOT NULL,
            plant_height DECIMAL(10,2) NULL,
            leaf_count DECIMAL(10,2) NULL,
            stem_diameter DECIMAL(10,2) NULL,
            truss_count DECIMAL(10,2) NULL,
            node_count DECIMAL(10,2) NULL,
            crop_type VARCHAR(50) NOT NULL DEFAULT 'other',
            metrics_json TEXT NULL,
            notes TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL,
            KEY idx_growth_surveys_season (season_id, deleted_at, survey_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS pest_surveys (
            id INT AUTO_INCREMENT PRIMARY KEY,
            season_id INT NOT NULL,
            survey_date DATE NOT NULL,
            pest_type VARCHAR(100) NOT NULL,
            location VARCHAR(100) NOT NULL DEFAULT '',
            severity INT NOT NULL DEFAULT 1,
            notes TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL,
            KEY idx_pest_surveys_season (season_id, deleted_at, survey_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS control_records (
            id INT AUTO_INCREMENT PRIMARY KEY,
            season_id INT NOT NULL,
            control_date DATE NOT NULL,
            zone_description VARCHAR(200) NOT NULL DEFAULT '',
            notes TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL,
            KEY idx_control_records_season (season_id, deleted_at, control_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS control_pesticides (
            id INT AUTO_INCREMENT PRIMARY KEY,
            control_id INT NOT NULL,
            sort_order INT NOT NULL DEFAULT 0,
            pesticide_name VARCHAR(200) NOT NULL,
            reg_no VARCHAR(80) NULL,
            mode_of_action VARCHAR(100) NULL,
            dilution_ratio INT NULL,
            usage_amount VARCHAR(100) NULL,
            pls_compliant TINYINT(1) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_control_pesticides_control (control_id, sort_order),
            KEY idx_control_pesticides_name (pesticide_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS zone_control_settings (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id INT NOT NULL DEFAULT 1,
            crop_season_id INT NOT NULL,
            zone_id INT NOT NULL,
            domain VARCHAR(32) NOT NULL,
            settings_json JSON NOT NULL,
            version INT NOT NULL DEFAULT 1,
            created_by VARCHAR(128) NULL,
            updated_by VARCHAR(128) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_zone_control_settings (farm_id, crop_season_id, zone_id, domain),
            KEY idx_zone_control_settings_lookup (farm_id, crop_season_id, domain)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS zone_final_control_targets (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id INT NOT NULL DEFAULT 1,
            crop_season_id INT NOT NULL,
            zone_id INT NOT NULL,
            domain VARCHAR(32) NOT NULL,
            targets_json JSON NOT NULL,
            source_ai_output_id BIGINT NULL,
            source_settings_id BIGINT NULL,
            calculated_by VARCHAR(64) NOT NULL DEFAULT 'system',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_zone_final_targets (farm_id, crop_season_id, zone_id, domain, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS zone_control_logs (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id INT NOT NULL DEFAULT 1,
            crop_season_id INT NOT NULL,
            zone_id INT NOT NULL,
            domain VARCHAR(32) NOT NULL,
            actor VARCHAR(128) NULL,
            actor_role VARCHAR(64) NULL,
            action VARCHAR(128) NOT NULL,
            before_json JSON NULL,
            after_json JSON NULL,
            result VARCHAR(64) NOT NULL,
            message TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_zone_control_logs (farm_id, crop_season_id, zone_id, domain, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS zone_control_copy_jobs (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id INT NOT NULL DEFAULT 1,
            crop_season_id INT NOT NULL,
            domain VARCHAR(32) NOT NULL,
            from_zone_id INT NOT NULL,
            to_zone_ids JSON NOT NULL,
            copied_settings_json JSON NOT NULL,
            actor VARCHAR(128) NULL,
            result VARCHAR(64) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_zone_control_copy_jobs (farm_id, crop_season_id, domain, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS ai_zone_control_outputs (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id INT NOT NULL DEFAULT 1,
            crop_season_id INT NOT NULL,
            zone_id INT NOT NULL,
            domain VARCHAR(32) NOT NULL,
            model_name VARCHAR(128) NULL,
            strategy_json JSON NOT NULL,
            explanation TEXT NULL,
            safety_status VARCHAR(64) NOT NULL DEFAULT 'pending',
            applied TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_ai_zone_control_outputs (farm_id, crop_season_id, zone_id, domain, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        "INSERT IGNORE INTO zones (id, name) VALUES (1, '1구역')",
    )
    pool = await get_pool(hass)
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            for statement in statements:
                await cur.execute(statement)
            await _ensure_column(cur, "growth_surveys", "crop_type", "crop_type VARCHAR(50) NOT NULL DEFAULT 'other' AFTER node_count")
            await _ensure_column(cur, "growth_surveys", "metrics_json", "metrics_json TEXT NULL AFTER crop_type")
    _LOGGER.info("green_smart DB schema ensured")


async def close_pool() -> None:
    """풀 종료 — HA 언로드 시 호출."""
    global _pool
    if _pool and not _pool.closed:
        _pool.close()
        await _pool.wait_closed()
        _pool = None
