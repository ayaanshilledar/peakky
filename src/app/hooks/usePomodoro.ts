"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type PomodoroMode = "focus" | "shortBreak" | "longBreak";

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
};

const SETTINGS_KEY = "peaky_pomodoro_settings";
const STATE_KEY = "peaky_pomodoro_state";
const CHANNEL_NAME = "peaky_pomodoro_channel";

export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.3); // D6

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  } catch (e) {
    console.error("Audio chime error:", e);
  }
}

export function usePomodoro() {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_POMODORO_SETTINGS);
  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_POMODORO_SETTINGS.focusMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const isBroadcastingRef = useRef<boolean>(false);

  const getDurationForMode = useCallback(
    (targetMode: PomodoroMode, currentSettings: PomodoroSettings): number => {
      switch (targetMode) {
        case "focus":
          return currentSettings.focusMinutes * 60;
        case "shortBreak":
          return currentSettings.shortBreakMinutes * 60;
        case "longBreak":
          return currentSettings.longBreakMinutes * 60;
      }
    },
    []
  );

  // Initialize from storage and setup BroadcastChannel
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      let parsedSettings = DEFAULT_POMODORO_SETTINGS;
      if (savedSettings) {
        parsedSettings = { ...DEFAULT_POMODORO_SETTINGS, ...JSON.parse(savedSettings) };
        setSettings(parsedSettings);
      }

      const savedState = localStorage.getItem(STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setMode(parsed.mode || "focus");
        setTimeLeft(typeof parsed.timeLeft === "number" ? parsed.timeLeft : parsedSettings.focusMinutes * 60);
        setIsRunning(Boolean(parsed.isRunning));
        setCompletedSessions(parsed.completedSessions || 0);
      } else {
        setTimeLeft(parsedSettings.focusMinutes * 60);
      }
    } catch (e) {
      console.error("Failed to load pomodoro storage:", e);
    }

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (!event.data) return;
        isBroadcastingRef.current = true;
        const { type, payload } = event.data;
        if (type === "SYNC_STATE") {
          setMode(payload.mode);
          setTimeLeft(payload.timeLeft);
          setIsRunning(payload.isRunning);
          setCompletedSessions(payload.completedSessions);
          if (payload.settings) {
            setSettings(payload.settings);
          }
        } else if (type === "SYNC_SETTINGS") {
          setSettings(payload);
        }
        setTimeout(() => {
          isBroadcastingRef.current = false;
        }, 50);
      };

      return () => {
        channel.close();
      };
    }
  }, []);

  // Broadcast state updates
  const broadcastState = useCallback(
    (newState: {
      mode: PomodoroMode;
      timeLeft: number;
      isRunning: boolean;
      completedSessions: number;
      settings: PomodoroSettings;
    }) => {
      try {
        localStorage.setItem(
          STATE_KEY,
          JSON.stringify({
            mode: newState.mode,
            timeLeft: newState.timeLeft,
            isRunning: newState.isRunning,
            completedSessions: newState.completedSessions,
          })
        );
        if (channelRef.current && !isBroadcastingRef.current) {
          channelRef.current.postMessage({
            type: "SYNC_STATE",
            payload: newState,
          });
        }
      } catch (e) {
        console.error("Failed to broadcast state:", e);
      }
    },
    []
  );

  // Timer tick interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer completed
            if (settings.soundEnabled) {
              playNotificationChime();
            }

            let nextMode: PomodoroMode = "focus";
            let nextSessions = completedSessions;
            let shouldAutoStart = false;

            if (mode === "focus") {
              nextSessions = completedSessions + 1;
              setCompletedSessions(nextSessions);
              if (nextSessions % settings.longBreakInterval === 0) {
                nextMode = "longBreak";
              } else {
                nextMode = "shortBreak";
              }
              shouldAutoStart = settings.autoStartBreaks;
            } else {
              nextMode = "focus";
              shouldAutoStart = settings.autoStartFocus;
            }

            const nextDuration = getDurationForMode(nextMode, settings);
            setMode(nextMode);
            setIsRunning(shouldAutoStart);

            broadcastState({
              mode: nextMode,
              timeLeft: nextDuration,
              isRunning: shouldAutoStart,
              completedSessions: nextSessions,
              settings,
            });

            return nextDuration;
          }

          const updated = prev - 1;
          broadcastState({
            mode,
            timeLeft: updated,
            isRunning: true,
            completedSessions,
            settings,
          });
          return updated;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, mode, settings, completedSessions, getDurationForMode, broadcastState]);

  const startTimer = useCallback(() => {
    setIsRunning(true);
    broadcastState({
      mode,
      timeLeft,
      isRunning: true,
      completedSessions,
      settings,
    });
  }, [mode, timeLeft, completedSessions, settings, broadcastState]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    broadcastState({
      mode,
      timeLeft,
      isRunning: false,
      completedSessions,
      settings,
    });
  }, [mode, timeLeft, completedSessions, settings, broadcastState]);

  const toggleTimer = useCallback(() => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    broadcastState({
      mode,
      timeLeft,
      isRunning: nextRunning,
      completedSessions,
      settings,
    });
  }, [isRunning, mode, timeLeft, completedSessions, settings, broadcastState]);

  const resetTimer = useCallback(() => {
    const duration = getDurationForMode(mode, settings);
    setIsRunning(false);
    setTimeLeft(duration);
    broadcastState({
      mode,
      timeLeft: duration,
      isRunning: false,
      completedSessions,
      settings,
    });
  }, [mode, settings, getDurationForMode, completedSessions, broadcastState]);

  const switchMode = useCallback(
    (newMode: PomodoroMode) => {
      const duration = getDurationForMode(newMode, settings);
      setMode(newMode);
      setIsRunning(false);
      setTimeLeft(duration);
      broadcastState({
        mode: newMode,
        timeLeft: duration,
        isRunning: false,
        completedSessions,
        settings,
      });
    },
    [settings, getDurationForMode, completedSessions, broadcastState]
  );

  const skipTimer = useCallback(() => {
    let nextMode: PomodoroMode = "focus";
    let nextSessions = completedSessions;

    if (mode === "focus") {
      nextSessions = completedSessions + 1;
      setCompletedSessions(nextSessions);
      nextMode = nextSessions % settings.longBreakInterval === 0 ? "longBreak" : "shortBreak";
    } else {
      nextMode = "focus";
    }

    const duration = getDurationForMode(nextMode, settings);
    setMode(nextMode);
    setIsRunning(false);
    setTimeLeft(duration);
    broadcastState({
      mode: nextMode,
      timeLeft: duration,
      isRunning: false,
      completedSessions: nextSessions,
      settings,
    });
  }, [mode, completedSessions, settings, getDurationForMode, broadcastState]);

  const updateSettings = useCallback(
    (newSettings: Partial<PomodoroSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
          if (channelRef.current) {
            channelRef.current.postMessage({
              type: "SYNC_SETTINGS",
              payload: updated,
            });
          }
        } catch (e) {
          console.error("Failed to save settings:", e);
        }

        // If not running, adjust timeLeft to match the current mode duration
        if (!isRunning) {
          const newDuration = getDurationForMode(mode, updated);
          setTimeLeft(newDuration);
        }

        return updated;
      });
    },
    [isRunning, mode, getDurationForMode]
  );

  const totalDuration = getDurationForMode(mode, settings);
  const progressPercent = totalDuration > 0 ? Math.max(0, Math.min(100, ((totalDuration - timeLeft) / totalDuration) * 100)) : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    mode,
    timeLeft,
    formattedTime: formatTime(timeLeft),
    isRunning,
    completedSessions,
    settings,
    progressPercent,
    startTimer,
    pauseTimer,
    toggleTimer,
    resetTimer,
    skipTimer,
    switchMode,
    updateSettings,
  };
}
