"use client";

import React, { useState, useEffect, useCallback } from "react";

interface FeatureItem {
  id: string;
  number: string;
  title: string;
  description: string;
  tag: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: "timer",
    number: "01",
    title: "Tactile Focus Timer",
    description:
      "Tactile focus timer with acoustic chimes. Click any digit to tune focus duration instantly.",
    tag: "Focus Timer",
  },
  {
    id: "agent",
    number: "02",
    title: "CLI AI Agents HUD",
    description:
      "Ambient HUD for Claude Code and terminal agents. 1-click approve commands directly from your top bezel.",
    tag: "AI Agents",
  },
  {
    id: "calendar",
    number: "03",
    title: "Calendar & Meetings",
    description:
      "Live countdown to upcoming calls with 1-click instant join into Google Meet, Zoom, or Teams.",
    tag: "Calendar Sync",
  },
  {
    id: "dictate",
    number: "04",
    title: "Whisper Voice Dictation",
    description:
      "Press Alt+D to speak anywhere. Local Whisper transcribes speech straight to your active clipboard.",
    tag: "Voice Notes",
  },
  {
    id: "clips",
    number: "05",
    title: "Clipboard History",
    description:
      "Instant history for snippets and screenshots. 1-click re-copy with automatic 24-hour retention.",
    tag: "Clipboard",
  },
  {
    id: "tasks",
    number: "06",
    title: "Instant Quick Notes",
    description:
      "Keyboard-first task creation and todos docked at your bezel, synced seamlessly across displays.",
    tag: "Quick Tasks",
  },
];

export const FeatureGrid: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Dynamically track visible cards per screen breakpoint (3 for desktop, 2 for tablet, 1 for mobile)
  useEffect(() => {
    const updateVisible = () => {
      if (typeof window === "undefined") return;
      if (window.innerWidth < 640) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };
    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  const maxIndex = Math.max(0, FEATURES.length - visibleCount);

  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevSlide, nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
    setTouchStartX(null);
  };

  return (
    <section id="features" className="w-full px-6 sm:px-10 md:px-16 lg:px-20 py-20 text-white select-none">
      {/* Header Area: Heading at Left Side & Arrow Controls at Right Side */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-10 w-full max-w-7xl mx-auto">
        {/* Left Side: Heading */}
        <div className="text-left max-w-2xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.1] mb-2">
            Everything docked at the Top
          </h2>
          <p className="text-white/70 text-sm sm:text-base font-normal">
            Tactile dynamic widgets docked right at your screen bezel.
          </p>
        </div>

        {/* Right Side: 2-Directional Arrow Slider Controls — Squarish White Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={prevSlide}
            aria-label="Previous feature"
            className="w-10 h-10 rounded-xl bg-white hover:bg-white/95 text-[#1f3de8] shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next feature"
            className="w-10 h-10 rounded-xl bg-white hover:bg-white/95 text-[#1f3de8] shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Multi-Card Minimal Slider Box: Minimal 3 visible cards with reduced width */}
      <div className="w-full max-w-7xl mx-auto">
        <div
          className="relative w-full overflow-hidden py-2"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex -mx-2.5 sm:-mx-3 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * (100 / visibleCount)}%)` }}
          >
            {FEATURES.map((feature) => (
              <div
                key={feature.id}
                className="w-full sm:w-1/2 lg:w-1/3 shrink-0 px-2.5 sm:px-3"
              >
                <div className="flex flex-col select-none group">
                  {/* Visual Preview / Image Placeholder Chamber */}
                  <div className="relative w-full aspect-[16/10] rounded-2xl bg-white/10 hover:bg-white/[0.14] border border-white/20 hover:border-white/35 overflow-hidden flex flex-col items-center justify-center p-4 mb-3 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:-translate-y-1">
                    {/* Subtle dot pattern */}
                    <div
                      className="absolute inset-0 opacity-[0.06] pointer-events-none"
                      style={{
                        backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`,
                        backgroundSize: "14px 14px",
                      }}
                    />

                    {/* Placeholder Icon & Label */}
                    <div className="relative z-10 flex flex-col items-center gap-1.5 text-white/50 group-hover:text-white/70 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/10 flex items-center justify-center">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-mono tracking-widest uppercase">
                        Placeholder
                      </span>
                    </div>
                  </div>

                  {/* Below Placeholder: Two Lines of Description */}
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal px-0.5">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
