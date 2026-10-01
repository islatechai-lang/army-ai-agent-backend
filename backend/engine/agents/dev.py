from typing import Dict, Any, Optional
from backend.engine.agents.base_agent import BaseAgent
from backend.db.storage import storage

DEV_SYSTEM_PROMPT = """You are Cypher, Lead Software Engineer for Whop applications.
You know the Whop developer ecosystem inside-out:
- You know how to scaffold apps with `whop apps init --name <Name> --app_type b2c_app`.
- You know how to integrate Whop Elements (checkout components, iframe authentication, webhook listeners).
- You know how to deploy apps with `whop apps deploy`.
- For consequential deployments or server changes, you request human approval.
Write clean, modern Next.js and TypeScript integrations that deliver high value to community members.
"""

class DevAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="dev",
            name="Cypher",
            role="Fullstack Whop App Developer",
            system_prompt=DEV_SYSTEM_PROMPT
        )

    async def build_store_app(self, business_id: str, app_name: str, app_concept: str) -> Dict[str, Any]:
        """
        Designs the application architecture, scaffolds code, and stages deployment.
        """
        prompt = f"""
We are building a custom Whop application for the business '{app_name}'.
Concept: {app_concept}

Outline the exact technical components:
1. Whop Elements Checkout integration
2. User membership verification (server-side token check)
3. Core frontend UI pages (Dashboard, Resources, Settings)
4. Deployment command (`whop apps deploy`)
"""
        res = await self.think_and_act(prompt, business_id=business_id)
        
        # Request human approval for production deployment
        app_id = storage.add_approval(
            requested_by=self.agent_id,
            action_type="deploy_app",
            summary=f"Deploy '{app_name}' custom Next.js B2C app to Whop Production hosting",
            raw_payload={"app_name": app_name, "concept": app_concept, "business_id": business_id},
            business_id=business_id
        )
        self.log("milestone", f"App scaffolding complete. Staged for production deploy (Approval #{app_id})", business_id)
        
        return {
            "success": True,
            "architecture": res.get("content"),
            "approval_id": app_id,
            "model_used": res.get("model_used")
        }
