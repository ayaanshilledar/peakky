"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface FocusSettings {
  focusMinutes: number;
  soundEnabled: boolean;
}

export const DEFAULT_FOCUS_SETTINGS: FocusSettings = {
  focusMinutes: 25,
  soundEnabled: true,
};

const SETTINGS_KEY = "peaky_focus_settings";
const STATE_KEY = "peaky_focus_state";
const CHANNEL_NAME = "peaky_focus_channel";

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

export function useFocusTimer() {
  const [settings, setSettings] = useState<FocusSettings>(DEFAULT_FOCUS_SETTINGS);
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_FOCUS_SETTINGS.focusMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const isBroadcastingRef = useRef<boolean>(false);

  // Load initial settings & state
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      let parsedSettings = DEFAULT_FOCUS_SETTINGS;
      if (savedSettings) {
        parsedSettings = { ...DEFAULT_FOCUS_SETTINGS, ...JSON.parse(savedSettings) };
        setSettings(parsedSettings);
      }

      const savedState = localStorage.getItem(STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setTimeLeft(typeof parsed.timeLeft === "number" ? parsed.timeLeft : parsedSettings.focusMinutes * 60);
        setIsRunning(Boolean(parsed.isRunning));
      } else {
        setTimeLeft(parsedSettings.focusMinutes * 60);
      }
    } catch (e) {
      console.error("Failed to load focus timer storage:", e);
    }

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (!event.data) return;
        isBroadcastingRef.current = true;
        const { type, payload } = event.data;
        if (type === "SYNC_STATE") {
          setTimeLeft(payload.timeLeft);
          setIsRunning(payload.isRunning);
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

  const broadcastState = useCallback(
    (newState: { timeLeft: number; isRunning: boolean; settings: FocusSettings }) => {
      try {
        localStorage.setItem(
          STATE_KEY,
          JSON.stringify({
            timeLeft: newState.timeLeft,
            isRunning: newState.isRunning,
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

  // Tick interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (settings.soundEnabled) {
              playNotificationChime();
            }
            const resetDuration = settings.focusMinutes * 60;
            setIsRunning(false);
            broadcastState({
              timeLeft: resetDuration,
              isRunning: false,
              settings,
            });
            return resetDuration;
          }

          const updated = prev - 1;
          broadcastState({
            timeLeft: updated,
            isRunning: true,
            settings,
          });
          return updated;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, settings, broadcastState]);

  const toggleTimer = useCallback(() => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    broadcastState({
      timeLeft,
      isRunning: nextRunning,
      settings,
    });
  }, [isRunning, timeLeft, settings, broadcastState]);

  const resetTimer = useCallback(() => {
    const duration = settings.focusMinutes * 60;
    setIsRunning(false);
    setTimeLeft(duration);
    broadcastState({
      timeLeft: duration,
      isRunning: false,
      settings,
    });
  }, [settings, broadcastState]);

  const updateSettings = useCallback(
    (newSettings: Partial<FocusSettings>) => {
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
          console.error("Failed to save focus settings:", e);
        }

        if (!isRunning && newSettings.focusMinutes !== undefined) {
          const newDuration = newSettings.focusMinutes * 60;
          setTimeLeft(newDuration);
        }

        return updated;
      });
    },
    [isRunning]
  );

  const totalDuration = settings.focusMinutes * 60;
  const progressPercent = totalDuration > 0 ? Math.max(0, Math.min(100, ((totalDuration - timeLeft) / totalDuration) * 100)) : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    timeLeft,
    formattedTime: formatTime(timeLeft),
    isRunning,
    settings,
    progressPercent,
    toggleTimer,
    resetTimer,
    updateSettings,
  };
}
