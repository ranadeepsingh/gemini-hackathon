---
name: supabase-db
description: Complete guide to Supabase integration, relational tables schema, Row Level Security (RLS) policies, sign-up triggers, and realtime synchronizations.
---

# AntiCode Supabase Database Architecture

This skill governs the database schemas, access control rules, and real-time streaming pipelines of the AntiCode platform.

## 1. Database Table Schema (`supabase/schema.sql`)
The complete schema is maintained in [supabase/schema.sql](file:///Users/rana-ms-work/Documents/gemini-hackathon/supabase/schema.sql). The database comprises the following tables:

*   **`profiles`**: Linked directly to Supabase `auth.users` via a UUID primary key. Stores roles (`candidate` | `interviewer`), display names, and avatars.
*   **`problems`**: Declares coding assignments, metadata, slugs, starter codes, and test manifest JSONs.
*   **`problem_versions`**: Audits historically committed versions of problem formulations.
*   **`interview_sessions`**: Logs candidate sessions, detailing VM statuses, zone listings, computed costs, and token usages.
*   **`agent_telemetry`**: Stores real-time, granular logs of autonomous agent actions (thoughts, tool calls, and costs) to display live in the developer cockpit.
*   **`evaluation_reports`**: Holds final scorecard statistics, summaries, and Gemini single-pass structured results.

## 2. Row Level Security (RLS) Policies
Every table has RLS enabled to secure candidate records and system manifests:

-   **`profiles`**: Public profiles are read-only (`SELECT`) by everyone; updates are restricted to the owner (`auth.uid() = id`).
-   **`problems` & `problem_versions`**: Selected view permissions are granted only to authenticated users (`FOR SELECT TO authenticated`).
-   **`interview_sessions`**: Candidates can only select or update their own sessions (`candidate_id = auth.uid()`).
-   **`agent_telemetry` & `evaluation_reports`**: Restricted via subqueries (`EXISTS`) ensuring a user can only read telemetry or scorecards matching a session where they are the registered candidate.

## 3. Real-Time Telemetry & Synced Channels
To support live streaming of agent logs in the IDE, the database registers a Supabase Realtime publication:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.interview_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_telemetry;
```
The workspace component in [src/app/workspace/page.tsx](file:///Users/rana-ms-work/Documents/gemini-hackathon/src/app/workspace/page.tsx) subscribes to this publication channel to stream thought traces instantly as they are inserted.

## 4. Automatic Signup Trigger
A PostgreSQL PL/pgSQL function triggers on new user registrations to ensure a profile is created:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        'candidate'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 5. Guidelines for Future Updates
> [!CAUTION]
> - **Schema Migration**: When altering schema files, make sure you write idempotent statements (e.g. `CREATE TABLE IF NOT EXISTS`, `DROP TRIGGER IF EXISTS`).
> - **Realtime Publications**: After executing table changes, verify that the `supabase_realtime` publications are successfully re-associated.
> - **Local Client Hookup**: The Supabase client is initialized in [src/lib/supabase/client.ts](file:///Users/rana-ms-work/Documents/gemini-hackathon/src/lib/supabase/client.ts). Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are populated in `.env.local` for development.
