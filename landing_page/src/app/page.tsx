"use client";

import React, { useState } from "react";
import Image from "next/image";

type ActiveTab = "home" | "timer" | "tasks" | "calendar" | "clips" | "agent";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [timerRunning, setTimerRunning] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({
    "1": true,
    "2": false,
    "3": false,
  });

  const toggleTask = (id: string) => {
    setCompletedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-[#ededed] flex flex-col selection:bg-white/20 selection:text-white">
      {/* Background Ambience: Subtle radial glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-white/[0.04] to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-r from-emerald-500/[0.02] via-white/[0.02] to-cyan-500/[0.02] blur-[140px] rounded-full" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-20 border-b border-white/[0.06] bg-[#08080a]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-zinc-800 to-black border border-white/10 flex items-center justify-center shadow-inner">
              <div className="w-3.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-white">Peaky</span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-zinc-400">
                v2.12
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#interactive-island" className="hover:text-white transition-colors">
              Live Preview
            </a>
            <a href="#agents" className="hover:text-white transition-colors">
              Agent HUD
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Architecture
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/[0.2] bg-zinc-900/40 hover:bg-zinc-800/60 transition-all flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
            <a
              href="#download"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-1.5"
            >
              <span>Get Peaky</span>
              <span className="text-[10px] opacity-70">↓</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-6 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-zinc-300 mb-6 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Dynamic Island & Productivity Overlay • macOS & Windows</span>
          </div>

          {/* Display Hero Title with designer typography */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08] max-w-3xl mb-6">
            Productivity, pinned directly to your bezel.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed mb-10">
            A minimalist, hardware-snapped floating notch at{" "}
            <code className="text-zinc-200 font-mono text-[0.88em] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">
              y = 0
            </code>
            . Seamlessly unites your Focus Pomodoro, Tasks, iCal Meeting countdowns,
            Clipboard History, and real-time AI Agent telemetry.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a
              href="#download"
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-zinc-200 transition-all shadow-[0_4px_24px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
              <span>Download Desktop Client</span>
            </a>
            <a
              href="#interactive-island"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/[0.1] bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Try Interactive Island</span>
            </a>
          </div>

          {/* Metric Callouts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 mt-14 pt-10 border-t border-white/[0.06] w-full max-w-2xl">
            <div>
              <div className="text-2xl font-bold text-white font-mono tracking-tight">&lt; 15MB</div>
              <div className="text-xs text-zinc-500 mt-1">Idle RAM usage</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white font-mono tracking-tight">0.0%</div>
              <div className="text-xs text-zinc-500 mt-1">Background CPU</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white font-mono tracking-tight">60 FPS</div>
              <div className="text-xs text-zinc-500 mt-1">Hardware acceleration</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white font-mono tracking-tight">100%</div>
              <div className="text-xs text-zinc-500 mt-1">Local & Private</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Dynamic Island Simulation */}
      <section id="interactive-island" className="relative z-10 py-16 px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="text-center mb-8">
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">
              Interactive Component Sandbox
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-1">
              Test the Dynamic Island in your browser
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Switch modules below to inspect how Peaky morphs at the top bezel.
            </p>
          </div>

          {/* Browser Mock Display Bezel */}
          <div className="w-full bg-[#0d0d10] border border-white/[0.08] rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col items-center">
            {/* Bezel Edge */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Simulated Dynamic Island Pill */}
            <div className="w-full flex justify-center mb-8">
              <div className="relative bg-black border-b border-x border-white/[0.12] rounded-b-[24px] shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden w-full max-w-[460px] p-3.5 flex flex-col justify-between">
                
                {/* Island Header with real tabs */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  {/* Grip Handle */}
                  <div className="w-6 h-6 rounded-full bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-zinc-500">
                    <svg className="w-2.5 h-3 fill-current" viewBox="0 0 24 24">
                      <circle cx="8" cy="6" r="2" />
                      <circle cx="16" cy="6" r="2" />
                      <circle cx="8" cy="12" r="2" />
                      <circle cx="16" cy="12" r="2" />
                      <circle cx="8" cy="18" r="2" />
                      <circle cx="16" cy="18" r="2" />
                    </svg>
                  </div>

                  {/* Tab Selector */}
                  <div className="flex items-center gap-1 bg-zinc-900/90 border border-white/[0.08] p-1 rounded-full">
                    {(
                      [
                        { id: "home", label: "Home" },
                        { id: "timer", label: "Focus" },
                        { id: "tasks", label: "Tasks" },
                        { id: "calendar", label: "Events" },
                        { id: "clips", label: "Clips" },
                        { id: "agent", label: "Agent" },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                          activeTab === t.id
                            ? "bg-zinc-800 text-white shadow-sm border border-white/10"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Status Indicator */}
                  <div className="w-6 h-6 rounded-full bg-zinc-900 border border-white/[0.08] flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>

                {/* Island Dynamic Body depending on Active Tab */}
                <div className="pt-3 min-h-[160px] flex flex-col justify-center">
                  {/* 1. HOME TAB */}
                  {activeTab === "home" && (
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="bg-[#121215] border border-white/[0.06] rounded-xl p-3 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                            Daily Flow
                          </div>
                          <div className="text-sm font-semibold text-white mt-1">Deep Focus</div>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono text-emerald-400 mt-3 pt-2 border-t border-white/[0.04]">
                          <span>Active 25m</span>
                          <span>✓ 4/6 tasks</span>
                        </div>
                      </div>

                      <div className="bg-[#121215] border border-white/[0.06] rounded-xl p-3 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                            Up Next
                          </div>
                          <div className="text-xs font-medium text-white mt-1 truncate">
                            Design Review Sync
                          </div>
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400 mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-between">
                          <span>in 18 min</span>
                          <span className="text-cyan-400 text-[10px]">meet ↗</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. TIMER TAB */}
                  {activeTab === "timer" && (
                    <div className="flex items-center justify-between px-3 py-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                          Pomodoro Session
                        </span>
                        <span className="text-4xl font-bold font-mono tracking-tight text-white mt-0.5">
                          24:18
                        </span>
                        <span className="text-[11px] text-zinc-400">Target: Finish Feature Specs</span>
                      </div>
                      <button
                        onClick={() => setTimerRunning(!timerRunning)}
                        className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
                          timerRunning
                            ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
                            : "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                        }`}
                      >
                        {timerRunning ? (
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}

                  {/* 3. TASKS TAB */}
                  {activeTab === "tasks" && (
                    <div className="flex flex-col gap-1.5 text-left">
                      {[
                        { id: "1", text: "Refactor Rust audio loop buffer" },
                        { id: "2", text: "Update typography scales in globals.css" },
                        { id: "3", text: "Draft release notes for v2.12" },
                      ].map((item) => (
                        <div
                          key={item.id}
                          onClick={() => toggleTask(item.id)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#141418] border border-white/[0.04] cursor-pointer hover:border-white/[0.1] transition-all"
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                              completedTasks[item.id]
                                ? "bg-white text-black border-white"
                                : "border-zinc-600 bg-transparent"
                            }`}
                          >
                            {completedTasks[item.id] && (
                              <svg className="w-2.5 h-2.5 fill-current stroke-current stroke-2" viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span
                            className={`text-xs ${
                              completedTasks[item.id]
                                ? "text-zinc-500 line-through"
                                : "text-zinc-200"
                            }`}
                          >
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 4. CALENDAR TAB */}
                  {activeTab === "calendar" && (
                    <div className="bg-[#141418] border border-white/[0.06] rounded-xl p-3.5 text-left flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span className="text-xs font-semibold text-white">Sprint Standup</span>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-400">10:00 - 10:30 AM</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-2">
                        Weekly engineering roadmap alignment with core contributors.
                      </p>
                      <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-500">Google Meet</span>
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="text-xs font-mono font-medium text-cyan-300 hover:text-cyan-200"
                        >
                          join call ↗
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 5. CLIPS TAB */}
                  {activeTab === "clips" && (
                    <div className="flex flex-col gap-2 text-left">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">Recent Clippings</span>
                        <span className="text-[10px] font-mono text-emerald-400">3 items saved</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#141418] border border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">TXT</span>
                          <span className="text-xs text-zinc-200 font-mono truncate max-w-[200px]">
                            cargo tauri build --release
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">2m ago</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#141418] border border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">IMG</span>
                          <span className="text-xs text-zinc-300 truncate max-w-[200px]">
                            Screenshot (1920×1080)
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">14m ago</span>
                      </div>
                    </div>
                  )}

                  {/* 6. AGENT HUD TAB */}
                  {activeTab === "agent" && (
                    <div className="bg-[#121215] border border-emerald-500/20 rounded-xl p-3 text-left flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-xs font-mono font-medium text-emerald-300">
                            Claude Code Active
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">Step 3/8</span>
                      </div>
                      <div className="bg-black/60 rounded p-2 border border-white/[0.06] font-mono text-[11px] text-zinc-300">
                        <span className="text-emerald-400">$</span> agy plan --apply
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1">
                        <span>Tokens: 1,420</span>
                        <span className="text-emerald-400">Approved ✓</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-zinc-500 text-center">
              Designed with hardware bezel curve matching macOS & Windows Modern Flat
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="relative z-10 py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
              Engineered for seamless micro-interactions
            </h2>
            <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
              Every millisecond of distraction costs focus. Peaky lives right above your work,
              giving you zero-overhead control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Focus Pomodoro */}
            <div className="bg-[#121215] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl p-7 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-white mb-5">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15 14" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">Focus Pomodoro</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Tactile circular countdown with inline digit editing (1–180 min). Subtle completion chime without aggressive popups.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/[0.04] text-[11px] font-mono text-zinc-500">
                Direct Inline Duration Editing
              </div>
            </div>

            {/* Card 2: Calendar & Meeting Sync */}
            <div className="bg-[#121215] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl p-7 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-white mb-5">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">iCal Meeting Sync</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Direct sync with Google Calendar, Outlook, and Apple iCal feeds. Countdown displays right on the notch pill before calls begin.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/[0.04] text-[11px] font-mono text-zinc-500">
                One-Click Meet Deep-Links
              </div>
            </div>

            {/* Card 3: Clipboard & Screenshot Engine */}
            <div className="bg-[#121215] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl p-7 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-white mb-5">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">Clipboard & Clips</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Real-time detection of copied code, links, and system screenshots with instant 1-click re-copying and resolution tags.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/[0.04] text-[11px] font-mono text-zinc-500">
                100% Local SQLite Store
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer CLI & AI Agent HUD Section */}
      <section id="agents" className="relative z-10 py-20 px-6 border-t border-white/[0.06] bg-gradient-to-b from-transparent via-white/[0.01] to-transparent">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-left">
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400">
              Terminal & AI Telemetry
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
              Ambient telemetry for autonomous CLI agents.
            </h2>
            <p className="text-sm text-zinc-400 mt-4 leading-relaxed">
              Running <span className="text-white font-medium">Claude Code</span>, <span className="text-white font-medium">OpenCode</span>, or long shell builds? Peaky tracks terminal execution status on your collapsed notch with live step marquees.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-xs text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>1-Click Tool Approvals right from the Dynamic Island</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Built-in Local Event Bridge at <code>127.0.0.1:3949</code></span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Live token count, tool steps, and cost estimation</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full max-w-md bg-[#000000] border border-white/[0.1] rounded-2xl p-5 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[10px] text-zinc-500">agent-telemetry.log</span>
            </div>
            <div className="pt-4 flex flex-col gap-2.5 text-zinc-300 text-[11px] leading-relaxed">
              <div className="text-zinc-500">&gt; peaky-agent-bridge --port 3949</div>
              <div className="text-emerald-400">[CONNECTED] Claude Code agent hook</div>
              <div className="text-zinc-400">
                [ACTION] Executing tool: <span className="text-white">bash(&quot;cargo check&quot;)</span>
              </div>
              <div className="p-2 rounded bg-zinc-900/80 border border-white/[0.06] flex items-center justify-between">
                <span>Requesting permission</span>
                <span className="text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded text-[10px]">
                  Auto-Approved ✓
                </span>
              </div>
              <div className="text-zinc-500 pt-2 flex items-center justify-between text-[10px]">
                <span>Status: OK (0.24s)</span>
                <span>Memory: 14.2 MB</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Quote Section using Newsreader serif */}
      <section className="py-20 px-6 border-t border-white/[0.06] text-center">
        <div className="max-w-2xl mx-auto">
          <blockquote className="font-serif-cardboard italic text-2xl sm:text-3xl text-zinc-200 leading-snug">
            &ldquo;The best productivity tool is the one that disappears into your display hardware until the exact moment you need it.&rdquo;
          </blockquote>
          <p className="mt-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
            Peaky Design Philosophy
          </p>
        </div>
      </section>

      {/* Download / Installation Section */}
      <section id="download" className="relative z-10 py-20 px-6 border-t border-white/[0.06] bg-[#0c0c10]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            Ready to upgrade your desktop?
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto mb-10">
            Open-source, lightning fast, and respectful of your system resources. Built with Tauri v2 and Rust.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all shadow-[0_4px_28px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
              </svg>
              <span>Download for Windows (.msi / .exe)</span>
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-zinc-900 border border-white/[0.1] hover:border-white/[0.2] text-zinc-300 hover:text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.66-1.07 1.72-.94 2.74 1 .08 2.03-.49 2.65-1.24z" />
              </svg>
              <span>Download for macOS (.dmg)</span>
            </a>
          </div>

          <div className="mt-8 text-xs font-mono text-zinc-500">
            or install via CLI: <code className="text-zinc-300">winget install peaky</code> / <code className="text-zinc-300">brew install --cask peaky</code>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-12 px-6 bg-[#08080a]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">Peaky</span>
            <span className="text-xs text-zinc-500">© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-zinc-400">
            <a href="https://github.com" className="hover:text-white transition-colors">GitHub</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#download" className="hover:text-white transition-colors">Releases</a>
            <span className="text-zinc-600">Built with Tauri & Next.js</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
