import { spawn } from 'node:child_process';

export async function runGit(args: string[], cwd?: string) {
  return await new Promise<{ ok: boolean; output: string }>((resolve) => {
    const child = spawn('git', args, {
      cwd: cwd ?? process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let out = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (out += d.toString()));

    child.on('close', (code) => {
      resolve({ ok: code === 0, output: out.trim() });
    });
  });
}
