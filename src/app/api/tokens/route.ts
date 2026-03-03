import { NextResponse } from 'next/server';
let used = 227000;
export async function GET() {
  used = (used + Math.floor(Math.random() * 1500)) % 400000;
  return NextResponse.json({ model: 'openai/gpt-5.1-codex', mode: 'think low', used, limit: 400000 });
}
