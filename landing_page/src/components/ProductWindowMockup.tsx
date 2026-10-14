"use client";

import React from "react";

export const ProductWindowMockup: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-8 mb-16 select-none">
      {/* Outer Container — No Shadow Drop */}
      <div className="relative rounded-3xl bg-[#0d0f17] border-2 border-white/20 overflow-hidden group">
        {/* Simple Image Placeholder Chamber */}
        <div className="relative w-full aspect-[16/10] bg-[#090b12] flex flex-col items-center justify-center select-none p-8">
          {/* Subtle grid pattern background */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/50 mb-3 shadow-inner">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <span className="text-xs font-mono font-medium text-white/60 tracking-wider uppercase">
              Image Placeholder
            </span>
            <span className="text-[11px] font-mono text-white/30 mt-1">
              Desktop App Screenshot (1200 × 750)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
