'use client';
import { useEffect, useState } from 'react';

type TokenInfo = { model: string; mode: string; used: number; limit: number };

export function useTokens() {
  const [data, setData] = useState<TokenInfo>({ model: 'openai/gpt-5.1-codex', mode: 'think low', used: 227000, limit: 400000 });

  useEffect(() => {
    let active = true;
    const fetchTokens = async () => {
      try {
        const res = await fetch('/api/tokens');
        if (!res.ok) return;
        const json = await res.json();
        if (active) setData(json);
      } catch (err) {
        console.error('token fetch failed', err);
      }
    };
    fetchTokens();
    const id = setInterval(fetchTokens, 3000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return data;
}
