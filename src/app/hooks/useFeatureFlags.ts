"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FeatureFlagKey,
  FEATURE_FLAG_DEFINITIONS,
  getEffectiveFeatureFlags,
  getEffectiveFeatureFlag,
  getEnvFeatureFlags,
  getFeatureFlagOverrides,
  setFeatureFlagOverride,
  resetFeatureFlagOverrides,
} from "../utils/featureFlags";

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<FeatureFlagKey, boolean>>(() =>
    getEffectiveFeatureFlags()
  );
  const [envFlags, setEnvFlags] = useState<Record<FeatureFlagKey, boolean>>(() =>
    getEnvFeatureFlags()
  );
  const [overrides, setOverrides] = useState<Record<string, boolean>>(() =>
    getFeatureFlagOverrides()
  );

  const refresh = useCallback(() => {
    setFlags(getEffectiveFeatureFlags());
    setEnvFlags(getEnvFeatureFlags());
    setOverrides(getFeatureFlagOverrides());
  }, []);

  useEffect(() => {
    refresh();

    const handleUpdate = () => refresh();
    window.addEventListener("peaky_feature_flags_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("peaky_feature_flags_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refresh]);

  const isFeatureEnabled = useCallback(
    (key: FeatureFlagKey): boolean => {
      return flags[key] ?? getEffectiveFeatureFlag(key);
    },
    [flags]
  );

  const setOverride = useCallback(
    (key: FeatureFlagKey, value: boolean | null) => {
      setFeatureFlagOverride(key, value);
      refresh();
    },
    [refresh]
  );

  const resetOverrides = useCallback(() => {
    resetFeatureFlagOverrides();
    refresh();
  }, [refresh]);

  return {
    flags,
    envFlags,
    overrides,
    definitions: FEATURE_FLAG_DEFINITIONS,
    isFeatureEnabled,
    setOverride,
    resetOverrides,
    refresh,
  };
}
