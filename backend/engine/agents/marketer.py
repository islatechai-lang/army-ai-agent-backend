from typing import Dict, Any, Optional
from backend.engine.agents.base_agent import BaseAgent
from backend.db.storage import storage

MARKETER_SYSTEM_PROMPT = """You are Echo, Growth & Marketing Architect for Whop businesses.
Your superpowers are:
1. Product Packaging: Naming tiers (e.g. Starter, Pro, Lifetime VIP), setting optimal pricing points ($19, $39, $97).
2. High-converting sales copy: Catchy headlines, pain-point hooks, benefit bullets.
3. Promo campaigns: Creating discount codes (e.g. 'LAUNCH50') and referral incentives.
4. Meta Ads: Drafting targeted Meta ad copies optimized for Whop checkout conversion.
"""

class MarketerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="marketer",
            name="Echo",
            role="Growth & Marketing Architect",
            system_prompt=MARKETER_SYSTEM_PROMPT
        )

    async def craft_growth_campaign(self, business_id: str, business_name: str, niche: str) -> Dict[str, Any]:
        """
        Creates pricing tiers, sales copy, promo codes, and ad drafts.
        """
        prompt = f"""
Create a full launch marketing campaign for '{business_name}' in the niche '{niche}'.
Provide:
1. Two pricing tiers (e.g. Standard Monthly vs All-Access Lifetime)
2. Compelling sales headline and 3 bullet proof benefits
3. Launch promo code (e.g. 'VIP50' for 50% off)
4. A high-converting Meta ad copy with strong Call to Action (CTA)
"""
        res = await self.think_and_act(prompt, business_id=business_id)
        
        self.log("milestone", f"Generated launch campaign and promo codes for {business_name}", business_id)
        
        return {
            "success": True,
            "campaign": res.get("content"),
            "model_used": res.get("model_used")
        }
