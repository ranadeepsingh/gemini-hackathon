# 🗄️ YeetCode Database Schema Handbook

Welcome to the **YeetCode** Database Architecture Guide. This document serves as the single source of truth for our PostgreSQL schema, relational structures, metric boundaries, triggers, and Row-Level Security (RLS) policies.

All developers (and Autonomous Agents) must read and update this guide whenever schema migrations are added or altered inside `supabase/schema.sql`.

---

## 🗺️ Entity Relationship Blueprint

The database is built on top of **Supabase** (PostgreSQL). It maps individual developer profiles, categorical challenge version catalogs, isolated VM sandbox telemetry, and highly precise consensus evaluations.

```mermaid
erDiagram
    auth_users ||--|| profiles : "has profile (1:1)"
    auth_users ||--o{ interview_sessions : "starts (1:N)"
    categories ||--o{ problems : "classifies (1:N)"
    problems ||--o{ problem_versions : "has history (1:N)"
    problems ||--o{ challenge_rubrics : "defines rubrics (1:N)"
    problems ||--o{ interview_sessions : "associated with (1:N)"
    interview_sessions ||--o{ agent_telemetry : "emits telemetry (1:N)"
    interview_sessions ||--|| evaluation_reports : "generates (1:1)"
    evaluation_reports ||--o{ session_rubrics_scores : "scores rubrics (1:N)"
    challenge_rubrics ||--o{ session_rubrics_scores : "maps to (1:N)"

    profiles {
        uuid id PK "auth.users uuid"
        text username "UNIQUE"
        text full_name
        text avatar_url
        text role "CHECK: candidate, interviewer"
        timestamp updated_at
        timestamp created_at
    }

    categories {
        varchar id PK "e.g. agentic_flow, prompt_engineering"
        text name "Display title"
        text description "Catalog subtext"
        text glow_color "CSS Hex/HSL styling token"
        text icon "Lucide icon keyword"
        timestamp created_at
    }

    problems {
        uuid id PK
        varchar category_id FK "REFERENCES categories.id"
        text title "e.g. Matrix Multithread Optimizer"
        text slug "UNIQUE url segment"
        text description "Markdown challenge backstory + task requirements"
        text difficulty "CHECK: easy, medium, hard"
        text starter_code "Base code with TODO placeholders"
        jsonb test_manifest "Declarative unit test cases config"
        integer recommended_time_mins "Suggested challenge duration"
        integer max_recommended_runs "Suggested maximum agent deploys"
        integer max_token_budget "Enforced input+output tokens cap"
        numeric max_cost_budget_usd "Enforced LLM API billing limit"
        integer passing_score_threshold "Minimum score (0-100) to pass"
        numeric passing_tests_ratio "Minimum fraction of tests that must pass"
        jsonb passing_criteria "Declarative track-specific constraints"
        jsonb metadata "Unstructured JSON"
        timestamp updated_at
        timestamp created_at
    }

    challenge_rubrics {
        uuid id PK
        uuid problem_id FK "ON DELETE CASCADE"
        text metric_key "e.g. loop_efficiency"
        text metric_label "e.g. Concurrency Loop Efficiency"
        text evaluation_type "CHECK: objective_test, objective_static, subjective_llm, subjective_interviewer"
        numeric weight "Rubric weight (0.01 to 1.00)"
        text description "Instruction text for the evaluation"
        timestamp created_at
    }

    interview_sessions {
        uuid id PK
        uuid candidate_id FK "REFERENCES auth.users"
        uuid problem_id FK "REFERENCES problems.id"
        text session_token "UNIQUE cryptographically secure token"
        text session_type "CHECK: practice, screening, live_interview"
        text status "CHECK: pending, active, evaluating, completed, failed"
        text gce_instance_name "Virtual sandbox container ID"
        text gce_instance_ip "Internal/external sandboxed routing IP"
        text gce_instance_zone "GCP Region zone"
        text vnc_password "Secure Web Desktop key"
        timestamp started_at "Session initialization time"
        timestamp ended_at "Session finalize/eval trigger time"
        integer duration_seconds "Computed session elapsed time"
        integer agent_deploy_count "Number of times agent was spawned"
        integer test_run_count "Number of times unit tests were run"
        integer compile_error_count "Number of times compilation crashed"
        integer total_llm_calls "Total number of LLM API requests"
        integer total_input_tokens "Input tokens consumed"
        integer total_output_tokens "Output tokens consumed"
        integer total_reasoning_tokens "Thinking/reasoning tokens"
        numeric cost_usd "Accumulated session API billing"
        jsonb metadata "Unstructured JSON"
        timestamp created_at
    }

    agent_telemetry {
        uuid id PK
        uuid session_id FK "UNIQUE REFERENCES interview_sessions.id"
        text caller_identity "CHECK: candidate, agent, interviewer"
        integer step_index "Traced sequence order"
        text thought "Agent's parsed internal reasoning log"
        text action "Agent's executed tool/command"
        text file_changed "Active buffer filename modified"
        text tool_called "Specific tool name invoked"
        integer latency_ms "Step latency duration"
        integer token_delta "Tokens spent this step"
        integer reasoning_token_delta "Reasoning tokens spent this step"
        numeric cost_delta "Cost incurred by this step"
        jsonb metadata "Unstructured JSON"
        timestamp timestamp
    }

    evaluation_reports {
        uuid id PK
        uuid session_id FK "REFERENCES interview_sessions.id"
        text submitted_code "Persisted copy of candidate's final files"
        integer score_agentic_flow "Legacy fallback"
        integer score_skill_verification "Legacy fallback"
        integer score_prompt_engineering "Legacy fallback"
        integer score_aggregate "Weighted sum of rubric scores"
        text summary_review "Comprehensive VC-level review"
        integer test_cases_passed
        integer test_cases_total
        boolean is_passing "Validated passing constraints check"
        jsonb detailed_results "Complete multi-agent consensus log"
        jsonb metadata "Unstructured JSON"
        timestamp created_at
    }

    session_rubrics_scores {
        uuid id PK
        uuid report_id FK "REFERENCES evaluation_reports.id"
        uuid rubric_id FK "REFERENCES challenge_rubrics.id"
        integer score "Graded score (0 to 100)"
        text feedback "AI Judge critique / Human notes"
        timestamp created_at
    }
```

---

## 🗄️ Database Table Definitions

### 1. `public.profiles`
Stores supplementary profile configurations for registered users.
*   **Permissions Role Check**: Enforces `candidate` (normal candidate operations) or `interviewer` (escalated interviewer privileges).
*   **Sync Logic**: Synchronized automatically on auth signups via database trigger function.

### 2. `public.categories`
High-tech challenge categorization parameters. Contains HSL styling colors and Lucide icon keys for rendering visually premium glow headers.

### 3. `public.problems`
The central assignment problem catalog. Contains:
*   **Budgets vs Actuals**: Establishes expectation thresholds (`recommended_time_mins`, `max_recommended_runs`).
*   **Enforcements**: Enforces hard resource budgets (`max_token_budget`, `max_cost_budget_usd`).
*   **Passing Criteria**: Track-specific passing requirements (`passing_score_threshold`, `passing_tests_ratio`).
*   **Unstructured payload (`metadata` column)**: Allows storing arbitrary GCE VM container settings or environment flags.

### 4. `public.challenge_rubrics`
Stores non-hardcoded evaluation metrics.
*   **Evaluation Source Separation**: Clearly divides metric categories via `evaluation_type` (`objective_test`, `objective_static`, `subjective_llm`, `subjective_interviewer`).
*   **Mathematical Integrity**: Enforces that sum of weights per challenge equals exactly `1.00` using a deferrable constraint trigger, allowing multi-row rubric updates inside one transaction.

### 5. `public.interview_sessions`
Active, programmatic interview trial sessions. Tracks token economic consumption, total test runs, duration, and VNC secrets.
*   **Automatic Duration Calculation**: Uses database trigger to auto-compute `duration_seconds` upon transitioning status to `'completed'`.
*   **Realtime Streaming Channel**: Enabled for Realtime streaming publications so updates propagate directly into the candidate cockpit.

### 6. `public.agent_telemetry`
High-speed step-by-step tracing logs emitted during code execution. Segregates actions by Candidate, Autonomous Agent, or Interviewer override loads.

### 7. `public.evaluation_reports`
The final scorecard summary detailing aggregated results and the median Best-of-3 Gemini structured review. A unique index on `session_id` keeps the relationship one scorecard per interview session.

### 8. `public.session_rubrics_scores`
Individual score breakdown records corresponding to active rubrics for the given problem scorecard.

---

## ♻️ Idempotent Migration Strategy

`supabase/schema.sql` is safe to run against both a fresh Supabase project and an existing project:

*   `CREATE TABLE IF NOT EXISTS` declares all canonical table shapes.
*   `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` backfills additive fields that older projects may be missing.
*   Check constraints that evolved during the formulation plan, such as `profiles_role_check` and `interview_sessions_session_type_check`, are dropped and recreated idempotently.
*   Runtime indexes are declared with `CREATE INDEX IF NOT EXISTS`, including `idx_evaluation_reports_session_id`, which enforces the one-report-per-session invariant.
*   Realtime publication membership is checked before each `ALTER PUBLICATION`, avoiding destructive `DROP PUBLICATION` resets.

---

## ⚡ Real-Time Streaming & Publications

Our Cockpit HUD leverages **Supabase Realtime** to automatically stream sandbox telemetry updates directly into client dashboards.

The schema registers `public.interview_sessions` and `public.agent_telemetry` into the `supabase_realtime` publication only when they are not already present.

### Subscribing to Telemetry Changes:
```typescript
const channel = supabase
  .channel(`session-telemetry-${sessionId}`)
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "interview_sessions",
      filter: `id=eq.${sessionId}`
    },
    (payload) => {
      const updatedSession = payload.new;
      console.log("Realtime Session Telemetry Received:", updatedSession);
    }
  )
  .subscribe();
```

---

## 🛡️ Database Triggers

### Auto-Calculating Session Elapsed Duration
Upon completion, the database trigger automatically computes the candidate's exact elapsed time, avoiding client-side timing manipulation.

```sql
CREATE OR REPLACE FUNCTION public.compute_session_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
        NEW.ended_at := COALESCE(NEW.ended_at, NOW());

        IF NEW.started_at IS NOT NULL THEN
            NEW.duration_seconds := GREATEST(
                0,
                EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::integer
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_compute_session_duration
BEFORE UPDATE ON public.interview_sessions
FOR EACH ROW
EXECUTE FUNCTION public.compute_session_duration();
```

### Mutable Record Timestamps
`public.set_updated_at()` keeps `profiles.updated_at` and `problems.updated_at` synchronized whenever those rows change.

### Rubric Weight Integrity
`public.validate_challenge_rubric_weight_sum()` is attached to `challenge_rubrics` as a `DEFERRABLE INITIALLY DEFERRED` constraint trigger. It blocks commits where a problem has rubrics but the total weight is not exactly `1.00`.

---

## 🔒 Security & Row-Level Security (RLS)

All private tables have RLS enabled.
1.  **Profiles**: Profile rows remain readable for user-facing identity display; updates are restricted to the owning authenticated user.
2.  **Catalog Tables**: `categories`, `problems`, `problem_versions`, and `challenge_rubrics` are readable by candidates, while write operations require `public.is_interviewer()`.
3.  **Sessions**: Insert, select, and update access is scoped to the session-owning candidate or an account with the `interviewer` role.
4.  **Telemetry and Scorecards**: `agent_telemetry`, `evaluation_reports`, and `session_rubrics_scores` use session ownership subqueries so candidates can write/read their own interview artifacts and interviewers can observe or manage live reviews.
5.  **Rubric Weight Adjustment**: Interactive weight adjustment in Interviewer Control Decks enforces role-checking and the deferrable weight-sum trigger to prevent unauthorized or mathematically invalid grading matrices.

---

## 🧪 Seed and Sync Scripts

Use `npm run seed:test-users` to run `scripts/create-test-users.mjs`. The script uses the Supabase service role key from `.env.local` to create or update the demo candidate and interviewer auth users, then upserts matching rows in `public.profiles` so role changes are reflected even when an auth user already existed before the signup trigger was installed.
