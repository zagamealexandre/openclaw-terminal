
import { NextResponse } from 'next/server';
import { runResearch } from '@/lib/research';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { query?: string; maxResults?: number } | null;
    const query = body?.query?.trim();
    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }
    const result = await runResearch(query, { maxResults: body?.maxResults });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
