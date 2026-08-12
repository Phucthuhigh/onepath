Seed data for the original "video editing for beginners" vertical, following the schema from `PLAN.md` §6.

**Status: inert.** As of Phase 3, the app generates paths dynamically via the real agent (`/api/agent/questions`, `/api/agent/path` — see `src/lib/gemini.ts`, `src/lib/tavily.ts`) for any skill, not just this one. Nothing in the live app imports these files anymore; they're kept only as an offline fixture for local UI iteration without spending Gemini/Tavily quota.

- `roadmaps.json` — 4 raw roadmaps used to simulate the original "merge" step (§7.1).
- `merged-path.json` — the pre-cached merge result (6 checkpoints), simulating the original `/api/merge-roadmap` output.
- `resources.json` — 24 sources (15 shown, 9 filtered out for `credibility < 60`), simulating the original `/api/score` output.

The `url` fields are placeholders (`example.com/...`) — never real links, since this data was never wired to a live source.
