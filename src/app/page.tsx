"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  Cpu, 
  Play, 
  ShieldAlert, 
  Layers, 
  FileCode, 
  CheckCircle, 
  Sparkles,
  MessageSquareQuote,
  ExternalLink,
  BadgeCheck,
  BrainCircuit,
  ShieldCheck,
  Lock,
  FileJson,
  Coins,
  CircleDollarSign,
  Activity
} from "lucide-react";
import AntigravityCatToggle from "@/components/AntigravityCatToggle";
import AuthAwareHomeLink from "@/components/AuthAwareHomeLink";
import MouseSpotlight from "@/components/MouseSpotlight";

const aiPerspectiveCards = [
  {
    name: "Andrej Karpathy",
    role: "AI researcher, OpenAI co-founder",
    quote: "The hottest new programming language is English",
    takeaway: "Natural-language precision is becoming a core engineering surface, not a soft skill.",
    image: "/assets/ai-voices/andrej-karpathy.png",
    quoteSource: "https://quoteinvestigator.com/2024/10/20/hottest-program/",
    quoteSourceLabel: "Quote Investigator",
    photoSource: "https://commons.wikimedia.org/wiki/File:Andrej_Karpathy,_OpenAI_(cropped).png",
    photoCredit: "Gladwin Analytics, CC BY 3.0",
    accent: {
      panel: "hover:border-agy-cyan/50",
      glow: "from-agy-cyan/20",
      badge: "border-agy-cyan/25 bg-agy-cyan/10 text-agy-cyan",
      icon: "text-agy-cyan",
      image: "border-agy-cyan/30 shadow-[0_0_18px_rgba(0,240,255,0.18)]"
    }
  },
  {
    name: "Jensen Huang",
    role: "Founder and CEO, NVIDIA",
    quote: "the programming language is human: everybody in the world is now a programmer",
    takeaway: "Prompt fluency changes who can command compute, so interviews need to measure intent, judgment, and verification.",
    image: "/assets/ai-voices/jensen-huang.jpg",
    quoteSource: "https://blogs.nvidia.com/blog/world-governments-summit/",
    quoteSourceLabel: "NVIDIA Blog",
    photoSource: "https://commons.wikimedia.org/wiki/File:Jensen_Huang_20231109.jpg",
    photoCredit: "Taiwan Presidential Office, CC BY 2.0",
    accent: {
      panel: "hover:border-agy-green/50",
      glow: "from-agy-green/20",
      badge: "border-agy-green/25 bg-agy-green/10 text-agy-green",
      icon: "text-agy-green",
      image: "border-agy-green/30 shadow-[0_0_18px_rgba(0,255,102,0.16)]"
    }
  },
  {
    name: "Demis Hassabis",
    role: "CEO and co-founder, Google DeepMind",
    quote: "AI systems and AI algorithms are quite a good match, a good description language, for biology.",
    takeaway: "The next engineering bar is translating messy domains into descriptions that models can execute and humans can audit.",
    image: "/assets/ai-voices/demis-hassabis.jpg",
    quoteSource: "https://www.nobelprize.org/prizes/chemistry/2024/hassabis/1924974-transcript-from-an-interview-with-demis-hassabis/",
    quoteSourceLabel: "Nobel Prize interview",
    photoSource: "https://commons.wikimedia.org/wiki/File:Demis_Hassabis_Royal_Society_(3x4_cropped).jpg",
    photoCredit: "Duncan.Hull, CC BY-SA 4.0",
    accent: {
      panel: "hover:border-agy-violet/50",
      glow: "from-agy-violet/20",
      badge: "border-agy-violet/25 bg-agy-violet/10 text-agy-violet",
      icon: "text-agy-violet",
      image: "border-agy-violet/30 shadow-[0_0_18px_rgba(139,92,246,0.2)]"
    }
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"agentic" | "skill" | "prompt">("agentic");
  const [heroView, setHeroView] = useState<"prompt" | "agent">("prompt");
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
      <MouseSpotlight />
      
      {/* Decorative moving laser scan line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-agy-cyan opacity-40 shadow-[0_0_10px_#00f0ff] moving-scan z-10 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 w-full z-40 bg-bg-dark/80 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <AuthAwareHomeLink ariaLabel="AntiCode home or dashboard" className="flex items-center gap-3 rounded-md transition-opacity hover:opacity-90">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-bg-panel border border-agy-cyan/20 overflow-hidden shadow-[0_0_10px_rgba(0,240,255,0.15)]">
              <img src="/assets/anticode_logo.svg" className="w-full h-full object-cover" alt="AntiCode Logo" />
            </div>
            <span className="font-mono text-xl font-extrabold tracking-widest text-text-main">
              ANTI<span className="text-agy-green glow-text-green">CODE</span>
            </span>
          </AuthAwareHomeLink>
          <div className="flex items-center gap-4">
            <AntigravityCatToggle />
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
              AntiCode is the futuristic platform built on GCP Compute Engine to test human-agent pair programming. Provision full sandboxed developer environments, track reasoning token telemetry, and run Gemini 3.5 multi-agent evaluations instantly.
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
                type="button"
                aria-pressed={heroView === "prompt"}
                onClick={() => setHeroView("prompt")}
                className={`px-3 py-1.5 rounded-md transition-all font-bold cursor-pointer ${heroView === "prompt" ? "bg-agy-cyan text-bg-dark font-extrabold shadow-[0_0_10px_rgba(0,240,255,0.3)]" : "text-text-muted hover:text-white"}`}
              >
                PROMPT EVALUATION
              </button>
              <button
                type="button"
                aria-pressed={heroView === "agent"}
                onClick={() => setHeroView("agent")}
                className={`px-3 py-1.5 rounded-md transition-all font-bold cursor-pointer ${heroView === "agent" ? "bg-agy-cyan text-bg-dark font-extrabold shadow-[0_0_10px_rgba(0,240,255,0.3)]" : "text-text-muted hover:text-white"}`}
              >
                AGENT EVALUATION
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
                    {heroView === "prompt" ? "prompt_redteam_evaluator.py" : "agentic_flow_monitor.sys"}
                  </div>
                  <div className="w-8" />
                </div>

                <AnimatePresence mode="wait">
                  {heroView === "prompt" ? (
                    <motion.div
                      key="prompt"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="p-5 font-mono text-xs text-text-muted bg-bg-dark/95 min-h-[340px] flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
                          <span className="text-agy-cyan font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                            <ShieldAlert className="w-3.5 h-3.5 animate-pulse text-agy-cyan" />
                            [RED-TEAM PROMPT INTERVIEW PROFILE]
                          </span>
                          <span className="bg-agy-violet/20 border border-agy-violet/40 text-agy-violet px-2 py-0.5 rounded text-[10px] font-bold">
                            PROMPT SCORE: 96/100
                          </span>
                        </div>

                        {/* Metrics bar list */}
                        <div className="space-y-3 pt-1">
                          {/* Metric 1 */}
                          <div>
                            <div className="flex justify-between items-center text-[10px] mb-1">
                              <span className="text-text-main flex items-center gap-1.5 font-bold">
                                <ShieldCheck className="w-3.5 h-3.5 text-agy-green" />
                                JAILBREAK DEFENSE RATE
                              </span>
                              <span className="text-agy-green font-bold">98.4%</span>
                            </div>
                            <div className="w-full h-1.5 bg-bg-panel rounded-full overflow-hidden border border-border-subtle/40">
                              <div className="h-full bg-agy-green shadow-[0_0_8px_#00ff66]" style={{ width: "98.4%" }} />
                            </div>
                          </div>

                          {/* Metric 2 */}
                          <div>
                            <div className="flex justify-between items-center text-[10px] mb-1">
                              <span className="text-text-main flex items-center gap-1.5 font-bold">
                                <Lock className="w-3.5 h-3.5 text-agy-green" />
                                HIPAA PII / SSN REDACTION
                              </span>
                              <span className="text-agy-green font-bold">100.0%</span>
                            </div>
                            <div className="w-full h-1.5 bg-bg-panel rounded-full overflow-hidden border border-border-subtle/40">
                              <div className="h-full bg-agy-green shadow-[0_0_8px_#00ff66]" style={{ width: "100%" }} />
                            </div>
                          </div>

                          {/* Metric 3 */}
                          <div>
                            <div className="flex justify-between items-center text-[10px] mb-1">
                              <span className="text-text-main flex items-center gap-1.5 font-bold">
                                <FileJson className="w-3.5 h-3.5 text-agy-cyan" />
                                SCHEMA CONFORMANCE
                              </span>
                              <span className="text-agy-cyan font-bold">92.0%</span>
                            </div>
                            <div className="w-full h-1.5 bg-bg-panel rounded-full overflow-hidden border border-border-subtle/40">
                              <div className="h-full bg-agy-cyan shadow-[0_0_8px_#00f0ff]" style={{ width: "92%" }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Technical review block */}
                      <div className="border-t border-border-subtle/50 pt-4 mt-4 bg-bg-panel/20 p-3 rounded-lg border border-border-subtle/40">
                        <div className="text-[9px] uppercase tracking-wider text-text-muted font-bold mb-1">TECHNICAL JUDGE REVIEW</div>
                        <p className="text-[11px] leading-relaxed text-text-main italic">
                          &quot;Defensive system instructions in <span className="text-agy-cyan font-mono font-semibold">clinical_notes.md</span> successfully neutralized roleplay bypass attacks. SSN and HIPAA leak vectors were blocked cleanly via regex pre-filters.&quot;
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="agent"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="p-5 font-mono text-xs text-text-muted bg-bg-dark/95 min-h-[340px] flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
                          <span className="text-agy-green font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                            <Cpu className="w-3.5 h-3.5 animate-pulse text-agy-green" />
                            [REAL-TIME AGENT TELEMETRY PROFILE]
                          </span>
                          <span className="bg-agy-green/20 border border-agy-green/40 text-agy-green px-2 py-0.5 rounded text-[10px] font-bold">
                            AGENT SCORE: 94/100
                          </span>
                        </div>

                        {/* Real-time Tickers Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="bg-bg-panel/60 p-3 rounded border border-border-subtle/50 flex flex-col justify-between">
                            <div className="text-[9px] uppercase tracking-wider text-text-muted">ATTEMPT TRIES</div>
                            <span className="text-agy-green text-sm font-extrabold mt-1 font-mono flex items-center gap-1">
                              3 Tries
                              <span className="text-[8px] text-text-muted font-normal uppercase">(Target: &lt;5)</span>
                            </span>
                          </div>

                          <div className="bg-bg-panel/60 p-3 rounded border border-border-subtle/50 flex flex-col justify-between">
                            <div className="text-[9px] uppercase tracking-wider text-text-muted">TOKENS CONSUMED</div>
                            <span className="text-agy-violet text-sm font-extrabold mt-1 font-mono flex items-center gap-1">
                              145.2K
                              <span className="text-[8px] text-text-muted font-normal uppercase">(Context Vol)</span>
                            </span>
                          </div>

                          <div className="bg-bg-panel/60 p-3 rounded border border-border-subtle/50 flex flex-col justify-between">
                            <div className="text-[9px] uppercase tracking-wider text-text-muted">PROCESS RUN COST</div>
                            <span className="text-agy-violet text-sm font-extrabold mt-1 font-mono flex items-center gap-1">
                              $0.0224
                              <span className="text-[8px] text-text-muted font-normal uppercase">(USD Scale)</span>
                            </span>
                          </div>

                          <div className="bg-bg-panel/60 p-3 rounded border border-border-subtle/50 flex flex-col justify-between">
                            <div className="text-[9px] uppercase tracking-wider text-text-muted">MUTEX LOCK RATE</div>
                            <span className="text-agy-green text-sm font-extrabold mt-1 font-mono flex items-center gap-1">
                              95.0%
                              <span className="text-[8px] text-text-muted font-normal uppercase">(Race Def)</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Technical review block */}
                      <div className="border-t border-border-subtle/50 pt-4 mt-4 bg-bg-panel/20 p-3 rounded-lg border border-border-subtle/40">
                        <div className="text-[9px] uppercase tracking-wider text-text-muted font-bold mb-1">AGENCY CONCORDANCE REPORT</div>
                        <p className="text-[11px] leading-relaxed text-text-main italic">
                          &quot;Candidate directed the Antigravity agent to implement localized locking and concurrent dot-products. Resolvers successfully resolved semver conflicts within 3 loops.&quot;
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>

        {/* Grounded voices behind the shift to natural-language programming */}
        <section className="mt-28">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-agy-cyan/10 text-agy-cyan px-3 py-1 rounded-full text-xs font-mono border border-agy-cyan/20 w-fit mb-4">
                <BrainCircuit className="w-3.5 h-3.5" />
                VERIFIED AI LEADER SIGNALS
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                English is becoming the new command layer.
              </h2>
              <p className="text-text-muted leading-relaxed mt-3">
                The platform tests what these quotes point toward: clear prompts, reliable agent steering, and evidence-backed verification under real engineering pressure.
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-3 font-mono text-[10px] text-text-muted border border-border-subtle bg-bg-panel/50 rounded-lg px-4 py-3">
              <BadgeCheck className="w-4 h-4 text-agy-green" />
              QUOTES AND HEADSHOTS LINKED TO ORIGINAL SOURCES
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {aiPerspectiveCards.map((card) => (
              <motion.article
                key={card.name}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`group relative overflow-hidden rounded-lg border border-border-subtle bg-bg-panel/70 p-5 backdrop-blur-xl transition-all duration-300 ${card.accent.panel}`}
              >
                <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${card.accent.glow} to-transparent opacity-70 pointer-events-none`} />
                <div className="relative flex items-start gap-4">
                  <div className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-bg-dark ${card.accent.image}`}>
                    <Image
                      src={card.image}
                      alt={`${card.name} headshot`}
                      fill
                      sizes="96px"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-mono font-bold tracking-wider ${card.accent.badge}`}>
                      <BadgeCheck className="h-3 w-3" />
                      ACTUAL QUOTE
                    </div>
                    <h3 className="mt-3 text-xl font-extrabold tracking-tight">{card.name}</h3>
                    <p className="mt-1 text-xs font-mono uppercase tracking-wider text-text-muted">{card.role}</p>
                  </div>
                </div>

                <div className="relative mt-6 flex min-h-[210px] flex-col justify-between gap-6">
                  <div>
                    <MessageSquareQuote className={`mb-4 h-7 w-7 ${card.accent.icon}`} />
                    <blockquote className="text-xl font-semibold leading-snug text-text-main">
                      {`"${card.quote}"`}
                    </blockquote>
                    <p className="mt-4 text-sm leading-relaxed text-text-muted">{card.takeaway}</p>
                  </div>

                  <div className="border-t border-border-subtle/70 pt-4 text-[10px] font-mono uppercase tracking-wider text-text-muted">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <a
                        href={card.quoteSource}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md text-text-main transition-colors hover:text-agy-cyan"
                      >
                        Quote: {card.quoteSourceLabel}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <a
                        href={card.photoSource}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-text-main"
                      >
                        Photo: {card.photoCredit}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

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
              type="button"
              aria-pressed={activeTab === "agentic"}
              onClick={() => setActiveTab("agentic")}
              className={`flex-1 pb-4 text-sm font-mono font-bold tracking-wider uppercase border-b-2 transition-all ${activeTab === "agentic" ? "border-agy-cyan text-agy-cyan glow-text-cyan" : "border-transparent text-text-muted hover:text-text-main"}`}
            >
              Agentic Engineering
            </button>
            <button 
              type="button"
              aria-pressed={activeTab === "skill"}
              onClick={() => setActiveTab("skill")}
              className={`flex-1 pb-4 text-sm font-mono font-bold tracking-wider uppercase border-b-2 transition-all ${activeTab === "skill" ? "border-agy-green text-agy-green glow-text-green" : "border-transparent text-text-muted hover:text-text-main"}`}
            >
              Skill Architecting
            </button>
            <button 
              type="button"
              aria-pressed={activeTab === "prompt"}
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
              ANTI<span className="text-text-main">CODE</span> SYSTEM
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
