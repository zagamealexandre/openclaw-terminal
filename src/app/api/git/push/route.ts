import { NextResponse } from 'next/server';
import { runGit } from '../_git';
import { resolveProjectRoot } from '@/lib/project-roots';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const projectSlug = typeof body?.projectSlug === 'string' ? body.projectSlug : null;
  const cwd = projectSlug ? resolveProjectRoot(projectSlug) : undefined;
  const push = await runGit(['push'], cwd ?? undefined);
  if (!push.ok) {
    return NextResponse.json({ ok: false, output: push.output || 'git push failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, output: push.output || 'pushed' });
}
