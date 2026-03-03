"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ThreadListItem } from "@/lib/db";
import { useRetroSound } from "@/lib/useRetroSound";

const GRID_POSITIONS = [
  { x: 24, y: 24 },
  { x: 174, y: 24 },
  { x: 324, y: 24 },
  { x: 474, y: 24 },
  { x: 24, y: 184 },
  { x: 174, y: 184 },
  { x: 324, y: 184 },
  { x: 474, y: 184 },
  { x: 24, y: 344 },
  { x: 174, y: 344 },
  { x: 324, y: 344 },
  { x: 474, y: 344 },
];

type ContextMenuState = {
  id: string;
  title: string;
  x: number;
  y: number;
} | null;

export function DesktopArea({ threads }: { threads: ThreadListItem[] }) {
  const router = useRouter();
  const playSound = useRetroSound();

  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() => ({}));
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const orderedThreads = useMemo(() => threads.slice(0, 12), [threads]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPositions((prev) => {
      const updated = { ...prev };
      orderedThreads.forEach((thread, index) => {
        if (!updated[thread.id]) {
          const base = GRID_POSITIONS[index % GRID_POSITIONS.length];
          updated[thread.id] = { x: base.x, y: base.y };
        }
      });
      return updated;
    });
  }, [orderedThreads]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("pointerdown", closeMenu);
    return () => window.removeEventListener("pointerdown", closeMenu);
  }, []);

  const handleDrag = useCallback(
    (threadId: string, event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const startX = event.clientX;
      const startY = event.clientY;
      const startPos = positions[threadId];
      const offsetX = startPos ? startX - startPos.x : 0;
      const offsetY = startPos ? startY - startPos.y : 0;

      setDraggingId(threadId);

      const handleMove = (moveEvent: PointerEvent) => {
        setPositions((prev) => ({
          ...prev,
          [threadId]: {
            x: moveEvent.clientX - offsetX,
            y: moveEvent.clientY - offsetY,
          },
        }));
      };

      const handleUp = () => {
        setDraggingId(null);
        document.removeEventListener("pointermove", handleMove);
        document.removeEventListener("pointerup", handleUp);
      };

      document.addEventListener("pointermove", handleMove);
      document.addEventListener("pointerup", handleUp);
    },
    [positions]
  );

  const handleOpen = useCallback(
    (id: string) => {
      playSound({ frequency: 680, duration: 0.12 });
      router.push(`/threads/${id}`);
    },
    [playSound, router]
  );

  const handleContextMenu = useCallback(
    (thread: ThreadListItem, event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setContextMenu({ id: thread.id, title: thread.title, x: event.clientX, y: event.clientY });
      playSound({ frequency: 320, duration: 0.08 });
    },
    [playSound]
  );

  const copyLink = useCallback(async (id: string) => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/threads/${id}`);
      playSound({ frequency: 760, duration: 0.09 });
    } catch {
      playSound({ frequency: 220, duration: 0.2 });
    }
  }, [playSound]);

  return (
    <div className="desktop-grid" aria-label="Retro desktop">
      {orderedThreads.map((thread) => {
        const pos = positions[thread.id] ?? { x: 24, y: 24 };
        const iconClass = draggingId === thread.id ? "desktop-icon dragging" : "desktop-icon";
        return (
          <button
            key={thread.id}
            className={iconClass}
            style={{ left: pos.x, top: pos.y }}
            onPointerDown={(event) => handleDrag(thread.id, event)}
            onDoubleClick={() => handleOpen(thread.id)}
            onContextMenu={(event) => handleContextMenu(thread, event)}
          >
            <span className="desktop-icon__glyph" aria-hidden>
              📁
            </span>
            <span className="desktop-icon__label">{thread.title}</span>
            <kbd className="desktop-icon__tag">{thread.type}</kbd>
          </button>
        );
      })}

      {orderedThreads.length === 0 && (
        <div className="desktop-placeholder">No threads yet. Spin up a folder via Mission Dispatch.</div>
      )}

      {contextMenu && (
        <ul
          className="desktop-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
        >
          <li>
            <button type="button" role="menuitem" onClick={() => handleOpen(contextMenu.id)}>
              Open
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => copyLink(contextMenu.id)}>
              Copy Link
            </button>
          </li>
          <li>
            <span className="disabled">Rename (soon)</span>
          </li>
        </ul>
      )}
    </div>
  );
}
