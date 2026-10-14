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
  dictationSuccess?: boolean;
  lastDictatedText?: string | null;
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
  dictationSuccess,
  lastDictatedText,
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

  // Live Voice Dictation Recording Pill
  if (isDictating || isTranscribing) {
    return (
      <div
        onMouseDown={onStartDrag}
        className="w-full h-full flex items-center justify-between px-3.5 animate-in fade-in zoom-in-95 duration-150 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
          <span className="text-[11px] font-medium text-rose-300">
            {isTranscribing ? "Transcribing..." : "Listening..."}
          </span>
        </div>

        {/* Live Audio Equalizer Waveform */}
        <div className="flex items-end gap-1 h-3.5">
          <span
            className="w-0.5 rounded-full bg-rose-400 transition-all duration-75"
            style={{ height: `${Math.max(4, Math.min(14, (audioLevel * 14) / 100))}px` }}
          />
          <span
            className="w-0.5 rounded-full bg-rose-400 transition-all duration-75"
            style={{ height: `${Math.max(4, Math.min(14, ((audioLevel + 20) * 14) / 100))}px` }}
          />
          <span
            className="w-0.5 rounded-full bg-rose-400 transition-all duration-75"
            style={{ height: `${Math.max(4, Math.min(14, (audioLevel * 14) / 100))}px` }}
          />
          <span
            className="w-0.5 rounded-full bg-rose-400 transition-all duration-75"
            style={{ height: `${Math.max(3, Math.min(14, ((audioLevel - 15) * 14) / 100))}px` }}
          />
        </div>

        <span className="text-[9px] font-mono text-zinc-400 bg-white/[0.08] px-1.5 py-0.5 rounded">
          Ctrl+N
        </span>
      </div>
    );
  }

  // Dictation Transcribed & Copied Toast Pill
  if (dictationSuccess) {
    return (
      <div
        onMouseDown={onStartDrag}
        className="w-full h-full flex items-center justify-between px-3.5 animate-in fade-in duration-150 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-1.5 min-w-0 pr-2">
          <span className="text-emerald-400 text-xs">✓</span>
          <span className="text-[10px] text-emerald-200 font-medium truncate max-w-[170px]">
            {lastDictatedText ? `"${lastDictatedText}"` : "Copied to clipboard!"}
          </span>
        </div>
        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
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


