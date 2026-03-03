"use client";

import { useMemo, useState } from "react";

import { useRetroSound } from "@/lib/useRetroSound";

type CommandItem = {
  name: string;
  description: string;
};

type CommandGroup = {
  title: string;
  items: CommandItem[];
};

export function ConfigCommandGrid({ groups }: { groups: CommandGroup[] }) {
  const playSound = useRetroSound();
  const [copied, setCopied] = useState<string | null>(null);

  const flattened = useMemo(() => {
    const map = new Map<string, string>();
    groups.forEach((g) => g.items.forEach((i) => map.set(i.name, i.name)));
    return map;
  }, [groups]);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      playSound({ frequency: 820, duration: 0.08 });
      window.setTimeout(() => setCopied((prev) => (prev == value ? null : prev)), 900);
    } catch {
      playSound({ frequency: 220, duration: 0.18 });
    }
  };

  return (
    <div className="readme-grid">
      {groups.map((group) => (
        <article key={group.title} className="readme-card">
          <h2>{group.title}</h2>
          <ul className="config-list">
            {group.items.map((item) => {
              const isCopied = copied === item.name;
              return (
                <li key={item.name} className="config-item">
                  <button
                    type="button"
                    className={isCopied ? "config-copy copied" : "config-copy"}
                    onClick={() => copy(item.name)}
                   
                  >
                    <code>{item.name}</code>
                  </button>
                  <div className="readme-note">{item.description}</div>
                </li>
              );
            })}
          </ul>
        </article>
      ))}
    </div>
  );
}
