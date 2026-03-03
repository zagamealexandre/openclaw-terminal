"use client";

import { useEffect, useMemo, useState } from "react";
import AnsiToHtml from "ansi-to-html";
import iconv from "iconv-lite";

export function AnsiArt({ src, className }: { src: string; className?: string }) {
  const [html, setHtml] = useState<string>("");
  const converter = useMemo(
    () =>
      new AnsiToHtml({
        fg: "#ffd277",
        bg: "transparent",
        newline: true,
        escapeXML: true,
      }),
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(src);
      const buf = await res.arrayBuffer();
      // ANSI art expects CP437 (IBM PC)
      const text = iconv.decode(Buffer.from(buf), "cp437");
      const rendered = converter.toHtml(text);
      if (!cancelled) setHtml(rendered);
    })().catch(() => {
      if (!cancelled) setHtml("(failed to load ansi)");
    });
    return () => {
      cancelled = true;
    };
  }, [converter, src]);

  return (
    <div
      className={className}
      aria-label="ANSI art"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
