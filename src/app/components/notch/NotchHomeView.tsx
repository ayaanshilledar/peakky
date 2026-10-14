"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSystemMetrics } from "../../hooks/useSystemMetrics";
import { TaskItem, NoteItem } from "../../hooks/usePeakyStore";
import { CalendarEvent } from "../../hooks/useCalendar";
import { NotchTab } from "./NotchHeader";
import { getCalendarDays } from "./notchUtils";

interface NotchHomeViewProps {
  tasks: TaskItem[];
  notes: NoteItem[];
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addNote: (text: string) => void;
  deleteNote: (id: string) => void;
  onSelectTab: (tab: NotchTab) => void;
  currentOrNextEvent?: CalendarEvent | null;
  todayEvents?: CalendarEvent[];
  events?: CalendarEvent[];
  profileName?: string;
  openMeeting?: (url: string) => void;
  timerState?: {
    isRunning: boolean;
    formattedTime: string;
    toggleTimer: () => void;
  };
  onInputFocusChange?: (focused: boolean) => void;
}

const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export const NotchHomeView: React.FC<NotchHomeViewProps> = ({
  tasks,
  notes,
  addTask,
  toggleTask,
  deleteTask,
  addNote,
  deleteNote,
  onSelectTab,
  currentOrNextEvent,
  todayEvents = [],
  events = [],
  profileName,
  openMeeting,
  timerState,
  onInputFocusChange,
}) => {
  const { metrics, cpuHistory } = useSystemMetrics();
  const [activeSubTab, setActiveSubTab] = useState<"tasks" | "notes">("tasks");
  const [inputValue, setInputValue] = useState("");
  const [calMonthDate, setCalMonthDate] = useState<Date>(() => new Date());
  const inputRef = useRef<HTMLInputElement>(null);

  // Dynamic Time & Smart Personalized Greeting
  const getGreetingData = () => {
    const now = new Date();
    const hours = now.getHours();

    let greetingText = "Good evening";
    if (hours >= 5 && hours < 12) {
      greetingText = "Good morning";
    } else if (hours >= 12 && hours < 17) {
      greetingText = "Good afternoon";
    } else if (hours >= 17 && hours < 22) {
      greetingText = "Good evening";
    } else {
      greetingText = "Working late";
    }

    const firstName = profileName?.trim().split(/\s+/)[0];
    const greeting = firstName && firstName !== "User" 
      ? `${greetingText}, ${firstName}` 
      : greetingText;

    const timeParts = now
      .toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .split(" ");

    return {
      time: timeParts[0] || "",
      ampm: timeParts[1] || "",
      date: now.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      greeting,
      todayDay: now.getDate(),
      todayMonth: now.getMonth(),
      todayYear: now.getFullYear(),
    };
  };

  const [currentTime, setCurrentTime] = useState(getGreetingData);

  useEffect(() => {
    const updateTime = () => setCurrentTime(getGreetingData());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [profileName]);

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeNotes = Array.isArray(notes) ? notes : [];
  const activeTasks = useMemo(() => safeTasks.filter((t) => t && !t.completed), [safeTasks]);

  // Mini Calendar calculations
  const viewYear = calMonthDate.getFullYear();
  const viewMonth = calMonthDate.getMonth();
  const monthName = calMonthDate.toLocaleDateString([], { month: "long" });
  const calendarDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const daysWithEvents = useMemo(() => {
    const set = new Set<string>();
    const safeEv = Array.isArray(events) ? events : [];
    for (const e of safeEv) {
      if (!e || typeof e.start !== "number") continue;
      const d = new Date(e.start);
      set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
    return set;
  }, [events]);

  const nextTodayEvent = useMemo(() => {
    if (currentOrNextEvent) return currentOrNextEvent;
    const nowTs = Date.now();
    const safeToday = Array.isArray(todayEvents) ? todayEvents : [];
    const upcoming = safeToday.filter((e) => e && e.end > nowTs);
    upcoming.sort((a, b) => a.start - b.start);
    return upcoming[0] || safeToday[0] || null;
  }, [currentOrNextEvent, todayEvents]);

  // Refined minimal sparkline
  const { sparklinePath, sparklineArea } = useMemo(() => {
    const width = 150;
    const height = 30;
    if (!cpuHistory || cpuHistory.length < 2) {
      return { sparklinePath: "", sparklineArea: "" };
    }
    const cleanData = cpuHistory.filter((n) => typeof n === "number" && !isNaN(n));
    if (cleanData.length < 2) return { sparklinePath: "", sparklineArea: "" };

    const min = 0;
    const max = Math.max(100, ...cleanData);
    const stepX = width / (cleanData.length - 1);

    const points = cleanData.map((val, idx) => {
      const x = idx * stepX;
      const y = height - ((val - min) / (max - min)) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const path = `M ${points.join(" L ")}`;
    const area = `${path} L ${width},${height} L 0,${height} Z`;

    return { sparklinePath: path, sparklineArea: area };
  }, [cpuHistory]);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (activeSubTab === "tasks") {
      addTask(trimmed);
    } else {
      addNote(trimmed);
    }
    setInputValue("");
  };

  const cpuUsage = metrics?.cpu_usage ?? 0;
  const ramGb = metrics?.memory_used_gb ?? 0;
  const ramPercent = metrics?.memory_used_percent ?? 0;

  return (
    <div className="w-full h-full flex flex-col justify-between pt-0.5 pb-0.5 px-0.5 animate-in fade-in duration-200 select-none">
      {/* Top Context Bar: Quiet, refined time & dynamic greeting */}
      <div className="flex items-center justify-between px-1 mb-2.5 shrink-0">
        <div className="flex items-baseline gap-2.5">
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold tracking-tight text-white font-mono leading-none">
              {currentTime.time || "--:--"}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 uppercase ml-1.5 font-medium">
              {currentTime.ampm}
            </span>
          </div>

          <span className="text-zinc-600 text-xs select-none">·</span>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-300 font-medium">{currentTime.date}</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-300 bg-white/[0.04] border border-white/[0.06] px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/90" />
              {currentTime.greeting}
            </span>
          </div>
        </div>

        {/* Quick Context Pills */}
        <div className="flex items-center gap-2">
          {nextTodayEvent && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10.5px] text-zinc-300 max-w-[155px] truncate">
              <span className="text-cyan-400 text-[10px]">📅</span>
              <span className="truncate">{nextTodayEvent.title}</span>
              {nextTodayEvent.meetingUrl && openMeeting && (
                <button
                  type="button"
                  onClick={() => openMeeting(nextTodayEvent.meetingUrl!)}
                  className="text-emerald-400 hover:text-emerald-300 font-medium ml-1 cursor-pointer"
                >
                  Join
                </button>
              )}
            </div>
          )}

          {timerState && (
            <button
              type="button"
              onClick={() => timerState.toggleTimer()}
              title="Toggle focus timer"
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10.5px] font-mono transition-all cursor-pointer ${
                timerState.isRunning
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-white/[0.04] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span>{timerState.formattedTime}</span>
              <span className="text-[9px] opacity-70">
                {timerState.isRunning ? "❚❚" : "▶"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main 3 Frameless Frosted Glass Columns */}
      <div className="grid grid-cols-3 gap-2.5 flex-1 min-h-0 items-stretch">
        {/* Column 1: System Telemetry (Minimal & Quiet) */}
        <div
          onClick={() => onSelectTab("system")}
          className="group cursor-pointer bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-3 flex flex-col justify-between transition-all h-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[11px] font-medium text-zinc-400">System</span>
            <span className="text-[11px] font-mono font-medium text-zinc-200">
              {cpuUsage}% CPU
            </span>
          </div>

          {/* Delicate Sparkline */}
          <div className="w-full my-auto py-1 relative flex items-center justify-center">
            <svg
              className="w-full h-[32px] overflow-visible"
              viewBox="0 0 150 30"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="cpuGradMinimal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>
              {sparklineArea && (
                <path d={sparklineArea} fill="url(#cpuGradMinimal)" />
              )}
              {sparklinePath && (
                <path
                  d={sparklinePath}
                  fill="none"
                  stroke="currentColor"
                  className="text-zinc-300 group-hover:text-white transition-colors"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </div>

          {/* Clean Memory Gauge */}
          <div className="space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>RAM</span>
              <span className="text-zinc-300">{ramGb} GB · {ramPercent}%</span>
            </div>
            <div className="w-full h-1 rounded-full bg-zinc-800/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/90 transition-all duration-300 ease-out"
                style={{ width: `${Math.max(2, Math.min(100, ramPercent))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Column 2: Mini Calendar (Pure, Legible, Calm) */}
        <div
          onClick={() => onSelectTab("calendar")}
          className="group cursor-pointer bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-3 flex flex-col justify-between transition-all h-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[11px] font-medium text-zinc-300">
              {monthName}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCalMonthDate(new Date(viewYear, viewMonth - 1, 1));
                }}
                className="w-4 h-4 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 text-[10px] transition-colors cursor-pointer"
                title="Previous month"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCalMonthDate(new Date());
                }}
                className="w-4 h-4 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 text-[9px] transition-colors cursor-pointer"
                title="Today"
              >
                •
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCalMonthDate(new Date(viewYear, viewMonth + 1, 1));
                }}
                className="w-4 h-4 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 text-[10px] transition-colors cursor-pointer"
                title="Next month"
              >
                ›
              </button>
            </div>
          </div>

          {/* Minimal Calendar Grid */}
          <div className="my-auto py-0.5">
            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
              {WEEK_DAYS.map((d, i) => (
                <span key={i} className="text-[8.5px] font-mono text-zinc-500">
                  {d}
                </span>
              ))}
            </div>

            {/* Matrix */}
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {calendarDays.slice(0, 35).map((dayItem, idx) => {
                const isCurrentMonth = dayItem.monthOffset === 0;
                const isToday =
                  isCurrentMonth &&
                  dayItem.day === currentTime.todayDay &&
                  viewMonth === currentTime.todayMonth &&
                  viewYear === currentTime.todayYear;

                const dateKey = `${dayItem.dateObj.getFullYear()}-${dayItem.dateObj.getMonth()}-${dayItem.dateObj.getDate()}`;
                const hasEvent = daysWithEvents.has(dateKey);

                return (
                  <div
                    key={idx}
                    className={`h-[16px] flex flex-col items-center justify-center relative ${
                      isToday
                        ? "text-black font-semibold"
                        : isCurrentMonth
                        ? "text-zinc-300"
                        : "text-zinc-700 opacity-20"
                    }`}
                  >
                    {isToday && (
                      <span className="absolute inset-0 m-auto w-[16px] h-[16px] rounded-full bg-white" />
                    )}
                    <span className="relative z-10 text-[9px] font-mono leading-none">
                      {dayItem.day}
                    </span>
                    {hasEvent && !isToday && (
                      <span className="absolute bottom-[0.5px] w-1 h-1 rounded-full bg-cyan-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Meeting Whisper */}
          <div className="shrink-0 text-[10px] truncate">
            {nextTodayEvent ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-zinc-300 truncate max-w-[110px]">
                  {nextTodayEvent.title}
                </span>
                {nextTodayEvent.meetingUrl && openMeeting ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openMeeting(nextTodayEvent.meetingUrl!);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-medium underline cursor-pointer"
                  >
                    Join
                  </button>
                ) : (
                  <span className="text-zinc-500 font-mono text-[9px]">
                    {new Date(nextTodayEvent.start).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-zinc-500">No events today</span>
            )}
          </div>
        </div>

        {/* Column 3: Tasks & Quick Capture */}
        <div className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-3 flex flex-col justify-between transition-all h-full">
          {/* Header Switcher */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab("tasks")}
                className={`text-[11px] font-medium transition-colors cursor-pointer ${
                  activeSubTab === "tasks" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Tasks {activeTasks.length > 0 && <span className="text-zinc-400">({activeTasks.length})</span>}
              </button>
              <span className="text-zinc-700 select-none">·</span>
              <button
                type="button"
                onClick={() => setActiveSubTab("notes")}
                className={`text-[11px] font-medium transition-colors cursor-pointer ${
                  activeSubTab === "notes" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Notes
              </button>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab("tasks")}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              open
            </button>
          </div>

          {/* Clean List Area */}
          <div className="flex-1 my-1.5 space-y-1.5 overflow-hidden flex flex-col justify-center">
            {activeSubTab === "tasks" ? (
              activeTasks.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <span className="text-[10.5px] text-zinc-500">All caught up</span>
                </div>
              ) : (
                activeTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between group/task px-1 py-0.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                  >
                    <div
                      onClick={() => toggleTask(task.id)}
                      className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                    >
                      <button
                        type="button"
                        className="w-3.5 h-3.5 rounded-full border border-zinc-600 hover:border-emerald-400 flex items-center justify-center shrink-0 transition-all cursor-pointer"
                      >
                        <svg
                          className="w-2 h-2 stroke-zinc-500 opacity-0 group-hover/task:opacity-80 stroke-[2.5]"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                      <span className="text-[10.5px] text-zinc-200 truncate group-hover/task:text-white">
                        {task.text}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover/task:opacity-100 text-zinc-500 hover:text-rose-400 text-[10px] transition-all ml-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )
            ) : safeNotes.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <span className="text-[10.5px] text-zinc-500">No notes saved</span>
              </div>
            ) : (
              safeNotes.slice(0, 2).map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between group/note px-1 py-0.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                >
                  <span className="text-[10.5px] text-zinc-300 truncate flex-1">
                    {note.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteNote(note.id)}
                    className="opacity-0 group-hover/note:opacity-100 text-zinc-500 hover:text-rose-400 text-[10px] transition-all ml-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Minimal Inset Input Dock */}
          <form onSubmit={handleInputSubmit} className="relative mt-auto shrink-0">
            <div className="flex items-center w-full bg-white/[0.03] hover:bg-white/[0.05] focus-within:bg-white/[0.06] border border-white/[0.05] focus-within:border-white/[0.15] rounded-xl px-2.5 py-1.5 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => onInputFocusChange?.(true)}
                onBlur={() => onInputFocusChange?.(false)}
                placeholder={activeSubTab === "tasks" ? "Add task..." : "Add note..."}
                className="flex-1 bg-transparent text-[10px] text-white placeholder-zinc-500 focus:outline-none min-w-0"
              />
              <span className="text-[9px] font-mono text-zinc-500 select-none">↵</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
