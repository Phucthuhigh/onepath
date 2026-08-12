import { NextResponse } from "next/server";
import { generateQuestions } from "@/lib/gemini";

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
  if (typeof skill !== "string" || !skill.trim()) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Missing 'skill' field." } },
      { status: 400 }
    );
  }

  const trimmedSkill = skill.trim().slice(0, 80);

  try {
    const questions = await generateQuestions(trimmedSkill);
    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[/api/agent/questions]", err);
    return NextResponse.json(
      {
        error: {
          code: "AGENT_UNAVAILABLE",
          message: "Couldn't generate personalization questions right now. Please try again.",
        },
      },
      { status: 502 }
    );
  }
}
