"use client";

import React from "react";
import { ClipboardItem } from "../../hooks/useClipboardStore";
import { formatRelativeTime } from "./notchUtils";

interface NotchClipsViewProps {
  clipItems: ClipboardItem[];
  copiedClipId: string | null;
  copyClipItem: (item: ClipboardItem) => void;
  deleteClipItem: (id: string) => void;
}

export const NotchClipsView: React.FC<NotchClipsViewProps> = ({
  clipItems,
  copiedClipId,
  copyClipItem,
  deleteClipItem,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between mt-2 overflow-hidden">
      <div className="flex-1 overflow-y-auto max-h-[145px] pr-0.5 space-y-0.5 no-scrollbar">
        {clipItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-zinc-500">
            <span className="text-[11px] font-medium text-zinc-400">No clips yet</span>
            <span className="text-[10px] text-zinc-600 mt-0.5 font-mono">
              Copy text or press Win+Shift+S
            </span>
          </div>
        ) : (
          clipItems.slice(0, 15).map((clip) => {
            const isCopied = copiedClipId === clip.id;
            const timeStr = formatRelativeTime(clip.timestamp);

            return (
              <div
                key={clip.id}
                onClick={() => copyClipItem(clip)}
                className="group flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                {/* Left: Icon or Thumbnail + Text */}
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                  {clip.type === "image" ? (
                    <img
                      src={clip.content}
                      alt="Screenshot"
                      className="w-4 h-3.5 object-cover rounded-sm bg-zinc-900 border border-white/10 shrink-0"
                    />
                  ) : (
                    <svg
                      className="w-3 h-3 text-zinc-500 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    </svg>
                  )}

                  <span className="text-xs text-zinc-300 group-hover:text-white truncate font-sans">
                    {clip.type === "image"
                      ? clip.preview || "Screenshot"
                      : clip.content}
                  </span>
                </div>

                {/* Right: Relative Time or Copied / Delete */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isCopied ? (
                    <span className="text-[10px] font-mono font-medium text-emerald-400">
                      ✓ copied
                    </span>
                  ) : (
                    <>
                      <span className="text-[10px] font-mono text-zinc-500 group-hover:hidden">
                        {timeStr}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteClipItem(clip.id);
                        }}
                        title="Delete"
                        className="hidden group-hover:flex w-5 h-5 rounded items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                      >
                        <svg
                          className="w-3 h-3 stroke-current"
                          viewBox="0 0 24 24"
                          fill="none"
                          strokeWidth={2}
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
