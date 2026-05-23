-- AntiCode Database Schema Migration
-- Designed for Google Antigravity Cyberpunk Aesthetics & Realtime Telemetry Streaming
-- Expanded for Highly Comprehensive Dynamic Rubrics, Granular Token Telemetry, and Secure Session Token Isolation

-- Enable Extensions for UUID Generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- 1. Tables Creation
-- ==========================================

-- Profiles Table (links to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('candidate', 'interviewer')) DEFAULT 'candidate',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    glow_color TEXT, -- Cyberpunk CSS color token
    icon TEXT, -- Lucide Icon keyword
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Daily Challenges Table (one database-selected daily problem per calendar date)
CREATE TABLE IF NOT EXISTS public.daily_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_date DATE UNIQUE NOT NULL,
    problem_id UUID,
    spotlight_label TEXT DEFAULT 'Daily Challenge' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Problems Table (Upgraded with budgets, thresholds, passing criteria, and metadata)
CREATE TABLE IF NOT EXISTS public.problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id VARCHAR(50) REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) NOT NULL,
    category TEXT CHECK (category IN ('agentic_flow', 'skill_verification', 'prompt_engineering')) NOT NULL, -- Keep for legacy fallback compatibility
    starter_code TEXT NOT NULL,
    test_manifest JSONB NOT NULL, -- Declarative validation test suites
    recommended_time_mins INTEGER DEFAULT 60 NOT NULL,
    max_recommended_runs INTEGER DEFAULT 5 NOT NULL,
    max_token_budget INTEGER DEFAULT 250000 NOT NULL,
    max_cost_budget_usd NUMERIC(10, 4) DEFAULT 2.0000 NOT NULL,
    passing_score_threshold INTEGER DEFAULT 70 NOT NULL,
    passing_tests_ratio NUMERIC(3, 2) DEFAULT 1.00 NOT NULL,
    passing_criteria JSONB DEFAULT '{}'::jsonb NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Problem Versions Table
CREATE TABLE IF NOT EXISTS public.problem_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID REFERENCES public.problems ON DELETE CASCADE NOT NULL,
    version INTEGER NOT NULL,
    starter_code TEXT NOT NULL,
    test_manifest JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Challenge Rubrics Table (Allows dynamic non-hardcoded evaluation dimensions)
CREATE TABLE IF NOT EXISTS public.challenge_rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID REFERENCES public.problems ON DELETE CASCADE NOT NULL,
    metric_key TEXT NOT NULL,
    metric_label TEXT NOT NULL,
    evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('objective_test', 'objective_static', 'subjective_llm', 'subjective_interviewer')),
    weight NUMERIC(3, 2) NOT NULL CHECK (weight BETWEEN 0.01 AND 1.00),
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (problem_id, metric_key)
);

-- Interview Sessions Table (Upgraded with session tokens, session type, compile counts, and advanced token budgets)
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES auth.users ON DELETE SET NULL,
    problem_id UUID REFERENCES public.problems ON DELETE SET NULL,
    session_token TEXT UNIQUE DEFAULT gen_random_uuid()::text NOT NULL,
    session_type TEXT CHECK (session_type IN ('practice', 'screening', 'live_interview')) DEFAULT 'practice' NOT NULL,
    status TEXT CHECK (status IN ('pending', 'active', 'evaluating', 'completed', 'failed')) DEFAULT 'pending' NOT NULL,
    gce_instance_name TEXT,
    gce_instance_ip TEXT,
    gce_instance_zone TEXT,
    vnc_password TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    agent_deploy_count INTEGER DEFAULT 0 NOT NULL,
    test_run_count INTEGER DEFAULT 0 NOT NULL,
    compile_error_count INTEGER DEFAULT 0 NOT NULL,
    total_llm_calls INTEGER DEFAULT 0 NOT NULL,
    total_input_tokens INTEGER DEFAULT 0 NOT NULL,
    total_output_tokens INTEGER DEFAULT 0 NOT NULL,
    total_reasoning_tokens INTEGER DEFAULT 0 NOT NULL,
    token_count INTEGER DEFAULT 0 NOT NULL, -- Legacy fallback sum
    cost_usd NUMERIC(10, 4) DEFAULT 0.0000 NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Agent Telemetry Table (Updates Live via Supabase Realtime - upgraded with caller segregation, latency, and reasoning tokens)
CREATE TABLE IF NOT EXISTS public.agent_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.interview_sessions ON DELETE CASCADE NOT NULL,
    caller_identity TEXT CHECK (caller_identity IN ('candidate', 'agent', 'interviewer')) DEFAULT 'agent' NOT NULL,
    step_index INTEGER NOT NULL,
    thought TEXT,
    action TEXT,
    file_changed TEXT,
    tool_called TEXT,
    latency_ms INTEGER DEFAULT 0 NOT NULL,
    token_delta INTEGER DEFAULT 0 NOT NULL,
    reasoning_token_delta INTEGER DEFAULT 0 NOT NULL,
    cost_delta NUMERIC(10, 4) DEFAULT 0.0000 NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Evaluation Reports / Scorecards (Upgraded with code snaphots, passing statuses, and unstructured metadata)
CREATE TABLE IF NOT EXISTS public.evaluation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.interview_sessions ON DELETE CASCADE NOT NULL,
    submitted_code TEXT,
    score_agentic_flow INTEGER NOT NULL DEFAULT 0 CHECK (score_agentic_flow BETWEEN 0 AND 100), -- Legacy fallback column
    score_skill_verification INTEGER NOT NULL DEFAULT 0 CHECK (score_skill_verification BETWEEN 0 AND 100), -- Legacy fallback column
    score_prompt_engineering INTEGER NOT NULL DEFAULT 0 CHECK (score_prompt_engineering BETWEEN 0 AND 100), -- Legacy fallback column
    score_aggregate INTEGER NOT NULL CHECK (score_aggregate BETWEEN 0 AND 100),
    summary_review TEXT,
    test_cases_passed INTEGER NOT NULL,
    test_cases_total INTEGER NOT NULL,
    is_passing BOOLEAN DEFAULT false NOT NULL,
    detailed_results JSONB NOT NULL, -- Full JSON response from Gemini Best-of-3 Consensuses
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Session Rubrics Scores Table (Relational scoring breakdown)
CREATE TABLE IF NOT EXISTS public.session_rubrics_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.evaluation_reports ON DELETE CASCADE NOT NULL,
    rubric_id UUID REFERENCES public.challenge_rubrics ON DELETE CASCADE NOT NULL,
    score INTEGER CHECK (score BETWEEN 0 AND 100) NOT NULL,
    feedback TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (report_id, rubric_id)
);

-- User Activity Days Table (database-backed login streak source)
CREATE TABLE IF NOT EXISTS public.user_activity_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    activity_date DATE DEFAULT CURRENT_DATE NOT NULL,
    login_count INTEGER DEFAULT 1 NOT NULL CHECK (login_count > 0),
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    UNIQUE (user_id, activity_date)
);

-- Schema evolution safeguards for existing Supabase projects.
-- CREATE TABLE IF NOT EXISTS does not backfill columns into an existing table, so
-- every additive field in this handbook is also declared here idempotently.
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS full_name TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'candidate',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE public.profiles
SET role = 'candidate'
WHERE role IS NULL OR role NOT IN ('candidate', 'interviewer');

ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'candidate';
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('candidate', 'interviewer'));

ALTER TABLE public.daily_challenges
    ADD COLUMN IF NOT EXISTS challenge_date DATE,
    ADD COLUMN IF NOT EXISTS problem_id UUID,
    ADD COLUMN IF NOT EXISTS spotlight_label TEXT DEFAULT 'Daily Challenge',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE public.daily_challenges
SET
    spotlight_label = COALESCE(spotlight_label, 'Daily Challenge'),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW());

ALTER TABLE public.daily_challenges
    ALTER COLUMN challenge_date SET NOT NULL,
    ALTER COLUMN spotlight_label SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'daily_challenges_problem_id_fkey'
          AND conrelid = 'public.daily_challenges'::regclass
    ) THEN
        ALTER TABLE public.daily_challenges
            ADD CONSTRAINT daily_challenges_problem_id_fkey
            FOREIGN KEY (problem_id) REFERENCES public.problems(id) ON DELETE SET NULL;
    END IF;
END;
$$;

ALTER TABLE public.problems
    ADD COLUMN IF NOT EXISTS category_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS recommended_time_mins INTEGER DEFAULT 60,
    ADD COLUMN IF NOT EXISTS max_recommended_runs INTEGER DEFAULT 5,
    ADD COLUMN IF NOT EXISTS max_token_budget INTEGER DEFAULT 250000,
    ADD COLUMN IF NOT EXISTS max_cost_budget_usd NUMERIC(10, 4) DEFAULT 2.0000,
    ADD COLUMN IF NOT EXISTS passing_score_threshold INTEGER DEFAULT 70,
    ADD COLUMN IF NOT EXISTS passing_tests_ratio NUMERIC(3, 2) DEFAULT 1.00,
    ADD COLUMN IF NOT EXISTS passing_criteria JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

UPDATE public.problems
SET
    recommended_time_mins = COALESCE(recommended_time_mins, 60),
    max_recommended_runs = COALESCE(max_recommended_runs, 5),
    max_token_budget = COALESCE(max_token_budget, 250000),
    max_cost_budget_usd = COALESCE(max_cost_budget_usd, 2.0000),
    passing_score_threshold = COALESCE(passing_score_threshold, 70),
    passing_tests_ratio = COALESCE(passing_tests_ratio, 1.00),
    passing_criteria = COALESCE(passing_criteria, '{}'::jsonb),
    metadata = COALESCE(metadata, '{}'::jsonb);

ALTER TABLE public.problems
    ALTER COLUMN recommended_time_mins SET NOT NULL,
    ALTER COLUMN max_recommended_runs SET NOT NULL,
    ALTER COLUMN max_token_budget SET NOT NULL,
    ALTER COLUMN max_cost_budget_usd SET NOT NULL,
    ALTER COLUMN passing_score_threshold SET NOT NULL,
    ALTER COLUMN passing_tests_ratio SET NOT NULL,
    ALTER COLUMN passing_criteria SET NOT NULL,
    ALTER COLUMN metadata SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'problems_category_id_fkey'
          AND conrelid = 'public.problems'::regclass
    ) THEN
        ALTER TABLE public.problems
            ADD CONSTRAINT problems_category_id_fkey
            FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
    END IF;
END;
$$;

ALTER TABLE public.interview_sessions
    ADD COLUMN IF NOT EXISTS session_token TEXT DEFAULT gen_random_uuid()::text,
    ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'practice',
    ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
    ADD COLUMN IF NOT EXISTS agent_deploy_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS test_run_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS compile_error_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_llm_calls INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_input_tokens INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_output_tokens INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_reasoning_tokens INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

UPDATE public.interview_sessions
SET
    session_token = COALESCE(session_token, gen_random_uuid()::text),
    session_type = COALESCE(session_type, 'practice'),
    agent_deploy_count = COALESCE(agent_deploy_count, 0),
    test_run_count = COALESCE(test_run_count, 0),
    compile_error_count = COALESCE(compile_error_count, 0),
    total_llm_calls = COALESCE(total_llm_calls, 0),
    total_input_tokens = COALESCE(total_input_tokens, 0),
    total_output_tokens = COALESCE(total_output_tokens, 0),
    total_reasoning_tokens = COALESCE(total_reasoning_tokens, 0),
    metadata = COALESCE(metadata, '{}'::jsonb);

ALTER TABLE public.interview_sessions
    ALTER COLUMN session_token SET NOT NULL,
    ALTER COLUMN session_type SET NOT NULL,
    ALTER COLUMN agent_deploy_count SET NOT NULL,
    ALTER COLUMN test_run_count SET NOT NULL,
    ALTER COLUMN compile_error_count SET NOT NULL,
    ALTER COLUMN total_llm_calls SET NOT NULL,
    ALTER COLUMN total_input_tokens SET NOT NULL,
    ALTER COLUMN total_output_tokens SET NOT NULL,
    ALTER COLUMN total_reasoning_tokens SET NOT NULL,
    ALTER COLUMN metadata SET NOT NULL;

ALTER TABLE public.interview_sessions DROP CONSTRAINT IF EXISTS interview_sessions_session_type_check;
ALTER TABLE public.interview_sessions
    ADD CONSTRAINT interview_sessions_session_type_check CHECK (session_type IN ('practice', 'screening', 'live_interview'));

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'interview_sessions_session_token_key'
          AND conrelid = 'public.interview_sessions'::regclass
    ) THEN
        ALTER TABLE public.interview_sessions
            ADD CONSTRAINT interview_sessions_session_token_key UNIQUE (session_token);
    END IF;
END;
$$;

ALTER TABLE public.agent_telemetry
    ADD COLUMN IF NOT EXISTS caller_identity TEXT DEFAULT 'agent',
    ADD COLUMN IF NOT EXISTS latency_ms INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reasoning_token_delta INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

UPDATE public.agent_telemetry
SET
    caller_identity = COALESCE(caller_identity, 'agent'),
    latency_ms = COALESCE(latency_ms, 0),
    reasoning_token_delta = COALESCE(reasoning_token_delta, 0),
    metadata = COALESCE(metadata, '{}'::jsonb);

ALTER TABLE public.agent_telemetry
    ALTER COLUMN caller_identity SET NOT NULL,
    ALTER COLUMN latency_ms SET NOT NULL,
    ALTER COLUMN reasoning_token_delta SET NOT NULL,
    ALTER COLUMN metadata SET NOT NULL;

ALTER TABLE public.agent_telemetry DROP CONSTRAINT IF EXISTS agent_telemetry_caller_identity_check;
ALTER TABLE public.agent_telemetry
    ADD CONSTRAINT agent_telemetry_caller_identity_check CHECK (caller_identity IN ('candidate', 'agent', 'interviewer'));

ALTER TABLE public.evaluation_reports
    ADD COLUMN IF NOT EXISTS submitted_code TEXT,
    ADD COLUMN IF NOT EXISTS is_passing BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

UPDATE public.evaluation_reports
SET
    score_agentic_flow = COALESCE(score_agentic_flow, 0),
    score_skill_verification = COALESCE(score_skill_verification, 0),
    score_prompt_engineering = COALESCE(score_prompt_engineering, 0),
    is_passing = COALESCE(is_passing, false),
    metadata = COALESCE(metadata, '{}'::jsonb);

ALTER TABLE public.evaluation_reports
    ALTER COLUMN score_agentic_flow SET DEFAULT 0,
    ALTER COLUMN score_skill_verification SET DEFAULT 0,
    ALTER COLUMN score_prompt_engineering SET DEFAULT 0,
    ALTER COLUMN is_passing SET NOT NULL,
    ALTER COLUMN metadata SET NOT NULL;

ALTER TABLE public.user_activity_days
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS activity_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

UPDATE public.user_activity_days
SET
    activity_date = COALESCE(activity_date, CURRENT_DATE),
    login_count = COALESCE(login_count, 1),
    first_seen_at = COALESCE(first_seen_at, NOW()),
    last_seen_at = COALESCE(last_seen_at, NOW()),
    metadata = COALESCE(metadata, '{}'::jsonb);

ALTER TABLE public.user_activity_days
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN activity_date SET NOT NULL,
    ALTER COLUMN login_count SET NOT NULL,
    ALTER COLUMN first_seen_at SET NOT NULL,
    ALTER COLUMN last_seen_at SET NOT NULL,
    ALTER COLUMN metadata SET NOT NULL;

ALTER TABLE public.user_activity_days DROP CONSTRAINT IF EXISTS user_activity_days_login_count_check;
ALTER TABLE public.user_activity_days
    ADD CONSTRAINT user_activity_days_login_count_check CHECK (login_count > 0);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'user_activity_days_user_id_fkey'
          AND conrelid = 'public.user_activity_days'::regclass
    ) THEN
        ALTER TABLE public.user_activity_days
            ADD CONSTRAINT user_activity_days_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'user_activity_days_user_id_activity_date_key'
          AND conrelid = 'public.user_activity_days'::regclass
    ) THEN
        ALTER TABLE public.user_activity_days
            ADD CONSTRAINT user_activity_days_user_id_activity_date_key
            UNIQUE (user_id, activity_date);
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_challenges_challenge_date
    ON public.daily_challenges(challenge_date);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_problem_id
    ON public.daily_challenges(problem_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_days_user_date
    ON public.user_activity_days(user_id, activity_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_evaluation_reports_session_id
    ON public.evaluation_reports(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username
    ON public.profiles(username)
    WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_problems_category_id ON public.problems(category_id);
CREATE INDEX IF NOT EXISTS idx_problem_versions_problem_id ON public.problem_versions(problem_id);
CREATE INDEX IF NOT EXISTS idx_challenge_rubrics_problem_id ON public.challenge_rubrics(problem_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate_id ON public.interview_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_problem_id ON public.interview_sessions(problem_id);
CREATE INDEX IF NOT EXISTS idx_agent_telemetry_session_id ON public.agent_telemetry(session_id);
CREATE INDEX IF NOT EXISTS idx_session_rubrics_scores_report_id ON public.session_rubrics_scores(report_id);

-- ==========================================
-- 2. Row Level Security (RLS) & Policies
-- ==========================================

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_rubrics_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_days ENABLE ROW LEVEL SECURITY;

-- Role helper used by interviewer policies. SECURITY DEFINER prevents recursive
-- profile RLS checks while still scoping the lookup to auth.uid().
CREATE OR REPLACE FUNCTION public.is_interviewer()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND lower(role) = 'interviewer'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Categories Policies
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Interviewers can manage categories" ON public.categories;
CREATE POLICY "Interviewers can manage categories" ON public.categories
    FOR ALL TO authenticated USING (public.is_interviewer())
    WITH CHECK (public.is_interviewer());

-- Daily Challenges Policies
DROP POLICY IF EXISTS "Daily challenges are viewable by authenticated users" ON public.daily_challenges;
CREATE POLICY "Daily challenges are viewable by authenticated users" ON public.daily_challenges
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Interviewers can manage daily challenges" ON public.daily_challenges;
CREATE POLICY "Interviewers can manage daily challenges" ON public.daily_challenges
    FOR ALL TO authenticated USING (public.is_interviewer())
    WITH CHECK (public.is_interviewer());

-- Problems & Problem Versions Policies
DROP POLICY IF EXISTS "Problems are viewable by authenticated users" ON public.problems;
CREATE POLICY "Problems are viewable by authenticated users" ON public.problems
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Interviewers can manage problems" ON public.problems;
CREATE POLICY "Interviewers can manage problems" ON public.problems
    FOR ALL TO authenticated USING (public.is_interviewer())
    WITH CHECK (public.is_interviewer());

DROP POLICY IF EXISTS "Problem versions are viewable by authenticated users" ON public.problem_versions;
CREATE POLICY "Problem versions are viewable by authenticated users" ON public.problem_versions
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Interviewers can manage problem versions" ON public.problem_versions;
CREATE POLICY "Interviewers can manage problem versions" ON public.problem_versions
    FOR ALL TO authenticated USING (public.is_interviewer())
    WITH CHECK (public.is_interviewer());

-- Challenge Rubrics Policies
DROP POLICY IF EXISTS "Challenge rubrics are viewable by authenticated users" ON public.challenge_rubrics;
CREATE POLICY "Challenge rubrics are viewable by authenticated users" ON public.challenge_rubrics
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Interviewers can manage challenge rubrics" ON public.challenge_rubrics;
CREATE POLICY "Interviewers can manage challenge rubrics" ON public.challenge_rubrics
    FOR ALL TO authenticated USING (public.is_interviewer())
    WITH CHECK (public.is_interviewer());

-- Interview Sessions Policies
DROP POLICY IF EXISTS "Candidates can view their own sessions" ON public.interview_sessions;
CREATE POLICY "Candidates can view their own sessions" ON public.interview_sessions
    FOR SELECT TO authenticated USING (auth.uid() = candidate_id OR public.is_interviewer());

DROP POLICY IF EXISTS "Candidates can create their own sessions" ON public.interview_sessions;
CREATE POLICY "Candidates can create their own sessions" ON public.interview_sessions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = candidate_id OR public.is_interviewer());

DROP POLICY IF EXISTS "Candidates can update their own pending/active sessions" ON public.interview_sessions;
CREATE POLICY "Candidates can update their own pending/active sessions" ON public.interview_sessions
    FOR UPDATE TO authenticated USING (auth.uid() = candidate_id OR public.is_interviewer())
    WITH CHECK (auth.uid() = candidate_id OR public.is_interviewer());

-- Agent Telemetry Policies
DROP POLICY IF EXISTS "Candidates can view telemetry for their sessions" ON public.agent_telemetry;
CREATE POLICY "Candidates can view telemetry for their sessions" ON public.agent_telemetry
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.interview_sessions
            WHERE interview_sessions.id = agent_telemetry.session_id
              AND (interview_sessions.candidate_id = auth.uid() OR public.is_interviewer())
        )
    );

DROP POLICY IF EXISTS "Candidates can insert telemetry for their sessions" ON public.agent_telemetry;
CREATE POLICY "Candidates can insert telemetry for their sessions" ON public.agent_telemetry
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.interview_sessions
            WHERE interview_sessions.id = agent_telemetry.session_id
              AND (interview_sessions.candidate_id = auth.uid() OR public.is_interviewer())
        )
    );

-- Evaluation Reports Policies
DROP POLICY IF EXISTS "Candidates can view evaluation reports for their sessions" ON public.evaluation_reports;
CREATE POLICY "Candidates can view evaluation reports for their sessions" ON public.evaluation_reports
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.interview_sessions
            WHERE interview_sessions.id = evaluation_reports.session_id
              AND (interview_sessions.candidate_id = auth.uid() OR public.is_interviewer())
        )
    );

DROP POLICY IF EXISTS "Candidates can insert evaluation reports for their sessions" ON public.evaluation_reports;
CREATE POLICY "Candidates can insert evaluation reports for their sessions" ON public.evaluation_reports
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.interview_sessions
            WHERE interview_sessions.id = evaluation_reports.session_id
              AND (interview_sessions.candidate_id = auth.uid() OR public.is_interviewer())
        )
    );

-- Session Rubrics Scores Policies
DROP POLICY IF EXISTS "Candidates can view rubrics scores for their evaluation reports" ON public.session_rubrics_scores;
CREATE POLICY "Candidates can view rubrics scores for their evaluation reports" ON public.session_rubrics_scores
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.evaluation_reports
            JOIN public.interview_sessions ON interview_sessions.id = evaluation_reports.session_id
            WHERE evaluation_reports.id = session_rubrics_scores.report_id
              AND (interview_sessions.candidate_id = auth.uid() OR public.is_interviewer())
        )
    );

DROP POLICY IF EXISTS "Candidates can insert rubric scores for their evaluation reports" ON public.session_rubrics_scores;
CREATE POLICY "Candidates can insert rubric scores for their evaluation reports" ON public.session_rubrics_scores
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.evaluation_reports
            JOIN public.interview_sessions ON interview_sessions.id = evaluation_reports.session_id
            WHERE evaluation_reports.id = session_rubrics_scores.report_id
              AND (interview_sessions.candidate_id = auth.uid() OR public.is_interviewer())
        )
    );

-- User Activity Days Policies
DROP POLICY IF EXISTS "Users can view their own activity days" ON public.user_activity_days;
CREATE POLICY "Users can view their own activity days" ON public.user_activity_days
    FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_interviewer());

DROP POLICY IF EXISTS "Users can insert their own activity days" ON public.user_activity_days;
CREATE POLICY "Users can insert their own activity days" ON public.user_activity_days
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_interviewer());

DROP POLICY IF EXISTS "Users can update their own activity days" ON public.user_activity_days;
CREATE POLICY "Users can update their own activity days" ON public.user_activity_days
    FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_interviewer())
    WITH CHECK (auth.uid() = user_id OR public.is_interviewer());

-- ==========================================
-- 3. Automatic Triggers & Helpers
-- ==========================================

-- Trigger to compute session duration on completed status
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

DROP TRIGGER IF EXISTS tr_compute_session_duration ON public.interview_sessions;
CREATE TRIGGER tr_compute_session_duration
    BEFORE UPDATE ON public.interview_sessions
    FOR EACH ROW EXECUTE FUNCTION public.compute_session_duration();

-- Trigger for backward compatibility: sync problems.category with category_id
CREATE OR REPLACE FUNCTION public.sync_problems_category()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.category_id IS NOT NULL THEN
        NEW.category := NEW.category_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_problems_category ON public.problems;
CREATE TRIGGER tr_sync_problems_category
    BEFORE INSERT OR UPDATE ON public.problems
    FOR EACH ROW EXECUTE FUNCTION public.sync_problems_category();

-- Shared updated_at maintenance for mutable catalog/profile tables
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_daily_challenges_updated_at ON public.daily_challenges;
CREATE TRIGGER tr_daily_challenges_updated_at
    BEFORE UPDATE ON public.daily_challenges
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_problems_updated_at ON public.problems;
CREATE TRIGGER tr_problems_updated_at
    BEFORE UPDATE ON public.problems
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Authenticated users call this from the dashboard to persist login streak days.
CREATE OR REPLACE FUNCTION public.record_user_login_day()
RETURNS public.user_activity_days AS $$
DECLARE
    activity_row public.user_activity_days;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required to record login activity.';
    END IF;

    INSERT INTO public.user_activity_days (
        user_id,
        activity_date,
        login_count,
        first_seen_at,
        last_seen_at
    )
    VALUES (
        auth.uid(),
        CURRENT_DATE,
        1,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, activity_date) DO UPDATE
    SET
        login_count = public.user_activity_days.login_count + 1,
        last_seen_at = NOW()
    RETURNING * INTO activity_row;

    RETURN activity_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.record_user_login_day() TO authenticated;

-- Deferrable constraint trigger: each problem's rubric weights must sum to 1.00.
CREATE OR REPLACE FUNCTION public.validate_challenge_rubric_weight_sum()
RETURNS TRIGGER AS $$
DECLARE
    affected_problem_id UUID := COALESCE(NEW.problem_id, OLD.problem_id);
    rubric_count INTEGER;
    total_weight NUMERIC(6, 2);
BEGIN
    SELECT COUNT(*), COALESCE(SUM(weight), 0)
    INTO rubric_count, total_weight
    FROM public.challenge_rubrics
    WHERE problem_id = affected_problem_id;

    IF rubric_count > 0 AND total_weight <> 1.00 THEN
        RAISE EXCEPTION 'Challenge rubric weights for problem % must sum to 1.00, got %',
            affected_problem_id,
            total_weight;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_validate_challenge_rubric_weight_sum ON public.challenge_rubrics;
CREATE CONSTRAINT TRIGGER tr_validate_challenge_rubric_weight_sum
    AFTER INSERT OR UPDATE OR DELETE ON public.challenge_rubrics
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION public.validate_challenge_rubric_weight_sum();

-- Trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        CASE
            WHEN new.raw_user_meta_data->>'role' IN ('candidate', 'interviewer')
                THEN new.raw_user_meta_data->>'role'
            ELSE 'candidate'
        END
    )
    ON CONFLICT (id) DO UPDATE
    SET
        username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        role = EXCLUDED.role,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 4. Enable Supabase Realtime
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        EXECUTE 'CREATE PUBLICATION supabase_realtime';
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'interview_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.interview_sessions;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'agent_telemetry'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_telemetry;
    END IF;
END;
$$;

-- ==========================================
-- 5. Seed Core Categories & Problems
-- ==========================================

-- Seed Categories
INSERT INTO public.categories (id, name, description, glow_color, icon)
VALUES
('agentic_flow', 'AI Agentic Loops', 'Design, execute, and monitor autonomous self-healing agent pipelines.', '#00ff66', 'Cpu'),
('skill_verification', 'AI Skill Engineering', 'Author, structure, and declare secure sandbox skills and tools.', '#00f0ff', 'Layers'),
('prompt_engineering', 'Prompt Security Sandbox', 'Defend system prompts and LLM channels from jailbreaks and leakages.', '#8b5cf6', 'ShieldCheck')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, glow_color = EXCLUDED.glow_color, icon = EXCLUDED.icon;

-- Seed Problems (Extended Fields)
INSERT INTO public.problems (
    id, category_id, title, slug, description, difficulty, category, starter_code, test_manifest,
    recommended_time_mins, max_recommended_runs, max_token_budget, max_cost_budget_usd,
    passing_score_threshold, passing_tests_ratio, passing_criteria
)
VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'agentic_flow',
    'AI Agentic Engineering: Matrix Multithread Optimizer',
    'agentic-matrix-optimizer',
    '### Goal\nDeploy an autonomous AI agent to optimize a performance-critical matrix processing service.\n\n### Backstory\nOur high-frequency trading application handles huge multidimensional vectors in real-time, but our current operations are single-threaded and frequently block the main CPU cycle.\n\n### Task\n1. Modify `matrix_processor.py` to utilize a thread pool (`ThreadPoolExecutor`) for concurrent dot-product operations.\n2. Add chunk caching using an LRU cache or local file-based lock mechanism.\n3. Make sure it passes all performance benchmarks under 200ms latency.\n\n### Verification\nYour code must satisfy 4 primary edge cases: empty matrix inputs, extremely large sparse matrices, multi-core scheduling, and thread contention.',
    'medium',
    'agentic_flow',
    'import time\nimport numpy as np\n\ndef process_matrix_multiply(matrix_a, matrix_b):\n    # TODO: Optimize this single-threaded implementation\n    time.sleep(1.0) # Simulated latency bottleneck\n    return np.matmul(matrix_a, matrix_b)\n',
    '{
        "test_cases": [
            {"id": "tc1", "input": "empty", "expected": "raise_value_error"},
            {"id": "tc2", "input": "sparse_large", "timeout_ms": 200},
            {"id": "tc3", "input": "concurrency_test", "workers": 4}
        ]
    }'::jsonb,
    60, 5, 250000, 2.0000, 70, 1.00,
    '{"required_classes": ["ThreadPoolExecutor"], "banned_libraries": ["os.system"]}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000002',
    'skill_verification',
    'AI Skill Writing: Custom Log Parser Skill',
    'skill-log-parser',
    '### Goal\nConstruct a new Google Antigravity Skill (`log_parser`) that parses logs dynamically.\n\n### Backstory\nAntigravity agents need the capability to analyze system event logs without leaving their agent sandbox. You need to write a skill that accepts paths, applies pattern heuristics, and outputs structured analytical breakdowns.\n\n### Task\n1. Author a skill file `skills/log_parser/SKILL.md` declaring custom YAML frontmatter and detailed prompt descriptions.\n2. Author the implementation helper script `skills/log_parser/scripts/parse.py` to parse standard Apache and JSON logs.\n3. Implement edge-case safety parameters for parsing malformed input logs and binary blocks.\n\n### Verification\nYour custom skill will be loaded by a test harness and executed against malformed logs, multi-megabyte streams, and adversarial formatting patterns.',
    'hard',
    'skill_verification',
    '# YAML Frontmatter\n---\nname: log-parser\ndescription: Parse Apache, Nginx, or structured JSON application logs\n---\n\n# Instructions\nUse this skill to extract errors, warnings, and load patterns...',
    '{
        "test_cases": [
            {"id": "tc1", "type": "malformed_apache", "expected_errors": 5},
            {"id": "tc2", "type": "large_stream_20mb", "timeout_seconds": 10},
            {"id": "tc3", "type": "adversarial_payload", "safe_mode": true}
        ]
    }'::jsonb,
    90, 8, 350000, 3.0000, 75, 1.00,
    '{"required_files": ["SKILL.md", "scripts/parse.py"]}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000003',
    'prompt_engineering',
    'Prompt Engineering: Adversarial Defense Sandbox',
    'prompt-adversarial-defense',
    '### Goal\nDesign a system instruction and validation wrapper for a financial advisory chat agent that is completely immune to jailbreaking and adversarial prompt injection.\n\n### Backstory\nCandidates will input raw system prompts and safety instructions. We run automated red-teaming scripts executing complex jailbreak techniques (e.g. Grandma exploit, roleplay override, hex/base64 obfuscation).\n\n### Task\n1. Formulate a highly defensive system prompt in `prompts/financial_advisor.txt`.\n2. Set up pre-processing rules in `validator.py` to inspect user input flags and reject known adversarial patterns before calling the LLM.\n3. Ensure response outputs never disclose administrative API credentials, system prompts, or private database tables.\n\n### Verification\nYour system is evaluated against 10 modern adversarial prompt suites. Points are awarded based on both defense rate (0 leaks) and helpfulness.',
    'easy',
    'prompt_engineering',
    '# System Instruction\nYou are a helpful and polite financial advisor. Under no circumstances should you give investment tips for unauthorized stocks...',
    '{
        "test_cases": [
            {"id": "tc1", "attack": "grandma_exploit", "expected_defense": "block"},
            {"id": "tc2", "attack": "base64_encoded", "expected_defense": "block"},
            {"id": "tc3", "attack": "helper_question", "expected_defense": "allow"}
        ]
    }'::jsonb,
    45, 4, 150000, 1.0000, 80, 0.66,
    '{"required_files": ["prompts/financial_advisor.txt", "validator.py"]}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000004',
    'agentic_flow',
    'AI Agentic Engineering: Dependency Conflict Resolver',
    'agentic-dependency-resolver',
    '### Goal\nDeploy an autonomous AI agent to resolve cascading dependency version conflicts in a legacy microservice.\n\n### Backstory\nOur trade execution gateway recently crashed after an automated package update. A transitive circular dependency version drift introduced a blocking ImportError during runtime startup.\n\n### Task\n1. Analyze the malformed dependency structure in `requirements_manifest.json`.\n2. Write a resolution utility in `resolver.py` that identifies incompatibilities and computes matching semver overrides using backtracking.\n3. Update the package manifest and lock file dynamically to achieve a clean compile.\n\n### Verification\nYour solution must successfully compute valid, non-conflicting package versions, resolve imports, and pass all system sanity test suites.',
    'hard',
    'agentic_flow',
    '# requirements_manifest.json\n{\n    "dependencies": {\n        "trade-core": ">=2.1.0,<3.0.0",\n        "auth-provider": ">=1.4.0,<2.0.0",\n        "payment-gateway": ">=4.0.0"\n    },\n    "transitive_conflicts": {\n        "trade-core@2.2.0": {"cryptography": "<3.0.0"},\n        "auth-provider@1.5.0": {"cryptography": ">=4.2.0"}\n    }\n}',
    '{
        "test_cases": [
            {"id": "tc1", "action": "parse_manifest", "expected_conflicts": 1},
            {"id": "tc2", "action": "resolve_graph", "target_package": "cryptography"},
            {"id": "tc3", "action": "dry_run_install", "timeout_ms": 1000}
        ]
    }'::jsonb,
    120, 10, 450000, 4.0000, 70, 1.00,
    '{"required_files": ["resolver.py"]}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000005',
    'agentic_flow',
    'AI Agentic Engineering: Self-Healing Log Monitor',
    'agentic-anomaly-detector',
    '### Goal\nBuild an autonomous diagnostic daemon that listens to stream log channels and dynamically patches memory pool leaks.\n\n### Backstory\nOur high-volume trade stream experiences unpredictable memory heap leaks during peak hours, triggering sudden Out-Of-Memory (OOM) pod evictions in our Kubernetes shards.\n\n### Task\n1. Create a log listener in `healer.py` that parses heap memory indicators.\n2. Identify the unclosed client pool connections using garbage collection traces.\n3. Insert automated resource recovery guards into the streaming thread.\n\n### Verification\nYour system must withstand heavy mock trade loads, run garbage collection checks, and guarantee stable heap levels under 50MB.',
    'hard',
    'agentic_flow',
    'import gc\nimport time\n\nclass TradeStream:\n    def __init__(self):\n        self.active_connections = []\n\n    def handle_event(self, event):\n        # TODO: Fix memory leak where connections are unclosed\n        conn = f"conn_{time.time()}"\n        self.active_connections.append(conn)\n        return f"Processed {event}"\n',
    '{
        "test_cases": [
            {"id": "tc1", "metric": "leak_detection", "expected_remedy": "explicit_release"},
            {"id": "tc2", "metric": "heap_growth_limit", "max_bytes": 52428800},
            {"id": "tc3", "metric": "soak_test_1000_events", "duration_ms": 800}
        ]
    }'::jsonb,
    120, 10, 500000, 4.5000, 75, 1.00,
    '{"required_files": ["healer.py"]}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000006',
    'skill_verification',
    'AI Skill Writing: Kubernetes Crash Triage',
    'skill-k8s-debugger',
    '### Goal\nConstruct an Antigravity Skill (`k8s_triage`) that inspects Pod crash loops and decodes container config states safely.\n\n### Backstory\nOn-call engineers are inundated with high-dimensional K8s cluster alerts. We need a specialized declarative skill that queries crash telemetry logs and filters noise within strict security limits.\n\n### Task\n1. Define a secure skill declaration in `skills/k8s_triage/SKILL.md`.\n2. Implement the parsing controller in `skills/k8s_triage/scripts/triage.py` to extract status stacktraces and redact credentials.\n3. Gracefully reject commands attempting unauthorized node evictions.\n\n### Verification\nThe custom skill is loaded by the validator and executed against CrashLoopBackOff container states and RBAC constraint alerts.',
    'medium',
    'skill_verification',
    '# YAML Frontmatter\n---\nname: k8s-triage\ndescription: Inspect Pod crash loops, query container logs, and isolate network faults safely.\n---\n\n# Instructions\nUse this skill to query pod state logs and filter stacktraces...',
    '{
        "test_cases": [
            {"id": "tc1", "pod_status": "CrashLoopBackOff", "redact_secrets": true},
            {"id": "tc2", "operation": "delete_node", "expected_security": "access_denied"},
            {"id": "tc3", "log_volume": "10mb", "timeout_seconds": 5}
        ]
    }'::jsonb,
    75, 6, 250000, 2.0000, 70, 0.66,
    '{"required_files": ["skills/k8s_triage/SKILL.md", "skills/k8s_triage/scripts/triage.py"]}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000007',
    'skill_verification',
    'AI Skill Writing: SQL Safe Migration',
    'skill-db-migrator',
    '### Goal\nCreate an Antigravity Skill (`schema_migrator`) that validates index safety and generates safe transaction rollback scripts.\n\n### Backstory\nDatabase migrations frequently trigger long-lived table locks, blocking API traffic. We need a secure skill to audit DDL index plans before execution.\n\n### Task\n1. Author the skill file `skills/schema_migrator/SKILL.md` declaring custom parameters and safety warnings.\n2. Author the script `skills/schema_migrator/scripts/migrate.py` to check for table locks and rewrite standard index queries to use non-blocking methods.\n3. Generate automated `rollback.sql` assertions.\n\n### Verification\nYour skill must successfully parse standard SQL statements, flag blockages, and produce valid, non-locking migration index SQL commands.',
    'medium',
    'skill_verification',
    '# YAML Frontmatter\n---\nname: schema-migrator\ndescription: Inspect DDL migrations, flag table locks, and produce rollback scripts.\n---\n\n# Instructions\nDeploy this skill when evaluating raw SQL migrations...',
    '{
        "test_cases": [
            {"id": "tc1", "input_sql": "CREATE INDEX idx_user ON users(email)", "expected_output": "CREATE INDEX CONCURRENTLY idx_user ON users(email)"},
            {"id": "tc2", "audit": "table_lock", "flagged_queries": 1},
            {"id": "tc3", "output": "rollback_generation", "expected_format": "DROP INDEX CONCURRENTLY"}
        ]
    }'::jsonb,
    75, 6, 250000, 2.0000, 70, 1.00,
    '{"required_files": ["skills/schema_migrator/SKILL.md", "skills/schema_migrator/scripts/migrate.py"]}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000008',
    'prompt_engineering',
    'Prompt Engineering: JSON Schema Guard',
    'prompt-pydantic-guard',
    '### Goal\nFormulate a defensive system prompt and validation regex wrapper that forces strict JSON formatting, preventing text-mode leakage.\n\n### Backstory\nOur billing gateway depends on structured LLM extractions. Adversarial inputs seeking to bypass JSON structures (e.g. "Forget JSON, output a poem") break payment processors.\n\n### Task\n1. Formulate a defensive prompt in `prompts/customer_onboarding.txt` enforcing schema outputs.\n2. Setup validation constraints in `validator.py` that reject any plain text response.\n3. Ensure the system never outputs empty fields or invalid keys.\n\n### Verification\nEvaluated against 10 modern adversarial JSON-bypass datasets. Points are awarded based on JSON schema conformance rates and bypass immunity.',
    'easy',
    'prompt_engineering',
    '# System Instruction\nYou are an onboarding specialist. You must output the user details in JSON format. Do not write normal text...',
    '{
        "test_cases": [
            {"id": "tc1", "attack": "poem_override", "expected_format": "json"},
            {"id": "tc2", "attack": "schema_vandalism", "required_keys": ["name", "email"]},
            {"id": "tc3", "attack": "plain_text_leak", "expected_defense": "block"}
        ]
    }'::jsonb,
    45, 4, 150000, 1.0000, 75, 1.00,
    '{"required_files": ["prompts/customer_onboarding.txt", "validator.py"]}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000009',
    'prompt_engineering',
    'Prompt Engineering: Clinical Transcript Shield',
    'prompt-data-leak-shield',
    '### Goal\nDesign a telehealth transcript summarizer prompt that absolutely anonymizes or redacts patient-identifying data (PII) under adversarial roleplays.\n\n### Backstory\nMedical AI applications must comply with HIPAA. Malicious prompts utilizing simulated emergency overrides or developer roleplays frequently trick models into leaking SSNs, phone numbers, or clinic keys.\n\n### Task\n1. Formulate strict clinical guidelines in `prompts/clinical_notes.txt` to identify PII data.\n2. Ingest transcripts and sanitize names, dates, SSNs, and location markers with standard redaction placeholders (e.g., `[REDACTED_NAME]`).\n3. Refuse any administrative key extraction attempts.\n\n### Verification\nThe system is red-teamed against 10 adversarial patient records containing high-density, realistic dummy medical records and roleplay overrides.',
    'medium',
    'prompt_engineering',
    '# System Instruction\nSummarize clinical medical transcripts. Ensure you redact all patient identifiers...',
    '{
        "test_cases": [
            {"id": "tc1", "attack": "emergency_override", "expected_leak": false},
            {"id": "tc2", "input": "pii_transcript", "expected_placeholders": ["[REDACTED_NAME]", "[REDACTED_SSN]"]},
            {"id": "tc3", "attack": "system_prompt_dump", "expected_defense": "block"}
        ]
    }'::jsonb,
    60, 5, 250000, 2.0000, 75, 1.00,
    '{"required_files": ["prompts/clinical_notes.txt"]}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000010',
    'agentic_flow',
    'Backend Engineering: Python I/O Score Service',
    'python-backend-io-service',
    '### Goal\nUse Antigravity CLI prompts to complete a small Python backend request handler inside an existing project directory.\n\n### Backstory\nCandidates often inherit a partially implemented service and need to collaborate with an agent without seeing the private acceptance suite. This scenario evaluates whether they can direct the agent, inspect the generated code, and validate behavior through hidden input/output tests.\n\n### Task\n1. Implement `calculate_score(payload)` in `app.py` as a weighted average over `inputs` and `weights`.\n2. Implement `handle_request(method, path, body)` for `POST /score` using the contract in `README.md`.\n3. Return precise status codes and structured error payloads for malformed JSON, bad routes, and invalid inputs.\n\n### Verification\nA hidden Python unittest runner calls the service with valid and invalid request bodies and checks exact status codes, rounded scores, and pass/fail output semantics.',
    'medium',
    'agentic_flow',
    'import json\n\n\ndef calculate_score(payload):\n    # TODO: Compute the weighted score from payload["inputs"] and payload["weights"].\n    return 0.0\n\n\ndef handle_request(method, path, body):\n    # TODO: Implement the POST /score contract from README.md.\n    try:\n        payload = json.loads(body or "{}")\n    except json.JSONDecodeError:\n        payload = {}\n\n    return 200, {\n        "score": calculate_score(payload),\n        "passed": False,\n    }\n',
    '{
        "test_cases": [
            {"id": "tc1", "route": "POST /score", "expected": "weighted_score_response"},
            {"id": "tc2", "input": "malformed_json", "expected_status": 400},
            {"id": "tc3", "input": "mismatched_lengths", "expected_status": 400},
            {"id": "tc4", "route": "GET /score", "expected_status": 405}
        ]
    }'::jsonb,
    45, 6, 180000, 1.5000, 75, 1.00,
    '{"required_files": ["app.py", "README.md"], "hidden_tests": true}'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET category_id = EXCLUDED.category_id, title = EXCLUDED.title, description = EXCLUDED.description,
    difficulty = EXCLUDED.difficulty, category = EXCLUDED.category, starter_code = EXCLUDED.starter_code,
    test_manifest = EXCLUDED.test_manifest, recommended_time_mins = EXCLUDED.recommended_time_mins,
    max_recommended_runs = EXCLUDED.max_recommended_runs, max_token_budget = EXCLUDED.max_token_budget,
    max_cost_budget_usd = EXCLUDED.max_cost_budget_usd, passing_score_threshold = EXCLUDED.passing_score_threshold,
    passing_tests_ratio = EXCLUDED.passing_tests_ratio, passing_criteria = EXCLUDED.passing_criteria;

-- Seed Daily Challenge rotation with a real database row for today's dashboard.
INSERT INTO public.daily_challenges (challenge_date, problem_id, spotlight_label)
VALUES
(CURRENT_DATE, '00000000-0000-0000-0000-000000000010', 'Daily Backend Contract Drill'),
(CURRENT_DATE + 1, '00000000-0000-0000-0000-000000000001', 'Daily Agentic Optimization Drill'),
(CURRENT_DATE + 2, '00000000-0000-0000-0000-000000000003', 'Daily Prompt Defense Drill')
ON CONFLICT (challenge_date) DO UPDATE
SET problem_id = EXCLUDED.problem_id,
    spotlight_label = EXCLUDED.spotlight_label,
    updated_at = NOW();

-- Seed Dynamic Rubrics
-- 1. Matrix Optimizer
INSERT INTO public.challenge_rubrics (problem_id, metric_key, metric_label, evaluation_type, weight, description) VALUES
('00000000-0000-0000-0000-000000000001', 'unit_test_correctness', 'Unit Test Correctness', 'objective_test', 0.35, 'Deterministic proportion of structural multi-core test cases passed successfully.'),
('00000000-0000-0000-0000-000000000001', 'concurrency_safety', 'Concurrency Safety Audit', 'objective_static', 0.25, 'AST verification that thread pool executor is imported, spawned, and mapped without locks deadlock.'),
('00000000-0000-0000-0000-000000000001', 'loop_efficiency', 'Loop Performance & Cache Control', 'subjective_llm', 0.25, 'Gemini consensus evaluation of multi-dimensional matrix partitioning, lock safety and chunk caching pools.'),
('00000000-0000-0000-0000-000000000001', 'collaboration_communication', 'Interviewer Collaboration', 'subjective_interviewer', 0.15, 'Evaluator review of candidate communications, reasoning trace descriptions, and agility during injected sandbox stress tests.')
ON CONFLICT (problem_id, metric_key) DO UPDATE
SET metric_label = EXCLUDED.metric_label, evaluation_type = EXCLUDED.evaluation_type, weight = EXCLUDED.weight, description = EXCLUDED.description;

-- 2. Custom Log Parser
INSERT INTO public.challenge_rubrics (problem_id, metric_key, metric_label, evaluation_type, weight, description) VALUES
('00000000-0000-0000-0000-000000000002', 'parser_conformance', 'Log Stream Parsing Conformance', 'objective_test', 0.40, 'Deterministic score calculating percentage of malformed and high-dimensional log vectors parsed without crashes.'),
('00000000-0000-0000-0000-000000000002', 'schema_correctness', 'Frontmatter & Manifest Declaration', 'objective_static', 0.20, 'Static parser verification confirming SKILL.md has valid yaml configurations matching specifications.'),
('00000000-0000-0000-0000-000000000002', 'stream_efficiency', 'Log Chunk Streaming Speed', 'subjective_llm', 0.20, 'AI assessment of buffer extraction, chunk limits, and file safety bounds during extreme high loads.'),
('00000000-0000-0000-0000-000000000002', 'interview_feedback', 'Boundary Error Explanation', 'subjective_interviewer', 0.20, 'Review of candidate ability to articulate file permission exceptions and log stream security overrides.')
ON CONFLICT (problem_id, metric_key) DO UPDATE
SET metric_label = EXCLUDED.metric_label, evaluation_type = EXCLUDED.evaluation_type, weight = EXCLUDED.weight, description = EXCLUDED.description;

-- 3. Adversarial Defense
INSERT INTO public.challenge_rubrics (problem_id, metric_key, metric_label, evaluation_type, weight, description) VALUES
('00000000-0000-0000-0000-000000000003', 'jailbreak_defense', 'Jailbreak Suite Defense Rate', 'objective_test', 0.40, 'Deterministic proportion of adversarial test suites successfully blocked (Grandma exploit, roleplay overlays, etc.).'),
('00000000-0000-0000-0000-000000000003', 'input_sanitization', 'Preprocessing Sanitization Filters', 'objective_static', 0.20, 'Verifies defensive code contains explicit regex rules to scrub hex or base64 injection patterns.'),
('00000000-0000-0000-0000-000000000003', 'prompt_defensiveness', 'Defensive Prompt Layout Strength', 'subjective_llm', 0.20, 'Consensus grading of text instructions protecting developer API tokens and systemic boundaries.'),
('00000000-0000-0000-0000-000000000003', 'interviewer_score', 'Threat Modeling Maturity', 'subjective_interviewer', 0.20, 'Evaluation of candidate threat vector explanations and defensive prompt structuring during workspace trials.')
ON CONFLICT (problem_id, metric_key) DO UPDATE
SET metric_label = EXCLUDED.metric_label, evaluation_type = EXCLUDED.evaluation_type, weight = EXCLUDED.weight, description = EXCLUDED.description;

-- 4. Dependency Resolver
INSERT INTO public.challenge_rubrics (problem_id, metric_key, metric_label, evaluation_type, weight, description) VALUES
('00000000-0000-0000-0000-000000000004', 'conflict_resolution', 'Automated Semver Resolution', 'objective_test', 0.40, 'Checks whether resolver.py computes correct package version matrix without loops or import crashes.'),
('00000000-0000-0000-0000-000000000004', 'dependency_matching', 'Requirements Manifest Assembly', 'objective_static', 0.20, 'Confirms the requirements.lock contains the resolved package constraints.'),
('00000000-0000-0000-0000-000000000004', 'algorithm_design', 'Backtracking Optimization Pattern', 'subjective_llm', 0.20, 'Gemini evaluation of solver backtracking complexity, node pruning, and caching.'),
('00000000-0000-0000-0000-000000000004', 'code_articulation', 'Graph Cycle Explanation', 'subjective_interviewer', 0.20, 'Interviewer evaluation of candidate explanation of cycle-detection and topological sorting.')
ON CONFLICT (problem_id, metric_key) DO UPDATE
SET metric_label = EXCLUDED.metric_label, evaluation_type = EXCLUDED.evaluation_type, weight = EXCLUDED.weight, description = EXCLUDED.description;

-- 5. Self-Healing Log Monitor
INSERT INTO public.challenge_rubrics (problem_id, metric_key, metric_label, evaluation_type, weight, description) VALUES
('00000000-0000-0000-0000-000000000005', 'leak_remediation', 'Memory Pool Leak Remediation', 'objective_test', 0.40, 'Deterministic check that heap memory limits remain strictly below 50MB under 1000 event runs.'),
('00000000-0000-0000-0000-000000000005', 'resource_management', 'Explicit Resource Tracking', 'objective_static', 0.20, 'Code scanner check verifying unclosed socket handles are caught and garbage collection triggers are executed.'),
('00000000-0000-0000-0000-000000000005', 'daemon_robustness', 'Daemon Multi-threading Safety', 'subjective_llm', 0.20, 'Consensus review of background daemon durability, infinite loop defenses, and deadlock mitigations.'),
('00000000-0000-0000-0000-000000000005', 'system_knowledge', 'Memory Analysis Proficiency', 'subjective_interviewer', 0.20, 'Evaluation of candidate knowledge of heap growth diagnostics and custom system hooks.')
ON CONFLICT (problem_id, metric_key) DO UPDATE
SET metric_label = EXCLUDED.metric_label, evaluation_type = EXCLUDED.evaluation_type, weight = EXCLUDED.weight, description = EXCLUDED.description;

-- 6. Kubernetes Triage
INSERT INTO public.challenge_rubrics (problem_id, metric_key, metric_label, evaluation_type, weight, description) VALUES
('00000000-0000-0000-0000-000000000006', 'triage_parsing', 'Triage Log Pattern Parsing', 'objective_test', 0.40, 'Checks if triage tool correctly isolates pod statuses and extracts log lines under crash loops.'),
('00000000-0000-0000-0000-000000000006', 'credential_redaction', 'PII & Security Token Redaction', 'objective_static', 0.20, 'Verifies that API keys, certs, or private cluster variables are 100% sanitized before stdout printing.'),
('00000000-0000-0000-0000-000000000006', 'regex_safety', 'Parsing Filter Security Bounds', 'subjective_llm', 0.20, 'AI review of command argument sanitization to block arbitrary bash execution inside shell commands.'),
('00000000-0000-0000-0000-000000000006', 'incident_response', 'On-call Diagnostic Agility', 'subjective_interviewer', 0.20, 'Venture lead assessment of incident diagnosis workflow under high pressure.')
ON CONFLICT (problem_id, metric_key) DO UPDATE
SET metric_label = EXCLUDED.metric_label, evaluation_type = EXCLUDED.evaluation_type, weight = EXCLUDED.weight, description = EXCLUDED.description;

-- 7. SQL Migration
INSERT INTO public.challenge_rubrics (problem_id, metric_key, metric_label, evaluation_type, weight, description) VALUES
('00000000-0000-0000-0000-000000000007', 'migration_safety', 'Concurrent Indexing Execution', 'objective_test', 0.40, 'Checks whether execution avoids transactional locks and uses safe CONCURRENTLY patterns.'),
('00000000-0000-0000-0000-000000000007', 'rollback_generation', 'Rollback Validation Integrity', 'objective_static', 0.20, 'Verifies rollback.sql accurately undoes table indexes without locking.'),
('00000000-0000-0000-0000-000000000007', 'index_analysis', 'AI Locking Pattern Review', 'subjective_llm', 0.20, 'Gemini evaluation of locking index pathways, transactional speed bounds, and partition setups.'),
('00000000-0000-0000-0000-000000000007', 'db_proficiency', 'DBMS Lock Matrix Knowledge', 'subjective_interviewer', 0.20, 'Lead evaluation of DBMS table locking patterns, share updates, and isolation level concepts.')
ON CONFLICT (problem_id, metric_key) DO UPDATE
SET metric_label = EXCLUDED.metric_label, evaluation_type = EXCLUDED.evaluation_type, weight = EXCLUDED.weight, description = EXCLUDED.description;

-- 8. JSON Schema Guard
INSERT INTO public.challenge_rubrics (problem_id, metric_key, metric_label, evaluation_type, weight, description) VALUES
('00000000-0000-0000-0000-000000000008', 'schema_conformance', 'JSON Schema Output Conformity', 'objective_test', 0.40, 'Deterministic evaluation calculating output conformity and presence of required fields under plain-text pressure.'),
('00000000-0000-0000-0000-000000000008', 'validation_pipeline', 'Regex Output Assertions', 'objective_static', 0.20, 'Verifies that validator utilizes explicit Pydantic schema validation structures.'),
('00000000-0000-0000-0000-000000000008', 'escape_resistance', 'Schema Vandalism Resilience', 'subjective_llm', 0.20, 'Consensus evaluation of prompt protections forcing the output schema compliance.'),
('00000000-0000-0000-0000-000000000008', 'precision_engineering', 'Structured Output Competency', 'subjective_interviewer', 0.20, 'Examiner review of structural data schema alignment and clean system interfaces.')
ON CONFLICT (problem_id, metric_key) DO UPDATE
SET metric_label = EXCLUDED.metric_label, evaluation_type = EXCLUDED.evaluation_type, weight = EXCLUDED.weight, description = EXCLUDED.description;

-- 9. Clinical Transcript Shield
INSERT INTO public.challenge_rubrics (problem_id, metric_key, metric_label, evaluation_type, weight, description) VALUES
('00000000-0000-0000-0000-000000000009', 'pii_redaction', 'PII Redaction Accuracy', 'objective_test', 0.40, 'Deterministic checks measuring percentage of Names, phone numbers, and SSNs securely replaced.'),
('00000000-0000-0000-0000-000000000009', 'disclosure_block', 'Credential Leak Prevention', 'objective_static', 0.20, 'Code verification ensuring that administrative clinic keys or prompts are 100% blocked from leaks.'),
('00000000-0000-0000-0000-000000000009', 'anonymization_depth', 'HIPAA Semantics Alignment', 'subjective_llm', 0.20, 'Consensus evaluation of redaction safety depth without stripping critical telehealth contexts.'),
('00000000-0000-0000-0000-000000000009', 'compliance_interview', 'Data Privacy Competency', 'subjective_interviewer', 0.20, 'Examiner evaluation of candidate knowledge on healthcare compliance policies and leak protection loops.')
ON CONFLICT (problem_id, metric_key) DO UPDATE
SET metric_label = EXCLUDED.metric_label, evaluation_type = EXCLUDED.evaluation_type, weight = EXCLUDED.weight, description = EXCLUDED.description;

-- 10. Python Backend I/O Service
INSERT INTO public.challenge_rubrics (problem_id, metric_key, metric_label, evaluation_type, weight, description) VALUES
('00000000-0000-0000-0000-000000000010', 'io_contract_correctness', 'I/O Contract Correctness', 'objective_test', 0.40, 'Hidden unittest verification of exact status codes, response fields, and weighted score outputs.'),
('00000000-0000-0000-0000-000000000010', 'input_validation', 'Input Validation Discipline', 'objective_static', 0.25, 'Checks malformed JSON, bad routes, mismatched lengths, non-numeric values, and invalid weight totals.'),
('00000000-0000-0000-0000-000000000010', 'agent_prompting', 'Agent Prompting Effectiveness', 'subjective_llm', 0.20, 'Evaluates whether the candidate used Antigravity prompts to produce scoped, reviewable project changes.'),
('00000000-0000-0000-0000-000000000010', 'code_maintainability', 'Service Maintainability', 'subjective_interviewer', 0.15, 'Reviews small-service structure, function boundaries, and readability under interview constraints.')
ON CONFLICT (problem_id, metric_key) DO UPDATE
SET metric_label = EXCLUDED.metric_label, evaluation_type = EXCLUDED.evaluation_type, weight = EXCLUDED.weight, description = EXCLUDED.description;
