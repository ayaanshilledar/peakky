"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type HUDType = "volume" | "brightness";

export interface SystemHUDState {
  type: HUDType;
  value: number; // 0 to 100
  isMuted?: boolean;
  timestamp: number;
}

export function useSystemOSD() {
  const [activeHUD, setActiveHUD] = useState<SystemHUDState | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-dismiss HUD after 1.8 seconds of inactivity
  const triggerHUD = useCallback((type: HUDType, value: number, isMuted = false) => {
    const clampedVal = Math.max(0, Math.min(100, Math.round(value)));

    setActiveHUD({
      type,
      value: clampedVal,
      isMuted,
      timestamp: Date.now(),
    });

    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    dismissTimerRef.current = setTimeout(() => {
      setActiveHUD(null);
    }, 1800);
  }, []);

  // System & Keyboard Listeners
  useEffect(() => {
    let currentVol = 65;
    let currentBright = 75;

    // Helper to query real Windows system volume via Tauri IPC if available
    const syncRealVolume = async () => {
      try {
        if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
          const { invoke } = await import("@tauri-apps/api/core");
          const volData = await invoke<{ volume: number; is_muted: boolean } | null>("get_system_volume");
          if (volData) {
            currentVol = volData.volume;
            triggerHUD("volume", volData.volume, volData.is_muted);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch real volume via Tauri", err);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Hardware Media Keys
      if (e.key === "AudioVolumeUp" || e.key === "AudioVolumeDown" || e.key === "AudioVolumeMute") {
        syncRealVolume();
      }

      // Dev / Quick Testing Shortcuts:
      // Alt + Up/Down: Volume (querying real volume level)
      // Alt + Shift + Up/Down: Brightness
      if (e.altKey && !e.shiftKey) {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          syncRealVolume();
        }
      } else if (e.altKey && e.shiftKey) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          currentBright = Math.min(100, currentBright + 5);
          triggerHUD("brightness", currentBright);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          currentBright = Math.max(0, currentBright - 5);
          triggerHUD("brightness", currentBright);
        }
      }
    };

    // Custom window event listener for Tauri / external triggers
    const handleCustomOSD = (e: Event) => {
      const customEvt = e as CustomEvent<{ type: HUDType; value: number; isMuted?: boolean }>;
      if (customEvt.detail) {
        triggerHUD(customEvt.detail.type, customEvt.detail.value, customEvt.detail.isMuted);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("peaky_system_osd", handleCustomOSD);

    // Real-time background volume listener from Rust backend
    let unlistenVol: (() => void) | undefined;
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      import("@tauri-apps/api/event").then(({ listen }) => {
        listen<{ volume: number; is_muted: boolean }>("system-volume-changed", (event) => {
          if (event.payload) {
            currentVol = event.payload.volume;
            triggerHUD("volume", event.payload.volume, event.payload.is_muted);
          }
        }).then((unlistenFn) => {
          unlistenVol = unlistenFn;
        });
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("peaky_system_osd", handleCustomOSD);
      if (unlistenVol) unlistenVol();
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [triggerHUD]);

  return {
    activeHUD,
    triggerHUD,
  };
}
