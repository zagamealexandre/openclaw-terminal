import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveProjectRoot } from '@/lib/project-roots';

export function resolveWithinProject(projectSlug: string, targetPath: string) {
  const root = resolveProjectRoot(projectSlug);
  if (!root) return null;

  const rel = (targetPath || '/').startsWith('/') ? targetPath : `/${targetPath}`;
  const abs = path.resolve(root, '.' + rel);
  if (!abs.startsWith(root)) return null;
  return { root, abs, rel };
}

export async function safeStat(abs: string) {
  const st = await fs.stat(abs);
  return { isFile: st.isFile(), isDir: st.isDirectory(), size: st.size, mtimeMs: st.mtimeMs };
}
