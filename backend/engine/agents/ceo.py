from typing import Dict, Any, Optional
from backend.engine.agents.base_agent import BaseAgent
from backend.db.storage import storage

CEO_SYSTEM_PROMPT = """You are Atlas, Chief Executive and Head Strategist of an autonomous Whop business army.
Your mission is to find high-margin, profitable digital product niches on Whop (e.g. Creator Toolkits, Trading Signals, AI Automation Hubs, Notion Workspaces, Mini-SaaS).
When given an objective:
1. Brainstorm an exact business brand name, handle slug, target audience, and core product offering.
2. Formulate a step-by-step launch roadmap for the Developer, Marketer, and Operations agents.
3. Be punchy, strategic, and prioritize value and conversion.
"""

class CEOAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="ceo",
            name="Atlas",
            role="Chief Executive / Strategist",
            system_prompt=CEO_SYSTEM_PROMPT
        )

    async def launch_new_business(self, niche_prompt: str) -> Dict[str, Any]:
        """
        Plans a new business concept and registers it into the database.
        """
        prompt = f"""
Plan a new Whop business based on this niche or theme: "{niche_prompt}".
Provide your output as a clear strategy with:
- Business Name
- Handle Slug (e.g., 'ai-creator-vault')
- Target Audience
- Primary Product Offering & Suggested Price
- Key Apps Needed (e.g. Chat, Custom Next.js App, Downloadable Files, Courses)
"""
        res = await self.think_and_act(prompt)
        
        # Auto-extract or fallback a business entity
        import re
        content = res.get("content", "")
        handle_match = re.search(r"handle(?:\s*slug)?[:\-]?\s*['\"]?([a-z0-9\-]+)['\"]?", content, re.IGNORECASE)
        name_match = re.search(r"business name[:\-]?\s*['\"]?([^'\"\n\r]+)['\"]?", content, re.IGNORECASE)
        
        raw_name = name_match.group(1).strip() if name_match else f"{niche_prompt.title()} Pro"
        raw_handle = handle_match.group(1).strip() if handle_match else f"{niche_prompt.lower().replace(' ', '-')}-{storage.get_businesses().__len__() + 1}"
        
        name = re.sub(r'[\*\#\_`]', '', raw_name).strip() or f"{niche_prompt.title()} Pro"
        handle = re.sub(r'[^a-z0-9\-]', '', raw_handle.lower().replace(' ', '-')) or f"biz-{storage.get_businesses().__len__() + 1}"
        
        biz = storage.create_business(name=name, handle=handle, niche=niche_prompt)
        self.log("milestone", f"Officially registered new Whop business: '{name}' (@{handle})", biz["id"])
        
        # Create real product on Whop via whop_real
        from backend.engine.whop_real import whop_real
        prod_res = whop_real.create_real_product(name, f"Official membership & digital portal for {name}")
        prod_data = prod_res.get("data") if prod_res.get("success") else None
        prod_id = prod_data.get("id") if isinstance(prod_data, dict) else None
        if prod_id:
            self.log("tool_result", f"Successfully created LIVE Whop product: {prod_id} ('{name}')", biz["id"])
            biz["whop_product_id"] = prod_id
            storage.update_business_commerce(biz["id"], whop_product_id=prod_id)
        
        # Add kickoff task for dev and marketing
        storage.add_task(f"Scaffold Whop App for {name}", "dev", "Initialize app or configure Whop apps", biz["id"])
        storage.add_task(f"Create pricing tier & promo codes for {name}", "marketer", "Setup $29-$49 tiers", biz["id"])
        
        # Agent-to-agent collaboration discussions
        storage.add_discussion(
            "ceo",
            "dev",
            f"Cypher, I've conceptualized and launched '{name}' (Whop Product: {prod_id or 'In Queue'}). Build out the members portal and digital deliverables.",
            biz["id"]
        )
        storage.add_discussion(
            "ceo",
            "marketer",
            f"Echo, package '{name}' with recurring ($29/mo) and lifetime ($97) pricing plans on Whop and issue launch promo codes.",
            biz["id"]
        )
        
        return {
            "business": biz,
            "whop_product": prod_res,
            "strategy": content,
            "model_used": res.get("model_used")
        }
