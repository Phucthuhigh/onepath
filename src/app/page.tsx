"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AlertCircle, ArrowRight, Compass, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/hooks/useAppState";
import type { AgentQuestion } from "@/lib/types";

// WebGL needs the browser — skip SSR and code-split it off the main bundle.
const NetworkBackground = dynamic(
  () => import("@/components/NetworkBackground").then((m) => m.NetworkBackground),
  { ssr: false }
);

export default function LandingPage() {
  const router = useRouter();
  const { setDraft } = useAppState();
  const [skill, setSkill] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isLoading = status === "loading";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = skill.trim();
    if (!trimmed || isLoading) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/agent/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: trimmed }),
      });
      const data = (await res.json()) as {
        questions?: AgentQuestion[];
        error?: { message?: string };
      };
      if (!res.ok || !data.questions?.length) {
        throw new Error(data.error?.message ?? "Couldn't generate personalization questions.");
      }
      setDraft(trimmed, data.questions);
      router.push("/personalize");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
      <NetworkBackground />
      <div className="relative z-10 w-full max-w-xl space-y-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <Compass className="size-5 text-path" strokeWidth={2.5} aria-hidden />
          <span className="font-heading text-sm font-bold tracking-tight">ClearPath</span>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            UNESCO Youth Hackathon 2026
          </p>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            What do you want to learn?
          </h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Not a list to choose from — one path, personalized just for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <input
              type="text"
              value={skill}
              onChange={(e) => {
                setSkill(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              disabled={isLoading}
              placeholder="e.g. Python, guitar, digital marketing…"
              aria-label="Skill or topic you want to learn"
              className="h-14 flex-1 rounded-2xl border border-border bg-card px-5 text-base text-foreground placeholder:text-muted-foreground focus:border-path focus:outline-none focus:ring-3 focus:ring-path/25 disabled:opacity-60"
            />
            <Button
              type="submit"
              disabled={!skill.trim() || isLoading}
              className="h-14 shrink-0 gap-2 rounded-2xl bg-path px-6 text-base text-path-foreground hover:bg-path/90 disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Analyzing…
                </>
              ) : (
                <>
                  Create my path
                  <ArrowRight className="size-4" aria-hidden />
                </>
              )}
            </Button>
          </div>

          <div className="min-h-4 text-left sm:text-center">
            {isLoading && (
              <p className="text-xs text-muted-foreground">
                Agent is analyzing &ldquo;{skill.trim()}&rdquo; to find the right
                personalization questions…
              </p>
            )}
            {status === "error" && (
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive">
                <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                {errorMessage}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
