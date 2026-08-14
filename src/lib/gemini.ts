import { GoogleGenAI, Type } from "@google/genai";
import type { AgentAnswer, AgentQuestion } from "./types";
import type { TavilyResult } from "./tavily";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_TEXT = process.env.GEMINI_MODEL_TEXT ?? "gemini-3.5-flash-lite";

// The model tends to mirror the language of the raw input (e.g. a skill
// typed in another language). Every prompt that produces user-facing text
// must include this so the whole response stays in English regardless of
// how the input was typed.
const ENGLISH_OUTPUT_RULE =
  "IMPORTANT: no matter what language the user's input is in, you MUST always respond in clear, natural English — never mirror the input's language.";

const QUESTIONS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          prompt: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["id", "label"],
            },
          },
        },
        required: ["id", "prompt", "options"],
      },
    },
  },
  required: ["questions"],
};

export async function generateQuestions(skill: string): Promise<AgentQuestion[]> {
  const prompt = `You are ClearPath's learning-path personalization system.
The user wants to learn: "${skill}".

ClearPath's core principle: every screen has exactly ONE correct next action. Never ask an open-ended (free text) question — only multiple-choice questions with a single answer, so the system decides on the user's behalf.

Generate exactly 2 to 4 short questions to personalize a learning path for "${skill}" — for example: current skill level, main goal for learning it, how much time they can commit per week. Each question should have 2 to 4 short, clear, mutually exclusive options.

${ENGLISH_OUTPUT_RULE} The only exception is the "id" field (for questions and options) — write those without spaces, in a short slug form like "q1", "q1-a". This slug rule applies ONLY to "id", not to "prompt", "label", or "description".

Return exactly according to the JSON schema.`;

  const res = await ai.models.generateContent({
    model: MODEL_TEXT,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: QUESTIONS_SCHEMA,
    },
  });

  const parsed = JSON.parse(res.text ?? "{}") as { questions?: AgentQuestion[] };
  if (!parsed.questions?.length) throw new Error("Gemini returned no questions");
  return parsed.questions;
}

export interface CheckpointSkeleton {
  order: number;
  title: string;
  why: string;
  skillFocus: string;
  searchQuery: string;
  searchQueryVi: string;
}

const SKELETON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    checkpoints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          order: { type: Type.INTEGER },
          title: { type: Type.STRING },
          why: { type: Type.STRING },
          skillFocus: { type: Type.STRING },
          searchQuery: {
            type: Type.STRING,
            description:
              "A concrete web-search query in English to find real tutorials/courses for this exact checkpoint.",
          },
          searchQueryVi: {
            type: Type.STRING,
            description:
              "The same search intent, but as a natural Vietnamese search query (not a literal translation) — phrased the way a Vietnamese learner would actually type it, to surface Vietnamese-language tutorials/courses for this checkpoint.",
          },
        },
        required: ["order", "title", "why", "skillFocus", "searchQuery", "searchQueryVi"],
      },
    },
  },
  required: ["checkpoints"],
};

export async function generateCheckpointSkeleton(
  skill: string,
  answers: AgentAnswer[]
): Promise<CheckpointSkeleton[]> {
  const answersText = answers.map((a) => `- ${a.label}`).join("\n");
  const prompt = `You are ClearPath's "Merge Engine": you unify knowledge about a skill into ONE linear learning path, not a list of options to pick from.

Skill: "${skill}"
The user's personalization answers:
${answersText}

Generate exactly 5 to 6 checkpoints, ordered from easy to hard, matching the user's level and goal above. Each checkpoint has: title (short), why (one sentence explaining why this checkpoint sits at this point in the path), skillFocus (2-3 words), searchQuery (an English search query to find real learning material/videos for exactly this checkpoint's content), and searchQueryVi (a natural Vietnamese search query for the same content — we search in both languages so learners get both English and Vietnamese sources).

${ENGLISH_OUTPUT_RULE} The exceptions are "searchQuery" (English) and "searchQueryVi" (Vietnamese) — those two fields are deliberately in different languages from the rest.

Return exactly according to the JSON schema.`;

  const res = await ai.models.generateContent({
    model: MODEL_TEXT,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: SKELETON_SCHEMA,
    },
  });

  const parsed = JSON.parse(res.text ?? "{}") as { checkpoints?: CheckpointSkeleton[] };
  if (!parsed.checkpoints?.length) throw new Error("Gemini returned no checkpoints");
  return parsed.checkpoints.sort((a, b) => a.order - b.order);
}

export interface SelectedResource {
  kind: "short" | "deep";
  format: "video" | "article";
  title: string;
  url: string;
  source: string;
  author: string;
  authorSignal: string;
  language: string;
  credibility: number;
  credibilityReason: string;
}

const SELECTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    checkpoints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          order: { type: Type.INTEGER },
          resources: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                kind: { type: Type.STRING, enum: ["short", "deep"] },
                format: { type: Type.STRING, enum: ["video", "article"] },
                title: { type: Type.STRING },
                url: { type: Type.STRING },
                source: { type: Type.STRING },
                author: { type: Type.STRING },
                authorSignal: { type: Type.STRING },
                language: {
                  type: Type.STRING,
                  enum: ["English", "Vietnamese", "Other"],
                },
                credibility: { type: Type.INTEGER },
                credibilityReason: { type: Type.STRING },
              },
              required: [
                "kind",
                "format",
                "title",
                "url",
                "source",
                "author",
                "authorSignal",
                "language",
                "credibility",
                "credibilityReason",
              ],
            },
          },
        },
        required: ["order", "resources"],
      },
    },
  },
  required: ["checkpoints"],
};

export async function selectResourcesForCheckpoints(
  skill: string,
  checkpoints: { order: number; title: string; candidates: TavilyResult[] }[]
): Promise<Record<number, SelectedResource[]>> {
  const candidatesBlock = checkpoints
    .map((cp) => {
      const lines = cp.candidates
        .map(
          (c, i) =>
            `  [${i}] title="${c.title}" url="${c.url}" snippet="${c.content.slice(0, 220)}"`
        )
        .join("\n");
      return `Checkpoint order=${cp.order} "${cp.title}":\n${lines || "  (no search results)"}`;
    })
    .join("\n\n");

  const prompt = `You are ClearPath's source-credibility scoring system, for the skill "${skill}".

Credibility rubric (0-100), applied consistently across every checkpoint:
- Instructor/source credibility (experience, expertise, official platform): 40%
- Consistency with other sources on the same topic: 35%
- Community signal (popularity, recency, domain reputation): 25%

MANDATORY RULE: you may only choose a url FROM THE CANDIDATE LIST given below for each checkpoint — NEVER invent a url that isn't in the list. If no candidate for a checkpoint reaches credibility >= 60, return an empty resources array for that checkpoint.

The candidate list for each checkpoint was gathered from BOTH an English-language search and a Vietnamese-language search, so it's normal to see both English and Vietnamese sources mixed together.

For each checkpoint, pick up to 2 "short" sources (short video, ideally <5 minutes if you can tell from the title/content) and up to 3 "deep" sources (for going deep — could be a course/long article/long video) — every pick must reach credibility >= 60. Prefer a mix of English and Vietnamese sources when good candidates exist in both — don't force a language in if nothing in it clears the credibility bar, but don't only pick English out of habit either. Rank by credibility within each kind; if there are more qualifying candidates than the cap, keep the highest-credibility ones. format is "video" if the url is youtube.com/vimeo.com or the title is clearly a video, otherwise "article". Infer author/source reasonably from the domain or title if not certain. Set "language" to the actual language the source's own content (title/snippet) is written in — this is independent of what language you write "authorSignal"/"credibilityReason" in.

${ENGLISH_OUTPUT_RULE} Applies to "authorSignal" and "credibilityReason" — even if the source content (snippet) is in another language, paraphrase it in English rather than copying it verbatim. credibilityReason should be at most 25 words. Exception: "title" keeps the source's original name (do not translate it), "source"/"author" keep proper names as-is.

${candidatesBlock}

Return exactly according to the JSON schema.`;

  const res = await ai.models.generateContent({
    model: MODEL_TEXT,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: SELECTION_SCHEMA,
    },
  });

  const parsed = JSON.parse(res.text ?? "{}") as {
    checkpoints?: { order: number; resources: SelectedResource[] }[];
  };

  const byOrder: Record<number, SelectedResource[]> = {};
  for (const cp of parsed.checkpoints ?? []) {
    byOrder[cp.order] = cp.resources ?? [];
  }
  return byOrder;
}
