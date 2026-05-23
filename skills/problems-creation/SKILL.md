---
name: problems-creation
description: Standard workflow for seeding, formatting, uploading, and instantiating YeetCode challenges and GCE sandboxes.
---

# YeetCode Problems & Assignment Creation

This skill governs the addition, modification, and management of coding challenges and virtual sandbox environments on the YeetCode platform.

## 1. Challenge Data Structure
Every challenge is defined by a strict structure in both the Supabase `public.problems` table and the offline fallback system (`LOCAL_FALLBACK_PROBLEMS` in [problems/page.tsx](file:///Users/rana-ms-work/Documents/gemini-hackathon/src/app/problems/page.tsx)):

- **id**: A valid UUID. Use sequential fallback IDs (e.g., `00000000-0000-0000-0000-000000000001` to `...009`) for local testing.
- **title**: High-impact, professional technical title prefixed with the domain category (e.g. `AI Agentic Engineering: Matrix Multithread Optimizer`).
- **slug**: URL-friendly unique identifier (e.g., `agentic-matrix-optimizer`). Used to map simulation steps.
- **description**: Rich markdown content detailing:
  - **Goal**: Clear problem summary.
  - **Backstory**: Immersive narrative context (cyberpunk, fintech, telemetry, etc.).
  - **Task**: List of step-by-step requirements (such as thread pooling, memory safety, or input validators).
  - **Verification**: List of targeted testing conditions.
- **difficulty**: Enum: `easy` (defensive), `medium` (optimal), `hard` (expert).
- **category**: Enum: `agentic_flow` (loop automation), `skill_verification` (tool limits/schemas), `prompt_engineering` (jailbreak defenses).
- **starter_code**: Complete block of starter Python code for the candidate, including placeholders and TODO marks.
- **test_manifest**: JSONB containing an array of structured test cases to evaluate performance bounds.

## 2. Dynamic Declarative Test Manifests
The uploader component in [problems/page.tsx](file:///Users/rana-ms-work/Documents/gemini-hackathon/src/app/problems/page.tsx) allows users to ingest JSON or JSONL manifests.
When adding or auditing test suites, ensure they conform to the schema:

```json
{
  "test_cases": [
    {
      "id": "tc1",
      "input": "matrix_dimensions",
      "expected": "raise_value_error",
      "timeout_ms": 200
    }
  ]
}
```

## 3. Sandboxed GCE Instance Provisioning
When a user launches a challenge session, the system inserts a record in `public.interview_sessions` which kicks off an automated provisioning sequence:
- **GCE Instance Name**: `yeetcode-sandbox-[slug]-[random_id]`
- **Zone**: `us-central1-a`
- **Core OS Model**: Ubuntu 24.04 LTS
- **Network Boundaries**: Outbound/Egress internet blocked to prevent code leakage or scraping.

## 4. Guidelines for Future Updates
> [!IMPORTANT]
> When adding new challenges, always perform two parallel updates:
> 1. Write an SQL INSERT script in [supabase/schema.sql](file:///Users/rana-ms-work/Documents/gemini-hackathon/supabase/schema.sql) under the core problems seeding section.
> 2. Seed the exact same object inside `LOCAL_FALLBACK_PROBLEMS` in [problems/page.tsx](file:///Users/rana-ms-work/Documents/gemini-hackathon/src/app/problems/page.tsx) to guarantee graceful offline resilience.
