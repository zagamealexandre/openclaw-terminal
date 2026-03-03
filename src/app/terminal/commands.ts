
import { listChildren, walk } from './fs';

export type CommandContext = {
  print: (line: string) => void;
  clear: () => void;
  cwd: string;
  setCwd: (next: string) => void;
  userId: string;
  setThemeVar: (key: string, value: string) => void;
  sendChat: (message: string) => Promise<void>;
  browse: (target: string) => Promise<void>;
  research: (query: string) => Promise<void>;
};

export type CommandHandler = (args: string[], ctx: CommandContext) => void | Promise<void>;

function resolvePath(cwd: string, target: string) {
  if (!target || target === '.') return cwd;
  if (target === '..') {
    if (cwd === '/') return '/';
    const parts = cwd.split('/').filter(Boolean);
    parts.pop();
    return parts.length ? '/' + parts.join('/') : '/';
  }
  if (target.startsWith('/')) return target === '/' ? '/' : target;
  const base = cwd === '/' ? '' : cwd;
  return `${base}/${target}`.replace(/\+/g, '/');
}

const commands: Record<string, CommandHandler> = {
  help: (_args, { print }) => {
    print('Available commands: help, clear, echo, whoami, pwd, ls, cd, cat, theme, chat, browse, research');
  },
  clear: (_args, { clear }) => clear(),
  echo: (args, { print }) => print(args.join(' ')),
  whoami: (_args, { print, userId }) => print(userId),
  pwd: (_args, { print, cwd }) => print(cwd),
  ls: (args, { cwd, print }) => {
    const target = resolvePath(cwd, args[0] ?? cwd);
    const children = listChildren(target);
    if (!children) {
      print(`ls: cannot access ${target}`);
      return;
    }
    print(children.map((c) => (c.type === 'dir' ? `${c.name}/` : c.name)).join('	'));
  },
  cd: (args, { cwd, setCwd, print }) => {
    const target = args[0] ?? '/';
    const path = resolvePath(cwd, target);
    const lookup = walk(path);
    if (!lookup || lookup.node.type !== 'dir') {
      print(`cd: no such file or directory: ${target}`);
      return;
    }
    setCwd(path);
  },
  cat: (args, { cwd, print }) => {
    const target = args[0];
    if (!target) {
      print('cat: missing file operand');
      return;
    }
    const lookup = walk(resolvePath(cwd, target));
    if (!lookup || lookup.node.type !== 'file') {
      print(`cat: ${target}: not found`);
      return;
    }
    print(lookup.node.content ?? '');
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
