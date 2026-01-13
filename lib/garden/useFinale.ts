'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

type PlaySfx = (
  ref: RefObject<HTMLAudioElement>,
  options?: { volume?: number; rateMin?: number; rateMax?: number }
) => void;

type UseFinaleOptions = {
  perfTier: 'low' | 'mid' | 'high';
  viewport: { width: number; height: number };
  showBlessing: boolean;
  containerRef: RefObject<HTMLElement>;
  finaleRef: RefObject<HTMLAudioElement>;
  playSfx: PlaySfx;
  addShootingStar: (duration?: number) => void;
  addSparkle: (x: number, y: number, duration?: number) => void;
  addPetalBurst: (x: number, y: number, durationScale?: number) => void;
  addAura: (x: number, y: number) => void;
  addLantern: () => void;
};

export function useFinale({
  perfTier,
  viewport,
  showBlessing,
  containerRef,
  finaleRef,
  playSfx,
  addShootingStar,
  addSparkle,
  addPetalBurst,
  addAura,
  addLantern
}: UseFinaleOptions) {
  const [finaleTriggered, setFinaleTriggered] = useState(false);
  const [isImploding, setIsImploding] = useState(false);
  const finaleTimeoutRef = useRef<number | null>(null);
  const finaleReleaseRef = useRef<number | null>(null);
  const finalePulseTimeoutsRef = useRef<number[]>([]);

  const triggerFinale = useCallback(() => {
    if (finaleTriggered || isImploding) return;
    setIsImploding(true);

    if (finaleTimeoutRef.current) {
      window.clearTimeout(finaleTimeoutRef.current);
    }
    if (finaleReleaseRef.current) {
      window.clearTimeout(finaleReleaseRef.current);
    }
    if (finalePulseTimeoutsRef.current.length > 0) {
      finalePulseTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      finalePulseTimeoutsRef.current = [];
    }

    const rect = containerRef.current?.getBoundingClientRect();
    const width = rect?.width ?? viewport.width;
    const height = rect?.height ?? viewport.height;
    const centerX = width / 2;
    const centerY = height / 2;

    finaleReleaseRef.current = window.setTimeout(() => {
      setFinaleTriggered(true);
      setIsImploding(false);
      playSfx(finaleRef, { volume: 0.5, rateMin: 0.96, rateMax: 1.02 });
      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }

      const schedulePulse = (delayMs: number, index: number) => {
        const timeoutId = window.setTimeout(() => {
          addShootingStar(3.2);
          addSparkle(Math.random() * width, Math.random() * height, 2.4);
          addPetalBurst(centerX, centerY, 2.2);
          if (showBlessing && index === 0) {
            addAura(centerX, centerY);
          }
          if (perfTier !== 'low' && index === 1) {
            addLantern();
          }
        }, delayMs);
        finalePulseTimeoutsRef.current.push(timeoutId);
      };

      [0, 900, 1800].forEach((delayMs, index) => schedulePulse(delayMs, index));

      finaleTimeoutRef.current = window.setTimeout(() => {
        finalePulseTimeoutsRef.current = [];
        finaleTimeoutRef.current = null;
      }, 2600);
    }, 1600);
  }, [
    addAura,
    addLantern,
    addPetalBurst,
    addSparkle,
    addShootingStar,
    containerRef,
    finaleRef,
    finaleTriggered,
    isImploding,
    perfTier,
    playSfx,
    showBlessing,
    viewport.height,
    viewport.width
  ]);

  useEffect(() => {
    return () => {
      if (finaleTimeoutRef.current) {
        window.clearTimeout(finaleTimeoutRef.current);
      }
      if (finaleReleaseRef.current) {
        window.clearTimeout(finaleReleaseRef.current);
      }
      if (finalePulseTimeoutsRef.current.length > 0) {
        finalePulseTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
        finalePulseTimeoutsRef.current = [];
      }
    };
  }, []);

  return { finaleTriggered, isImploding, triggerFinale };
}
