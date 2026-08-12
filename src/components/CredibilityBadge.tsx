import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function CredibilityBadge({
  score,
  reason,
  className,
}: {
  score: number;
  reason: string;
  className?: string;
}) {
  const isHigh = score >= 80;
  const tierLabel = isHigh ? "High trust" : "Moderate trust";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
          isHigh
            ? "bg-trust-soft text-trust"
            : "bg-trust-mid-soft text-trust-mid"
        )}
      >
        <ShieldCheck className="size-3.5" strokeWidth={2.5} aria-hidden />
        <span className="font-mono tabular-nums">{score}/100</span>
        <span className="hidden sm:inline">· {tierLabel}</span>
      </div>
      <p className="text-xs leading-snug text-muted-foreground">{reason}</p>
    </div>
  );
}
