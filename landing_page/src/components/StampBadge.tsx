"use client";

import React from "react";

export const StampBadge: React.FC = () => {
  return (
    <div className="relative inline-flex items-center justify-center rotate-12 select-none hover:rotate-6 transition-transform duration-300">
      <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/60 flex flex-col items-center justify-center p-2 text-center shadow-lg bg-[#1832b8]/50 backdrop-blur-sm">
        <span className="text-[7.5px] font-mono tracking-widest uppercase font-bold text-white/90 leading-tight">
          NOW AVAILABLE
        </span>
        
        {/* Center Icons (Mac & Windows) */}
        <div className="flex items-center gap-1.5 my-1 text-white">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.59-.73 1-1.74.88-2.77-.9.04-1.95.6-2.58 1.34-.56.64-.99 1.68-.86 2.68 1 .08 1.98-.51 2.56-1.25z" />
          </svg>
          <span className="text-[10px] text-white/60">•</span>
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.949-1.801" />
          </svg>
        </div>

        <span className="text-[7.5px] font-mono tracking-widest uppercase font-bold text-white/90 leading-tight">
          WINDOWS & MAC
        </span>
      </div>
    </div>
  );
};
