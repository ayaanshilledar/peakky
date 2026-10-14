"use client";

import React from "react";
import { CalendarEvent } from "../../hooks/useCalendar";
import { MediaState } from "../../hooks/useMedia";
import { ReminderItem } from "../../hooks/useReminderStore";
import { SystemHUDState } from "../../hooks/useSystemOSD";
import { NotchOSDPill } from "./NotchOSDPill";

interface NotchCollapsedProps {
  isRunning: boolean;
  formattedTime: string;
  clockTime: string;
  currentOrNextEvent?: CalendarEvent | null;
  media?: MediaState | null;
  imminentReminder?: ReminderItem | null;
  activeHUD?: SystemHUDState | null;
  isDictating?: boolean;
  isTranscribing?: boolean;
  audioLevel?: number;
  frequencies?: number[];
  liveInterimText?: string;
  recordingDuration?: number;
  dictationSuccess?: boolean;
  lastDictatedText?: string | null;
  dictationLatency?: number | null;
  onStartDrag: (e: React.MouseEvent) => void;
}

export const NotchCollapsed: React.FC<NotchCollapsedProps> = ({
  isRunning,
  formattedTime,
  clockTime,
  currentOrNextEvent,
  media,
  imminentReminder,
  activeHUD,
  isDictating,
  isTranscribing,
  audioLevel = 0,
  frequencies = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  liveInterimText = "",
  recordingDuration = 0,
  dictationSuccess,
  lastDictatedText,
  dictationLatency,
  onStartDrag,
}) => {
  if (activeHUD) {
    return (
      <div
        onMouseDown={onStartDrag}
        className="w-full h-full flex items-center cursor-grab active:cursor-grabbing"
      >
        <NotchOSDPill hud={activeHUD} />
      </div>
    );
  }

  const formatDuration = (sec: number = 0) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Live Voice Dictation Recording Pill — Apple Siri Blue Minimal Stream
  if (isDictating || isTranscribing) {
    return (
      <div
        onMouseDown={onStartDrag}
        className="w-full h-full flex items-center justify-between px-3 select-none cursor-grab active:cursor-grabbing animate-in fade-in duration-150"
      >
        {/* Left: Apple Siri Electric Blue Beacon + live elapsed timer */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center justify-center w-2.5 h-2.5">
            <span
              className={`w-2 h-2 rounded-full absolute ${
                isTranscribing ? "bg-sky-400 animate-ping" : "bg-sky-400 animate-ping opacity-75"
              }`}
            />
            <span
              className={`w-2 h-2 rounded-full relative shadow-[0_0_8px_rgba(56,189,248,0.7)] ${
                isTranscribing ? "bg-sky-300" : "bg-sky-400"
              }`}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
            {isTranscribing ? "ready" : formatDuration(recordingDuration)}
          </span>
        </div>

        {/* Center: Live stream (live interim spoken words OR fluid Apple Blue audio spectrum) */}
        <div className="flex-1 px-2.5 flex items-center justify-center overflow-hidden min-w-0">
          {isTranscribing ? (
            <div className="flex items-center gap-1.5 text-zinc-300 text-[10px] font-medium tracking-wide">
              <svg className="w-3 h-3 text-sky-400 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
              <span className="bg-gradient-to-r from-zinc-200 via-sky-200 to-zinc-400 bg-clip-text text-transparent animate-pulse">
                Transcribing...
              </span>
            </div>
          ) : liveInterimText ? (
            <div className="text-[11px] font-medium text-zinc-200 truncate animate-in fade-in duration-100 flex items-center gap-1 min-w-0">
              <span className="text-zinc-500 font-serif text-xs">“</span>
              <span className="text-white truncate max-w-[145px] tracking-tight">{liveInterimText}</span>
              <span className="inline-block w-1 h-3 bg-sky-400 animate-pulse rounded-full shrink-0 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
            </div>
          ) : (
            /* Minimal Symmetrical Apple Soundwave Stream (11 fluid dancing blue bars) */
            <div className="flex items-center gap-[2.5px] h-4">
              {frequencies.map((lvl, idx) => {
                const isHigh = lvl > 35;
                const barHeight = Math.max(3, Math.min(18, (lvl * 18) / 100));
                return (
                  <span
                    key={idx}
                    className="w-[2px] rounded-full transition-all duration-75"
                    style={{
                      height: `${barHeight}px`,
                      backgroundColor: isHigh ? "#38bdf8" : "#0284c7",
                      opacity: Math.max(0.4, lvl / 70),
                      boxShadow: isHigh ? "0 0 6px rgba(56, 189, 248, 0.5)" : "none",
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Hotkey badge */}
        <div className="shrink-0 flex items-center">
          <kbd
            title="Alt+D to finish • Esc to cancel"
            className="text-[9px] font-mono text-zinc-400 bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded shadow-sm hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
          >
            Alt+D
          </kbd>
        </div>
      </div>
    );
  }

  // Dictation Transcribed & Copied Toast Pill — Clean Apple Style (No developer latency badge)
  if (dictationSuccess) {
    return (
      <div
        onMouseDown={onStartDrag}
        className="w-full h-full flex items-center justify-between px-3 animate-in fade-in duration-150 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <svg className="w-2.5 h-2.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-[11px] text-zinc-200 font-medium truncate max-w-[190px] tracking-tight">
            {lastDictatedText ? `"${lastDictatedText}"` : "Copied to clipboard!"}
          </span>
        </div>
        <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0 shadow-sm">
          Copied
        </span>
      </div>
    );
  }

  const now = Date.now();

  const isMediaActive = Boolean(media?.title);

  const isReminderActive = Boolean(imminentReminder);
  const reminderMinsLeft = imminentReminder
    ? Math.max(0, Math.ceil((imminentReminder.targetTime - now) / 60000))
    : 0;

  const isEventLive =
    currentOrNextEvent &&
    now >= currentOrNextEvent.start &&
    now <= currentOrNextEvent.end;
  const isEventSoon =
    currentOrNextEvent &&
    !isEventLive &&
    currentOrNextEvent.start - now > 0 &&
    currentOrNextEvent.start - now <= 20 * 60 * 1000;
  const minsUntilEvent =
    isEventSoon && currentOrNextEvent
      ? Math.ceil((currentOrNextEvent.start - now) / 60000)
      : 0;

  return (
    <div
      onMouseDown={onStartDrag}
      className="w-full flex items-center justify-between h-full cursor-grab active:cursor-grabbing"
      title="Drag horizontally along top edge"
    >
      {/* Left: Brand / Imminent Reminder / Imminent Event / Now Playing */}
      <div className="flex items-center gap-1.5 pointer-events-none min-w-0 pr-2">
        {isReminderActive ? (
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[10px] text-amber-400 shrink-0 font-mono">
              🔔 {reminderMinsLeft > 0 ? `in ${reminderMinsLeft}m:` : "NOW:"}
            </span>
            <span className="text-[10px] font-medium text-amber-200 truncate max-w-[110px]">
              {imminentReminder?.title}
            </span>
          </div>
        ) : isRunning ? (
          <span className="text-[11px] font-semibold tracking-tight text-zinc-200">
            Peaky
          </span>
        ) : isEventLive ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-300 truncate max-w-[120px]">
              {currentOrNextEvent?.title}
            </span>
          </div>
        ) : isEventSoon ? (
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[10px] font-mono text-zinc-400 shrink-0">
              in {minsUntilEvent}m:
            </span>
            <span className="text-[10px] font-medium text-zinc-200 truncate max-w-[110px]">
              {currentOrNextEvent?.title}
            </span>
          </div>
        ) : isMediaActive ? (
          <div className="flex items-center gap-1.5 min-w-0">
            {media?.thumbnail ? (
              <img
                src={media.thumbnail}
                alt=""
                className="w-4 h-4 rounded-sm object-cover shrink-0"
              />
            ) : (
              <span className={`w-1.5 h-1.5 rounded-full ${media?.isPlaying ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"} shrink-0`} />
            )}
            <span className="text-[10px] font-medium text-zinc-200 truncate max-w-[110px]">
              {media?.title}
            </span>
          </div>
        ) : (
          <span className="text-[11px] font-semibold tracking-tight text-zinc-200">
            Peaky
          </span>
        )}
      </div>

      {/* Right: Timer Countdown, Media Equalizer, or Local Clock */}
      <div className="flex items-center gap-1.5 pointer-events-none shrink-0">
        {isRunning ? (
          <span className="text-[11px] font-mono font-medium text-zinc-300 tabular-nums">
            {formattedTime}
          </span>
        ) : isMediaActive && media?.isPlaying ? (
          <div className="flex items-end gap-0.5 h-2.5">
            <span className="w-0.5 h-2 bg-emerald-400 animate-pulse" />
            <span className="w-0.5 h-3 bg-emerald-400 animate-pulse delay-75" />
            <span className="w-0.5 h-1.5 bg-emerald-400 animate-pulse delay-150" />
          </div>
        ) : (
          <span className="text-[11px] font-mono font-medium text-zinc-300 tabular-nums">
            {clockTime || "--:--"}
          </span>
        )}
      </div>
    </div>
  );
};


