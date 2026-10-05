"use client";

import React from "react";

export type NotchTab = "timer" | "tasks" | "calendar" | "clips";

interface NotchHeaderProps {
  activeTab: NotchTab;
  onSelectTab: (tab: NotchTab) => void;
  onStartDrag: (e: React.MouseEvent) => void;
  onOpenSettings: (e: React.MouseEvent) => void;
}

const TABS: { id: NotchTab; label: string }[] = [
  { id: "timer", label: "Timer" },
  { id: "tasks", label: "Tasks" },
  { id: "calendar", label: "Calendar" },
  { id: "clips", label: "Clips" },
];

export const NotchHeader: React.FC<NotchHeaderProps> = ({
  activeTab,
  onSelectTab,
  onStartDrag,
  onOpenSettings,
}) => {
  return (
    <div className="flex items-center justify-between shrink-0 w-full px-1">
      {/* Left: 6-Dot Drag Handle */}
      <button
        onMouseDown={onStartDrag}
        title="Drag to reposition"
        className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-850 cursor-grab active:cursor-grabbing transition-colors shrink-0"
      >
        <svg className="w-2.5 h-3.5 fill-current pointer-events-none" viewBox="0 0 24 24">
          <circle cx="7.5" cy="5.5" r="2.5" />
          <circle cx="16.5" cy="5.5" r="2.5" />
          <circle cx="7.5" cy="12" r="2.5" />
          <circle cx="16.5" cy="12" r="2.5" />
          <circle cx="7.5" cy="18.5" r="2.5" />
          <circle cx="16.5" cy="18.5" r="2.5" />
        </svg>
      </button>

      {/* Center: Clean Segmented Tabs (Timer, Tasks, Calendar, Clips) */}
      <div className="flex items-center p-0.5 rounded-full bg-zinc-900/90 border border-white/[0.06] gap-0.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full transition-all cursor-pointer leading-none ${
                isActive
                  ? "bg-zinc-800 text-white shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Right: Settings Icon Button */}
      <button
        onClick={onOpenSettings}
        title="Open Settings"
        className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-850 transition-colors cursor-pointer shrink-0"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </div>
  );
};
