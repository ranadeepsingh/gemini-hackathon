"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  Cpu, 
  Play, 
  Zap, 
  ShieldAlert, 
  Layers, 
  FileCode, 
  CheckCircle, 
  Sparkles
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"agentic" | "skill" | "prompt">("agentic");
  const [heroView, setHeroView] = useState<"simulation" | "cockpit">("simulation");
  const [simulatedMetrics, setSimulatedMetrics] = useState({
    activeVMs: 4,
    totalTokens: 14205020,
    costSaved: 1240.25,
    sessionsCompleted: 1432,
    geminiLatency: 2.1
  });

  // Dynamic simulation of metrics tick
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedMetrics(prev => ({
        activeVMs: Math.floor(Math.random() * 4) + 3,
        totalTokens: prev.totalTokens + Math.floor(Math.random() * 4000) + 1000,
        costSaved: Number((prev.costSaved + (Math.random() * 0.12)).toFixed(2)),
        sessionsCompleted: prev.sessionsCompleted + (Math.random() > 0.8 ? 1 : 0),
        geminiLatency: Number((2.0 + Math.random() * 0.4).toFixed(2))
      }));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-bg-dark text-text-main overflow-hidden scanline grid-overlay">
      
      {/* Decorative moving laser scan line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-agy-cyan opacity-40 shadow-[0_0_10px_#00f0ff] moving-scan z-10 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 w-full z-40 bg-bg-dark/80 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-bg-panel border border-agy-cyan/20 overflow-hidden shadow-[0_0_10px_rgba(0,240,255,0.15)]">
              <img src="/assets/yeetcode_logo.png" className="w-full h-full object-cover" alt="YeetCode Logo" />
            </div>
            <span className="font-mono text-xl font-extrabold tracking-widest text-text-main">
              YEET<span className="text-agy-green glow-text-green">CODE</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-2 text-xs font-mono text-text-muted bg-bg-panel/60 px-3 py-1.5 rounded-full border border-border-subtle">
              <span className="w-2 h-2 rounded-full bg-agy-green animate-ping" />
              GCP WEST1: ACTIVE
            </span>
            <Link 
              href="/login"
              className="px-4 py-1.5 rounded-md border border-border-subtle text-sm font-mono text-text-main hover:bg-bg-panel transition-all"
            >
              Sign In
            </Link>
            <Link 
              href="/workspace"
              className="glow-btn bg-agy-cyan text-bg-dark px-4 py-1.5 rounded-md text-sm font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Demo Run
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 relative z-20">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 bg-agy-violet/10 text-agy-violet px-3 py-1 rounded-full text-xs font-mono border border-agy-violet/20 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-agy-violet" />
              NEXT-GEN INTERVIEW LAB
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
              Evaluate AI-Native Engineers with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-agy-cyan via-agy-green to-agy-violet">
                Autonomous Agents
              </span>
            </h1>

            <p className="text-text-muted text-lg leading-relaxed max-w-xl">
              YeetCode is the futuristic platform built on GCP Compute Engine to test human-agent pair programming. Provision full sandboxed developer environments, track reasoning token telemetry, and run Gemini 3.5 multi-agent evaluations instantly.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link 
                href="/workspace"
                className="bg-agy-green text-bg-dark px-6 py-3 rounded-lg font-mono font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,102,0.5)] transition-all"
              >
                <Terminal className="w-4 h-4" />
                Launch Sandbox Workspace
              </Link>
              <Link 
                href="/problems"
                className="bg-bg-panel/80 hover:bg-bg-panel border border-border-subtle hover:border-agy-cyan/50 px-6 py-3 rounded-lg font-mono text-text-main flex items-center gap-2 transition-all"
              >
                <Layers className="w-4 h-4" />
                Browse Problem Suite
              </Link>
            </div>

            {/* Quick telemetry indicators */}
            <div className="grid grid-cols-3 gap-4 border-t border-border-subtle pt-8 mt-4">
              <div>
                <div className="font-mono text-2xl font-bold text-agy-cyan glow-text-cyan">
                  {simulatedMetrics.activeVMs}
                </div>
                <div className="text-xs text-text-muted font-mono uppercase tracking-wider mt-1">GCE Warm Pools</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-agy-green glow-text-green">
                  {simulatedMetrics.totalTokens.toLocaleString()}
                </div>
                <div className="text-xs text-text-muted font-mono uppercase tracking-wider mt-1">Tokens Parsed</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-agy-violet">
                  ${simulatedMetrics.costSaved.toFixed(2)}
                </div>
                <div className="text-xs text-text-muted font-mono uppercase tracking-wider mt-1">Est. Cost Savings</div>
              </div>
            </div>
          </div>

          {/* Hero Right Visuals (Futuristic Sandbox Console Panel with Toggle) */}
          <div className="lg:col-span-6 flex flex-col">
            
            {/* Sliding Toggle Selector */}
            <div className="flex justify-end gap-2 mb-4 font-mono text-[10px] bg-bg-panel/40 p-1 rounded-lg border border-border-subtle w-fit ml-auto shadow-[0_0_15px_rgba(0,0,0,0.4)]">
              <button
                onClick={() => setHeroView("simulation")}
                className={`px-3 py-1.5 rounded-md transition-all font-bold cursor-pointer ${heroView === "simulation" ? "bg-agy-cyan text-bg-dark font-extrabold shadow-[0_0_10px_rgba(0,240,255,0.3)]" : "text-text-muted hover:text-white"}`}
              >
                LIVE SIMULATION
              </button>
              <button
                onClick={() => setHeroView("cockpit")}
                className={`px-3 py-1.5 rounded-md transition-all font-bold cursor-pointer ${heroView === "cockpit" ? "bg-agy-cyan text-bg-dark font-extrabold shadow-[0_0_10px_rgba(0,240,255,0.3)]" : "text-text-muted hover:text-white"}`}
              >
                VIRTUAL COCKPIT
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-agy-cyan/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="absolute inset-0 bg-agy-violet/5 blur-[120px] rounded-full pointer-events-none" />
              
              <div className="relative rounded-xl border border-border-subtle/80 bg-bg-panel/90 p-1 overflow-hidden glow-cyan">
                
                {/* Fake Chrome Bar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle/50 bg-bg-dark/80 rounded-t-lg">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="text-[10px] font-mono text-text-muted flex items-center gap-1 bg-bg-panel px-3 py-0.5 rounded border border-border-subtle/30">
                    <span className="w-1.5 h-1.5 bg-agy-cyan rounded-full animate-ping" />
                    {heroView === "simulation" ? "session_matrix_simulator.py" : "command_cockpit_hud.sys"}
                  </div>
                  <div className="w-8" />
                </div>

                <AnimatePresence mode="wait">
                  {heroView === "simulation" ? (
                    <motion.div
                      key="simulation"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="p-5 font-mono text-xs text-text-muted bg-bg-dark/95 min-h-[340px] flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-agy-green">{"// Initializing Google Antigravity Agent Observer..."}</div>
                        <div className="text-text-main mt-1">import google.antigravity as agy</div>
                        <div className="text-text-main">import gemini_evaluator as judge</div>
                        <div className="text-agy-violet mt-3">async def evaluate_candidate(diff, logs):</div>
                        <div className="pl-4 text-text-main mt-0.5">agent_telemetry = agy.get_observability_hooks()</div>
                        <div className="pl-4 text-text-green">assert agent_telemetry.thoughts_token_count &gt; 0</div>
                        <div className="pl-4 text-agy-cyan">judge_report = await judge.trigger_consensus_of_3(</div>
                        <div className="pl-8 text-text-muted">model=&quot;gemini-3.5-flash&quot;,</div>
                        <div className="pl-8 text-text-muted">thinking_level=&quot;medium&quot;</div>
                        <div className="pl-4 text-agy-cyan">)</div>
                        <div className="pl-4 text-agy-green">return judge_report.aggregate_median_score()</div>
                      </div>

                      <div className="border-t border-border-subtle/50 pt-4 mt-6">
                        <div className="flex justify-between items-center text-xs font-mono mb-2">
                          <span className="text-agy-cyan flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 animate-pulse" />
                            SYS.MONITOR
                          </span>
                          <span className="text-agy-green">ONLINE</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                          <div className="bg-bg-panel/80 p-2.5 rounded border border-border-subtle/50 flex flex-col justify-between">
                            <span className="text-text-muted">GEMINI PROMPT SENT</span>
                            <span className="text-text-main text-sm font-bold mt-1">100% OK</span>
                          </div>
                          <div className="bg-bg-panel/80 p-2.5 rounded border border-border-subtle/50 flex flex-col justify-between">
                            <span className="text-text-muted">JUDGE LATENCY</span>
                            <span className="text-agy-violet text-sm font-bold mt-1">{simulatedMetrics.geminiLatency}s</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="cockpit"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="relative min-h-[340px] bg-bg-dark/95 flex flex-col justify-between overflow-hidden"
                    >
                      <div className="absolute inset-0 opacity-45">
                        <img src="/assets/hero_graphic.png" className="w-full h-full object-cover" alt="Virtual Cockpit" />
                      </div>
                      
                      {/* Decorative Scanline Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-transparent pointer-events-none" />
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-agy-cyan opacity-40 shadow-[0_0_8px_#00f0ff] moving-scan pointer-events-none" />
                      
                      {/* High Tech overlay stats */}
                      <div className="relative z-10 p-5 flex flex-col justify-between h-full min-h-[340px]">
                        <div className="space-y-1 bg-bg-dark/85 backdrop-blur-sm p-3 rounded-lg border border-agy-cyan/25 w-fit shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                          <div className="text-[10px] font-mono text-agy-cyan flex items-center gap-1.5 font-bold">
                            <span className="w-2 h-2 rounded-full bg-agy-cyan animate-pulse" />
                            CORE CHASSIS: AGY-COCKPIT-01
                          </div>
                          <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider">COORDINATES: GCP-US-WEST1-B</div>
                          <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider">SECURITY PROTOCOL: SHIELD MATRIX ACTIVE</div>
                        </div>

                        <div className="bg-bg-dark/90 backdrop-blur-sm p-4 rounded-lg border border-border-subtle/50 mt-auto shadow-[0_-4px_15px_rgba(0,0,0,0.5)]">
                          <div className="flex justify-between items-center text-xs font-mono mb-2">
                            <span className="text-agy-cyan flex items-center gap-1.5 font-bold">
                              <Cpu className="w-3.5 h-3.5 animate-pulse text-agy-cyan" />
                              SYS.CHAMBER
                            </span>
                            <span className="text-agy-green font-bold">OPTIMIZED</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-[10px]">
                            <div className="bg-bg-panel/80 p-2.5 rounded border border-border-subtle/50">
                              <span className="text-text-muted block text-[8px] uppercase tracking-wider">GCP WARM VM POOLS</span>
                              <span className="text-text-main text-xs font-bold mt-1 block font-mono">240,000 BUFFERS</span>
                            </div>
                            <div className="bg-bg-panel/80 p-2.5 rounded border border-border-subtle/50">
                              <span className="text-text-muted block text-[8px] uppercase tracking-wider">SANDBOX ENGINE</span>
                              <span className="text-agy-green text-xs font-bold mt-1 block font-mono">DOCKER-GCE-READY</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>

        {/* Tabbed Interactive Section (Deep Dive into the 3 Interview Modes) */}
        <section className="mt-32">
          <div className="text-center flex flex-col items-center gap-3 mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight">Three Advanced Interview Channels</h2>
            <p className="text-text-muted max-w-lg">
              Targeted sandboxes and automated evaluations designed to test exact capabilities.
            </p>
          </div>

          {/* Selector Tabs */}
          <div className="flex justify-center border-b border-border-subtle mb-8 max-w-2xl mx-auto">
            <button 
              onClick={() => setActiveTab("agentic")}
              className={`flex-1 pb-4 text-sm font-mono font-bold tracking-wider uppercase border-b-2 transition-all ${activeTab === "agentic" ? "border-agy-cyan text-agy-cyan glow-text-cyan" : "border-transparent text-text-muted hover:text-text-main"}`}
            >
              Agentic Engineering
            </button>
            <button 
              onClick={() => setActiveTab("skill")}
              className={`flex-1 pb-4 text-sm font-mono font-bold tracking-wider uppercase border-b-2 transition-all ${activeTab === "skill" ? "border-agy-green text-agy-green glow-text-green" : "border-transparent text-text-muted hover:text-text-main"}`}
            >
              Skill Architecting
            </button>
            <button 
              onClick={() => setActiveTab("prompt")}
              className={`flex-1 pb-4 text-sm font-mono font-bold tracking-wider uppercase border-b-2 transition-all ${activeTab === "prompt" ? "border-agy-violet text-agy-violet" : "border-transparent text-text-muted hover:text-text-main"}`}
            >
              Prompt Verification
            </button>
          </div>

          {/* Mode Card Grid display */}
          <div className="grid md:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
            
            {activeTab === "agentic" && (
              <>
                <div className="md:col-span-7 bg-bg-panel/60 border border-border-subtle p-8 rounded-xl flex flex-col gap-6 justify-between">
                  <div className="flex flex-col gap-3">
                    <div className="w-12 h-12 rounded-lg bg-agy-cyan/10 flex items-center justify-center border border-agy-cyan/30 text-agy-cyan">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold font-mono">Agentic Engineering Interview</h3>
                    <p className="text-text-muted leading-relaxed">
                      Evaluate candidates as they operate side-by-side with an Antigravity agent in a custom container workspace. Telemetry records all interaction commands, files modified, tool-calling decisions, and token costs incurred during compilation.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 bg-bg-dark/80 p-4 rounded-lg border border-border-subtle/50">
                    <span className="text-xs font-mono text-agy-cyan font-bold">MEASURED TELEMETRY</span>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono mt-1 text-text-muted">
                      <div>• thoughts_token</div>
                      <div>• total_cost</div>
                      <div>• run_tests</div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-5 bg-gradient-to-br from-agy-cyan/10 via-bg-panel/90 to-bg-panel border border-agy-cyan/20 p-8 rounded-xl flex flex-col justify-between">
                  <div className="flex flex-col gap-4">
                    <span className="text-xs font-mono text-agy-cyan tracking-widest font-extrabold uppercase bg-agy-cyan/10 px-3 py-1 rounded w-fit border border-agy-cyan/20">AGENT METRICS</span>
                    <h4 className="text-2xl font-extrabold">Evaluating tool selection & planning capability.</h4>
                  </div>
                  <div className="flex flex-col gap-3 border-t border-border-subtle pt-6">
                    <div className="flex items-center gap-2.5 text-xs text-text-muted">
                      <CheckCircle className="w-4 h-4 text-agy-green" />
                      Parallel execution tracking via GCP instances
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-text-muted">
                      <CheckCircle className="w-4 h-4 text-agy-green" />
                      Dynamic token metrics streaming
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "skill" && (
              <>
                <div className="md:col-span-7 bg-bg-panel/60 border border-border-subtle p-8 rounded-xl flex flex-col gap-6 justify-between">
                  <div className="flex flex-col gap-3">
                    <div className="w-12 h-12 rounded-lg bg-agy-green/10 flex items-center justify-center border border-agy-green/30 text-agy-green">
                      <FileCode className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold font-mono">AI Skill Writing Interview</h3>
                    <p className="text-text-muted leading-relaxed">
                      Evaluate candidates on their ability to build robust, structured custom instructions (skills) using standard Google Antigravity SDK templates. Our automated orchestrator executes candidate skill assertions against 15+ complex hidden mock files and environments.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 bg-bg-dark/80 p-4 rounded-lg border border-border-subtle/50">
                    <span className="text-xs font-mono text-agy-green font-bold">ASSERTION CATEGORIES</span>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono mt-1 text-text-muted">
                      <div>• permission_limits</div>
                      <div>• edge_fixtures</div>
                      <div>• prompt_injection</div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-5 bg-gradient-to-br from-agy-green/10 via-bg-panel/90 to-bg-panel border border-agy-green/20 p-8 rounded-xl flex flex-col justify-between">
                  <div className="flex flex-col gap-4">
                    <span className="text-xs font-mono text-agy-green tracking-widest font-extrabold uppercase bg-agy-green/10 px-3 py-1 rounded w-fit border border-agy-green/20">ROBUST FIXTURES</span>
                    <h4 className="text-2xl font-extrabold">Evaluating instruction clarity and scope constraints.</h4>
                  </div>
                  <div className="flex flex-col gap-3 border-t border-border-subtle pt-6">
                    <div className="flex items-center gap-2.5 text-xs text-text-muted">
                      <CheckCircle className="w-4 h-4 text-agy-green" />
                      Dynamic GCP sandbox test injection
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-text-muted">
                      <CheckCircle className="w-4 h-4 text-agy-green" />
                      Overfitting resistance rating
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "prompt" && (
              <>
                <div className="md:col-span-7 bg-bg-panel/60 border border-border-subtle p-8 rounded-xl flex flex-col gap-6 justify-between">
                  <div className="flex flex-col gap-3">
                    <div className="w-12 h-12 rounded-lg bg-agy-violet/10 flex items-center justify-center border border-agy-violet/30 text-agy-violet">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold font-mono">Prompt Engineering Interview</h3>
                    <p className="text-text-muted leading-relaxed">
                      Present prompt packages to adversarial mock inputs. Evaluate output compliance against strict JSON schema asserts, defense rating matrices, formatting compliance, and resistance to jailbreak overrides.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 bg-bg-dark/80 p-4 rounded-lg border border-border-subtle/50">
                    <span className="text-xs font-mono text-agy-violet font-bold">VALIDATION CHECKS</span>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono mt-1 text-text-muted">
                      <div>• prompt_inject_def</div>
                      <div>• schema_matches</div>
                      <div>• concision_ratio</div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-5 bg-gradient-to-br from-agy-violet/10 via-bg-panel/90 to-bg-panel border border-agy-violet/20 p-8 rounded-xl flex flex-col justify-between">
                  <div className="flex flex-col gap-4">
                    <span className="text-xs font-mono text-agy-violet tracking-widest font-extrabold uppercase bg-agy-violet/10 px-3 py-1 rounded w-fit border border-agy-violet/20">DEFENSE METRIC</span>
                    <h4 className="text-2xl font-extrabold">Evaluating instruction following under adversarial load.</h4>
                  </div>
                  <div className="flex flex-col gap-3 border-t border-border-subtle pt-6">
                    <div className="flex items-center gap-2.5 text-xs text-text-muted">
                      <CheckCircle className="w-4 h-4 text-agy-violet" />
                      Gemini 3.5 adversarial cases
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-text-muted">
                      <CheckCircle className="w-4 h-4 text-agy-violet" />
                      Structured schema verification Rate
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-12 bg-bg-dark mt-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-sm tracking-widest text-text-muted">
              YEET<span className="text-text-main">CODE</span> SYSTEM
            </span>
          </div>
          <span className="text-xs text-text-muted font-mono">
            &copy; 2026 Google Hackathon. Targeted for Google Ventures review.
          </span>
        </div>
      </footer>

    </div>
  );
}
