"use client";

import React, { useState } from "react";
import { useFocusTimer } from "../hooks/useFocusTimer";
import { usePeakyStore } from "../hooks/usePeakyStore";
import { useCalendar, sanitizeCalendarUrl } from "../hooks/useCalendar";
import { useClipboardStore, ClipboardItem } from "../hooks/useClipboardStore";

type SettingsSection = "tasks" | "projects" | "calendar" | "clipboard" | "timer" | "general" | "about";
type TaskFilter = "all" | "active" | "completed";


export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("tasks");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const [newTaskInput, setNewTaskInput] = useState("");
  const [noteSearch, setNoteSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Calendar state
  const {
    calendarUrl,
    setCalendarUrl,
    events,
    lastSyncedAt,
    isSyncing,
    syncError,
    syncCalendar,
    openMeeting,
  } = useCalendar();
  const [calInput, setCalInput] = useState(calendarUrl);
  const [showCalGuide, setShowCalGuide] = useState(false);

  // Keep calInput updated when calendarUrl loads
  React.useEffect(() => {
    setCalInput(calendarUrl);
  }, [calendarUrl]);

  // Profile Name inline edit
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfileName, setTempProfileName] = useState("");

  const [launchAtStartup, setLaunchAtStartup] = useState(true);
  const [keepOnTop, setKeepOnTop] = useState(true);

  const { settings, updateSettings } = useFocusTimer();
  const {
    tasks,
    activeTasks,
    completedTasks,
    notes,
    profileName,
    setProfileName,
    addTask,
    toggleTask,
    deleteTask,
    clearCompletedTasks,
    deleteNote,
  } = usePeakyStore();

  const {
    items: clipItems,
    filteredItems: filteredClips,
    copiedId: copiedClipId,
    searchQuery: clipSearch,
    setSearchQuery: setClipSearch,
    filterType: clipTypeFilter,
    setFilterType: setClipTypeFilter,
    copyItem: copyClipItem,
    deleteItem: deleteClipItem,
    togglePin: toggleClipPin,
    clearAll: clearAllClips,
  } = useClipboardStore();

  const [clipFilterTab, setClipFilterTab] = useState<"all" | "text" | "image" | "pinned">("all");


  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskInput.trim()) return;
    addTask(newTaskInput.trim());
    setNewTaskInput("");
  };

  const handleSaveProfile = () => {
    if (tempProfileName.trim()) {
      setProfileName(tempProfileName.trim());
    }
    setIsEditingProfile(false);
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === "active") return !t.completed;
    if (taskFilter === "completed") return t.completed;
    return true;
  });

  const filteredNotes = notes.filter((n) =>
    n.text.toLowerCase().includes(noteSearch.toLowerCase())
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="h-screen w-screen bg-black text-zinc-100 flex p-2 gap-2 font-sans select-none overflow-hidden antialiased">
      {/* Sidebar Navigation on Pure Black Canvas */}
      <aside className="w-56 bg-black flex flex-col justify-between p-3.5 shrink-0">
        <div className="flex flex-col gap-5">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2">
              {/* 3-bar logo mark */}
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-3.5 bg-zinc-200 rounded-full inline-block" />
                <span className="w-1 h-2 bg-zinc-400 rounded-full inline-block" />
                <span className="w-1 h-4 bg-zinc-200 rounded-full inline-block" />
              </div>
              <span className="text-sm font-semibold text-white tracking-tight font-serif-cardboard">Peaky</span>
            </div>
            {/* Sidebar window toggle icon */}
            <button
              title="Sidebar Layout"
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-900/60 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <rect width="18" height="18" x="3" y="3" rx="3" />
                <path d="M9 3v18" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {/* Home */}
            <button
              onClick={() => setActiveSection("tasks")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                activeSection === "tasks"
                  ? "bg-[#18181c] text-white shadow-sm border border-white/[0.04]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
              }`}
            >
              <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Home</span>
            </button>

            {/* Projects */}
            <button
              onClick={() => setActiveSection("projects")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                activeSection === "projects"
                  ? "bg-[#18181c] text-white shadow-sm border border-white/[0.04]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
              }`}
            >
              <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
              </svg>
              <span>Projects</span>
            </button>

            {/* Calendar */}
            <button
              onClick={() => setActiveSection("calendar")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                activeSection === "calendar"
                  ? "bg-[#18181c] text-white shadow-sm border border-white/[0.04]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
              }`}
            >
              <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              <span>Calendar</span>
            </button>

            {/* Clipboard History */}
            <button
              onClick={() => setActiveSection("clipboard")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                activeSection === "clipboard"
                  ? "bg-[#18181c] text-white shadow-sm border border-white/[0.04]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
              }`}
            >
              <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              </svg>
              <span>Clipboard</span>
            </button>


            {/* Timer Settings */}
            <button
              onClick={() => setActiveSection("timer")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                activeSection === "timer"
                  ? "bg-[#18181c] text-white shadow-sm border border-white/[0.04]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
              }`}
            >
              <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Timer Settings</span>
            </button>

            {/* General Settings */}
            <button
              onClick={() => setActiveSection("general")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                activeSection === "general"
                  ? "bg-[#18181c] text-white shadow-sm border border-white/[0.04]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
              }`}
            >
              <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>General Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex flex-col gap-2 pt-3">
          {/* Upgrade Button */}
          <button
            onClick={() => setActiveSection("about")}
            className="w-full bg-[#121216] hover:bg-[#18181e] border border-white/[0.06] text-zinc-200 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all cursor-pointer group"
          >
            <svg className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Upgrade</span>
          </button>

          {/* Need any help */}
          <button
            onClick={() => setActiveSection("about")}
            className="w-full text-zinc-400 hover:text-zinc-200 px-3 py-1.5 text-xs flex items-center gap-2 transition-colors cursor-pointer text-left"
          >
            <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Need any help?</span>
          </button>

          {/* User Profile Row (Interactive & Editable) */}
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 border-t border-white/[0.04] pt-3">
            <svg className="w-3.5 h-3.5 text-zinc-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
            </svg>
            {isEditingProfile ? (
              <input
                type="text"
                autoFocus
                value={tempProfileName}
                onChange={(e) => setTempProfileName(e.target.value)}
                onBlur={handleSaveProfile}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveProfile();
                  if (e.key === "Escape") setIsEditingProfile(false);
                }}
                className="bg-zinc-900 border border-white/20 rounded px-1.5 py-0.5 text-xs text-white outline-none w-full"
              />
            ) : (
              <span
                onClick={() => {
                  setTempProfileName(profileName);
                  setIsEditingProfile(true);
                }}
                title="Click to edit profile name"
                className="font-medium tracking-tight truncate flex-1 cursor-pointer hover:text-white transition-colors"
              >
                {profileName}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Canvas Area: Curved Inset Card Container (Exact Cardboard Design) */}
      <main className="flex-1 bg-[#0d0d10] border border-white/[0.05] rounded-[22px] p-8 lg:p-12 overflow-y-auto flex flex-col items-center shadow-2xl relative">
        {/* SECTION CONTENT CONTAINER */}
        <div className="w-full max-w-2xl flex flex-col gap-6 mt-2">
          {/* HOME / TASKS & TODOS SECTION */}
          {activeSection === "tasks" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-tight">Tasks & Todos</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Manage, filter, and review completed items.</p>
                </div>
                {completedTasks.length > 0 && (
                  <button
                    onClick={clearCompletedTasks}
                    className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Clear Completed ({completedTasks.length})
                  </button>
                )}
              </div>

              {/* Quick Task Creation Input */}
              <form onSubmit={handleAddTask} className="relative">
                <input
                  type="text"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder="Add a new task or todo..."
                  className="w-full bg-[#121217] border border-white/[0.06] focus:border-white/[0.2] rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none font-sans transition-colors"
                />
              </form>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-[#121217] p-1 rounded-xl border border-white/[0.04] w-fit">
                <button
                  onClick={() => setTaskFilter("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    taskFilter === "all"
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  All ({tasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter("active")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    taskFilter === "active"
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Active ({activeTasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter("completed")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    taskFilter === "completed"
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Completed ({completedTasks.length})
                </button>
              </div>

              {/* Tasks List */}
              <div className="bg-[#121217] border border-white/[0.06] rounded-xl overflow-hidden divide-y divide-white/[0.04]">
                {filteredTasks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500 font-mono">
                    No tasks found in this view.
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group gap-3"
                    >
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            task.completed
                              ? "bg-emerald-500 border-emerald-500 text-black"
                              : "border-white/[0.2] hover:border-white/[0.4]"
                          }`}
                        >
                          {task.completed && (
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span
                          className={`text-xs transition-all ${
                            task.completed ? "line-through text-zinc-500" : "text-zinc-200"
                          }`}
                        >
                          {task.text}
                        </span>
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-600">
                          {formatTimestamp(task.createdAt)}
                        </span>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 text-sm px-1 transition-all cursor-pointer"
                          title="Delete task"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* PROJECTS / NOTES ARCHIVE SECTION */}
          {activeSection === "projects" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-sm font-semibold text-white tracking-tight">Projects & Notes Archive</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Chronological timeline of thoughts captured during workflow.</p>
              </div>

              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  placeholder="Search captured notes..."
                  className="w-full bg-[#121217] border border-white/[0.06] focus:border-white/[0.2] rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none font-sans transition-colors"
                />
              </div>

              {/* Notes List */}
              <div className="bg-[#121217] border border-white/[0.06] rounded-xl overflow-hidden divide-y divide-white/[0.04]">
                {filteredNotes.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500 font-mono">
                    No notes found. Capture them directly from your Mac Notch!
                  </div>
                ) : (
                  filteredNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 flex items-start justify-between hover:bg-white/[0.02] transition-colors group gap-4"
                    >
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <p className="text-xs text-zinc-200 whitespace-pre-wrap break-words leading-relaxed">
                          {note.text}
                        </p>
                        <span className="text-[10px] font-mono text-zinc-600">
                          {formatTimestamp(note.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <button
                          onClick={() => handleCopy(note.id, note.text)}
                          className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedId === note.id ? "Copied ✓" : "Copy"}
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 text-sm px-1 transition-all cursor-pointer"
                          title="Delete note"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* CALENDAR SECTION */}
          {activeSection === "calendar" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-tight">Calendar Sync</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Connect Google Calendar or iCal feed to sync your agenda.</p>
                </div>
                {lastSyncedAt && (
                  <span className="text-[10px] font-mono text-zinc-500">
                    Synced {formatTimestamp(lastSyncedAt)}
                  </span>
                )}
              </div>

              {/* Feed URL Input Card */}
              <div className="bg-[#121217] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (calInput.trim()) {
                      const cleaned = sanitizeCalendarUrl(calInput.trim());
                      setCalInput(cleaned);
                      setCalendarUrl(cleaned);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="url"
                    value={calInput}
                    onChange={(e) => setCalInput(e.target.value)}
                    placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                    className="flex-1 bg-black/40 border border-white/[0.08] focus:border-white/[0.25] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none font-mono transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isSyncing ? "Syncing..." : "Sync"}
                  </button>
                  {calendarUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCalInput("");
                        setCalendarUrl("");
                      }}
                      className="text-xs text-zinc-500 hover:text-rose-400 px-2 py-2 transition-colors cursor-pointer"
                      title="Clear calendar feed"
                    >
                      Clear
                    </button>
                  )}
                </form>

                {syncError && (
                  <div className="text-[11px] font-mono text-rose-400 bg-rose-950/20 border border-rose-900/40 rounded-lg p-2.5">
                    Error: {syncError}
                  </div>
                )}

                {/* Guide toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCalGuide(!showCalGuide)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1 font-mono"
                  >
                    <span>{showCalGuide ? "▾" : "▸"}</span>
                    <span>How to get Google Calendar Secret iCal Link</span>
                  </button>

                  {showCalGuide && (
                    <div className="mt-2.5 p-3 rounded-lg bg-black/50 border border-white/[0.04] text-[11px] text-zinc-400 space-y-1.5 font-sans leading-relaxed">
                      <p>1. Open <strong className="text-zinc-300">Google Calendar</strong> on your desktop browser.</p>
                      <p>2. Click the gear icon → <strong className="text-zinc-300">Settings</strong>.</p>
                      <p>3. In left sidebar, click your calendar under <strong className="text-zinc-300">&quot;Settings for my calendars&quot;</strong>.</p>
                      <p>4. Scroll to <strong className="text-zinc-300">&quot;Integrate calendar&quot;</strong> section.</p>
                      <p>5. Copy the <strong className="text-zinc-300">&quot;Secret address in iCal format&quot;</strong> link and paste it above.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Events Agenda Preview */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                    Upcoming Events ({events.length})
                  </h3>
                  {events.length > 0 && (
                    <button
                      onClick={() => syncCalendar()}
                      disabled={isSyncing}
                      className="text-[11px] font-mono text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      {isSyncing ? "Refreshing..." : "↻ Refresh Feed"}
                    </button>
                  )}
                </div>

                <div className="bg-[#121217] border border-white/[0.06] rounded-xl overflow-hidden divide-y divide-white/[0.04]">
                  {events.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500 font-mono">
                      {calendarUrl
                        ? "No upcoming events found in feed."
                        : "No calendar connected. Paste your iCal link above to sync events."}
                    </div>
                  ) : (
                    events.slice(0, 15).map((ev) => {
                      const startDate = new Date(ev.start);
                      const isToday =
                        startDate.toDateString() === new Date().toDateString();
                      const dateLabel = isToday
                        ? "Today"
                        : startDate.toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          });
                      const timeLabel = ev.allDay
                        ? "All day"
                        : `${startDate.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })} – ${new Date(ev.end).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}`;

                      const isLive = Date.now() >= ev.start && Date.now() <= ev.end;

                      return (
                        <div
                          key={ev.id}
                          className="p-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex flex-col shrink-0 min-w-[75px]">
                              <span className="text-[10px] font-mono text-zinc-400 font-medium">
                                {dateLabel}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-500">
                                {timeLabel}
                              </span>
                            </div>

                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                {isLive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 inline-block animate-pulse" />
                                )}
                                <span className="text-xs font-medium text-zinc-200 truncate">
                                  {ev.title}
                                </span>
                              </div>
                              {ev.location && (
                                <span className="text-[10px] text-zinc-500 truncate mt-0.5">
                                  📍 {ev.location}
                                </span>
                              )}
                            </div>
                          </div>

                          {ev.meetingUrl && (
                            <button
                              onClick={() => openMeeting(ev.meetingUrl!)}
                              className="text-[10px] font-mono px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                            >
                              <span>Join</span>
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
          )}

          {/* CLIPBOARD HISTORY SECTION */}
          {activeSection === "clipboard" && (
            <div className="flex flex-col gap-5">
              {/* Section Title & Subtitle */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-tight">Clipboard History</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Real-time log of captured texts, URLs, and desktop screenshots.
                  </p>
                </div>
                {clipItems.length > 0 && (
                  <button
                    onClick={clearAllClips}
                    className="text-xs text-zinc-500 hover:text-rose-400 border border-white/[0.06] hover:border-rose-500/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {/* Controls: Search & Tabs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <svg
                    className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    value={clipSearch}
                    onChange={(e) => setClipSearch(e.target.value)}
                    placeholder="Search clips, text, links..."
                    className="w-full bg-[#121217] border border-white/[0.06] focus:border-white/[0.2] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
                  />
                  {clipSearch && (
                    <button
                      onClick={() => setClipSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center bg-[#121217] border border-white/[0.06] p-1 rounded-xl gap-1 shrink-0">
                  {(
                    [
                      { id: "all", label: "All", count: clipItems.length },
                      {
                        id: "text",
                        label: "Text",
                        count: clipItems.filter((i) => i.type === "text").length,
                      },
                      {
                        id: "image",
                        label: "Screenshots",
                        count: clipItems.filter((i) => i.type === "image").length,
                      },
                      {
                        id: "pinned",
                        label: "Pinned",
                        count: clipItems.filter((i) => i.pinned).length,
                      },
                    ] as const
                  ).map((tab) => {
                    const isActive = clipFilterTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setClipFilterTab(tab.id);
                          if (tab.id === "all" || tab.id === "text" || tab.id === "image") {
                            setClipTypeFilter(tab.id);
                          }
                        }}
                        className={`text-xs px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                          isActive
                            ? "bg-zinc-800 text-white shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className="text-[10px] font-mono opacity-60">({tab.count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clips List */}
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
                {(() => {
                  const displayItems = filteredClips.filter((it) => {
                    if (clipFilterTab === "pinned") return it.pinned;
                    if (clipFilterTab === "text") return it.type === "text";
                    if (clipFilterTab === "image") return it.type === "image";
                    return true;
                  });

                  if (displayItems.length === 0) {
                    return (
                      <div className="bg-[#121217] border border-white/[0.06] rounded-xl p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/[0.06] flex items-center justify-center text-zinc-500 mb-3">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                          </svg>
                        </div>
                        <h4 className="text-xs font-semibold text-zinc-300">
                          {clipSearch ? "No matching clipboard items" : "No items in clipboard"}
                        </h4>
                        <p className="text-[11px] text-zinc-500 mt-1 max-w-xs font-mono">
                          Copy any text or take a screenshot with Win + Shift + S to see it here.
                        </p>
                      </div>
                    );
                  }

                  return displayItems.map((item) => {
                    const isCopied = copiedClipId === item.id;
                    const timestampStr = formatTimestamp(item.timestamp);

                    return (
                      <div
                        key={item.id}
                        className={`group bg-[#121217] hover:bg-[#16161c] border transition-all rounded-xl p-3.5 flex items-start justify-between gap-4 ${
                          isCopied
                            ? "border-emerald-500/30 shadow-sm"
                            : "border-white/[0.06] hover:border-white/[0.12]"
                        }`}
                      >
                        {/* Item Content Preview */}
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          {item.type === "image" ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 min-w-0 flex-1">
                              <img
                                src={item.content}
                                alt="Screenshot"
                                className="w-24 h-16 object-cover rounded-lg border border-white/10 bg-black shrink-0"
                              />
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-white">
                                    Desktop Screenshot
                                  </span>
                                  {item.width && item.height && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/[0.04]">
                                      {item.width} × {item.height}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] font-mono text-zinc-500 mt-1">
                                  Captured {timestampStr}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col min-w-0 flex-1">
                              <p className="text-xs text-zinc-200 font-mono whitespace-pre-wrap break-all line-clamp-3 leading-relaxed selection:bg-zinc-700">
                                {item.content}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-mono text-zinc-500">
                                  {item.charCount || item.content.length} characters
                                </span>
                                <span className="text-[10px] font-mono text-zinc-600">•</span>
                                <span className="text-[10px] font-mono text-zinc-500">
                                  {timestampStr}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Copy Button */}
                          <button
                            onClick={() => copyClipItem(item)}
                            className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                              isCopied
                                ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40"
                                : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border-white/[0.06]"
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <span className="font-mono">✓</span>
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth={2}>
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {/* Pin Button */}
                          <button
                            onClick={() => toggleClipPin(item.id)}
                            title={item.pinned ? "Unpin" : "Pin to top"}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              item.pinned
                                ? "bg-amber-950/30 text-amber-400 border-amber-500/30"
                                : "bg-zinc-800/40 text-zinc-400 hover:text-white border-white/[0.04] hover:bg-zinc-800"
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={item.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                              <path d="M12 2v8m0 0l3-3m-3 3L9 7" />
                              <path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" />
                            </svg>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => deleteClipItem(item.id)}
                            title="Delete from history"
                            className="p-1.5 rounded-lg bg-zinc-800/40 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-white/[0.04] hover:border-rose-500/30 transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth={2}>
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* FOCUS TIMER SECTION */}
          {activeSection === "timer" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-sm font-semibold text-white tracking-tight">Focus Timer</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Configure session durations and acoustic feedback.</p>
              </div>


              <div className="bg-[#121217] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-5">
                {/* Focus Duration */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-300 font-medium">Session Duration</span>
                    <span className="text-xs font-mono text-zinc-200 font-medium">{settings.focusMinutes} min</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="90"
                      value={settings.focusMinutes}
                      onChange={(e) => updateSettings({ focusMinutes: Number(e.target.value) })}
                      className="flex-1 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex gap-1">
                      {[15, 25, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => updateSettings({ focusMinutes: mins })}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                            settings.focusMinutes === mins
                              ? "bg-zinc-800 text-white border-zinc-600"
                              : "bg-zinc-900 text-zinc-400 border-white/[0.04] hover:text-zinc-200"
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/[0.04]" />

                {/* Sound alert */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs text-zinc-300 font-medium">Completion Chime</h4>
                    <p className="text-[11px] text-zinc-500">Play a gentle tone when the focus timer completes.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                    className="w-4 h-4 accent-zinc-200 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* GENERAL SECTION */}
          {activeSection === "general" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-sm font-semibold text-white tracking-tight">General Settings</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Application startup and window overlay behavior.</p>
              </div>

              <div className="bg-[#121217] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs text-zinc-300 font-medium">Profile Name</h4>
                    <p className="text-[11px] text-zinc-500">Personalize your greeting and workspace.</p>
                  </div>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="bg-zinc-900 border border-white/[0.08] focus:border-white/[0.25] rounded-lg px-3 py-1.5 text-xs text-white outline-none w-44"
                  />
                </div>

                <div className="h-px bg-white/[0.04]" />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs text-zinc-300 font-medium">Launch on Windows Startup</h4>
                    <p className="text-[11px] text-zinc-500">Automatically launch Peaky on system login.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={launchAtStartup}
                    onChange={(e) => setLaunchAtStartup(e.target.checked)}
                    className="w-4 h-4 accent-zinc-200 rounded cursor-pointer"
                  />
                </div>

                <div className="h-px bg-white/[0.04]" />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs text-zinc-300 font-medium">Always on Top</h4>
                    <p className="text-[11px] text-zinc-500">Keep the notch floating above other desktop windows.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={keepOnTop}
                    onChange={(e) => setKeepOnTop(e.target.checked)}
                    className="w-4 h-4 accent-zinc-200 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABOUT SECTION */}
          {activeSection === "about" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-sm font-semibold text-white tracking-tight">About Peaky</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Minimalist desktop workspace and dynamic notch overlay.</p>
              </div>

              <div className="bg-[#121217] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-zinc-500">Version</span>
                  <span className="text-xs font-mono text-zinc-300">0.1.0</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-zinc-500">Engine</span>
                  <span className="text-xs font-mono text-zinc-300">Tauri v2 + Rust</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-zinc-500">Design System</span>
                  <span className="text-xs font-mono text-zinc-300">Peaky Matte Obsidian</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
