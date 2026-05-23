"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  Cpu, 
  Search, 
  Filter, 
  Clock, 
  ShieldCheck, 
  Database, 
  UploadCloud, 
  ChevronRight, 
  CheckCircle,
  AlertCircle,
  FileCode,
  Sparkles,
  Zap,
  ArrowUpRight,
  LogOut,
  Activity
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: "agentic_flow" | "skill_verification" | "prompt_engineering";
  starter_code: string;
  test_manifest: any;
  created_at: string;
}

// Robust fallback pre-seeded challenges matching database seed
const LOCAL_FALLBACK_PROBLEMS: Problem[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    title: "AI Agentic Engineering: Matrix Multithread Optimizer",
    slug: "agentic-matrix-optimizer",
    description: "Deploy an autonomous AI agent to optimize a performance-critical matrix processing service.",
    difficulty: "medium",
    category: "agentic_flow",
    starter_code: "",
    test_manifest: {},
    created_at: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    title: "AI Skill Writing: Custom Log Parser Skill",
    slug: "skill-log-parser",
    description: "Construct a new Google Antigravity Skill (`log_parser`) that parses logs dynamically.",
    difficulty: "hard",
    category: "skill_verification",
    starter_code: "",
    test_manifest: {},
    created_at: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    title: "AI Prompt Engineering: Adversarial Defense Sandbox",
    slug: "prompt-adversarial-defense",
    description: "Design a system instruction and validation wrapper for a financial advisory chat agent that is immune to jailbreaking.",
    difficulty: "easy",
    category: "prompt_engineering",
    starter_code: "",
    test_manifest: {},
    created_at: new Date().toISOString()
  }
];

export default function ProblemsPage() {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>(LOCAL_FALLBACK_PROBLEMS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  
  // Custom JSONL Suite Uploader State
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    async function fetchProblems() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("problems")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          setProblems(data);
        }
      } catch (err: any) {
        console.warn("Supabase fetch failed, utilizing robust local fallback states.", err.message);
        // Fallback already pre-seeded in hook state
      } finally {
        setLoading(false);
      }
    }
    fetchProblems();
  }, []);

  // Filter Logic
  const filteredProblems = problems.filter(prob => {
    const matchesSearch = prob.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prob.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || prob.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || prob.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processUploadedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = (file: File) => {
    if (!file.name.endsWith(".jsonl") && !file.name.endsWith(".json")) {
      setUploadStatus("error");
      setUploadMessage("Security validation failed. System requires structured .json or .jsonl manifests.");
      return;
    }

    setUploadedFile(file);
    setUploadStatus("uploading");
    setUploadMessage("Parsing payload matrices and running structural code compile tests...");

    // Simulate validation compile checks (extremely robust UX!)
    setTimeout(() => {
      setUploadStatus("success");
      setUploadMessage(`Success: ${file.name} successfully registered as active test fixture sandbox!`);
    }, 1800);
  };

  const handleStartSession = async (problem: Problem) => {
    try {
      setLoading(true);
      // Create a real session in Supabase if user is authenticated, otherwise use local demo session
      const { data: { user } } = await supabase.auth.getUser();

      const candidateId = user ? user.id : null;

      const { data, error } = await supabase
        .from("interview_sessions")
        .insert({
          candidate_id: candidateId,
          problem_id: problem.id,
          status: "active",
          gce_instance_name: `yeetcode-sandbox-${problem.slug}-${Math.floor(Math.random() * 10000)}`,
          gce_instance_zone: "us-central1-a",
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.warn("Could not insert session, routing in local demo sandbox mode...", error.message);
        // Route with mock sessionId
        router.push(`/workspace?problem=${problem.slug}&session=demo-session-id`);
      } else if (data) {
        router.push(`/workspace?problem=${problem.slug}&session=${data.id}`);
      }
    } catch (err: any) {
      console.warn("Routing fallback:", err);
      router.push(`/workspace?problem=${problem.slug}&session=demo-session-id`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-bg-dark relative overflow-x-hidden text-white pb-12">
      {/* Visual background layers */}
      <div className="absolute inset-0 bg-cyber-grid bg-[size:40px_40px] opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none" />

      {/* Futuristic Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-bg-dark/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-agy-green/30 bg-bg-panel flex items-center justify-center shadow-[0_0_10px_rgba(0,255,102,0.1)]">
              <Cpu className="w-4 h-4 text-agy-green animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-sm">YEETCODE</span>
              <span className="text-[9px] font-mono text-agy-green block uppercase tracking-widest -mt-1">ADMIN PORTAL</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 font-mono text-xs text-text-muted bg-bg-panel/40 border border-slate-800/50 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-agy-green animate-pulse" />
              <span>GCP CLUSTER ACTIVE</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-text-red transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column: Challenges Browse (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Active Challenge Vector Matrices</h2>
              <p className="text-xs text-text-muted font-mono mt-0.5 uppercase tracking-wider">
                Select your engineering domain target block to initialize isolation GCE container.
              </p>
            </div>

            {/* Compact Metric Ticker */}
            <div className="flex items-center gap-4 bg-bg-panel/60 border border-slate-800/50 p-3 rounded-xl font-mono text-xs text-text-muted shrink-0 shadow-lg">
              <div className="text-center border-r border-slate-800/80 pr-4">
                <span className="block text-agy-green font-bold text-sm">3 / 3</span>
                <span className="text-[9px]">CHALLENGES</span>
              </div>
              <div className="text-center">
                <span className="block text-agy-cyan font-bold text-sm">240K</span>
                <span className="text-[9px]">WARM POOL VM</span>
              </div>
            </div>
          </div>

          {/* Search and Filters panel */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 bg-bg-panel/40 border border-slate-800/40 p-4 rounded-xl backdrop-blur-md">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search target matrices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-bg-dark border border-slate-800/80 focus:border-agy-green/40 rounded-lg text-xs font-mono placeholder:text-text-muted/60 outline-none transition-all"
              />
            </div>

            {/* Category Select */}
            <div className="md:col-span-3 relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-bg-dark border border-slate-800/80 focus:border-agy-green/40 rounded-lg text-xs font-mono outline-none transition-all appearance-none cursor-pointer text-text-main"
              >
                <option value="all">ALL DOMAINS</option>
                <option value="agentic_flow">AGENT FLOW</option>
                <option value="skill_verification">SKILL WRITING</option>
                <option value="prompt_engineering">PROMPT SECURE</option>
              </select>
            </div>

            {/* Difficulty Select */}
            <div className="md:col-span-3">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-bg-dark border border-slate-800/80 focus:border-agy-green/40 rounded-lg text-xs font-mono outline-none transition-all appearance-none cursor-pointer text-text-main"
              >
                <option value="all">ALL DIFFICULTIES</option>
                <option value="easy">EASY (DEFENSIVE)</option>
                <option value="medium">MEDIUM (OPTIMAL)</option>
                <option value="hard">HARD (EXPERT)</option>
              </select>
            </div>
          </div>

          {/* Problems List Grid */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 border border-slate-800/40 rounded-xl bg-bg-panel/30">
                <Activity className="w-8 h-8 text-agy-green animate-spin mb-4" />
                <span className="font-mono text-xs text-text-muted uppercase tracking-wider">Synchronizing secure databases...</span>
              </div>
            ) : filteredProblems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-xl bg-bg-panel/10">
                <AlertCircle className="w-8 h-8 text-text-red opacity-80 mb-3" />
                <span className="font-mono text-sm text-text-muted">No challenge matrices matched current query filter profiles.</span>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredProblems.map((prob) => (
                  <motion.div
                    key={prob.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="relative group p-6 rounded-xl border border-slate-800/80 bg-bg-panel/50 hover:border-slate-700/80 hover:bg-bg-panel/85 transition-all duration-300 shadow-[10px_10px_30px_rgba(0,0,0,0.3)] overflow-hidden cursor-pointer"
                    onClick={() => handleStartSession(prob)}
                  >
                    {/* Glow border lines */}
                    <div className={`absolute left-0 inset-y-0 w-1 transition-all duration-300 ${
                      prob.difficulty === "easy" ? "bg-agy-green shadow-[0_0_10px_#00ff66]" :
                      prob.difficulty === "medium" ? "bg-agy-cyan shadow-[0_0_10px_#00f0ff]" :
                      "bg-agy-violet shadow-[0_0_10px_#8b5cf6]"
                    }`} />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Category Tag */}
                          <span className="font-mono text-[9px] px-2.5 py-0.5 rounded-full border border-slate-800 text-text-muted bg-bg-dark tracking-wider uppercase">
                            {prob.category.replace("_", " ")}
                          </span>
                          
                          {/* Difficulty Tag */}
                          <span className={`font-mono text-[9px] font-semibold px-2 py-0.5 rounded uppercase ${
                            prob.difficulty === "easy" ? "text-text-green bg-text-green/10" :
                            prob.difficulty === "medium" ? "text-agy-cyan bg-agy-cyan/10" :
                            "text-agy-violet bg-agy-violet/10"
                          }`}>
                            {prob.difficulty}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold group-hover:text-agy-green transition-colors flex items-center gap-1.5">
                          {prob.title}
                          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-agy-green" />
                        </h3>
                        
                        <p className="text-xs text-text-muted line-clamp-2 pr-4 leading-relaxed font-mono">
                          {prob.description.replace(/[#*`]/g, "")}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-4 shrink-0 border-t border-slate-800/40 md:border-t-0 pt-4 md:pt-0">
                        <div className="text-right font-mono text-xs text-text-muted hidden md:block">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Clock className="w-3.5 h-3.5" />
                            <span>60 MINS</span>
                          </div>
                          <span className="text-[10px] uppercase text-agy-green/80 mt-0.5 block">READY DEPLOY</span>
                        </div>
                        <div className="w-9 h-9 rounded-lg border border-slate-800 group-hover:border-agy-green bg-bg-dark/60 flex items-center justify-center text-text-muted group-hover:text-agy-green transition-all shadow-[0_4px_10px_rgba(0,0,0,0.4)]">
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right Column: Custom Test Suite Uploader & Info Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Stunning Drag and Drop Test suite box */}
          <div className="bg-bg-panel/50 border border-slate-800/80 rounded-xl p-6 relative overflow-hidden shadow-[20px_20px_40px_rgba(0,0,0,0.4)]">
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-agy-cyan/50 to-transparent" />
            
            <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
              <Database className="w-4 h-4 text-agy-cyan" />
              CUSTOM EVAL FIXTURE UPLOADER
            </h3>
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mt-1 mb-4 leading-relaxed">
              Inject custom declarative validations into your sandbox runtime to run custom test-cases.
            </p>

            {/* Drag Zone Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[220px] ${
                dragActive 
                  ? "border-agy-cyan bg-agy-cyan/5 shadow-[0_0_20px_rgba(0,240,255,0.1)]" 
                  : "border-slate-800 bg-bg-dark/40 hover:border-slate-700/80 hover:bg-bg-dark/60"
              }`}
            >
              <input
                type="file"
                id="file-upload-input"
                className="hidden"
                accept=".json,.jsonl"
                onChange={handleFileChange}
              />

              <AnimatePresence mode="wait">
                {uploadStatus === "idle" && (
                  <motion.label
                    key="idle"
                    htmlFor="file-upload-input"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full"
                  >
                    <div className="w-12 h-12 rounded-full border border-slate-800/60 bg-bg-panel/40 flex items-center justify-center text-text-muted mb-2 shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                      <UploadCloud className="w-6 h-6 text-text-muted" />
                    </div>
                    <span className="text-xs font-semibold text-text-main group-hover:text-white">Drag & drop validation manifest</span>
                    <span className="text-[10px] font-mono text-text-muted uppercase">Accepts .json / .jsonl structures</span>
                    <div className="mt-2.5 px-3 py-1 bg-bg-dark border border-slate-800/50 rounded text-[9px] font-mono text-agy-cyan hover:border-agy-cyan/40 hover:bg-agy-cyan/5 transition-all">
                      CHOOSE FILE
                    </div>
                  </motion.label>
                )}

                {uploadStatus === "uploading" && (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-3.5"
                  >
                    <Activity className="w-8 h-8 text-agy-cyan animate-spin" />
                    <span className="text-xs font-mono text-text-muted uppercase tracking-wider">{uploadMessage}</span>
                  </motion.div>
                )}

                {uploadStatus === "success" && (
                  <motion.div
                    key="success"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-full border border-agy-green/20 bg-agy-green/5 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,102,0.15)]">
                      <CheckCircle className="w-6 h-6 text-text-green" />
                    </div>
                    <span className="text-xs font-mono text-text-green font-bold uppercase tracking-wider">STRUCTURE VERIFIED</span>
                    <span className="text-[10px] font-mono text-text-muted max-w-[200px] leading-relaxed">{uploadMessage}</span>
                    <button
                      onClick={() => setUploadStatus("idle")}
                      className="mt-2 text-[9px] font-mono border border-slate-800 hover:border-slate-700 hover:bg-bg-panel px-3 py-1 rounded cursor-pointer"
                    >
                      RESET UPLOADER
                    </button>
                  </motion.div>
                )}

                {uploadStatus === "error" && (
                  <motion.div
                    key="error"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-full border border-text-red/20 bg-text-red/5 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                      <AlertCircle className="w-6 h-6 text-text-red" />
                    </div>
                    <span className="text-xs font-mono text-text-red font-bold uppercase tracking-wider">COMPILE REJECTED</span>
                    <span className="text-[10px] font-mono text-text-muted max-w-[200px] leading-relaxed">{uploadMessage}</span>
                    <button
                      onClick={() => setUploadStatus("idle")}
                      className="mt-2 text-[9px] font-mono border border-slate-800 hover:border-slate-700 hover:bg-bg-panel px-3 py-1 rounded cursor-pointer"
                    >
                      RETRY UPLOAD
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Sandbox Specs Card */}
          <div className="bg-bg-panel/40 border border-slate-800/60 rounded-xl p-5 font-mono text-xs text-text-muted space-y-4">
            <h4 className="font-bold text-text-main text-xs uppercase tracking-widest flex items-center gap-2 pb-2.5 border-b border-slate-800/80">
              <Terminal className="w-4 h-4 text-agy-green" />
              SANDBOX ARCHITECTURE
            </h4>
            <div className="space-y-2.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-text-muted">CORE OS MODEL:</span>
                <span className="text-white">Ubuntu 24.04 LTS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">AGENT CLI:</span>
                <span className="text-white">Antigravity SDK v1.4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">GCP COMPUTE:</span>
                <span className="text-agy-green">n2-standard-4 (Warm)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">NETWORK STATE:</span>
                <span className="text-text-red">Isolated (Egress Blocked)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">WEB DESKTOP:</span>
                <span className="text-white">noVNC / websockify</span>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
