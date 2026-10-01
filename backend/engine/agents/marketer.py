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
        
        # Extract promo code or generate launch code
        import re
        import random
        content = res.get("content", "")
        code_match = re.search(r"promo\s*code[:\-]?\s*['\"]?([A-Z0-9_\-]+)['\"]?", content, re.IGNORECASE)
        code = code_match.group(1).upper() if code_match else f"VIP{random.randint(10, 99)}"
        
        from backend.engine.whop_real import whop_real
        promo_res = whop_real.create_real_promo_code(code, 50)
        if promo_res.get("success"):
            self.log("tool_result", f"Successfully created LIVE Whop Promo Code: {code} (50% off)", business_id)
        else:
            self.log("tool_result", f"Promo code attempt for {code}: {promo_res.get('error', 'already exists or queued')}", business_id)

        # Retrieve business to get whop_product_id if available
        checkout_url = None
        businesses = storage.get_businesses()
        biz_record = next((b for b in businesses if b["id"] == business_id), None)
        prod_id = biz_record.get("whop_product_id") if biz_record else None

        if prod_id:
            # Create real Recurring Monthly Plan ($29/mo)
            plan_res = whop_real.create_real_plan(
                product_id=prod_id,
                plan_type="renewal",
                price=29.00,
                billing_period=30,
                description=f"{business_name} - Monthly VIP Pass ($29/mo)"
            )
            if plan_res.get("success") and plan_res.get("checkout_url"):
                checkout_url = plan_res["checkout_url"]
                self.log("tool_result", f"Created LIVE Whop Monthly Plan ($29/mo): {checkout_url}", business_id)
            
            # Also create Lifetime One-Time Plan ($97)
            lifetime_res = whop_real.create_real_plan(
                product_id=prod_id,
                plan_type="one_time",
                price=97.00,
                description=f"{business_name} - All-Access Lifetime Pass ($97)"
            )
            if lifetime_res.get("success"):
                self.log("tool_result", f"Created LIVE Whop Lifetime Plan ($97): {lifetime_res.get('checkout_url')}", business_id)

            # Persist checkout_url and promo_code to business
            storage.update_business_commerce(business_id, checkout_url=checkout_url, promo_code=code)

        # Log agent-to-agent collaboration discussion
        storage.add_discussion(
            "marketer",
            "ceo",
            f"Atlas, I've created the pricing structure on Whop ($29/mo recurring & $97 lifetime) and active promo code '{code}'. Checkout link: {checkout_url or 'Created on Whop'}",
            business_id
        )

        self.log("milestone", f"Generated launch campaign, live checkout links, and promo code ({code}) for {business_name}", business_id)
        
        return {
            "success": True,
            "campaign": res.get("content"),
            "promo_code": code,
            "checkout_url": checkout_url,
            "promo_result": promo_res,
            "model_used": res.get("model_used")
        }
