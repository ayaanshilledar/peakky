"use client";

import React, { useState } from "react";
import { useSystemMetrics } from "../../hooks/useSystemMetrics";

interface NotchSystemViewProps {
  onSubTabChange?: (tab: "controls" | "system") => void;
}

export const NotchSystemView: React.FC<NotchSystemViewProps> = () => {
  const { metrics, cpuHistory } = useSystemMetrics();

  // Helper to generate smooth SVG path d attribute for CPU sparkline graph
  const generateSparklinePath = (data: number[], width = 160, height = 20) => {
    if (!data || data.length < 2) return "";
    const min = 0;
    const max = Math.max(100, ...data);
    const stepX = width / (data.length - 1);

    const points = data.map((val, idx) => {
      const x = idx * stepX;
      const y = height - ((val - min) / (max - min)) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(" L ")}`;
  };

  return (
    <div className="w-full flex flex-col gap-2 p-1 animate-in fade-in zoom-in-95 duration-200">
      {/* Top Cards Row: CPU & Memory */}
      <div className="grid grid-cols-2 gap-2">
        {/* CPU Card */}
        <div className="bg-zinc-900/90 border border-white/[0.08] rounded-2xl p-2.5 flex flex-col justify-between h-[96px] shadow-sm relative overflow-hidden group hover:border-white/[0.14] transition-all">
          <div>
            <span className="text-[10px] font-medium text-zinc-400 tracking-wide uppercase">CPU</span>
            <div className="text-lg font-bold text-white tracking-tight leading-tight mt-0.5">
              {metrics.cpu_usage}%
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5 font-sans leading-tight">
              Average {metrics.cpu_avg}% · peak {metrics.cpu_peak}%
            </div>
          </div>

          {/* Sparkline Graph */}
          <div className="w-full h-5 mt-0.5 relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 160 20" preserveAspectRatio="none">
              <path
                d={generateSparklinePath(cpuHistory)}
                fill="none"
                stroke="#e4e4e7"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Memory Card */}
        <div className="bg-zinc-900/90 border border-white/[0.08] rounded-2xl p-2.5 flex flex-col justify-between h-[96px] shadow-sm group hover:border-white/[0.14] transition-all">
          <div>
            <span className="text-[10px] font-medium text-zinc-400 tracking-wide uppercase">Memory</span>
            <div className="text-lg font-bold text-white tracking-tight leading-tight mt-0.5">
              {metrics.memory_used_gb} GB
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5 font-sans leading-tight">
              {metrics.memory_used_percent}% of {metrics.memory_total_gb} GB
            </div>
          </div>

          {/* Memory Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden relative mb-0.5 border border-white/[0.04]">
            <div
              className="h-full rounded-full bg-white transition-all duration-300 ease-out shadow-[0_0_8px_rgba(255,255,255,0.4)]"
              style={{ width: `${Math.max(2, Math.min(100, metrics.memory_used_percent))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Middle Cards Row: GPU, Disk, Network */}
      <div className="grid grid-cols-3 gap-2">
        {/* GPU Card */}
        <div className="bg-zinc-900/90 border border-white/[0.08] rounded-2xl p-2.5 flex flex-col justify-between h-[66px] shadow-sm hover:border-white/[0.14] transition-all">
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">GPU</span>
          <div className="text-base font-bold text-white tracking-tight">
            {metrics.gpu_usage}%
          </div>
        </div>

        {/* Disk Card */}
        <div className="bg-zinc-900/90 border border-white/[0.08] rounded-2xl p-2.5 flex flex-col justify-between h-[66px] shadow-sm hover:border-white/[0.14] transition-all">
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Disk</span>
          <div className="text-xs font-bold text-white tracking-tight truncate">
            {metrics.disk_rate}
          </div>
        </div>

        {/* Network Card */}
        <div className="bg-zinc-900/90 border border-white/[0.08] rounded-2xl p-2.5 flex flex-col justify-between h-[66px] shadow-sm hover:border-white/[0.14] transition-all">
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Network</span>
          <div className="flex flex-col text-[10px] font-semibold text-zinc-200 leading-tight">
            <span className="flex items-center gap-1 text-emerald-400">
              ↓ <span className="text-white font-mono text-[10px]">{metrics.net_download_rate}</span>
            </span>
            <span className="flex items-center gap-1 text-cyan-400">
              ↑ <span className="text-zinc-300 font-mono text-[10px]">{metrics.net_upload_rate}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
