import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from backend.db.storage import storage
from backend.engine.orchestrator import orchestrator

app = FastAPI(title="Whop Agent Army OS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active WebSocket connections
active_connections: List[WebSocket] = []

async def broadcast_event(event_type: str, data: Any):
    payload = {"type": event_type, "data": data}
    disconnected = []
    for ws in active_connections:
        try:
            await ws.send_json(payload)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        if ws in active_connections:
            active_connections.remove(ws)

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        # Send initial snapshot
        await websocket.send_json({
            "type": "init",
            "data": {
                "agents": storage.get_agents(),
                "logs": storage.get_recent_logs(30),
                "tasks": storage.get_tasks(),
                "businesses": storage.get_businesses(),
                "approvals": storage.get_pending_approvals()
            }
        })
        while True:
            # Keep-alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in active_connections:
            active_connections.remove(websocket)

# REST Endpoints
@app.get("/api/agents")
def get_agents():
    return storage.get_agents()

@app.get("/api/businesses")
def get_businesses():
    return storage.get_businesses()

@app.get("/api/tasks")
def get_tasks():
    return storage.get_tasks()

@app.get("/api/logs")
def get_logs(limit: int = 50):
    return storage.get_recent_logs(limit)

@app.get("/api/approvals")
def get_approvals():
    return storage.get_pending_approvals()

class ApprovalResolveRequest(BaseModel):
    approved: bool

@app.post("/api/approvals/{approval_id}/resolve")
async def resolve_approval(approval_id: str, req: ApprovalResolveRequest):
    success = storage.resolve_approval(approval_id, req.approved)
    if not success:
        raise HTTPException(status_code=404, detail="Approval not found")
    
    status_label = "Approved & Executed" if req.approved else "Rejected"
    
    # If approved and deploy_app, trigger real Whop deployment
    if req.approved:
        from backend.engine.whop_real import whop_real
        # Attempt to run real deployment
        deploy_res = whop_real.execute_cli(["apps", "deploy"])
        storage.add_log(
            "dev",
            "milestone",
            f"Human approved deploy #{approval_id}. Real Whop deploy executed: {deploy_res.get('output', deploy_res.get('error', 'Initiated'))}"
        )
    else:
        storage.add_log(
            "dev",
            "thought",
            f"Human rejected deployment #{approval_id}."
        )

    await broadcast_event("approval_updated", {"id": approval_id, "approved": req.approved})
    return {"success": True, "approval_id": approval_id, "status": status_label}

class LaunchRequest(BaseModel):
    niche: str

@app.post("/api/launch")
async def launch_business(req: LaunchRequest):
    if orchestrator.active_pipeline:
        raise HTTPException(status_code=400, detail="A launch pipeline is already running")
    
    # Run pipeline as background task so HTTP returns immediately
    async def run_task():
        await orchestrator.run_full_business_pipeline(req.niche)
        await broadcast_event("pipeline_completed", {"niche": req.niche})

    asyncio.create_task(run_task())
    return {"success": True, "message": f"Autonomous pipeline started for niche '{req.niche}'"}

class ConfigUpdateRequest(BaseModel):
    unorouter_api_key: Optional[str] = None
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    whop_api_key: Optional[str] = None

@app.get("/api/config")
def get_config():
    from backend.config import UNOROUTER_API_KEY, SUPABASE_URL, SUPABASE_KEY, WHOP_DOCS_MCP_URL, WHOP_API_MCP_URL, FREE_MODELS_CASCADE
    
    masked_key = f"{UNOROUTER_API_KEY[:7]}...{UNOROUTER_API_KEY[-4:]}" if len(UNOROUTER_API_KEY) > 12 else "Not Set"
    return {
        "unorouter_api_key_masked": masked_key,
        "supabase_url": SUPABASE_URL or "Not Configured (Using Local SQLite)",
        "supabase_key_set": bool(SUPABASE_KEY),
        "whop_docs_mcp": WHOP_DOCS_MCP_URL,
        "whop_api_mcp": WHOP_API_MCP_URL,
        "free_models": [m["id"] for m in FREE_MODELS_CASCADE]
    }

@app.post("/api/config")
def update_config(req: ConfigUpdateRequest):
    import os
    from backend.config import BASE_DIR
    env_file = BASE_DIR / ".env"
    
    current_lines = {}
    if env_file.exists():
        with open(env_file, "r") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    k, v = line.strip().split("=", 1)
                    current_lines[k] = v

    if req.unorouter_api_key:
        current_lines["UNOROUTER_API_KEY"] = req.unorouter_api_key
        from backend.engine.llm_mesh import llm_mesh
        llm_mesh.api_key = req.unorouter_api_key
    if req.supabase_url:
        current_lines["SUPABASE_URL"] = req.supabase_url
    if req.supabase_key:
        current_lines["SUPABASE_KEY"] = req.supabase_key
    if req.whop_api_key:
        current_lines["WHOP_API_KEY"] = req.whop_api_key

    with open(env_file, "w") as f:
        for k, v in current_lines.items():
            f.write(f"{k}={v}\n")

    return {"success": True, "message": "Configuration successfully updated and saved to .env"}

class AgentActionRequest(BaseModel):
    prompt: str

@app.post("/api/agents/{agent_id}/action")
async def trigger_agent_action(agent_id: str, req: AgentActionRequest):
    if agent_id == "ceo":
        agent = orchestrator.ceo
    elif agent_id == "dev":
        agent = orchestrator.dev
    elif agent_id == "marketer":
        agent = orchestrator.marketer
    elif agent_id == "ops":
        agent = orchestrator.ops
    else:
        raise HTTPException(status_code=404, detail="Agent not found")

    async def run_step():
        res = await agent.think_and_act(req.prompt)
        await broadcast_event("agent_updated", {"agent_id": agent_id, "result": res})

    asyncio.create_task(run_step())
    return {"success": True, "message": f"Dispatched directive to {agent.name}"}

# Serve compiled frontend build for single-service Render deployment
from fastapi.staticfiles import StaticFiles
from pathlib import Path

dist_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if dist_dir.exists():
    app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.server:app", host="0.0.0.0", port=8000, reload=True)
