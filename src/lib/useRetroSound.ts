"use client";

import { useCallback, useRef } from "react";

export function useRetroSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureContext = () => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      try {
        ctxRef.current = new AudioContext();
      } catch {
        return null;
      }
    }
    return ctxRef.current;
  };

  return useCallback(
    (options?: { frequency?: number; duration?: number; volume?: number }) => {
      const ctx = ensureContext();
      if (!ctx) return;

      const frequency = options?.frequency ?? 520;
      const duration = options?.duration ?? 0.12;
      const volume = options?.volume ?? 0.12;

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.value = frequency;

      gain.gain.value = volume;
      oscillator.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      oscillator.start(now);
      oscillator.stop(now + duration);
    },
    []
  );
}
