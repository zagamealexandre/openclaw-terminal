import { NextResponse } from 'next/server';

type BrowsePayload = {
  target: string;
};

function looksLikeUrl(value: string) {
  return /^https?:\/\//i.test(value) || value.includes('.') || value.startsWith('localhost');
}

function buildTarget(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (looksLikeUrl(trimmed)) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      return url.toString();
    } catch {
      return null;
    }
  }
  const query = encodeURIComponent(trimmed);
  return `https://duckduckgo.com/?q=${query}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BrowsePayload;
    const target = body?.target;
    if (!target) {
      return NextResponse.json({ error: 'target is required' }, { status: 400 });
    }

    const normalized = buildTarget(target);
    if (!normalized) {
      return NextResponse.json({ error: 'unable to parse target' }, { status: 400 });
    }

    const proxyUrl = `https://r.jina.ai/${normalized}`;
    const response = await fetch(proxyUrl, { cache: 'no-store' });
    if (!response.ok) {
      return NextResponse.json({ error: `fetch failed (${response.status})` }, { status: 502 });
    }

    const content = await response.text();
    return NextResponse.json({ url: normalized, content });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
