"use client";

import React, { useState } from "react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: "platforms",
    question: "Which platforms does Peaky support?",
    answer:
      "Peaky runs natively on macOS and Windows 10/11. Built with Rust, it uses virtually zero battery and under 25MB of RAM.",
  },
  {
    id: "notch-docking",
    question: "How does the Dynamic Island dock to the top bezel?",
    answer:
      "It docks seamlessly at the top edge of your screen, hugging your MacBook notch or floating discreetly on Windows monitors.",
  },
  {
    id: "offline-privacy",
    question: "Does Peaky require an internet connection?",
    answer:
      "100% offline. Focus timers, voice dictation, and clipboard history process locally on your machine with zero data collection.",
  },
  {
    id: "ai-agents",
    question: "How do AI agent approvals work?",
    answer:
      "When terminal AI agents like Claude Code run commands, 1-click approval prompts appear in your bezel without tab switching.",
  },
  {
    id: "meetings",
    question: "How does 1-click meeting join work?",
    answer:
      "Syncs your calendar to show a live countdown to upcoming calls, with a 1-click button to launch Zoom or Google Meet.",
  },
  {
    id: "open-source",
    question: "Is Peaky open source and free?",
    answer:
      "Yes. Peaky is completely free and open source under the MIT license on GitHub.",
  },
];

export const FAQSection: React.FC = () => {
  // Keep first question open by default for immediate preview
  const [openId, setOpenId] = useState<string | null>("platforms");

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="w-full px-6 sm:px-10 md:px-16 lg:px-20 py-24 sm:py-32 text-white select-none">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Side: 2-Ratio Layout — Clean Title Only */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 text-left">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.12]">
            Frequently Asked Questions
          </h2>
        </div>

        {/* Right Side: Down One by One Question Accordions */}
        <div className="lg:col-span-7 space-y-3">
          {FAQS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-white/[0.07] hover:bg-white/[0.1] border border-white/15 hover:border-white/25 transition-all duration-300 overflow-hidden"
              >
                {/* Question Header Button */}
                <button
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                  className={`w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer transition-all ${
                    isOpen ? "pb-2 sm:pb-3" : ""
                  }`}
                >
                  <span className="text-base sm:text-lg font-semibold tracking-tight text-white leading-snug">
                    {item.question}
                  </span>

                  {/* Squarish Minimal Toggle Button */}
                  <span
                    className={`w-7 h-7 rounded-xl shrink-0 flex items-center justify-center transition-all duration-300 ${
                      isOpen
                        ? "bg-white text-[#1f3de8] shadow-md rotate-45"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                </button>

                {/* Expandable Answer Drawer — No Dividing White Line */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-white/75 leading-relaxed font-normal">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
