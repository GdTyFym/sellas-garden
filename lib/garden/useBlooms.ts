'use client';

import { useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { MotionValue } from 'framer-motion';
import type { Bloom } from '@/lib/garden/types';

type PerfLimits = {
  maxSpawn: number;
  maxLayers: number;
  maxBlooms: number;
};

type PlaySfx = (
  ref: RefObject<HTMLAudioElement>,
  options?: { volume?: number; rateMin?: number; rateMax?: number }
) => void;

type UseBloomsOptions = {
  perf: PerfLimits;
  perfTier: 'low' | 'mid' | 'high';
  isMobile: boolean;
  flowerSources: string[];
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  popRef: RefObject<HTMLAudioElement>;
  addRipple: (x: number, y: number) => void;
  addShootingStar: () => void;
  addLantern: () => void;
  playSfx: PlaySfx;
  showToast: (message: string) => void;
  triggerSwirlBurst: (x: number, y: number) => void;
};

const LAYER_SIZE_BANDS = [
  { min: 180, max: 280 },
  { min: 140, max: 230 },
  { min: 110, max: 190 },
  { min: 90, max: 160 },
  { min: 70, max: 130 },
  { min: 55, max: 110 },
  { min: 45, max: 90 },
  { min: 35, max: 75 }
];

export function useBlooms({
  perf,
  perfTier,
  isMobile,
  flowerSources,
  pointerX,
  pointerY,
  popRef,
  addRipple,
  addShootingStar,
  addLantern,
  playSfx,
  showToast,
  triggerSwirlBurst
}: UseBloomsOptions) {
  const [blooms, setBlooms] = useState<Bloom[]>([]);
  const [totalBlooms, setTotalBlooms] = useState(0);
  const [currentLayer, setCurrentLayer] = useState(1);
  const plantTimesRef = useRef<number[]>([]);
  const swirlCooldownUntilRef = useRef(0);

  const plantAt = useCallback(
    (seedX: number, seedY: number, rect: DOMRect) => {
      pointerX.set(seedX);
      pointerY.set(seedY);
      addRipple(seedX, seedY);

      const maxSpawn = perf.maxSpawn;
      const newBlooms: Bloom[] = [];
      const maxLayers = perf.maxLayers;
      const minGap = 4;
      const spawnRadius = Math.min(rect.width, rect.height) * 0.22;
      const getSizeBand = (layer: number) => {
        const base = LAYER_SIZE_BANDS[Math.min(layer - 1, LAYER_SIZE_BANDS.length - 1)];
        if (layer <= LAYER_SIZE_BANDS.length) return base;
        const extra = layer - LAYER_SIZE_BANDS.length;
        const scale = Math.max(0.45, 1 - extra * 0.1);
        return {
          min: Math.max(20, base.min * scale),
          max: Math.max(40, base.max * scale)
        };
      };
      const clamp = (value: number, min: number, max: number) =>
        Math.min(max, Math.max(min, value));
      const getSpawnPoint = (size: number) => {
        const halfSize = size / 2;
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * spawnRadius;
        const x = clamp(seedX + Math.cos(angle) * radius, halfSize, rect.width - halfSize);
        const y = clamp(seedY + Math.sin(angle) * radius, halfSize, rect.height - halfSize);
        return { x, y, halfSize };
      };

      const tryLayer = (layer: number) => {
        const placed: Bloom[] = [];
        let attempts = 0;
        const sizeBand = getSizeBand(layer);
        const gap = Math.max(minGap, 30 - (layer - 1) * 3);
        const layerBlooms = blooms.filter((bloom) => bloom.layer === layer);

        const attemptLimit = isMobile ? maxSpawn * 120 : maxSpawn * 200;
        while (placed.length < maxSpawn && attempts < attemptLimit) {
          attempts += 1;
          const size = sizeBand.min + Math.random() * (sizeBand.max - sizeBand.min);
          const { x, y } = getSpawnPoint(size);

          const tooClose = [...layerBlooms, ...placed].some((bloom) => {
            const dx = bloom.x - x;
            const dy = bloom.y - y;
            const minDistance = (bloom.size + size) / 2 + gap;
            return dx * dx + dy * dy < minDistance * minDistance;
          });
          if (tooClose) continue;

          const rotation = -12 + Math.random() * 24;
          const swayDelay = Math.random() * 1.5;
          const src = flowerSources[Math.floor(Math.random() * flowerSources.length)];

          placed.push({
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            x,
            y,
            size,
            src,
            rotation,
            swayDelay,
            layer
          });
        }

        return placed;
      };

      if (currentLayer > maxLayers) {
        showToast('Garden is full!');
        return;
      }

      let targetLayer = currentLayer;
      let guard = 0;
      while (newBlooms.length === 0 && targetLayer <= maxLayers && guard < 6) {
        newBlooms.push(...tryLayer(targetLayer));
        if (newBlooms.length === 0) {
          targetLayer += 1;
        }
        guard += 1;
      }

      if (newBlooms.length === 0) return;
      if (targetLayer !== currentLayer) {
        setCurrentLayer(targetLayer);
      }

      const nextCount = totalBlooms + newBlooms.length;
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      playSfx(popRef, {
        volume: 0.14 + Math.random() * 0.08,
        rateMin: 0.94,
        rateMax: 1.06
      });
      setBlooms((prev) => [...prev, ...newBlooms].slice(-perf.maxBlooms));
      setTotalBlooms((prev) => prev + newBlooms.length);

      const now = performance.now();
      plantTimesRef.current = plantTimesRef.current.filter((time) => now - time <= 2000);
      plantTimesRef.current.push(now);
      if (plantTimesRef.current.length >= 5 && now > swirlCooldownUntilRef.current) {
        triggerSwirlBurst(seedX, seedY);
        swirlCooldownUntilRef.current = now + 1500;
        plantTimesRef.current = [];
      }

      if (nextCount % 7 === 0) {
        addShootingStar();
      }
      if (perfTier !== 'low') {
        for (let count = totalBlooms + 1; count <= nextCount; count += 1) {
          if (count % 10 === 0) {
            addLantern();
          }
        }
      }
    },
    [
      addLantern,
      addRipple,
      addShootingStar,
      blooms,
      currentLayer,
      flowerSources,
      isMobile,
      perf.maxBlooms,
      perf.maxLayers,
      perf.maxSpawn,
      perfTier,
      playSfx,
      pointerX,
      pointerY,
      popRef,
      showToast,
      totalBlooms,
      triggerSwirlBurst
    ]
  );

  const resetBlooms = useCallback((initialTotal = 0) => {
    setBlooms([]);
    setTotalBlooms(Math.max(0, Math.floor(initialTotal)));
    setCurrentLayer(1);
    plantTimesRef.current = [];
    swirlCooldownUntilRef.current = 0;
  }, []);

  return { blooms, totalBlooms, plantAt, resetBlooms };
}
