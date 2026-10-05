"use client";

import React, { useState, useEffect, useRef } from "react";
import { useFocusTimer } from "../hooks/useFocusTimer";
import { usePeakyStore } from "../hooks/usePeakyStore";
import { useCalendar } from "../hooks/useCalendar";
import { useClipboardStore } from "../hooks/useClipboardStore";
import {
  NotchHeader,
  NotchCollapsed,
  NotchTimerView,
  NotchTasksView,
  NotchCalendarView,
  NotchClipsView,
  NotchTab,
} from "./notch";

export default function MacNotch() {
  const [isHovered, setIsHovered] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [activeTab, setActiveTab] = useState<NotchTab>("tasks");
  const [clockTime, setClockTime] = useState("");

  const isDraggingRef = useRef(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    settings,
    formattedTime,
    isRunning,
    progressPercent,
    toggleTimer,
    resetTimer,
    updateSettings,
  } = useFocusTimer();

  const { tasks, addTask, toggleTask, deleteTask } = usePeakyStore();
  const { events, currentOrNextEvent, openMeeting } = useCalendar();

  const {
    items: clipItems,
    copiedId: copiedClipId,
    copyItem: copyClipItem,
    deleteItem: deleteClipItem,
  } = useClipboardStore();

  // Clock interval
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockTime(
        now.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Global Escape key listener to close/blur
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsInputFocused(false);
        setIsEditingTimer(false);
        setIsHovered(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Restore saved horizontal notch position on launch
  useEffect(() => {
    try {
      const savedX = localStorage.getItem("peaky_notch_x");
      if (savedX !== null) {
        const x = parseInt(savedX, 10);
        if (!isNaN(x)) {
          import("@tauri-apps/api/core").then(({ invoke }) => {
            invoke("set_notch_x", { x }).catch(console.error);
          });
        }
      }
    } catch (e) {
      console.error("Failed to restore notch position:", e);
    }
  }, []);

  // Snappy hover management with crisp 150ms exit delay
  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      if (!isInputFocused && !isEditingTimer) {
        setIsHovered(false);
      }
    }, 150);
  };

  // Horizontal screen slide drag handler (locks Y = 0 to top bezel)
  const handleStartDrag = async (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    e.preventDefault();
    isDraggingRef.current = true;

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const initialWinX = await invoke<number>("get_notch_x");
      const startMouseX = e.screenX;

      let latestX = initialWinX;
      let rafId: number | null = null;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const deltaX = moveEvent.screenX - startMouseX;
        latestX = initialWinX + deltaX;

        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            invoke("set_notch_x", { x: latestX }).catch(console.error);
            rafId = null;
          });
        }
      };

      const onMouseUp = () => {
        isDraggingRef.current = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        try {
          localStorage.setItem("peaky_notch_x", latestX.toString());
        } catch {}
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    } catch (err) {
      console.error("Failed to initiate slide drag:", err);
    }
  };

  const handleOpenSettings = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("open_settings");
    } catch (err) {
      console.error("Failed to open settings:", err);
    }
  };

  const isExpanded = isHovered || isInputFocused || isEditingTimer;

  // Imminent / Live Event Detection for Compact Pill Sizing
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

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center select-none m-0 p-0 font-sans antialiased">
      {/* Dynamic Island Morphing Capsule */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative bg-black text-white rounded-b-[22px] rounded-t-none border-b border-x border-white/[0.08] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden flex flex-col justify-between ${
          isExpanded
            ? activeTab === "timer"
              ? "w-[340px] h-[130px] pt-2 px-3 pb-3"
              : activeTab === "tasks"
              ? tasks.length === 0
                ? "w-[340px] h-[150px] pt-2 px-3 pb-3"
                : "w-[340px] h-[195px] pt-2 px-3 pb-3"
              : activeTab === "calendar"
              ? "w-[420px] h-[230px] pt-2 px-3.5 pb-3.5"
              : activeTab === "clips"
              ? clipItems.length === 0
                ? "w-[340px] h-[150px] pt-2 px-3 pb-3"
                : "w-[340px] h-[195px] pt-2 px-3 pb-3"
              : "w-[340px] h-[130px] pt-2 px-3 pb-3"
            : isRunning
            ? "w-[195px] h-[34px] px-3.5 flex items-center justify-between"
            : isEventLive || isEventSoon
            ? "w-[225px] h-[34px] px-3.5 flex items-center justify-between"
            : "w-[175px] h-[34px] px-3.5 flex items-center justify-between"
        }`}
      >
        {/* Compact / Collapsed Pill View */}
        {!isExpanded ? (
          <NotchCollapsed
            isRunning={isRunning}
            formattedTime={formattedTime}
            clockTime={clockTime}
            currentOrNextEvent={currentOrNextEvent}
            onStartDrag={handleStartDrag}
          />
        ) : (
          /* Expanded Island View */
          <div className="w-full h-full flex flex-col justify-between animate-in fade-in duration-150">
            <NotchHeader
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              onStartDrag={handleStartDrag}
              onOpenSettings={handleOpenSettings}
            />

            {activeTab === "timer" && (
              <NotchTimerView
                settings={settings}
                formattedTime={formattedTime}
                isRunning={isRunning}
                progressPercent={progressPercent}
                toggleTimer={toggleTimer}
                resetTimer={resetTimer}
                updateSettings={updateSettings}
                onEditingChange={setIsEditingTimer}
              />
            )}

            {activeTab === "tasks" && (
              <NotchTasksView
                tasks={tasks}
                addTask={addTask}
                toggleTask={toggleTask}
                deleteTask={deleteTask}
                onInputFocusChange={setIsInputFocused}
              />
            )}

            {activeTab === "calendar" && (
              <NotchCalendarView
                events={events}
                openMeeting={openMeeting}
                onOpenSettings={handleOpenSettings}
              />
            )}

            {activeTab === "clips" && (
              <NotchClipsView
                clipItems={clipItems}
                copiedClipId={copiedClipId}
                copyClipItem={copyClipItem}
                deleteClipItem={deleteClipItem}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
