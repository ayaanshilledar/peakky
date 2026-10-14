"use client";

import { useState, useEffect } from "react";

export interface ProcessItem {
  pid: number;
  name: string;
  cpu_usage: number;
  memory_mb: number;
}

export interface SystemMetricsPayload {
  cpu_usage: number;
  cpu_avg: number;
  cpu_peak: number;
  memory_used_gb: number;
  memory_total_gb: number;
  memory_used_percent: number;
  gpu_usage: number;
  disk_rate: string;
  net_download_rate: string;
  net_upload_rate: string;
  top_processes: ProcessItem[];
}

const DEFAULT_METRICS: SystemMetricsPayload = {
  cpu_usage: 12,
  cpu_avg: 9,
  cpu_peak: 34,
  memory_used_gb: 15.0,
  memory_total_gb: 64.0,
  memory_used_percent: 23,
  gpu_usage: 3,
  disk_rate: "230 KB/s",
  net_download_rate: "3 KB/s",
  net_upload_rate: "3 KB/s",
  top_processes: [
    { pid: 1042, name: "Google Chrome", cpu_usage: 4.2, memory_mb: 1240 },
    { pid: 2840, name: "Peaky Desktop", cpu_usage: 2.8, memory_mb: 320 },
    { pid: 8492, name: "Code.exe", cpu_usage: 1.9, memory_mb: 850 },
    { pid: 5120, name: "Spotify", cpu_usage: 0.8, memory_mb: 210 },
    { pid: 3104, name: "System", cpu_usage: 0.4, memory_mb: 150 },
  ],
};

export function useSystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetricsPayload>(DEFAULT_METRICS);
  const [cpuHistory, setCpuHistory] = useState<number[]>([
    8, 9, 12, 11, 14, 18, 22, 34, 28, 19, 15, 12, 10, 11, 12,
  ]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
          const { invoke } = await import("@tauri-apps/api/core");
          const { listen } = await import("@tauri-apps/api/event");

          // Initial fetch
          const initial = await invoke<SystemMetricsPayload>("get_system_metrics");
          if (initial) {
            setMetrics(initial);
            setCpuHistory((prev) => [...prev.slice(-19), initial.cpu_usage]);
          }

          // Live ticker subscription
          unlisten = await listen<SystemMetricsPayload>("system-metrics-update", (event) => {
            if (event.payload) {
              setMetrics(event.payload);
              setCpuHistory((prev) => [...prev.slice(-19), event.payload.cpu_usage]);
            }
          });
          return;
        }
      } catch (err) {
        console.warn("Failed to attach Tauri system metrics listener", err);
      }

      // Browser fallback ticker for dev preview
      const interval = setInterval(() => {
        setMetrics((prev) => {
          const randomCpu = Math.max(4, Math.min(85, Math.round(prev.cpu_usage + (Math.random() * 6 - 3))));
          setCpuHistory((h) => [...h.slice(-19), randomCpu]);
          return {
            ...prev,
            cpu_usage: randomCpu,
            memory_used_gb: Number((prev.memory_used_gb + (Math.random() * 0.2 - 0.1)).toFixed(1)),
          };
        });
      }, 1500);

      return () => clearInterval(interval);
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  return {
    metrics,
    cpuHistory,
  };
}
