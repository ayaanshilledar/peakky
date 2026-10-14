"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AgentSession,
  RawAgentPayload,
  AgentType,
  AgentStatus,
  AgentToolCall,
  ApprovalRequest,
  AgentMetrics,
} from "../types/agent";
import { normalizePayloadToSession } from "../utils/agentNormalizer";

export type {
  AgentSession,
  AgentType,
  AgentStatus,
  AgentToolCall,
  ApprovalRequest as AgentApproval,
  AgentMetrics,
  RawAgentPayload as AgentEventPayload,
};

const AGENT_STORAGE_KEY = "peaky_agent_sessions_v2";
const AGENT_CHANNEL = "peaky_agent_sync_channel";

export function useAgentStore() {
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const isBroadcastingRef = useRef<boolean>(false);

  // Initialize store and BroadcastChannel
  useEffect(() => {
    try {
      localStorage.removeItem("peaky_agent_sessions_v1");
    } catch {}

    try {
      const saved = localStorage.getItem(AGENT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load agent store:", e);
    }

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(AGENT_CHANNEL);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (!event.data) return;
        isBroadcastingRef.current = true;
        const { type, payload } = event.data;
        if (type === "SYNC_SESSIONS") {
          setSessions(payload);
        } else if (type === "SYNC_ACTIVE_ID") {
          setActiveSessionId(payload);
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

  const broadcastSessions = useCallback((updated: AgentSession[]) => {
    try {
      localStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify(updated));
      if (channelRef.current && !isBroadcastingRef.current) {
        channelRef.current.postMessage({
          type: "SYNC_SESSIONS",
          payload: updated,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Tauri Event Listener for CLI Agents Telemetry & Process Scanner
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        const unlistenFn = await listen<RawAgentPayload>("agent-event", (event) => {
          const payload = event.payload;
          if (!payload) return;

          setSessions((prev) => {
            // Find existing session by matching ID, PID, or agentType + workspace
            const existingIdx = prev.findIndex((s) => {
              if (payload.sessionId && s.id === payload.sessionId) return true;
              if (payload.pid && s.pid === payload.pid) return true;
              if (
                payload.agentType &&
                payload.workspace &&
                s.agentType === payload.agentType &&
                s.workspace === payload.workspace
              ) {
                return true;
              }
              return false;
            });

            if (existingIdx >= 0) {
              const prevSession = prev[existingIdx];
              const updatedSession = normalizePayloadToSession(payload, prevSession);
              const newSessions = [...prev];
              newSessions[existingIdx] = updatedSession;
              broadcastSessions(newSessions);
              return newSessions;
            } else {
              // Create new normalized session
              const newSession = normalizePayloadToSession(payload);
              const newSessions = [newSession, ...prev];
              setActiveSessionId(newSession.id);
              broadcastSessions(newSessions);
              return newSessions;
            }
          });
        });
        unlisten = unlistenFn;
      } catch (err) {
        console.warn("Tauri agent event listener not active:", err);
      }
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [broadcastSessions]);

  // Periodic Stale Session Maintenance (Cleanup sessions inactive for > 3 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setSessions((prev) => {
        let changed = false;
        const updated = prev.map((session) => {
          // If session has been inactive > 3 mins and was executing/thinking, set to idle
          if (
            (session.status === "executing" || session.status === "thinking") &&
            now - session.lastActivityAt > 180000
          ) {
            changed = true;
            return {
              ...session,
              status: "idle" as AgentStatus,
              currentAction: "Session idle (inactive)",
            };
          }
          return session;
        });

        if (changed) {
          broadcastSessions(updated);
          return updated;
        }
        return prev;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [broadcastSessions]);

  // User Approval Actions
  const approveAction = useCallback(
    async (sessionId: string, approvalId: string) => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("respond_agent_approval", {
          sessionId,
          approvalId,
          approved: true,
        });
      } catch (e) {
        console.error("Failed to invoke approval:", e);
      }

      setSessions((prev) => {
        const updated = prev.map((s) => {
          if (s.id === sessionId) {
            return {
              ...s,
              status: "executing" as AgentStatus,
              pendingApproval: null,
              currentAction: "Approved: Resuming execution...",
              lastActivityAt: Date.now(),
              lastActive: Date.now(),
            };
          }
          return s;
        });
        broadcastSessions(updated);
        return updated;
      });
    },
    [broadcastSessions]
  );

  const denyAction = useCallback(
    async (sessionId: string, approvalId: string) => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("respond_agent_approval", {
          sessionId,
          approvalId,
          approved: false,
        });
      } catch (e) {
        console.error("Failed to invoke rejection:", e);
      }

      setSessions((prev) => {
        const updated = prev.map((s) => {
          if (s.id === sessionId) {
            return {
              ...s,
              status: "idle" as AgentStatus,
              pendingApproval: null,
              currentAction: "Action rejected by user",
              lastActivityAt: Date.now(),
              lastActive: Date.now(),
            };
          }
          return s;
        });
        broadcastSessions(updated);
        return updated;
      });
    },
    [broadcastSessions]
  );

  const clearSessions = useCallback(() => {
    setSessions([]);
    setActiveSessionId(null);
    broadcastSessions([]);
  }, [broadcastSessions]);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;

  return {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    approveAction,
    denyAction,
    clearSessions,
  };
}
