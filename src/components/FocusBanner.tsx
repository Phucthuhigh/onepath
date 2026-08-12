import { ShieldCheck } from "lucide-react";

export function FocusBanner({ skill }: { skill: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-path/15 bg-path-soft px-4 py-2.5 text-sm text-foreground">
      <ShieldCheck className="size-4 shrink-0 text-path" aria-hidden />
      <p>
        This path still fits your goal of learning{" "}
        <span className="font-semibold">&ldquo;{skill}&rdquo;</span>. Keep going.
      </p>
    </div>
  );
}
