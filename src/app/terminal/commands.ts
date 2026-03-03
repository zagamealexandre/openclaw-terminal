import { PROJECTS } from '@/data/projects';
import { fsLs, fsRead, fsStat } from './fs-client';
import { resolvePath } from './realpath';
import { stripMarkdown } from './markdown-strip';


export type CommandContext = {
  print: (line: string) => void;
  clear: () => void;
  cwd: string;
  setCwd: (next: string) => void;
  userId: string;
  selectedProject: string;
  setSelectedProject: (slug: string) => void;
  setThemeVar: (key: string, value: string) => void;
  sendChat: (message: string) => Promise<void>;
  browse: (target: string) => Promise<void>;
  research: (query: string) => Promise<void>;
};

export type CommandHandler = (args: string[], ctx: CommandContext) => void | Promise<void>;

const commands: Record<string, CommandHandler> = {
  help: (_args, { print }) => {
    print('Available commands: help, clear, echo, whoami, pwd, ls, cd, cat, theme, chat, browse, research, projects, use');
  },
  clear: (_args, { clear }) => clear(),
  echo: (args, { print }) => print(args.join(' ')),
  whoami: (_args, { print, userId }) => print(userId),
  pwd: (_args, { print, cwd }) => print(cwd),
  ls: async (args, { cwd, print, selectedProject }) => {
    const target = resolvePath(cwd, args[0] ?? cwd);
    const data = await fsLs(selectedProject, target);
    if (!data?.ok) {
      print(`ls: ${data?.error || 'failed'}`);
      return;
    }
    const items = Array.isArray(data.items) ? data.items : [];
    print(items.map((c: any) => (c.type === 'dir' ? `${c.name}/` : c.name)).join('    '));
  },
  cd: async (args, { cwd, setCwd, print, selectedProject }) => {
    const target = args[0] ?? '/';
    const next = resolvePath(cwd, target);
    const st = await fsStat(selectedProject, next);
    if (!st?.ok || st.type !== 'dir') {
      print(`cd: no such directory: ${target}`);
      return;
    }
    setCwd(next);
  },
  cat: async (args, { cwd, print, selectedProject }) => {
    const target = args[0];
    if (!target) {
      print('cat: missing file operand');
      return;
    }
    const filePath = resolvePath(cwd, target);
    const data = await fsRead(selectedProject, filePath);
    if (!data?.ok) {
      print(`cat: ${data?.error || 'failed'}`);
      return;
    }
    const content = String(data.content ?? '');
    const normalized = filePath.toLowerCase().endsWith('.md') ? stripMarkdown(content) : content;
    print(normalized);
  },
  theme: (args, { print, setThemeVar }) => {
    if (args.length < 1) {
      print('Usage: theme set <var> <value>');
      return;
    }
    const [action, key, value] = args;
    if (action !== 'set' || !key || !value) {
      print('Usage: theme set <var> <value>');
      return;
    }
    setThemeVar(key, value);
    print(`theme updated: ${key} => ${value}`);
  },
  chat: async (args, { print, sendChat }) => {
    const message = args.join(' ').trim();
    if (!message) {
      print('chat: message required');
      return;
    }
    await sendChat(message);
  },
  browse: async (args, { print, browse }) => {
    if (args.length === 0) {
      print('browse: target or search query required');
      return;
    }
    const [maybeUrl, ...rest] = args;
    const target = rest.length ? [maybeUrl, ...rest].join(' ') : maybeUrl;
    await browse(target.trim());
  },

  projects: (_args, { print, selectedProject }) => {
    PROJECTS.forEach((p) => {
      const active = p.slug === selectedProject ? '*' : ' ';
      print(`${active} ${p.slug} — ${p.title}`);
    });
  },
  use: (args, { print, setSelectedProject }) => {
    const slug = args[0];
    if (!slug) {
      print('use: missing project slug');
      return;
    }
    const found = PROJECTS.find((p) => p.slug === slug);
    if (!found) {
      print(`use: unknown project: ${slug}`);
      return;
    }
    setSelectedProject(slug);
    print(`active project: ${slug}`);
  },
  research: async (args, { print, research }) => {
    if (args.length === 0) {
      print('research: query required');
      return;
    }
    const query = args.join(' ').trim();
    await research(query);
  },
};

export async function runCommand(input: string, ctx: CommandContext) {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const [cmd, ...args] = tokens;
  const handler = commands[cmd];
  if (!handler) {
    return false;
  }
  await handler(args, ctx);
  return true;
}
