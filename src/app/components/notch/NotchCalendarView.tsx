"use client";

import React, { useState } from "react";
import { CalendarEvent } from "../../hooks/useCalendar";
import { getCalendarDays } from "./notchUtils";

interface NotchCalendarViewProps {
  events: CalendarEvent[];
  openMeeting: (url: string) => void;
  onOpenSettings: (e: React.MouseEvent) => void;
}

export const NotchCalendarView: React.FC<NotchCalendarViewProps> = ({
  events,
  openMeeting,
  onOpenSettings,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMonthDate, setViewMonthDate] = useState<Date>(new Date());

  const now = Date.now();
  const viewYear = viewMonthDate.getFullYear();
  const viewMonth = viewMonthDate.getMonth(); // 0 - 11
  const monthName = viewMonthDate.toLocaleDateString([], { month: "short" });

  const calendarDays = getCalendarDays(viewYear, viewMonth);

  const todayDateObj = new Date();
  const isSelectedToday =
    selectedDate.getFullYear() === todayDateObj.getFullYear() &&
    selectedDate.getMonth() === todayDateObj.getMonth() &&
    selectedDate.getDate() === todayDateObj.getDate();

  // Events on selected day
  const selStart = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    0,
    0,
    0,
    0
  ).getTime();
  const selEnd = selStart + 24 * 60 * 60 * 1000;
  const selectedDayEvents = events.filter((e) => e.start < selEnd && e.end >= selStart);

  return (
    <div className="flex-1 flex items-stretch justify-between mt-2.5 overflow-hidden gap-4">
      {/* Left Column: Mini Month Calendar Grid */}
      <div className="w-[185px] flex flex-col justify-between shrink-0 select-none">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-1 pb-1.5 border-b border-white/[0.06]">
          <span className="text-[11px] font-mono font-medium text-zinc-200 uppercase tracking-wider">
            {monthName} {viewYear}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setViewMonthDate(new Date(viewYear, viewMonth - 1, 1))
              }
              title="Previous month"
              className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer text-[10px] font-mono"
            >
              ‹
            </button>
            <button
              onClick={() => {
                const t = new Date();
                setViewMonthDate(t);
                setSelectedDate(t);
              }}
              title="Jump to Today"
              className="text-[10px] font-mono text-zinc-400 hover:text-blue-400 px-1.5 py-0.5 hover:bg-blue-500/10 rounded transition-colors cursor-pointer"
            >
              •
            </button>
            <button
              onClick={() =>
                setViewMonthDate(new Date(viewYear, viewMonth + 1, 1))
              }
              title="Next month"
              className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer text-[10px] font-mono"
            >
              ›
            </button>
          </div>
        </div>

        {/* Days of Week Row */}
        <div className="grid grid-cols-7 text-center py-1.5">
          {["S", "M", "T", "W", "T", "F", "S"].map((dayName, idx) => (
            <span
              key={idx}
              className="text-[9px] font-mono text-zinc-500 font-semibold"
            >
              {dayName}
            </span>
          ))}
        </div>

        {/* Dates Grid */}
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {calendarDays.slice(0, 35).map((item, idx) => {
            const isSelected =
              item.dateObj.getFullYear() === selectedDate.getFullYear() &&
              item.dateObj.getMonth() === selectedDate.getMonth() &&
              item.dateObj.getDate() === selectedDate.getDate();

            const isToday =
              item.dateObj.getFullYear() === todayDateObj.getFullYear() &&
              item.dateObj.getMonth() === todayDateObj.getMonth() &&
              item.dateObj.getDate() === todayDateObj.getDate();

            const dayStart = new Date(
              item.dateObj.getFullYear(),
              item.dateObj.getMonth(),
              item.dateObj.getDate(),
              0,
              0,
              0,
              0
            ).getTime();
            const dayEnd = dayStart + 24 * 60 * 60 * 1000;
            const hasEvent = events.some(
              (e) => e.start < dayEnd && e.end >= dayStart
            );

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(item.dateObj)}
                className={`w-6 h-5.5 mx-auto rounded flex flex-col items-center justify-center relative text-[10px] font-mono transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-blue-500 text-white font-semibold shadow-sm shadow-blue-500/30"
                    : isToday
                    ? "text-blue-400 font-bold bg-blue-500/10 border border-blue-500/20"
                    : item.monthOffset !== 0
                    ? "text-zinc-700 hover:text-zinc-500"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <span className="leading-none">{item.day}</span>
                {hasEvent && (
                  <span
                    className={`w-1 h-1 rounded-full absolute bottom-0.5 ${
                      isSelected ? "bg-white" : "bg-blue-400"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Selected Day Agenda */}
      <div className="flex-1 flex flex-col justify-between border-l border-white/[0.06] pl-4 min-w-0">
        {/* Selected Date Header */}
        <div className="pb-1.5 border-b border-white/[0.04]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 font-medium truncate block">
            {isSelectedToday
              ? `Today • ${selectedDate.toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}`
              : selectedDate.toLocaleDateString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
          </span>
        </div>

        {/* Events Mini List for Selected Date */}
        <div className="flex-1 overflow-y-auto max-h-[135px] pr-0.5 space-y-2 mt-2 no-scrollbar">
          {selectedDayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-zinc-500 text-center">
              <span className="text-[11px] font-mono text-zinc-400">
                No events
              </span>
              <button
                onClick={onOpenSettings}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 mt-1.5 font-mono hover:underline cursor-pointer"
              >
                Configure in Settings
              </button>
            </div>
          ) : (
            selectedDayEvents.map((ev) => {
              const isLive = now >= ev.start && now <= ev.end;
              const timeStr = ev.allDay
                ? "All day"
                : new Date(ev.start).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  });

              return (
                <div
                  key={ev.id}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Live indicator or time */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isLive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                      )}
                      <span
                        className={`text-[10px] font-mono tabular-nums ${
                          isLive
                            ? "text-emerald-300 font-semibold"
                            : "text-zinc-400"
                        }`}
                      >
                        {timeStr}
                      </span>
                    </div>

                    <span
                      className={`text-xs truncate ${
                        isLive ? "text-white font-medium" : "text-zinc-200"
                      }`}
                    >
                      {ev.title}
                    </span>
                  </div>

                  {ev.meetingUrl && (
                    <button
                      onClick={() => openMeeting(ev.meetingUrl!)}
                      title="Join video call"
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <span>meet</span>
                      <span>↗</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
