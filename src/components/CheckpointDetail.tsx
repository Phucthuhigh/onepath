"use client";

import { CheckCircle2, ExternalLink, X } from "lucide-react";
import type { CheckpointStatus, MergedCheckpoint, Resource, SavedItem } from "@/lib/types";
import { FocusBanner } from "./FocusBanner";
import { ResourceCard } from "./ResourceCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CheckpointDetail({
  checkpoint,
  totalCheckpoints,
  status,
  resources,
  saved,
  skill,
  onSave,
  onComplete,
  onClose,
}: {
  checkpoint: MergedCheckpoint;
  totalCheckpoints: number;
  status: CheckpointStatus;
  resources: Resource[];
  saved: SavedItem[];
  skill: string;
  onSave: (resourceId: string) => void;
  onComplete: () => void;
  onClose?: () => void;
}) {
  const shortSorted = resources
    .filter((r) => r.kind === "short")
    .sort((a, b) => b.credibility - a.credibility);
  const deepSorted = resources
    .filter((r) => r.kind === "deep")
    .sort((a, b) => b.credibility - a.credibility);
  const primaryShort = shortSorted[0];
  const primaryDeep = deepSorted[0];
  const extra = [...shortSorted.slice(1), ...deepSorted.slice(1)].sort(
    (a, b) => b.credibility - a.credibility
  );

  const savedMap = new Map(saved.map((s) => [s.resourceId, s]));

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <FocusBanner skill={skill} />
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close step details"
            className="size-11 shrink-0 md:hidden"
          >
            <X className="size-5" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-medium text-muted-foreground">
            STEP {String(checkpoint.order).padStart(2, "0")}/{String(totalCheckpoints).padStart(2, "0")}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {checkpoint.skillFocus}
          </span>
          {status === "done" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-trust-soft px-2 py-0.5 text-[11px] font-semibold text-trust">
              <CheckCircle2 className="size-3" aria-hidden />
              Completed
            </span>
          )}
        </div>
        <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          {checkpoint.title}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground/80">Why this step: </span>
          {checkpoint.why}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {primaryShort && (
          <ResourceCard
            resource={primaryShort}
            variant="short"
            saved={savedMap.has(primaryShort.id)}
            remindAt={savedMap.get(primaryShort.id)?.remindAt}
            onSave={() => onSave(primaryShort.id)}
          />
        )}
        {primaryDeep && (
          <ResourceCard
            resource={primaryDeep}
            variant="deep"
            saved={savedMap.has(primaryDeep.id)}
            remindAt={savedMap.get(primaryDeep.id)?.remindAt}
            onSave={() => onSave(primaryDeep.id)}
          />
        )}
      </div>

      {extra.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            More sources
          </p>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {extra.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.kind === "short" ? "Short" : "Deep"} · {r.author} ·{" "}
                    {r.credibility}/100 trust score
                    {r.language && r.language !== "English" ? ` · ${r.language}` : ""}
                  </p>
                </div>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-path hover:underline"
                >
                  Open
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto flex items-center justify-end border-t border-border pt-5">
        {status === "current" ? (
          <Button
            onClick={onComplete}
            className="h-12 w-full bg-path px-6 text-path-foreground hover:bg-path/90 sm:w-auto"
          >
            <CheckCircle2 className="size-4" aria-hidden />
            Mark this step complete
          </Button>
        ) : status === "done" ? (
          <p
            className={cn(
              "inline-flex items-center gap-1.5 text-sm font-medium text-trust"
            )}
          >
            <CheckCircle2 className="size-4" aria-hidden />
            This step is done — the next one is ready.
          </p>
        ) : null}
      </div>
    </div>
  );
}
