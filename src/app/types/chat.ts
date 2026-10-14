export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: number;
  sources?: string[];
  isError?: boolean;
  toolCalls?: any[]; // For assistant messages that invoke tools
  toolCallId?: string; // For tool role messages
  toolName?: string;
}

export interface LongTermMemory {
  id: string;
  fact: string;
  category?: "preference" | "project" | "habit" | "general";
  createdAt: number;
}

export interface AISettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPromptExtra: string;
  autoSaveMemories: boolean;
}

export interface PeakyAppContext {
  timer: {
    isRunning: boolean;
    formattedTime: string;
    progressPercent: number;
  };
  tasks: {
    total: number;
    activeCount: number;
    activeTitles: string[];
    completedCount: number;
  };
  calendar: {
    hasEvents: boolean;
    currentOrNextEventTitle?: string;
    currentOrNextEventTime?: string;
    eventCount: number;
  };
  clips: {
    totalClips: number;
    recentClips: { text: string; type: string; time: string }[];
  };
  profileName?: string;
}

export interface ChatApiRequestPayload {
  messages: { role: string; content: string }[];
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  context: PeakyAppContext;
  longTermMemories: string[];
}

export interface ChatApiResponsePayload {
  reply: string;
  extractedMemories?: string[];
  sources?: string[];
  usedModel?: string;
  toolCalls?: {
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string | Record<string, any>;
    };
  }[];
}

