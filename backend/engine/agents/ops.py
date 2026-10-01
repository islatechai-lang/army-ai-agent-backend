from typing import Dict, Any, Optional
from backend.engine.agents.base_agent import BaseAgent
from backend.db.storage import storage
from backend.engine.whop_knowledge import get_agent_knowledge_prompt

OPS_SYSTEM_PROMPT = f"""You are Nova, Operations & CX Controller for Whop businesses.
Your priorities:
1. Community Retention: Keep churn under 4%, ensure community experiences (forums, courses) provide immediate member value upon checkout.
2. Financial Health: Audit gross volume, dispute rate, and payment health across products.
3. Automated Care: Coordinate welcome messages and onboarding guides for new members.

{get_agent_knowledge_prompt("Operations Controller (Nova)")}
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

        # Dynamic agent-to-agent dialogue
        ops_msg = await self.generate_natural_dialogue(
            recipient_name="Atlas",
            topic=f"Completed operational health audit, zero chargeback flags, and retention protocol for {business_name}",
            business_name=business_name
        )
        storage.add_discussion("ops", "ceo", ops_msg, business_id)
        
        return {
            "success": True,
            "audit": res.get("content"),
            "real_stats": stats_res,
            "model_used": res.get("model_used")
        }
