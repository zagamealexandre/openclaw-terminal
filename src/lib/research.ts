
const BRAVE_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search';
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

export type ResearchOptions = {
  maxResults?: number;
};

export type ResearchSource = {
  title: string;
  url: string;
  snippet: string;
  content: string;
  summary: string;
};

export type ResearchResult = {
  query: string;
  answer: string;
  sources: ResearchSource[];
};

function requireApiKey() {
  if (!BRAVE_API_KEY) {
    throw new Error('BRAVE_API_KEY is required for research.');
  }
}

function truncate(text: string, limit = 800) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}…`;
}

async function searchBrave(query: string, maxResults: number) {
  requireApiKey();
  const url = new URL(BRAVE_ENDPOINT);
  url.searchParams.set('q', query);
  url.searchParams.set('count', String(maxResults));
  url.searchParams.set('result_filter', 'web');

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Subscription-Token': BRAVE_API_KEY!,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Brave search failed (${response.status})`);
  }
  const data = await response.json();
  return (data?.web?.results ?? []).slice(0, maxResults);
}

async function fetchContent(url: string) {
  const proxy = `https://r.jina.ai/${url}`;
  const response = await fetch(proxy, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`fetch failed (${response.status})`);
  }
  return await response.text();
}

export async function runResearch(query: string, options: ResearchOptions = {}): Promise<ResearchResult> {
  const maxResults = Math.min(Math.max(options.maxResults ?? 3, 1), 5);
  const results = await searchBrave(query, maxResults);

  const sources: ResearchSource[] = [];
  for (const result of results) {
    const url: string | undefined = result?.url;
    if (!url) continue;
    try {
      const content = await fetchContent(url);
      const snippet = result.description ?? '';
      const summary = truncate(snippet || content.split('\n').slice(0, 6).join(' '), 500);
      sources.push({
        title: result.title ?? url,
        url,
        snippet,
        content: truncate(content, 4000),
        summary,
      });
    } catch (err) {
      console.warn('research fetch failed', url, err);
    }
  }

  const highlight = sources
    .map((source, index) => {
      const text = (source.summary || source.snippet || source.content).replace(/\s+/g, ' ').trim();
      return `${index + 1}. ${source.title} — ${truncate(text, 300)}`;
    })
    .join('\n');

  const answer = sources.length
    ? `Key findings for "${query}":\n${highlight}`
    : `No live sources returned for "${query}".`;

  return { query, answer, sources };
}
