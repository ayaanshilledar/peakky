"use client";

import React, { useState, useEffect, useRef } from "react";
import { useFocusTimer } from "../hooks/useFocusTimer";
import { usePeakyStore } from "../hooks/usePeakyStore";
import { useCalendar } from "../hooks/useCalendar";
import { useClipboardStore } from "../hooks/useClipboardStore";
import { useMedia } from "../hooks/useMedia";
import { useChatMemoryStore } from "../hooks/useChatMemoryStore";
import { PeakyAppContext } from "../types/chat";
import { useFeatureFlags } from "../hooks/useFeatureFlags";
import { FeatureFlagKey } from "../utils/featureFlags";
import { useReminderStore } from "../hooks/useReminderStore";
import { useSystemOSD } from "../hooks/useSystemOSD";
import { useVoiceDictation } from "../hooks/useVoiceDictation";
import {
  NotchHeader,
  NotchCollapsed,
  NotchTimerView,
  NotchTasksView,
  NotchCalendarView,
  NotchClipsView,
  NotchMediaView,
  NotchChatView,
  NotchSystemView,
  NotchHomeView,
  NotchAlarmAlert,
  NotchTab,
  getNotchCapsuleClasses,
} from "./notch";

export default function MacNotch() {
  const { isFeatureEnabled } = useFeatureFlags();
  const [isHovered, setIsHovered] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [timerSubTab, setTimerSubTab] = useState<"focus" | "reminders">("focus");
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [activeTab, setActiveTab] = useState<NotchTab>("home");
  const [clockTime, setClockTime] = useState("");

  const isDraggingRef = useRef(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fallback active tab if current tab is disabled by feature flag
  useEffect(() => {
    if (!isFeatureEnabled(activeTab as FeatureFlagKey)) {
      const availableTabs: NotchTab[] = ["home", "tasks", "timer", "calendar", "clips", "media", "chat"];
      const firstEnabled = availableTabs.find((t) => isFeatureEnabled(t as FeatureFlagKey));
      if (firstEnabled) {
        setActiveTab(firstEnabled);
      }
    }
  }, [activeTab, isFeatureEnabled]);

  const {
    settings,
    formattedTime,
    isRunning,
    progressPercent,
    toggleTimer,
    resetTimer,
    updateSettings,
  } = useFocusTimer();

  const {
    imminentReminder,
    activeAlarm,
    snoozeReminder,
    dismissReminder,
  } = useReminderStore();

  const { activeHUD } = useSystemOSD();

  const {
    tasks,
    notes,
    profileName,
    addTask,
    toggleTask,
    deleteTask,
    clearCompletedTasks,
    addNote,
    deleteNote,
  } = usePeakyStore();
  const { events, todayEvents, currentOrNextEvent, openMeeting } = useCalendar();

  const {
    items: clipItems,
    copiedId: copiedClipId,
    copyItem: copyClipItem,
    deleteItem: deleteClipItem,
  } = useClipboardStore();

  const {
    media,
    togglePlayPause,
    skipNext,
    skipPrevious,
    seek,
  } = useMedia();

  const {
    messages: chatMessages,
    longTermMemories,
    aiSettings,
    isGenerating: isChatGenerating,
    sendMessage: sendChatMessage,
    addMemory: addChatMemory,
    deleteMemory: deleteChatMemory,
    clearMessages: clearChatMessages,
  } = useChatMemoryStore();

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const appContext: PeakyAppContext = {
    timer: {
      isRunning,
      formattedTime,
      progressPercent,
    },
    tasks: {
      total: tasks.length,
      activeCount: activeTasks.length,
      activeTitles: activeTasks.map((t) => t.text),
      completedCount: completedTasks.length,
    },
    calendar: {
      hasEvents: events.length > 0,
      currentOrNextEventTitle: currentOrNextEvent?.title,
      currentOrNextEventTime: currentOrNextEvent?.start
        ? new Date(currentOrNextEvent.start).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })
        : undefined,
      eventCount: events.length,
    },
    clips: {
      totalClips: clipItems.length,
      recentClips: clipItems.slice(0, 3).map((item) => ({
        text: item.content || item.type,
        type: item.type,
        time: typeof item.timestamp === "number" ? new Date(item.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : String(item.timestamp),
      })),
    },
  };

  const handleSendChatMessage = (content: string, context: PeakyAppContext) => {
    sendChatMessage(content, context, {
      onCreateTask: (title) => {
        if (title) addTask(title);
      },
      onCompleteTask: (titleQuery) => {
        const query = (titleQuery || "").toLowerCase();
        const target = tasks.find(
          (t) => !t.completed && t.text.toLowerCase().includes(query)
        );
        if (target) {
          toggleTask(target.id);
        }
      },
      onDeleteTask: (titleQuery) => {
        const query = (titleQuery || "").toLowerCase();
        const target = tasks.find((t) =>
          t.text.toLowerCase().includes(query)
        );
        if (target) {
          deleteTask(target.id);
        }
      },
      onClearCompletedTasks: () => {
        clearCompletedTasks();
      },
      onStartTimer: (durationMinutes) => {
        updateSettings({ focusMinutes: durationMinutes });
        resetTimer();
        if (!isRunning) toggleTimer();
      },
      onPauseTimer: () => {
        if (isRunning) toggleTimer();
      },
      onResetTimer: () => {
        resetTimer();
      },
      onSaveMemory: (fact) => {
        if (fact) addChatMemory(fact);
      },
    });
  };

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

  const [dictationSuccess, setDictationSuccess] = useState(false);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isRecording: isDictating,
    isTranscribing,
    audioLevel,
    lastTranscribedText,
    startRecording,
    stopRecording,
  } = useVoiceDictation(async (text) => {
    console.log("[MacNotch] 📋 Dictation success callback triggered with text:", text);
    // Copy into clipboard
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("copy_to_clipboard", {
        content: text,
        itemType: "text",
      });
      console.log("[MacNotch] ✓ Invoked Tauri copy_to_clipboard successfully");
    } catch (tauriErr) {
      console.warn("[MacNotch] ⚠️ Tauri invoke failed, falling back to navigator.clipboard:", tauriErr);
      try {
        await navigator.clipboard.writeText(text);
        console.log("[MacNotch] ✓ Browser navigator.clipboard.writeText successful");
      } catch (clipErr) {
        console.error("[MacNotch] ❌ All clipboard copy methods failed:", clipErr);
      }
    }

    setDictationSuccess(true);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => {
      setDictationSuccess(false);
    }, 3000);
  });

  // Global Escape & Ctrl+N hotkey listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsInputFocused(false);
        setIsEditingTimer(false);
        setIsHovered(false);
        return;
      }

      // Ctrl + N or Cmd + N Voice Dictation Trigger
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        console.log("[MacNotch] ⌨️ Ctrl+N shortcut pressed! Current isDictating:", isDictating);
        if (isDictating) {
          stopRecording();
        } else {
          startRecording();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDictating, startRecording, stopRecording]);

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
  const isMediaActive = Boolean(media?.title);

  const capsuleClasses = getNotchCapsuleClasses({
    activeAlarm: Boolean(activeAlarm),
    isExpanded,
    activeTab,
    timerSubTab,
    tasksCount: tasks.length,
    clipsCount: clipItems.length,
    isMediaActive,
    activeHUD: Boolean(activeHUD),
    imminentReminder: Boolean(imminentReminder),
    isRunning,
    isEventLiveOrSoon: Boolean(isEventLive || isEventSoon),
    isDictating,
    dictationSuccess,
  });

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center select-none m-0 p-0 font-sans antialiased">
      {/* Dynamic Island Morphing Capsule */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative bg-black text-white rounded-b-[22px] rounded-t-none border-b border-x border-white/[0.08] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden flex flex-col justify-between ${capsuleClasses}`}
      >
        {/* Alarm Alert View or Collapsed/Expanded Views */}
        {activeAlarm ? (
          <NotchAlarmAlert
            alarm={activeAlarm}
            onSnooze={snoozeReminder}
            onDismiss={dismissReminder}
          />
        ) : !isExpanded ? (
          <NotchCollapsed
            isRunning={isRunning}
            formattedTime={formattedTime}
            clockTime={clockTime}
            currentOrNextEvent={currentOrNextEvent}
            media={media}
            imminentReminder={imminentReminder}
            activeHUD={activeHUD}
            isDictating={isDictating}
            isTranscribing={isTranscribing}
            audioLevel={audioLevel}
            dictationSuccess={dictationSuccess}
            lastDictatedText={lastTranscribedText}
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

            {activeTab === "home" && (
              <NotchHomeView
                tasks={tasks}
                notes={notes}
                addTask={addTask}
                toggleTask={toggleTask}
                deleteTask={deleteTask}
                addNote={addNote}
                deleteNote={deleteNote}
                onSelectTab={setActiveTab}
                currentOrNextEvent={currentOrNextEvent}
                todayEvents={todayEvents}
                events={events}
                profileName={profileName}
                openMeeting={openMeeting}
                timerState={{
                  isRunning,
                  formattedTime,
                  toggleTimer,
                }}
                onInputFocusChange={setIsInputFocused}
              />
            )}

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
                onSubTabChange={setTimerSubTab}
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

            {activeTab === "media" && (
              <NotchMediaView
                media={media}
                togglePlayPause={togglePlayPause}
                skipNext={skipNext}
                skipPrevious={skipPrevious}
                seek={seek}
              />
            )}

            {activeTab === "system" && (
              <NotchSystemView />
            )}

            {activeTab === "chat" && (
              <NotchChatView
                messages={chatMessages}
                longTermMemories={longTermMemories}
                aiSettings={aiSettings}
                isGenerating={isChatGenerating}
                onSendMessage={handleSendChatMessage}
                onAddMemory={addChatMemory}
                onDeleteMemory={deleteChatMemory}
                onClearMessages={clearChatMessages}
                onInputFocusChange={setIsInputFocused}
                appContext={appContext}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

