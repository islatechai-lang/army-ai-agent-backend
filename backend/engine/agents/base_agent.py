import json
import logging
from typing import Dict, Any, List, Optional
from backend.engine.llm_mesh import llm_mesh
from backend.engine.mcp_client import whop_mcp
from backend.db.storage import storage

logger = logging.getLogger("BaseAgent")

class BaseAgent:
    def __init__(self, agent_id: str, name: str, role: str, system_prompt: str):
        self.agent_id = agent_id
        self.name = name
        self.role = role
        self.system_prompt = system_prompt
        self.memory: List[Dict[str, str]] = [
            {"role": "system", "content": system_prompt}
        ]

    def log(self, log_type: str, message: str, business_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None):
        """Emits a log entry to database and console."""
        logger.info(f"[{self.name.upper()}] [{log_type.upper()}]: {message}")
        return storage.add_log(self.agent_id, log_type, message, business_id, metadata)

    def set_status(self, status: str, task: Optional[str] = None, model: Optional[str] = None):
        storage.update_agent_status(self.agent_id, status, task, model)

    async def think_and_act(
        self,
        prompt: str,
        tools: Optional[List[Dict[str, Any]]] = None,
        business_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes a step: logs thought, sends prompt to LLM mesh, handles tool calls, updates memory.
        """
        self.log("thought", f"Analyzing task: {prompt}", business_id)
        self.set_status("thinking", prompt)

        self.memory.append({"role": "user", "content": prompt})
        
        # Get completion from resilient LLM mesh
        result = await llm_mesh.complete(
            messages=self.memory,
            tools=tools,
            temperature=0.7
        )

        if not result.get("success"):
            error_msg = result.get("error", "Unknown LLM error")
            self.log("error", f"LLM mesh failure: {error_msg}", business_id)
            self.set_status("error")
            return {"success": False, "error": error_msg}

        model_used = result.get("model_used")
        content = result.get("content", "")
        tool_calls = result.get("tool_calls")

        self.set_status("working", f"Executing with {model_used}", model=model_used)

        if content:
            self.memory.append({"role": "assistant", "content": content})
            self.log("thought", content, business_id, {"model": model_used})

        # Process any tool calls requested by the model
        executed_tools = []
        if tool_calls:
            for tc in tool_calls:
                fn_name = tc.get("function", {}).get("name")
                args_str = tc.get("function", {}).get("arguments", "{}")
                try:
                    args = json.loads(args_str) if isinstance(args_str, str) else args_str
                except:
                    args = {}
                
                # Execute real Whop tool
                self.log("tool_call", f"Calling real Whop tool: {fn_name}({json.dumps(args)})", business_id, {"tool": fn_name, "args": args})
                
                from backend.engine.whop_real import whop_real
                if "product" in fn_name and "create" in fn_name:
                    p_name = args.get("name") or "New Digital Product"
                    p_desc = args.get("description") or ""
                    tool_output = whop_real.create_real_product(p_name, p_desc)
                elif "promo" in fn_name:
                    code = args.get("code") or "VIP50"
                    discount = int(args.get("discount_percent") or 50)
                    tool_output = whop_real.create_real_promo_code(code, discount)
                elif "stat" in fn_name:
                    tool_output = whop_real.get_real_stats()
                else:
                    server_type = "docs" if "doc" in fn_name else "api"
                    tool_output = await whop_mcp.call_tool(server_type, fn_name, args)
                
                self.log("tool_result", f"Real Whop Output: {json.dumps(tool_output)[:200]}", business_id)
                executed_tools.append({"tool": fn_name, "result": tool_output})

        self.set_status("idle", "Awaiting next directive")
        return {
            "success": True,
            "content": content,
            "executed_tools": executed_tools,
            "model_used": model_used
        }

    async def generate_natural_dialogue(
        self,
        recipient_name: str,
        topic: str,
        business_name: Optional[str] = None,
        context_facts: Optional[str] = None
    ) -> str:
        """
        Generates casual, sharp, collaborative, non-repetitive agent dialogue using the LLM mesh.
        """
        recent = storage.get_recent_discussions(3)
        history_lines = [f"{d['sender_id'].title()}: {d['message']}" for d in recent]
        history_str = "\n".join(history_lines) if history_lines else "No previous discussions yet."

        prompt = f"""You are {self.name} ({self.role}) in an agile Whop business startup team.
Business context: '{business_name or 'Whop Army Portfolio'}'.
Recent team chat:
{history_str}

Key action or context you want to convey: {topic}.
Additional facts: {context_facts or 'None'}.

Instructions:
- Write a short (1-2 sentences), natural, casual, and cooperative message directed to @{recipient_name}.
- Speak like a sharp co-founder/operator on Slack. Avoid rigid corporate jargon, fake enthusiasm, or repetitive template greetings.
- Do NOT output quotation marks or prefixes like '{self.name}:'. Just the conversational message text itself."""

        res = await llm_mesh.complete(
            messages=[
                {"role": "system", "content": f"You are {self.name}, speaking casually in a high-speed AI startup team chat."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.85
        )

        text = res.get("content", "").strip() if res.get("success") else ""
        import re
        text = re.sub(r'^[A-Za-z]+:\s*', '', text)
        text = text.strip('"\'')
        if not text:
            text = f"@{recipient_name} sync: {topic}."
        return text
