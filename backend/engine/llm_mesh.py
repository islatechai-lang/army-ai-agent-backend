import httpx
import time
import json
import logging
from typing import List, Dict, Any, Optional
from backend.config import UNOROUTER_API_KEY, UNOROUTER_ENDPOINT, FREE_MODELS_CASCADE

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("LLMMesh")

class LLMMesh:
    """
    Resilient Multi-Model Router that rotates across free models on Unorouter
    with automatic failover on 503s, 429s, or connection timeouts.
    """
    def __init__(self, api_key: str = UNOROUTER_API_KEY, endpoint: str = UNOROUTER_ENDPOINT):
        self.api_key = api_key
        self.endpoint = endpoint
        self.models = FREE_MODELS_CASCADE
        self.cooldowns: Dict[str, float] = {}  # model_id -> timestamp when cooldown ends

    def _is_on_cooldown(self, model_id: str) -> bool:
        until = self.cooldowns.get(model_id, 0)
        return time.time() < until

    def _set_cooldown(self, model_id: str, seconds: float):
        self.cooldowns[model_id] = time.time() + seconds
        logger.warning(f"Model {model_id} benched for {seconds:.1f}s cooldown.")

    async def complete(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[str] = "auto",
        temperature: float = 0.7,
        max_tokens: int = 1500,
        preferred_model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes a completion with automatic cascade fallback.
        """
        # Build candidate list with preferred_model first if specified
        candidates = []
        if preferred_model:
            candidates.append({"id": preferred_model, "cooldown_seconds": 30})
        for m in self.models:
            if m["id"] not in [c["id"] for c in candidates]:
                candidates.append(m)

        errors = []
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "User-Agent": "WhopAgentArmy/1.0"
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            for candidate in candidates:
                model_id = candidate["id"]
                if self._is_on_cooldown(model_id):
                    remaining = self.cooldowns[model_id] - time.time()
                    logger.info(f"Skipping {model_id} (in cooldown for {remaining:.1f}s)")
                    continue

                payload: Dict[str, Any] = {
                    "model": model_id,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
                if tools:
                    payload["tools"] = tools
                    if tool_choice:
                        payload["tool_choice"] = tool_choice

                logger.info(f"Dispatching prompt to model: {model_id}")
                try:
                    resp = await client.post(self.endpoint, headers=headers, json=payload)
                    
                    if resp.status_code == 200:
                        data = resp.json()
                        logger.info(f"Success with model {model_id}")
                        return {
                            "success": True,
                            "model_used": model_id,
                            "data": data,
                            "content": data["choices"][0]["message"].get("content", ""),
                            "tool_calls": data["choices"][0]["message"].get("tool_calls", None)
                        }
                    
                    # Handle Rate Limits (429) & Busy Providers (503)
                    error_body = resp.text
                    logger.warning(f"Model {model_id} returned HTTP {resp.status_code}: {error_body[:200]}")
                    
                    # Parse retry duration if provided in error body
                    cooldown = candidate.get("cooldown_seconds", 30)
                    if "retry in" in error_body.lower():
                        import re
                        match = re.search(r"retry in (\d+)s", error_body, re.IGNORECASE)
                        if match:
                            cooldown = int(match.group(1)) + 2
                    
                    self._set_cooldown(model_id, max(cooldown, 20))
                    errors.append(f"{model_id} (HTTP {resp.status_code}): {error_body[:100]}")
                    
                except httpx.TimeoutException:
                    logger.warning(f"Model {model_id} timed out after 45s.")
                    self._set_cooldown(model_id, 45)
                    errors.append(f"{model_id}: Timeout")
                except Exception as e:
                    logger.warning(f"Model {model_id} error: {e}")
                    self._set_cooldown(model_id, 20)
                    errors.append(f"{model_id}: {str(e)}")

        # If all candidates exhausted, raise error
        return {
            "success": False,
            "error": f"All models in mesh failed or on cooldown: {'; '.join(errors)}"
        }

# Global Singleton
llm_mesh = LLMMesh()
