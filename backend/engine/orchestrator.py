import asyncio
import logging
from typing import Dict, Any, List
from backend.engine.agents.ceo import CEOAgent
from backend.engine.agents.dev import DevAgent
from backend.engine.agents.marketer import MarketerAgent
from backend.engine.agents.ops import OpsAgent
from backend.db.storage import storage

logger = logging.getLogger("Orchestrator")

class AgentArmyOrchestrator:
    def __init__(self):
        self.ceo = CEOAgent()
        self.dev = DevAgent()
        self.marketer = MarketerAgent()
        self.ops = OpsAgent()
        self.active_pipeline = False

    async def run_full_business_pipeline(self, niche: str) -> Dict[str, Any]:
        """
        Executes an end-to-end autonomous business creation pipeline across all 4 agents.
        """
        if self.active_pipeline:
            return {"success": False, "message": "A pipeline is already in progress"}
        
        self.active_pipeline = True
        try:
            # 1. CEO Agent creates business plan
            ceo_result = await self.ceo.launch_new_business(niche)
            biz = ceo_result["business"]
            biz_id = biz["id"]
            biz_name = biz["name"]

            # 2. Dev Agent scaffolds the store app
            dev_result = await self.dev.build_store_app(
                business_id=biz_id,
                app_name=biz_name,
                app_concept=f"Digital product portal and members area for {niche}"
            )

            # 3. Marketer Agent crafts growth campaign & pricing
            mkt_result = await self.marketer.craft_growth_campaign(
                business_id=biz_id,
                business_name=biz_name,
                niche=niche
            )

            # 4. Ops Agent sets up onboarding & retention
            ops_result = await self.ops.audit_health(
                business_id=biz_id,
                business_name=biz_name
            )

            storage.add_log(
                "ceo",
                "milestone",
                f"Full launch pipeline completed for '{biz_name}'! Staged in dashboard.",
                biz_id
            )

            return {
                "success": True,
                "business": biz,
                "ceo": ceo_result,
                "dev": dev_result,
                "marketer": mkt_result,
                "ops": ops_result
            }
        except Exception as e:
            logger.error(f"Pipeline error: {e}", exc_info=True)
            storage.add_log("ceo", "error", f"Pipeline failed: {str(e)}")
            return {"success": False, "error": str(e)}
        finally:
            self.active_pipeline = False

orchestrator = AgentArmyOrchestrator()
