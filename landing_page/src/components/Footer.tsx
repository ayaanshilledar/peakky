"use client";

import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 w-full h-[650px] sm:h-[700px] md:h-[760px] z-0 bg-[#fbfbfd] text-[#0a0a0c] flex flex-col justify-start px-6 sm:px-12 md:px-24 pt-16 sm:pt-20 pb-10 select-none pointer-events-auto overflow-hidden">
      {/* Giant Blue Brand Wordmark with Clean Letter Spacing */}
      <div className="absolute -bottom-4 sm:-bottom-8 md:-bottom-10 left-1/2 -translate-x-1/2 text-[16vw] sm:text-[17vw] font-black tracking-wide sm:tracking-wider md:tracking-[0.06em] text-[#1f3de8] leading-none pointer-events-none select-none w-full text-center">
        Peaky
      </div>

      {/* Main Top Area: Reduced Context & Simple Layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-10 sm:gap-16">
        {/* Left Side: Brand, Concise Tagline & Download Buttons */}
        <div className="space-y-4 max-w-md text-left">
          <div className="flex items-center gap-3">
            <span className="font-bold text-3xl sm:text-4xl tracking-tight text-[#0a0a0c]">
              Peaky
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#1f3de8]/10 text-[#1f3de8] font-mono text-[11px] font-semibold">
              v0.1.0
            </span>
          </div>

          <p className="text-[#0a0a0c]/60 text-sm sm:text-base font-normal leading-relaxed">
            A discreet dynamic island for macOS and Windows.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <a
              href="https://github.com/ayaanshilledar/peakky/releases"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#1f3de8]/10 hover:bg-[#1f3de8]/20 text-[#1f3de8] text-xs sm:text-sm font-semibold tracking-tight active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.59-.73 1-1.74.88-2.77-.9.04-1.95.6-2.58 1.34-.56.64-.99 1.68-.86 2.68 1 .08 1.98-.51 2.56-1.25z" />
              </svg>
              <span>Download for Mac</span>
            </a>
            <a
              href="https://github.com/ayaanshilledar/peakky/releases"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#1f3de8]/10 hover:bg-[#1f3de8]/20 text-[#1f3de8] text-xs sm:text-sm font-semibold tracking-tight active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.949-1.801" />
              </svg>
              <span>Windows</span>
            </a>
          </div>
        </div>

        {/* Right Side: Simple Links with Reduced Context */}
        <div className="flex items-center flex-wrap gap-8 sm:gap-12 text-left pt-2">
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#0a0a0c]/40 font-semibold">
              App
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-[#0a0a0c]/70">
              <li>
                <a href="#features" className="hover:text-[#1f3de8] transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#1f3de8] transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#0a0a0c]/40 font-semibold">
              Source
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-[#0a0a0c]/70">
              <li>
                <a
                  href="https://github.com/ayaanshilledar/peakky"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#1f3de8] transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/ayaanshilledar/peakky/releases"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#1f3de8] transition-colors"
                >
                  Releases
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

    </footer>
  );
};
