"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { parseReminderInput, ParsedReminderResult } from "../utils/reminderParser";
import { playNotificationChime } from "./useFocusTimer";

export interface ReminderItem {
  id: string;
  title: string;
  targetTime: number; // ms timestamp
  createdAt: number;
  status: "active" | "triggered" | "snoozed" | "dismissed";
  snoozedUntil?: number;
  originalInput: string;
}

const REMINDERS_KEY = "peaky_reminders_store";
const CHANNEL_NAME = "peaky_reminders_sync_channel";

/**
 * Sends a native desktop notification if Tauri or Web Notification API is available.
 */
async function sendDesktopNotification(title: string, body: string) {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          new Notification(title, { body });
        }
      });
    }
  }
}

export function useReminderStore() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [activeAlarm, setActiveAlarm] = useState<ReminderItem | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isBroadcastingRef = useRef<boolean>(false);

  // Load from localStorage and initialize BroadcastChannel
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMINDERS_KEY);
      if (saved) {
        setReminders(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load reminders store:", e);
    }

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (!event.data) return;
        isBroadcastingRef.current = true;
        const { type, payload } = event.data;
        if (type === "SYNC_REMINDERS") {
          setReminders(payload);
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

  const broadcastReminders = useCallback((updated: ReminderItem[]) => {
    try {
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
      if (channelRef.current && !isBroadcastingRef.current) {
        channelRef.current.postMessage({
          type: "SYNC_REMINDERS",
          payload: updated,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Ticker loop checking due reminders every 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let hasChanges = false;
      let newlyTriggered: ReminderItem | null = null;

      setReminders((prev) => {
        const updated = prev.map((item) => {
          if ((item.status === "active" || item.status === "snoozed") && item.targetTime <= now) {
            hasChanges = true;
            newlyTriggered = { ...item, status: "triggered" as const };
            return newlyTriggered;
          }
          return item;
        });

        if (hasChanges) {
          broadcastReminders(updated);
        }
        return updated;
      });

      if (newlyTriggered) {
        setActiveAlarm(newlyTriggered);
        playNotificationChime();
        sendDesktopNotification("🔔 Peaky Reminder", (newlyTriggered as ReminderItem).title);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [broadcastReminders]);

  // Add reminder via string input or explicit details
  const addReminder = useCallback(
    (input: string): ParsedReminderResult => {
      const parsed = parseReminderInput(input);
      if (!parsed.isReminder) return parsed;

      const newItem: ReminderItem = {
        id: "rem_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        title: parsed.title,
        targetTime: parsed.targetTime,
        createdAt: Date.now(),
        status: "active",
        originalInput: parsed.originalInput,
      };

      setReminders((prev) => {
        const updated = [newItem, ...prev];
        broadcastReminders(updated);
        return updated;
      });

      return parsed;
    },
    [broadcastReminders]
  );

  const snoozeReminder = useCallback(
    (id: string, minutes: number) => {
      const snoozeMs = minutes * 60 * 1000;
      const newTarget = Date.now() + snoozeMs;

      setReminders((prev) => {
        const updated = prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "snoozed" as const,
                targetTime: newTarget,
                snoozedUntil: newTarget,
              }
            : item
        );
        broadcastReminders(updated);
        return updated;
      });

      setActiveAlarm(null);
    },
    [broadcastReminders]
  );

  const dismissReminder = useCallback(
    (id: string) => {
      setReminders((prev) => {
        const updated = prev.map((item) =>
          item.id === id ? { ...item, status: "dismissed" as const } : item
        );
        broadcastReminders(updated);
        return updated;
      });

      if (activeAlarm?.id === id) {
        setActiveAlarm(null);
      }
    },
    [activeAlarm, broadcastReminders]
  );

  const deleteReminder = useCallback(
    (id: string) => {
      setReminders((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        broadcastReminders(updated);
        return updated;
      });

      if (activeAlarm?.id === id) {
        setActiveAlarm(null);
      }
    },
    [activeAlarm, broadcastReminders]
  );

  // Filter active and upcoming reminders
  const activeReminders = reminders.filter(
    (r) => r.status === "active" || r.status === "snoozed"
  );
  
  // Imminent reminder (closest target time in future)
  const imminentReminder = activeReminders.length > 0
    ? [...activeReminders].sort((a, b) => a.targetTime - b.targetTime)[0]
    : null;

  return {
    reminders,
    activeReminders,
    imminentReminder,
    activeAlarm,
    addReminder,
    snoozeReminder,
    dismissReminder,
    deleteReminder,
    setActiveAlarm,
  };
}
