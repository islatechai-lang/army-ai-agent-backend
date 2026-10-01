import sqlite3
import json
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.config import DATABASE_PATH, SUPABASE_URL, SUPABASE_KEY

class Storage:
    """
    Persistence layer supporting SQLite out-of-the-box and Supabase sync.
    """
    def __init__(self, db_path=DATABASE_PATH):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_sqlite()

    def _get_conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self):
        with self._get_conn() as conn:
            with open(self.db_path.parent / "schema.sql", "r") as f:
                conn.executescript(f.read())
            
            # Migrate businesses columns if missing
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(businesses)")
            cols = [row[1] for row in cursor.fetchall()]
            if "whop_product_id" not in cols:
                try:
                    cursor.execute("ALTER TABLE businesses ADD COLUMN whop_product_id TEXT")
                except:
                    pass
            if "checkout_url" not in cols:
                try:
                    cursor.execute("ALTER TABLE businesses ADD COLUMN checkout_url TEXT")
                except:
                    pass
            if "promo_code" not in cols:
                try:
                    cursor.execute("ALTER TABLE businesses ADD COLUMN promo_code TEXT")
                except:
                    pass

            # Seed initial 4 agents if not present
            cursor.execute("SELECT COUNT(*) FROM agents")
            if cursor.fetchone()[0] == 0:
                initial_agents = [
                    ("ceo", "Atlas", "Chief Executive / Strategist", "idle", "Researching viral Whop digital product niches", 100, 80, "gemini-flash-lite:free"),
                    ("dev", "Cypher", "Fullstack App & Elements Dev", "idle", "Ready to scaffold Whop apps with CLI", 280, 80, "mistral-small:free"),
                    ("marketer", "Echo", "Growth & Ad Architect", "idle", "Drafting launch discounts and pricing tiers", 100, 220, "gemini-flash-lite:free"),
                    ("ops", "Nova", "Operations & Churn Controller", "idle", "Monitoring store health and resolution center", 280, 220, "mistral-small:free")
                ]
                cursor.executemany(
                    "INSERT INTO agents (id, name, role, status, current_task, desk_x, desk_y, model_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    initial_agents
                )
                conn.commit()

    # Agents
    def get_agents(self) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM agents")
            return [dict(r) for r in cursor.fetchall()]

    def update_agent_status(self, agent_id: str, status: str, current_task: Optional[str] = None, model_used: Optional[str] = None):
        with self._get_conn() as conn:
            cursor = conn.cursor()
            if current_task and model_used:
                cursor.execute(
                    "UPDATE agents SET status = ?, current_task = ?, model_used = ?, total_actions = total_actions + 1, last_active = CURRENT_TIMESTAMP WHERE id = ?",
                    (status, current_task, model_used, agent_id)
                )
            elif current_task:
                cursor.execute(
                    "UPDATE agents SET status = ?, current_task = ?, total_actions = total_actions + 1, last_active = CURRENT_TIMESTAMP WHERE id = ?",
                    (status, current_task, agent_id)
                )
            else:
                cursor.execute(
                    "UPDATE agents SET status = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?",
                    (status, agent_id)
                )
            conn.commit()

    # Logs
    def add_log(self, agent_id: str, log_type: str, message: str, business_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        meta_str = json.dumps(metadata) if metadata else None
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO agent_logs (agent_id, business_id, log_type, message, metadata) VALUES (?, ?, ?, ?, ?)",
                (agent_id, business_id, log_type, message, meta_str)
            )
            log_id = cursor.lastrowid
            conn.commit()
            return {
                "id": log_id,
                "agent_id": agent_id,
                "business_id": business_id,
                "log_type": log_type,
                "message": message,
                "metadata": metadata,
                "created_at": datetime.utcnow().isoformat()
            }

    def get_recent_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM agent_logs ORDER BY id DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            logs = []
            for r in reversed(rows):
                item = dict(r)
                if item["metadata"]:
                    try:
                        item["metadata"] = json.loads(item["metadata"])
                    except:
                        pass
                logs.append(item)
            return logs

    # Businesses
    def create_business(self, name: str, handle: str, niche: str, category: str = "Digital Products") -> Dict[str, Any]:
        biz_id = str(uuid.uuid4())[:8]
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO businesses (id, whop_biz_id, name, handle, niche, category, status, mrr_cents) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (biz_id, f"biz_{biz_id}", name, handle, niche, category, "active", 0)
            )
            conn.commit()
        return {"id": biz_id, "name": name, "handle": handle, "niche": niche}

    def update_business_commerce(
        self,
        biz_id: str,
        whop_product_id: Optional[str] = None,
        checkout_url: Optional[str] = None,
        promo_code: Optional[str] = None
    ):
        with self._get_conn() as conn:
            cursor = conn.cursor()
            if whop_product_id:
                cursor.execute("UPDATE businesses SET whop_product_id = ? WHERE id = ?", (whop_product_id, biz_id))
            if checkout_url:
                cursor.execute("UPDATE businesses SET checkout_url = ? WHERE id = ?", (checkout_url, biz_id))
            if promo_code:
                cursor.execute("UPDATE businesses SET promo_code = ? WHERE id = ?", (promo_code, biz_id))
            conn.commit()

    def delete_business(self, biz_id: str) -> bool:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM businesses WHERE id = ? OR whop_product_id = ?", (biz_id, biz_id))
            conn.commit()
            return cursor.rowcount > 0

    def upsert_synced_product(self, prod_id: str, name: str, handle: Optional[str] = None) -> Dict[str, Any]:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM businesses WHERE whop_product_id = ? OR name = ?", (prod_id, name))
            row = cursor.fetchone()
            if row:
                cursor.execute("UPDATE businesses SET whop_product_id = ?, name = ? WHERE id = ?", (prod_id, name, row[0]))
                conn.commit()
                return {"id": row[0], "whop_product_id": prod_id, "name": name}
            else:
                biz_id = str(uuid.uuid4())[:8]
                h = handle or prod_id.replace("prod_", "biz-")
                cursor.execute(
                    "INSERT INTO businesses (id, whop_biz_id, whop_product_id, name, handle, niche, category, status, mrr_cents) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (biz_id, "biz_wDSHPXqL0Ew9Jr", prod_id, name, h, "Digital Whop Product", "Digital Products", "active", 0)
                )
                conn.commit()
                return {"id": biz_id, "whop_product_id": prod_id, "name": name, "handle": h}

    def get_businesses(self) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM businesses ORDER BY created_at DESC")
            return [dict(r) for r in cursor.fetchall()]

    # Agent Discussions
    def add_discussion(self, sender_id: str, recipient_id: str, message: str, business_id: Optional[str] = None) -> Dict[str, Any]:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO agent_discussions (sender_id, recipient_id, business_id, message) VALUES (?, ?, ?, ?)",
                (sender_id, recipient_id, business_id, message)
            )
            disc_id = cursor.lastrowid
            conn.commit()
            return {
                "id": disc_id,
                "sender_id": sender_id,
                "recipient_id": recipient_id,
                "business_id": business_id,
                "message": message,
                "created_at": datetime.utcnow().isoformat()
            }

    def get_recent_discussions(self, limit: int = 30) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM agent_discussions ORDER BY id DESC LIMIT ?", (limit,))
            return [dict(r) for r in reversed(cursor.fetchall())]

    # Tasks
    def add_task(self, title: str, assigned_to: str, description: str = "", business_id: Optional[str] = None) -> Dict[str, Any]:
        task_id = str(uuid.uuid4())[:8]
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO tasks (id, business_id, assigned_to, title, description, status) VALUES (?, ?, ?, ?, ?, ?)",
                (task_id, business_id, assigned_to, title, description, "in_progress")
            )
            conn.commit()
        return {"id": task_id, "title": title, "assigned_to": assigned_to, "status": "in_progress"}

    def get_tasks(self) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC")
            return [dict(r) for r in cursor.fetchall()]

    # Approvals
    def add_approval(self, requested_by: str, action_type: str, summary: str, raw_payload: Dict[str, Any], business_id: Optional[str] = None) -> str:
        app_id = str(uuid.uuid4())[:8]
        idempotency_key = f"idem_{uuid.uuid4().hex[:12]}"
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO approvals (id, business_id, requested_by, action_type, summary, raw_payload, idempotency_key, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (app_id, business_id, requested_by, action_type, summary, json.dumps(raw_payload), idempotency_key, "pending")
            )
            conn.commit()
        return app_id

    def get_pending_approvals(self) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM approvals WHERE status = 'pending' ORDER BY created_at DESC")
            rows = cursor.fetchall()
            approvals = []
            for r in rows:
                item = dict(r)
                if item["raw_payload"]:
                    try:
                        item["raw_payload"] = json.loads(item["raw_payload"])
                    except:
                        pass
                approvals.append(item)
            return approvals

    def resolve_approval(self, approval_id: str, approved: bool) -> bool:
        new_status = "approved" if approved else "rejected"
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE approvals SET status = ? WHERE id = ?", (new_status, approval_id))
            conn.commit()
            return cursor.rowcount > 0

storage = Storage()
