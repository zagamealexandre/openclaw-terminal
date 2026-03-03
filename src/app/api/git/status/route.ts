import { NextResponse } from 'next/server';
import { runGit } from '../_git';
import { resolveProjectRoot } from '@/lib/project-roots';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectSlug = searchParams.get('projectSlug');
  const cwd = projectSlug ? resolveProjectRoot(projectSlug) : undefined;
  const branch = await runGit(['rev-parse', '--abbrev-ref', 'HEAD'], cwd ?? undefined);
  const status = await runGit(['status', '--porcelain'], cwd ?? undefined);

  return NextResponse.json({
    ok: branch.ok && status.ok,
    branch: branch.ok ? branch.output : 'unknown',
    clean: status.ok ? status.output.trim().length === 0 : false,
    changed: status.ok ? status.output.split('\n').filter(Boolean).length : null,
    raw: status.ok ? status.output : status.output,
  });
}
