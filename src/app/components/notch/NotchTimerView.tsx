"use client";

import React, { useState, useRef, useEffect } from "react";
import { FocusSettings } from "../../hooks/useFocusTimer";
import { useReminderStore } from "../../hooks/useReminderStore";

interface NotchTimerViewProps {
  settings: FocusSettings;
  formattedTime: string;
  isRunning: boolean;
  progressPercent: number;
  toggleTimer: () => void;
  resetTimer: () => void;
  updateSettings: (newSettings: Partial<FocusSettings>) => void;
  onEditingChange?: (isEditing: boolean) => void;
  onSubTabChange?: (subTab: "focus" | "reminders") => void;
}

export const NotchTimerView: React.FC<NotchTimerViewProps> = ({
  settings,
  formattedTime,
  isRunning,
  progressPercent,
  toggleTimer,
  resetTimer,
  updateSettings,
  onEditingChange,
  onSubTabChange,
}) => {
  const [subTab, setSubTab] = useState<"focus" | "reminders">("focus");
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [customMinutesInput, setCustomMinutesInput] = useState("");
  const editTimerInputRef = useRef<HTMLInputElement | null>(null);

  const [reminderInput, setReminderInput] = useState("");
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);

  const { activeReminders, addReminder, deleteReminder } = useReminderStore();

  // SVG Circular progress math (Radius: 18, Circumference = 2 * PI * 18 ≈ 113.1)
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  useEffect(() => {
    onEditingChange?.(isEditingTimer);
  }, [isEditingTimer, onEditingChange]);

  useEffect(() => {
    onSubTabChange?.(subTab);
  }, [subTab, onSubTabChange]);

  const startEditingTimer = () => {
    if (isRunning) return;
    setCustomMinutesInput(settings.focusMinutes.toString());
    setIsEditingTimer(true);
    setTimeout(() => {
      if (editTimerInputRef.current) {
        editTimerInputRef.current.focus();
        editTimerInputRef.current.select();
      }
    }, 40);
  };

  const saveTimerMinutes = (newMins: number) => {
    const clamped = Math.max(1, Math.min(180, newMins));
    updateSettings({ focusMinutes: clamped });
    setIsEditingTimer(false);
  };

  const handleTimerEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMinutesInput, 10);
    if (!isNaN(val) && val > 0) {
      saveTimerMinutes(val);
    } else {
      setIsEditingTimer(false);
    }
  };

  const handleReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = reminderInput.trim();
    if (!text) return;

    const parsed = addReminder(text);
    if (parsed.isReminder) {
      setReminderFeedback(`Reminder set for ${parsed.formattedTime}`);
      setTimeout(() => setReminderFeedback(null), 3000);
      setReminderInput("");
    }
  };

  const handleQuickPreset = (mins: number) => {
    const parsed = addReminder(`Reminder in ${mins} mins`);
    if (parsed.isReminder) {
      setReminderFeedback(`Reminder set for ${parsed.formattedTime}`);
      setTimeout(() => setReminderFeedback(null), 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between mt-1 overflow-hidden">
      {subTab === "focus" ? (
        /* Focus Pomodoro Timer View */
        <div className="flex items-center justify-between px-1 py-1">
          {/* Digits & In-Place Direct Editing */}
          <div className="flex flex-col justify-center">
            {isEditingTimer ? (
              <form onSubmit={handleTimerEditSubmit} className="flex items-baseline gap-1">
                <input
                  ref={editTimerInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={customMinutesInput}
                  onChange={(e) => setCustomMinutesInput(e.target.value.replace(/\D/g, ""))}
                  onBlur={() => {
                    const val = parseInt(customMinutesInput, 10);
                    if (!isNaN(val) && val > 0) saveTimerMinutes(val);
                    else setIsEditingTimer(false);
                  }}
                  className="w-16 bg-transparent text-[28px] font-mono font-semibold tracking-tight text-white border-b border-white/40 focus:border-emerald-400 outline-none p-0 leading-none tabular-nums"
                />
                <span className="text-xs font-mono text-zinc-400">m</span>
              </form>
            ) : (
              <div
                onClick={startEditingTimer}
                title={!isRunning ? "Click to edit duration" : ""}
                className={`flex items-baseline gap-1.5 ${!isRunning ? "cursor-pointer group" : ""}`}
              >
                <span className="text-[28px] font-mono font-semibold tracking-tight text-white tabular-nums leading-none group-hover:text-emerald-300 transition-colors">
                  {formattedTime}
                </span>
              </div>
            )}

            {/* Clean Status Line + Reminders Link */}
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px]">
              <span className="font-medium uppercase tracking-wider text-zinc-500">
                {isRunning ? "Session Active" : "Ready"}
              </span>
              <span className="text-zinc-600">•</span>
              <button
                onClick={resetTimer}
                title="Reset timer"
                className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1 hover:underline"
              >
                <span>↺</span> reset
              </button>
              <span className="text-zinc-600">•</span>
              <button
                onClick={() => setSubTab("reminders")}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer font-sans hover:underline flex items-center gap-1"
                title="View & set reminders"
              >
                <span>Reminders</span>
                {activeReminders.length > 0 && (
                  <span className="text-amber-400 font-mono">({activeReminders.length})</span>
                )}
              </button>
            </div>
          </div>

          {/* Circular Progress Dial & Play/Pause Trigger */}
          <div
            onClick={toggleTimer}
            className="relative w-11 h-11 flex items-center justify-center cursor-pointer group shrink-0 active:scale-95 transition-transform"
            title={isRunning ? "Pause" : "Start"}
          >
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r={radius}
                className="stroke-zinc-800"
                strokeWidth="3"
                fill="transparent"
              />
              <circle
                cx="22"
                cy="22"
                r={radius}
                className="stroke-emerald-400 transition-all duration-300"
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute inset-[5px] rounded-full bg-zinc-900 group-hover:bg-zinc-800 border border-white/[0.06] flex items-center justify-center text-white transition-colors shadow-inner">
              {isRunning ? (
                <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 fill-white ml-0.5" viewBox="0 0 24 24">
                  <polygon points="6 4 19 12 6 20 6 4" />
                </svg>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Reminders Sub-View */
        <div className="flex-1 flex flex-col justify-between overflow-hidden pt-0.5">
          {/* Header Row with Back Button */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-zinc-200 tracking-tight">
              Reminders
            </span>
            <button
              onClick={() => setSubTab("focus")}
              className="text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer font-mono hover:underline flex items-center gap-1"
            >
              ← Timer
            </button>
          </div>

          {/* Quick Reminder Input */}
          <form onSubmit={handleReminderSubmit} className="relative mb-1">
            <div className="flex items-center w-full bg-zinc-900/80 border border-white/[0.07] focus-within:border-white/[0.2] rounded-lg px-2.5 py-1 transition-colors">
              <span className="text-zinc-500 text-xs mr-2 font-mono select-none">+</span>
              <input
                type="text"
                value={reminderInput}
                onChange={(e) => setReminderInput(e.target.value)}
                placeholder="Add reminder e.g. 'meeting in 40 mins'..."
                className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none font-sans"
              />
              <kbd className="text-[10px] font-mono text-zinc-500 bg-zinc-800/80 px-1 py-0.2 rounded select-none">
                ↵
              </kbd>
            </div>
            {reminderFeedback && (
              <div className="mt-0.5 text-[10px] text-emerald-400 font-mono animate-in fade-in duration-200">
                {reminderFeedback}
              </div>
            )}
          </form>

          {/* Quick Preset Buttons */}
          <div className="flex items-center justify-between gap-1 my-1">
            <span className="text-[10px] text-zinc-500 font-mono">Quick:</span>
            <div className="flex items-center gap-1">
              {[5, 15, 30, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleQuickPreset(mins)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06] transition-colors cursor-pointer"
                >
                  +{mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled Active Reminders List */}
          <div className="flex-1 overflow-y-auto max-h-[85px] space-y-1 no-scrollbar">
            {activeReminders.length === 0 ? (
              <div className="text-center py-1.5 text-[10px] text-zinc-500 font-mono">
                No active reminders
              </div>
            ) : (
              activeReminders.map((rem) => {
                const minsLeft = Math.max(
                  0,
                  Math.ceil((rem.targetTime - Date.now()) / 60000)
                );
                const formatted = new Date(rem.targetTime).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={rem.id}
                    className="flex items-center justify-between px-2 py-1 rounded-lg bg-zinc-900/60 border border-white/[0.04]"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[10px] text-emerald-400 font-mono shrink-0">
                        {formatted}
                      </span>
                      <span className="text-xs text-zinc-200 truncate">{rem.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-zinc-400 font-mono">
                        in {minsLeft}m
                      </span>
                      <button
                        onClick={() => deleteReminder(rem.id)}
                        className="text-zinc-500 hover:text-rose-400 text-xs px-1 cursor-pointer"
                        title="Delete reminder"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
