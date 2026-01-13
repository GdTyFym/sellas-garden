'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type IntroBurst = {
  id: string;
  x: number;
  y: number;
};

type IntroSpark = {
  id: string;
  x: number;
  y: number;
  size: number;
  driftX: number;
  driftY: number;
  delay: number;
  color: string;
};

type IntroPetal = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  driftX: number;
  driftY: number;
  rotation: number;
  delay: number;
  color: string;
};

type IntroFirework = {
  id: string;
  x: number;
  y: number;
  delay: number;
};

type IntroBloom = {
  id: string;
  x: number;
  y: number;
  size: number;
  src: string;
  rotation: number;
  delay: number;
};

type IntroSequenceOptions = {
  perfTier: 'low' | 'mid' | 'high';
  viewport: { width: number; height: number };
  flowerSources: string[];
  introBloomSources: string[];
  primeAudio: () => void;
  startBgm: () => void;
};

export function useIntroSequence({
  perfTier,
  viewport,
  flowerSources,
  introBloomSources,
  primeAudio,
  startBgm
}: IntroSequenceOptions) {
  const [introVisible, setIntroVisible] = useState(false);
  const [introAnimating, setIntroAnimating] = useState(false);
  const [introBurst, setIntroBurst] = useState<IntroBurst | null>(null);
  const [introSparks, setIntroSparks] = useState<IntroSpark[]>([]);
  const [introPetals, setIntroPetals] = useState<IntroPetal[]>([]);
  const [introFlash, setIntroFlash] = useState(false);
  const [introFireworks, setIntroFireworks] = useState<IntroFirework[]>([]);
  const [introBlooms, setIntroBlooms] = useState<IntroBloom[]>([]);
  const introTimeoutRef = useRef<number | null>(null);
  const introCleanupRef = useRef<number | null>(null);

  const handleEnterGarden = useCallback(
    (event?: { clientX: number; clientY: number }) => {
      if (introAnimating) return;
      primeAudio();
      startBgm();
      const x = event?.clientX ?? viewport.width / 2;
      const y = event?.clientY ?? viewport.height / 2;
      setIntroAnimating(true);
      setIntroFlash(true);
      setIntroBurst({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        x,
        y
      });
      const sparklePalette = [
        'rgba(216,181,107,0.9)',
        'rgba(246,233,208,0.9)',
        'rgba(182,232,208,0.75)'
      ];
      const petalPalette = ['rgba(216,181,107,0.9)', 'rgba(246,233,208,0.85)'];
      const sparkCount = perfTier === 'high' ? 14 : perfTier === 'mid' ? 8 : 5;
      const nextSparks = Array.from({ length: sparkCount }).map((_, index) => {
        const angle = (Math.PI * 2 * index) / sparkCount + Math.random() * 0.35;
        const radius = 110 + Math.random() * 90;
        const size = 6 + Math.random() * 10;
        return {
          id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
          x,
          y,
          size,
          driftX: Math.cos(angle) * radius,
          driftY: Math.sin(angle) * radius,
          delay: Math.random() * 0.12,
          color: sparklePalette[Math.floor(Math.random() * sparklePalette.length)]
        };
      });
      const petalCount = perfTier === 'high' ? 6 : perfTier === 'mid' ? 4 : 3;
      const nextPetals = Array.from({ length: petalCount }).map((_, index) => {
        const angle = (Math.PI * 2 * index) / petalCount + Math.random() * 0.3;
        const radius = 80 + Math.random() * 70;
        return {
          id: `${Date.now()}-petal-${index}-${Math.random().toString(16).slice(2)}`,
          x,
          y,
          width: 26 + Math.random() * 22,
          height: 10 + Math.random() * 8,
          driftX: Math.cos(angle) * radius,
          driftY: Math.sin(angle) * radius - 20,
          rotation: Math.random() * 120,
          delay: Math.random() * 0.08,
          color: petalPalette[Math.floor(Math.random() * petalPalette.length)]
        };
      });
      const width = viewport.width || window.innerWidth || 800;
      const height = viewport.height || window.innerHeight || 600;
      const margin = Math.max(40, Math.min(width, height) * 0.06);
      const fireworkCount = perfTier === 'high' ? 12 : perfTier === 'mid' ? 6 : 4;
      const nextFireworks = Array.from({ length: fireworkCount }).map((_, index) => {
        const edge = index % 4;
        let fx = 0;
        let fy = 0;
        if (edge === 0) {
          fx = Math.random() * width;
          fy = margin * 0.6 + Math.random() * margin;
        } else if (edge === 1) {
          fx = width - margin * 0.6 - Math.random() * margin;
          fy = Math.random() * height;
        } else if (edge === 2) {
          fx = Math.random() * width;
          fy = height - margin * 0.6 - Math.random() * margin;
        } else {
          fx = margin * 0.6 + Math.random() * margin;
          fy = Math.random() * height;
        }
        return {
          id: `${Date.now()}-fw-${index}-${Math.random().toString(16).slice(2)}`,
          x: fx,
          y: fy,
          delay: 0.08 + index * 0.06
        };
      });
      setIntroSparks(nextSparks);
      setIntroPetals(nextPetals);
      setIntroFireworks(nextFireworks);
      const centerX = width / 2;
      const centerY = height / 2;
      const baseSize = Math.max(140, Math.min(240, Math.min(width, height) * 0.22));
      const ringRadii = [baseSize * 0.72, baseSize * 1.12];
      const ringSizes = [baseSize * 0.45, baseSize * 0.34];
      const pickSource = () =>
        flowerSources[Math.floor(Math.random() * flowerSources.length)];
      const curatedSources = introBloomSources.length ? introBloomSources : flowerSources;
      const centerSource = curatedSources[0] ?? pickSource();
      const ringSources = curatedSources.slice(1);
      const ringCounts = [3, 5];
      const ringSourcePool = ringSources.length ? ringSources : [pickSource()];
      let ringIndex = 0;
      const nextIntroBlooms: IntroBloom[] = [
        {
          id: `${Date.now()}-intro-center`,
          x: centerX,
          y: centerY,
          size: baseSize,
          src: centerSource,
          rotation: Math.random() * 12 - 6,
          delay: 0.05
        }
      ];
      ringCounts.forEach((count, ringLevel) => {
        const radius = ringRadii[ringLevel] ?? baseSize;
        const sizeBase = ringSizes[ringLevel] ?? baseSize * 0.32;
        const offset = ringLevel === 1 ? Math.PI / count : 0;
        for (let i = 0; i < count; i += 1) {
          const angle = (Math.PI * 2 * i) / count - Math.PI / 2 + offset;
          const ringSource = ringSourcePool[ringIndex % ringSourcePool.length] ?? pickSource();
          nextIntroBlooms.push({
            id: `${Date.now()}-intro-ring-${ringLevel}-${i}-${Math.random()
              .toString(16)
              .slice(2)}`,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            size: sizeBase * (0.9 + Math.random() * 0.25),
            src: ringSource,
            rotation: Math.random() * 18 - 9,
            delay: 0.15 + ringIndex * 0.08
          });
          ringIndex += 1;
        }
      });
      setIntroBlooms(nextIntroBlooms);
      if (introTimeoutRef.current) {
        window.clearTimeout(introTimeoutRef.current);
      }
      if (introCleanupRef.current) {
        window.clearTimeout(introCleanupRef.current);
      }
      introTimeoutRef.current = window.setTimeout(() => {
        setIntroVisible(false);
      }, 3800);
      introCleanupRef.current = window.setTimeout(() => {
        setIntroBurst(null);
        setIntroSparks([]);
        setIntroPetals([]);
        setIntroFireworks([]);
        setIntroBlooms([]);
        setIntroAnimating(false);
        setIntroFlash(false);
      }, 4700);
    },
    [
      flowerSources,
      introAnimating,
      introBloomSources,
      perfTier,
      primeAudio,
      startBgm,
      viewport.height,
      viewport.width
    ]
  );

  useEffect(() => {
    return () => {
      if (introTimeoutRef.current) {
        window.clearTimeout(introTimeoutRef.current);
      }
      if (introCleanupRef.current) {
        window.clearTimeout(introCleanupRef.current);
      }
    };
  }, []);

  return {
    introVisible,
    setIntroVisible,
    introAnimating,
    introBurst,
    introSparks,
    introPetals,
    introFlash,
    introFireworks,
    introBlooms,
    handleEnterGarden
  };
}
