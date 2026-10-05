"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

export interface NoteItem {
  id: string;
  text: string;
  createdAt: number;
}

const TASKS_KEY = "peaky_tasks_store";
const NOTES_KEY = "peaky_notes_store";
const PROFILE_KEY = "peaky_profile_name";
const CHANNEL_NAME = "peaky_store_sync_channel";

export function usePeakyStore() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [profileName, setProfileNameState] = useState<string>("Ayaan Shilledar");
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isBroadcastingRef = useRef<boolean>(false);

  // Initialize from localStorage and set up BroadcastChannel
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(TASKS_KEY);
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
      const savedNotes = localStorage.getItem(NOTES_KEY);
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (savedProfile) {
        setProfileNameState(savedProfile);
      }
    } catch (e) {
      console.error("Failed to load Peaky store:", e);
    }

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (!event.data) return;
        isBroadcastingRef.current = true;
        const { type, payload } = event.data;
        if (type === "SYNC_TASKS") {
          setTasks(payload);
        } else if (type === "SYNC_NOTES") {
          setNotes(payload);
        } else if (type === "SYNC_PROFILE") {
          setProfileNameState(payload);
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

  const setProfileName = useCallback((name: string) => {
    const trimmed = name.trim() || "Ayaan Shilledar";
    setProfileNameState(trimmed);
    try {
      localStorage.setItem(PROFILE_KEY, trimmed);
      if (channelRef.current && !isBroadcastingRef.current) {
        channelRef.current.postMessage({
          type: "SYNC_PROFILE",
          payload: trimmed,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Broadcast helper
  const broadcastTasks = useCallback((updatedTasks: TaskItem[]) => {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(updatedTasks));
      if (channelRef.current && !isBroadcastingRef.current) {
        channelRef.current.postMessage({
          type: "SYNC_TASKS",
          payload: updatedTasks,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const broadcastNotes = useCallback((updatedNotes: NoteItem[]) => {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(updatedNotes));
      if (channelRef.current && !isBroadcastingRef.current) {
        channelRef.current.postMessage({
          type: "SYNC_NOTES",
          payload: updatedNotes,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Task Actions
  const addTask = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const newTask: TaskItem = {
        id: "task_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        text: trimmed,
        completed: false,
        createdAt: Date.now(),
      };
      setTasks((prev) => {
        const updated = [newTask, ...prev];
        broadcastTasks(updated);
        return updated;
      });
    },
    [broadcastTasks]
  );

  const toggleTask = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const updated = prev.map((task) =>
          task.id === id
            ? {
                ...task,
                completed: !task.completed,
                completedAt: !task.completed ? Date.now() : undefined,
              }
            : task
        );
        broadcastTasks(updated);
        return updated;
      });
    },
    [broadcastTasks]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const updated = prev.filter((task) => task.id !== id);
        broadcastTasks(updated);
        return updated;
      });
    },
    [broadcastTasks]
  );

  const clearCompletedTasks = useCallback(() => {
    setTasks((prev) => {
      const updated = prev.filter((task) => !task.completed);
      broadcastTasks(updated);
      return updated;
    });
  }, [broadcastTasks]);

  // Note Actions
  const addNote = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const newNote: NoteItem = {
        id: "note_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        text: trimmed,
        createdAt: Date.now(),
      };
      setNotes((prev) => {
        const updated = [newNote, ...prev];
        broadcastNotes(updated);
        return updated;
      });
    },
    [broadcastNotes]
  );

  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const updated = prev.filter((note) => note.id !== id);
        broadcastNotes(updated);
        return updated;
      });
    },
    [broadcastNotes]
  );

  return {
    tasks,
    activeTasks: tasks.filter((t) => !t.completed),
    completedTasks: tasks.filter((t) => t.completed),
    notes,
    profileName,
    setProfileName,
    addTask,
    toggleTask,
    deleteTask,
    clearCompletedTasks,
    addNote,
    deleteNote,
  };
}
