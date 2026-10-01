from typing import Dict, Any, Optional
from backend.engine.agents.base_agent import BaseAgent
from backend.db.storage import storage

OPS_SYSTEM_PROMPT = """You are Nova, Operations & CX Controller for Whop businesses.
Your priorities:
1. Community Retention: Keep churn under 4%, identify churn triggers, recommend engagement strategies.
2. Financial Health: Audit gross volume, fees, pending payouts, and ensure dispute rate stays near 0%.
3. Automated Care: Draft welcoming onboarding flows for new paying members.
"""

class OpsAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="ops",
            name="Nova",
            role="Operations & Customer Experience Controller",
            system_prompt=OPS_SYSTEM_PROMPT
        )

    async def audit_health(self, business_id: str, business_name: str) -> Dict[str, Any]:
        """
        Runs an audit of business health, member retention, and resolution center.
        """
        prompt = f"""
Perform an operational audit and customer retention plan for '{business_name}'.
Detail:
1. Automated member onboarding message for new buyers
2. Churn mitigation protocol if member engagement drops
3. Dispute defense checklist to maintain 0% chargebacks
"""
        res = await self.think_and_act(prompt, business_id=business_id)
        
        # Pull live Whop stats
        from backend.engine.whop_real import whop_real
        import json
        stats_res = whop_real.get_real_stats()
        if stats_res.get("success"):
            data = stats_res.get("data", {})
            self.log("tool_result", f"Pulled LIVE Whop metrics: {json.dumps(data)[:200]}", business_id)
        
        self.log("milestone", f"Completed operational health audit for {business_name}", business_id)
        
        return {
            "success": True,
            "audit": res.get("content"),
            "real_stats": stats_res,
            "model_used": res.get("model_used")
        }
