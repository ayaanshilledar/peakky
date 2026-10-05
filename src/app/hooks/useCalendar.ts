"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  meetingUrl?: string;
  start: number; // timestamp in ms
  end: number;   // timestamp in ms
  allDay: boolean;
}

const CALENDAR_URL_KEY = "peaky_calendar_url";
const CALENDAR_EVENTS_KEY = "peaky_calendar_events";
const CALENDAR_LAST_SYNC_KEY = "peaky_calendar_last_sync";
const CHANNEL_NAME = "peaky_store_sync_channel";

// Unfold ICS lines (RFC 5545 line folding)
function unfoldIcs(rawIcs: string): string {
  return rawIcs.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

// Unescape ICS text
function unescapeIcsText(str: string): string {
  return str
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

// Extract meeting link (Google Meet, Zoom, Microsoft Teams)
function extractMeetingUrl(text: string): string | undefined {
  if (!text) return undefined;
  const meetMatch = text.match(/https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i);
  if (meetMatch) return meetMatch[0];

  const zoomMatch = text.match(/https:\/\/[a-zA-Z0-9.-]+\.zoom\.us\/[jw]\/[0-9]+[^\s"'>]*/i);
  if (zoomMatch) return zoomMatch[0];

  const teamsMatch = text.match(/https:\/\/teams\.(?:microsoft|live)\.com\/l\/meetup-join\/[^\s"'>]+/i);
  if (teamsMatch) return teamsMatch[0];

  return undefined;
}

// Parse ICS date string
function parseIcsDate(dateStr: string): { timestamp: number; allDay: boolean } | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();

  // All day: YYYYMMDD
  if (/^\d{8}$/.test(clean)) {
    const year = parseInt(clean.substring(0, 4), 10);
    const month = parseInt(clean.substring(4, 6), 10) - 1;
    const day = parseInt(clean.substring(6, 8), 10);
    const d = new Date(year, month, day, 0, 0, 0, 0);
    return { timestamp: d.getTime(), allDay: true };
  }

  // UTC or Local: YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (match) {
    const [, y, m, d, h, min, s, isUtc] = match;
    if (isUtc) {
      const date = new Date(
        Date.UTC(
          parseInt(y, 10),
          parseInt(m, 10) - 1,
          parseInt(d, 10),
          parseInt(h, 10),
          parseInt(min, 10),
          parseInt(s, 10)
        )
      );
      return { timestamp: date.getTime(), allDay: false };
    } else {
      const date = new Date(
        parseInt(y, 10),
        parseInt(m, 10) - 1,
        parseInt(d, 10),
        parseInt(h, 10),
        parseInt(min, 10),
        parseInt(s, 10)
      );
      return { timestamp: date.getTime(), allDay: false };
    }
  }

  return null;
}

// Parse Raw ICS Feed into clean CalendarEvents
export function parseIcsFeed(rawIcs: string): CalendarEvent[] {
  const unfolded = unfoldIcs(rawIcs);
  const lines = unfolded.split(/\r?\n/);
  const events: CalendarEvent[] = [];

  let inEvent = false;
  let currentEvent: Partial<CalendarEvent> & { rrule?: string; dtstartStr?: string; dtendStr?: string } = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      currentEvent = {};
      continue;
    }
    if (line === "END:VEVENT") {
      inEvent = false;
      if (currentEvent.title && currentEvent.dtstartStr) {
        const parsedStart = parseIcsDate(currentEvent.dtstartStr);
        if (parsedStart) {
          const parsedEnd = currentEvent.dtendStr ? parseIcsDate(currentEvent.dtendStr) : null;
          const duration = parsedEnd ? parsedEnd.timestamp - parsedStart.timestamp : (parsedStart.allDay ? 86400000 : 3600000);
          const endTs = parsedEnd ? parsedEnd.timestamp : parsedStart.timestamp + duration;

          const meetingUrl =
            extractMeetingUrl(currentEvent.location || "") ||
            extractMeetingUrl(currentEvent.description || "") ||
            extractMeetingUrl(currentEvent.title || "");

          const baseEvent: CalendarEvent = {
            id: currentEvent.id || "ev_" + Math.random().toString(36).substring(2, 9),
            title: unescapeIcsText(currentEvent.title),
            description: currentEvent.description ? unescapeIcsText(currentEvent.description) : undefined,
            location: currentEvent.location ? unescapeIcsText(currentEvent.location) : undefined,
            meetingUrl,
            start: parsedStart.timestamp,
            end: endTs,
            allDay: parsedStart.allDay,
          };

          // If recurring, generate instances for the next 14 days
          if (currentEvent.rrule) {
            const rrule = currentEvent.rrule;
            const now = Date.now();
            const windowEnd = now + 14 * 86400000;
            const windowStart = now - 86400000; // include today/yesterday

            if (rrule.includes("FREQ=DAILY")) {
              let currStart = baseEvent.start;
              while (currStart < windowEnd) {
                if (currStart >= windowStart) {
                  events.push({
                    ...baseEvent,
                    id: `${baseEvent.id}_${currStart}`,
                    start: currStart,
                    end: currStart + duration,
                  });
                }
                currStart += 86400000;
              }
            } else if (rrule.includes("FREQ=WEEKLY")) {
              let currStart = baseEvent.start;
              while (currStart < windowEnd) {
                if (currStart >= windowStart) {
                  events.push({
                    ...baseEvent,
                    id: `${baseEvent.id}_${currStart}`,
                    start: currStart,
                    end: currStart + duration,
                  });
                }
                currStart += 7 * 86400000;
              }
            } else {
              events.push(baseEvent);
            }
          } else {
            events.push(baseEvent);
          }
        }
      }
      continue;
    }

    if (!inEvent) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const keyPart = line.substring(0, colonIdx);
    const value = line.substring(colonIdx + 1);

    const upperKey = keyPart.toUpperCase();

    if (upperKey === "UID") {
      currentEvent.id = value.trim();
    } else if (upperKey.startsWith("SUMMARY")) {
      currentEvent.title = value.trim();
    } else if (upperKey.startsWith("DESCRIPTION")) {
      currentEvent.description = value.trim();
    } else if (upperKey.startsWith("LOCATION")) {
      currentEvent.location = value.trim();
    } else if (upperKey.startsWith("RRULE")) {
      currentEvent.rrule = value.trim();
    } else if (upperKey.startsWith("DTSTART")) {
      currentEvent.dtstartStr = value.trim();
    } else if (upperKey.startsWith("DTEND")) {
      currentEvent.dtendStr = value.trim();
    }
  }

  // Filter out events older than 24 hours ago, sort chronologically
  const threshold = Date.now() - 24 * 60 * 60 * 1000;
  return events
    .filter((e) => e.end >= threshold)
    .sort((a, b) => a.start - b.start);
}

// Intelligent URL Sanitizer & Google Calendar link converter
export function sanitizeCalendarUrl(rawInput: string): string {
  if (!rawInput) return "";
  let text = rawInput.trim();

  // If two concatenated URLs were pasted (e.g., ...basic.icshttps://...), extract the .ics URL
  const icsMatch = text.match(/(https?:\/\/[^\s"'<>]+\.ics)/i);
  if (icsMatch) {
    return icsMatch[1];
  }

  // If user pasted a Google embed link (e.g. https://calendar.google.com/calendar/embed?src=ayaanshilledar12%40gmail.com&...)
  const embedMatch = text.match(/calendar\.google\.com\/calendar\/embed\?[^#]*src=([^&]+)/i);
  if (embedMatch) {
    const src = embedMatch[1];
    return `https://calendar.google.com/calendar/ical/${src}/public/basic.ics`;
  }

  // Convert webcal to https
  if (text.startsWith("webcal://")) {
    return "https://" + text.substring(9);
  }

  return text;
}

export function useCalendar() {
  const [calendarUrl, setCalendarUrlState] = useState<string>("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const isBroadcastingRef = useRef<boolean>(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedUrl = localStorage.getItem(CALENDAR_URL_KEY);
      if (savedUrl) setCalendarUrlState(savedUrl);

      const savedEvents = localStorage.getItem(CALENDAR_EVENTS_KEY);
      if (savedEvents) setEvents(JSON.parse(savedEvents));

      const savedSync = localStorage.getItem(CALENDAR_LAST_SYNC_KEY);
      if (savedSync) setLastSyncedAt(parseInt(savedSync, 10));
    } catch (e) {
      console.error("Failed to load calendar store:", e);
    }

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (!event.data) return;
        isBroadcastingRef.current = true;
        const { type, payload } = event.data;
        if (type === "SYNC_CALENDAR_DATA") {
          setCalendarUrlState(payload.url);
          setEvents(payload.events);
          setLastSyncedAt(payload.lastSyncedAt);
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

  const broadcastCalendarData = useCallback(
    (url: string, newEvents: CalendarEvent[], syncTime: number) => {
      try {
        localStorage.setItem(CALENDAR_URL_KEY, url);
        localStorage.setItem(CALENDAR_EVENTS_KEY, JSON.stringify(newEvents));
        localStorage.setItem(CALENDAR_LAST_SYNC_KEY, syncTime.toString());

        if (channelRef.current && !isBroadcastingRef.current) {
          channelRef.current.postMessage({
            type: "SYNC_CALENDAR_DATA",
            payload: {
              url,
              events: newEvents,
              lastSyncedAt: syncTime,
            },
          });
        }
      } catch (e) {
        console.error(e);
      }
    },
    []
  );

  const syncCalendar = useCallback(
    async (overrideUrl?: string) => {
      const input = (overrideUrl !== undefined ? overrideUrl : calendarUrl).trim();
      if (!input) {
        setEvents([]);
        broadcastCalendarData("", [], Date.now());
        return;
      }

      const targetUrl = sanitizeCalendarUrl(input);

      setIsSyncing(true);
      setSyncError(null);

      try {
        let rawIcs = "";

        // Attempt Tauri native fetch first (avoids CORS)
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          rawIcs = await invoke<string>("fetch_calendar_feed", { url: targetUrl });
        } catch (tauriErr) {
          console.warn("Tauri fetch fallback to browser fetch:", tauriErr);
          const fetchUrl = targetUrl.startsWith("webcal://")
            ? targetUrl.replace("webcal://", "https://")
            : targetUrl;
          const res = await fetch(fetchUrl);
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          rawIcs = await res.text();
        }

        if (!rawIcs || !rawIcs.includes("BEGIN:VCALENDAR")) {
          if (rawIcs && (rawIcs.includes("<html") || rawIcs.includes("<!DOCTYPE") || rawIcs.includes("<HTML"))) {
            if (targetUrl.includes("/public/basic.ics")) {
              throw new Error(
                "This Google Calendar is private. In Google Calendar Settings > Integrate calendar, copy the \"Secret address in iCal format\" (.ics) link."
              );
            } else {
              throw new Error(
                "Google returned a webpage instead of calendar data. Please ensure you copied the \"Secret address in iCal format\" (.ics)."
              );
            }
          }
          throw new Error("Invalid calendar format. Please verify your .ics URL.");
        }

        const parsed = parseIcsFeed(rawIcs);
        const now = Date.now();
        setEvents(parsed);
        setLastSyncedAt(now);
        setCalendarUrlState(targetUrl);
        broadcastCalendarData(targetUrl, parsed, now);
      } catch (err: any) {
        console.error("Calendar sync error:", err);
        setSyncError(err.message || "Failed to sync calendar.");
      } finally {
        setIsSyncing(false);
      }
    },
    [calendarUrl, broadcastCalendarData]
  );

  const setCalendarUrl = useCallback(
    (url: string) => {
      const clean = url.trim();
      setCalendarUrlState(clean);
      try {
        localStorage.setItem(CALENDAR_URL_KEY, clean);
      } catch {}
      if (clean) {
        syncCalendar(clean);
      } else {
        setEvents([]);
        broadcastCalendarData("", [], Date.now());
      }
    },
    [syncCalendar, broadcastCalendarData]
  );

  // Auto-sync every 15 minutes
  useEffect(() => {
    if (!calendarUrl) return;
    const interval = setInterval(() => {
      syncCalendar();
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [calendarUrl, syncCalendar]);

  // Open external meeting link
  const openMeeting = useCallback(async (url: string) => {
    if (!url) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("open_external_url", { url });
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, []);

  // Filter events for Today
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000;

  const todayEvents = events.filter((e) => e.start < endOfToday && e.end >= startOfToday);

  // Next upcoming event
  const currentOrNextEvent = events.find((e) => e.end > Date.now());

  return {
    calendarUrl,
    setCalendarUrl,
    events,
    todayEvents,
    currentOrNextEvent,
    lastSyncedAt,
    isSyncing,
    syncError,
    syncCalendar,
    openMeeting,
  };
}
