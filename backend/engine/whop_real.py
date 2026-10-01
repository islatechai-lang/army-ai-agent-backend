import subprocess
import json
import logging
import os
import httpx
from typing import Dict, Any, List, Optional
from backend.config import BASE_DIR

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("WhopRealEngine")

class WhopRealEngine:
    """
    Real operational engine executing live Whop CLI commands and Whop REST API calls.
    No simulations or mockups.
    """
    def __init__(self):
        self.api_base = "https://api.whop.com/v5"

    def get_api_key(self) -> Optional[str]:
        return os.getenv("WHOP_API_KEY") or None

    def check_auth_status(self) -> Dict[str, Any]:
        """Checks if the system has an active Whop CLI login."""
        try:
            env = os.environ.copy()
            env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"
            res = subprocess.run(
                ["whop", "auth", "status", "--format", "json"],
                capture_output=True,
                text=True,
                timeout=10,
                env=env,
                shell=True
            )
            if res.returncode == 0 and res.stdout.strip():
                try:
                    return json.loads(res.stdout)
                except:
                    return {"raw": res.stdout, "logged_in": "loggedIn: true" in res.stdout}
            return {"logged_in": False, "error": res.stderr}
        except Exception as e:
            return {"logged_in": False, "error": str(e)}

    def execute_cli(self, args: List[str]) -> Dict[str, Any]:
        """
        Executes a real Whop CLI command and parses JSON output.
        Example: execute_cli(["products", "list", "--format", "json"])
        """
        cmd = ["whop"] + args
        logger.info(f"Executing real Whop CLI: {' '.join(cmd)}")
        try:
            env = os.environ.copy()
            env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"
            api_key = self.get_api_key()
            if api_key:
                env["WHOP_API_KEY"] = api_key

            res = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60,
                env=env,
                shell=True
            )
            stdout = res.stdout.strip()
            stderr = res.stderr.strip()

            if res.returncode != 0:
                logger.warning(f"Whop CLI error: {stderr}")
                return {
                    "success": False,
                    "returncode": res.returncode,
                    "error": stderr or stdout
                }

            # Try to parse JSON output if formatted
            try:
                data = json.loads(stdout)
                return {"success": True, "data": data}
            except:
                return {"success": True, "output": stdout}

        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Whop CLI command timed out after 60s"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # Real Commerce Actions
    def create_real_product(self, name: str, description: str = "") -> Dict[str, Any]:
        """Creates a real product under the active Whop business account."""
        args = ["products", "create", "--name", name]
        if description:
            args.extend(["--description", description])
        args.extend(["--format", "json"])
        return self.execute_cli(args)

    def list_real_products(self) -> Dict[str, Any]:
        """Lists real products from the active Whop business."""
        return self.execute_cli(["products", "list", "--format", "json"])

    def create_real_promo_code(self, code: str, discount_percent: int) -> Dict[str, Any]:
        """Creates a real promotional discount code on Whop."""
        args = ["promo-codes", "create", "--code", code, "--discount-percent", str(discount_percent), "--format", "json"]
        return self.execute_cli(args)

    def get_real_stats(self) -> Dict[str, Any]:
        """Fetches real revenue, volume, and member stats from Whop."""
        return self.execute_cli(["stats", "--format", "json"])

    def scaffold_real_whop_app(self, app_name: str, target_dir: str) -> Dict[str, Any]:
        """
        Runs `whop apps init` to scaffold a real Next.js Whop B2C app.
        """
        cmd = ["whop", "apps", "init", "--name", app_name, "--app_type", "b2c_app"]
        logger.info(f"Scaffolding real Whop app in {target_dir}")
        try:
            res = subprocess.run(
                cmd,
                cwd=target_dir,
                capture_output=True,
                text=True,
                timeout=120,
                shell=True
            )
            return {
                "success": res.returncode == 0,
                "stdout": res.stdout,
                "stderr": res.stderr
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

# Global Singleton
whop_real = WhopRealEngine()
