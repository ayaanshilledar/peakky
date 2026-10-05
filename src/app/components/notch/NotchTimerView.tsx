"use client";

import React, { useState, useRef, useEffect } from "react";
import { FocusSettings } from "../../hooks/useFocusTimer";

interface NotchTimerViewProps {
  settings: FocusSettings;
  formattedTime: string;
  isRunning: boolean;
  progressPercent: number;
  toggleTimer: () => void;
  resetTimer: () => void;
  updateSettings: (newSettings: Partial<FocusSettings>) => void;
  onEditingChange?: (isEditing: boolean) => void;
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
}) => {
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [customMinutesInput, setCustomMinutesInput] = useState("");
  const editTimerInputRef = useRef<HTMLInputElement | null>(null);

  // SVG Circular progress math (Radius: 18, Circumference = 2 * PI * 18 ≈ 113.1)
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  useEffect(() => {
    onEditingChange?.(isEditingTimer);
  }, [isEditingTimer, onEditingChange]);

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

  return (
    <div className="flex items-center justify-between mt-1 px-1">
      {/* Clean Digits & In-Place Direct Editing */}
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

        {/* Clean Minimal Status Line */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {isRunning ? "Session Active" : "Ready"}
          </span>
          <button
            onClick={resetTimer}
            title="Reset timer"
            className="text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1 hover:underline"
          >
            <span>↺</span> reset
          </button>
        </div>
      </div>

      {/* Circular Progress Dial & Play/Pause Trigger */}
      <div
        onClick={toggleTimer}
        className="relative w-11 h-11 flex items-center justify-center cursor-pointer group shrink-0 active:scale-95 transition-transform"
        title={isRunning ? "Pause" : "Start"}
      >
        {/* SVG Progress Ring */}
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

        {/* Inner Dial Button */}
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
  );
};
