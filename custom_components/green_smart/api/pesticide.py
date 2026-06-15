"""Pesticide Safety Information System API client."""
import aiohttp
from typing import Any

class PesticideClient:
    def __init__(self, api_key: str, base_url: str = "http://api.psis.go.kr") -> None:
        self.api_key = api_key
        self.base_url = base_url

    async def search_pesticide(self, query: str) -> dict[str, Any]:
        """Search for pesticide information."""
        async with aiohttp.ClientSession() as session:
            params = {"serviceKey": self.api_key, "query": query, "format": "json"}
            async with session.get(f"{self.base_url}/search", params=params) as resp:
                if resp.status != 200:
                    raise RuntimeError(f"PSIS API HTTP {resp.status}")
                return await resp.json()
