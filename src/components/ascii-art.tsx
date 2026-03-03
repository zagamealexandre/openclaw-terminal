"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  src: string;
  className?: string;
  durationMs?: number;
};

export function AsciiArt({ src, className, durationMs = 4800 }: Props) {
  const [fullText, setFullText] = useState<string>("");
  const [visibleLines, setVisibleLines] = useState<number>(0);

  const lines = useMemo(() => fullText.split(/\r?\n/), [fullText]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(src);
      const body = await res.text();
      if (cancelled) return;
      setFullText(body);
      setVisibleLines(0);
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (!fullText) return;

    const total = Math.max(1, lines.length);
    const stepMs = Math.max(8, Math.floor(durationMs / total));

    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setVisibleLines(i);
      if (i >= total) {
        window.clearInterval(id);
      }
    }, stepMs);

    return () => window.clearInterval(id);
  }, [durationMs, fullText, lines.length]);

  const shown = lines.slice(0, Math.max(0, visibleLines)).join("\n");

  return (
    <pre className={className} aria-label="ASCII art">
      {shown}
    </pre>
  );
}
