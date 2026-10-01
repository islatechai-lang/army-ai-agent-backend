import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env if present
load_dotenv(BASE_DIR / ".env")

# LLM & Unorouter Configuration
UNOROUTER_API_KEY = os.getenv("UNOROUTER_API_KEY", "sk-UE7RO864vd28guRe8sGAp3W6HfsiZgG3ktSNwlZHrNH9k21C")
UNOROUTER_ENDPOINT = os.getenv("UNOROUTER_ENDPOINT", "https://api.unorouter.com/v1/chat/completions")

# Fallback cascade prioritizing user's requested models
FREE_MODELS_CASCADE = [
    {"id": "space-bunny-alpha:free", "provider": "unorouter", "cooldown_seconds": 0},
    {"id": "qwen3.8-flash-next:free", "provider": "unorouter", "cooldown_seconds": 30},
    {"id": "k2-horizon:free", "provider": "unorouter", "cooldown_seconds": 30},
    {"id": "deepseek-r1-distill-qwen-32b:free", "provider": "unorouter", "cooldown_seconds": 30},
    {"id": "qwen3.6-plus:free", "provider": "unorouter", "cooldown_seconds": 0},
    {"id": "gemini-3.6-flash:free", "provider": "unorouter", "cooldown_seconds": 0},
]

# Whop MCP Endpoints
WHOP_DOCS_MCP_URL = os.getenv("WHOP_DOCS_MCP_URL", "https://docs.whop.com/mcp")
WHOP_API_MCP_URL = os.getenv("WHOP_API_MCP_URL", "https://mcp.whop.com/mcp")

# Database & Supabase (optional, falls back to local SQLite)
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
DATABASE_PATH = BASE_DIR / "backend" / "db" / "whop_agents.db"
