"use client";

import React from "react";

export const Navbar: React.FC = () => {
  return (
    <nav className="w-full max-w-6xl mx-auto px-6 pt-6 pb-4 flex items-center justify-between text-white select-none">
      {/* Left: Brand Text Only (No Logo Icon) */}
      <a href="#" className="font-bold text-xl tracking-tight text-white hover:opacity-90 transition-opacity">
        Peaky
      </a>

      {/* Center-Right: Navigation Links (Text only, no icons) */}
      <div className="hidden md:flex items-center gap-7 ml-auto mr-8 text-xs font-medium text-white/80">
        <a href="#features" className="hover:text-white transition-colors">
          Island
        </a>
        <a href="#features" className="hover:text-white transition-colors">
          Widgets
        </a>
        <a href="#faq" className="hover:text-white transition-colors">
          FAQ
        </a>
        <a
          href="https://github.com/ayaanshilledar/peakky"
          target="_blank"
          rel="noreferrer"
          className="hover:text-white transition-colors"
        >
          GitHub
        </a>
      </div>

      {/* Right: Crisp White Pill Button */}
      <div className="flex items-center shrink-0">
        <a
          href="https://github.com/ayaanshilledar/peakky/releases"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-xl bg-white text-[#1f3de8] hover:bg-white/95 text-xs font-semibold tracking-tight shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
        >
          Download Peaky
        </a>
      </div>
    </nav>
  );
};
