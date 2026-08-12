export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function searchWeb(query: string, maxResults = 6): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not set");

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      search_depth: "basic",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Tavily search failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { results?: TavilyResult[] };
  return data.results ?? [];
}
