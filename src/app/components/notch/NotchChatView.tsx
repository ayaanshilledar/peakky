"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, LongTermMemory, AISettings, PeakyAppContext } from "../../types/chat";

interface NotchChatViewProps {
  messages: ChatMessage[];
  longTermMemories: LongTermMemory[];
  aiSettings: AISettings;
  isGenerating: boolean;
  onSendMessage: (content: string, context: PeakyAppContext) => void;
  onAddMemory: (fact: string) => void;
  onDeleteMemory: (id: string) => void;
  onClearMessages: () => void;
  onInputFocusChange?: (focused: boolean) => void;
  appContext: PeakyAppContext;
}

type SubViewMode = "chat" | "memories" | "history";

export const NotchChatView: React.FC<NotchChatViewProps> = ({
  messages,
  longTermMemories,
  aiSettings,
  isGenerating,
  onSendMessage,
  onAddMemory,
  onDeleteMemory,
  onClearMessages,
  onInputFocusChange,
  appContext,
}) => {
  const [inputText, setInputText] = useState("");
  const [subView, setSubView] = useState<SubViewMode>("chat");
  const [historySearch, setHistorySearch] = useState("");
  const [newMemoryInput, setNewMemoryInput] = useState("");
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (subView === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isGenerating, subView]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText.trim(), appContext);
    setInputText("");
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 1500);
  };

  const handleAddManualMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryInput.trim()) return;
    onAddMemory(newMemoryInput.trim());
    setNewMemoryInput("");
  };

  const filteredHistory = messages.filter(
    (m) =>
      !historySearch ||
      m.content.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col justify-between font-sans text-zinc-100 overflow-hidden select-none h-full pt-1">
      {/* Ultra Minimal Sub-Header */}
      <div className="flex items-center justify-between px-1 pb-1 shrink-0 text-[10.5px]">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-medium text-zinc-300">Peaky AI</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setSubView(subView === "history" ? "chat" : "history")}
            className={`px-1.5 py-0.5 rounded text-[9.5px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
              subView === "history"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
            }`}
          >
            <span>History ({messages.length})</span>
          </button>

          <button
            onClick={() => setSubView(subView === "memories" ? "chat" : "memories")}
            className={`px-1.5 py-0.5 rounded text-[9.5px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
              subView === "memories"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
            }`}
          >
            <span>Memory ({longTermMemories.length})</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={onClearMessages}
              title="Clear Chat"
              className="px-1.5 py-0.5 rounded text-[9.5px] text-zinc-500 hover:text-rose-400 hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {subView === "memories" ? (
        <div className="flex-1 bg-zinc-950/90 border border-white/[0.08] rounded-lg p-2 my-0.5 flex flex-col justify-between overflow-hidden shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1 border-b border-white/[0.06] text-[10px]">
            <span className="font-semibold text-zinc-200">Saved Memories</span>
            <span className="text-[9px] font-mono text-zinc-500">{longTermMemories.length} item(s)</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 my-1 pr-0.5 no-scrollbar text-[10.5px]">
            {longTermMemories.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-2 text-center text-zinc-500 text-[10px]">
                No memories saved yet.
              </div>
            ) : (
              longTermMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="group bg-white/[0.03] border border-white/[0.05] hover:border-white/10 rounded px-2 py-1 flex items-center justify-between transition-colors"
                >
                  <span className="text-zinc-300 truncate pr-2">{mem.fact}</span>
                  <button
                    onClick={() => onDeleteMemory(mem.id)}
                    className="text-zinc-500 hover:text-rose-400 text-[10px] px-1 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddManualMemory} className="flex items-center gap-1 pt-1 border-t border-white/[0.06]">
            <input
              type="text"
              value={newMemoryInput}
              onChange={(e) => setNewMemoryInput(e.target.value)}
              placeholder="Add custom memory..."
              onFocus={() => onInputFocusChange?.(true)}
              onBlur={() => onInputFocusChange?.(false)}
              className="flex-1 bg-zinc-900/90 border border-white/[0.08] focus:border-white/20 rounded px-2 py-0.5 text-[10px] text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 rounded text-[9.5px] font-medium transition-colors cursor-pointer shrink-0"
            >
              Add
            </button>
          </form>
        </div>
      ) : subView === "history" ? (
        /* History Inspector View */
        <div className="flex-1 bg-zinc-950/90 border border-white/[0.08] rounded-lg p-2 my-0.5 flex flex-col justify-between overflow-hidden shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1 border-b border-white/[0.06] text-[10px]">
            <span className="font-semibold text-zinc-200">Conversation History</span>
            <span className="text-[9px] font-mono text-zinc-500">{messages.length} msg(s)</span>
          </div>

          {messages.length > 0 && (
            <div className="pt-1">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search history..."
                onFocus={() => onInputFocusChange?.(true)}
                onBlur={() => onInputFocusChange?.(false)}
                className="w-full bg-zinc-900/90 border border-white/[0.08] focus:border-white/20 rounded px-2 py-0.5 text-[10px] text-zinc-100 placeholder-zinc-500 focus:outline-none mb-1"
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-1.5 my-1 pr-0.5 no-scrollbar text-[10.5px]">
            {filteredHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-2 text-center text-zinc-500 text-[10px]">
                {messages.length === 0 ? "No chat history yet." : "No matching messages found."}
              </div>
            ) : (
              filteredHistory.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white/[0.03] border border-white/[0.05] hover:border-white/10 rounded p-1.5 transition-colors flex flex-col gap-0.5"
                >
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                    <span className={msg.role === "user" ? "text-cyan-400 font-semibold" : "text-emerald-400 font-semibold"}>
                      {msg.role === "user" ? "You" : "Peaky AI"}
                    </span>
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-zinc-200 text-[10px] line-clamp-3 whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))
            )}
          </div>

          <div className="pt-1 border-t border-white/[0.06] flex items-center justify-between">
            <button
              onClick={() => setSubView("chat")}
              className="px-2.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 rounded text-[9.5px] font-medium transition-colors cursor-pointer"
            >
              Back to Chat
            </button>
            {messages.length > 0 && (
              <button
                onClick={onClearMessages}
                className="text-rose-400 hover:text-rose-300 text-[9.5px] font-medium cursor-pointer"
              >
                Clear History
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Minimal Main Chat View with Smooth Micro-Animations */
        <div className="flex-1 flex flex-col justify-between overflow-hidden my-0.5">
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 no-scrollbar text-[11px]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-2 py-1 animate-in fade-in duration-200">
                <p className="text-[11px] text-zinc-300 font-medium tracking-tight">Ask Peaky AI</p>
                <p className="text-[9.5px] text-zinc-500 mt-0.5">Quick context on your tasks, timer & clips.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  } my-0.5 group animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out`}
                >
                  <div
                    className={`max-w-[90%] rounded-xl px-2.5 py-1.5 text-[11px] leading-relaxed break-words relative transition-all ${
                      msg.role === "user"
                        ? "bg-zinc-800 text-zinc-100 border border-white/10 shadow-sm"
                        : msg.isError
                        ? "bg-rose-950/40 border border-rose-500/30 text-rose-200"
                        : "bg-white/[0.04] border border-white/[0.07] text-zinc-200"
                    }`}
                  >
                    {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                    {msg.toolCalls && msg.toolCalls.map((call: any, idx: number) => {
                      let args: any = {};
                      try {
                        args = typeof call.function.arguments === "string" ? JSON.parse(call.function.arguments) : call.function.arguments || {};
                      } catch {}

                      let label = "Executed Action";
                      if (call.function.name === "create_task") label = `Created Task: "${args.title || ""}"`;
                      else if (call.function.name === "complete_task") label = `Completed Task: "${args.title || ""}"`;
                      else if (call.function.name === "delete_task") label = `Deleted Task: "${args.title || ""}"`;
                      else if (call.function.name === "clear_completed_tasks") label = `Cleared Completed Tasks`;
                      else if (call.function.name === "start_focus_timer") label = `Started Focus Timer (${args.durationMinutes || 25} min)`;
                      else if (call.function.name === "pause_focus_timer") label = `Paused Focus Timer`;
                      else if (call.function.name === "reset_focus_timer") label = `Reset Focus Timer`;
                      else if (call.function.name === "save_memory") label = `Saved Memory: "${args.fact || ""}"`;

                      return (
                        <div key={idx} className="mt-1 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2 py-1">
                          <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-[9.5px] font-medium text-emerald-300 truncate">
                            {label}
                          </span>
                        </div>
                      );
                    })}

                    {msg.role === "assistant" && !msg.isError && msg.content && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="absolute top-1 right-1 text-[8.5px] text-zinc-400 hover:text-white bg-black/60 border border-white/10 rounded px-1 py-0.2 opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:scale-105 active:scale-95"
                        title="Copy message"
                      >
                        {copiedMsgId === msg.id ? "✓ copied" : "copy"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            {isGenerating && (
              <div className="flex items-center gap-2 text-zinc-400 text-[10px] py-1 px-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="font-mono text-zinc-500 text-[9.5px]">Peaky is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Ultra Minimal Message Input with Morphing Send Button */}
          <form onSubmit={handleSubmit} className="flex items-center gap-1 shrink-0 pt-1">
            <div className="flex-1 bg-zinc-900/90 border border-white/[0.08] focus-within:border-emerald-500/40 focus-within:ring-1 focus-within:ring-emerald-500/20 rounded-lg px-2.5 py-1 flex items-center transition-all duration-200">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onFocus={() => onInputFocusChange?.(true)}
                onBlur={() => onInputFocusChange?.(false)}
                placeholder="Ask Peaky..."
                disabled={isGenerating}
                className="w-full bg-transparent text-[11px] text-white placeholder-zinc-500 focus:outline-none disabled:opacity-50 font-sans"
              />
              {inputText.trim() ? (
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-5 h-5 rounded-md bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0 ml-1 hover:scale-[1.15] active:scale-[0.85] shadow-[0_0_10px_rgba(255,255,255,0.15)] hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]"
                  title="Send message"
                >
                  <svg className="w-3 h-3 stroke-black stroke-[2.5]" viewBox="0 0 24 24" fill="none">
                    <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : (
                <kbd className="text-[8.5px] font-mono text-zinc-600 bg-zinc-800/80 px-1 py-0.2 rounded select-none ml-1 opacity-70">
                  ↵
                </kbd>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
