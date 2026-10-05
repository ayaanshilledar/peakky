"use client";

import React from "react";
import { CalendarEvent } from "../../hooks/useCalendar";

interface NotchCollapsedProps {
  isRunning: boolean;
  formattedTime: string;
  clockTime: string;
  currentOrNextEvent?: CalendarEvent | null;
  onStartDrag: (e: React.MouseEvent) => void;
}

export const NotchCollapsed: React.FC<NotchCollapsedProps> = ({
  isRunning,
  formattedTime,
  clockTime,
  currentOrNextEvent,
  onStartDrag,
}) => {
  const now = Date.now();
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
      {/* Left: Brand or Imminent Event */}
      <div className="flex items-center gap-1.5 pointer-events-none min-w-0 pr-2">
        {isRunning ? (
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
        ) : (
          <span className="text-[11px] font-semibold tracking-tight text-zinc-200">
            Peaky
          </span>
        )}
      </div>

      {/* Right: Timer Countdown or Local Clock */}
      <div className="flex items-center gap-1.5 pointer-events-none shrink-0">
        <span className="text-[11px] font-mono font-medium text-zinc-300 tabular-nums">
          {isRunning ? formattedTime : clockTime || "--:--"}
        </span>
      </div>
    </div>
  );
};
