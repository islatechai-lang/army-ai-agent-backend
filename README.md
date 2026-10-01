# 🏢 Whop Autonomous Agent Army OS

An autonomous multi-agent operating system that researches profitable digital niches, creates businesses on Whop, scaffolds custom apps, configures monetization, executes marketing, and manages operations — all visually tracked in real-time inside an interactive **2.5D Isometric Virtual Office**.

---

## ⚡ Key Highlights

- **100% Free AI Model Mesh:** Powered by Unorouter's free tier with automatic failover across `gemini-flash-lite:free`, `mistral-small:free`, and `qwen2.5-coder-32b:free`. When a model hits rate limits or busy errors, the system automatically benches it and cascades to the next candidate without crashing.
- **Interactive 2.5D Virtual Office Floor:** Visual representation of your company with 4 specialized desks:
  - 👑 **Atlas (CEO / Strategist):** Researches market gaps and formulates business blueprints.
  - 💻 **Cypher (Fullstack Dev):** Scaffolds Whop B2C apps, Next.js code, and handles `whop apps deploy`.
  - 📈 **Echo (Growth & Marketer):** Formulates pricing tiers, promo codes, and drafts Meta ad campaigns.
  - 🛡️ **Nova (Operations & Risk):** Audits customer onboarding, monitors disputes, and keeps churn near 0%.
- **Human-in-the-Loop Safeguards:** Consequential operations (production deployments, payouts) trigger an interactive approval banner with one-click Approve/Reject.
- **Dual Persistence:** Instant local SQLite out-of-the-box, with drop-in Supabase PostgreSQL compatibility.
- **Real-time WebSockets:** Live streaming thought bubbles, MCP tool calls, and task Kanban.

---

## 🚀 Quick Start

### 1. One-Click Launch (Windows)
Double-click:
```bash
start_army.bat
```
This automatically boots:
- **Backend API:** `http://localhost:8000`
- **Virtual Office Dashboard:** `http://localhost:5173`

### 2. Manual Launch

**Start Backend:**
```bash
python -m uvicorn backend.server:app --host 0.0.0.0 --port 8000
```

**Start Frontend:**
```bash
cd frontend
npm run dev -- --host
```

---

## 🏗️ Architecture

```
whop-agents-army/
├── backend/
│   ├── config.py              # Settings, Unorouter API key & Whop MCP URLs
│   ├── engine/
│   │   ├── llm_mesh.py        # Resilient multi-model mesh with cooldown tracking
│   │   ├── mcp_client.py      # Whop Docs MCP & Live API MCP HTTP JSON-RPC client
│   │   ├── orchestrator.py    # Multi-agent coordination pipeline
│   │   └── agents/
│   │       ├── base_agent.py  # Base memory, logging, and tool-call runner
│   │       ├── ceo.py         # Atlas (Strategy & Niche Discovery)
│   │       ├── dev.py         # Cypher (Whop Apps & Deploy)
│   │       ├── marketer.py    # Echo (Pricing & Growth)
│   │       └── ops.py         # Nova (Retention & Health)
│   ├── db/
│   │   ├── schema.sql         # Database schema (SQLite & Supabase)
│   │   └── storage.py         # Storage repository & seed data
│   └── server.py              # FastAPI server with WebSockets (/ws/live)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VirtualOffice.tsx   # 2.5D Isometric Office floor simulation
│   │   │   ├── LiveFeed.tsx        # Live terminal thought stream
│   │   │   ├── KanbanBoard.tsx     # Operations task tracker
│   │   │   ├── ApprovalsModal.tsx  # Human-in-the-loop review
│   │   │   └── AgentDetailModal.tsx# Agent workspace inspector
│   │   ├── App.tsx            # Main Command Center
│   │   └── types.ts           # Shared TypeScript interfaces
└── start_army.bat             # Windows one-click launcher
```

---

## ⚙️ Configuration (.env)

Create a `.env` in the root folder to customize settings:
```env
UNOROUTER_API_KEY=your_unorouter_key_here
WHOP_DOCS_MCP_URL=https://docs.whop.com/mcp
WHOP_API_MCP_URL=https://mcp.whop.com/mcp

# Optional Supabase Connection:
SUPABASE_URL=
SUPABASE_KEY=
```
