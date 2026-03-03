import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';

import { resolveWithinProject, safeStat } from '../_fs';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const projectSlug = typeof body?.projectSlug === 'string' ? body.projectSlug : null;
    const targetPath = typeof body?.path === 'string' ? body.path : '/';

    if (!projectSlug) {
      return NextResponse.json({ error: 'projectSlug required' }, { status: 400 });
    }

    const resolved = resolveWithinProject(projectSlug, targetPath);
    if (!resolved) {
      return NextResponse.json({ error: 'invalid path or project' }, { status: 400 });
    }

    const entries = await fs.readdir(resolved.abs, { withFileTypes: true });
    const items = await Promise.all(
      entries.map(async (ent) => {
        const name = ent.name;
        const abs = `${resolved.abs}/${name}`;
        const st = await safeStat(abs).catch(() => null);
        return {
          name,
          type: ent.isDirectory() ? 'dir' : 'file',
          size: st?.size ?? null,
        };
      })
    );

    return NextResponse.json({ ok: true, path: resolved.rel, items });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
