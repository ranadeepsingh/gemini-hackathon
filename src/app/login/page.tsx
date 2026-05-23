"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, 
  Terminal, 
  Cpu, 
  KeyRound, 
  Mail, 
  ArrowRight, 
  Activity, 
  Database,
  Sparkles,
  Zap
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"magic-link" | "password">("magic-link");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [liveStats, setLiveStats] = useState({
    activeSecures: 148,
    responseTime: "14ms",
    activeNodes: "9/9"
  });

  // Simulated live connection parameters
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        activeSecures: prev.activeSecures + (Math.random() > 0.5 ? 1 : -1),
        responseTime: `${(10 + Math.floor(Math.random() * 8))}ms`,
        activeNodes: "9/9"
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (authMode === "magic-link") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/problems`,
          },
        });
        if (error) throw error;
        setMessage({
          type: "success",
          text: "Verification link sent to your email. Check your inbox!",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/problems");
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "An authentication error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Demo bypass login (highly important for hackathon presentation to guarantee 100% success rate)
  const handleQuickDemoBypass = async (role: "candidate" | "interviewer") => {
    setIsLoading(true);
    setMessage({
      type: "success",
      text: `Securing administrative bypass as ${role}. Synchronizing node logs...`,
    });

    // In a live Supabase project, we'll try to sign in with a default demo account or simulate it
    setTimeout(() => {
      // Set local storage or state to signal we are logged in as a mock user if needed, 
      // or route to problems.
      router.push("/problems");
    }, 1500);
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 bg-bg-dark overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 bg-cyber-grid bg-[size:40px_40px] opacity-10 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-agy-green/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-agy-cyan/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Futuristic Scanline Overlay */}
      <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />

      <div className="relative w-full max-w-[500px]">
        {/* Glow Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="relative flex items-center justify-center w-16 h-16 rounded-xl border border-agy-green/30 bg-bg-panel/80 shadow-[0_0_20px_rgba(0,255,102,0.1)] mb-4 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-agy-green/10 to-transparent" />
            <Cpu className="w-8 h-8 text-agy-green animate-pulse" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-text-main to-agy-green"
          >
            YEETCODE
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-text-muted text-sm mt-1 font-mono tracking-widest text-agy-green/80 uppercase"
          >
            Agentic Interface Access Node
          </motion.p>
        </div>

        {/* Auth Panel card */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
          className="relative rounded-2xl border border-slate-800/80 bg-bg-panel/65 backdrop-blur-xl p-8 overflow-hidden shadow-[20px_20px_50px_rgba(0,0,0,0.5)]"
        >
          {/* Laser Top Scanline */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-agy-green/60 to-transparent animate-laser-scan" />

          {/* Tab selector */}
          <div className="flex border-b border-slate-800/80 mb-6 font-mono text-xs">
            <button
              onClick={() => setAuthMode("magic-link")}
              className={`flex-1 pb-3 text-center transition-colors relative ${
                authMode === "magic-link" ? "text-agy-green" : "text-text-muted hover:text-white"
              }`}
            >
              MAGIC LINK
              {authMode === "magic-link" && (
                <motion.div 
                  layoutId="activeTabBorder" 
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-agy-green" 
                />
              )}
            </button>
            <button
              onClick={() => setAuthMode("password")}
              className={`flex-1 pb-3 text-center transition-colors relative ${
                authMode === "password" ? "text-agy-green" : "text-text-muted hover:text-white"
              }`}
            >
              CREDENTIALS
              {authMode === "password" && (
                <motion.div 
                  layoutId="activeTabBorder" 
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-agy-green" 
                />
              )}
            </button>
          </div>

          <form onSubmit={handleSupabaseAuth} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-mono text-text-muted uppercase tracking-wider mb-1.5 pl-1">
                Security Identity Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-bg-dark/80 rounded-xl border border-slate-800/80 focus:border-agy-green/50 text-white font-mono text-sm placeholder:text-text-muted/50 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                />
              </div>
            </div>

            {/* Password Field */}
            <AnimatePresence mode="popLayout">
              {authMode === "password" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <label className="block text-xs font-mono text-text-muted uppercase tracking-wider mb-1.5 pl-1 mt-1">
                    Node Keyphrase
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-bg-dark/80 rounded-xl border border-slate-800/80 focus:border-agy-green/50 text-white font-mono text-sm placeholder:text-text-muted/50 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error/Success Status Banner */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className={`p-3.5 rounded-xl border font-mono text-xs flex gap-3 ${
                    message.type === "success" 
                      ? "border-agy-green/20 bg-agy-green/5 text-text-green" 
                      : "border-text-red/20 bg-text-red/5 text-text-red"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block uppercase tracking-wider mb-0.5">
                      {message.type === "success" ? "System Confirmed" : "Authentication Alert"}
                    </span>
                    {message.text}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Primary Access Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 group relative py-3 px-4 rounded-xl font-mono text-sm font-semibold tracking-wider text-bg-dark bg-agy-green hover:bg-agy-green-bright transition-all duration-300 shadow-[0_0_20px_rgba(0,255,102,0.2)] hover:shadow-[0_0_30px_rgba(0,255,102,0.45)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  INITIALIZE ACCESS
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Or Divider */}
          <div className="relative flex items-center justify-center my-6 font-mono text-[10px] text-text-muted">
            <div className="absolute inset-x-0 h-[1px] bg-slate-800/80" />
            <span className="relative bg-bg-panel/90 px-3 uppercase tracking-widest z-10">
              OR BYPASS FOR DEMO
            </span>
          </div>

          {/* Quick Demo Bypass (Venture Presentation Mode) */}
          <div className="grid grid-cols-2 gap-3.5">
            <button
              onClick={() => handleQuickDemoBypass("candidate")}
              disabled={isLoading}
              className="group py-2.5 px-3 rounded-xl border border-slate-800 hover:border-agy-cyan/40 bg-bg-dark/40 hover:bg-agy-cyan/5 transition-all duration-300 font-mono text-xs text-text-muted hover:text-agy-cyan flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-text-muted group-hover:text-agy-cyan" />
              <span>CANDIDATE VIEW</span>
            </button>
            <button
              onClick={() => handleQuickDemoBypass("interviewer")}
              disabled={isLoading}
              className="group py-2.5 px-3 rounded-xl border border-slate-800 hover:border-agy-violet/40 bg-bg-dark/40 hover:bg-agy-violet/5 transition-all duration-300 font-mono text-xs text-text-muted hover:text-agy-violet flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-4 h-4 text-text-muted group-hover:text-agy-violet" />
              <span>INTERVIEWER</span>
            </button>
          </div>
        </motion.div>

        {/* Live Diagnostics Metrics Panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 flex items-center justify-between px-6 font-mono text-[10px] text-text-muted"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-agy-green animate-pulse" />
            <span>SECURE NODES: {liveStats.activeSecures}</span>
          </div>
          <div>LATENCY: {liveStats.responseTime}</div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-agy-green animate-pulse" />
            <span>GCP CLUSTER: {liveStats.activeNodes}</span>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
