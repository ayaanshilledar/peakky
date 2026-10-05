export interface CalendarDayItem {
  day: number;
  monthOffset: number; // -1 for prev, 0 for current, 1 for next
  dateObj: Date;
}

export function getCalendarDays(viewYear: number, viewMonth: number): CalendarDayItem[] {
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays: CalendarDayItem[] = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    calendarDays.push({
      day: d,
      monthOffset: -1,
      dateObj: new Date(viewYear, viewMonth - 1, d),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    calendarDays.push({
      day: d,
      monthOffset: 0,
      dateObj: new Date(viewYear, viewMonth, d),
    });
  }

  // Next month leading days to complete grid (up to 35 or 42 cells)
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    calendarDays.push({
      day: d,
      monthOffset: 1,
      dateObj: new Date(viewYear, viewMonth + 1, d),
    });
  }

  return calendarDays;
}

export function formatRelativeTime(ts: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 45) return "now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  return `${Math.floor(diffSec / 86400)}d`;
}
