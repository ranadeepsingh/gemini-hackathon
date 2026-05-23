-- YeetCode Database Schema Migration
-- Designed for Google Antigravity Cyberpunk Aesthetics & Realtime Telemetry Streaming

-- Enable Extension for UUID Generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Problems Table
CREATE TABLE IF NOT EXISTS public.problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) NOT NULL,
    category TEXT CHECK (category IN ('agentic_flow', 'skill_verification', 'prompt_engineering')) NOT NULL,
    starter_code TEXT NOT NULL,
    test_manifest JSONB NOT NULL, -- Declarative validation test suites
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

-- Interview Sessions Table
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES auth.users ON DELETE SET NULL,
    problem_id UUID REFERENCES public.problems ON DELETE SET NULL,
    status TEXT CHECK (status IN ('pending', 'active', 'evaluating', 'completed', 'failed')) DEFAULT 'pending' NOT NULL,
    gce_instance_name TEXT,
    gce_instance_ip TEXT,
    gce_instance_zone TEXT,
    vnc_password TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    token_count INTEGER DEFAULT 0 NOT NULL,
    cost_usd NUMERIC(10, 4) DEFAULT 0.0000 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Agent Telemetry Table (Updates Live via Supabase Realtime)
CREATE TABLE IF NOT EXISTS public.agent_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.interview_sessions ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    step_index INTEGER NOT NULL,
    thought TEXT,
    action TEXT,
    file_changed TEXT,
    tool_called TEXT,
    token_delta INTEGER DEFAULT 0 NOT NULL,
    cost_delta NUMERIC(10, 4) DEFAULT 0.0000 NOT NULL
);

-- Evaluation Reports / Scorecards
CREATE TABLE IF NOT EXISTS public.evaluation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.interview_sessions ON DELETE CASCADE NOT NULL,
    score_agentic_flow INTEGER NOT NULL CHECK (score_agentic_flow BETWEEN 0 AND 100),
    score_skill_verification INTEGER NOT NULL CHECK (score_skill_verification BETWEEN 0 AND 100),
    score_prompt_engineering INTEGER NOT NULL CHECK (score_prompt_engineering BETWEEN 0 AND 100),
    score_aggregate INTEGER NOT NULL CHECK (score_aggregate BETWEEN 0 AND 100),
    summary_review TEXT,
    test_cases_passed INTEGER NOT NULL,
    test_cases_total INTEGER NOT NULL,
    detailed_results JSONB NOT NULL, -- Full JSON response from Gemini Best-of-3 Consensuses
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 2. Row Level Security (RLS) & Policies
-- ==========================================

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_reports ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Problems & Problem Versions Policies
CREATE POLICY "Problems are viewable by authenticated users" ON public.problems
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Problem versions are viewable by authenticated users" ON public.problem_versions
    FOR SELECT TO authenticated USING (true);

-- Interview Sessions Policies
CREATE POLICY "Candidates can view their own sessions" ON public.interview_sessions
    FOR SELECT TO authenticated USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates can update their own pending/active sessions" ON public.interview_sessions
    FOR UPDATE TO authenticated USING (auth.uid() = candidate_id);

-- Agent Telemetry Policies
CREATE POLICY "Candidates can view telemetry for their sessions" ON public.agent_telemetry
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.interview_sessions 
            WHERE interview_sessions.id = agent_telemetry.session_id 
              AND interview_sessions.candidate_id = auth.uid()
        )
    );

-- Evaluation Reports Policies
CREATE POLICY "Candidates can view evaluation reports for their sessions" ON public.evaluation_reports
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.interview_sessions 
            WHERE interview_sessions.id = evaluation_reports.session_id 
              AND interview_sessions.candidate_id = auth.uid()
        )
    );

-- ==========================================
-- 3. Automatic Profile Creation Trigger
-- ==========================================

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
        'candidate'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 4. Enable Supabase Realtime
-- ==========================================
BEGIN;
    -- Check if publications exist before modifying
    DROP PUBLICATION IF EXISTS supabase_realtime;
    CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE public.interview_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_telemetry;

-- ==========================================
-- 5. Seed Core Problems (Three Scenarios)
-- ==========================================

INSERT INTO public.problems (id, title, slug, description, difficulty, category, starter_code, test_manifest)
VALUES 
(
    '00000000-0000-0000-0000-000000000001',
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
    }'::jsonb
),
(
    '00000000-0000-0000-0000-000000000002',
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
    }'::jsonb
),
(
    '00000000-0000-0000-0000-000000000003',
    'AI Prompt Engineering: Adversarial Defense Sandbox',
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
    }'::jsonb
);
