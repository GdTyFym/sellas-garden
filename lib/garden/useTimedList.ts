import { useCallback, useEffect, useRef, useState } from 'react';
import type { Timed } from '@/lib/garden/types';

type Sweeper = () => boolean;

const sweepers = new Set<Sweeper>();
const GLOBAL_TICK_MS = 100;
let timer: number | null = null;

function stopTimer() {
  if (timer === null) return;
  window.clearInterval(timer);
  timer = null;
}

function tick() {
  let anyActive = false;
  sweepers.forEach((sweeper) => {
    if (sweeper()) {
      anyActive = true;
    }
  });
  if (!anyActive) {
    stopTimer();
  }
}

function ensureRunning() {
  if (typeof window === 'undefined') return;
  if (timer !== null) return;
  timer = window.setInterval(tick, GLOBAL_TICK_MS);
}

export function useTimedList<T>(max: number, sweepMs = 200) {
  const [items, setItems] = useState<Timed<T>[]>([]);
  const itemsRef = useRef(items);
  const nextSweepAtRef = useRef(0);

  const setItemsRef = useCallback(
    (updater: (prev: Timed<T>[]) => Timed<T>[]) => {
      setItems((prev) => {
        const next = updater(prev);
        itemsRef.current = next;
        return next;
      });
    },
    []
  );

  const sweeper = useCallback(() => {
    const currentItems = itemsRef.current;
    if (currentItems.length === 0) {
      nextSweepAtRef.current = 0;
      return false;
    }
    const now = performance.now();
    if (nextSweepAtRef.current === 0) {
      nextSweepAtRef.current = now + sweepMs;
      return true;
    }
    if (now < nextSweepAtRef.current) return true;
    nextSweepAtRef.current = now + sweepMs;
    setItemsRef((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.filter((item) => item.expiresAt > now);
      return next.length === prev.length ? prev : next;
    });
    return true;
  }, [setItemsRef, sweepMs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sweepers.add(sweeper);
    if (itemsRef.current.length > 0) {
      ensureRunning();
    }
    return () => {
      sweepers.delete(sweeper);
      if (sweepers.size === 0) {
        stopTimer();
      }
    };
  }, [sweeper]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setItemsRef((prev) => (prev.length > max ? prev.slice(-max) : prev));
  }, [max, setItemsRef]);

  const push = useCallback(
    (item: T, ttlMs: number) => {
      const now = performance.now();
      const expiresAt = now + ttlMs;
      setItemsRef((prev) => [...prev, { ...item, expiresAt }].slice(-max));
      if (typeof window !== 'undefined') {
        if (nextSweepAtRef.current === 0) {
          nextSweepAtRef.current = now + sweepMs;
        }
        ensureRunning();
      }
    },
    [max, setItemsRef, sweepMs]
  );

  const pushMany = useCallback(
    (nextItems: Array<{ item: T; ttlMs: number }>) => {
      const now = performance.now();
      setItemsRef((prev) => {
        const timed = nextItems.map(({ item, ttlMs }) => ({
          ...item,
          expiresAt: now + ttlMs
        }));
        return [...prev, ...timed].slice(-max);
      });
      if (typeof window !== 'undefined') {
        if (nextSweepAtRef.current === 0) {
          nextSweepAtRef.current = now + sweepMs;
        }
        ensureRunning();
      }
    },
    [max, setItemsRef, sweepMs]
  );

  return { items, push, pushMany };
}
