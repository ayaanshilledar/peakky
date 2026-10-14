"use client";

import React from "react";
import { HeroCTAButtons } from "./HeroCTAButtons";

export const HeroQuoteHeader: React.FC = () => {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 pt-16 pb-6 text-center flex flex-col items-center select-none">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-medium tracking-tight text-white leading-[1.2] max-w-3xl">
        <span className="text-sky-300 font-serif mr-1">“</span>
        Peaky is the dynamic island
        <br />
        I’ve been waiting for.
        <span className="text-sky-300 font-serif ml-1">”</span>
      </h1>

      {/* Hero CTA Buttons + Stamp Badge */}
      <HeroCTAButtons />
    </section>
  );
};
