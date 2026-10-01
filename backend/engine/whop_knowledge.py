"""
Whop Knowledge Engine & System Documentation Index.
Pre-loaded ecosystem expertise for the Whop Agent Army (Atlas, Cypher, Echo, Nova).
Sourced directly from https://docs.whop.com/llms.txt and Whop CLI v0.23.1.
"""

WHOP_ECOSYSTEM_OVERVIEW = """
### THE WHOP ECOSYSTEM SPECIFICATION & ARCHITECTURE

1. CORE ENTITIES:
- **Account / Company (`biz_...`)**: The top-level merchant account (e.g., `biz_wDSHPXqL0Ew9Jr`). Manages billing, payouts, wallets, team roles, and apps.
- **Product (`prod_...`)**: The digital good or service container. A product CANNOT be purchased on its own — it requires at least one attached Pricing Plan and at least one attached Experience!
- **Pricing Plan (`plan_...`)**: Defines how customers pay.
  - Recurring (`plan_type: "renewal"`): Monthly/yearly subscription. Requires `billing_period` (30 days), `initial_price`, and `renewal_price`.
  - One-Time (`plan_type: "one_time"`): Lifetime access pass.
  - Checkout Link: Every plan generates a direct, secure payment link: `https://whop.com/checkout/plan_...`.
- **Experiences & Apps (`exp_...`)**: The VALUE delivered to the buyer. Upon completing checkout, buyers are immediately granted access to the product's attached experiences.

2. NATIVE WHOP APPS AVAILABLE FOR COMMUNITIES:
- **Discussion Forums (`app_5y103yXjL9eM12` / `exp_...`)**: Threaded discussion boards for member networking, VIP trade ideas, support, and discussions.
- **Courses & LMS**: Structured chapters, video/text lessons, quizzes, and automated completion certificates (`POST /api/v1/courses`).
- **Files & Downloadable Vaults**: Member asset libraries, Notion templates, prompt databases, and PDF blueprints.
- **Chat Channels & DMs**: Real-time member messaging, announcements, and direct creator access.
- **Software Licensing**: Automated license keys, webhooks, and Discord/Telegram role gating.
- **Custom Hosted Web Apps (*.whop.site)**: Next.js fullstack applications scaffolded with `whop apps init` and deployed with `whop apps deploy`.

3. PRODUCT MARKETPLACE PUBLISHING CRITERIA:
To make a product discoverable on the Whop Marketplace (`POST /api/v1/products/{id}/publish`), it MUST have:
1. Product Title & Catchy Headline (< 60 chars) explaining the value proposition.
2. In-depth Description highlighting benefits, features, and target audience.
3. High-Resolution Cover Image / Banner (16:9 ratio, minimum 1200x675px).
4. At least one attached experience (Community Forum, Course, or Downloadable Vault).
5. At least one active pricing plan with instant checkout.

4. GROWTH & MARKETING LEVERS:
- **Promo Codes**: Time-limited or limited-stock percentage discounts (e.g., `VIP50` for 50% off) created via `whop promo-codes create`.
- **Free Trials & Waitlists**: Low-friction lead acquisition for high-ticket digital products.
- **Affiliate Programs**: Built-in 20-50% commission sharing to recruit affiliates across Whop.
"""

def get_agent_knowledge_prompt(agent_role: str) -> str:
    """Returns specialized domain knowledge injected into each agent's system prompt."""
    return f"""
{WHOP_ECOSYSTEM_OVERVIEW}

### ROLE-SPECIFIC MANDATE FOR {agent_role.upper()}:
- Always refer to real Whop entities (`prod_...`, `plan_...`, `exp_...`, `biz_wDSHPXqL0Ew9Jr`).
- Never propose hollow checkout links without actual member value (Forums, Courses, Digital Vaults).
- Communicate naturally, collaboratively, and specifically with your fellow agents.
- Be proactive: audit live assets, update descriptions, attach community apps, and deliver real utility.
"""
