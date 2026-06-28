"""Read-only API shell for the Green Smart rebuild surface."""
from __future__ import annotations

from aiohttp import web
from homeassistant.components.http import HomeAssistantView

REBUILD_HOME_CONTEXT_SOURCE = "static-fixture-before-api"


def rebuild_home_context_response() -> dict:
    """Return the RS-007 read-only fixture response.

    This route shell intentionally does not read DB tables and does not execute
    HA services. RS-008 can replace the fixture source behind this shape.
    """
    return {
        "contextSource": REBUILD_HOME_CONTEXT_SOURCE,
        "readOnly": True,
        "executionEnabled": False,
        "generatedAt": "2026-06-28T00:00:00+09:00",
        "greenhouseId": "greenhouse-main",
        "greenhouseName": "대표 온실",
        "summary": {
            "id": "all",
            "name": "전체",
            "currentCrop": {
                "cropSeasonId": None,
                "cropType": "mixed",
                "cropLabelKo": "전체 작물",
                "growthStage": "전체 구역 요약",
            },
            "equipmentProfile": {"labels": ["구역별 장비 요약"]},
            "dataAvailability": {
                "state": "partial",
                "freshnessMinutes": 6,
                "note": "일부 구역 데이터가 아직 보강 중입니다.",
            },
        },
        "zones": [
            {
                "id": "zone-a",
                "name": "A구역",
                "currentCrop": {
                    "cropSeasonId": "season-tomato-a",
                    "cropType": "tomato",
                    "cropLabelKo": "토마토",
                    "growthStage": "착과·비대 관찰",
                },
                "equipmentProfile": {"labels": ["천창", "측창", "양액기"]},
                "dataAvailability": {
                    "state": "ok",
                    "freshnessMinutes": 2,
                    "note": "최근 데이터 기준으로 확인했습니다.",
                },
            },
            {
                "id": "zone-b",
                "name": "B구역",
                "currentCrop": {
                    "cropSeasonId": "season-strawberry-b",
                    "cropType": "strawberry",
                    "cropLabelKo": "딸기",
                    "growthStage": "개화·수분 관리",
                },
                "equipmentProfile": {"labels": ["보온커튼", "관수밸브", "순환팬"]},
                "dataAvailability": {
                    "state": "stale",
                    "freshnessMinutes": 38,
                    "note": "최근 수집 시각이 오래되어 현장 확인이 필요합니다.",
                },
            },
            {
                "id": "zone-c",
                "name": "C구역",
                "currentCrop": {
                    "cropSeasonId": None,
                    "cropType": None,
                    "cropLabelKo": "미등록",
                    "growthStage": "작기 정보 없음",
                },
                "equipmentProfile": {"labels": ["장비 매핑 없음"]},
                "dataAvailability": {
                    "state": "empty",
                    "freshnessMinutes": None,
                    "note": "현재 연결된 작기와 장비 정보가 없습니다.",
                },
            },
        ],
    }


class RebuildHomeContextView(HomeAssistantView):
    """GET /api/green_smart/rebuild/home/context."""

    url = "/api/green_smart/rebuild/home/context"
    name = "api:green_smart:rebuild:home:context"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        return self.json(rebuild_home_context_response())
