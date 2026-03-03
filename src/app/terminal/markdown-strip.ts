export function stripMarkdown(md: string) {
  let s = md;

  s = s.replace(/\r\n/g, '\n');

  // Remove fenced code markers but keep content
  s = s.replace(/^```[a-zA-Z0-9_-]*\s*$/gm, '');
  s = s.replace(/^```\s*$/gm, '');

  // Convert links: [text](url) -> text (url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  // Images: ![alt](url) -> alt (url)
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => {
    const a = String(alt || '').trim();
    return a ? `${a} (${url})` : String(url);
  });

  // Remove emphasis markers
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/\*([^*]+)\*/g, '$1');
  s = s.replace(/__([^_]+)__/g, '$1');
  s = s.replace(/_([^_]+)_/g, '$1');

  // Inline code
  s = s.replace(/`([^`]+)`/g, '$1');

  // Headings
  s = s.replace(/^\s{0,3}#{1,6}\s+/gm, '');

  // Blockquotes
  s = s.replace(/^\s*>\s?/gm, '');

  // List bullets
  s = s.replace(/^\s*[-*+]\s+/gm, '• ');

  // Horizontal rules
  s = s.replace(/^\s*([-*_])\1\1+\s*$/gm, '');

  // Collapse excessive blank lines
  s = s.replace(/\n{4,}/g, '\n\n\n');

  return s.trimEnd();
}

export function wrapForTerminal(text: string, width = 78) {
  const wrapLine = (line: string) => {
    if (line.length <= width) return line;
    const words = line.split(/\s+/);
    const out: string[] = [];
    let cur = '';
    for (const w of words) {
      if (!cur) {
        cur = w;
        continue;
      }
      if ((cur + ' ' + w).length > width) {
        out.push(cur);
        cur = w;
      } else {
        cur += ' ' + w;
      }
    }
    if (cur) out.push(cur);
    return out.join('\n');
  };

  return text
    .split('\n')
    .map((line) => wrapLine(line))
    .join('\n');
}
