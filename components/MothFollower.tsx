'use client';

import { useEffect, useRef } from 'react';

type PointerState = {
  x: number;
  y: number;
  active: boolean;
  lastMove: number;
};

type MothFollowerProps = {
  enabled: boolean;
  pointerRef: React.RefObject<PointerState>;
  containerRef: React.RefObject<HTMLElement>;
};

export default function MothFollower({ enabled, pointerRef, containerRef }: MothFollowerProps) {
  const mothRef = useRef<HTMLDivElement | null>(null);
  const boundsRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ x: 0, y: 0, wander: 0, lastTime: 0 });

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    const updateBounds = () => {
      boundsRef.current = containerRef.current?.getBoundingClientRect() ?? null;
      const rect = boundsRef.current;
      if (rect && stateRef.current.x === 0 && stateRef.current.y === 0) {
        stateRef.current.x = rect.width * 0.5;
        stateRef.current.y = rect.height * 0.45;
      }
    };

    updateBounds();

    const onResize = () => updateBounds();
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('scroll', onResize, { passive: true, capture: true });

    const tick = (time: number) => {
      const rect = boundsRef.current;
      const moth = mothRef.current;
      if (!rect || !moth) {
        rafRef.current = window.requestAnimationFrame(tick);
        return;
      }

      const state = stateRef.current;
      const dt = state.lastTime ? Math.min(48, time - state.lastTime) / 1000 : 0.016;
      state.lastTime = time;

      const pointer = pointerRef.current;
      const now = performance.now();
      const pointerRecent = !!pointer && now - pointer.lastMove < 3000;

      let targetX = rect.width * 0.5;
      let targetY = rect.height * 0.45;
      if (pointerRecent) {
        targetX = pointer.x;
        targetY = pointer.y;
      } else {
        state.wander += dt * 0.6;
        const drift = 26;
        targetX += Math.cos(state.wander) * drift;
        targetY += Math.sin(state.wander * 1.3) * drift * 0.6;
      }

      const padding = 14;
      targetX = Math.min(rect.width - padding, Math.max(padding, targetX));
      targetY = Math.min(rect.height - padding, Math.max(padding, targetY));

      state.x += (targetX - state.x) * (pointerRecent ? 0.12 : 0.06);
      state.y += (targetY - state.y) * (pointerRecent ? 0.12 : 0.06);

      const tilt = Math.max(-12, Math.min(12, (targetX - state.x) * 0.15));
      const offsetX = state.x - 9;
      const offsetY = state.y - 6;
      moth.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${tilt}deg)`;

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, { capture: true });
    };
  }, [containerRef, enabled, pointerRef]);

  if (!enabled) return null;

  return (
    <div ref={mothRef} className="moth-follower" aria-hidden="true">
      <div className="moth-shell">
        <span className="moth-wing moth-wing-left" />
        <span className="moth-wing moth-wing-right" />
        <span className="moth-core" />
      </div>
    </div>
  );
}
