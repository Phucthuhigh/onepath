"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Compass } from "lucide-react";
import { OptionCard } from "@/components/OptionCard";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/hooks/useAppState";
import type { AgentAnswer } from "@/lib/types";

export default function PersonalizePage() {
  const router = useRouter();
  const { ready, state, setOnboarding } = useAppState();
  const [selected, setSelected] = useState<Record<string, string>>({});

  useEffect(() => {
    if (ready && !state.draft) {
      router.replace("/");
    }
  }, [ready, state.draft, router]);

  if (!state.draft) return null;
  const { skill, questions } = state.draft;

  const canSubmit = questions.every((q) => selected[q.id]);

  function handleSubmit() {
    if (!state.draft) return;
    const answers: AgentAnswer[] = state.draft.questions.map((q) => {
      const optionId = selected[q.id];
      const option = q.options.find((o) => o.id === optionId)!;
      return { questionId: q.id, optionId, label: option.label };
    });
    setOnboarding({ skill: state.draft.skill, answers });
    router.push("/loading");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" aria-hidden />
            Choose a different skill
          </button>

          <div className="flex items-center gap-2">
            <Compass className="size-5 text-path" strokeWidth={2.5} aria-hidden />
            <span className="font-heading text-sm font-bold tracking-tight">ClearPath</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Personalize your &ldquo;{skill}&rdquo; path
            </h1>
            <p className="text-sm text-muted-foreground">
              Answer {questions.length} question{questions.length === 1 ? "" : "s"} —
              we&rsquo;ll handle the rest.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q) => (
            <div key={q.id} className="space-y-2" role="radiogroup" aria-label={q.prompt}>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {q.prompt}
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.options.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    description={opt.description}
                    selected={selected[q.id] === opt.id}
                    onClick={() => setSelected((s) => ({ ...s, [q.id]: opt.id }))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="h-12 w-full bg-path text-path-foreground hover:bg-path/90 disabled:opacity-40"
        >
          Create my path
        </Button>
      </div>
    </div>
  );
}
