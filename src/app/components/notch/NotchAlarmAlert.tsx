"use client";

import React from "react";
import { ReminderItem } from "../../hooks/useReminderStore";

interface NotchAlarmAlertProps {
  alarm: ReminderItem;
  onSnooze: (id: string, minutes: number) => void;
  onDismiss: (id: string) => void;
}

export const NotchAlarmAlert: React.FC<NotchAlarmAlertProps> = ({
  alarm,
  onSnooze,
  onDismiss,
}) => {
  return (
    <div className="w-full flex flex-col justify-between h-full p-1 animate-in fade-in zoom-in-95 duration-200">
      {/* Top Accent Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-amber-400 uppercase font-mono">
            Reminder
          </span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">
          {new Date(alarm.targetTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </span>
      </div>

      {/* Main Title Banner */}
      <div className="my-1.5 bg-zinc-900/90 border border-amber-500/20 rounded-xl p-2.5 flex flex-col justify-center">
        <h3 className="text-xs font-semibold text-white truncate">{alarm.title}</h3>
        <p className="text-[10px] text-amber-300/80 mt-0.5 font-mono">
          Scheduled time has arrived
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-2 px-0.5 pb-0.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSnooze(alarm.id, 5)}
            className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
          >
            Snooze 5m
          </button>
          <button
            onClick={() => onSnooze(alarm.id, 15)}
            className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
          >
            Snooze 15m
          </button>
        </div>

        <button
          onClick={() => onDismiss(alarm.id)}
          className="text-[11px] font-medium px-3.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm transition-all cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
