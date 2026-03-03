'use client';

import { useState } from 'react';

import { useTerminal } from './use-terminal';
import { useTokens } from '@/components/use-tokens';
import { AsciiArt } from '@/components/ascii-art';

export default function TerminalShell({ userId }: { userId: string }) {
  const {
    output,
    prompt,
    inputValue,
    textareaRef,
    viewportRef,
    handleClick,
    handleInput,
    handleKeyDown,
    clearConsole,
    print,
    lastPatch,
    applyLastPatch,
    selectedProject,
    setSelectedProject,
    bridgeStatus,
  } = useTerminal(userId);

  const tokens = useTokens();
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    clearConsole();

    const now = new Date();
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost';
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    print('WELCOME TO CONTEXT VAULT OS v1.0');
    print(`HOST: ${host}`);
    print(`TIME: ${now.toLocaleString()} (${tz})`);
    print(`MODEL: ${tokens.model} | MODE: ${tokens.mode}`);
    print(`TOKENS: ${(tokens.used / 1000).toFixed(0)}k/${(tokens.limit / 1000).toFixed(0)}k (${Math.round((tokens.used / tokens.limit) * 100)}%)`);
    print(`BRIDGE: ${bridgeStatus.toUpperCase()}`);
    print('>> type help to get started');

    setStarted(true);
    window.setTimeout(() => {
      textareaRef.current?.focus();
      if (viewportRef.current) viewportRef.current.scrollTop = 0;
    }, 50);
  };

  const handleClear = () => {
    setStarted(false);
    clearConsole();
  };

  const handleCommit = async () => {
    const message = window.prompt('Commit message?');
    if (!message) return;

    print(`COMMITTING: ${message}`);
    try {
      const res = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, projectSlug: selectedProject }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        print(`COMMIT FAILED: ${data.output || data.error || 'unknown error'}`);
        return;
      }
      print(`COMMIT OK
${data.output || ''}`.trim());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      print(`COMMIT ERROR: ${msg}`);
    }
  };

  const handlePush = async () => {
    print('PUSHING…');
    try {
      const res = await fetch('/api/git/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectSlug: selectedProject }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        print(`PUSH FAILED: ${data.output || data.error || 'unknown error'}`);
        return;
      }
      print(`PUSH OK
${data.output || ''}`.trim());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      print(`PUSH ERROR: ${msg}`);
    }
  };

  return (
    <div className="crt-frame terminal-frame" onClick={handleClick}>
      <div className="crt-shell">
        <div className="crt-glass">
          <div className="crt-content">
            <header className="terminal-header">
              <div>
                <p className="terminal-header__eyebrow">CONTEXT VAULT OS // ACCESS TERMINAL</p>
                <p className="terminal-header__title">authenticated session</p>
              </div>
              <div className="terminal-header__status">
                <button className="terminal-button" type="button" onClick={() => (window.location.href = '/')}>home</button>
                <button className="terminal-button" type="button" onClick={handleClear}>clear</button>
                {lastPatch && (
                  <button className="terminal-button terminal-button--primary" type="button" onClick={applyLastPatch}>
                    apply patch
                  </button>
                )}
                <button className="terminal-button" type="button" onClick={handleCommit}>commit</button>
                <button className="terminal-button" type="button" onClick={handlePush}>push</button>
              </div>
            </header>

            <main className={started ? "terminal-stack" : "terminal-stack terminal-stack--locked"} ref={viewportRef}>
              <div className="terminal-screen">
              <section className="terminal-output">
                {started &&
                  output.map((line) => (
                    <div key={line.id} className="terminal-line">
                      {line.content}
                    </div>
                  ))}

                {started && (
                  <div className="terminal-line terminal-line--input">
                    <span className="terminal-prompt">{prompt}</span>
                    <span className="terminal-input-text">{inputValue}</span>
                    <span className="terminal-cursor" />
                  </div>
                )}
              </section>

              {!started && (
                <div className="terminal-splash terminal-splash--split">
                  <div className="terminal-splash__controls">
                    <button type="button" className="terminal-button terminal-button--primary" onClick={handleStart}>
                      start
                    </button>
                  </div>
                  <AsciiArt src="/ansi/ascii-art.txt" className="terminal-splash__ascii" />
                </div>
              )}
              </div>
            </main>

            <footer className="terminal-footer">
              <span>
                {tokens.model} | {tokens.mode} | tokens {(tokens.used / 1000).toFixed(0)}k/
                {(tokens.limit / 1000).toFixed(0)}k ({Math.round((tokens.used / tokens.limit) * 100)}%)
              </span>
              <div className="terminal-footer__status">
                <span>build 1.0 · totoro</span>
                <span>status: {bridgeStatus}</span>
              </div>
            </footer>
          </div>
          <div className="crt-scanlines" aria-hidden />
          <div className="crt-vignette" aria-hidden />
          <div className="crt-noise" aria-hidden />
          <div className="crt-reflection" aria-hidden />
        </div>
      </div>

      <textarea
        ref={textareaRef}
        className="terminal-hidden-input"
        autoFocus
        value={inputValue}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
