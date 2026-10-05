"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface ClipboardItem {
  id: string;
  type: "text" | "image";
  content: string; // Plain text or Data URL ("data:image/png;base64,...")
  preview: string; // Truncated text or preview summary
  charCount?: number;
  width?: number;
  height?: number;
  timestamp: number;
  pinned?: boolean;
}

const CLIPBOARD_STORAGE_KEY = "peaky_clipboard_history_v1";
const CLIPBOARD_CHANNEL = "peaky_clipboard_sync_channel";
const MAX_CLIPBOARD_ITEMS = 40;

export function useClipboardStore() {
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "text" | "image">("all");
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isBroadcastingRef = useRef<boolean>(false);

  // Initialize store and BroadcastChannel
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CLIPBOARD_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load clipboard store from storage:", e);
    }

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(CLIPBOARD_CHANNEL);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (!event.data) return;
        isBroadcastingRef.current = true;
        const { type, payload } = event.data;
        if (type === "SYNC_CLIPBOARD") {
          setItems(payload);
        }
        setTimeout(() => {
          isBroadcastingRef.current = false;
        }, 50);
      };

      return () => {
        channel.close();
      };
    }
  }, []);

  // Listen to Tauri backend event "clipboard-new-item"
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        const unlistenFn = await listen<ClipboardItem>("clipboard-new-item", (event) => {
          const newItem = event.payload;
          if (!newItem || !newItem.content) return;

          setItems((prev) => {
            // Check if identical item already at top
            if (prev.length > 0 && prev[0].content === newItem.content) {
              return prev;
            }
            // Remove previous duplicate if present to bring to top
            const filtered = prev.filter((item) => item.content !== newItem.content);
            const updated = [newItem, ...filtered].slice(0, MAX_CLIPBOARD_ITEMS);
            
            try {
              localStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(updated));
              if (channelRef.current && !isBroadcastingRef.current) {
                channelRef.current.postMessage({
                  type: "SYNC_CLIPBOARD",
                  payload: updated,
                });
              }
            } catch (e) {
              console.error("Failed to save clipboard item:", e);
            }

            return updated;
          });
        });
        unlisten = unlistenFn;
      } catch (err) {
        // Fallback for web preview mode if not in Tauri
        console.warn("Tauri event listener setup skipped/failed:", err);
      }
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const broadcastItems = useCallback((updated: ClipboardItem[]) => {
    try {
      localStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(updated));
      if (channelRef.current && !isBroadcastingRef.current) {
        channelRef.current.postMessage({
          type: "SYNC_CLIPBOARD",
          payload: updated,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Copy item back into system clipboard
  const copyItem = useCallback(async (item: ClipboardItem) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("copy_to_clipboard", {
        content: item.content,
        itemType: item.type,
      });
    } catch {
      // Browser fallback
      if (item.type === "text") {
        await navigator.clipboard.writeText(item.content);
      }
    }

    setCopiedId(item.id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === item.id ? null : curr));
    }, 1500);
  }, []);

  // Delete individual item
  const deleteItem = useCallback((id: string) => {
    setItems((prev) => {
      const updated = prev.filter((it) => it.id !== id);
      broadcastItems(updated);
      return updated;
    });
  }, [broadcastItems]);

  // Toggle pinned status
  const togglePin = useCallback((id: string) => {
    setItems((prev) => {
      const updated = prev.map((it) =>
        it.id === id ? { ...it, pinned: !it.pinned } : it
      );
      // Sort pinned to top
      const sorted = [...updated].sort((a, b) => {
        if (a.pinned === b.pinned) return 0;
        return a.pinned ? -1 : 1;
      });
      broadcastItems(sorted);
      return sorted;
    });
  }, [broadcastItems]);

  // Clear all items
  const clearAll = useCallback(() => {
    setItems((prev) => {
      const pinnedOnly = prev.filter((it) => it.pinned);
      broadcastItems(pinnedOnly);
      return pinnedOnly;
    });
  }, [broadcastItems]);

  // Filtered items based on search and type
  const filteredItems = items.filter((item) => {
    if (filterType === "text" && item.type !== "text") return false;
    if (filterType === "image" && item.type !== "image") return false;
    if (!searchQuery.trim()) return true;

    if (item.type === "text") {
      return item.content.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      return "screenshot image png".includes(searchQuery.toLowerCase());
    }
  });

  return {
    items,
    filteredItems,
    copiedId,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    copyItem,
    deleteItem,
    togglePin,
    clearAll,
  };
}
