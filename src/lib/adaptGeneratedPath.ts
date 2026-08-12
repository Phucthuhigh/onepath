import type { GeneratedPath, MergedCheckpoint, Resource } from "./types";

export function adaptGeneratedPath(path: GeneratedPath): {
  checkpoints: MergedCheckpoint[];
  resources: Resource[];
} {
  const checkpoints: MergedCheckpoint[] = [];
  const resources: Resource[] = [];

  for (const cp of path.checkpoints) {
    const checkpointId = `c${cp.order}`;
    checkpoints.push({
      id: checkpointId,
      order: cp.order,
      title: cp.title,
      why: cp.why,
      skillFocus: cp.skillFocus,
    });

    cp.resources.forEach((r, i) => {
      resources.push({
        id: `${checkpointId}-r${i}`,
        checkpointId,
        kind: r.kind,
        format: r.format,
        title: r.title,
        url: r.url,
        durationSec: undefined,
        readMinutes: undefined,
        source: r.source,
        author: r.author,
        authorSignal: r.authorSignal,
        language: r.language,
        publishedYear: r.publishedYear,
        visible: true,
        credibility: r.credibility,
        credibilityReason: r.credibilityReason,
      });
    });
  }

  return { checkpoints, resources };
}
