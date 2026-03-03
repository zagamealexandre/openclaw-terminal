'use client';

import { useState } from 'react';

import { useTerminal } from './use-terminal';
import { useTokens } from '@/components/use-tokens';

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
    bridgeStatus,
  } = useTerminal(userId);

  const tokens = useTokens();
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    setStarted(true);
    window.setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleClear = () => {
    setStarted(false);
    clearConsole();
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
              </div>
            </header>

            <main className="terminal-stack" ref={viewportRef}>
              <section className="terminal-output">
                {output.map((line) => (
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
                <div className="terminal-splash">
                  <div className="terminal-splash__text">
                    <p className="terminal-splash__eyebrow">WELCOME</p>
                    <h2>RABBIES OS</h2>
                    <p>Press start to begin a chat session.</p>
                    <button type="button" className="terminal-button" onClick={handleStart}>
                      start
                    </button>
                  </div>
                  <img className="terminal-splash__image" src="/ansi/MIST0825.NFO.ANS.png" alt="Terminal welcome art" />
                </div>
              )}
            </main>

            <footer className="terminal-footer">
              <span>
                {tokens.model} | {tokens.mode} | tokens {(tokens.used / 1000).toFixed(0)}k/
                {(tokens.limit / 1000).toFixed(0)}k ({Math.round((tokens.used / tokens.limit) * 100)}%)
              </span>
              <div className="terminal-footer__status">
                <span>build 1.0 · rabbits</span>
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
