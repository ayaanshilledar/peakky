"use client";

import React from "react";

export const SquigglyScrollCue: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-white/80 select-none pb-16 pt-4">
      <span className="text-[10px] font-mono tracking-[0.25em] uppercase font-semibold text-white/70">
        MORE DETAILS
      </span>

      {/* Hand-drawn Style Squiggly Vector Arrow */}
      <svg
        className="w-5 h-12 text-white/80 animate-bounce"
        viewBox="0 0 24 56"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Wavy S-Curve Path */}
        <path d="M12 2 Q17 10, 12 18 T12 34 T12 48" />
        {/* Arrowhead */}
        <polyline points="7 43 12 49 17 43" />
      </svg>
    </div>
  );
};
