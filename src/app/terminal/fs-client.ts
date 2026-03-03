export type FsItem = { name: string; type: 'file' | 'dir'; size: number | null };

export async function fsLs(projectSlug: string, path: string) {
  const res = await fetch('/api/fs/ls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectSlug, path }),
  });
  return await res.json();
}

export async function fsRead(projectSlug: string, path: string) {
  const res = await fetch('/api/fs/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectSlug, path }),
  });
  return await res.json();
}

export async function fsStat(projectSlug: string, path: string) {
  const res = await fetch('/api/fs/stat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectSlug, path }),
  });
  return await res.json();
}
