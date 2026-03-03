import os from 'node:os';
import path from 'node:path';

export function openClawWorkspace() {
  return path.join(os.homedir(), '.openclaw', 'workspace');
}

// Map project slug -> folder name in ~/.openclaw/workspace
const PROJECT_DIRS: Record<string, string> = {
  'rebtel-design-patterns': 'rebtel-design-patterns',
  'retro-computer-website': 'retro-computer-website',
  'retro-desktop-ui': 'retro-desktop-ui',
  'context-vault': 'context-vault',
};

export function resolveProjectRoot(slug: string) {
  const dir = PROJECT_DIRS[slug];
  if (!dir) return null;
  return path.join(openClawWorkspace(), dir);
}

export function listProjectSlugs() {
  return Object.keys(PROJECT_DIRS);
}
