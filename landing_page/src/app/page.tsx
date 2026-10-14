"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { HeroQuoteHeader } from "@/components/HeroQuoteHeader";
import { ProductWindowMockup } from "@/components/ProductWindowMockup";
import { SquigglyScrollCue } from "@/components/SquigglyScrollCue";
import { EditorialStatement } from "@/components/EditorialStatement";
import { FeatureGrid } from "@/components/FeatureGrid";
import { FAQSection } from "@/components/FAQSection";
import { Footer } from "@/components/Footer";

export default function Page() {
  return (
    <div className="relative min-h-screen bg-[#fbfbfd]">
      {/* 
        Elevated Main Page Sheet:
        Royal cobalt blue card with z-10 that scrolls over the fixed footer.
        Curved bottom corners and deep shadow create the physical tactile reveal effect.
        The bottom margin creates the scroll distance to fully unveil the footer underneath.
      */}
      <main className="relative z-10 min-h-screen bg-[#1f3de8] text-white selection:bg-white selection:text-[#1f3de8] overflow-hidden mb-[650px] sm:mb-[700px] md:mb-[760px] font-sans">
        {/* Subtle Radiant Ambient Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-white/10 via-white/5 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-[800px] left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-indigo-600/20 blur-[140px] pointer-events-none -z-10" />

        {/* 1. Arc-Inspired Top Navigation */}
        <Navbar />

        {/* 2. Hero Quote Header with Mac/Windows Pill Buttons & Tilted Stamp */}
        <HeroQuoteHeader />

        {/* 3. High-Fidelity Product Window Showcase with macOS Bezel & Traffic Lights */}
        <ProductWindowMockup />

        {/* 4. MORE DETAILS Squiggly Wavy Arrow Cue */}
        <SquigglyScrollCue />

        {/* 5. Editorial Statement with Floating Perforated Postage Stamps */}
        <EditorialStatement />

        {/* 6. Modular Feature Breakdown */}
        <FeatureGrid />

        {/* 7. FAQ 2-Ratio Split Section */}
        <FAQSection />
      </main>

      {/* 8. Inverted Behind-the-Page Footer (revealed as the blue sheet scrolls up) */}
      <Footer />
    </div>
  );
}
