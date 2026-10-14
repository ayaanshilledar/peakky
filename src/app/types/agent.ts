export type AgentProvider =
  | "opencode"
  | "claude"
  | "codex"
  | "aider"
  | "cursor"
  | "cline"
  | "continue"
  | "custom";

export type AgentType = AgentProvider;

export type AgentStatus =
  | "idle"
  | "thinking"
  | "executing"
  | "approval_required"
  | "completed"
  | "error";

export type MetricSource = "provider" | "telemetry" | "estimated";

export interface AgentCapabilities {
  processDetection: boolean;
  workspaceTracking: boolean;
  fileTracking: boolean;
  toolTelemetry: boolean;
  tokenTelemetry: boolean;
  costTelemetry: boolean;
  approvalControl: boolean;
}

export interface TokenUsage {
  input?: number;
  output?: number;
  total?: number;
  source: MetricSource;
}

export interface AgentCost {
  amount?: number;
  currency?: string;
  source: MetricSource;
}

export interface AgentFileChange {
  path: string;
  additions?: number;
  deletions?: number;
  timestamp: number;
}

export interface AgentToolCall {
  id: string;
  tool: string;
  description: string;
  status: "running" | "done" | "failed" | "waiting_approval";
  timestamp: number;
}

export interface ApprovalRequest {
  id: string;
  prompt: string;
  command?: string;
  details?: string;
  timestamp: number;
}

export interface AgentMetrics {
  costEstimate?: number;
  tokensTotal?: number;
  stepCurrent: number;
  stepTotal: number;
  durationSec: number;
}

export interface AgentSession {
  id: string;
  provider: string;
  agentName: string;
  agentType: AgentProvider;
  pid?: number;
  workspace?: string;
  project?: string;
  status: AgentStatus;
  startedAt: number;
  lastActivityAt: number;
  lastActive: number;
  currentAction: string;
  capabilities: AgentCapabilities;
  activeTool?: AgentToolCall;
  pendingApproval?: ApprovalRequest | null;
  recentTools: AgentToolCall[];
  files: AgentFileChange[];
  tokenUsage?: TokenUsage;
  cost?: AgentCost;
  stepCurrent?: number;
  stepTotal?: number;
  metrics: AgentMetrics;
  prompt?: string;
  autoDetected?: boolean;
}

export interface RawAgentPayload {
  sessionId?: string;
  agentName?: string;
  agentType?: AgentProvider;
  pid?: number;
  workspace?: string;
  project?: string;
  status?: AgentStatus;
  action?: string;
  prompt?: string;
  autoDetected?: boolean;
  tool?: {
    name: string;
    description: string;
    status?: "running" | "done" | "failed" | "waiting_approval";
  };
  fileChange?: {
    path: string;
    additions?: number;
    deletions?: number;
  };
  approval?: {
    id?: string;
    prompt: string;
    command?: string;
    details?: string;
  };
  metrics?: {
    costEstimate?: number;
    tokensTotal?: number;
    tokensInput?: number;
    tokensOutput?: number;
    metricSource?: MetricSource;
    stepCurrent?: number;
    stepTotal?: number;
  };
}

export type AgentEvent =
  | { type: "DISCOVERED"; sessionId: string; provider: string; agentType: AgentProvider; pid?: number; workspace?: string }
  | { type: "STARTED"; sessionId: string; action?: string }
  | { type: "TOOL_STARTED"; sessionId: string; tool: AgentToolCall }
  | { type: "TOOL_COMPLETED"; sessionId: string; toolId: string; status: "done" | "failed" }
  | { type: "FILE_CHANGED"; sessionId: string; file: AgentFileChange }
  | { type: "TOKEN_UPDATE"; sessionId: string; usage: TokenUsage; cost?: AgentCost }
  | { type: "APPROVAL_REQUESTED"; sessionId: string; approval: ApprovalRequest }
  | { type: "STATUS_CHANGED"; sessionId: string; status: AgentStatus; action?: string }
  | { type: "COMPLETED"; sessionId: string; action?: string }
  | { type: "ERROR"; sessionId: string; message: string }
  | { type: "EXITED"; sessionId: string };
