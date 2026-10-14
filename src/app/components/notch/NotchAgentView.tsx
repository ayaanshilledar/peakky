"use client";

import React from "react";
import { AgentSession, AgentStatus } from "../../hooks/useAgentStore";
import { formatRelativeTime } from "./notchUtils";

interface NotchAgentViewProps {
  session: AgentSession | null;
  onApprove: (sessionId: string, approvalId: string) => void;
  onDeny: (sessionId: string, approvalId: string) => void;
  onOpenSettings?: (e: React.MouseEvent) => void;
}

export const NotchAgentView: React.FC<NotchAgentViewProps> = ({
  session,
  onApprove,
  onDeny,
}) => {
  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-4 font-sans text-center">
        <div className="flex items-center gap-2 mb-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-semibold text-zinc-300">No Active Agent</span>
        </div>
        <p className="text-[10px] text-zinc-500 font-medium">
          Start Codex, Claude Code, or OpenCode in your terminal
        </p>
      </div>
    );
  }

  const { status, agentName, currentAction, activeTool, pendingApproval, recentTools, metrics } = session;

  const getStatusConfig = (st: AgentStatus) => {
    switch (st) {
      case "thinking":
        return {
          dot: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)] animate-pulse",
          badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
          label: "Thinking",
        };
      case "executing":
        return {
          dot: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse",
          badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
          label: "Working",
        };
      case "approval_required":
        return {
          dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-ping",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          label: "Approval Needed",
        };
      case "completed":
        return {
          dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
          badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
          label: "Done",
        };
      case "error":
        return {
          dot: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)]",
          badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
          label: "Failed",
        };
      default:
        return {
          dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]",
          badge: "bg-white/[0.06] text-zinc-300 border-white/[0.08]",
          label: "Ready",
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const providerDisplay = session.provider || agentName || "CLI Agent";
  const hasTokenData = Boolean(session.tokenUsage && session.tokenUsage.total);
  const hasCostData = Boolean(session.cost && session.cost.amount !== undefined);
  const hasFiles = Boolean(session.files && session.files.length > 0);
  const hasRecentTools = Boolean(recentTools && recentTools.length > 0);

  return (
    <div className="flex-1 flex flex-col justify-between font-sans text-zinc-100 overflow-hidden select-none">
      {/* Top Header: Agent Identity + Live Metrics */}
      <div className="flex items-center justify-between px-1 py-1 mb-1.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${statusConfig.dot}`} />
          <span className="text-[12px] font-bold text-white tracking-tight truncate">
            {providerDisplay}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig.badge}`}>
            {statusConfig.label}
          </span>
        </div>

        {/* Telemetry pill (tokens & cost) */}
        {(hasCostData || hasTokenData || metrics.stepTotal > 1) && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06] shrink-0">
            {metrics.stepTotal > 1 && (
              <span className="text-zinc-300 font-semibold">
                {metrics.stepCurrent}/{metrics.stepTotal}
              </span>
            )}
            {hasCostData && (
              <span className="text-emerald-400 font-medium">
                ${session.cost?.amount?.toFixed(3)}
              </span>
            )}
            {hasTokenData && (
              <span className="text-cyan-400 font-medium">
                {session.tokenUsage?.total && session.tokenUsage.total >= 1000
                  ? `${(session.tokenUsage.total / 1000).toFixed(1)}k`
                  : session.tokenUsage?.total}{" "}
                tok
              </span>
            )}
          </div>
        )}
      </div>

      {/* Center Stage: What the Agent is Doing */}
      {status === "approval_required" && pendingApproval ? (
        /* Permission Approval Card */
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 mb-1.5 shadow-lg flex flex-col gap-2">
          <div className="text-[11px] text-amber-100 font-medium leading-snug">
            {pendingApproval.prompt}
          </div>
          {pendingApproval.command && (
            <div className="bg-black/60 border border-amber-500/20 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-amber-200 truncate">
              <span className="text-amber-500 mr-1.5">❯</span>
              {pendingApproval.command}
            </div>
          )}
          <div className="flex items-center gap-2 justify-end pt-0.5">
            <button
              onClick={() => onDeny(session.id, pendingApproval.id)}
              className="px-3 py-1 rounded-lg text-[10.5px] font-semibold text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 transition-all cursor-pointer"
            >
              Deny
            </button>
            <button
              onClick={() => onApprove(session.id, pendingApproval.id)}
              className="px-3.5 py-1 rounded-lg text-[10.5px] font-semibold text-emerald-200 hover:text-white bg-emerald-500/30 hover:bg-emerald-500/40 border border-emerald-500/40 shadow-sm transition-all cursor-pointer"
            >
              Approve
            </button>
          </div>
        </div>
      ) : (
        /* Active Task Card */
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-2.5 mb-1.5 flex flex-col gap-1.5 shadow-inner">
          {/* Main Prompt / Task */}
          <div className="flex items-start gap-2 text-[12px] leading-snug">
            <span className="text-cyan-400 font-bold shrink-0 mt-0.5">❯</span>
            <span className="text-zinc-100 font-medium truncate flex-1">
              {session.prompt || currentAction || `${providerDisplay} is active in your workspace`}
            </span>
            {(status === "executing" || status === "thinking") && (
              <span className="w-1.5 h-3 bg-cyan-400 animate-pulse shrink-0 rounded-[1px]" />
            )}
          </div>

          {/* Active Tool Sub-line */}
          {activeTool && (
            <div className="flex items-center gap-1.5 pl-3 text-[11px] text-cyan-300/90 truncate border-l-2 border-cyan-500/40 ml-1 mt-0.5">
              <span className="font-semibold">{activeTool.tool}:</span>
              <span className="text-zinc-400 font-mono text-[10px] truncate">{activeTool.description}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer Details: File changes & Recent Tools (Only if present) */}
      {(hasFiles || hasRecentTools) && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          {hasFiles && session.files?.slice(0, 2).map((file, idx) => (
            <div
              key={`file_${idx}`}
              className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-md shrink-0"
            >
              <span className="text-purple-400">⚡</span>
              <span className="text-purple-200 font-medium truncate max-w-[120px]">
                {file.path.split(/[/\\]/).pop()}
              </span>
              {(file.additions !== undefined || file.deletions !== undefined) && (
                <span className="font-mono text-[9px] text-emerald-400">
                  +{file.additions ?? 0}
                </span>
              )}
            </div>
          ))}

          {hasRecentTools && recentTools?.slice(0, 2).map((tool) => (
            <div
              key={tool.id}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-white/[0.03] border border-white/[0.05] rounded-md text-zinc-400 shrink-0"
            >
              <span className={tool.status === "done" ? "text-emerald-400" : "text-cyan-400"}>
                {tool.status === "done" ? "✓" : "›"}
              </span>
              <span className="font-medium text-zinc-300">{tool.tool}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
