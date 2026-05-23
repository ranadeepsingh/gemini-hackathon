"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  DollarSign,
  Flame,
  Layers,
  LogOut,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  Trophy,
  Zap,
} from "lucide-react";
import AuthAwareHomeLink from "@/components/AuthAwareHomeLink";
import { supabase } from "@/lib/supabase/client";

const SUPABASE_CLIENT_TIMEOUT_MS = 5000;

async function withClientTimeout<T>(
  operation: PromiseLike<T>,
  label: string,
  timeoutMs = SUPABASE_CLIENT_TIMEOUT_MS
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

interface Profile {
  full_name?: string | null;
  username?: string | null;
  role?: string | null;
}

interface ProblemSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: "agentic_flow" | "skill_verification" | "prompt_engineering";
  recommended_time_mins?: number | null;
  passing_score_threshold?: number | null;
  max_token_budget?: number | null;
  max_cost_budget_usd?: number | string | null;
}

interface DailyChallenge {
  challenge_date: string;
  spotlight_label: string;
  problem: ProblemSummary | null;
}

interface ActivityDay {
  activity_date: string;
  login_count: number;
}

interface DashboardSession {
  id: string;
  status: "pending" | "active" | "evaluating" | "completed" | "failed";
  problem_id?: string | null;
  created_at: string;
  started_at?: string | null;
  ended_at?: string | null;
  duration_seconds?: number | null;
  agent_deploy_count?: number | null;
  test_run_count?: number | null;
  compile_error_count?: number | null;
  total_llm_calls?: number | null;
  total_input_tokens?: number | null;
  total_output_tokens?: number | null;
  total_reasoning_tokens?: number | null;
  token_count?: number | null;
  cost_usd?: number | string | null;
  problems?: ProblemSummary | ProblemSummary[] | null;
}

interface EvaluationReport {
  id: string;
  session_id: string;
  score_aggregate: number;
  test_cases_passed: number;
  test_cases_total: number;
  is_passing: boolean;
  created_at: string;
}

function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function relationOne<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10000 ? 1 : 0,
  }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDuration(seconds: number) {
  if (seconds <= 0) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDateLabel(dateValue?: string | null) {
  if (!dateValue) return "Untracked";
  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function calculateLoginStreak(activityDays: ActivityDay[]) {
  const activeDates = new Set(activityDays.map((day) => day.activity_date));
  let streak = 0;
  const cursor = new Date(`${getTodayDateKey()}T00:00:00.000Z`);

  while (activeDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

function getDifficultyClasses(difficulty?: string) {
  if (difficulty === "easy") return "border-agy-green/35 bg-agy-green/10 text-agy-green";
  if (difficulty === "hard") return "border-agy-violet/35 bg-agy-violet/10 text-agy-violet";
  return "border-agy-cyan/35 bg-agy-cyan/10 text-agy-cyan";
}

function generateGceInstanceName(problemSlug: string) {
  const safeSlug = problemSlug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return `anticode-${safeSlug}-${Date.now().toString(36)}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [activityDays, setActivityDays] = useState<ActivityDay[]>([]);
  const [sessions, setSessions] = useState<DashboardSession[]>([]);
  const [reports, setReports] = useState<EvaluationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingDaily, setStartingDaily] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const { data: authData, error: authError } = await withClientTimeout(
          supabase.auth.getSession(),
          "Supabase session lookup",
          2500
        );

        if (authError) throw authError;
        if (!authData.session?.user) {
          router.replace("/login");
          return;
        }

        const authUser = {
          id: authData.session.user.id,
          email: authData.session.user.email ?? undefined,
        };
        setUser(authUser);

        const today = getTodayDateKey();
        const activityWrite = supabase.rpc("record_user_login_day");
        const profileQuery = supabase
          .from("profiles")
          .select("full_name, username, role")
          .eq("id", authUser.id)
          .maybeSingle();
        const dailyQuery = supabase
          .from("daily_challenges")
          .select(`
            challenge_date,
            spotlight_label,
            problems (
              id,
              title,
              slug,
              description,
              difficulty,
              category,
              recommended_time_mins,
              passing_score_threshold,
              max_token_budget,
              max_cost_budget_usd
            )
          `)
          .eq("challenge_date", today)
          .maybeSingle();
        const activityQuery = supabase
          .from("user_activity_days")
          .select("activity_date, login_count")
          .eq("user_id", authUser.id)
          .order("activity_date", { ascending: false })
          .limit(90);
        const sessionsQuery = supabase
          .from("interview_sessions")
          .select(`
            id,
            status,
            problem_id,
            created_at,
            started_at,
            ended_at,
            duration_seconds,
            agent_deploy_count,
            test_run_count,
            compile_error_count,
            total_llm_calls,
            total_input_tokens,
            total_output_tokens,
            total_reasoning_tokens,
            token_count,
            cost_usd,
            problems (
              id,
              title,
              slug,
              description,
              difficulty,
              category,
              recommended_time_mins,
              passing_score_threshold,
              max_token_budget,
              max_cost_budget_usd
            )
          `)
          .eq("candidate_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(50);

        const [activityWriteResult, profileResult, dailyResult, activityResult, sessionsResult] = await Promise.all([
          withClientTimeout(activityWrite, "Supabase activity write"),
          withClientTimeout(profileQuery, "Supabase profile lookup"),
          withClientTimeout(dailyQuery, "Supabase daily challenge lookup"),
          withClientTimeout(activityQuery, "Supabase activity lookup"),
          withClientTimeout(sessionsQuery, "Supabase session lookup"),
        ]);

        if (activityWriteResult.error) throw activityWriteResult.error;
        if (profileResult.error) throw profileResult.error;
        if (dailyResult.error) throw dailyResult.error;
        if (activityResult.error) throw activityResult.error;
        if (sessionsResult.error) throw sessionsResult.error;

        setProfile(profileResult.data ?? null);
        setDailyChallenge({
          challenge_date: dailyResult.data?.challenge_date ?? today,
          spotlight_label: dailyResult.data?.spotlight_label ?? "Daily Challenge",
          problem: relationOne<ProblemSummary>(dailyResult.data?.problems),
        });
        setActivityDays((activityResult.data ?? []) as ActivityDay[]);

        const loadedSessions = (sessionsResult.data ?? []) as DashboardSession[];
        setSessions(loadedSessions);

        const sessionIds = loadedSessions.map((session) => session.id);
        if (sessionIds.length > 0) {
          const reportsResult = await withClientTimeout(
            supabase
              .from("evaluation_reports")
              .select("id, session_id, score_aggregate, test_cases_passed, test_cases_total, is_passing, created_at")
              .in("session_id", sessionIds)
              .order("created_at", { ascending: false }),
            "Supabase scorecard lookup"
          );

          if (reportsResult.error) throw reportsResult.error;
          setReports((reportsResult.data ?? []) as EvaluationReport[]);
        } else {
          setReports([]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn("Could not load dashboard data from Supabase", err);
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  const reportBySession = useMemo(() => {
    return new Map(reports.map((report) => [report.session_id, report]));
  }, [reports]);

  const stats = useMemo(() => {
    const completedSessions = sessions.filter((session) => session.status === "completed");
    const totalTokens = sessions.reduce((sum, session) => {
      const splitTokenTotal =
        numberValue(session.total_input_tokens) +
        numberValue(session.total_output_tokens) +
        numberValue(session.total_reasoning_tokens);
      return sum + (splitTokenTotal || numberValue(session.token_count));
    }, 0);
    const totalDuration = sessions.reduce((sum, session) => sum + numberValue(session.duration_seconds), 0);
    const totalCost = sessions.reduce((sum, session) => sum + numberValue(session.cost_usd), 0);
    const totalRuns = sessions.reduce((sum, session) => sum + numberValue(session.test_run_count), 0);
    const totalDeploys = sessions.reduce((sum, session) => sum + numberValue(session.agent_deploy_count), 0);
    const compileErrors = sessions.reduce((sum, session) => sum + numberValue(session.compile_error_count), 0);
    const passingReports = reports.filter((report) => report.is_passing).length;
    const averageScore =
      reports.length > 0
        ? Math.round(reports.reduce((sum, report) => sum + report.score_aggregate, 0) / reports.length)
        : 0;
    const bestScore = reports.reduce((max, report) => Math.max(max, report.score_aggregate), 0);
    const solvedCases = reports.reduce((sum, report) => sum + numberValue(report.test_cases_passed), 0);
    const totalCases = reports.reduce((sum, report) => sum + numberValue(report.test_cases_total), 0);

    return {
      averageScore,
      bestScore,
      compileErrors,
      completedSessions: completedSessions.length,
      completionRate: sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 100) : 0,
      loginStreak: calculateLoginStreak(activityDays),
      passRate: reports.length > 0 ? Math.round((passingReports / reports.length) * 100) : 0,
      solvedCases,
      totalCases,
      totalCost,
      totalDeploys,
      totalDuration,
      totalRuns,
      totalSessions: sessions.length,
      totalTokens,
    };
  }, [activityDays, reports, sessions]);

  const categoryStats = useMemo(() => {
    const categories = new Map<string, { label: string; completed: number; total: number }>();
    for (const session of sessions) {
      const problem = relationOne(session.problems);
      const category = problem?.category ?? "agentic_flow";
      const label = category.replace("_", " ");
      const current = categories.get(category) ?? { label, completed: 0, total: 0 };
      current.total += 1;
      if (session.status === "completed") current.completed += 1;
      categories.set(category, current);
    }
    return Array.from(categories.values());
  }, [sessions]);

  const handleStartDailyProblem = async () => {
    if (!user || !dailyChallenge?.problem) return;

    try {
      setStartingDaily(true);
      setErrorMessage(null);

      const { data, error } = await withClientTimeout(
        supabase
          .from("interview_sessions")
          .insert({
            candidate_id: user.id,
            problem_id: dailyChallenge.problem.id,
            status: "active",
            session_type: "practice",
            gce_instance_name: generateGceInstanceName(dailyChallenge.problem.slug),
            gce_instance_zone: "us-central1-a",
            started_at: new Date().toISOString(),
          })
          .select("id")
          .single(),
        "Supabase daily session creation"
      );

      if (error) throw error;
      router.push(`/workspace?problem=${dailyChallenge.problem.slug}&session=${data.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMessage(message);
    } finally {
      setStartingDaily(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("demo_role");
    }
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-dark text-white relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-cyber-grid bg-[size:40px_40px] opacity-10 pointer-events-none" />
        <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none" />
        <div className="relative flex flex-col items-center gap-4 border border-slate-800/80 bg-bg-panel/70 px-8 py-7 rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.08)]">
          <Database className="w-8 h-8 text-agy-cyan animate-pulse" />
          <span className="font-mono text-xs text-text-muted uppercase tracking-widest">
            Synchronizing dashboard records
          </span>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-bg-dark text-white relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-cyber-grid bg-[size:40px_40px] opacity-10 pointer-events-none" />
        <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none" />
        <div className="relative w-full max-w-md border border-slate-800/80 bg-bg-panel/70 px-8 py-7 rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.08)] text-center">
          <Database className="w-8 h-8 text-agy-cyan animate-pulse mx-auto" />
          <h1 className="text-xl font-extrabold tracking-tight mt-4">AntiCode Dashboard Access</h1>
          <p className="text-sm text-text-muted mt-2">
            Authentication is required before dashboard records can load.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-agy-cyan px-4 py-2 font-mono text-xs font-bold text-bg-dark hover:bg-agy-cyan/90 transition-all"
          >
            RETURN TO SIGN IN
          </Link>
        </div>
      </main>
    );
  }

  const displayName = profile?.full_name || profile?.username || user.email?.split("@")[0] || "Operator";
  const dailyProblem = dailyChallenge?.problem;
  const recentSessions = sessions.slice(0, 5);

  return (
    <div className="min-h-screen bg-bg-dark text-white relative overflow-x-hidden pb-12">
      <div className="absolute inset-0 bg-cyber-grid bg-[size:40px_40px] opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none" />

      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-bg-dark/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <AuthAwareHomeLink
            ariaLabel="AntiCode dashboard"
            className="flex items-center gap-3 rounded-md transition-opacity hover:opacity-90"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-bg-panel border border-agy-cyan/20 overflow-hidden shadow-[0_0_10px_rgba(0,240,255,0.15)]">
              <img src="/assets/anticode_logo.svg" className="w-full h-full object-cover" alt="AntiCode Logo" />
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-sm block">ANTICODE</span>
              <span className="text-[9px] font-mono text-agy-green block uppercase tracking-widest -mt-0.5">USER DASHBOARD</span>
            </div>
          </AuthAwareHomeLink>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/problems"
              className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-agy-cyan transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              PROBLEMS
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-text-red transition-colors cursor-pointer border-l border-slate-800/80 pl-4 h-8"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 relative z-10 space-y-8">
        {errorMessage && (
          <div className="border border-text-red/30 bg-text-red/10 rounded-xl px-4 py-3 font-mono text-xs text-text-red">
            Supabase dashboard sync failed: {errorMessage}
          </div>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-7 border border-slate-800/80 bg-bg-panel/55 rounded-xl p-6 overflow-hidden relative shadow-[20px_20px_40px_rgba(0,0,0,0.35)]"
          >
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-agy-green/50 to-transparent" />
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 border border-agy-green/20 bg-agy-green/10 text-agy-green px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  Active Profile
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-4">
                  {displayName}
                </h1>
                <p className="text-text-muted font-mono text-xs mt-2 uppercase tracking-wider">
                  {profile?.role || "candidate"} telemetry profile
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 min-w-[220px]">
                <div className="border border-slate-800/80 bg-bg-dark/45 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-agy-green font-mono text-[10px] uppercase tracking-widest">
                    <Flame className="w-3.5 h-3.5" />
                    Streak
                  </div>
                  <div className="text-3xl font-mono font-extrabold mt-2">{stats.loginStreak}</div>
                  <div className="text-[10px] text-text-muted font-mono uppercase mt-1">login days</div>
                </div>
                <div className="border border-slate-800/80 bg-bg-dark/45 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-agy-cyan font-mono text-[10px] uppercase tracking-widest">
                    <Trophy className="w-3.5 h-3.5" />
                    Best
                  </div>
                  <div className="text-3xl font-mono font-extrabold mt-2">{stats.bestScore}</div>
                  <div className="text-[10px] text-text-muted font-mono uppercase mt-1">score</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {[
                { label: "Sessions", value: stats.totalSessions, icon: Terminal, tone: "text-agy-cyan" },
                { label: "Completed", value: `${stats.completionRate}%`, icon: CheckCircle2, tone: "text-agy-green" },
                { label: "Avg Score", value: stats.averageScore, icon: BarChart3, tone: "text-agy-violet" },
                { label: "Pass Rate", value: `${stats.passRate}%`, icon: ShieldCheck, tone: "text-agy-green" },
              ].map((item) => (
                <div key={item.label} className="border border-slate-800/70 bg-bg-dark/35 rounded-lg p-3 min-h-[96px]">
                  <item.icon className={`w-4 h-4 ${item.tone}`} />
                  <div className="text-2xl font-mono font-bold mt-3">{item.value}</div>
                  <div className="text-[10px] text-text-muted font-mono uppercase tracking-widest mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-5 border border-slate-800/80 bg-bg-panel/55 rounded-xl p-6 overflow-hidden relative shadow-[20px_20px_40px_rgba(0,0,0,0.35)]"
          >
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-agy-cyan/50 to-transparent" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-agy-cyan font-mono text-[10px] uppercase tracking-widest">
                  <CalendarDays className="w-4 h-4" />
                  {dailyChallenge?.spotlight_label || "Daily Challenge"}
                </div>
                <h2 className="text-xl font-bold mt-2">Today&apos;s Daily Problem</h2>
              </div>
              <span className="font-mono text-[10px] text-text-muted border border-slate-800/80 bg-bg-dark/40 rounded-full px-2.5 py-1">
                {formatDateLabel(dailyChallenge?.challenge_date)}
              </span>
            </div>

            {dailyProblem ? (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-mono text-[10px] px-2.5 py-1 rounded-full border uppercase ${getDifficultyClasses(dailyProblem.difficulty)}`}>
                    {dailyProblem.difficulty}
                  </span>
                  <span className="font-mono text-[10px] px-2.5 py-1 rounded-full border border-slate-800 text-text-muted bg-bg-dark/45 uppercase">
                    {dailyProblem.category.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-tight">{dailyProblem.title}</h3>
                  <p className="text-xs text-text-muted font-mono leading-relaxed mt-2 line-clamp-3">
                    {dailyProblem.description.replace(/[#*`]/g, "")}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-slate-800/70 bg-bg-dark/35 rounded-lg p-3">
                    <Clock className="w-3.5 h-3.5 text-agy-cyan" />
                    <div className="font-mono text-sm font-bold mt-2">{dailyProblem.recommended_time_mins || 60}m</div>
                    <div className="font-mono text-[9px] text-text-muted uppercase">Target</div>
                  </div>
                  <div className="border border-slate-800/70 bg-bg-dark/35 rounded-lg p-3">
                    <Target className="w-3.5 h-3.5 text-agy-green" />
                    <div className="font-mono text-sm font-bold mt-2">{dailyProblem.passing_score_threshold || 70}</div>
                    <div className="font-mono text-[9px] text-text-muted uppercase">Pass</div>
                  </div>
                  <div className="border border-slate-800/70 bg-bg-dark/35 rounded-lg p-3">
                    <Zap className="w-3.5 h-3.5 text-agy-violet" />
                    <div className="font-mono text-sm font-bold mt-2">{formatCompactNumber(numberValue(dailyProblem.max_token_budget))}</div>
                    <div className="font-mono text-[9px] text-text-muted uppercase">Tokens</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStartDailyProblem}
                  disabled={startingDaily}
                  className="w-full bg-agy-cyan text-bg-dark px-4 py-3 rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(0,240,255,0.24)] hover:shadow-[0_0_26px_rgba(0,240,255,0.4)] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {startingDaily ? "ALLOCATING SESSION" : "START DAILY PROBLEM"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-5 border border-dashed border-slate-800 rounded-lg p-5 text-sm text-text-muted font-mono">
                No daily challenge row is configured in Supabase for {getTodayDateKey()}.
              </div>
            )}
          </motion.div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Token Spend", value: formatCompactNumber(stats.totalTokens), sub: "input + output + reasoning", icon: Cpu, tone: "text-agy-cyan" },
            { label: "Total Cost", value: formatCurrency(stats.totalCost), sub: "recorded session cost", icon: DollarSign, tone: "text-agy-green" },
            { label: "Runtime", value: formatDuration(stats.totalDuration), sub: "completed session time", icon: Clock, tone: "text-agy-violet" },
            { label: "Test Runs", value: stats.totalRuns, sub: `${stats.totalDeploys} deploys, ${stats.compileErrors} compile errors`, icon: Activity, tone: "text-agy-cyan" },
          ].map((item) => (
            <div key={item.label} className="border border-slate-800/80 bg-bg-panel/45 rounded-xl p-5 min-h-[132px]">
              <div className="flex items-center justify-between gap-3">
                <item.icon className={`w-5 h-5 ${item.tone}`} />
                <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest">DB</span>
              </div>
              <div className="text-2xl font-mono font-bold mt-4">{item.value}</div>
              <div className="font-mono text-[10px] text-text-muted uppercase tracking-widest mt-1">{item.label}</div>
              <div className="text-xs text-text-muted mt-3">{item.sub}</div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 border border-slate-800/80 bg-bg-panel/45 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">Recent Sessions</h2>
                <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mt-1">
                  Latest database records
                </p>
              </div>
              <Link href="/problems" className="font-mono text-xs text-agy-cyan hover:text-white transition-colors flex items-center gap-1.5">
                Browse
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-800/70">
              {recentSessions.length > 0 ? (
                recentSessions.map((session) => {
                  const problem = relationOne(session.problems);
                  const report = reportBySession.get(session.id);
                  return (
                    <div key={session.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                            {formatDateLabel(session.created_at)}
                          </span>
                          <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full border uppercase ${getDifficultyClasses(problem?.difficulty)}`}>
                            {session.status}
                          </span>
                        </div>
                        <h3 className="font-semibold mt-2 truncate">{problem?.title || "Unlinked problem"}</h3>
                        <p className="font-mono text-[10px] text-text-muted mt-1 uppercase">
                          {numberValue(session.test_run_count)} tests / {numberValue(session.agent_deploy_count)} deploys / {formatCurrency(numberValue(session.cost_usd))}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-mono text-xl font-bold">{report?.score_aggregate ?? "--"}</div>
                          <div className="font-mono text-[9px] text-text-muted uppercase">score</div>
                        </div>
                        {report ? (
                          <Link
                            href={`/reports/${report.id}?problem=${problem?.slug || ""}`}
                            className="w-9 h-9 rounded-lg border border-slate-800 hover:border-agy-cyan bg-bg-dark/60 flex items-center justify-center text-text-muted hover:text-agy-cyan transition-all"
                            aria-label={`Open report for ${problem?.title || "session"}`}
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        ) : (
                          <span className="w-9 h-9 rounded-lg border border-slate-800 bg-bg-dark/30 flex items-center justify-center text-text-muted/40">
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-5 py-12 text-center text-text-muted font-mono text-xs">
                  No interview session rows exist for this user yet.
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 gap-6">
            <div className="border border-slate-800/80 bg-bg-panel/45 rounded-xl p-5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-agy-green" />
                <h2 className="font-bold">Case Coverage</h2>
              </div>
              <div className="mt-5 flex items-end gap-3">
                <span className="text-4xl font-mono font-extrabold">{stats.solvedCases}</span>
                <span className="text-text-muted font-mono text-sm mb-1">/ {stats.totalCases} test cases</span>
              </div>
              <div className="h-2 bg-bg-dark rounded-full overflow-hidden mt-4 border border-slate-800/80">
                <div
                  className="h-full bg-gradient-to-r from-agy-cyan to-agy-green"
                  style={{ width: `${stats.totalCases > 0 ? Math.round((stats.solvedCases / stats.totalCases) * 100) : 0}%` }}
                />
              </div>
            </div>

            <div className="border border-slate-800/80 bg-bg-panel/45 rounded-xl p-5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-agy-cyan" />
                <h2 className="font-bold">Domain Progress</h2>
              </div>
              <div className="space-y-3 mt-5">
                {categoryStats.length > 0 ? (
                  categoryStats.map((category) => {
                    const percentage = category.total > 0 ? Math.round((category.completed / category.total) * 100) : 0;
                    return (
                      <div key={category.label}>
                        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
                          <span className="text-text-muted">{category.label}</span>
                          <span className="text-agy-green">{category.completed}/{category.total}</span>
                        </div>
                        <div className="h-2 bg-bg-dark rounded-full overflow-hidden mt-2 border border-slate-800/80">
                          <div className="h-full bg-agy-cyan" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-text-muted font-mono text-xs">No domain progress rows exist yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
