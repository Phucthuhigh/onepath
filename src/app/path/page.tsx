"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, RotateCcw } from "lucide-react";
import { SpineList } from "@/components/SpineList";
import { CheckpointDetail } from "@/components/CheckpointDetail";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAppState } from "@/hooks/useAppState";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { adaptGeneratedPath } from "@/lib/adaptGeneratedPath";

export default function PathPage() {
  const router = useRouter();
  const { ready, state, completeCheckpoint, saveResource, reset } = useAppState();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { checkpoints, resources } = useMemo(
    () => (state.path ? adaptGeneratedPath(state.path) : { checkpoints: [], resources: [] }),
    [state.path]
  );

  useEffect(() => {
    if (!ready) return;
    if (!state.onboarding || !state.path) {
      router.replace("/");
      return;
    }
    if (!selectedId) {
      const current =
        checkpoints.find((cp) => state.progress[cp.id] === "current") ?? checkpoints[0];
      if (current) setSelectedId(current.id);
    }
  }, [ready, state.onboarding, state.path, state.progress, selectedId, checkpoints, router]);

  const doneCount = useMemo(
    () => Object.values(state.progress).filter((s) => s === "done").length,
    [state.progress]
  );
  const pct = checkpoints.length ? Math.round((doneCount / checkpoints.length) * 100) : 0;

  const selectedCheckpoint = checkpoints.find((cp) => cp.id === selectedId) ?? null;
  const selectedResources = resources.filter(
    (r) => r.visible && r.checkpointId === selectedId
  );

  function handleSelect(id: string) {
    setSelectedId(id);
    if (!isDesktop) setSheetOpen(true);
  }

  if (!ready || !state.onboarding || !state.path) return null;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-5 py-3.5 backdrop-blur sm:px-8">
        <div className="flex items-center gap-2">
          <Compass className="size-5 text-path" strokeWidth={2.5} aria-hidden />
          <span className="font-heading text-sm font-bold tracking-tight text-foreground">
            OnePath
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-3 sm:flex-none sm:justify-start">
          <Progress value={pct} className="w-24 sm:w-44" />
          <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
            {doneCount}/{checkpoints.length} steps
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            reset();
            router.replace("/");
          }}
          className="hidden shrink-0 cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground sm:inline-flex"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Reset demo
        </button>
      </header>

      <div className="flex-1 md:grid md:grid-cols-[380px_1fr]">
        <aside className="border-b border-border px-5 py-6 sm:px-8 md:border-b-0 md:border-r md:px-6 md:py-8 md:h-[calc(100vh-57px)] md:overflow-y-auto">
          <SpineList
            checkpoints={checkpoints}
            progress={state.progress}
            selectedId={isDesktop ? selectedId : null}
            onSelect={handleSelect}
          />
        </aside>

        <main className="hidden px-6 py-8 sm:px-8 md:block md:h-[calc(100vh-57px)] md:overflow-y-auto md:px-10 md:py-10">
          {selectedCheckpoint && (
            <CheckpointDetail
              checkpoint={selectedCheckpoint}
              totalCheckpoints={checkpoints.length}
              status={state.progress[selectedCheckpoint.id] ?? "locked"}
              resources={selectedResources}
              saved={state.saved}
              skill={state.onboarding.skill}
              onSave={(resourceId) => saveResource(resourceId, selectedCheckpoint.id)}
              onComplete={() => completeCheckpoint(selectedCheckpoint.id)}
            />
          )}
        </main>
      </div>

      <Sheet open={sheetOpen && !isDesktop} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="!w-full !max-w-full gap-0 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">{selectedCheckpoint?.title}</SheetTitle>
          <div className="h-full overflow-y-auto p-5">
            {selectedCheckpoint && (
              <CheckpointDetail
                checkpoint={selectedCheckpoint}
                totalCheckpoints={checkpoints.length}
                status={state.progress[selectedCheckpoint.id] ?? "locked"}
                resources={selectedResources}
                saved={state.saved}
                skill={state.onboarding.skill}
                onSave={(resourceId) => saveResource(resourceId, selectedCheckpoint.id)}
                onComplete={() => completeCheckpoint(selectedCheckpoint.id)}
                onClose={() => setSheetOpen(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
