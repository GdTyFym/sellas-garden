import { useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject, RefObject } from 'react';
import type { MotionValue } from 'framer-motion';

type PerfTier = 'low' | 'mid' | 'high';

type PerfConfig = {
  maxBlooms: number;
  maxLayers: number;
  maxSpawn: number;
  maxSparkles: number;
  maxRipples: number;
  maxStars: number;
  maxAuras: number;
  maxPetals: number;
  maxLanterns: number;
  sparkleInterval: number;
};

type UseGardenPerfParams = {
  reducedMotion: boolean;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  containerRef: RefObject<HTMLDivElement | null>;
  boundsRef: MutableRefObject<DOMRect | null>;
};

const BASE_MAX_BLOOMS = 72;
const BASE_MAX_LAYERS = 12;
const BASE_MAX_SPAWN = 4;
const BASE_MAX_SPARKLES = 24;
const BASE_MAX_RIPPLES = 6;
const BASE_MAX_STARS = 2;
const BASE_SPARKLE_INTERVAL = 130;

export function useGardenPerf({
  reducedMotion,
  pointerX,
  pointerY,
  containerRef,
  boundsRef
}: UseGardenPerfParams) {
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [perfTier, setPerfTier] = useState<PerfTier>('low');
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const manualPerfRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewport({ width, height });
      pointerX.set(width / 2);
      pointerY.set(height / 2);
      boundsRef.current = containerRef.current?.getBoundingClientRect() ?? null;
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, [boundsRef, containerRef, pointerX, pointerY]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const coarse = window.matchMedia('(pointer: coarse)');
    const updatePointer = () => setCoarsePointer(coarse.matches);
    updatePointer();
    if (typeof coarse.addEventListener === 'function') {
      coarse.addEventListener('change', updatePointer);
      return () => coarse.removeEventListener('change', updatePointer);
    }
    const legacyCoarse = coarse as MediaQueryList & {
      addListener: (listener: () => void) => void;
      removeListener: (listener: () => void) => void;
    };
    legacyCoarse.addListener(updatePointer);
    return () => legacyCoarse.removeListener(updatePointer);
  }, []);

  useEffect(() => {
    if (manualPerfRef.current) return;
    if (typeof navigator === 'undefined') return;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const cores = navigator.hardwareConcurrency ?? 4;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection?.saveData;
    const isMobileDevice = coarsePointer || (viewport.width > 0 && viewport.width < 768);
    let nextTier: PerfTier = 'high';
    if (reducedMotion || saveData || memory <= 2 || cores <= 4 || (isMobileDevice && memory <= 6)) {
      nextTier = 'low';
    } else if (memory <= 6 || cores <= 8 || isMobileDevice) {
      nextTier = 'mid';
    }
    setPerfTier(nextTier);
  }, [coarsePointer, reducedMotion, viewport.width]);

  const isMobile = coarsePointer || (viewport.width > 0 && viewport.width < 768);
  const perfScale = (perfTier === 'low' ? 0.45 : perfTier === 'mid' ? 0.65 : 1) * (isMobile ? 0.8 : 1);

  const basePerf: PerfConfig = useMemo(
    () => ({
      maxBlooms: Math.max(18, Math.round(BASE_MAX_BLOOMS * perfScale)),
      maxLayers: Math.max(8, Math.round(BASE_MAX_LAYERS * perfScale)),
      maxSpawn: Math.max(2, Math.round(BASE_MAX_SPAWN * perfScale)),
      maxSparkles: Math.max(8, Math.round(BASE_MAX_SPARKLES * perfScale)),
      maxRipples: Math.max(3, Math.round(BASE_MAX_RIPPLES * perfScale)),
      maxStars: Math.max(1, Math.round(BASE_MAX_STARS * perfScale)),
      maxAuras: Math.max(2, Math.round(4 * perfScale)),
      maxPetals: Math.max(10, Math.round(18 * perfScale)),
      maxLanterns: Math.max(2, Math.round(5 * perfScale)),
      sparkleInterval:
        perfTier === 'low'
          ? BASE_SPARKLE_INTERVAL * 2
          : perfTier === 'mid'
            ? BASE_SPARKLE_INTERVAL * 1.6
            : BASE_SPARKLE_INTERVAL
    }),
    [perfScale, perfTier]
  );

  const tierPerf: PerfConfig = useMemo(() => {
    if (perfTier !== 'low') return basePerf;
    return {
      ...basePerf,
      maxBlooms: Math.min(basePerf.maxBlooms, 24),
      maxPetals: Math.min(basePerf.maxPetals, 8),
      maxSparkles: Math.min(basePerf.maxSparkles, 10),
      maxRipples: Math.min(basePerf.maxRipples, 4),
      maxStars: Math.min(basePerf.maxStars, 1),
      maxAuras: Math.min(basePerf.maxAuras, 2),
      maxLanterns: Math.min(basePerf.maxLanterns, 2),
      maxSpawn: Math.min(basePerf.maxSpawn, 2),
      sparkleInterval: Math.max(basePerf.sparkleInterval, BASE_SPARKLE_INTERVAL * 2)
    };
  }, [basePerf, perfTier]);

  const perf: PerfConfig = useMemo(() => {
    if (!isMobile) return tierPerf;
    return {
      ...tierPerf,
      maxBlooms: Math.min(tierPerf.maxBlooms, 36),
      maxPetals: Math.min(tierPerf.maxPetals, 8),
      maxSparkles: Math.min(tierPerf.maxSparkles, 10),
      maxRipples: Math.min(tierPerf.maxRipples, 4),
      maxStars: Math.min(tierPerf.maxStars, 1),
      sparkleInterval: tierPerf.sparkleInterval * 1.2
    };
  }, [isMobile, tierPerf]);

  const allowHighMotion = !isMobile;
  const sparklesEnabled = !coarsePointer && !reducedMotion && perfTier === 'high' && allowHighMotion;
  const showBaseAtmosphere = !reducedMotion && perfTier !== 'low';
  const showAnimatedAtmosphere = !reducedMotion && perfTier === 'high' && allowHighMotion;
  const showFineDetail = showAnimatedAtmosphere && !coarsePointer;
  const showSpotlight = !reducedMotion && perfTier === 'high' && allowHighMotion;
  const shouldTrackPointer = sparklesEnabled || showSpotlight;
  const showBlessing = !reducedMotion && perfTier !== 'low';
  const showMoonbeam = showFineDetail;
  const showRevealBloom = !reducedMotion && perfTier !== 'low';
  const showRevealSheen = !reducedMotion && perfTier === 'high' && allowHighMotion;
  const showRevealCurtain = !reducedMotion && perfTier !== 'low' && allowHighMotion;
  const showRevealEmbers = !reducedMotion && perfTier === 'high' && allowHighMotion;
  const showRevealDust = !reducedMotion && perfTier !== 'low' && allowHighMotion;
  const showIntroDust = perfTier === 'high' && !reducedMotion && allowHighMotion;
  const showIntroConstellation = perfTier === 'high' && !reducedMotion && allowHighMotion;
  const showIntroBloomDetail = perfTier === 'high' && !reducedMotion && allowHighMotion;
  const showIntroPatternMotion = perfTier === 'high' && !reducedMotion && allowHighMotion;
  const showIntroOuterRing = perfTier === 'high' && allowHighMotion;
  const showFinaleMotion = !reducedMotion && perfTier !== 'low' && allowHighMotion;
  const showFinaleGlints = !reducedMotion;
  const showFinaleRibbons = showFinaleMotion && perfTier === 'high' && allowHighMotion;
  const showFinaleVeil = showFinaleMotion;
  const showFireflies = perfTier === 'high' && !reducedMotion;
  const flowerMotionLevel: 'low' | 'high' =
    perfTier === 'high' && !reducedMotion ? 'high' : 'low';
  const introRayCount = perfTier === 'high' ? 10 : perfTier === 'mid' ? 6 : 4;

  const setManualPerf = (tier: PerfTier) => {
    manualPerfRef.current = true;
    setPerfTier(tier);
  };

  return {
    coarsePointer,
    viewport,
    perfTier,
    setPerfTier,
    setManualPerf,
    isMobile,
    perf,
    allowHighMotion,
    sparklesEnabled,
    showBaseAtmosphere,
    showAnimatedAtmosphere,
    showFineDetail,
    showSpotlight,
    shouldTrackPointer,
    showBlessing,
    showMoonbeam,
    showRevealBloom,
    showRevealSheen,
    showRevealCurtain,
    showRevealEmbers,
    showRevealDust,
    showIntroDust,
    showIntroConstellation,
    showIntroBloomDetail,
    showIntroPatternMotion,
    showIntroOuterRing,
    showFinaleMotion,
    showFinaleGlints,
    showFinaleRibbons,
    showFinaleVeil,
    showFireflies,
    flowerMotionLevel,
    introRayCount
  };
}
