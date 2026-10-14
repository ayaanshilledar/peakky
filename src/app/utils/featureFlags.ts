export type FeatureFlagKey =
  | "home"
  | "timer"
  | "tasks"
  | "calendar"
  | "clips"
  | "media"
  | "reminders"
  | "systemOSD"
  | "chat"
  | "agent"
  | "experimental";

export interface FeatureFlagMeta {
  key: FeatureFlagKey;
  envVar: string;
  name: string;
  description: string;
  defaultValue: boolean;
}

export const FEATURE_FLAG_DEFINITIONS: Record<FeatureFlagKey, FeatureFlagMeta> = {
  home: {
    key: "home",
    envVar: "NEXT_PUBLIC_FEATURE_HOME",
    name: "Dashboard Home",
    description: "Enables unified Dashboard Home page with mini widgets in the Mac Notch interface.",
    defaultValue: true,
  },
  timer: {
    key: "timer",
    envVar: "NEXT_PUBLIC_FEATURE_TIMER",
    name: "Focus Timer",
    description: "Enables the Pomodoro / Focus Timer in the Mac Notch interface.",
    defaultValue: true,
  },
  tasks: {
    key: "tasks",
    envVar: "NEXT_PUBLIC_FEATURE_TASKS",
    name: "Tasks & Notes",
    description: "Enables Task list management and quick scratchpad notes.",
    defaultValue: true,
  },
  calendar: {
    key: "calendar",
    envVar: "NEXT_PUBLIC_FEATURE_CALENDAR",
    name: "Calendar Integration",
    description: "Enables iCal calendar sync and upcoming event tracking.",
    defaultValue: true,
  },
  clips: {
    key: "clips",
    envVar: "NEXT_PUBLIC_FEATURE_CLIPS",
    name: "Clipboard History",
    description: "Enables rich clipboard history tracking and quick copy snippets.",
    defaultValue: true,
  },
  media: {
    key: "media",
    envVar: "NEXT_PUBLIC_FEATURE_MEDIA",
    name: "Media Controls",
    description: "Enables media playback detection and playback controls.",
    defaultValue: true,
  },
  reminders: {
    key: "reminders",
    envVar: "NEXT_PUBLIC_FEATURE_REMINDERS",
    name: "Reminders & Alarms",
    description: "Enables natural language reminders, alarms, and live countdown pills.",
    defaultValue: true,
  },
  systemOSD: {
    key: "systemOSD",
    envVar: "NEXT_PUBLIC_FEATURE_SYSTEM_OSD",
    name: "Volume & Brightness HUD",
    description: "Enables macOS Dynamic Island style Volume and Brightness OSD overlays.",
    defaultValue: true,
  },
  chat: {
    key: "chat",
    envVar: "NEXT_PUBLIC_FEATURE_CHAT",
    name: "AI Assistant Chat",
    description: "Enables AI companion chat and natural language actions.",
    defaultValue: false,
  },
  agent: {
    key: "agent",
    envVar: "NEXT_PUBLIC_FEATURE_AGENT",
    name: "Autonomous Agent",
    description: "Enables agentic background task execution features.",
    defaultValue: false,
  },
  experimental: {
    key: "experimental",
    envVar: "NEXT_PUBLIC_FEATURE_EXPERIMENTAL",
    name: "Experimental Features",
    description: "Enables early-stage experimental features and UI lab testing.",
    defaultValue: false,
  },
};

const OVERRIDES_STORAGE_KEY = "peaky_feature_flag_overrides";

/**
 * Parses raw environment variable values into a boolean flag.
 */
export function parseEnvBoolean(val: string | undefined, defaultValue: boolean): boolean {
  if (val === undefined || val === null || val === "") {
    return defaultValue;
  }
  const normalized = val.trim().toLowerCase();
  if (["true", "1", "yes", "on", "enabled"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "off", "disabled"].includes(normalized)) {
    return false;
  }
  return defaultValue;
}

/**
 * Gets the environment variable value for a specific feature flag.
 */
export function getEnvFeatureFlag(key: FeatureFlagKey): boolean {
  const meta = FEATURE_FLAG_DEFINITIONS[key];
  if (!meta) return true;

  const envValue = process.env[meta.envVar];
  return parseEnvBoolean(envValue, meta.defaultValue);
}

/**
 * Gets all environment variable flag values.
 */
export function getEnvFeatureFlags(): Record<FeatureFlagKey, boolean> {
  const flags = {} as Record<FeatureFlagKey, boolean>;
  (Object.keys(FEATURE_FLAG_DEFINITIONS) as FeatureFlagKey[]).forEach((key) => {
    flags[key] = getEnvFeatureFlag(key);
  });
  return flags;
}

/**
 * Retrieves runtime overrides stored in localStorage (if any).
 */
export function getFeatureFlagOverrides(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to parse feature flag overrides from localStorage", e);
    return {};
  }
}

/**
 * Gets the final effective value of a feature flag considering env defaults and local runtime overrides.
 */
export function getEffectiveFeatureFlag(key: FeatureFlagKey): boolean {
  const overrides = getFeatureFlagOverrides();
  if (key in overrides && typeof overrides[key] === "boolean") {
    return overrides[key];
  }
  return getEnvFeatureFlag(key);
}

/**
 * Gets all effective feature flag values.
 */
export function getEffectiveFeatureFlags(): Record<FeatureFlagKey, boolean> {
  const flags = {} as Record<FeatureFlagKey, boolean>;
  const overrides = getFeatureFlagOverrides();

  (Object.keys(FEATURE_FLAG_DEFINITIONS) as FeatureFlagKey[]).forEach((key) => {
    if (key in overrides && typeof overrides[key] === "boolean") {
      flags[key] = overrides[key];
    } else {
      flags[key] = getEnvFeatureFlag(key);
    }
  });

  return flags;
}

/**
 * Set or remove a runtime override for a feature flag.
 * Pass `null` to clear the override and revert to the environment default.
 */
export function setFeatureFlagOverride(key: FeatureFlagKey, enabled: boolean | null): void {
  if (typeof window === "undefined") return;
  try {
    const overrides = getFeatureFlagOverrides();
    if (enabled === null) {
      delete overrides[key];
    } else {
      overrides[key] = enabled;
    }
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
    window.dispatchEvent(new Event("peaky_feature_flags_updated"));
  } catch (e) {
    console.error("Failed to save feature flag override", e);
  }
}

/**
 * Resets all local overrides back to environment defaults.
 */
export function resetFeatureFlagOverrides(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(OVERRIDES_STORAGE_KEY);
    window.dispatchEvent(new Event("peaky_feature_flags_updated"));
  } catch (e) {
    console.error("Failed to reset feature flag overrides", e);
  }
}
