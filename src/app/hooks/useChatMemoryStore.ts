"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChatMessage,
  LongTermMemory,
  AISettings,
  PeakyAppContext,
  ChatApiRequestPayload,
  ChatApiResponsePayload,
} from "../types/chat";

const CHAT_MESSAGES_KEY = "peaky_chat_messages_v2";
const LONG_TERM_MEMORY_KEY = "peaky_chat_memory_v2";
const AI_SETTINGS_KEY = "peaky_ai_settings_v2";
const SYNC_CHANNEL_NAME = "peaky_chat_sync_channel";

const DEFAULT_SETTINGS: AISettings = {
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "auto",
  systemPromptExtra: "",
  autoSaveMemories: true,
};

export function useChatMemoryStore() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [longTermMemories, setLongTermMemories] = useState<LongTermMemory[]>([]);
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [isGenerating, setIsGenerating] = useState(false);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const isBroadcastingRef = useRef<boolean>(false);

  // Initialize state from LocalStorage and setup BroadcastChannel
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_MESSAGES_KEY);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed)) setMessages(parsed);
      }

      const savedMemories = localStorage.getItem(LONG_TERM_MEMORY_KEY);
      if (savedMemories) {
        const parsed = JSON.parse(savedMemories);
        if (Array.isArray(parsed)) setLongTermMemories(parsed);
      }

      const savedSettings = localStorage.getItem(AI_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        const cleanKey = parsed?.apiKey || "";
        setAiSettings((prev) => ({
          ...prev,
          ...parsed,
          apiKey: cleanKey,
        }));
      }
    } catch (e) {
      console.error("Failed to load chat/memory store:", e);
    }

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (!event.data) return;
        isBroadcastingRef.current = true;
        const { type, payload } = event.data;

        if (type === "SYNC_MESSAGES") {
          setMessages(payload);
        } else if (type === "SYNC_MEMORIES") {
          setLongTermMemories(payload);
        } else if (type === "SYNC_SETTINGS") {
          setAiSettings(payload);
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

  const broadcastState = useCallback((type: "SYNC_MESSAGES" | "SYNC_MEMORIES" | "SYNC_SETTINGS", payload: any) => {
    try {
      if (type === "SYNC_MESSAGES") {
        localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(payload));
      } else if (type === "SYNC_MEMORIES") {
        localStorage.setItem(LONG_TERM_MEMORY_KEY, JSON.stringify(payload));
      } else if (type === "SYNC_SETTINGS") {
        localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(payload));
      }

      if (channelRef.current && !isBroadcastingRef.current) {
        channelRef.current.postMessage({ type, payload });
      }
    } catch (e) {
      console.error("Failed to broadcast chat state:", e);
    }
  }, []);

  // Update AI Settings
  const updateAISettings = useCallback((newSettings: Partial<AISettings>) => {
    setAiSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      broadcastState("SYNC_SETTINGS", updated);
      return updated;
    });
  }, [broadcastState]);

  // Add Long-Term Memory
  const addMemory = useCallback((fact: string, category: LongTermMemory["category"] = "general") => {
    if (!fact.trim()) return;
    setLongTermMemories((prev) => {
      // Prevent duplicates
      if (prev.some((m) => m.fact.toLowerCase() === fact.trim().toLowerCase())) {
        return prev;
      }
      const newMemory: LongTermMemory = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        fact: fact.trim(),
        category,
        createdAt: Date.now(),
      };
      const updated = [newMemory, ...prev];
      broadcastState("SYNC_MEMORIES", updated);
      return updated;
    });
  }, [broadcastState]);

  // Delete Long-Term Memory
  const deleteMemory = useCallback((id: string) => {
    setLongTermMemories((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      broadcastState("SYNC_MEMORIES", updated);
      return updated;
    });
  }, [broadcastState]);

  // Clear Memories
  const clearMemories = useCallback(() => {
    setLongTermMemories([]);
    broadcastState("SYNC_MEMORIES", []);
  }, [broadcastState]);

  // Clear Messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    broadcastState("SYNC_MESSAGES", []);
  }, [broadcastState]);

  // Send Message to Next.js API
  const sendMessage = useCallback(
    async (
      content: string, 
      context: PeakyAppContext,
      toolHandlers?: {
        onCreateTask?: (title: string) => void;
        onCompleteTask?: (title: string) => void;
        onDeleteTask?: (title: string) => void;
        onClearCompletedTasks?: () => void;
        onStartTimer?: (durationMinutes: number) => void;
        onPauseTimer?: () => void;
        onResetTimer?: () => void;
        onSaveMemory?: (fact: string) => void;
      }
    ) => {
      if (!content.trim() || isGenerating) return;

      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      broadcastState("SYNC_MESSAGES", newMessages);

      setIsGenerating(true);

      try {
        const payload: ChatApiRequestPayload = {
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          apiKey: aiSettings.apiKey,
          baseUrl: aiSettings.baseUrl,
          model: aiSettings.model,
          context,
          longTermMemories: longTermMemories.map((m) => m.fact),
        };

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || errData.details || `API returned status ${res.status}`);
        }

        const data: ChatApiResponsePayload = await res.json();

        // Handle Tool Calls
        if (data.toolCalls && data.toolCalls.length > 0 && toolHandlers) {
          for (const call of data.toolCalls) {
            try {
              const args = typeof call.function.arguments === "string" ? JSON.parse(call.function.arguments) : call.function.arguments || {};
              const name = call.function.name;

              if (name === "create_task" && toolHandlers.onCreateTask) {
                toolHandlers.onCreateTask(args.title);
              } else if (name === "complete_task" && toolHandlers.onCompleteTask) {
                toolHandlers.onCompleteTask(args.title);
              } else if (name === "delete_task" && toolHandlers.onDeleteTask) {
                toolHandlers.onDeleteTask(args.title);
              } else if (name === "clear_completed_tasks" && toolHandlers.onClearCompletedTasks) {
                toolHandlers.onClearCompletedTasks();
              } else if (name === "start_focus_timer" && toolHandlers.onStartTimer) {
                toolHandlers.onStartTimer(args.durationMinutes || 25);
              } else if (name === "pause_focus_timer" && toolHandlers.onPauseTimer) {
                toolHandlers.onPauseTimer();
              } else if (name === "reset_focus_timer" && toolHandlers.onResetTimer) {
                toolHandlers.onResetTimer();
              } else if (name === "save_memory" && toolHandlers.onSaveMemory) {
                toolHandlers.onSaveMemory(args.fact);
              }
            } catch (e) {
              console.error("Failed to execute tool call:", e);
            }
          }
        }

        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now()}_assistant`,
          role: "assistant",
          content: data.reply || (data.toolCalls ? "Executed action successfully." : ""),
          timestamp: Date.now(),
          sources: data.sources,
          toolCalls: data.toolCalls,
        };

        const finalMessages = [...newMessages, assistantMessage];
        setMessages(finalMessages);
        broadcastState("SYNC_MESSAGES", finalMessages);

        // Save auto-extracted memories if present
        if (data.extractedMemories && data.extractedMemories.length > 0 && aiSettings.autoSaveMemories) {
          data.extractedMemories.forEach((fact) => addMemory(fact, "general"));
        }
      } catch (err: any) {
        console.error("Chat request failed:", err);
        const errorMessage: ChatMessage = {
          id: `msg_${Date.now()}_err`,
          role: "assistant",
          content: err.message || "Sorry, I ran into an error processing your request. Please check your network or AI settings.",
          timestamp: Date.now(),
          isError: true,
        };
        const finalMessages = [...newMessages, errorMessage];
        setMessages(finalMessages);
        broadcastState("SYNC_MESSAGES", finalMessages);
      } finally {
        setIsGenerating(false);
      }
    },
    [messages, isGenerating, aiSettings, longTermMemories, broadcastState, addMemory]
  );

  return {
    messages,
    longTermMemories,
    aiSettings,
    isGenerating,
    sendMessage,
    addMemory,
    deleteMemory,
    clearMemories,
    clearMessages,
    updateAISettings,
  };
}
