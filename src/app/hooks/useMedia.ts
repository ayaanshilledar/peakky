"use client";

import { useState, useEffect, useCallback } from "react";

export interface MediaState {
  isPlaying: boolean;
  title: string;
  artist: string;
  album: string;
  thumbnail: string | null;
  sourceApp: string;
  positionMs: number;
  durationMs: number;
}

interface RawRustMediaPayload {
  is_playing: boolean;
  title: string;
  artist: string;
  album: string;
  thumbnail: string | null;
  source_app: string;
  position_ms: number;
  duration_ms: number;
}

/**
 * Filter to strictly accept only Spotify and YouTube playback
 */
export function isSpotifyOrYouTube(sourceApp: string, title: string): boolean {
  const app = (sourceApp || "").toLowerCase();
  const tit = (title || "").toLowerCase();

  // Explicitly reject non-Spotify / non-YouTube players (Media Player, VLC, PotPlayer, etc.)
  if (
    app.includes("zune") ||
    app.includes("media.player") ||
    app.includes("mediaplayer") ||
    app.includes("groove") ||
    app.includes("wmplayer") ||
    app.includes("vlc") ||
    app.includes("itunes") ||
    app.includes("potplayer") ||
    app.includes("foobar") ||
    app.includes("aimp")
  ) {
    return false;
  }

  // Spotify desktop or web
  if (app.includes("spotify") || tit.includes("spotify")) {
    return true;
  }

  // YouTube in any web browser or dedicated app
  if (
    app.includes("youtube") ||
    tit.includes("youtube") ||
    app.includes("chrome") ||
    app.includes("msedge") ||
    app.includes("edge") ||
    app.includes("brave") ||
    app.includes("firefox") ||
    app.includes("opera") ||
    app.includes("vivaldi") ||
    app.includes("arc")
  ) {
    return true;
  }

  return false;
}

export function useMedia() {
  const [media, setMedia] = useState<MediaState | null>(null);

  // Initialize and listen for system media events from Tauri
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const { listen } = await import("@tauri-apps/api/event");

        // Initial fetch
        const initial = await invoke<RawRustMediaPayload | null>("get_media_state");
        if (initial && initial.title && isSpotifyOrYouTube(initial.source_app, initial.title)) {
          setMedia({
            isPlaying: initial.is_playing,
            title: initial.title,
            artist: initial.artist,
            album: initial.album,
            thumbnail: initial.thumbnail,
            sourceApp: initial.source_app,
            positionMs: initial.position_ms,
            durationMs: initial.duration_ms,
          });
        }

        // Live event listener
        const unlistenFn = await listen<RawRustMediaPayload>("media-state-changed", (event) => {
          const p = event.payload;
          if (!p || !p.title || !isSpotifyOrYouTube(p.source_app, p.title)) {
            setMedia(null);
            return;
          }
          setMedia({
            isPlaying: p.is_playing,
            title: p.title,
            artist: p.artist,
            album: p.album,
            thumbnail: p.thumbnail,
            sourceApp: p.source_app,
            positionMs: p.position_ms,
            durationMs: p.duration_ms,
          });
        });
        unlisten = unlistenFn;
      } catch (e) {
        console.error("Tauri media listener setup error:", e);
      }
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Smooth position interpolation timer while playing
  useEffect(() => {
    if (!media?.isPlaying) return;

    const interval = setInterval(() => {
      setMedia((prev) => {
        if (!prev || !prev.isPlaying) return prev;
        const nextPos = prev.positionMs + 1000;
        if (prev.durationMs > 0 && nextPos >= prev.durationMs) {
          return { ...prev, positionMs: prev.durationMs };
        }
        return { ...prev, positionMs: nextPos };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [media?.isPlaying, media?.durationMs]);

  // Toggle Play / Pause
  const togglePlayPause = useCallback(async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("media_toggle_play_pause");
      setMedia((prev) => (prev ? { ...prev, isPlaying: !prev.isPlaying } : null));
    } catch (err) {
      console.error("Failed to toggle play/pause:", err);
    }
  }, []);

  // Skip Next
  const skipNext = useCallback(async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("media_next");
    } catch (err) {
      console.error("Failed to skip next:", err);
    }
  }, []);

  // Skip Previous
  const skipPrevious = useCallback(async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("media_previous");
    } catch (err) {
      console.error("Failed to skip previous:", err);
    }
  }, []);

  // Seek
  const seek = useCallback(async (targetMs: number) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("media_seek", { positionMs: targetMs });
      setMedia((prev) => (prev ? { ...prev, positionMs: targetMs } : null));
    } catch (err) {
      console.error("Failed to seek media:", err);
    }
  }, []);

  return {
    media,
    togglePlayPause,
    skipNext,
    skipPrevious,
    seek,
  };
}
