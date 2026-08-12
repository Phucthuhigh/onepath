import { NextResponse } from "next/server";
import { generateCheckpointSkeleton, selectResourcesForCheckpoints } from "@/lib/gemini";
import { searchWeb, type TavilyResult } from "@/lib/tavily";
import type { AgentAnswer, GeneratedCheckpoint, GeneratedPath, GeneratedResource } from "@/lib/types";

function dedupeByUrl(results: TavilyResult[]): TavilyResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Body must be valid JSON." } },
      { status: 400 }
    );
  }

  const skill = (body as { skill?: unknown })?.skill;
  const answers = (body as { answers?: unknown })?.answers;
  if (typeof skill !== "string" || !skill.trim()) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Missing 'skill' field." } },
      { status: 400 }
    );
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Missing 'answers' field." } },
      { status: 400 }
    );
  }

  const trimmedSkill = skill.trim().slice(0, 80);
  const typedAnswers = answers as AgentAnswer[];

  try {
    const skeleton = await generateCheckpointSkeleton(trimmedSkill, typedAnswers);

    const candidatesByOrder = new Map<number, TavilyResult[]>();
    await Promise.all(
      skeleton.map(async (cp) => {
        const [enResults, viResults] = await Promise.all([
          searchWeb(`${trimmedSkill} ${cp.searchQuery}`, 5).catch((err) => {
            console.error(`[/api/agent/path] EN search failed for order=${cp.order}`, err);
            return [] as TavilyResult[];
          }),
          searchWeb(cp.searchQueryVi, 5).catch((err) => {
            console.error(`[/api/agent/path] VI search failed for order=${cp.order}`, err);
            return [] as TavilyResult[];
          }),
        ]);
        candidatesByOrder.set(cp.order, dedupeByUrl([...enResults, ...viResults]));
      })
    );

    const selection = await selectResourcesForCheckpoints(
      trimmedSkill,
      skeleton.map((cp) => ({
        order: cp.order,
        title: cp.title,
        candidates: candidatesByOrder.get(cp.order) ?? [],
      }))
    );

    const checkpoints: GeneratedCheckpoint[] = skeleton.map((cp) => {
      const candidates = candidatesByOrder.get(cp.order) ?? [];
      const candidateUrls = new Set(candidates.map((c) => c.url));
      const chosen = (selection[cp.order] ?? []).filter((r) => candidateUrls.has(r.url));

      const resources: GeneratedResource[] = chosen.map((r) => ({
        kind: r.kind,
        format: r.format,
        title: r.title,
        url: r.url,
        source: r.source,
        author: r.author,
        authorSignal: r.authorSignal,
        language: r.language,
        credibility: r.credibility,
        credibilityReason: r.credibilityReason,
      }));

      return {
        order: cp.order,
        title: cp.title,
        why: cp.why,
        skillFocus: cp.skillFocus,
        resources,
      };
    });

    const path: GeneratedPath = { skill: trimmedSkill, checkpoints };
    return NextResponse.json(path);
  } catch (err) {
    console.error("[/api/agent/path]", err);
    return NextResponse.json(
      {
        error: {
          code: "AGENT_UNAVAILABLE",
          message: "Couldn't generate your path right now. Please try again.",
        },
      },
      { status: 502 }
    );
  }
}
