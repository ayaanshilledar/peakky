"use client";

import React from "react";
import { SystemHUDState } from "../../hooks/useSystemOSD";

interface NotchOSDPillProps {
  hud: SystemHUDState;
}

export const NotchOSDPill: React.FC<NotchOSDPillProps> = ({ hud }) => {
  const isVolume = hud.type === "volume";
  const isMuted = hud.isMuted || (isVolume && hud.value === 0);

  return (
    <div className="w-full h-full flex items-center justify-between px-3.5 gap-3 animate-in fade-in zoom-in-95 duration-150">
      {/* Icon */}
      <div className="shrink-0 text-zinc-200 flex items-center justify-center">
        {isVolume ? (
          isMuted ? (
            <svg className="w-4 h-4 text-rose-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : hud.value > 50 ? (
            <svg className="w-4 h-4 text-zinc-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-zinc-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )
        ) : (
          /* Brightness Sun Icon */
          <svg className="w-4 h-4 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </div>

      {/* Modern Capsule Track */}
      <div className="flex-1 h-2 rounded-full bg-zinc-850/90 overflow-hidden relative border border-white/[0.08] shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-150 ease-out ${
            isMuted
              ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
              : isVolume
              ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.3)]"
              : "bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.4)]"
          }`}
          style={{ width: `${isMuted ? 0 : Math.max(2, hud.value)}%` }}
        />
      </div>

      {/* Percentage Readout */}
      <span className="text-[11px] font-mono font-semibold text-zinc-200 w-9 text-right shrink-0 tabular-nums">
        {isMuted ? "Mute" : `${hud.value}%`}
      </span>
    </div>
  );
};

