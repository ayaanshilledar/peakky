import { NotchTab } from "./NotchHeader";

export interface NotchDimensionsState {
  activeAlarm: boolean;
  isExpanded: boolean;
  activeTab: NotchTab;
  timerSubTab?: "focus" | "reminders";
  tasksCount?: number;
  clipsCount?: number;
  isMediaActive?: boolean;
  activeHUD?: boolean;
  imminentReminder?: boolean;
  isRunning?: boolean;
  isEventLiveOrSoon?: boolean;
  isDictating?: boolean;
  dictationSuccess?: boolean;
}

export interface NotchDimensionSpec {
  width: number;
  height: number;
  classes: string;
}

/**
 * Dimension specifications for each feature tab in expanded mode.
 * Each feature has tailored width, height, and padding optimized for its content hierarchy.
 */
export const EXPANDED_FEATURE_DIMENSIONS: Record<
  NotchTab,
  (state?: Partial<NotchDimensionsState>) => NotchDimensionSpec
> = {
  // Home: Panoramic dashboard with 3 frosted glass cards
  home: () => ({
    width: 480,
    height: 270,
    classes: "w-[480px] h-[270px] pt-2 px-3 pb-3",
  }),

  // Timer: Sleek and centered for focus; roomier for reminder lists
  timer: (state) =>
    state?.timerSubTab === "reminders"
      ? {
          width: 390,
          height: 200,
          classes: "w-[390px] h-[200px] pt-2 px-3.5 pb-3.5",
        }
      : {
          width: 360,
          height: 140,
          classes: "w-[360px] h-[140px] pt-2 px-3.5 pb-3",
        },

  // Tasks: Roomier height to prevent bottom text clipping in empty and active states
  tasks: (state) =>
    (state?.tasksCount ?? 0) === 0
      ? {
          width: 390,
          height: 180,
          classes: "w-[390px] h-[180px] pt-2 px-3.5 pb-3.5",
        }
      : {
          width: 410,
          height: 230,
          classes: "w-[410px] h-[230px] pt-2 px-3.5 pb-3.5",
        },

  // Calendar: Wide dual-column view (mini-month grid + day agenda list)
  calendar: () => ({
    width: 460,
    height: 255,
    classes: "w-[460px] h-[255px] pt-2 px-3.5 pb-3.5",
  }),

  // Clips: Compact clipboard hint or room for rich clip items
  clips: (state) =>
    (state?.clipsCount ?? 0) === 0
      ? {
          width: 390,
          height: 175,
          classes: "w-[390px] h-[175px] pt-2 px-3.5 pb-3.5",
        }
      : {
          width: 410,
          height: 230,
          classes: "w-[410px] h-[230px] pt-2 px-3.5 pb-3.5",
        },

  // Media: Apple Dynamic Island / Now Playing style proportions
  media: (state) =>
    !state?.isMediaActive
      ? {
          width: 360,
          height: 140,
          classes: "w-[360px] h-[140px] pt-2 px-3.5 pb-3",
        }
      : {
          width: 420,
          height: 200,
          classes: "w-[420px] h-[200px] pt-2 px-4 pb-3.5",
        },

  // System: Telemetry dashboard with CPU sparkline, memory, GPU, disk, and network
  system: () => ({
    width: 440,
    height: 240,
    classes: "w-[440px] h-[240px] pt-2 px-3 pb-3",
  }),

  // AI Chat: Deep view with conversational history, prompt input, and memory tags
  chat: () => ({
    width: 450,
    height: 375,
    classes: "w-[450px] h-[375px] pt-2 px-3.5 pb-3.5",
  }),
};

/**
 * Returns exact dimension specifications for the given Notch state.
 */
export function getNotchDimensionSpec(
  state?: Partial<NotchDimensionsState>
): NotchDimensionSpec {
  if (!state) {
    return {
      width: 175,
      height: 34,
      classes: "w-[175px] h-[34px] px-3.5 flex items-center justify-between",
    };
  }

  // 1. Critical Alarm Overlay (highest priority)
  if (state.activeAlarm) {
    return {
      width: 390,
      height: 150,
      classes:
        "w-[390px] h-[150px] pt-2 px-3 pb-3 border-amber-500/30 shadow-lg shadow-amber-500/10",
    };
  }

  // 2. Expanded Feature Views (feature-specific width and height)
  if (state.isExpanded) {
    const tab = state.activeTab || "tasks";
    const resolver = EXPANDED_FEATURE_DIMENSIONS[tab];
    if (resolver) {
      return resolver(state);
    }
    return {
      width: 400,
      height: 195,
      classes: "w-[400px] h-[195px] pt-2 px-3.5 pb-3.5",
    };
  }

  // 3. Collapsed Pill Variants (Dynamic Island Compact Mode)
  if (state.isDictating) {
    return {
      width: 260,
      height: 34,
      classes: "w-[260px] h-[34px] px-3.5 flex items-center justify-between border-rose-500/40 shadow-lg shadow-rose-500/10",
    };
  }
  if (state.dictationSuccess) {
    return {
      width: 250,
      height: 34,
      classes: "w-[250px] h-[34px] px-3.5 flex items-center justify-between border-emerald-500/40 shadow-lg shadow-emerald-500/10",
    };
  }
  if (state.activeHUD) {
    return {
      width: 230,
      height: 34,
      classes: "w-[230px] h-[34px] px-2 flex items-center justify-between",
    };
  }
  if (state.imminentReminder) {
    return {
      width: 225,
      height: 34,
      classes: "w-[225px] h-[34px] px-3.5 flex items-center justify-between",
    };
  }
  if (state.isRunning) {
    return {
      width: 195,
      height: 34,
      classes: "w-[195px] h-[34px] px-3.5 flex items-center justify-between",
    };
  }
  if (state.isEventLiveOrSoon) {
    return {
      width: 225,
      height: 34,
      classes: "w-[225px] h-[34px] px-3.5 flex items-center justify-between",
    };
  }
  if (state.isMediaActive) {
    return {
      width: 210,
      height: 34,
      classes: "w-[210px] h-[34px] px-3.5 flex items-center justify-between",
    };
  }

  // Default idle collapsed pill
  return {
    width: 175,
    height: 34,
    classes: "w-[175px] h-[34px] px-3.5 flex items-center justify-between",
  };
}

/**
 * Returns Tailwind dimension classes for the Notch capsule based on current state.
 */
export function getNotchCapsuleClasses(
  state?: Partial<NotchDimensionsState>
): string {
  return getNotchDimensionSpec(state).classes;
}
