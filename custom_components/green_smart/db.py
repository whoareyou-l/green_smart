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
            mixable TINYINT(1) NULL,
            mix_check_status VARCHAR(32) NULL,
            mix_check_note TEXT NULL,
            pls_warning TEXT NULL,
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
        CREATE TABLE IF NOT EXISTS zone_interlock_settings (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id INT NOT NULL DEFAULT 1,
            crop_season_id INT NOT NULL,
            zone_id INT NOT NULL,
            domain VARCHAR(32) NOT NULL,
            settings_json JSON NOT NULL,
            enabled TINYINT(1) NOT NULL DEFAULT 1,
            created_by VARCHAR(128) NULL,
            updated_by VARCHAR(128) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_zone_interlock_settings (farm_id, crop_season_id, zone_id, domain),
            KEY idx_zone_interlock_settings_lookup (farm_id, crop_season_id, domain, enabled)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS zone_control_modes (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id INT NOT NULL DEFAULT 1,
            crop_season_id INT NOT NULL,
            zone_id INT NOT NULL,
            domain VARCHAR(32) NOT NULL,
            mode VARCHAR(32) NOT NULL DEFAULT 'manual',
            allow_auto_execution TINYINT(1) NOT NULL DEFAULT 0,
            override_reason TEXT NULL,
            override_expires_at DATETIME NULL,
            created_by VARCHAR(128) NULL,
            updated_by VARCHAR(128) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_zone_control_modes (farm_id, crop_season_id, zone_id, domain),
            KEY idx_zone_control_modes_lookup (farm_id, crop_season_id, zone_id, domain, mode)
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
        """
        CREATE TABLE IF NOT EXISTS zone_device_entity_mappings (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id INT NOT NULL DEFAULT 1,
            crop_season_id INT NOT NULL,
            zone_id INT NOT NULL,
            domain VARCHAR(32) NOT NULL,
            device_type VARCHAR(64) NOT NULL,
            entity_id VARCHAR(255) NOT NULL,
            control_role VARCHAR(64) NOT NULL,
            safe_state VARCHAR(64) NULL,
            enabled TINYINT(1) NOT NULL DEFAULT 1,
            note TEXT NULL,
            created_by VARCHAR(128) NULL,
            updated_by VARCHAR(128) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_zone_device_entity_mappings (farm_id, crop_season_id, zone_id, domain, entity_id, control_role),
            KEY idx_zone_device_entity_mappings (farm_id, crop_season_id, zone_id, domain, enabled)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS devices (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            zone_id INT NULL,
            name VARCHAR(100) NOT NULL,
            device_type VARCHAR(64) NOT NULL,
            entity_id VARCHAR(255) NULL,
            enabled TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_devices_entity (farm_id, entity_id),
            KEY idx_devices_farm_type (farm_id, device_type, enabled)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS device_groups (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            name VARCHAR(100) NOT NULL,
            group_type VARCHAR(64) NOT NULL,
            description TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_device_groups_farm_type (farm_id, group_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS device_group_items (
            group_id BIGINT NOT NULL,
            device_id BIGINT NOT NULL,
            sort_order INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (group_id, device_id),
            KEY idx_device_group_items_device (device_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS device_status (
            device_id BIGINT PRIMARY KEY,
            current_state VARCHAR(64) NULL,
            operation_mode VARCHAR(64) NULL,
            controller VARCHAR(64) NULL,
            communication_status VARCHAR(64) NULL,
            telemetry_json JSON NULL,
            last_updated TIMESTAMP NULL,
            KEY idx_device_status_updated (last_updated)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS device_control_logs (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            device_id BIGINT NULL,
            farm_id BIGINT NOT NULL DEFAULT 1,
            zone_id INT NULL,
            previous_state VARCHAR(64) NULL,
            next_state VARCHAR(64) NULL,
            control_type VARCHAR(64) NULL,
            actor VARCHAR(128) NULL,
            result VARCHAR(64) NULL,
            message TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_device_control_logs_device (device_id, created_at),
            KEY idx_device_control_logs_farm_zone (farm_id, zone_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS device_interlocks (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            name VARCHAR(100) NOT NULL,
            enabled TINYINT(1) NOT NULL DEFAULT 1,
            priority INT NOT NULL DEFAULT 100,
            description TEXT NULL,
            condition_json JSON NOT NULL,
            action_json JSON NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_device_interlocks_farm_enabled (farm_id, enabled, priority)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS device_failsafe_rules (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            trigger_type VARCHAR(64) NOT NULL,
            enabled TINYINT(1) NOT NULL DEFAULT 1,
            priority INT NOT NULL DEFAULT 100,
            action_json JSON NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_device_failsafe_farm_enabled (farm_id, enabled, priority)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS device_alarms (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            device_id BIGINT NULL,
            farm_id BIGINT NOT NULL DEFAULT 1,
            alarm_type VARCHAR(64) NULL,
            message TEXT NULL,
            status VARCHAR(64) NULL,
            occurred_at TIMESTAMP NULL,
            cleared_at TIMESTAMP NULL,
            KEY idx_device_alarms_device_status (device_id, status, occurred_at),
            KEY idx_device_alarms_farm_status (farm_id, status, occurred_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS ventilation_device_settings (
            device_id BIGINT PRIMARY KEY,
            enabled TINYINT(1) NULL,
            auto_control TINYINT(1) NULL,
            manual_allowed TINYINT(1) NULL,
            min_open_percent INT NULL,
            max_open_percent INT NULL,
            default_open_percent INT NULL,
            control_unit VARCHAR(32) NULL,
            delay_sec INT NULL,
            max_continuous_min INT NULL,
            direction VARCHAR(32) NULL,
            position_feedback TINYINT(1) NULL,
            settings_json JSON NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS screen_device_settings (
            device_id BIGINT PRIMARY KEY,
            enabled TINYINT(1) NULL,
            auto_control TINYINT(1) NULL,
            manual_allowed TINYINT(1) NULL,
            min_open_percent INT NULL,
            max_open_percent INT NULL,
            default_open_percent INT NULL,
            control_unit VARCHAR(32) NULL,
            delay_sec INT NULL,
            max_continuous_min INT NULL,
            direction VARCHAR(32) NULL,
            position_feedback TINYINT(1) NULL,
            settings_json JSON NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS irrigation_settings (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            crop_season_id INT NULL,
            zone_id INT NULL,
            settings_json JSON NOT NULL,
            updated_by VARCHAR(128) NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_irrigation_settings_lookup (farm_id, crop_season_id, zone_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            zone_id INT NULL,
            reading_type VARCHAR(64) NOT NULL,
            value DOUBLE NOT NULL,
            unit VARCHAR(32) NULL,
            captured_at TIMESTAMP NOT NULL,
            KEY idx_sensor_readings_lookup (farm_id, zone_id, reading_type, captured_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS irrigation_drain_feedback (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            zone_id INT NULL,
            feed_amount_l DOUBLE NULL,
            drain_amount_l DOUBLE NULL,
            drain_rate DOUBLE NULL,
            drain_ec DOUBLE NULL,
            drain_ph DOUBLE NULL,
            measured_at TIMESTAMP NULL,
            created_by VARCHAR(128) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_irrigation_drain_feedback_lookup (farm_id, zone_id, measured_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS ai_irrigation_outputs (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            crop_season_id INT NULL,
            zone_id INT NULL,
            agent_name VARCHAR(64) NOT NULL DEFAULT 'CORP/IRR',
            output_json JSON NOT NULL,
            healthy TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_ai_irrigation_outputs_lookup (farm_id, crop_season_id, zone_id, healthy, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS final_irrigation_targets (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            crop_season_id INT NULL,
            zone_id INT NULL,
            targets_json JSON NOT NULL,
            source_ai_output_id BIGINT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_final_irrigation_targets_lookup (farm_id, crop_season_id, zone_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS irrigation_control_logs (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            zone_id INT NULL,
            amount_l DOUBLE NULL,
            reason VARCHAR(64) NULL,
            feed_ec DOUBLE NULL,
            feed_ph DOUBLE NULL,
            drain_amount_l DOUBLE NULL,
            drain_ec DOUBLE NULL,
            drain_ph DOUBLE NULL,
            result VARCHAR(64) NULL,
            has_error TINYINT(1) NOT NULL DEFAULT 0,
            executed_at TIMESTAMP NOT NULL,
            KEY idx_irrigation_control_logs_lookup (farm_id, zone_id, executed_at, has_error)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS crop_interlock_approvals (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            season_id INT NOT NULL,
            approval_type VARCHAR(32) NOT NULL,
            actor VARCHAR(128) NULL,
            note TEXT NULL,
            reason_codes_json JSON NOT NULL,
            actions_json JSON NOT NULL,
            stage_diagnosis_json JSON NULL,
            interlock_json JSON NULL,
            expires_at TIMESTAMP NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_crop_interlock_approval (farm_id, season_id, approval_type),
            KEY idx_crop_interlock_approvals_lookup (farm_id, season_id, approval_type, expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS audit_logs (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            actor VARCHAR(128) NULL,
            action VARCHAR(128) NULL,
            before_json JSON NULL,
            after_json JSON NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_audit_logs_lookup (farm_id, action, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS green_smart_admin_role_mappings (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            ha_user_id VARCHAR(128) NOT NULL,
            ha_user_name VARCHAR(128) NULL,
            role VARCHAR(64) NOT NULL,
            created_by VARCHAR(128) NULL,
            updated_by VARCHAR(128) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_admin_role_mappings (farm_id, ha_user_id),
            KEY idx_admin_role_mappings_role (farm_id, role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS green_smart_admin_system_config (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            config_key VARCHAR(128) NOT NULL,
            config_json JSON NOT NULL,
            updated_by VARCHAR(128) NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_admin_system_config (farm_id, config_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS green_smart_admin_diagnostics (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            diagnostic_json JSON NOT NULL,
            status VARCHAR(64) NOT NULL DEFAULT 'completed',
            created_by VARCHAR(128) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_admin_diagnostics_lookup (farm_id, status, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS green_smart_admin_backups (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            backup_json JSON NOT NULL,
            backup_type VARCHAR(64) NOT NULL DEFAULT 'admin_system',
            created_by VARCHAR(128) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_admin_backups_lookup (farm_id, backup_type, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS crop_stage_calibrations (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            crop_type VARCHAR(50) NOT NULL,
            cultivation_method VARCHAR(50) NOT NULL DEFAULT 'hydro',
            stage_id VARCHAR(100) NOT NULL,
            stage_label VARCHAR(100) NOT NULL,
            index_type VARCHAR(32) NOT NULL,
            threshold_json JSON NOT NULL,
            boundary_json JSON NOT NULL,
            source_json JSON NULL,
            enabled TINYINT(1) NOT NULL DEFAULT 1,
            version VARCHAR(64) NOT NULL DEFAULT 'crop_stage_calibration_v1',
            updated_by VARCHAR(128) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_crop_stage_calibration (farm_id, crop_type, cultivation_method, stage_id),
            KEY idx_crop_stage_calibrations_lookup (farm_id, crop_type, cultivation_method, enabled)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS edge_crop_policy_cache (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            farm_id BIGINT NOT NULL DEFAULT 1,
            season_id INT NOT NULL,
            zone_id INT NULL,
            policy_version VARCHAR(128) NOT NULL,
            policy_json JSON NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'fresh',
            received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            validated_at TIMESTAMP NULL,
            active_from TIMESTAMP NULL,
            valid_until TIMESTAMP NULL,
            stale_after_seconds INT NOT NULL DEFAULT 600,
            fallback_after_seconds INT NOT NULL DEFAULT 1800,
            last_error TEXT NULL,
            UNIQUE KEY uniq_edge_crop_policy_cache (farm_id, season_id, zone_id, policy_version),
            KEY idx_edge_crop_policy_cache_lookup (farm_id, season_id, zone_id, status, received_at)
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
            await _ensure_column(cur, "control_pesticides", "mixable", "mixable TINYINT(1) NULL AFTER pls_compliant")
            await _ensure_column(cur, "control_pesticides", "mix_check_status", "mix_check_status VARCHAR(32) NULL AFTER mixable")
            await _ensure_column(cur, "control_pesticides", "mix_check_note", "mix_check_note TEXT NULL AFTER mix_check_status")
            await _ensure_column(cur, "control_pesticides", "pls_warning", "pls_warning TEXT NULL AFTER mix_check_note")
    _LOGGER.info("green_smart DB schema ensured")


async def close_pool() -> None:
    """풀 종료 — HA 언로드 시 호출."""
    global _pool
    if _pool and not _pool.closed:
        _pool.close()
        await _pool.wait_closed()
        _pool = None
