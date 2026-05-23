# 🌌 AntiCode: Futuristic AI-Agentic Technical Interviewing Simulator

Welcome to **AntiCode**, a premium, high-fidelity AI technical interview and coding simulation platform. AntiCode integrates state-of-the-art interactive coding sandbox environments, live Google Gemini 3.5 evaluator integrations, real-time telemetry streaming, and role-based administration panels to deliver a world-class workspace cockpit for candidates and interviewers alike.

**Production URL**: [https://anticode-rana-s-projects11.vercel.app](https://anticode-rana-s-projects11.vercel.app)

```
====================================================================
  🌌 A N T I C O D E   A C T I V E   C O C K P I T   S Y S T E M S 🌌
====================================================================
```

---

## 🛠️ Technology Stack & Architecture

- **Logic Layer**: Next.js v16 (App Router) + React 19 + TypeScript.
- **Design System**: Tailwind CSS v4 featuring post-processed cyberpunk layouts, matrix overlays, custom glow layers, and dark glassmorphic panels.
- **Animation Engine**: Framer Motion v12 managing micro-interactions, presence indicators, typewriter playback, and transition loaders.
- **Database, Realtime & Auth**: Supabase Auth + PostgreSQL schema integration with automatic profiles trigger mapping. See the complete [DB_SCHEMA.md](file:///Users/rana-ms-work/Documents/gemini-hackathon/DB_SCHEMA.md) for database layouts, triggers, and telemetry definitions.
- **AI Evaluation Engine**: Google Gemini 3.5 Flash utilizing structured JSON grading schemas for three-dimensional scorecards.
- **Execution Sandboxes**: Programmatic isolated environments mimicking virtual GCE instances.

---

## 🔑 Role-Based Access & Seeded Test Accounts

AntiCode supports strict role-based access controls (RBAC) to differentiate between standard candidate practice runs and live interviewer observation environments.

We have programmatically seeded two primary real test users inside our Supabase database to make evaluation and sandbox walkthroughs instantaneous.

| Secure Identity Email | Access Password | Profile Name | Access Role | Workspace Privileges & Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| `candidate@anticode.com` | `anticode123` | Clara Candidate | **Candidate** | **Standard Cockpit Access**: Write code, run tests, deploy the autonomous Antigravity solver, and submit solutions for Gemini scoring. |
| `interviewer@anticode.com` | `anticode123` | Ian Interviewer | **Interviewer** | **Escalated Admin Access**: Unlocks the live **Interviewer System Control Deck** with real-time observation and intervention parameters. |

---

## 🌌 Escalated Interviewer System Control Deck

When logged in as an **Interviewer** (e.g., via `interviewer@anticode.com` or selecting the Interviewer Demo Bypass), the workspace cockpit dynamically injects a premium **Interviewer System Control Deck** widget directly into the sidebar panel.

This cockpit grants interviewers high-level, escalated administrative capabilities during live interviews:

1. **Reveal Solutions & Reference Architectures**:
   - Toggles a high-tech inline cheat trace rendering the optimal logical solution approach, step-by-step validation guides, and executable sample snippets for the current problem.
2. **Adversarial Stress-Test Injection**:
   - Allows the interviewer to inject artificial cognitive strain and VPC network delay constraints on-the-fly. This pipes custom alerts and stress warnings directly into the candidate's terminal and thoughts log to evaluate error-handling under pressure.
3. **VM Kernel Hot-Patching**:
   - Programmatically patch the sandbox VM instance, flush file buffers, and recalibrate security filters dynamically.
4. **Dynamic Grade Metric Weighting**:
   - Interactive sliders that allow real-time manual weighting adjustments for grading criteria (e.g., shifting the aggregate score weight between **Agentic Flow** efficiency and **Skill Verification** correctness).
5. **Admin Force Pass Overrides**:
   - Instantly bypass code constraints and force 3/3 secret validation test suites to pass to expedite full evaluation walkthroughs.

---

## 🚀 Quick Start Guide

### Production Deployment
The Vercel project is linked to `ranadeepsingh/gemini-hackathon`, with `main` configured as the production branch. Any future commit pushed to `origin/main` should automatically deploy to:

[https://anticode-rana-s-projects11.vercel.app](https://anticode-rana-s-projects11.vercel.app)

### 1. Seeding / Syncing Test Users
To manually recreate or synchronize the test users in your Supabase DB instance using our automated admin client script:
```bash
npm run seed:test-users
```

### 2. Run the Development Cockpit
Launch the high-performance local dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Prompt the Antigravity Agent
Inside a workspace terminal, candidates can direct the project agent with natural-language CLI prompts:
```bash
antigravity prompt "Implement POST /score and validate malformed JSON inputs"
antigravity test
```

The editable workspace exposes only project files. Hidden validation runners are mounted outside the candidate directory and are invoked through `antigravity test` or automatically after prompt-driven agent edits.

### 4. Build & Compile Verification
To compile TypeScript paths and compile an optimized production bundle:
```bash
npm run build
```

---

*Designed for Advanced Agentic Coding & Cyberpunk Visual Excellence.*
