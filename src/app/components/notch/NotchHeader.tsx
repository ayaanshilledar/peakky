"use client";

import React, { useState } from "react";
import { useFeatureFlags } from "../../hooks/useFeatureFlags";
import { FeatureFlagKey } from "../../utils/featureFlags";

export type NotchTab = "home" | "timer" | "tasks" | "calendar" | "clips" | "media" | "system" | "chat";

interface NotchHeaderProps {
  activeTab: NotchTab;
  onSelectTab: (tab: NotchTab) => void;
  onStartDrag: (e: React.MouseEvent) => void;
  onOpenSettings: (e: React.MouseEvent) => void;
}

interface TabConfig {
  id: NotchTab;
  label: string;
  flag: FeatureFlagKey;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  {
    id: "home",
    label: "Home",
    flag: "home",
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "timer",
    label: "Timer",
    flag: "timer",
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
    ),
  },
  {
    id: "tasks",
    label: "Tasks",
    flag: "tasks",
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    id: "calendar",
    label: "Calendar",
    flag: "calendar",
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: "clips",
    label: "Clips",
    flag: "clips",
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
  },
  {
    id: "media",
    label: "Media",
    flag: "media",
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    id: "system",
    label: "System",
    flag: "systemOSD",
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    id: "chat",
    label: "AI",
    flag: "chat",
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4 21l3.57-.93A8.932 8.932 0 0 0 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z" />
      </svg>
    ),
  },
];

export const NotchHeader: React.FC<NotchHeaderProps> = ({
  activeTab,
  onSelectTab,
  onStartDrag,
  onOpenSettings,
}) => {
  const { isFeatureEnabled } = useFeatureFlags();
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  const visibleTabs = TABS.filter((tab) => isFeatureEnabled(tab.flag));

  return (
    <div className="relative flex items-center justify-between shrink-0 w-full px-1">
      {/* Left: 6-Dot Drag Handle Button */}
      <button
        onMouseDown={onStartDrag}
        onMouseEnter={() => setHoveredTooltip("Drag to reposition")}
        onMouseLeave={() => setHoveredTooltip(null)}
        className="w-7 h-7 rounded-full bg-zinc-900/90 border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 cursor-grab active:cursor-grabbing transition-all shrink-0 shadow-sm backdrop-blur-md"
      >
        <svg className="w-2.5 h-3.5 fill-current pointer-events-none" viewBox="0 0 24 24">
          <circle cx="7.5" cy="5.5" r="2.2" />
          <circle cx="16.5" cy="5.5" r="2.2" />
          <circle cx="7.5" cy="12" r="2.2" />
          <circle cx="16.5" cy="12" r="2.2" />
          <circle cx="7.5" cy="18.5" r="2.2" />
          <circle cx="16.5" cy="18.5" r="2.2" />
        </svg>
      </button>

      {/* Center: Premium Segmented Icon Bar */}
      <div className="flex items-center p-1 rounded-full bg-zinc-900/90 border border-white/[0.08] gap-1 overflow-x-auto no-scrollbar shadow-inner backdrop-blur-xl">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              onMouseEnter={() => setHoveredTooltip(tab.label)}
              onMouseLeave={() => setHoveredTooltip(null)}
              className={`w-7 h-7 rounded-full transition-all duration-200 ease-out cursor-pointer flex items-center justify-center shrink-0 ${
                isActive
                  ? "bg-zinc-800 text-white shadow-sm border border-white/10 ring-1 ring-white/10 scale-105"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]"
              }`}
            >
              {tab.icon}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Settings Button */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onOpenSettings}
          onMouseEnter={() => setHoveredTooltip("Settings")}
          onMouseLeave={() => setHoveredTooltip(null)}
          className="w-7 h-7 rounded-full bg-zinc-900/90 border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer shadow-sm backdrop-blur-md"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Custom Smooth Micro Tooltip Floating Overlay */}
      {hoveredTooltip && (
        <div className="absolute top-9 left-1/2 -translate-x-1/2 z-50 pointer-events-none max-w-[340px]">
          <div className="bg-zinc-900/95 text-white text-[10px] font-medium px-2.5 py-1 rounded-md border border-white/10 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 text-center leading-tight">
            {hoveredTooltip}
          </div>
        </div>
      )}
    </div>
  );
};
