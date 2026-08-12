"use client";

import { cn } from "@/lib/utils";

export function OptionCard({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl border px-4 py-3 text-left transition-colors cursor-pointer",
        selected
          ? "border-path bg-path-soft ring-1 ring-path"
          : "border-border bg-card hover:border-path/40 hover:bg-secondary"
      )}
    >
      <span
        className={cn(
          "block text-sm font-semibold",
          selected ? "text-path" : "text-foreground"
        )}
      >
        {label}
      </span>
      {description && (
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      )}
    </button>
  );
}
