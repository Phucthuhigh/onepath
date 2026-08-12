import type { AppState, CheckpointStatus, GeneratedPath } from "./types";

// v2: schema changed (dynamic skill/path replace the static video-editing vertical) —
// bumped so stale v1 localStorage from earlier testing doesn't get loaded as-is.
const STORAGE_KEY = "onepath.state.v2";

export function initialProgressForPath(
  path: GeneratedPath
): Record<string, CheckpointStatus> {
  const entries = [...path.checkpoints]
    .sort((a, b) => a.order - b.order)
    .map((cp, i) => [`c${cp.order}`, i === 0 ? "current" : "locked"] as const);
  return Object.fromEntries(entries);
}

export function defaultState(): AppState {
  return {
    onboarding: null,
    path: null,
    progress: {},
    saved: [],
    draft: null,
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      onboarding: parsed.onboarding ?? null,
      path: parsed.path ?? null,
      progress: parsed.progress ?? {},
      saved: parsed.saved ?? [],
      draft: parsed.draft ?? null,
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
