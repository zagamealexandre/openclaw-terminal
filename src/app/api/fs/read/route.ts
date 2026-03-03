import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';

import { resolveWithinProject, safeStat } from '../_fs';

const MAX_BYTES = 250_000;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const projectSlug = typeof body?.projectSlug === 'string' ? body.projectSlug : null;
    const targetPath = typeof body?.path === 'string' ? body.path : null;

    if (!projectSlug) {
      return NextResponse.json({ error: 'projectSlug required' }, { status: 400 });
    }
    if (!targetPath) {
      return NextResponse.json({ error: 'path required' }, { status: 400 });
    }

    const resolved = resolveWithinProject(projectSlug, targetPath);
    if (!resolved) {
      return NextResponse.json({ error: 'invalid path or project' }, { status: 400 });
    }

    const st = await safeStat(resolved.abs);
    if (!st.isFile) {
      return NextResponse.json({ error: 'not a file' }, { status: 400 });
    }
    if (st.size > MAX_BYTES) {
      return NextResponse.json({ error: `file too large (${st.size} bytes)` }, { status: 400 });
    }

    const content = await fs.readFile(resolved.abs, 'utf-8');
    return NextResponse.json({ ok: true, path: resolved.rel, content });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
