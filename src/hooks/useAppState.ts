"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentQuestion, AppState, GeneratedPath, Onboarding } from "@/lib/types";
import { defaultState, initialProgressForPath, loadState, saveState } from "@/lib/storage";

export function useAppState() {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  // Mirrors `state` outside of React's render/batching cycle. A setter is
  // routinely followed immediately by router.push()/router.replace() (e.g.
  // personalize -> setOnboarding -> push '/loading'), and the next page
  // mounts its own useAppState() instance that reads localStorage fresh.
  // React 18's automatic batching means a functional setState updater is not
  // guaranteed to run before that push happens, so persisting *inside* it is
  // not reliably synchronous. Writing through this ref instead makes the
  // localStorage write a plain, immediate JS call — done before `update()`
  // returns, so it always lands before any subsequent navigation.
  const stateRef = useRef<AppState>(state);

  useEffect(() => {
    const loaded = loadState();
    stateRef.current = loaded;
    setState(loaded);
    setReady(true);
  }, []);

  const update = useCallback((updater: (s: AppState) => AppState) => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    saveState(next);
    setState(next);
  }, []);

  const setDraft = useCallback(
    (skill: string, questions: AgentQuestion[]) => {
      update((s) => ({ ...s, draft: { skill, questions } }));
    },
    [update]
  );

  const setOnboarding = useCallback(
    (onboarding: Onboarding) => {
      // Deliberately does NOT clear `draft` here: this setter is called right
      // before navigating away from /personalize, and nulling draft would
      // trigger that page's own "redirect home if no draft" effect while it's
      // still mounted, racing the intended navigation. `draft` is harmless
      // leftover state — the next setDraft() call overwrites it anyway.
      update((s) => ({ ...s, onboarding }));
    },
    [update]
  );

  const setPath = useCallback(
    (path: GeneratedPath) => {
      update((s) => ({ ...s, path, progress: initialProgressForPath(path) }));
    },
    [update]
  );

  const completeCheckpoint = useCallback(
    (checkpointId: string) => {
      update((s) => {
        if (!s.path) return s;
        const orderedIds = [...s.path.checkpoints]
          .sort((a, b) => a.order - b.order)
          .map((cp) => `c${cp.order}`);
        const progress = { ...s.progress, [checkpointId]: "done" as const };
        const idx = orderedIds.indexOf(checkpointId);
        const nextId = orderedIds[idx + 1];
        if (nextId && progress[nextId] === "locked") {
          progress[nextId] = "current";
        }
        return { ...s, progress };
      });
    },
    [update]
  );

  const saveResource = useCallback(
    (resourceId: string, checkpointId: string, remindInDays = 2) => {
      update((s) => {
        if (s.saved.some((it) => it.resourceId === resourceId)) return s;
        const now = new Date();
        const remindAt = new Date(now);
        remindAt.setDate(remindAt.getDate() + remindInDays);
        return {
          ...s,
          saved: [
            ...s.saved,
            {
              resourceId,
              checkpointId,
              savedAt: now.toISOString(),
              remindAt: remindAt.toISOString(),
            },
          ],
        };
      });
    },
    [update]
  );

  const isSaved = useCallback(
    (resourceId: string) => state.saved.some((it) => it.resourceId === resourceId),
    [state.saved]
  );

  const reset = useCallback(() => {
    update(() => defaultState());
  }, [update]);

  return {
    ready,
    state,
    setDraft,
    setOnboarding,
    setPath,
    completeCheckpoint,
    saveResource,
    isSaved,
    reset,
  };
}
