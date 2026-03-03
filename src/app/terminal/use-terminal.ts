
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { runCommand } from './commands';

export type TerminalLine = {
  id: string;
  content: string;
};

type ClientResearchSource = {
  title?: string;
  summary?: string;
  snippet?: string;
  url?: string;
};

const homePath = '/home/user';

function formatPrompt(cwd: string) {
  if (cwd === homePath) return 'user:~$';
  if (cwd.startsWith(homePath)) {
    const suffix = cwd.replace(homePath, '~');
    return `user:${suffix}$`;
  }
  return `user:${cwd}$`;
}

export function useTerminal(userId: string) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [bridgeStatus, setBridgeStatus] = useState<'online' | 'connecting' | 'offline'>('online');
  const [cwd, setCwd] = useState(homePath);
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [, setHistoryIndex] = useState(-1);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const prompt = useMemo(() => formatPrompt(cwd), [cwd]);

  const print = useCallback((content: string) => {
    setLines((prev) => [...prev, { id: crypto.randomUUID(), content }]);
  }, []);

  const clear = useCallback(() => {
    setLines([]);
  }, []);

  const clearConsole = useCallback(() => {
    setLines([]);
  }, []);

  const updateInput = useCallback((next: string) => {
    setInputValue(next);
    if (textareaRef.current) textareaRef.current.value = next;
  }, []);





  const sendChat = useCallback(
    async (message: string) => {
      setBridgeStatus('connecting');
      const streamingLineId = crypto.randomUUID();
      setLines((prev) => [...prev, { id: streamingLineId, content: 'CONTACTING RABBIES…\n' }]);

      const updateStreamingLine = (chunk: string) =>
        setLines((prev) =>
          prev.map((line) =>
            line.id === streamingLineId ? { ...line, content: line.content + chunk } : line
          )
        );

      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
          body: JSON.stringify({ message }),
        });

        if (!response.ok || !response.body) {
          const fallback = await response.json().catch(() => null);
          const text = fallback?.error ? `error: ${fallback.error}` : 'bridge error: unable to stream';
          updateStreamingLine(`
${text}`);
          return;
        }

        setBridgeStatus('online');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let boundary = buffer.indexOf('\n\n');
          while (boundary >= 0) {
            const raw = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            raw
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
              .forEach((line) => {
                if (!line.startsWith('data:')) return;
                const payload = line.slice(5).trim();
                if (!payload || payload === '[DONE]' || payload === 'CONTACTING RABBIES…') return;
                updateStreamingLine(payload + ' ');
              });
            boundary = buffer.indexOf('\n\n');
          }
        }
      } catch (err) {
        const messageText = err instanceof Error ? err.message : String(err);
        setBridgeStatus('offline');
        updateStreamingLine(`
error: ${messageText}`);
      }
    },
    []
  );

  const browseWeb = useCallback(
    async (target: string) => {
      const id = crypto.randomUUID();
      setLines((prev) => [...prev, { id, content: `BROWSING ${target}…\n` }]);
      try {
        const response = await fetch('/api/browse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target }),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => null);
          const message = error?.error ?? 'browse: request failed';
          setLines((prev) =>
            prev.map((line) => (line.id === id ? { ...line, content: `${line.content}\n${message}` } : line))
          );
          return;
        }
        const data = await response.json();
        const excerpt = (data.content as string | undefined)?.trim() ?? 'no content';
        const summary = excerpt.length > 2000 ? `${excerpt.slice(0, 2000)}…` : excerpt;
        setLines((prev) =>
          prev.map((line) =>
            line.id === id
              ? { ...line, content: `${line.content}\nSOURCE: ${data.url || target}\n${summary}` }
              : line
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setLines((prev) =>
          prev.map((line) => (line.id === id ? { ...line, content: `${line.content}\nerror: ${message}` } : line))
        );
      }
    },
    []
  );

  const researchTopic = useCallback(
    async (query: string) => {
      const id = crypto.randomUUID();
      setLines((prev) => [...prev, { id, content: `RESEARCHING ${query}…
` }]);
      try {
        const response = await fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => null);
          const message = error?.error ?? 'research: request failed';
          setLines((prev) =>
            prev.map((line) => (line.id === id ? { ...line, content: `${line.content}\n${message}` } : line))
          );
          return;
        }
        const data = await response.json();
        const sources = (Array.isArray(data.sources) ? data.sources : []) as ClientResearchSource[];
        const sourceText = sources
          .map((src, index) => {
            const title = src.title || src.url;
            const summary = src.summary || src.snippet || '';
            const url = src.url || '';
            return `[#${index + 1}] ${title}\n${summary}\n${url}`;
          })
          .join('\n\n');
        const answer = data.answer || 'No summary available.';
        setLines((prev) =>
          prev.map((line) =>
            line.id === id
              ? {
                  ...line,
                  content: `${line.content}\n${answer}${sourceText ? `\n\nSources:\n${sourceText}` : ''}`
                }
              : line
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setLines((prev) =>
          prev.map((line) => (line.id === id ? { ...line, content: `${line.content}\nerror: ${message}` } : line))
        );
      }
    },
    []
  );

  const run = useCallback(async () => {
    const command = inputValue.trim();
    updateInput('');
    setHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);

    if (!command) {
      setLines((prev) => [...prev, { id: crypto.randomUUID(), content: prompt }]);
      return;
    }

    setLines((prev) => [...prev, { id: crypto.randomUUID(), content: `${prompt} ${command}` }]);

    const handled = await runCommand(command, {
      print,
      clear,
      cwd,
      setCwd,
      userId,
      setThemeVar: (key, value) => {
        document.documentElement.style.setProperty(`--${key}`, value);
      },
      sendChat,
      browse: browseWeb,
      research: researchTopic,
    });

    if (!handled) {
      await sendChat(command);
    }
  }, [browseWeb, clear, cwd, inputValue, print, prompt, researchTopic, sendChat, setCwd, updateInput, userId]);

  useEffect(() => {
    if (!viewportRef.current) return;
    viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
  }, [lines, inputValue]);

  const focusInput = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  const handleInput = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        run();
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHistoryIndex((idx) => {
          if (history.length === 0) return -1;
          const next = idx < 0 ? history.length - 1 : Math.max(0, idx - 1);
          const value = history[next] ?? '';
          updateInput(value);
          return next;
        });
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHistoryIndex((idx) => {
          if (history.length === 0) return -1;
          const next = idx < 0 ? -1 : Math.min(history.length - 1, idx + 1);
          if (next === -1) {
            updateInput('');
            return -1;
          }
          const value = history[next] ?? '';
          updateInput(value);
          return next;
        });
      }
    },
    [history, run, updateInput]
  );

  return {
    output: lines,
    print,
    prompt,
    inputValue,
    textareaRef,
    viewportRef,
    handleClick: focusInput,
    handleInput,
    handleKeyDown,
    clearConsole,
    bridgeStatus,
  };
}
