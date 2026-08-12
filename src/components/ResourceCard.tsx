"use client";

import { BookOpen, BookmarkCheck, BookmarkPlus, ExternalLink, PlayCircle } from "lucide-react";
import type { Resource } from "@/lib/types";
import { formatDuration, formatReadTime, formatDate } from "@/lib/format";
import { CredibilityBadge } from "./CredibilityBadge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ResourceCard({
  resource,
  variant,
  saved,
  remindAt,
  onSave,
}: {
  resource: Resource;
  variant: "short" | "deep";
  saved: boolean;
  remindAt?: string;
  onSave: () => void;
}) {
  const isShort = variant === "short";
  const meta = [
    resource.source,
    resource.author,
    resource.format === "video"
      ? resource.durationSec
        ? formatDuration(resource.durationSec)
        : undefined
      : resource.readMinutes
        ? formatReadTime(resource.readMinutes)
        : undefined,
    resource.publishedYear ? String(resource.publishedYear) : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-card p-5",
        isShort && "ring-1 ring-path/15"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide",
            isShort ? "text-path" : "text-muted-foreground"
          )}
        >
          {resource.format === "video" ? (
            <PlayCircle className="size-3.5" aria-hidden />
          ) : (
            <BookOpen className="size-3.5" aria-hidden />
          )}
          {isShort ? "Get the idea in 90 seconds" : "Go deep on this"}
        </span>
        {resource.language && resource.language !== "English" && (
          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {resource.language === "Vietnamese" ? "VI" : resource.language}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <h4 className="font-heading text-base font-semibold leading-snug text-foreground sm:text-lg">
          {resource.title}
        </h4>
        <p className="text-xs text-muted-foreground">{meta}</p>
        <p className="text-xs text-muted-foreground/80">{resource.authorSignal}</p>
      </div>

      <CredibilityBadge score={resource.credibility} reason={resource.credibilityReason} />

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <Button
          nativeButton={false}
          className="h-11 bg-path px-4 text-path-foreground hover:bg-path/90"
          render={<a href={resource.url} target="_blank" rel="noopener noreferrer" />}
        >
          Open source
          <ExternalLink className="size-3.5" aria-hidden />
        </Button>
        <Button
          variant="outline"
          disabled={saved}
          onClick={onSave}
          className={cn("h-11 px-4", saved && "border-trust/40 text-trust")}
        >
          {saved ? (
            <>
              <BookmarkCheck className="size-3.5" aria-hidden />
              {remindAt ? `Saved · reminder ${formatDate(remindAt)}` : "Saved"}
            </>
          ) : (
            <>
              <BookmarkPlus className="size-3.5" aria-hidden />
              Save to this step
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
