"use client";

import { Check, Lock } from "lucide-react";
import type { CheckpointStatus, MergedCheckpoint } from "@/lib/types";
import { cn } from "@/lib/utils";

function NodeDot({ status }: { status: CheckpointStatus }) {
  if (status === "done") {
    return (
      <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-trust text-trust-foreground">
        <Check className="size-4" strokeWidth={3} aria-hidden />
      </div>
    );
  }
  if (status === "current") {
    return (
      <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-path text-path-foreground ring-4 ring-path/20">
        <span className="size-2 rounded-full bg-current" />
      </div>
    );
  }
  return (
    <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-2 ring-border text-muted-foreground">
      <Lock className="size-3.5" aria-hidden />
    </div>
  );
}

export function SpineList({
  checkpoints,
  progress,
  selectedId,
  onSelect,
}: {
  checkpoints: MergedCheckpoint[];
  progress: Record<string, CheckpointStatus>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const sorted = [...checkpoints].sort((a, b) => a.order - b.order);

  return (
    <div className="relative">
      <div className="absolute left-4 top-4 bottom-4 w-px bg-border" aria-hidden />
      <ul className="relative space-y-2">
        {sorted.map((cp) => {
          const status = progress[cp.id] ?? "locked";
          const locked = status === "locked";
          const selected = selectedId === cp.id;
          return (
            <li key={cp.id}>
              <button
                type="button"
                disabled={locked}
                onClick={() => onSelect(cp.id)}
                aria-current={selected ? "step" : undefined}
                className={cn(
                  "flex w-full items-start gap-4 rounded-xl px-2 py-3 text-left transition-colors",
                  !locked && "cursor-pointer hover:bg-secondary",
                  locked && "cursor-not-allowed opacity-60",
                  selected && !locked && "bg-secondary"
                )}
              >
                <NodeDot status={status} />
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-medium text-muted-foreground">
                      STEP {String(cp.order).padStart(2, "0")}
                    </span>
                    {status === "current" && (
                      <span className="rounded-full bg-path-soft px-2 py-0.5 text-[10px] font-semibold text-path">
                        In progress
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "font-heading text-sm font-semibold leading-snug sm:text-base",
                      locked ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {cp.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{cp.skillFocus}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
