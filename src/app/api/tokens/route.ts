import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

let used = 227000;

async function readOpenClawPrimaryModel(): Promise<string | null> {
  try {
    const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
    const raw = await fs.readFile(configPath, 'utf-8');
    const json = JSON.parse(raw) as any;
    const model = json?.agents?.defaults?.model?.primary;
    return typeof model === 'string' && model.length ? model : null;
  } catch {
    return null;
  }
}

function envModel() {
  return (
    process.env.OPENCLAW_MODEL ||
    process.env.OPENAI_MODEL ||
    process.env.NEXT_PUBLIC_OPENCLAW_MODEL ||
    null
  );
}

function envMode() {
  return (
    process.env.OPENCLAW_THINKING ||
    process.env.OPENAI_THINKING ||
    process.env.NEXT_PUBLIC_OPENCLAW_THINKING ||
    'think low'
  );
}

export async function GET() {
  used = (used + Math.floor(Math.random() * 1500)) % 400000;

  const model = (await readOpenClawPrimaryModel()) || envModel() || 'openai/gpt-4.1-nano';
  const mode = envMode();

  return NextResponse.json({ model, mode, used, limit: 400000 });
}
