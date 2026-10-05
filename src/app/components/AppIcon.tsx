"use client";

import React from "react";

export interface PresetApp {
  id: string;
  name: string;
  defaultTarget: string;
  defaultFallback?: string;
}

export const PRESET_APPS: PresetApp[] = [
  { id: "cursor", name: "Cursor", defaultTarget: "cursor", defaultFallback: "https://cursor.com" },
  { id: "chrome", name: "Chrome", defaultTarget: "chrome", defaultFallback: "https://google.com" },
  { id: "postman", name: "Postman", defaultTarget: "postman", defaultFallback: "https://web.postman.co" },
  { id: "docker", name: "Docker", defaultTarget: "docker", defaultFallback: "https://hub.docker.com" },
  { id: "vscode", name: "VS Code", defaultTarget: "code", defaultFallback: "https://vscode.dev" },
  { id: "terminal", name: "Terminal", defaultTarget: "wt", defaultFallback: "" },
  { id: "slack", name: "Slack", defaultTarget: "slack", defaultFallback: "https://slack.com" },
  { id: "spotify", name: "Spotify", defaultTarget: "spotify:", defaultFallback: "https://open.spotify.com" },
  { id: "notion", name: "Notion", defaultTarget: "notion:", defaultFallback: "https://notion.so" },
  { id: "figma", name: "Figma", defaultTarget: "figma:", defaultFallback: "https://figma.com" },
  { id: "discord", name: "Discord", defaultTarget: "discord:", defaultFallback: "https://discord.com/app" },
  { id: "obsidian", name: "Obsidian", defaultTarget: "obsidian:", defaultFallback: "https://obsidian.md" },
  { id: "github", name: "GitHub", defaultTarget: "https://github.com", defaultFallback: "https://github.com" },
];

export function AppIcon({
  iconType = "preset",
  iconValue = "cursor",
  className = "w-5 h-5",
}: {
  iconType?: "preset" | "image" | "url";
  iconValue?: string;
  className?: string;
}) {
  if (iconType === "image" || iconType === "url") {
    return (
      <img
        src={iconValue}
        alt="App Icon"
        className={`${className} object-contain rounded-md`}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  // Preset SVGs
  switch (iconValue) {
    case "cursor":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <polygon points="12,2.5 21,7.5 12,12.5 3,7.5" fill="#F4F4F5" />
          <polygon points="3,7.5 12,12.5 12,21.5 3,16.5" fill="#A1A1AA" />
          <polygon points="12,12.5 21,7.5 21,16.5 12,21.5" fill="#52525B" />
        </svg>
      );

    case "chrome":
      return (
        <svg className={className} viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 2C8.5 2 5.5 3.8 3.8 6.5l4.6 8A5.2 5.2 0 0 1 12 7.2h9.5A10 10 0 0 0 12 2z" />
          <path fill="#FBBC05" d="M21.5 7.2H12.5a5.2 5.2 0 0 1 4.5 2.6l-4.7 8.2L16 22A10 10 0 0 0 22 12c0-1.7-.4-3.3-.5-4.8z" />
          <path fill="#34A853" d="M12 16.8a5.2 5.2 0 0 1-4.5-2.6L2.8 6.8A10 10 0 0 0 2 12c0 5 3.7 9.2 8.6 9.9l4.6-8A5.2 5.2 0 0 1 12 16.8z" />
          <circle cx="12" cy="12" r="5" fill="#FFFFFF" />
          <circle cx="12" cy="12" r="3.8" fill="#1A73E8" />
        </svg>
      );

    case "postman":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10.5" fill="#FF6C37" />
          <path
            d="M17 7.5a4.5 4.5 0 0 0-4.5 4.5c0 .35.05.7.13 1.05l-3.3 3.3c-.3.3-.75.3-1.05 0l-.3-.3c-.3-.3-.3-.75 0-1.05l3.3-3.3a4.5 4.5 0 1 0 5.72-4.2zM12.5 13.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case "docker":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path
            fill="#2496ED"
            d="M22.5 10.5c-.4-.3-1.3-.4-2-.1-.2-.7-.6-1.3-1.2-1.7l-.5-.3-.3.5c-.5.8-.7 1.8-.5 2.7-.8.5-2 .6-2.5.6H2.5c-.3 0-.5.2-.5.5 0 2.7 1.1 5.3 3 7.3C7 21.8 9.6 23 12.3 23c5.5 0 10.1-4.2 10.5-9.7 0-.3-.2-.6-.5-.8zM13.5 10h1.8v1.8h-1.8zm-2.3 0h1.8v1.8h-1.8zm-2.3 0h1.8v1.8H8.9zm-2.3 0h1.8v1.8H6.6zm6.9-2.3h1.8v1.8h-1.8zm-2.3 0h1.8v1.8h-1.8zm-2.3 0h1.8v1.8H8.9zm2.3-2.3h1.8v1.8h-1.8z"
          />
        </svg>
      );

    case "vscode":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path
            d="M17.5 2.5 7.5 11 3.5 8 2 9.2l3.8 3.8L2 16.8 3.5 18l4-3 10 8.5 4.5-2.2V4.7L17.5 2.5zm0 5.2v8.6l-6-4.3 6-4.3z"
            fill="#007ACC"
          />
        </svg>
      );

    case "terminal":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#18181B" stroke="#27272A" strokeWidth="1.5" />
          <path d="m7 8 4 4-4 4M13 16h4" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "slack":
      return (
        <svg className={className} viewBox="0 0 24 24">
          <path fill="#E01E5A" d="M6 14.5a2.5 2.5 0 0 1-2.5-2.5 2.5 2.5 0 0 1 2.5-2.5h2.5v2.5a2.5 2.5 0 0 1-2.5 2.5zm0-5a2.5 2.5 0 0 1 2.5-2.5 2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-2.5 2.5 2.5 2.5 0 0 1-2.5-2.5v-5z" />
          <path fill="#36C5F0" d="M9.5 6a2.5 2.5 0 0 1 2.5-2.5 2.5 2.5 0 0 1 2.5 2.5v2.5h-2.5A2.5 2.5 0 0 1 9.5 6zm5 0a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5h-5A2.5 2.5 0 0 1 7 8.5 2.5 2.5 0 0 1 9.5 6h5z" />
          <path fill="#2EB67D" d="M18 9.5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5h-2.5v-2.5a2.5 2.5 0 0 1 2.5-2.5zm0 5a2.5 2.5 0 0 1-2.5 2.5 2.5 2.5 0 0 1-2.5-2.5v-5a2.5 2.5 0 0 1 2.5-2.5 2.5 2.5 0 0 1 2.5 2.5v5z" />
          <path fill="#ECB22E" d="M14.5 18a2.5 2.5 0 0 1-2.5 2.5 2.5 2.5 0 0 1-2.5-2.5v-2.5h2.5a2.5 2.5 0 0 1 2.5 2.5zm-5 0a2.5 2.5 0 0 1-2.5-2.5 2.5 2.5 0 0 1 2.5-2.5h5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5h-5z" />
        </svg>
      );

    case "spotify":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#1DB954" />
          <path
            d="M17.5 15.5c-.2.3-.5.4-.8.2-2.3-1.4-5.2-1.7-8.6-.9-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 3.8-.9 7-.5 9.6 1.1.3.2.4.5.2.8zm1.2-2.6c-.3.4-.8.5-1.2.3-2.6-1.6-6.6-2.1-9.7-1.1-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.5-1.1 7.9-.6 10.9 1.2.4.2.5.7.3 1.1zm.1-2.7C15.7 8.3 10.5 8.1 7.5 9c-.5.2-1.1-.1-1.2-.6-.2-.5.1-1.1.6-1.2 3.5-1.1 9.3-.8 12.8 1.3.5.3.6.9.3 1.4-.3.4-.9.6-1.4.3z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case "notion":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#FFFFFF" />
          <path
            d="M6 7.5c.8.2 1 .3 1.5 1.5l3.5 7.5V9.5c0-.8-.3-1.2-1-1.5l-1-.5V6.5h5.5v1l-1 .5c-.7.3-1 .7-1 1.5v9.5h-1.5L8.5 10v6.5c0 .8.3 1.2 1 1.5l1 .5v1H5v-1l1-.5c.7-.3 1-.7 1-1.5V9.5c0-.8-.3-1.2-1-1.5L5 7.5v-1h4v1H6z"
            fill="#000000"
          />
        </svg>
      );

    case "figma":
      return (
        <svg className={className} viewBox="0 0 24 24">
          <path fill="#0ACF83" d="M8 24a4 4 0 0 1-4-4 4 4 0 0 1 4-4h4v4a4 4 0 0 1-4 4z" />
          <path fill="#A259FF" d="M4 12a4 4 0 0 1 4-4h4v8H8a4 4 0 0 1-4-4z" />
          <path fill="#F24E1E" d="M4 4a4 4 0 0 1 4-4h4v8H8a4 4 0 0 1-4-4z" />
          <path fill="#FF7262" d="M12 0h4a4 4 0 0 1 4 4 4 4 0 0 1-4 4h-4V0z" />
          <circle cx="16" cy="12" r="4" fill="#1ABCFE" />
        </svg>
      );

    case "discord":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <rect width="20" height="20" x="2" y="2" rx="5" fill="#5865F2" />
          <path
            d="M16.5 8.2a9.5 9.5 0 0 0-2.4-.7.1.1 0 0 0-.1.1 6.6 6.6 0 0 0-.3.6 8.8 8.8 0 0 0-3.4 0 6.6 6.6 0 0 0-.3-.6.1.1 0 0 0-.1-.1 9.5 9.5 0 0 0-2.4.7.1.1 0 0 0 0 .1 9.8 9.8 0 0 0-1.5 7.6.1.1 0 0 0 .1.1 9.6 9.6 0 0 0 2.9 1.5.1.1 0 0 0 .1 0 6.9 6.9 0 0 0 .6-.9.1.1 0 0 0 0-.1 6.3 6.3 0 0 1-.9-.4.1.1 0 0 1 0-.1c.1 0 .2-.1.2-.1a6.8 6.8 0 0 0 5.8 0l.2.1a.1.1 0 0 1 0 .1 6.3 6.3 0 0 1-.9.4.1.1 0 0 0 0 .1c.2.3.4.6.6.9a.1.1 0 0 0 .1 0 9.6 9.6 0 0 0 2.9-1.5.1.1 0 0 0 .1-.1 9.8 9.8 0 0 0-1.5-7.6.1.1 0 0 0 0-.1zM9.5 14c-.6 0-1.1-.5-1.1-1.2s.5-1.2 1.1-1.2 1.1.5 1.1 1.2-.5 1.2-1.1 1.2zm5 0c-.6 0-1.1-.5-1.1-1.2s.5-1.2 1.1-1.2 1.1.5 1.1 1.2-.5 1.2-1.1 1.2z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case "obsidian":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path
            d="M17.5 2.5 11 6.5l-4.5 9 5 6 6-5.5 1.5-10.5-1.5-3z"
            fill="#7C3AED"
          />
          <path
            d="m11 6.5 6.5-4-1.5 3-1.5 10.5-3 5.5-5-6 4.5-9z"
            fill="#9333EA"
            opacity="0.85"
          />
          <path d="M11 6.5v15l-4.5-6 4.5-9z" fill="#C084FC" opacity="0.6" />
        </svg>
      );

    case "github":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
            fill="#FFFFFF"
          />
        </svg>
      );

    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="18" x="3" y="3" rx="4" />
          <path d="m9 9 6 6M15 9l-6 6" />
        </svg>
      );
  }
}
