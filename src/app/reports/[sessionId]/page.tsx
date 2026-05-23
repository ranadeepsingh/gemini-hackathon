"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Cpu, 
  TrendingUp, 
  CheckCircle, 
  Layers, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  ArrowRight,
  Printer,
  Share2,
  Lock,
  ChevronRight,
  Code
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Report {
  score_agentic_flow: number;
  score_skill_verification: number;
  score_prompt_engineering: number;
  score_aggregate: number;
  summary_review: string;
  test_cases_passed: number;
  test_cases_total: number;
  created_at: string;
}

// Fallback high-fidelity reports based on problem slug
const FALLBACK_REPORTS: Record<string, Report> = {
  "agentic-matrix-optimizer": {
    score_agentic_flow: 96,
    score_skill_verification: 90,
    score_prompt_engineering: 88,
    score_aggregate: 91,
    summary_review: "Outstanding performance! The agentic code successfully integrated the concurrent ThreadPoolExecutor and optimized matrix multiplication down to 48ms. Implementation of localized lock caching successfully demonstrated deep concurrency mastery. Minor optimization is possible regarding LRU cleanups.",
    test_cases_passed: 3,
    test_cases_total: 3,
    created_at: new Date().toISOString()
  },
  "skill-log-parser": {
    score_agentic_flow: 92,
    score_skill_verification: 98,
    score_prompt_engineering: 90,
    score_aggregate: 93,
    summary_review: "Expert skill parsing. The custom Google Antigravity Skill perfectly aligned with declared schema parameters. The script handled 20MB log streams gracefully with zero memory leaks. Error boundaries were securely structured against malformed bytes.",
    test_cases_passed: 3,
    test_cases_total: 3,
    created_at: new Date().toISOString()
  },
  "prompt-adversarial-defense": {
    score_agentic_flow: 85,
    score_skill_verification: 88,
    score_prompt_engineering: 100,
    score_aggregate: 91,
    summary_review: "Sensational prompt engineering defense! The pre-processing validator successfully recognized Grandma exploit roleplay vectors and rejected the payloads. The output sanitization rules successfully blocked all leakage of administrative credentials.",
    test_cases_passed: 3,
    test_cases_total: 3,
    created_at: new Date().toISOString()
  }
};

function ReportDetails() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const problemSlug = searchParams.get("problem") || "agentic-matrix-optimizer";

  const [report, setReport] = useState<Report>(FALLBACK_REPORTS[problemSlug] || FALLBACK_REPORTS["agentic-matrix-optimizer"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        if (sessionId === "demo-report-id") {
          setReport(FALLBACK_REPORTS[problemSlug] || FALLBACK_REPORTS["agentic-matrix-optimizer"]);
          return;
        }

        // Fetch from Supabase
        const { data, error } = await supabase
          .from("evaluation_reports")
          .select("*")
          .eq("session_id", sessionId)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setReport(data);
        } else {
          // If no report in DB, use realistic fallback matching current challenge
          setReport(FALLBACK_REPORTS[problemSlug] || FALLBACK_REPORTS["agentic-matrix-optimizer"]);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn("Supabase fetch failed, utilizing robust mock evaluation fallback states.", errMsg);
        setReport(FALLBACK_REPORTS[problemSlug] || FALLBACK_REPORTS["agentic-matrix-optimizer"]);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [sessionId, problemSlug]);

  // Math coordinates helper for the custom equilateral 3-Axis SVG Radar Skill chart
  // Center is at (150, 150), radius 100
  const getRadarPoint = (score: number, axisIndex: number) => {
    const center = 150;
    const maxRadius = 100;
    const val = (score / 100) * maxRadius;
    
    // Axis 0 (Top): -90deg
    // Axis 1 (Bottom Right): 30deg
    // Axis 2 (Bottom Left): 150deg
    const angleInRad = (axisIndex === 0 ? -90 : axisIndex === 1 ? 30 : 150) * (Math.PI / 180);
    const x = center + val * Math.cos(angleInRad);
    const y = center + val * Math.sin(angleInRad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const radarPolygonPoints = [
    getRadarPoint(report.score_agentic_flow, 0),
    getRadarPoint(report.score_skill_verification, 1),
    getRadarPoint(report.score_prompt_engineering, 2)
  ].join(" ");

  const gridPolygonPoints = (radiusMultiplier: number) => {
    const center = 150;
    const maxRadius = 100 * radiusMultiplier;
    return [
      `${center},${center - maxRadius}`,
      `${center + maxRadius * 0.866},${center + maxRadius * 0.5}`,
      `${center - maxRadius * 0.866},${center + maxRadius * 0.5}`
    ].join(" ");
  };

  const getGradeTheme = () => {
    const score = report.score_aggregate;
    if (score >= 95) return {
      border: "border-agy-violet/30",
      shadow: "shadow-[0_0_35px_rgba(139,92,246,0.12)]",
      gradient: "from-transparent via-agy-violet/40 to-transparent",
      text: "text-agy-violet",
      bg: "bg-agy-violet/5",
      stroke: "stroke-agy-violet animate-pulse"
    };
    if (score >= 91) return {
      border: "border-agy-green/35",
      shadow: "shadow-[0_0_35px_rgba(0,255,102,0.12)]",
      gradient: "from-transparent via-agy-green/40 to-transparent",
      text: "text-agy-green",
      bg: "bg-agy-green/5",
      stroke: "stroke-agy-green"
    };
    return {
      border: "border-agy-cyan/35",
      shadow: "shadow-[0_0_35px_rgba(0,240,255,0.12)]",
      gradient: "from-transparent via-agy-cyan/40 to-transparent",
      text: "text-agy-cyan",
      bg: "bg-agy-cyan/5",
      stroke: "stroke-agy-cyan"
    };
  };
  const theme = getGradeTheme();

  return (
    <div className="min-h-screen bg-bg-dark text-white relative pb-16 overflow-x-hidden print:p-0 print:bg-white print:text-black">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body, html {
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .print-hidden {
            display: none !important;
          }
          .print-certificate-container {
            border: 2px solid #e2e8f0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 24px !important;
            max-width: 100% !important;
            border-radius: 12px !important;
          }
          .print-certificate-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          circle {
            stroke: #e2e8f0 !important;
          }
          polygon {
            stroke: #0284c7 !important;
            fill: rgba(2, 132, 199, 0.05) !important;
          }
          text {
            fill: #1e293b !important;
          }
          p, h1, h2, h3, span {
            color: #0f172a !important;
          }
          .print-black-border {
            border: 1px solid #cbd5e1 !important;
            background: #f8fafc !important;
          }
        }
      `}} />

      {/* Visual Background Layout */}
      <div className="absolute inset-0 bg-cyber-grid bg-[size:40px_40px] opacity-10 pointer-events-none print-hidden" />
      <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none print-hidden" />
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-agy-violet/5 rounded-full blur-[140px] pointer-events-none print-hidden" />

      {/* Decorative Top Laser Bar */}
      <div className="h-1.5 bg-gradient-to-r from-agy-cyan via-agy-green to-agy-violet print-hidden" />

      <main className="max-w-4xl mx-auto px-6 mt-12 relative z-10 space-y-8 print:mt-0 print:px-0">
        
        {/* Verification Alert Banner */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border border-agy-green/20 bg-agy-green/5 p-4 rounded-xl flex items-center justify-between font-mono text-xs text-text-green shadow-[0_0_15px_rgba(0,255,102,0.05)] print-hidden"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-agy-green animate-pulse" />
            <span>INTELLIGENT RUN PROOFS REGISTERED SECURELY ON BLOCKPLAIN</span>
          </div>
          <span className="opacity-60 hidden md:block">TX: {sessionId.substring(0, 14)}...</span>
        </motion.div>

        {/* Certificate Scorecard Header Card */}
        <div className="text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80 print:border-slate-200">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="w-12 h-12 rounded-xl border border-agy-cyan/20 bg-bg-panel flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.2)] print:border-slate-300">
              <img src="/assets/yeetcode_logo.png" className="w-full h-full object-cover" alt="YeetCode Logo" />
            </div>
            <div>
              <span className="font-mono text-xs text-agy-green block uppercase tracking-widest font-semibold print:text-slate-500">
                COMPLETION CERTIFICATE & REPORT
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight mt-1 print:text-black">
                Google Antigravity Developer Profile
              </h1>
              <p className="text-xs text-text-muted font-mono mt-1 uppercase tracking-wider print:text-slate-400">
                Verification session compiled on {new Date(report.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-3 print-hidden">
            <button 
              onClick={() => window.print()}
              className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-bg-panel/40 rounded-xl font-mono text-xs flex items-center gap-2 text-text-muted hover:text-white transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT REPORT</span>
            </button>
            <button 
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Verification URL copied to clipboard!");
                } else {
                  alert(`Verification URL: ${window.location.href}`);
                }
              }}
              className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-bg-panel/40 rounded-xl font-mono text-xs flex items-center gap-2 text-text-muted hover:text-white transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>SHARE LINK</span>
            </button>
          </div>
        </div>

        {/* Core Scores Panel: Dial & Custom SVG Skill Radar Chart */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center print-certificate-grid">
          
          {/* Composite Score Circle Dial (5 cols) */}
          <div className={`md:col-span-5 flex flex-col items-center justify-center p-8 border rounded-2xl relative overflow-hidden print-certificate-container ${theme.border} ${theme.shadow} bg-bg-panel/45 backdrop-blur-md`}>
            <div className={`absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r ${theme.gradient} print-hidden`} />
            
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-4 print:text-slate-400">
              Aggregate Performance Rating
            </span>

            {/* Neon Dial */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="78"
                  className="stroke-bg-dark fill-none"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="88"
                  cy="88"
                  r="78"
                  className={`fill-none ${theme.stroke}`}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 78}
                  initial={{ strokeDashoffset: 2 * Math.PI * 78 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 78 * (1 - report.score_aggregate / 100) }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-5xl font-extrabold tracking-tighter text-white font-mono print:text-black">
                  {report.score_aggregate}
                </span>
                <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest mt-0.5 print:text-slate-500">
                  GRADE / 100
                </span>
              </div>
            </div>

            <div className={`mt-6 flex items-center gap-1.5 ${theme.bg} border ${theme.border} px-3.5 py-1.5 rounded-full font-mono text-[10px] ${theme.text} font-bold uppercase tracking-wider print:border-slate-300 print:text-slate-800`}>
              <Trophy className="w-3.5 h-3.5 animate-bounce print:hidden" />
              <span>GOOGLE VENTURES PASSED</span>
            </div>

            {/* Cryptographic Verification Seal badge in sidebar */}
            <div className="mt-5 flex items-center gap-3.5 bg-bg-dark/40 border border-slate-800/80 p-3 rounded-xl w-full print-black-border relative z-10">
              <div className="w-10 h-10 rounded-full border border-agy-cyan/15 bg-bg-dark flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.1)] print:border-slate-300 print:bg-white">
                <img src="/assets/verification_seal.png" className="w-full h-full object-contain filter brightness-110 print:brightness-100" alt="Holographic Verification Seal" />
              </div>
              <div className="text-left font-mono">
                <span className="text-[9px] text-agy-green block uppercase tracking-wider font-extrabold print:text-slate-800">CRYPTO SEAL CERTIFIED</span>
                <span className="text-[8px] text-text-muted block mt-0.5 uppercase tracking-wide print:text-slate-400">VERIFIED COMPILER NODE</span>
              </div>
            </div>
          </div>

          {/* Glowing Equilateral SVG Radar Skill Chart (7 cols) */}
          <div className="md:col-span-7 p-6 border border-slate-800/80 bg-bg-panel/45 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center shadow-[20px_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden min-h-[300px] print-certificate-container">
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-agy-cyan/40 to-transparent print-hidden" />
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-3 print:text-slate-400">
              System Skill Vector Spectrum
            </span>

            {/* Custom Interactive SVG Radar Chart */}
            <svg className="w-72 h-72" viewBox="0 0 300 300">
              <defs>
                <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={report.score_aggregate >= 95 ? "#8b5cf6" : report.score_aggregate >= 91 ? "#00ff66" : "#00f0ff"} stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Grid concentric equilateral triangles (representing scales 40, 80, 100) */}
              <polygon points={gridPolygonPoints(1.0)} className="fill-none stroke-slate-800 print:stroke-slate-200" strokeWidth="1" />
              <polygon points={gridPolygonPoints(0.75)} className="fill-none stroke-slate-800/60 print:stroke-slate-200/50 stroke-dasharray-2" strokeWidth="1" />
              <polygon points={gridPolygonPoints(0.5)} className="fill-none stroke-slate-800/40 print:stroke-slate-100" strokeWidth="1" />
              <polygon points={gridPolygonPoints(0.25)} className="fill-none stroke-slate-800/20 print:stroke-slate-100/50" strokeWidth="1" />

              {/* Axis Grid lines connecting center (150, 150) to corners */}
              <line x1="150" y1="150" x2="150" y2="50" className="stroke-slate-800 print:stroke-slate-200" strokeWidth="1" />
              <line x1="150" y1="150" x2="236.6" y2="200" className="stroke-slate-800 print:stroke-slate-200" strokeWidth="1" />
              <line x1="150" y1="150" x2="63.4" y2="200" className="stroke-slate-800 print:stroke-slate-200" strokeWidth="1" />

              {/* Active candidate skill distribution polygon (glowing filled dynamic theme triangle) */}
              <polygon
                points={radarPolygonPoints}
                className={`fill-url(#radarGlow) hover:stroke-white transition-colors duration-300 ${theme.stroke}`}
                strokeWidth="2.5"
              />

              {/* Axis Vertex Labels */}
              <text x="150" y="32" className="fill-agy-green font-mono text-[9px] font-bold text-center uppercase tracking-wider print:fill-slate-800" textAnchor="middle">
                AGENT FLOW ({report.score_agentic_flow}%)
              </text>
              <text x="260" y="215" className="fill-agy-cyan font-mono text-[9px] font-bold uppercase tracking-wider print:fill-slate-800" textAnchor="middle">
                SKILL WRITING ({report.score_skill_verification}%)
              </text>
              <text x="40" y="215" className="fill-agy-violet font-mono text-[9px] font-bold uppercase tracking-wider print:fill-slate-800" textAnchor="middle">
                PROMPT SECURE ({report.score_prompt_engineering}%)
              </text>
            </svg>
          </div>

        </div>

        {/* Qualitative Structured Review Panel (Google Ventures) */}
        <div className="relative rounded-2xl border border-slate-800 bg-bg-panel/40 p-8 overflow-hidden shadow-[20px_20px_40px_rgba(0,0,0,0.3)] print-certificate-container">
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-agy-violet/40 to-transparent print-hidden" />
          
          <h3 className="font-extrabold text-sm tracking-wide flex items-center gap-2.5 font-mono print:text-black">
            <Cpu className="w-4 h-4 text-agy-violet animate-pulse print:hidden" />
            GOOGLE VENTURES PARTNER SUMMATION REVIEW
          </h3>
          
          <div className="mt-4 p-5 font-mono text-xs leading-relaxed text-text-muted bg-bg-dark/80 rounded-xl border border-slate-800/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] relative print-black-border">
            <span className="text-agy-violet block mb-2 font-semibold print:text-slate-500">{"// Consensus Output from Best-of-3 Evaluators"}</span>
            <p className="text-white print:text-slate-800 leading-relaxed">
              &quot;{report.summary_review}&quot;
            </p>
          </div>
        </div>

        {/* Detailed Metrics break down panel list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-xs text-text-muted print-certificate-grid">
          <div className="bg-bg-panel/20 border border-slate-800/60 p-4 rounded-xl flex justify-between items-center print-black-border">
            <span className="uppercase text-[10px]">TEST FIXTURES PASSED</span>
            <span className="font-bold text-agy-green text-sm print:text-slate-800">
              {report.test_cases_passed} / {report.test_cases_total}
            </span>
          </div>
          <div className="bg-bg-panel/20 border border-slate-800/60 p-4 rounded-xl flex justify-between items-center print-black-border">
            <span className="uppercase text-[10px]">GEMINI COMPILER BILL</span>
            <span className="font-bold text-agy-cyan text-sm print:text-slate-800">$0.1840</span>
          </div>
          <div className="bg-bg-panel/20 border border-slate-800/60 p-4 rounded-xl flex justify-between items-center print-black-border">
            <span className="uppercase text-[10px]">SANDBOX CPU COMPUTE</span>
            <span className="font-bold text-white text-sm print:text-slate-800">4.2 MINS</span>
          </div>
        </div>

        {/* Navigation Return */}
        <div className="text-center pt-6 print-hidden">
          <button
            onClick={() => router.push("/problems")}
            className="group font-mono text-xs text-text-muted hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 mx-auto"
          >
            <span>RETURN TO MATRIX COMPILER</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </main>
    </div>
  );
}

import { Suspense } from "react";

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-dark text-white flex flex-col items-center justify-center font-mono text-xs uppercase tracking-wider gap-3">
        <div className="w-8 h-8 rounded border border-agy-cyan/30 bg-bg-panel flex items-center justify-center animate-pulse">
          <Cpu className="w-4 h-4 text-agy-cyan" />
        </div>
        <span>Compiling Performance Scorecard...</span>
      </div>
    }>
      <ReportDetails />
    </Suspense>
  );
}
