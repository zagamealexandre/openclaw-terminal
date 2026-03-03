import { NextResponse } from 'next/server';
import { runGit } from '../_git';
import { resolveProjectRoot } from '@/lib/project-roots';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const projectSlug = typeof body?.projectSlug === 'string' ? body.projectSlug : null;
    const cwd = projectSlug ? resolveProjectRoot(projectSlug) : undefined;
    if (!message) {
      return NextResponse.json({ ok: false, error: 'commit message is required' }, { status: 400 });
    }

    const add = await runGit(['add', '-A'], cwd ?? undefined);
    if (!add.ok) {
      return NextResponse.json({ ok: false, stage: 'add', output: add.output || 'git add failed' }, { status: 500 });
    }

    const commit = await runGit(['commit', '-m', message], cwd ?? undefined);
    if (!commit.ok) {
      return NextResponse.json({ ok: false, stage: 'commit', output: commit.output || 'git commit failed' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, output: commit.output || 'committed' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
