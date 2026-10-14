import {
  AgentSession,
  RawAgentPayload,
  AgentCapabilities,
  AgentToolCall,
  AgentFileChange,
  ApprovalRequest,
  AgentProvider,
} from "../types/agent";

export function createDefaultCapabilities(isAutoDetected = false): AgentCapabilities {
  if (isAutoDetected) {
    return {
      processDetection: true,
      workspaceTracking: false,
      fileTracking: false,
      toolTelemetry: false,
      tokenTelemetry: false,
      costTelemetry: false,
      approvalControl: false,
    };
  }

  return {
    processDetection: true,
    workspaceTracking: true,
    fileTracking: true,
    toolTelemetry: true,
    tokenTelemetry: true,
    costTelemetry: true,
    approvalControl: true,
  };
}

export function normalizePayloadToSession(
  payload: RawAgentPayload,
  existingSession?: AgentSession
): AgentSession {
  const now = Date.now();
  const provider = payload.agentName || existingSession?.provider || "CLI Agent";
  const agentType: AgentProvider = payload.agentType || existingSession?.agentType || "custom";
  const isAutoDetected = payload.autoDetected ?? existingSession?.autoDetected ?? false;

  const baseCaps = existingSession?.capabilities || createDefaultCapabilities(isAutoDetected);
  const updatedCaps: AgentCapabilities = {
    ...baseCaps,
    workspaceTracking: baseCaps.workspaceTracking || Boolean(payload.workspace || payload.project),
    fileTracking: baseCaps.fileTracking || Boolean(payload.fileChange),
    toolTelemetry: baseCaps.toolTelemetry || Boolean(payload.tool),
    tokenTelemetry:
      baseCaps.tokenTelemetry ||
      Boolean(payload.metrics?.tokensTotal || payload.metrics?.tokensInput),
    costTelemetry: baseCaps.costTelemetry || Boolean(payload.metrics?.costEstimate !== undefined),
    approvalControl: baseCaps.approvalControl || Boolean(payload.approval),
  };

  let recentTools = existingSession ? [...existingSession.recentTools] : [];
  let activeTool = existingSession?.activeTool;

  if (payload.tool) {
    const toolId = "tool_" + now + "_" + Math.random().toString(36).substr(2, 4);
    const newTool: AgentToolCall = {
      id: toolId,
      tool: payload.tool.name,
      description: payload.tool.description,
      status: payload.tool.status || "running",
      timestamp: now,
    };

    if (newTool.status === "running") {
      activeTool = newTool;
    } else {
      activeTool = undefined;
      recentTools = [newTool, ...recentTools.filter((t) => t.id !== newTool.id)].slice(0, 15);
    }
  }

  let files = existingSession ? [...existingSession.files] : [];
  if (payload.fileChange) {
    const fileChange: AgentFileChange = {
      path: payload.fileChange.path,
      additions: payload.fileChange.additions,
      deletions: payload.fileChange.deletions,
      timestamp: now,
    };
    files = [fileChange, ...files.filter((f) => f.path !== fileChange.path)].slice(0, 20);
  }

  let pendingApproval: ApprovalRequest | null = existingSession?.pendingApproval || null;
  if (payload.approval) {
    pendingApproval = {
      id: payload.approval.id || "appr_" + now,
      prompt: payload.approval.prompt,
      command: payload.approval.command,
      details: payload.approval.details,
      timestamp: now,
    };
  } else if (payload.status === "executing" || payload.status === "completed" || payload.status === "idle") {
    pendingApproval = null;
  }

  const tokenSource = payload.metrics?.metricSource || existingSession?.tokenUsage?.source || "telemetry";
  const costSource = payload.metrics?.metricSource || existingSession?.cost?.source || "telemetry";

  const tokenUsage = payload.metrics
    ? {
        input: payload.metrics.tokensInput ?? existingSession?.tokenUsage?.input,
        output: payload.metrics.tokensOutput ?? existingSession?.tokenUsage?.output,
        total: payload.metrics.tokensTotal ?? existingSession?.tokenUsage?.total,
        source: tokenSource,
      }
    : existingSession?.tokenUsage;

  const cost =
    payload.metrics?.costEstimate !== undefined
      ? {
          amount: payload.metrics.costEstimate,
          currency: "$",
          source: costSource,
        }
      : existingSession?.cost;

  const pid = payload.pid ?? existingSession?.pid;
  const workspace = payload.workspace ?? existingSession?.workspace;

  const sessionId =
    payload.sessionId ||
    existingSession?.id ||
    (pid
      ? `${agentType}_pid_${pid}`
      : `${agentType}_${workspace || "default"}`);

  const prompt = payload.prompt || payload.action || existingSession?.prompt;
  let currentAction = payload.action || payload.prompt || existingSession?.currentAction || "Active";
  if (isAutoDetected && !payload.action && !payload.prompt && !existingSession) {
    currentAction = `${provider} process active`;
  }

  let status = payload.status || existingSession?.status || "idle";
  if (pendingApproval && updatedCaps.approvalControl) {
    status = "approval_required";
  }

  const startedAt = existingSession?.startedAt || now;
  const stepCurrent = payload.metrics?.stepCurrent ?? existingSession?.stepCurrent ?? 1;
  const stepTotal = payload.metrics?.stepTotal ?? existingSession?.stepTotal ?? 1;
  const durationSec = Math.max(1, Math.floor((now - startedAt) / 1000));

  const metrics = {
    costEstimate: cost?.amount ?? existingSession?.metrics?.costEstimate,
    tokensTotal: tokenUsage?.total ?? existingSession?.metrics?.tokensTotal,
    stepCurrent,
    stepTotal,
    durationSec,
  };

  return {
    id: sessionId,
    provider,
    agentName: provider,
    agentType,
    pid,
    workspace,
    project: payload.project ?? existingSession?.project,
    status,
    startedAt,
    lastActivityAt: now,
    lastActive: now,
    currentAction,
    prompt,
    capabilities: updatedCaps,
    activeTool,
    pendingApproval,
    recentTools,
    files,
    tokenUsage,
    cost,
    stepCurrent,
    stepTotal,
    metrics,
    autoDetected: isAutoDetected,
  };
}
