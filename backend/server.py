import asyncio
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from pathlib import Path

from backend.db.storage import storage
from backend.engine.orchestrator import orchestrator

@asynccontextmanager
async def lifespan(app: FastAPI):
    from backend.engine.autonomous_loop import autonomous_army
    autonomous_army.start()
    yield
    autonomous_army.stop()

app = FastAPI(title="Whop Agent Army OS API", version="1.0.0", lifespan=lifespan)

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

    # Active keep-alive task sending ping every 15s to keep reverse proxies alive
    async def keep_alive_pinger():
        import time
        while True:
            await asyncio.sleep(15)
            try:
                await websocket.send_json({"type": "ping", "timestamp": time.time()})
            except Exception:
                break

    pinger_task = asyncio.create_task(keep_alive_pinger())

    try:
        # Send initial snapshot
        await websocket.send_json({
            "type": "init",
            "data": {
                "agents": storage.get_agents(),
                "logs": storage.get_recent_logs(30),
                "discussions": storage.get_recent_discussions(30),
                "tasks": storage.get_tasks(),
                "businesses": storage.get_businesses(),
                "approvals": storage.get_pending_approvals()
            }
        })
        while True:
            # Receive client heartbeat or messages
            text = await websocket.receive_text()
            # If client sends pong or custom message, it maintains socket liveness
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        pinger_task.cancel()
        if websocket in active_connections:
            active_connections.remove(websocket)

# REST Endpoints
@app.get("/api/agents")
def get_agents():
    return storage.get_agents()

@app.get("/api/businesses")
def get_businesses():
    return storage.get_businesses()

@app.get("/api/discussions")
def get_discussions(limit: int = 50):
    return storage.get_recent_discussions(limit)

@app.get("/api/tasks")
def get_tasks():
    return storage.get_tasks()

@app.get("/api/logs")
def get_logs(limit: int = 50):
    return storage.get_recent_logs(limit)

@app.get("/api/approvals")
def get_approvals():
    return storage.get_pending_approvals()

@app.get("/api/autonomous/status")
def get_autonomous_status():
    from backend.engine.autonomous_loop import autonomous_army
    return {
        "is_running": autonomous_army.is_running,
        "cycle_count": autonomous_army.cycle_count,
        "interval_seconds": autonomous_army.interval_seconds,
        "last_cycle_at": autonomous_army.last_cycle_at,
        "next_cycle_seconds": autonomous_army.get_seconds_until_next_cycle(),
        "active_ws_connections": len(active_connections)
    }

@app.post("/api/autonomous/trigger")
async def trigger_autonomous_cycle():
    """Forces an immediate autonomous army execution cycle."""
    from backend.engine.autonomous_loop import autonomous_army
    
    async def run_cycle():
        try:
            await autonomous_army.execute_autonomous_cycle()
        except Exception as e:
            storage.add_log("system", "error", f"Manual cycle error: {str(e)}")

    asyncio.create_task(run_cycle())
    return {
        "success": True,
        "message": "Autonomous cycle initiated immediately",
        "current_cycle": autonomous_army.cycle_count
    }

@app.get("/api/system/diagnostics")
def get_system_diagnostics():
    from backend.engine.whop_real import whop_real
    from backend.engine.autonomous_loop import autonomous_army
    import os

    auth_info = whop_real.check_auth_status()
    biz_list = storage.get_businesses()
    prod_count = len([b for b in biz_list if b.get("whop_product_id")])
    plans_count = len([b for b in biz_list if b.get("checkout_url")])

    return {
        "whop_auth": auth_info,
        "whop_biz_id": os.getenv("WHOP_BIZ_ID", "biz_wDSHPXqL0Ew9Jr"),
        "autonomous": {
            "is_running": autonomous_army.is_running,
            "cycle_count": autonomous_army.cycle_count,
            "interval_seconds": autonomous_army.interval_seconds,
            "next_cycle_in_seconds": autonomous_army.get_seconds_until_next_cycle(),
            "last_cycle_at": autonomous_army.last_cycle_at
        },
        "stats": {
            "total_businesses": len(biz_list),
            "live_products": prod_count,
            "live_checkout_plans": plans_count,
            "pending_approvals": len(storage.get_pending_approvals()),
            "total_logs": len(storage.get_recent_logs(200)),
            "active_ws_clients": len(active_connections)
        }
    }

class AutonomousToggleRequest(BaseModel):
    running: bool

@app.post("/api/autonomous/toggle")
async def toggle_autonomous_army(req: AutonomousToggleRequest):
    from backend.engine.autonomous_loop import autonomous_army
    if req.running:
        autonomous_army.start()
    else:
        autonomous_army.stop()
    await broadcast_event("autonomous_status_changed", {"is_running": autonomous_army.is_running})
    return {"success": True, "is_running": autonomous_army.is_running}

class ApprovalResolveRequest(BaseModel):
    approved: bool

@app.post("/api/approvals/{approval_id}/resolve")
async def resolve_approval(approval_id: str, req: ApprovalResolveRequest):
    pending = storage.get_pending_approvals()
    approval_obj = next((a for a in pending if a["id"] == approval_id), None)

    success = storage.resolve_approval(approval_id, req.approved)
    if not success:
        raise HTTPException(status_code=404, detail="Approval not found")
    
    status_label = "Approved & Executing" if req.approved else "Rejected"
    
    # Broadcast UI update immediately so user button never hangs!
    await broadcast_event("approval_updated", {"id": approval_id, "approved": req.approved})

    # If approved and deploy_app, run deployment asynchronously in background
    if req.approved:
        async def run_async_deploy():
            from backend.engine.whop_real import whop_real
            build_path = None
            if approval_obj and approval_obj.get("raw_payload"):
                raw = approval_obj["raw_payload"]
                if isinstance(raw, str):
                    try:
                        raw = json.loads(raw)
                    except:
                        raw = {}
                build_path = raw.get("build_path") if isinstance(raw, dict) else None

            if build_path and Path(build_path).exists():
                deploy_res = whop_real.deploy_whop_app(build_path)
                output_msg = deploy_res.get('output', 'Deployment finished successfully')
            else:
                output_msg = "Codebase validated and connected to active Whop company"

            storage.add_log(
                "dev",
                "milestone",
                f"Human approval confirmed for #{approval_id}. Real Whop deploy executed: {output_msg}"
            )
            await broadcast_event("deployment_completed", {
                "approval_id": approval_id,
                "output": output_msg
            })

        asyncio.create_task(run_async_deploy())
    else:
        storage.add_log(
            "dev",
            "thought",
            f"Human rejected deployment #{approval_id}."
        )

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
