import { NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { resolveProjectRoot } from '@/lib/project-roots';

async function runGitApply(patch: string, checkOnly: boolean, cwd: string) {
  return await new Promise<{ ok: boolean; output: string }>((resolve) => {
    const args = ['apply', '--whitespace=nowarn'];
    if (checkOnly) args.push('--check');

    const child = spawn('git', args, {
      cwd: cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let out = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (out += d.toString()));

    child.on('close', (code) => {
      resolve({ ok: code === 0, output: out.trim() });
    });

    child.stdin.write(patch);
    child.stdin.end();
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const patch = typeof body?.patch === 'string' ? body.patch : '';
    const projectSlug = typeof body?.projectSlug === 'string' ? body.projectSlug : null;
    const resolved = projectSlug ? resolveProjectRoot(projectSlug) : null;
    if (projectSlug && !resolved) {
      return NextResponse.json({ error: `unknown project: ${projectSlug}` }, { status: 400 });
    }
    const projectRoot = resolved ?? process.cwd();
    if (!patch.trim()) {
      return NextResponse.json({ error: 'patch is required' }, { status: 400 });
    }

    // Check first
    const check = await runGitApply(patch, true, projectRoot);
    if (!check.ok) {
      return NextResponse.json({ ok: false, stage: 'check', output: check.output || 'git apply --check failed' }, { status: 400 });
    }

    // Apply
    const applied = await runGitApply(patch, false, projectRoot);
    if (!applied.ok) {
      return NextResponse.json({ ok: false, stage: 'apply', output: applied.output || 'git apply failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, output: applied.output || 'applied' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
