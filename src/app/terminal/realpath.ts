export function resolvePath(cwd: string, target: string) {
  const clean = (s: string) => s.replace(/\/+/g, '/');
  if (!target || target === '.') return cwd;
  if (target.startsWith('/')) {
    return clean(target);
  }
  const base = cwd === '/' ? '' : cwd;
  const raw = clean(`${base}/${target}`);
  const parts = raw.split('/').filter(Boolean);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '..') stack.pop();
    else if (part === '.') continue;
    else stack.push(part);
  }
  return '/' + stack.join('/');
}
