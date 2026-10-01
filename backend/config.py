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

# Fallback cascade for 100% free models
FREE_MODELS_CASCADE = [
    {"id": "gemini-flash-lite-latest:free", "provider": "unorouter", "cooldown_seconds": 0},
    {"id": "mistral-small:free", "provider": "unorouter", "cooldown_seconds": 0},
    {"id": "qwen2.5-coder-32b:free", "provider": "unorouter", "cooldown_seconds": 60},
    {"id": "glm-5.3-flash:free", "provider": "unorouter", "cooldown_seconds": 30},
]

# Whop MCP Endpoints
WHOP_DOCS_MCP_URL = os.getenv("WHOP_DOCS_MCP_URL", "https://docs.whop.com/mcp")
WHOP_API_MCP_URL = os.getenv("WHOP_API_MCP_URL", "https://mcp.whop.com/mcp")

# Database & Supabase (optional, falls back to local SQLite)
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
DATABASE_PATH = BASE_DIR / "backend" / "db" / "whop_agents.db"
