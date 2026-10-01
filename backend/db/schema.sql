-- Whop Agent Army Schema
-- Compatible with SQLite and Supabase PostgreSQL

CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY,
    whop_biz_id TEXT,
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    niche TEXT,
    category TEXT,
    status TEXT DEFAULT 'active',
    mrr_cents INTEGER DEFAULT 0,
    total_revenue_cents INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'idle',
    current_task TEXT,
    desk_x INTEGER DEFAULT 0,
    desk_y INTEGER DEFAULT 0,
    model_used TEXT,
    total_actions INTEGER DEFAULT 0,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT,
    business_id TEXT,
    log_type TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    assigned_to TEXT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'in_progress',
    priority TEXT DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approvals (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    requested_by TEXT,
    action_type TEXT NOT NULL,
    summary TEXT NOT NULL,
    raw_payload TEXT,
    mcp_confirmation_token TEXT,
    idempotency_key TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
