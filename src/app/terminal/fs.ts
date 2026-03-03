
export type FsNode = {
  name: string;
  type: 'dir' | 'file';
  content?: string;
  children?: FsNode[];
};

const fileTree: FsNode = {
  name: '/',
  type: 'dir',
  children: [
    {
      name: 'home',
      type: 'dir',
      children: [
        {
          name: 'user',
          type: 'dir',
          children: [
            {
              name: 'readme.txt',
              type: 'file',
              content: 'Welcome to Context Vault OS. Type `help` to learn the available commands.',
            },
            {
              name: 'about.md',
              type: 'file',
              content: '# Context Vault\nThis is a retro-inspired shell bridging you and Totoro. Enjoy the glow.',
            },
            {
              name: 'projects',
              type: 'dir',
              children: [
                {
                  name: 'context-vault',
                  type: 'dir',
                  children: [
                    { name: 'status.txt', type: 'file', content: 'Boot sequence nominal.' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export type FsLookup = {
  path: string;
  node: FsNode;
};

function normalize(path: string): string {
  if (!path.startsWith('/')) return '/' + path;
  return path.replace(/\+/g, '/');
}

export function walk(path: string): FsLookup | null {
  const normalized = normalize(path);
  if (normalized === '/' || normalized === '') {
    return { path: '/', node: fileTree };
  }
  const parts = normalized.split('/').filter(Boolean);
  let node: FsNode = fileTree;
  const traversed: string[] = [];
  for (const part of parts) {
    const child = node.children?.find((c) => c.name === part);
    if (!child) return null;
    traversed.push(part);
    node = child;
  }
  return { path: '/' + traversed.join('/'), node };
}

export function listChildren(path: string): FsNode[] | null {
  const lookup = walk(path);
  if (!lookup) return null;
  if (lookup.node.type !== 'dir') return null;
  return lookup.node.children ?? [];
}

export function isDir(path: string) {
  const lookup = walk(path);
  return lookup?.node.type === 'dir';
}

export default fileTree;
