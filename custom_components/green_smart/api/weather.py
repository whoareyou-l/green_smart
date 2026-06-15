"""Weather API client for external integration."""
import aiohttp
from typing import Any

class WeatherClient:
    def __init__(self, base_url: str, api_key: str) -> None:
        self.base_url = base_url
        self.api_key = api_key

    async def get_short_term_forecast(self, nx: int, ny: int) -> dict[str, Any]:
        """Fetch short-term forecast."""
        async with aiohttp.ClientSession() as session:
            params = {"serviceKey": self.api_key, "nx": nx, "ny": ny, "dataType": "JSON"}
            async with session.get(f"{self.base_url}/getVilageFcst", params=params) as resp:
                if resp.status != 200:
                    raise RuntimeError(f"KMA API HTTP {resp.status}")
                return await resp.json()

    async def get_mid_term_forecast(self, reg_id: str) -> dict[str, Any]:
        """Fetch mid-term forecast."""
        async with aiohttp.ClientSession() as session:
            params = {"serviceKey": self.api_key, "regId": reg_id, "dataType": "JSON"}
            async with session.get(f"{self.base_url}/getMidTermFcst", params=params) as resp:
                if resp.status != 200:
                    raise RuntimeError(f"KMA API HTTP {resp.status}")
                return await resp.json()
