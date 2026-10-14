export interface ParsedReminderResult {
  isReminder: boolean;
  title: string;
  targetTime: number; // Unix timestamp in ms
  formattedTime: string;
  originalInput: string;
}

/**
 * Natural language parser for relative and absolute time expressions.
 * Handles patterns like:
 * - "meeting in 40 mins" / "meeting in 40m" / "meeting in 2 hours" / "check oven in 30s"
 * - "call doc at 4:30pm" / "standup at 10am" / "workout at 18:00"
 */
export function parseReminderInput(input: string): ParsedReminderResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      isReminder: false,
      title: "",
      targetTime: 0,
      formattedTime: "",
      originalInput: input,
    };
  }

  const now = new Date();
  let targetMs = 0;
  let title = trimmed;

  // 1. Check relative duration pattern: "in X (m|mins|minutes|h|hr|hours|s|sec|secs)"
  // Matches: "meeting in 40 mins", "call mom in 1h 30m", "in 10m standup", "test in 30s"
  const relativeRegex = /\bin\s+(?:(\d+)\s*(?:h|hr|hrs|hour|hours))?\s*(?:(\d+)\s*(?:m|min|mins|minute|minutes))?\s*(?:(\d+)\s*(?:s|sec|secs|second|seconds))?\b/i;
  const relMatch = trimmed.match(relativeRegex);

  if (relMatch && (relMatch[1] || relMatch[2] || relMatch[3])) {
    const hours = parseInt(relMatch[1] || "0", 10);
    const mins = parseInt(relMatch[2] || "0", 10);
    const secs = parseInt(relMatch[3] || "0", 10);

    const totalAddedMs = (hours * 3600 + mins * 60 + secs) * 1000;
    if (totalAddedMs > 0) {
      targetMs = now.getTime() + totalAddedMs;
      title = trimmed.replace(relMatch[0], "").replace(/\s+/g, " ").trim();
    }
  }

  // 2. Check absolute time pattern: "at 4:30pm", "at 10am", "at 18:00"
  if (!targetMs) {
    const absoluteRegex = /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
    const absMatch = trimmed.match(absoluteRegex);

    if (absMatch) {
      let hours = parseInt(absMatch[1], 10);
      const minutes = parseInt(absMatch[2] || "0", 10);
      const meridian = absMatch[3] ? absMatch[3].toLowerCase() : null;

      if (meridian === "pm" && hours < 12) hours += 12;
      if (meridian === "am" && hours === 12) hours = 0;

      const targetDate = new Date(now);
      targetDate.setHours(hours, minutes, 0, 0);

      // If the target time today has already passed, schedule for tomorrow
      if (targetDate.getTime() <= now.getTime()) {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      targetMs = targetDate.getTime();
      title = trimmed.replace(absMatch[0], "").replace(/\s+/g, " ").trim();
    }
  }

  // Fallback title if user typed only time command (e.g. "in 40 mins")
  if (!title) {
    title = "Reminder";
  }

  const isReminder = targetMs > 0;
  const formattedTime = isReminder
    ? new Date(targetMs).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  return {
    isReminder,
    title,
    targetTime: targetMs,
    formattedTime,
    originalInput: trimmed,
  };
}
