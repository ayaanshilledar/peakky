"use client";

import React, { useState, useRef } from "react";
import { TaskItem } from "../../hooks/usePeakyStore";

interface NotchTasksViewProps {
  tasks: TaskItem[];
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  onInputFocusChange?: (focused: boolean) => void;
}

export const NotchTasksView: React.FC<NotchTasksViewProps> = ({
  tasks,
  addTask,
  toggleTask,
  deleteTask,
  onInputFocusChange,
}) => {
  const [inputVal, setInputVal] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      addTask(inputVal.trim());
      setInputVal("");
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="flex-1 flex flex-col justify-between mt-2 overflow-hidden">
      {/* Sleek Minimal Input */}
      <form onSubmit={handleSubmit} className="relative mb-2">
        <div className="flex items-center w-full bg-zinc-900/80 border border-white/[0.07] focus-within:border-white/[0.2] rounded-lg px-2.5 py-1.5 transition-colors">
          <span className="text-zinc-500 text-xs mr-2 select-none font-mono">+</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onFocus={() => onInputFocusChange?.(true)}
            onBlur={() => onInputFocusChange?.(false)}
            placeholder="Add task or note..."
            className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none font-sans"
          />
          <kbd className="text-[10px] font-mono text-zinc-500 bg-zinc-800/80 px-1 py-0.2 rounded select-none">
            ↵
          </kbd>
        </div>
      </form>

      {/* Refined Task Items List */}
      <div className="flex-1 overflow-y-auto max-h-[110px] pr-0.5 space-y-1">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-3 text-zinc-500">
            <span className="text-[11px] font-medium text-zinc-400">All clear</span>
            <span className="text-[10px] text-zinc-600 mt-0.5 font-mono">Type above & press ↵</span>
          </div>
        ) : (
          tasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className="group flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              {/* Interactive Check Circle & Text */}
              <div
                onClick={() => toggleTask(task.id)}
                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
              >
                <button
                  type="button"
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                    task.completed
                      ? "bg-emerald-500 border-emerald-500 text-black shadow-sm"
                      : "border-zinc-600 group-hover:border-zinc-400 hover:border-emerald-400"
                  }`}
                >
                  {task.completed ? (
                    <svg className="w-2.5 h-2.5 stroke-black stroke-[3]" viewBox="0 0 24 24" fill="none">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg
                      className="w-2.5 h-2.5 stroke-zinc-500 opacity-0 group-hover:opacity-40 stroke-[2.5]"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                <span
                  className={`text-xs truncate transition-all ${
                    task.completed
                      ? "text-zinc-500 line-through"
                      : "text-zinc-100 group-hover:text-white font-normal"
                  }`}
                >
                  {task.text}
                </span>
              </div>

              {/* Clean Micro-Actions on Hover */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                {/* Copy Action */}
                <button
                  onClick={() => handleCopyText(task.id, task.text)}
                  title="Copy text"
                  className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {copiedId === task.id ? (
                    <span className="text-[10px] text-emerald-400 font-mono">✓</span>
                  ) : (
                    <svg className="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth={2}>
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>

                {/* Delete Action */}
                <button
                  onClick={() => deleteTask(task.id)}
                  title="Delete"
                  className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <svg className="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth={2}>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
