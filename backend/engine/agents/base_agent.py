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
                
                self.log("tool_call", f"Calling {fn_name}({json.dumps(args)})", business_id, {"tool": fn_name, "args": args})
                
                # Execute tool via Whop MCP
                server_type = "docs" if "doc" in fn_name else "api"
                tool_output = await whop_mcp.call_tool(server_type, fn_name, args)
                
                self.log("tool_result", f"Result from {fn_name}: {json.dumps(tool_output)[:180]}", business_id)
                executed_tools.append({"tool": fn_name, "result": tool_output})

        self.set_status("idle", "Awaiting next directive")
        return {
            "success": True,
            "content": content,
            "executed_tools": executed_tools,
            "model_used": model_used
        }
