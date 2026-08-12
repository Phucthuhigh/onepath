"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { MergeSpine } from "@/components/MergeSpine";
import { useAppState } from "@/hooks/useAppState";
import type { GeneratedPath } from "@/lib/types";

type Phase = 0 | 1 | 2 | 3 | 4;
type FetchStatus = "idle" | "loading" | "success" | "error";

const MIN_ANIMATION_MS = 3200;

export default function LoadingPage() {
  const router = useRouter();
  const { ready, state, setPath } = useAppState();
  const [phase, setPhase] = useState<Phase>(0);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const navigated = useRef(false);
  const runId = useRef(0);

  useEffect(() => {
    if (!ready) return;
    if (!state.onboarding) router.replace("/");
  }, [ready, state.onboarding, router]);

  const run = useCallback(() => {
    if (!state.onboarding) return;
    const { skill, answers } = state.onboarding;
    const myRunId = ++runId.current;

    setFetchStatus("loading");
    setErrorMessage("");
    setMinTimeElapsed(false);
    setPhase(0);

    const phaseTimers = [
      setTimeout(() => setPhase(1), 700),
      setTimeout(() => setPhase(2), 1700),
      setTimeout(() => setPhase(3), 2600),
    ];
    setTimeout(() => setMinTimeElapsed(true), MIN_ANIMATION_MS);

    fetch("/api/agent/path", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill, answers }),
    })
      .then(async (res) => {
        const data = (await res.json()) as Partial<GeneratedPath> & {
          error?: { message?: string };
        };
        if (!res.ok || !data.checkpoints) {
          throw new Error(data.error?.message ?? "Couldn't generate your path.");
        }
        if (myRunId !== runId.current) return;
        setPath(data as GeneratedPath);
        setPhase(4);
        setFetchStatus("success");
      })
      .catch((err) => {
        if (myRunId !== runId.current) return;
        setFetchStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Something went wrong. Please try again."
        );
      })
      .finally(() => {
        phaseTimers.forEach(clearTimeout);
      });
  }, [state.onboarding, setPath]);

  useEffect(() => {
    if (ready && state.onboarding && fetchStatus === "idle") run();
  }, [ready, state.onboarding, fetchStatus, run]);

  const finished = fetchStatus === "success" && minTimeElapsed;

  useEffect(() => {
    if (finished && !navigated.current) {
      const t = setTimeout(() => {
        navigated.current = true;
        router.replace("/path");
      }, 650);
      return () => clearTimeout(t);
    }
  }, [finished, router]);

  function goNow() {
    if (navigated.current) return;
    navigated.current = true;
    router.replace("/path");
  }

  if (!state.onboarding) return null;

  const skill = state.onboarding.skill;
  const steps = [
    { label: `Analyzing "${skill}"…`, done: phase >= 1 },
    { label: "Finding and cross-checking credible sources…", done: phase >= 2 },
    { label: "Merging into a single path…", done: phase >= 3 },
    { label: "Personalizing based on your answers…", done: fetchStatus === "success" },
  ];

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-background px-6 py-16 text-foreground">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-90">
        <div className="h-[280px] w-full max-w-4xl sm:h-[360px]">
          <MergeSpine phase={phase} />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md space-y-5 rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm sm:p-8">
        {fetchStatus === "error" ? (
          <>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-destructive">
              <AlertCircle className="size-3.5" aria-hidden />
              Couldn&rsquo;t create your path
            </p>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <button
              type="button"
              onClick={run}
              className="w-full cursor-pointer rounded-lg bg-path px-4 py-2.5 text-sm font-semibold text-path-foreground transition-colors hover:bg-path/90"
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {finished ? "Done" : "Building your path…"}
            </p>
            <ul className="space-y-3">
              {steps.map((step) => (
                <li key={step.label} className="flex items-start gap-3 text-sm">
                  <span
                    className={
                      step.done
                        ? "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-path"
                        : "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border"
                    }
                  >
                    {step.done && <Check className="size-3" strokeWidth={3} aria-hidden />}
                  </span>
                  <span className={step.done ? "text-foreground" : "text-muted-foreground"}>
                    {step.label}
                  </span>
                </li>
              ))}
            </ul>

            {finished ? (
              <button
                type="button"
                onClick={goNow}
                className="w-full cursor-pointer rounded-lg bg-path px-4 py-2.5 text-sm font-semibold text-path-foreground transition-colors hover:bg-path/90"
              >
                View your path
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Working on it — this can take about 10-15 seconds
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
