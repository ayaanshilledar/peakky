"use client";

import React, { useMemo } from "react";

interface StampProps {
  variant: "left" | "right";
  width?: number;
  height?: number;
}

const PerforatedStamp: React.FC<StampProps> = ({ variant, width = 144, height = 188 }) => {
  // Generate mathematically exact inward semicircular scalloped perforations
  const stampPath = useMemo(() => {
    const holeRadius = 2.8;
    const pitch = 12;
    const holesX = Math.floor((width - 16) / pitch);
    const marginX = (width - holesX * pitch) / 2;
    const holesY = Math.floor((height - 16) / pitch);
    const marginY = (height - holesY * pitch) / 2;
    const flatX = (pitch - holeRadius * 2) / 2;
    const flatY = (pitch - holeRadius * 2) / 2;

    let d = `M 0,0 L ${marginX},0 `;
    // Top Edge
    for (let i = 0; i < holesX; i++) {
      d += `h ${flatX} a ${holeRadius} ${holeRadius} 0 0 0 ${holeRadius * 2} 0 h ${flatX} `;
    }
    d += `L ${width},0 L ${width},${marginY} `;
    // Right Edge
    for (let i = 0; i < holesY; i++) {
      d += `v ${flatY} a ${holeRadius} ${holeRadius} 0 0 0 0 ${holeRadius * 2} v ${flatY} `;
    }
    d += `L ${width},${height} L ${width - marginX},${height} `;
    // Bottom Edge
    for (let i = 0; i < holesX; i++) {
      d += `h -${flatX} a ${holeRadius} ${holeRadius} 0 0 0 -${holeRadius * 2} 0 h -${flatX} `;
    }
    d += `L 0,${height} L 0,${height - marginY} `;
    // Left Edge
    for (let i = 0; i < holesY; i++) {
      d += `v -${flatY} a ${holeRadius} ${holeRadius} 0 0 0 0 -${holeRadius * 2} v -${flatY} `;
    }
    d += `Z`;
    return d;
  }, [width, height]);

  return (
    <div className="relative filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.25)] select-none cursor-pointer">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-500 ease-out"
      >
        {/* Outer Perforated Stamp Body (Translucent Vellum Paper) */}
        <path
          d={stampPath}
          fill="rgba(255, 255, 255, 0.07)"
          stroke="rgba(255, 255, 255, 0.28)"
          strokeWidth="1.2"
          className="backdrop-blur-md"
        />

        {/* Inner Solid Border Frame */}
        <rect
          x="10"
          y="10"
          width={width - 20}
          height={height - 20}
          fill="none"
          stroke="rgba(255, 255, 255, 0.18)"
          strokeWidth="0.8"
          rx="1"
        />

        {/* Inner Secondary Dashed Inset */}
        <rect
          x="14"
          y="14"
          width={width - 28}
          height={height - 28}
          fill="none"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="0.8"
          strokeDasharray="2.5 2.5"
          rx="1"
        />

        {/* Left Stamp: Focus Bezel Edition */}
        {variant === "left" && (
          <g className="text-white">
            {/* Top Micro-Bar */}
            <text x="20" y="27" fill="currentColor" opacity="0.5" className="font-mono text-[7px] tracking-wider uppercase font-semibold">
              NO. 01
            </text>
            <text x={width - 20} y="28" textAnchor="end" fill="currentColor" opacity="0.6" className="font-mono text-[8.5px] font-medium">
              25¢
            </text>

            {/* Engraved Artwork: Concentric Bezel Focus Rings */}
            <g transform={`translate(${width / 2}, ${height / 2 - 4})`} opacity="0.55" stroke="currentColor">
              <circle cx="0" cy="0" r="32" fill="none" strokeWidth="0.75" opacity="0.3" strokeDasharray="2 2" />
              <circle cx="0" cy="0" r="24" fill="none" strokeWidth="0.8" opacity="0.5" />
              <circle cx="0" cy="0" r="16" fill="none" strokeWidth="0.8" opacity="0.7" />
              {/* Notch Bezel Silhouette */}
              <rect x="-13" y="-6.5" width="26" height="13" rx="6.5" fill="rgba(255,255,255,0.12)" strokeWidth="1" />
              <circle cx="0" cy="0" r="2" fill="currentColor" />
              {/* Subtle Meridian Rays */}
              <line x1="-32" y1="0" x2="-26" y2="0" strokeWidth="0.8" />
              <line x1="26" y1="0" x2="32" y2="0" strokeWidth="0.8" />
              <line x1="0" y1="-32" x2="0" y2="-26" strokeWidth="0.8" />
              <line x1="0" y1="26" x2="0" y2="32" strokeWidth="0.8" />
            </g>

            {/* Bottom Inscription */}
            <text
              x={width / 2}
              y={height - 20}
              textAnchor="middle"
              fill="currentColor"
              opacity="0.45"
              className="font-mono text-[6.5px] uppercase tracking-[0.2em] font-medium"
            >
              Tactile Bezel
            </text>

            {/* Authentic Ink Cancellation Mark Stamped Across Corner */}
            <g transform={`translate(${width - 42}, 38) rotate(-18)`} opacity="0.4" stroke="currentColor">
              <path d="M -22,-6 C -12,-11 0,-3 12,-7 S 26,-4 34,-8" fill="none" strokeWidth="1" />
              <path d="M -22,0 C -12,-5 0,3 12,-1 S 26,2 34,-2" fill="none" strokeWidth="1" />
              <path d="M -22,6 C -12,1 0,9 12,5 S 26,8 34,4" fill="none" strokeWidth="1" />
              <circle cx="2" cy="0" r="14" fill="none" strokeWidth="0.8" />
              <text x="2" y="3" textAnchor="middle" fill="currentColor" className="font-mono text-[5.5px] uppercase tracking-wider">
                FLOW
              </text>
            </g>
          </g>
        )}

        {/* Right Stamp: Native Tauri Core Edition */}
        {variant === "right" && (
          <g className="text-white">
            {/* Top Micro-Bar */}
            <text x="20" y="27" fill="currentColor" opacity="0.5" className="font-mono text-[7px] tracking-wider uppercase font-semibold">
              NO. 02
            </text>
            <text x={width - 20} y="28" textAnchor="end" fill="currentColor" opacity="0.6" className="font-mono text-[8.5px] font-medium">
              50¢
            </text>

            {/* Engraved Artwork: Minimal Geometric Compass / Acoustic Beacon */}
            <g transform={`translate(${width / 2}, ${height / 2 - 4})`} opacity="0.55" stroke="currentColor">
              {/* Outer compass rim */}
              <circle cx="0" cy="0" r="30" fill="none" strokeWidth="0.8" opacity="0.4" strokeDasharray="3 3" />
              <circle cx="0" cy="0" r="22" fill="none" strokeWidth="0.8" opacity="0.6" />
              {/* Star Beacon / Crosshairs */}
              <polygon points="0,-18 4,-6 18,-6 7,2 11,16 0,8 -11,16 -7,2 -18,-6 -4,-6" fill="rgba(255,255,255,0.08)" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="2.5" fill="currentColor" />
            </g>

            {/* Bottom Inscription */}
            <text
              x={width / 2}
              y={height - 20}
              textAnchor="middle"
              fill="currentColor"
              opacity="0.45"
              className="font-mono text-[6.5px] uppercase tracking-[0.2em] font-medium"
            >
              Native Rust
            </text>

            {/* Authentic Circular Postal Seal Stamped Across */}
            <g transform={`translate(40, ${height - 40}) rotate(12)`} opacity="0.4" stroke="currentColor">
              <circle cx="0" cy="0" r="17" fill="none" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="14" fill="none" strokeWidth="0.6" strokeDasharray="1.5 1.5" />
              <text x="0" y="-3" textAnchor="middle" fill="currentColor" className="font-mono text-[4.5px] uppercase tracking-widest font-bold">
                PEAKY
              </text>
              <text x="0" y="5" textAnchor="middle" fill="currentColor" className="font-mono text-[4.5px] uppercase tracking-wider">
                DESKTOP
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};

export const EditorialStatement: React.FC = () => {
  return (
    <section className="relative w-full py-28 sm:py-36 md:py-48 px-6 text-center select-none overflow-hidden">
      {/* Subtle Arc Airmail Flight Route (Dashed Bezier Arch in Background) */}
      <svg
        className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-72 pointer-events-none opacity-20"
        viewBox="0 0 1000 300"
        fill="none"
      >
        <path
          d="M 120 70 Q 500 -30 880 230"
          stroke="white"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
      </svg>

      {/* Main Centered Container with Relative Flanking Stamps */}
      <div className="relative max-w-6xl mx-auto flex flex-col items-center justify-center">
        {/* Left Postage Stamp: Floating and Tilted Counter-Clockwise */}
        <div className="hidden sm:block absolute -left-4 md:left-0 lg:-left-6 top-0 -translate-y-6 -rotate-[12deg] transition-all duration-500 ease-out hover:rotate-[-2deg] hover:scale-105 hover:-translate-y-8 z-20">
          <PerforatedStamp variant="left" />
        </div>

        {/* Center Editorial Headline in our clean font-sans — Strictly Two Lines */}
        <div className="space-y-2 sm:space-y-3 max-w-5xl z-10 px-4">
          {/* Line 1 */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-medium tracking-tight text-white leading-[1.14]">
            Deepen your focus with <span className="font-bold text-white">Peaky</span>
          </h2>

          {/* Line 2 */}
          <p className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-medium tracking-tight text-white/75 leading-[1.14]">
            through everyday desktop flow.
          </p>
        </div>

        {/* Right Postage Stamp: Floating and Tilted Clockwise */}
        <div className="hidden sm:block absolute -right-4 md:right-0 lg:-right-6 bottom-0 translate-y-6 rotate-[14deg] transition-all duration-500 ease-out hover:rotate-[3deg] hover:scale-105 hover:translate-y-4 z-20">
          <PerforatedStamp variant="right" />
        </div>
      </div>
    </section>
  );
};
