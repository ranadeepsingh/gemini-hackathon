<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🌌 AntiCode Autonomous Agent Developer Guide

Welcome, Agent. This repository houses **AntiCode**, a premium, futuristic AI technical interview and coding simulation platform. Below is your structural field manual to understand our architecture, technologies, active workstreams, and specialized skills.

---

## 🛠️ Technology Stack & Core Systems

- **Frontend & App Logic**: [Next.js v16](https://nextjs.org) (App Router, React 19) + [TypeScript](https://typescriptlang.org).
- **Styling System**: [Tailwind CSS v4](https://tailwindcss.com) (leveraging `@tailwindcss/postcss`) with custom cyberpunk glow filters and CSS grids.
- **Animations & Micro-interactions**: [Framer Motion v12](https://motion.dev) for real-time presence indicators, typewriter lines, and progressive loaders.
- **Database, Realtime & Auth**: [Supabase](https://supabase.com) (integrated via `@supabase/supabase-js`) with complete Row-Level Security (RLS) policies and real-time streaming publications.
- **AI Evaluation Engine**: [Google Gemini 3.5 Flash](https://deepmind.google/technologies/gemini/) utilizing structured JSON schemas with single-pass judge scoring.
- **Virtual Container Sandboxes**: Programmatic provisioning of isolated Google Compute Engine (GCE) Ubuntu instances.
- **Web App Route Map**: Keep [webapp_pages.md](file:///Users/rana-ms-work/Documents/gemini-hackathon/webapp_pages.md) synchronized with every App Router page, authenticated dashboard flow, and API route handler.

---

## 🛰️ Active Workstreams & Skill Handbooks

To assist your development on each specialized layer of this codebase, consult our dedicated **Skill Handbooks** in the `skills/` directory:

1.  ### 📝 [Problems & Assignment Creation](file:///Users/rana-ms-work/Documents/gemini-hackathon/skills/problems-creation/SKILL.md)
    *   **Scope**: Database schema schemas for challenge seed logs, declarative test suites, JSON/JSONL manifest uploaders, and sandboxed VM configurations.
    *   **Guideline**: Ensure any new challenge is seeded *both* inside [supabase/schema.sql](file:///Users/rana-ms-work/Documents/gemini-hackathon/supabase/schema.sql) and the offline-fallback object `LOCAL_FALLBACK_PROBLEMS` inside [problems/page.tsx](file:///Users/rana-ms-work/Documents/gemini-hackathon/src/app/problems/page.tsx).

2.  ### 🤖 [AI Interview Evaluations](file:///Users/rana-ms-work/Documents/gemini-hackathon/skills/ai-evaluations/SKILL.md)
    *   **Scope**: High-fidelity grading prompts, single-pass Gemini scoring, weighted rubric aggregation, and schema-enforced response payloads.
    *   **Guideline**: Keep evaluation reviews objective and supportive, following the VC evaluation tone. Manage fallback grades inside [evaluator.ts](file:///Users/rana-ms-work/Documents/gemini-hackathon/src/lib/evaluation/evaluator.ts).

3.  ### 🎨 [UI/UX Aesthetics & Animation](file:///Users/rana-ms-work/Documents/gemini-hackathon/skills/ui-ux-design/SKILL.md)
    *   **Scope**: High-tech cyberpunk dark mode themes, glow layers, grid systems, WebRTC simulation HUDs, and smooth Framer Motion state-transitive animations.
    *   **Guideline**: Maintain a high-end, premium feel. Never use basic browser style rules, and utilize descriptive **Lucide React** icons across every dashboard view.

4.  ### ⚡ [Vercel Programmatic Integration](file:///Users/rana-ms-work/Documents/gemini-hackathon/skills/vercel-integration/SKILL.md)
    *   **Scope**: Automatic Git remote parsing, project setups, deployment provisioning, and build tracking using the Node `@vercel/sdk`.
    *   **Guideline**: Never hardcode Vercel access tokens. Run `npm run vercel-setup` to trigger builds programmatically from the terminal.

5.  ### 🗄️ [Supabase & Database updates](file:///Users/rana-ms-work/Documents/gemini-hackathon/skills/supabase-db/SKILL.md)
    *   **Scope**: PostgreSQL tables (profiles, problems, sessions, telemetry, scorecards), RLS access policies, triggers, and real-time streaming publications.
    *   **Guideline**: Write safe, idempotent migrations inside `supabase/schema.sql`, keep RLS enabled for private user tables, and always keep [DB_SCHEMA.md](file:///Users/rana-ms-work/Documents/gemini-hackathon/DB_SCHEMA.md) synchronized with any schema, constraint, or trigger updates.

6.  ### 🔒 [Secure Git & Credentials Workflows](file:///Users/rana-ms-work/Documents/gemini-hackathon/skills/github-workflows/SKILL.md)
    *   **Scope**: Credential leak prevention, Git pre-commit scanner hooks, and secure workspace configurations.
    *   **Guideline**: Run `bash scripts/install-hooks.sh` to install local pre-commit filters scanning for private keys and Gemini developer credentials.

7.  ### ☁️ [GCP Interfacing & Cloud Resources](file:///Users/rana-ms-work/Documents/gemini-hackathon/skills/gcp-interfacing/SKILL.md)
    *   **Scope**: Isolated GCE sandbox VM instances, private VPC/subnet firewall egress blocking, noVNC websockify proxies, Secret Manager keys, Cloud Run containers, Pub/Sub events, and secure IAP SSH tunnels.
    *   **Guideline**: Protect credentials at all times. Keep `gcp-key.json` ignored and secure, and always ensure automated VM teardown lifecycles are triggered on session terminations to prevent runaway bills.

---

## ⚠️ Critical Commandments for Agents

> [!IMPORTANT]
> - **Preserve the Stack**: Maintain the Next.js App Router layout and Tailwind CSS v4 styling rules.
> - **Resilience First**: Always provide graceful fallbacks (e.g. mock databases or fallback evaluations) if network paths or API gateways are unreachable.
> - **Leak Protection**: Never commit credentials, private key files (`.pem`, `.json`), or secret environment keys to version control. Let the pre-commit filters run on every stage transaction.
