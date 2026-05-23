# Web App Pages

This project uses the Next.js App Router under `src/app`. In the local Next.js v16 docs, a `page` file defines UI for a publicly accessible route; `route` files define API route handlers and are listed separately below.

## UI Page Tree

```text
src/app
|-- layout.tsx
|   `-- Root layout shared by every app route
|-- page.tsx
|   `-- /                              Landing page
|-- login/
|   `-- page.tsx
|       `-- /login                     Authentication page
|-- dashboard/
|   `-- page.tsx
|       `-- /dashboard                 Authenticated user stats dashboard
|-- problems/
|   `-- page.tsx
|       `-- /problems                  Challenge browser and assignment launcher
|-- workspace/
|   `-- page.tsx
|       `-- /workspace                 Coding sandbox workspace
`-- reports/
    `-- [sessionId]/
        `-- page.tsx
            `-- /reports/[sessionId]   Dynamic evaluation report and certificate
```

## Page Details

| Route | Source file | Purpose | Main navigation |
| --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | Marketing and product entry page for AntiCode with live simulation/cockpit visuals. | Links to `/login`, `/workspace`, and `/problems`. |
| `/login` | `src/app/login/page.tsx` | Supabase auth interface with magic link, sign in, sign up, and demo bypass flows. | Redirects successful Supabase users to `/dashboard`; demo bypass continues to `/problems`; logo resolves to `/dashboard` when a Supabase session exists. |
| `/dashboard` | `src/app/dashboard/page.tsx` | Authenticated user dashboard with DB-backed daily problem, login streak, session totals, score summaries, token/cost usage, case coverage, domain progress, and recent reports. | Requires Supabase auth; records the current login day via `record_user_login_day`; starts the daily problem in `/workspace`; links to `/problems` and `/reports/[sessionId]`. |
| `/problems` | `src/app/problems/page.tsx` | Problem suite browser with local fallback challenge data and session launch logic. | Starts sessions and routes to `/workspace?problem={slug}&session={id}`; logout path routes to `/login`; logo resolves to `/dashboard` when a Supabase session exists. |
| `/workspace` | `src/app/workspace/page.tsx` | Interview coding cockpit with file editor state, terminal simulation, telemetry, rubrics, saving, execution, and evaluation. | Reads `problem` and `session` query params; routes to `/reports/{sessionId}?problem={slug}` after evaluation; logo resolves to `/dashboard` when a Supabase session exists. |
| `/reports/[sessionId]` | `src/app/reports/[sessionId]/page.tsx` | Dynamic completion report/certificate page keyed by `sessionId`, with Supabase and fallback report data. | Reads optional `problem` and `grade` query params; can route back to `/problems`; logo resolves to `/dashboard` when a Supabase session exists. |

## API Route Handlers

These are not pages, but they support the webapp flows above.

```text
src/app/api
|-- evaluate/
|   `-- route.ts    POST /api/evaluate
|-- execute/
|   `-- route.ts    POST /api/execute
`-- workspace/
    `-- route.ts    GET /api/workspace
                    POST /api/workspace
```

## Primary User Flow

```text
/
`-- /login
    `-- /dashboard
        |-- /problems
        |   `-- /workspace?problem={slug}&session={id}
        |       `-- /reports/{sessionId}?problem={slug}
        `-- /workspace?problem={dailySlug}&session={id}
            `-- /reports/{sessionId}?problem={dailySlug}
```
