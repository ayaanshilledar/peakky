"use client";

import React, { useRef, useState, useCallback } from "react";
import { MediaState } from "../../hooks/useMedia"; 80

interface NotchMediaViewProps {
  media: MediaState | null;
  togglePlayPause: () => void;
  skipNext: () => void;
  skipPrevious: () => void;
  seek: (positionMs: number) => void;
}

function formatTime(ms: number): string {
  if (!ms || isNaN(ms) || ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

interface SourceBadgeInfo {
  name: string;
  dotColor: string;
  badgeBg: string;
}

function getSourceInfo(sourceApp: string, title: string): SourceBadgeInfo {
  const app = (sourceApp || "").toLowerCase();
  const tit = (title || "").toLowerCase();

  if (app.includes("spotify") || tit.includes("spotify")) {
    return {
      name: "Spotify",
      dotColor: "bg-[#1DB954]",
      badgeBg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    };
  }

  return {
    name: "YouTube",
    dotColor: "bg-red-500",
    badgeBg: "bg-red-500/10 text-red-300 border-red-500/20",
  };
}

export const NotchMediaView: React.FC<NotchMediaViewProps> = ({
  media,
  togglePlayPause,
  skipNext,
  skipPrevious,
  seek,
}) => {
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const [showRemaining, setShowRemaining] = useState(false);

  const duration = media?.durationMs || 0;
  const position = media?.positionMs || 0;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;

  const calculateFraction = useCallback((clientX: number) => {
    if (!progressBarRef.current) return 0;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    return Math.max(0, Math.min(1, clickX / rect.width));
  }, []);

  const handleScrubClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const fraction = calculateFraction(e.clientX);
    seek(Math.round(fraction * duration));
  };

  const handleMouseDownScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    isDraggingRef.current = true;
    const fraction = calculateFraction(e.clientX);
    seek(Math.round(fraction * duration));

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const frac = calculateFraction(moveEvent.clientX);
      seek(Math.round(frac * duration));
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Minimal empty state when no media is actively playing
  if (!media || !media.title) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 w-full h-full py-4 text-center select-none">
        <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-2 shadow-inner">
          <svg
            className="w-5 h-5 text-zinc-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <p className="text-[12px] text-zinc-300 font-medium tracking-tight">Not Playing</p>
        <p className="text-[10.5px] text-zinc-500 mt-0.5">Play audio in Spotify or YouTube</p>
      </div>
    );
  }

  const source = getSourceInfo(media.sourceApp, media.title);

  return (
    <div className="flex flex-col flex-1 w-full h-full justify-between pt-1 pb-1 px-1 overflow-hidden select-none">
      {/* Top Section: Album Artwork + Metadata + Route / Equalizer */}
      <div className="flex items-center gap-3.5 w-full min-w-0">
        {/* Album Cover Squircle with Apple-style specular ring and shadow */}
        <div className="relative group shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 ring-1 ring-white/15 ring-inset flex items-center justify-center overflow-hidden shadow-lg shadow-black/50">
            {media.thumbnail ? (
              <img
                src={media.thumbnail}
                alt=""
                className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-950 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-zinc-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Track & Artist Metadata */}
        <div className="flex flex-col min-w-0 flex-1 justify-center">
          <div className="flex items-center justify-between gap-2 mb-1">
            {/* Source Pill */}
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9.5px] font-medium tracking-wide shadow-sm ${source.badgeBg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${source.dotColor} shrink-0 ${media.isPlaying ? "animate-pulse" : ""}`} />
              <span className="truncate max-w-[100px]">{source.name}</span>
            </div>

            {/* Apple Music style audio visualizer bars */}
            <div className="flex items-end gap-[2px] h-3 px-1" title={media.isPlaying ? "Playing" : "Paused"}>
              <span className={`w-[2px] rounded-full bg-emerald-400 transition-all ${media.isPlaying ? "eq-bar-1" : "h-1 opacity-40"}`} />
              <span className={`w-[2px] rounded-full bg-emerald-400 transition-all ${media.isPlaying ? "eq-bar-2" : "h-2.5 opacity-40"}`} />
              <span className={`w-[2px] rounded-full bg-emerald-400 transition-all ${media.isPlaying ? "eq-bar-3" : "h-1.5 opacity-40"}`} />
              <span className={`w-[2px] rounded-full bg-emerald-400 transition-all ${media.isPlaying ? "eq-bar-4" : "h-2 opacity-40"}`} />
            </div>
          </div>

          {/* Title */}
          <span
            title={media.title}
            className="text-[13px] font-semibold text-white truncate max-w-full leading-snug tracking-tight"
          >
            {media.title}
          </span>

          {/* Artist / Album */}
          <span
            title={media.artist || media.album || "Unknown Artist"}
            className="text-[11.5px] text-zinc-400 truncate max-w-full leading-tight mt-0.5 font-normal tracking-tight"
          >
            {media.artist || media.album || "Unknown Artist"}
          </span>
        </div>
      </div>

      {/* Middle Section: Fluid Apple iOS Scrubber Bar & Accurate Timestamps */}
      <div className="flex flex-col w-full my-auto py-1">
        <div
          ref={progressBarRef}
          onClick={handleScrubClick}
          onMouseDown={handleMouseDownScrub}
          className="w-full h-4 flex items-center cursor-pointer group relative select-none"
        >
          {/* Track Rail */}
          <div className="w-full h-1.5 group-hover:h-2 bg-white/[0.16] group-hover:bg-white/[0.22] rounded-full transition-all duration-150 relative overflow-hidden">
            {/* Active Progress Fill */}
            <div
              className="h-full bg-white group-hover:bg-white/95 rounded-full transition-[width] duration-75 relative"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Tactile Scrubber Thumb (gently emerges on hover/drag) */}
          <div
            className="w-3 h-3 bg-white rounded-full shadow-md shadow-black/40 border border-black/10 absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-150"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Timestamps */}
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 tabular-nums px-0.5">
          <span>{formatTime(position)}</span>
          <button
            onClick={() => setShowRemaining((prev) => !prev)}
            className="hover:text-zinc-200 transition-colors cursor-pointer"
            title="Toggle Remaining / Total Time"
          >
            {showRemaining && duration > position ? `-${formatTime(duration - position)}` : formatTime(duration)}
          </button>
        </div>
      </div>

      {/* Bottom Section: Apple Dynamic Island Tactile Controls */}
      <div className="flex items-center justify-between w-full px-1">
        {/* Rewind 10s */}
        <button
          onClick={() => seek(Math.max(0, position - 10000))}
          title="Rewind 10s"
          className="w-7 h-7 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] active:bg-white/[0.14] flex items-center justify-center transition-all active:scale-90 text-[10px] font-mono cursor-pointer"
        >
          -10s
        </button>

        {/* Center Playback Trio */}
        <div className="flex items-center gap-3.5">
          {/* Previous Track */}
          <button
            onClick={skipPrevious}
            title="Previous track"
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/[0.08] active:bg-white/[0.14] transition-all cursor-pointer active:scale-90 shrink-0"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2.5" />
            </svg>
          </button>

          {/* Prominent Play / Pause Apple Pill/Circle */}
          <button
            onClick={togglePlayPause}
            title={media.isPlaying ? "Pause" : "Play"}
            className="w-10 h-10 rounded-full bg-white text-black hover:bg-zinc-100 active:bg-zinc-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-black/30 shrink-0"
          >
            {media.isPlaying ? (
              <svg className="w-4 h-4 fill-black" viewBox="0 0 24 24">
                <rect x="6" y="5" width="4" height="14" rx="1.5" />
                <rect x="14" y="5" width="4" height="14" rx="1.5" />
              </svg>
            ) : (
              <svg className="w-4 h-4 fill-black ml-0.5" viewBox="0 0 24 24">
                <polygon points="6 4 19 12 6 20 6 4" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={skipNext}
            title="Next track"
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/[0.08] active:bg-white/[0.14] transition-all cursor-pointer active:scale-90 shrink-0"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2.5" />
            </svg>
          </button>
        </div>

        {/* Forward 10s */}
        <button
          onClick={() => seek(Math.min(duration, position + 10000))}
          title="Forward 10s"
          className="w-7 h-7 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] active:bg-white/[0.14] flex items-center justify-center transition-all active:scale-90 text-[10px] font-mono cursor-pointer"
        >
          +10s
        </button>
      </div>
    </div>
  );
};
