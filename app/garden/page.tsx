'use client';

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform
} from 'framer-motion';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Fireflies from '@/components/Fireflies';
import Flower from '@/components/Flower';
import GardenSurface from '@/components/GardenSurface';
import HudOverlay from '@/components/HudOverlay';
import IntroGate from '@/components/IntroGate';
import MothFollower from '@/components/MothFollower';
import StartSettingsOverlay from '@/components/StartSettingsOverlay';
import {
  flowerBaseNames,
  getFlowerSrc,
  selectFlowerSize,
  usePreferredBgmSource,
  usePreferredFlowerFormat
} from '@/lib/garden/assetSources';
import { useGardenAudio } from '@/lib/garden/useGardenAudio';
import {
  giftDate,
  giftYear,
  letterText,
  recipientName,
  signatureText
} from '@/lib/garden/config';
import { useIntroSequence } from '@/lib/garden/useIntroSequence';
import { useGardenPerf } from '@/lib/garden/useGardenPerf';
import { useTimedList } from '@/lib/garden/useTimedList';
import { loadWish, saveWish } from '@/lib/garden/wishStorage';
import { useBlooms } from '@/lib/garden/useBlooms';
import { useFinale } from '@/lib/garden/useFinale';
import { useScavengerHunt } from '@/lib/useScavengerHunt';
import { useBouquetBuilder } from '@/lib/bouquet/useBouquetBuilder';
import type { Wish } from '@/lib/garden/wishStorage';
import type {
  Aura,
  GlowOrb,
  Lantern,
  PatternBloom,
  Petal,
  Ripple,
  ShootingStar,
  Sparkle,
  Timed
} from '@/lib/garden/types';

const GardenCanvasOverlay = dynamic(() => import('@/components/GardenCanvasOverlay'), {
  ssr: false
});
const WishRitualModal = dynamic(() => import('@/components/WishRitualModal'), {
  ssr: false
});
const FinaleSequence = dynamic(() => import('@/components/FinaleSequence'), {
  ssr: false
});
const LetterModal = dynamic(() => import('@/components/LetterModal'), {
  ssr: false
});
const BouquetBuilderModal = dynamic(() => import('@/components/BouquetBuilderModal'), {
  ssr: false
});

type VowChip = {
  id: string;
  text: string;
  x: string;
  y: string;
  delay: number;
};

type Milestone = {
  id: string;
  count: number;
  title: string;
  message: string;
};

type ParticleLayerProps = {
  ripples: Timed<Ripple>[];
  sparkles: Timed<Sparkle>[];
  petals: Timed<Petal>[];
  auras: Timed<Aura>[];
  lanterns: Timed<Lantern>[];
  shootingStars: Timed<ShootingStar>[];
  viewportHeight: number;
  elevated: boolean;
};

const ParticleLayer = memo(function ParticleLayer({
  ripples,
  sparkles,
  petals,
  auras,
  lanterns,
  shootingStars,
  viewportHeight,
  elevated
}: ParticleLayerProps) {
  const now = typeof performance === 'undefined' ? 0 : performance.now();
  const zBase = elevated ? 60 : 7;
  return (
    <>
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="pointer-events-none absolute rounded-full border border-white/30 ripple-ring"
            style={
              {
                '--x': `${ripple.x}px`,
                '--y': `${ripple.y}px`,
                '--size': `${ripple.size}px`,
                zIndex: zBase
              } as React.CSSProperties
            }
            initial={{ opacity: 0.5, scale: 0.25 }}
            animate={{ opacity: 0, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <motion.span
            key={sparkle.id}
            className="pointer-events-none absolute rounded-full sparkle-dot"
            style={
              {
                '--x': `${sparkle.x}px`,
                '--y': `${sparkle.y}px`,
                '--size': `${sparkle.size}px`,
                '--color': sparkle.color,
                zIndex: zBase + 1
              } as React.CSSProperties
            }
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.8] }}
            exit={{ opacity: 0 }}
            transition={{ duration: sparkle.duration, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {petals.map((petal) => (
          <motion.span
            key={petal.id}
            className="pointer-events-none absolute petal-chip"
            style={
              {
                '--x': `${petal.x}px`,
                '--y': `${petal.y}px`,
                '--width': `${petal.size * 1.6}px`,
                '--height': `${petal.size}px`,
                '--color': petal.color,
                zIndex: zBase + 2
              } as React.CSSProperties
            }
            initial={{ opacity: 0, scale: 0.4, rotate: petal.rotation }}
            animate={{
              opacity: [0, 0.9, 0],
              x: petal.driftX,
              y: petal.driftY,
              rotate: petal.rotation + 90,
              scale: [0.6, 1, 0.8]
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: petal.duration,
              ease: 'easeOut',
              delay: petal.delay
            }}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {auras.map((aura) => (
          <motion.span
            key={aura.id}
            className="pointer-events-none absolute rounded-full aura-glow"
            style={
              {
                '--x': `${aura.x}px`,
                '--y': `${aura.y}px`,
                '--size': `${aura.size}px`,
                zIndex: zBase + 1
              } as React.CSSProperties
            }
            initial={{ opacity: 0.5, scale: 0.2 }}
            animate={{ opacity: 0, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {lanterns.map((lantern) => (
          <motion.div
            key={lantern.id}
            className="pointer-events-none absolute bottom-0 -translate-x-1/2 lantern-float"
            style={{ '--x': `${lantern.x}%`, zIndex: zBase + 2 } as React.CSSProperties}
            initial={{ opacity: 0, y: 20, scale: 0.6 }}
            animate={{
              opacity: [0, 0.9, 0],
              y: -(viewportHeight ? viewportHeight * 0.9 : 600),
              x: lantern.drift,
              scale: [0.7, 1, 0.8]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: lantern.duration, ease: 'easeOut' }}
          >
            {(() => {
              const isLit = Boolean(lantern.litUntil && lantern.litUntil > now);
              const bodyOpacity = isLit ? 0.95 : 0.45;
              const glowShadow = isLit
                ? '0 0 28px rgba(216,181,107,0.75)'
                : '0 0 12px rgba(216,181,107,0.25)';
              return (
                <div
                  className="relative h-16 w-12"
                  style={{ opacity: bodyOpacity, filter: `brightness(${isLit ? 1.1 : 0.75})` }}
                >
                  <div
                    className="absolute inset-0 rounded-b-2xl rounded-t-lg bg-[linear-gradient(180deg,_rgba(216,181,107,0.9),_rgba(185,138,71,0.9))]"
                    style={{ boxShadow: glowShadow }}
                  />
                  <div
                    className="absolute inset-x-1 top-1 h-6 rounded-full bg-[radial-gradient(circle,_rgba(247,242,232,0.9),_rgba(216,181,107,0.35)_60%,_transparent_70%)]"
                    style={{ opacity: isLit ? 0.9 : 0.35 }}
                  />
                </div>
              );
            })()}
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {shootingStars.map((star) => (
          <motion.span
            key={star.id}
            className="pointer-events-none absolute h-[2px] rounded-full shooting-star"
            style={
              {
                '--x': `${star.x}%`,
                '--y': `${star.y}%`,
                '--length': `${star.length}px`,
                rotate: `${star.angle}deg`,
                zIndex: zBase + 1
              } as React.CSSProperties
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0], x: star.travelX, y: star.travelY }}
            exit={{ opacity: 0 }}
            transition={{ duration: star.duration, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </>
  );
});

const baseAudioSources = {
  bgm: '/audio/bgm.mp3',
  pop: '/audio/pop.mp3',
  sparkle: '/audio/sparkle.mp3',
  paper: '/audio/paper.mp3',
  finale: '/audio/finale.mp3',
  voice: '/audio/voice-v2.mp3'
} as const;
const BGM_BASE_VOLUME = 0.45;
const BGM_DUCK_VOLUME = BGM_BASE_VOLUME * 0.2;
const scavengerCharmPosition = { x: '72%', y: '32%' };
const clampBrightness = (value: number) => Math.min(1.3, Math.max(0.7, value));
const PURE_GARDEN_START_BLOOMS = 18;
const PURE_GARDEN_MAX_BLOOMS = 54;

export default function Home() {
  const [adminPeekOpen, setAdminPeekOpen] = useState(false);
  const [adminPeekWish, setAdminPeekWish] = useState<Wish | null>(null);
  const [letterOpen, setLetterOpen] = useState(false);
  const [postLetterMode, setPostLetterMode] = useState(false);
  const [pureGardenMode, setPureGardenMode] = useState(false);
  const [pureMenuOpen, setPureMenuOpen] = useState(false);
  const [displayedLetter, setDisplayedLetter] = useState('');
  const [isTypingLetter, setIsTypingLetter] = useState(false);
  const [gateComplete, setGateComplete] = useState(false);
  const [preflightDone, setPreflightDone] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(true);
  const [brightness, setBrightness] = useState(1);
  const [revealActive, setRevealActive] = useState(false);
  const [guideHidden, setGuideHidden] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null);
  const [completedMilestones, setCompletedMilestones] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [wishModalOpen, setWishModalOpen] = useState(false);
  const [wish, setWish] = useState<Wish | null>(null);
  const [finaleRunning, setFinaleRunning] = useState(false);
  const [litLanterns, setLitLanterns] = useState<Record<string, number>>({});
  const [canvasOpen, setCanvasOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const boundsRef = useRef<DOMRect | null>(null);
  const boundsStampRef = useRef(0);
  const lastSparkleAt = useRef(0);
  const lastTapAt = useRef(0);
  const holdTimeoutRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const typingActiveRef = useRef(false);
  const milestoneBurstedRef = useRef<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const charmToastShownRef = useRef(false);
  const charmButtonRef = useRef<HTMLButtonElement | null>(null);
  const hasAutoOpenedWishRef = useRef(false);
  const finaleChoiceTimersRef = useRef<number[]>([]);
  const litLanternTimeoutsRef = useRef<Record<string, number>>({});
  const lanternSpawnTimeoutRef = useRef<number | null>(null);
  const pointerStateRef = useRef({ x: 0, y: 0, active: false, lastMove: 0 });
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 90, damping: 30, mass: 0.85 });
  const smoothY = useSpring(pointerY, { stiffness: 90, damping: 30, mass: 0.85 });
  const reducedMotion = useReducedMotion() ?? false;
  const flowerFormat = usePreferredFlowerFormat();
  const bgmSource = usePreferredBgmSource();
  const {
    viewport,
    perfTier,
    setManualPerf,
    isMobile,
    perf,
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
  } = useGardenPerf({ reducedMotion, pointerX, pointerY, containerRef, boundsRef });
  const maxConcurrentSfx = perfTier === 'low' ? 2 : perfTier === 'mid' ? 3 : 5;
  const {
    refs: { bgmRef, popRef, sparkleRef, paperRef, finaleRef, voiceRef },
    state: { isMuted, setIsMuted, isVoicePlaying },
    actions: { primeAudio, startBgm, playSfx, toggleVoice }
  } = useGardenAudio({
    baseVolume: BGM_BASE_VOLUME,
    duckVolume: BGM_DUCK_VOLUME,
    maxConcurrentSfx
  });
  const dpr = useMemo(
    () => (typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 3)),
    []
  );
  const flowerSize = useMemo(
    () => selectFlowerSize({ perfTier, dpr }),
    [dpr, perfTier]
  );
  const audioSources = useMemo(
    () => ({ ...baseAudioSources, bgm: bgmSource }),
    [bgmSource]
  );
  const letterTypingDone = !isTypingLetter && displayedLetter.length >= letterText.length;
  const refreshBounds = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect() ?? null;
    boundsRef.current = rect;
    boundsStampRef.current = performance.now();
  }, [boundsRef, containerRef]);
  const { items: ripples, push: pushRipple } = useTimedList<Ripple>(perf.maxRipples);
  const { items: sparkles, push: pushSparkle } = useTimedList<Sparkle>(perf.maxSparkles);
  const { items: shootingStars, push: pushShootingStar } =
    useTimedList<ShootingStar>(perf.maxStars);
  const { items: auras, push: pushAura } = useTimedList<Aura>(perf.maxAuras);
  const { items: petals, pushMany: pushPetals } = useTimedList<Petal>(perf.maxPetals);
  const { items: lanterns, push: pushLantern } = useTimedList<Lantern>(perf.maxLanterns);
  const lanternsWithGlow = useMemo(
    () =>
      lanterns.map((lantern) => ({
        ...lantern,
        litUntil: litLanterns[lantern.id]
      })),
    [lanterns, litLanterns]
  );
  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToastMessage(null);
  }, []);
  const clearFinaleChoiceTimers = useCallback(() => {
    if (finaleChoiceTimersRef.current.length === 0) return;
    finaleChoiceTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    finaleChoiceTimersRef.current = [];
  }, []);
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 2400);
  }, []);

  const handleSetMuted = useCallback(
    (muted: boolean) => {
      setIsMuted(muted);
      if (typeof window !== 'undefined') {
        localStorage.setItem('garden_pref_muted', muted ? '1' : '0');
      }
    },
    [setIsMuted]
  );

  const handleSelectPerf = useCallback(
    (tier: 'low' | 'mid' | 'high') => {
      setManualPerf(tier);
      if (typeof window !== 'undefined') {
        localStorage.setItem('garden_pref_perf', tier);
      }
    },
    [setManualPerf]
  );

  const handleSetBrightness = useCallback((value: number) => {
    const next = clampBrightness(value);
    setBrightness(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('garden_pref_brightness', String(next));
    }
  }, []);

  const handleToggleRemember = useCallback((value: boolean) => {
    setRememberChoice(value);
  }, []);

  const handleResetDefaults = useCallback(() => {
    setIsMuted(false);
    setManualPerf('mid');
    setBrightness(1);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('garden_pref_muted');
      localStorage.removeItem('garden_pref_perf');
      localStorage.removeItem('garden_pref_brightness');
    }
  }, [setIsMuted, setManualPerf]);

  const handlePreflightContinue = useCallback(() => {
    setPreflightDone(true);
  }, []);

  const handleCloseLetter = useCallback(() => {
    setLetterOpen(false);
    if (!postLetterMode) {
      setPostLetterMode(true);
    }
  }, [postLetterMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedMuted = localStorage.getItem('garden_pref_muted');
    if (storedMuted === '1') {
      setIsMuted(true);
    } else if (storedMuted === '0') {
      setIsMuted(false);
    }
    const storedPerf = localStorage.getItem('garden_pref_perf');
    if (storedPerf === 'low' || storedPerf === 'mid' || storedPerf === 'high') {
      setManualPerf(storedPerf);
    }
    const storedBrightness = Number(localStorage.getItem('garden_pref_brightness'));
    if (!Number.isNaN(storedBrightness)) {
      setBrightness(clampBrightness(storedBrightness));
    }
  }, [setIsMuted, setManualPerf]);

  useEffect(() => {
    setWish(loadWish());
  }, []);

  useEffect(() => {
    if (adminPeekOpen) setAdminPeekWish(loadWish());
  }, [adminPeekOpen]);

  useEffect(() => {
    if (!postLetterMode || letterOpen) return;
    if (wish || hasAutoOpenedWishRef.current) return;
    setWishModalOpen(true);
    hasAutoOpenedWishRef.current = true;
  }, [letterOpen, postLetterMode, wish]);

  useEffect(() => {
    if (!postLetterMode) return;
    setPureGardenMode(false);
  }, [postLetterMode]);

  useEffect(() => {
    setLitLanterns((prev) => {
      const ids = new Set(lanterns.map((lantern) => lantern.id));
      let changed = false;
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        if (ids.has(id)) return;
        changed = true;
        delete next[id];
        const timeoutId = litLanternTimeoutsRef.current[id];
        if (timeoutId) {
          window.clearTimeout(timeoutId);
          delete litLanternTimeoutsRef.current[id];
        }
      });
      return changed ? next : prev;
    });
  }, [lanterns]);

  useEffect(() => {
    return () => {
      Object.values(litLanternTimeoutsRef.current).forEach((timeoutId) =>
        window.clearTimeout(timeoutId)
      );
      litLanternTimeoutsRef.current = {};
    };
  }, []);

  useEffect(() => {
    return () => {
      clearFinaleChoiceTimers();
    };
  }, [clearFinaleChoiceTimers]);
  const orbVariants = useMemo(
    () => ({
      idle: {
        opacity: 1,
        scale: 1,
        filter: 'brightness(1)',
        boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)'
      },
      imploding: {
        scale: [1, 0.985, 0.94],
        filter: ['brightness(1)', 'brightness(1.25)', 'brightness(1.85)'],
        boxShadow:
          '0 0 95px rgba(246, 233, 208, 0.6), 0 20px 46px rgba(0, 0, 0, 0.46)',
        transition: { duration: 1.9, ease: [0.22, 1, 0.36, 1], times: [0, 0.55, 1] }
      },
      finale: {
        scale: [0.94, 1.06, 1.28, 4.6, 16],
        opacity: [1, 1, 0.9, 0.35, 0],
        filter: [
          'brightness(1.9)',
          'brightness(2.1)',
          'brightness(1.7)',
          'brightness(1.25) blur(7px)',
          'blur(16px) brightness(1)'
        ],
        transition: { duration: 4.2, ease: [0.22, 1, 0.36, 1], times: [0, 0.2, 0.44, 0.78, 1] }
      }
    }),
    []
  );
  const flowerSources = useMemo(
    () => flowerBaseNames.map((name) => getFlowerSrc(name, flowerFormat, flowerSize)),
    [flowerFormat, flowerSize]
  );

  useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();

    // Buka/tutup admin peek: Ctrl + Shift + Alt + W
    if (e.ctrlKey && e.shiftKey && e.altKey && key === 'w') {
      e.preventDefault();
      setAdminPeekWish(loadWish());     // ambil terbaru dari localStorage
      setAdminPeekOpen((v) => !v);
      return;
    }

    // Tutup pakai ESC
    if (key === 'escape') {
      setAdminPeekOpen(false);
    }
  };

  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.Image) return;
    if (!preflightDone || !gateComplete) return;
    const preloadCount = isMobile ? 6 : 10;
    const timer = window.setTimeout(() => {
      flowerSources.slice(0, preloadCount).forEach((src) => {
        const img = new window.Image();
        img.decoding = 'async';
        img.src = src;
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [flowerSources, gateComplete, isMobile, preflightDone]);

  const patternBlooms = useMemo<PatternBloom[]>(() => {
    if (!postLetterMode) return [];
    const width = viewport.width || 1200;
    const height = viewport.height || 800;
    const tile = width < 640 ? 110 : width < 1024 ? 140 : 160;
    const columns = Math.max(5, Math.floor(width / tile));
    const rows = Math.max(6, Math.floor(height / tile));
    const xStep = 100 / columns;
    const yStep = 100 / rows;
    const baseSize = width < 640 ? 54 : width < 1024 ? 64 : 72;
    const blooms: PatternBloom[] = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const index = row * columns + col;
        const xBase = (col + 0.5) * xStep;
        const x = row % 2 === 1 ? (xBase + xStep / 2) % 100 : xBase;
        const y = (row + 0.5) * yStep;
        const src = flowerSources[index % flowerSources.length];
        blooms.push({
          id: `pattern-${row}-${col}`,
          x,
          y,
          size: baseSize,
          src,
          rotation: 0,
          opacity: 0.88
        });
      }
    }

    return blooms;
  }, [flowerSources, postLetterMode, viewport.height, viewport.width]);

  const introBloomSources = useMemo(() => {
    const bases =
      perfTier === 'low'
        ? [
            'flower-11',
            'flower-27',
            'flower-24',
            'flower-19',
            'flower-2',
            'flower-16',
            'flower-28',
            'flower-15',
            'flower-20'
          ]
        : perfTier === 'mid'
          ? [
              'flower-10',
              'flower-25',
              'flower-19',
              'flower-3',
              'flower-24',
              'flower-16',
              'flower-15',
              'flower-2',
              'flower-27'
            ]
          : [
              'flower-1',
              'flower-10',
              'flower-19',
              'flower-24',
              'flower-16',
              'flower-3',
              'flower-15',
              'flower-2',
              'flower-11'
            ];
    return bases.map((base) => getFlowerSrc(base, flowerFormat, flowerSize));
  }, [flowerFormat, flowerSize, perfTier]);

  const {
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
  } = useIntroSequence({
    perfTier,
    viewport,
    flowerSources,
    introBloomSources,
    primeAudio,
    startBgm
  });
  const handleGateComplete = useCallback(() => {
    setGateComplete(true);
    setIntroVisible(true);
  }, [setGateComplete, setIntroVisible]);

  const enableRevealBlur = !reducedMotion && perfTier !== 'low';
  const mainRevealVariants = useMemo(
    () => ({
      hidden: {
        opacity: 0,
        y: 26,
        scale: 0.98,
        filter: enableRevealBlur ? 'blur(12px)' : 'blur(0px)'
      },
      show: {
        opacity: 1,
        y: 0,
        scale: [1.02, 1],
        filter: 'blur(0px)'
      }
    }),
    [enableRevealBlur]
  );
  const mainRevealTransition = useMemo(
    () => ({
      duration: reducedMotion ? 0.7 : 1.7,
      ease: [0.22, 1, 0.36, 1],
      delay: introVisible ? 0 : 0.3
    }),
    [introVisible, reducedMotion]
  );
  const milestoneOpen = Boolean(activeMilestone);
  const interactionLocked =
    !preflightDone ||
    letterOpen ||
    introVisible ||
    milestoneOpen ||
    wishModalOpen ||
    finaleRunning ||
    canvasOpen ||
    pureMenuOpen ||
    adminPeekOpen ||
    !gateComplete;

  const glowOrbs = useMemo<GlowOrb[]>(
    () => [
      {
        id: 'amber',
        size: 340,
        x: '12%',
        y: '16%',
        color: 'rgba(216, 181, 107, 0.18)',
        duration: 26,
        delay: 0
      },
      {
        id: 'jade',
        size: 420,
        x: '62%',
        y: '8%',
        color: 'rgba(120, 160, 150, 0.12)',
        duration: 30,
        delay: 1.2
      },
      {
        id: 'mist',
        size: 360,
        x: '42%',
        y: '62%',
        color: 'rgba(90, 120, 110, 0.14)',
        duration: 28,
        delay: 0.6
      }
    ],
    []
  );

  const revealDust = useMemo(
    () => [
      { id: 'dust-1', x: '18%', y: '20%', size: 8, driftX: -40, driftY: 60, delay: 0.15 },
      { id: 'dust-2', x: '32%', y: '32%', size: 6, driftX: 20, driftY: 70, delay: 0.3 },
      { id: 'dust-3', x: '46%', y: '22%', size: 7, driftX: -10, driftY: 80, delay: 0.45 },
      { id: 'dust-4', x: '62%', y: '28%', size: 9, driftX: 30, driftY: 75, delay: 0.2 },
      { id: 'dust-5', x: '72%', y: '18%', size: 6, driftX: -24, driftY: 68, delay: 0.5 },
      { id: 'dust-6', x: '24%', y: '52%', size: 7, driftX: 18, driftY: 90, delay: 0.35 },
      { id: 'dust-7', x: '58%', y: '56%', size: 8, driftX: -28, driftY: 84, delay: 0.55 },
      { id: 'dust-8', x: '78%', y: '48%', size: 7, driftX: 26, driftY: 78, delay: 0.4 }
    ],
    []
  );

  const revealEmbers = useMemo(
    () => [
      { id: 'ember-1', x: '18%', y: '28%', delay: 0.1 },
      { id: 'ember-2', x: '72%', y: '22%', delay: 0.2 },
      { id: 'ember-3', x: '36%', y: '64%', delay: 0.35 },
      { id: 'ember-4', x: '78%', y: '58%', delay: 0.5 },
      { id: 'ember-5', x: '26%', y: '46%', delay: 0.65 },
      { id: 'ember-6', x: '60%', y: '38%', delay: 0.8 }
    ],
    []
  );

  const constellationPoints = useMemo(
    () => [
      { x: 20, y: 30 },
      { x: 35, y: 35 },
      { x: 45, y: 45 },
      { x: 30, y: 60 },
      { x: 50, y: 70 },
      { x: 70, y: 60 },
      { x: 80, y: 45 },
      { x: 75, y: 30 },
      { x: 60, y: 25 }
    ],
    []
  );

  const constellationPath = useMemo(
    () =>
      constellationPoints
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' '),
    [constellationPoints]
  );

  const milestones = useMemo<Milestone[]>(
    () => [
      {
        id: 'twenty',
        count: 20,
        title: 'Awal Bahagia',
        message: '20 bunga pertama! Anggap ini doa pembuka: Semoga di umur yang baru, hari-harimu selalu lebih cerah dan lebih berwarna dari taman ini. Semangat nanemnya, Cantik!'
      },
      {
        id: 'thirty',
        count: 30,
        title: 'Kekuatan Hati',
        message: 'Makin ramai nih. Di bunga ke-30, doaku tentang kekuatan. Semoga hatimu makin tangguh, nggak gampang patah kena angin, dan selalu percaya sama kemampuan diri sendiri. Kamu kuat, Sayang'
      },
      {
        id: 'forty',
        count: 40,
        title: 'Kita Berdua',
        message: 'Dikit lagi penuh. Inget ya, kamu nggak sendirian ngerawat taman kehidupanmu. Ada aku yang siap bantuin kapan aja. Kita hadapin seneng dan sedihnya bareng-bareng ya?'
      },
      {
        id: 'fifty',
        count: 50,
        title: 'Puncak Syukur',
        message: '50 BUNGA! Lihat kan? Kesabaranmu selalu berbuah indah. Happy Birthdayy My Cutiepiee. Terima kasih sudah tumbuh jadi wanita sehebat ini. I love you, now and always. '
      }
    ],
    []
  );

  const vowChips = useMemo<VowChip[]>(
    () => [
      { id: 'commission', text: 'komisi ulang tahun', x: '10%', y: '64%', delay: 0.3 },
      { id: 'wish', text: 'doa eksklusif', x: '70%', y: '24%', delay: 0.8 },
      { id: 'garden', text: 'taman rahasia', x: '20%', y: '30%', delay: 1.2 },
      { id: 'only', text: 'satu-satunya', x: '78%', y: '58%', delay: 1.6 }
    ],
    []
  );
  const finaleGlints = useMemo(() => {
    const count = perfTier === 'high' ? 14 : perfTier === 'mid' ? 10 : 6;
    return Array.from({ length: count }).map((_, index) => ({
      id: `finale-glint-${index}`,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 1.6,
      duration: 6 + Math.random() * 6,
      size: 4 + Math.random() * 8,
      drift: Math.random() * 160 - 80,
      opacity: 0.2 + Math.random() * 0.35
    }));
  }, [perfTier]);
  const finaleRibbons = useMemo(
    () => [
      {
        id: 'finale-ribbon-1',
        top: '-18%',
        rotate: -14,
        opacity: 0.2,
        height: '34%',
        duration: 18,
        delay: 0
      },
      {
        id: 'finale-ribbon-2',
        top: '18%',
        rotate: 10,
        opacity: 0.16,
        height: '28%',
        duration: 22,
        delay: 1.4
      },
      {
        id: 'finale-ribbon-3',
        top: '52%',
        rotate: -6,
        opacity: 0.14,
        height: '24%',
        duration: 20,
        delay: 0.8
      }
    ],
    []
  );
  const finaleFlares = useMemo(
    () => [
      { id: 'finale-flare-1', size: '42vmin', delay: 0.2, duration: 6 },
      { id: 'finale-flare-2', size: '58vmin', delay: 1.1, duration: 7.5 },
      { id: 'finale-flare-3', size: '32vmin', delay: 0.8, duration: 5.5 }
    ],
    []
  );

  useEffect(() => {
    const bgm = bgmRef.current;
    const voice = voiceRef.current;
    return () => {
      if (holdTimeoutRef.current) {
        window.clearTimeout(holdTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
      if (bgm) {
        bgm.pause();
      }
      if (voice) {
        voice.pause();
      }
    };
  }, [bgmRef, voiceRef]);

  useEffect(() => {
    const clearTypingTimer = () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
    if (!letterOpen) {
      clearTypingTimer();
      typingActiveRef.current = false;
      setDisplayedLetter('');
      setIsTypingLetter(false);
      return;
    }
    if (typingActiveRef.current) return;
    typingActiveRef.current = true;
    setDisplayedLetter('');
    setIsTypingLetter(true);
    let index = 0;
    clearTypingTimer();
    const tick = () => {
      index += 1;
      setDisplayedLetter((prev) => {
        const next = letterText.slice(0, index);
        return prev === next ? prev : next;
      });
      if (index >= letterText.length) {
        setIsTypingLetter(false);
        typingActiveRef.current = false;
        clearTypingTimer();
        return;
      }
      typingTimeoutRef.current = window.setTimeout(tick, 30);
    };
    typingTimeoutRef.current = window.setTimeout(tick, 30);
    return () => {
      clearTypingTimer();
      typingActiveRef.current = false;
    };
  }, [letterOpen]);

  useEffect(() => {
    if (!letterOpen) return;
    if (postLetterMode) return;
    playSfx(paperRef, { volume: 0.4, rateMin: 0.98, rateMax: 1.02 });
    if (navigator.vibrate) {
      navigator.vibrate(40);
    }
  }, [letterOpen, playSfx, postLetterMode, paperRef]);

  useEffect(() => {
    if (introVisible || reducedMotion) {
      setRevealActive(false);
      return;
    }
    setRevealActive(true);
    const timer = window.setTimeout(() => {
      setRevealActive(false);
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [introVisible, reducedMotion]);

  const closeMilestone = () => {
    if (!activeMilestone) return;
    const milestoneId = activeMilestone.id;
    setActiveMilestone(null);
    setCompletedMilestones((prev) =>
      prev.includes(milestoneId) ? prev : [...prev, milestoneId]
    );
    milestoneBurstedRef.current = null;
  };

  const introCardContent = (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-6 intro-card-glow" />
      <div className="relative intro-card">
        <div className="relative intro-card-inner intro-shutter">
          <div className="pointer-events-none absolute inset-0 intro-card-engrave" />
          <div className="pointer-events-none absolute inset-[10px] rounded-[22px] intro-card-engrave-soft" />
          <div className="pointer-events-none absolute inset-0 intro-envelope">
            <span className="intro-envelope-top" />
            <span className="intro-envelope-bottom" />
          </div>
          <div className="pointer-events-none absolute inset-0 intro-card-sheen" />
          <div className="relative z-[2] flex flex-col items-center gap-4 text-center">
            <div className="relative flex items-center justify-center">
              <span className="absolute -inset-3 intro-emblem-pulse" />
              <div className="relative flex h-16 w-16 items-center justify-center intro-emblem">
                <span className="absolute inset-0 intro-emblem-frame" />
                <span className="absolute inset-[2px] intro-emblem-rim" />
                <span className="absolute inset-[4px] intro-emblem-inset" />
                <span className="absolute inset-[7px] intro-emblem-lattice" />
                <span className="absolute inset-[9px] intro-emblem-core" />
                <span className="absolute inset-[10px] intro-emblem-vignette" />
                <span className="absolute inset-[11px] intro-emblem-core-bevel" />
                <span className="absolute inset-[5px] intro-emblem-noise" />
                <span className="absolute inset-0 intro-emblem-sheen" />
                <span className="absolute inset-0 intro-emblem-etched" />
                <span className="absolute inset-0 intro-emblem-glint" />
                <span className="absolute inset-[12px] intro-emblem-filigree" />
                <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 lux-gem" />
              </div>
            </div>
            <span className="lux-gem intro-crest" />
            <div className="intro-ornament">
              <span className="intro-ornament-line" />
              <span className="lux-gem intro-ornament-gem" />
              <span className="intro-ornament-line" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="intro-title text-[13px] uppercase tracking-[0.45em] font-display">
                {`${recipientName}'s Garden`}
              </p>
              <div className="flex items-center gap-3">
                <span className="h-px w-12 lux-hairline opacity-70" />
                <span className="intro-date text-[9px] uppercase tracking-[0.45em] font-display">
                  {giftDate.toUpperCase()}
                </span>
                <span className="h-px w-12 lux-hairline opacity-70" />
              </div>
            </div>
            <p className="intro-instruction text-[9px] uppercase tracking-[0.4em] text-white/55 font-display">
              Tekan tombol masuk.
            </p>
            <button
              type="button"
              className="intro-button relative rounded-full px-6 py-2 text-[10px] uppercase tracking-[0.45em] transition hover:text-white lux-button lux-sheen"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                handleEnterGarden(event);
              }}
            >
              Masuk
            </button>
            <p className="text-[8px] uppercase tracking-[0.45em] text-white/45 font-display">
              Suara: {isMuted ? 'Mati' : 'Nyala'} · Kualitas Visual:{' '}
              {perfTier === 'mid' ? 'Normal' : perfTier === 'low' ? 'Hemat' : 'Cinematic'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const addRipple = useCallback((x: number, y: number) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const size = 140 + Math.random() * 160;
    pushRipple({ id, x, y, size }, 1400);
  }, [pushRipple]);

  const addSparkle = useCallback((x: number, y: number, duration = 1) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const size = 6 + Math.random() * 10;
    const color = Math.random() > 0.5 ? 'rgba(216,181,107,0.9)' : 'rgba(182,232,208,0.8)';
    pushSparkle({ id, x, y, size, color, duration }, duration * 1000 + 200);
  }, [pushSparkle]);

  const addShootingStar = useCallback((duration = 1.4) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const length = 160 + Math.random() * 120;
    const x = 10 + Math.random() * 40;
    const y = 10 + Math.random() * 25;
    const angle = 18 + Math.random() * 12;
    const travelX = 260 + Math.random() * 160;
    const travelY = 120 + Math.random() * 80;
    pushShootingStar(
      { id, x, y, length, angle, travelX, travelY, duration },
      duration * 1000 + 200
    );
  }, [pushShootingStar]);

  const handleWishSubmit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const nextWish = { text: trimmed, createdAt: Date.now() };
      saveWish(nextWish);
      setWish(nextWish);
      setWishModalOpen(false);
      addShootingStar(2.2);
      playSfx(sparkleRef, { volume: 0.3, rateMin: 0.98, rateMax: 1.02 });
    },
    [addShootingStar, playSfx, sparkleRef]
  );

  const addAura = useCallback((x: number, y: number) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const size = 220 + Math.random() * 160;
    pushAura({ id, x, y, size }, 1800);
  }, [pushAura]);

  const addPetalBurst = useCallback((x: number, y: number, durationScale = 1) => {
    const count = perfTier === 'high' ? 12 : 8;
    const palette = ['rgba(216,181,107,0.9)', 'rgba(185,138,71,0.9)', 'rgba(182,232,208,0.8)'];
    const nextPetals = Array.from({ length: count }).map(() => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const angle = Math.random() * Math.PI * 2;
      const radius = 10 + Math.random() * 36;
      const size = 8 + Math.random() * 12;
      const drift = 40 + Math.random() * 60;
      const duration = (1.6 + Math.random() * 1.2) * durationScale;
      return {
        id,
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        size,
        rotation: Math.random() * 360,
        driftX: Math.cos(angle) * drift,
        driftY: Math.sin(angle) * drift - 30,
        duration,
        delay: Math.random() * 0.1,
        color: palette[Math.floor(Math.random() * palette.length)]
      };
    });

    pushPetals(
      nextPetals.map((petal) => ({
        item: petal,
        ttlMs: petal.duration * 1000 + 200
      }))
    );
  }, [perfTier, pushPetals]);

  const triggerSwirlBurst = useCallback(
    (x: number, y: number) => {
      const isLowPerf = reducedMotion || perfTier === 'low';
      const count = isLowPerf ? 14 : perfTier === 'high' ? 26 : 20;
      const palette = ['rgba(216,181,107,0.9)', 'rgba(185,138,71,0.9)', 'rgba(182,232,208,0.85)'];
      const baseRadius = isLowPerf ? 18 : 26;
      const radiusStep = isLowPerf ? 6 : 9;
      const driftBase = isLowPerf ? 42 : 64;
      const durationBase = isLowPerf ? 1.3 : 1.7;

      const petals = Array.from({ length: count }).map((_, index) => {
        const id = `${Date.now()}-swirl-${index}-${Math.random().toString(16).slice(2)}`;
        const angle = (Math.PI * 2 * index) / count + Math.random() * 0.35;
        const radius = baseRadius + radiusStep * (index / count);
        const size = 7 + Math.random() * (isLowPerf ? 8 : 12);
        const drift = driftBase + Math.random() * (isLowPerf ? 40 : 70);
        const swirl = angle + Math.PI * 0.6;
        const duration = durationBase + Math.random() * (isLowPerf ? 0.7 : 1.1);
        return {
          id,
          x: x + Math.cos(angle) * radius,
          y: y + Math.sin(angle) * radius,
          size,
          rotation: Math.random() * 360,
          driftX: Math.cos(swirl) * drift,
          driftY: Math.sin(swirl) * drift - (isLowPerf ? 10 : 18),
          duration,
          delay: Math.random() * 0.08,
          color: palette[Math.floor(Math.random() * palette.length)]
        };
      });

      pushPetals(
        petals.map((petal) => ({
          item: petal,
          ttlMs: petal.duration * 1000 + 200
        }))
      );
    },
    [perfTier, pushPetals, reducedMotion]
  );

  const addLantern = useCallback(() => {
    if (perfTier === 'low') return;
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const x = 10 + Math.random() * 80;
    const duration = 6 + Math.random() * 3;
    const drift = -30 + Math.random() * 60;
    pushLantern({ id, x, duration, drift }, duration * 1000 + 600);
  }, [perfTier, pushLantern]);

  const spawnDimLantern = useCallback(() => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const x = 8 + Math.random() * 84;
    const duration = perfTier === 'low' ? 7 + Math.random() * 4 : 6 + Math.random() * 3;
    const drift = -30 + Math.random() * 60;
    pushLantern({ id, x, duration, drift }, duration * 1000 + 600);
  }, [perfTier, pushLantern]);

  const bloomsPerf = useMemo(
    () => (pureGardenMode ? { ...perf, maxBlooms: PURE_GARDEN_MAX_BLOOMS } : perf),
    [perf, pureGardenMode]
  );
  const { blooms, totalBlooms, plantAt, resetBlooms } = useBlooms({
    perf: bloomsPerf,
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
  });

  const {
    state: scavengerState,
    showCharm: scavengerCharmVisible,
    markStarMade,
    markCharmFound,
    toggleCollapsed: toggleScavengerCollapsed
  } = useScavengerHunt({
    totalBlooms,
    onComplete: () => showToast('Bouquet unlocked')
  });
  const showScavengerCharm = scavengerCharmVisible && !interactionLocked;

  useEffect(() => {
    if (!showScavengerCharm || charmToastShownRef.current) return;
    showToast('Pesona tersembunyi muncul. Ketuk titik emasnya.');
    charmToastShownRef.current = true;
  }, [showScavengerCharm, showToast]);

  const {
    state: bouquetState,
    open: openBouquetBuilder,
    close: closeBouquetBuilder,
    setSize: setBouquetSize,
    setSlot: setBouquetSlot,
    setMessage: setBouquetMessage,
    setLayout: setBouquetLayout,
    randomize: randomizeBouquet,
    reset: resetBouquet
  } = useBouquetBuilder({ unlocked: scavengerState.completed });

  const { finaleTriggered, isImploding, triggerFinale } = useFinale({
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
  });

  useEffect(() => {
    setFinaleRunning(finaleTriggered || isImploding);
  }, [finaleTriggered, isImploding]);

  const wishGoal = 14;
  const letterGoal = 50;
  const letterBloomReady = totalBlooms >= letterGoal;
  const letterUnlocked = letterBloomReady && scavengerState.completed;
  const letterReadyRef = useRef(letterBloomReady);
  const scavengerCompleteRef = useRef(scavengerState.completed);
  const letterToastTimerRef = useRef<number | null>(null);
  const wishProgress = Math.min(1, totalBlooms / wishGoal);
  const wishReady = totalBlooms >= wishGoal;
  const hasBlooms = totalBlooms > 0;
  const heroShift = viewport.height && viewport.height < 720 ? 100 : 130;
  const milestoneStage = completedMilestones.length;
  const showMilestoneGlow = showBaseAtmosphere && milestoneStage >= 1;
  const showMilestoneRibbons = showFineDetail && milestoneStage >= 2;
  const showMilestoneSpark = showFineDetail && milestoneStage >= 3;
  const showMilestoneCrown = showFineDetail && milestoneStage >= 4;
  const milestoneTitle =
    activeMilestone?.id === 'fifty'
      ? scavengerState.completed
        ? 'Surat siap dibaca'
        : 'Surat menunggu'
      : activeMilestone?.title ?? '';
  const milestoneMessage =
    activeMilestone?.id === 'fifty'
      ? scavengerState.completed
        ? 'Scavenger hunt selesai. Saatnya membuka surat.'
        : 'Selesaikan scavenger hunt untuk membuka surat.'
      : activeMilestone?.message ?? '';
  useEffect(() => {
    if (!letterUnlocked) return;
    void import('@/components/LetterModal');
  }, [letterUnlocked]);

  useEffect(() => {
    const letterJustReady = letterBloomReady && !letterReadyRef.current;
    const scavengerJustCompleted =
      scavengerState.completed && !scavengerCompleteRef.current;

    if (letterJustReady) {
      if (scavengerState.completed) {
        showToast('Scavenger hunt selesai. Surat siap dibuka.');
      } else {
        showToast('50 bunga tercapai. Selesaikan scavenger hunt untuk membuka surat.');
      }
    } else if (letterBloomReady && scavengerJustCompleted) {
      if (letterToastTimerRef.current) {
        window.clearTimeout(letterToastTimerRef.current);
      }
      letterToastTimerRef.current = window.setTimeout(() => {
        showToast('Scavenger hunt selesai. Surat siap dibuka.');
        letterToastTimerRef.current = null;
      }, 2600);
    }

    letterReadyRef.current = letterBloomReady;
    scavengerCompleteRef.current = scavengerState.completed;
  }, [letterBloomReady, scavengerState.completed, showToast]);

  useEffect(() => {
    return () => {
      if (letterToastTimerRef.current) {
        window.clearTimeout(letterToastTimerRef.current);
        letterToastTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!postLetterMode) return;
    void import('@/components/FinaleSequence');
    void import('@/components/WishRitualModal');
    void import('@/components/FinaleChoiceOverlay');
    void import('@/components/GardenCanvasOverlay');
  }, [postLetterMode]);
  const tiltX = useTransform(smoothY, [0, viewport.height || 1], [3, -3]);
  const tiltY = useTransform(smoothX, [0, viewport.width || 1], [-4, 4]);
  const tiltXStyle = reducedMotion || perfTier === 'low' ? 0 : tiltX;
  const tiltYStyle = reducedMotion || perfTier === 'low' ? 0 : tiltY;
  const mothEnabled = showAnimatedAtmosphere && !reducedMotion && perfTier !== 'low';

  useEffect(() => {
    if (!hasBlooms) {
      setGuideHidden(false);
      return;
    }
    const timer = window.setTimeout(() => setGuideHidden(true), 700);
    return () => window.clearTimeout(timer);
  }, [hasBlooms]);

  useEffect(() => {
    if (pureGardenMode) return;
    if (introVisible || letterOpen || milestoneOpen) return;
    if (activeMilestone) return;
    const nextMilestone = milestones.find(
      (milestone) =>
        totalBlooms >= milestone.count && !completedMilestones.includes(milestone.id)
    );
    if (!nextMilestone) return;
    setActiveMilestone(nextMilestone);
  }, [
    activeMilestone,
    completedMilestones,
    introVisible,
    letterOpen,
    milestoneOpen,
    milestones,
    pureGardenMode,
    totalBlooms
  ]);

  useEffect(() => {
    if (!activeMilestone || reducedMotion) return;
    if (milestoneBurstedRef.current === activeMilestone.id) return;
    milestoneBurstedRef.current = activeMilestone.id;
    const timers: number[] = [];
    const rect = containerRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : viewport.width / 2;
    const centerY = rect ? rect.height * 0.42 : viewport.height * 0.42;
    addShootingStar();
    playSfx(sparkleRef, { volume: 0.35, rateMin: 0.98, rateMax: 1.04 });
    if (perfTier === 'high') {
      timers.push(window.setTimeout(() => addShootingStar(), 220));
    }
    if (showBlessing) {
      addAura(centerX, centerY);
      addPetalBurst(centerX, centerY);
    }
    if (perfTier !== 'low') {
      timers.push(window.setTimeout(() => addLantern(), 300));
    }
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [
    activeMilestone,
    addLantern,
    addShootingStar,
    addAura,
    addPetalBurst,
    perfTier,
    playSfx,
    reducedMotion,
    showBlessing,
    sparkleRef,
    viewport.height,
    viewport.width
  ]);

  useEffect(() => {
    if (!showAnimatedAtmosphere) return;
    let starTimer = 0;
    let lanternTimer = 0;

    const scheduleStar = () => {
      const delay = 6500 + Math.random() * 9000;
      starTimer = window.setTimeout(() => {
        addShootingStar();
        scheduleStar();
      }, delay);
    };

    const scheduleLantern = () => {
      const delay = 9000 + Math.random() * 11000;
      lanternTimer = window.setTimeout(() => {
        addLantern();
        scheduleLantern();
      }, delay);
    };

    scheduleStar();
    scheduleLantern();

    return () => {
      window.clearTimeout(starTimer);
      window.clearTimeout(lanternTimer);
    };
  }, [addLantern, addShootingStar, showAnimatedAtmosphere]);

  useEffect(() => {
    if (!postLetterMode) return;
    const cap = perfTier === 'low' ? 8 : 12;
    const minDelay = perfTier === 'low' ? 8000 : 4000;
    const maxDelay = perfTier === 'low' ? 12000 : 8000;

    const scheduleLantern = () => {
      if (lanterns.length < cap) {
        spawnDimLantern();
      }
      const delay = minDelay + Math.random() * (maxDelay - minDelay);
      lanternSpawnTimeoutRef.current = window.setTimeout(scheduleLantern, delay);
    };

    const initialDelay = perfTier === 'low' ? 6000 : 2500;
    lanternSpawnTimeoutRef.current = window.setTimeout(scheduleLantern, initialDelay);

    return () => {
      if (lanternSpawnTimeoutRef.current) {
        window.clearTimeout(lanternSpawnTimeoutRef.current);
        lanternSpawnTimeoutRef.current = null;
      }
    };
  }, [lanterns.length, perfTier, postLetterMode, spawnDimLantern]);

  useEffect(() => {
    if (!sparklesEnabled || interactionLocked) return;
    let rafId = 0;

    const loop = () => {
      const now = performance.now();
      const pointer = pointerStateRef.current;
      if (pointer.active && now - pointer.lastMove < 120) {
        if (now - lastSparkleAt.current >= perf.sparkleInterval) {
          lastSparkleAt.current = now;
          addSparkle(pointer.x, pointer.y);
        }
      }
      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [addSparkle, interactionLocked, perf.sparkleInterval, sparklesEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    refreshBounds();
    const handleBoundsRefresh = () => refreshBounds();
    const scrollOptions: AddEventListenerOptions = { passive: true, capture: true };
    const resizeOptions: AddEventListenerOptions = { passive: true };
    window.addEventListener('scroll', handleBoundsRefresh, scrollOptions);
    window.addEventListener('resize', handleBoundsRefresh, resizeOptions);
    const viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener('resize', handleBoundsRefresh, resizeOptions);
      viewport.addEventListener('scroll', handleBoundsRefresh, resizeOptions);
    }
    return () => {
      window.removeEventListener('scroll', handleBoundsRefresh, scrollOptions);
      window.removeEventListener('resize', handleBoundsRefresh, resizeOptions);
      if (viewport) {
        viewport.removeEventListener('resize', handleBoundsRefresh, resizeOptions);
        viewport.removeEventListener('scroll', handleBoundsRefresh, resizeOptions);
      }
    };
  }, [refreshBounds]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const now = performance.now();
    if (!boundsRef.current || now - boundsStampRef.current > 250) {
      refreshBounds();
    }
    const rect = boundsRef.current;
    if (!rect) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pointerX.set(x);
    pointerY.set(y);
    const pointer = pointerStateRef.current;
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
    pointer.lastMove = performance.now();
  };

  const getLanternPosition = useCallback(
    (lantern: Timed<Lantern>, rect: DOMRect, now: number) => {
      const height = rect.height || viewport.height || 600;
      const width = rect.width || viewport.width || 800;
      const travel = -(height * 0.9);
      const lifespanMs = lantern.duration * 1000 + 600;
      const bornAt = lantern.expiresAt - lifespanMs;
      const progress = Math.min(1, Math.max(0, (now - bornAt) / (lantern.duration * 1000)));
      const translateY = 20 + (travel - 20) * progress;
      const x = (lantern.x / 100) * width;
      const y = height - 32 + translateY;
      return { x, y };
    },
    [viewport.height, viewport.width]
  );

  const lightLanternAt = useCallback(
    (lantern: Timed<Lantern>, rect: DOMRect) => {
      const now = performance.now();
      const durationMs = 4000 + Math.random() * 2000;
      const litUntil = now + durationMs;
      const { x, y } = getLanternPosition(lantern, rect, now);
      setLitLanterns((prev) => ({ ...prev, [lantern.id]: litUntil }));
      if (litLanternTimeoutsRef.current[lantern.id]) {
        window.clearTimeout(litLanternTimeoutsRef.current[lantern.id]);
      }
      litLanternTimeoutsRef.current[lantern.id] = window.setTimeout(() => {
        setLitLanterns((prev) => {
          if (prev[lantern.id] !== litUntil) return prev;
          const next = { ...prev };
          delete next[lantern.id];
          return next;
        });
        delete litLanternTimeoutsRef.current[lantern.id];
      }, durationMs + 80);
      for (let i = 0; i < 3; i += 1) {
        const jitterX = (Math.random() - 0.5) * 18;
        const jitterY = (Math.random() - 0.5) * 18;
        addSparkle(x + jitterX, y + jitterY, 1.1);
      }
      playSfx(sparkleRef, { volume: 0.28, rateMin: 0.98, rateMax: 1.02 });
    },
    [addSparkle, getLanternPosition, playSfx, sparkleRef]
  );

  const handleReturnToGarden = useCallback(() => {
    setPostLetterMode(false);
    setPureGardenMode(true);
    setWishModalOpen(false);
    setLetterOpen(false);
    setActiveMilestone(null);
    setCompletedMilestones([]);
    milestoneBurstedRef.current = null;
    setToastMessage(null);
    setPureMenuOpen(false);
    resetBlooms(PURE_GARDEN_START_BLOOMS);
  }, [resetBlooms]);

  const pressAt = useCallback((seedX: number, seedY: number, rect: DOMRect) => {
    if (showScavengerCharm) {
      const clientX = rect.left + seedX;
      const clientY = rect.top + seedY;
      const charmButton = charmButtonRef.current;
      if (charmButton) {
        const charmRect = charmButton.getBoundingClientRect();
        const padding = 18;
        if (
          clientX >= charmRect.left - padding &&
          clientX <= charmRect.right + padding &&
          clientY >= charmRect.top - padding &&
          clientY <= charmRect.bottom + padding
        ) {
          markCharmFound();
          return;
        }
      }
      const charmX = (Number.parseFloat(scavengerCharmPosition.x) / 100) * rect.width;
      const charmY = (Number.parseFloat(scavengerCharmPosition.y) / 100) * rect.height;
      const charmRadius = Math.max(70, Math.min(rect.width, rect.height) * 0.12);
      const dx = seedX - charmX;
      const dy = seedY - charmY;
      if (dx * dx + dy * dy <= charmRadius * charmRadius) {
        markCharmFound();
        return;
      }
    }
    if (lanterns.length > 0) {
      const now = performance.now();
      const radius = perfTier === 'low' ? 34 : 42;
      const radiusSq = radius * radius;
      for (const lantern of lanterns) {
        const { x, y } = getLanternPosition(lantern, rect, now);
        const dx = seedX - x;
        const dy = seedY - y;
        if (dx * dx + dy * dy <= radiusSq) {
          lightLanternAt(lantern, rect);
          return;
        }
      }
    }
    const now = performance.now();
    if (now - lastTapAt.current < 260) {
      addShootingStar();
      markStarMade();
      if (showBlessing) addAura(seedX, seedY);
    }
    lastTapAt.current = now;

    plantAt(seedX, seedY, rect);

    if (!showBlessing) return;
    if (holdTimeoutRef.current) {
      window.clearTimeout(holdTimeoutRef.current);
    }
    holdTimeoutRef.current = window.setTimeout(() => {
      addAura(seedX, seedY);
      addPetalBurst(seedX, seedY);
      holdTimeoutRef.current = null;
    }, 650);
  }, [
    addAura,
    addPetalBurst,
    addShootingStar,
    charmButtonRef,
    getLanternPosition,
    holdTimeoutRef,
    lanterns,
    lastTapAt,
    lightLanternAt,
    markCharmFound,
    markStarMade,
    perfTier,
    plantAt,
    showBlessing,
    showScavengerCharm
  ]);

  const getKeyboardPressPoint = useCallback(() => {
    const rect = boundsRef.current ?? containerRef.current?.getBoundingClientRect() ?? null;
    if (!rect) return null;
    if (!boundsRef.current) {
      boundsRef.current = rect;
      boundsStampRef.current = performance.now();
    }
    const pointer = pointerStateRef.current;
    const now = performance.now();
    const isRecent = now - pointer.lastMove < 3000;
    const clampValue = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value));
    const seedX = clampValue(isRecent ? pointer.x : rect.width / 2, 0, rect.width);
    const seedY = clampValue(isRecent ? pointer.y : rect.height / 2, 0, rect.height);
    return { seedX, seedY, rect };
  }, [boundsRef, boundsStampRef, containerRef, pointerStateRef]);

  const handleKeyboardPlant = useCallback(() => {
    if (interactionLocked) return;
    const pressPoint = getKeyboardPressPoint();
    if (!pressPoint) return;
    pressAt(pressPoint.seedX, pressPoint.seedY, pressPoint.rect);
  }, [getKeyboardPressPoint, interactionLocked, pressAt]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest?.('[data-scavenger-charm="true"]')) {
      return;
    }
    refreshBounds();
    const rect = boundsRef.current;
    if (!rect) return;

    const seedX = event.clientX - rect.left;
    const seedY = event.clientY - rect.top;
    pressAt(seedX, seedY, rect);
  };

  const handlePointerUp = () => {
    pointerStateRef.current.active = false;
    if (holdTimeoutRef.current) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (interactionLocked) return;
    containerRef.current?.focus();
  }, [interactionLocked]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const isEnter = event.key === 'Enter' || event.code === 'Enter';
    const isSpace = event.key === ' ' || event.code === 'Space';
    if (!isEnter && !isSpace) return;
    event.preventDefault();
    if (interactionLocked || event.repeat) return;
    const pressPoint = getKeyboardPressPoint();
    if (!pressPoint) return;
    pressAt(pressPoint.seedX, pressPoint.seedY, pressPoint.rect);
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const isEnter = event.key === 'Enter' || event.code === 'Enter';
    const isSpace = event.key === ' ' || event.code === 'Space';
    if (!isEnter && !isSpace) return;
    event.preventDefault();
    handlePointerUp();
  };

  return (
    <GardenSurface
      containerRef={containerRef}
      interactionLocked={interactionLocked}
      shouldTrackPointer={shouldTrackPointer}
      brightness={brightness}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerMove={handlePointerMove}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onKeyboardPlant={handleKeyboardPlant}
    >
      <StartSettingsOverlay
        open={!preflightDone}
        isMuted={isMuted}
        perfTier={perfTier}
        brightness={brightness}
        rememberChoice={rememberChoice}
        onSetMuted={handleSetMuted}
        onSelectPerf={handleSelectPerf}
        onSetBrightness={handleSetBrightness}
        onToggleRemember={handleToggleRemember}
        onResetDefaults={handleResetDefaults}
        onContinue={handlePreflightContinue}
      />

      {preflightDone && (
        <IntroGate
          gateComplete={gateComplete}
          onGateComplete={handleGateComplete}
          introVisible={introVisible}
          introAnimating={introAnimating}
          introFlash={introFlash}
          introBurst={introBurst}
          introSparks={introSparks}
          introPetals={introPetals}
          introFireworks={introFireworks}
          introBlooms={introBlooms}
          introRayCount={introRayCount}
          showIntroDust={showIntroDust}
          showIntroPatternMotion={showIntroPatternMotion}
          showIntroConstellation={showIntroConstellation}
          showIntroOuterRing={showIntroOuterRing}
          showIntroBloomDetail={showIntroBloomDetail}
          perfTier={perfTier}
          introCardContent={introCardContent}
        />
      )}

      {showFireflies && <Fireflies intensity={perfTier} />}
      {mothEnabled && (
        <MothFollower
          enabled={mothEnabled}
          pointerRef={pointerStateRef}
          containerRef={containerRef}
        />
      )}

      

      {showBaseAtmosphere && (
        <>
          {showAnimatedAtmosphere && (
            <div className="pointer-events-none absolute inset-0 z-[1] velvet-field" />
          )}
          <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_top,_rgba(24,30,34,0.55),_transparent_60%)]" />
          {showFineDetail && (
            <div className="pointer-events-none absolute -inset-32 z-[1] opacity-80 blur-3xl">
              <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,_rgba(216,181,107,0.16),_transparent_45%),radial-gradient(circle_at_80%_80%,_rgba(90,120,110,0.2),_transparent_55%)]" />
            </div>
          )}
          {showAnimatedAtmosphere && (
            <>
              <div className="pointer-events-none absolute -inset-40 z-[2] opacity-70 aurora" />
              <div className="pointer-events-none absolute inset-0 z-[2] mist-drift" />
            </>
          )}
        </>
      )}
      {showFineDetail && (
        <>
          <div className="pointer-events-none absolute inset-0 z-[1] opacity-40 sky-grid" />
          <div className="pointer-events-none absolute -top-24 left-1/2 z-[2] h-64 w-[120%] -translate-x-1/2 ribbon-veil" />
          <div
            className="pointer-events-none absolute left-[6%] top-[30%] z-[2] h-40 w-40 rounded-full halo-ring"
            style={{ animationDelay: '1.5s' }}
          />
          <div
            className="pointer-events-none absolute right-[18%] top-[52%] z-[2] h-48 w-48 rounded-full halo-ring"
            style={{ animationDelay: '3.5s' }}
          />
        </>
      )}
      {showFineDetail &&
        glowOrbs.map((orb) => (
          <motion.div
            key={orb.id}
            className="pointer-events-none absolute z-[2] rounded-full blur-3xl"
            style={{
              width: orb.size,
              height: orb.size,
              left: orb.x,
              top: orb.y,
              background: `radial-gradient(circle at 30% 30%, ${orb.color}, transparent 70%)`
            }}
            animate={{
              x: [0, 18, -12, 0],
              y: [0, -16, 12, 0],
              opacity: [0.35, 0.7, 0.45]
            }}
            transition={{
              duration: orb.duration,
              ease: 'easeInOut',
              repeat: Infinity,
              delay: orb.delay
            }}
          />
        ))}
      {showSpotlight && (
        <motion.div
          className="pointer-events-none absolute left-0 top-0 z-[4]"
          style={{ x: smoothX, y: smoothY }}
        >
          <div className="-translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_30%_30%,_rgba(247,242,232,0.18),_rgba(216,181,107,0.08)_55%,_transparent_75%)] blur-2xl opacity-70" />
        </motion.div>
      )}
      {showMoonbeam && (
        <motion.div
          className="pointer-events-none absolute -top-10 z-[4] h-[120%] w-56 -translate-x-1/2 opacity-50"
          style={{ x: smoothX }}
        >
          <div className="h-full w-full rounded-full bg-[linear-gradient(180deg,_rgba(248,240,220,0.18),_rgba(216,181,107,0.08)_35%,_transparent_70%)] blur-2xl" />
        </motion.div>
      )}
      {showFineDetail && (
        <div className="pointer-events-none absolute inset-0 z-[9] hidden lg:block">
          {vowChips.map((chip, index) => (
            <motion.div
              key={chip.id}
              className="absolute rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.4em] text-white/60 shadow-[0_0_24px_rgba(216,181,107,0.12)] backdrop-blur-sm lux-chip font-display"
              style={{ left: chip.x, top: chip.y }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: [0, 0.75, 0.4, 0.75], y: [8, 0, -6, 0] }}
              transition={{
                duration: 10 + index * 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: chip.delay
              }}
            >
              {chip.text}
            </motion.div>
          ))}
        </div>
      )}
      {showBaseAtmosphere && (
        <>
          <div className="pointer-events-none absolute right-[10%] top-[12%] z-[3] h-36 w-36 rounded-full bg-[radial-gradient(circle_at_30%_30%,_rgba(247,242,232,0.95),_rgba(216,181,107,0.22)_55%,_transparent_75%)] opacity-80" />
          <div className="pointer-events-none absolute right-[9%] top-[10%] z-[2] h-44 w-44 rounded-full bg-[radial-gradient(circle,_rgba(216,181,107,0.12),_transparent_70%)] blur-2xl" />
        </>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[35%] bg-[radial-gradient(ellipse_at_bottom,_rgba(7,9,10,0.92),_transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 z-[6] bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0)_30%,_rgba(0,0,0,0.7)_80%)]" />
      <div className="pointer-events-none absolute inset-4 z-[7] rounded-[28px] border border-[rgba(216,181,107,0.14)] frame-glow md:inset-8 md:rounded-[36px]" />
      {wishReady && showFineDetail && (
        <div className="pointer-events-none absolute inset-0 z-[8] golden-dust" />
      )}
      <div className="pointer-events-none absolute inset-0 z-[9] grain opacity-[0.06]" />
      <div className="pointer-events-none absolute inset-0 z-[10] lux-vignette" />
      {showMilestoneGlow && (
        <div className="pointer-events-none absolute inset-0 z-[3] milestone-glow" />
      )}
      {showMilestoneRibbons && (
        <div className="pointer-events-none absolute inset-0 z-[3] milestone-ribbons" />
      )}
      {showMilestoneSpark && (
        <div className="pointer-events-none absolute inset-0 z-[3] milestone-spark" />
      )}
      {showMilestoneCrown && (
        <div className="pointer-events-none absolute left-1/2 top-[8%] z-[4] h-40 w-40 -translate-x-1/2 milestone-crown" />
      )}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[12] bg-[radial-gradient(circle_at_top,_rgba(20,24,28,0.85),_rgba(5,5,6,0.95)_70%),linear-gradient(120deg,_rgba(216,181,107,0.08),_rgba(255,255,255,0.02),_rgba(182,232,208,0.06))]"
        initial={false}
        animate={{ opacity: introVisible ? 1 : 0 }}
        transition={{
          duration: reducedMotion ? 0.6 : 2,
          ease: 'easeOut',
          delay: introVisible ? 0 : 0.2
        }}
      />
      <AnimatePresence>
        {revealActive && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-[35]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <motion.div
              className="absolute inset-0 reveal-veil"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.75, 0], scale: [1, 1.04, 1.08] }}
              transition={{ duration: 1.6, ease: 'easeOut' }}
            />
            {showRevealCurtain && (
              <>
                <motion.div
                  className="absolute inset-x-0 top-0 h-1/2 reveal-curtain reveal-curtain-top"
                  initial={{ y: 0 }}
                  animate={{ y: '-120%' }}
                  transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
                />
                <motion.div
                  className="absolute inset-x-0 bottom-0 h-1/2 reveal-curtain reveal-curtain-bottom"
                  initial={{ y: 0 }}
                  animate={{ y: '120%' }}
                  transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                />
                <motion.div
                  className="absolute left-1/2 top-1/2 h-px w-[70%] -translate-x-1/2 reveal-flare"
                  initial={{ opacity: 0, scaleX: 0.2 }}
                  animate={{ opacity: [0, 1, 0], scaleX: [0.2, 1.1, 0.6] }}
                  transition={{ duration: 1.6, ease: 'easeOut', delay: 0.15 }}
                />
              </>
            )}
            <motion.div
              className="absolute inset-0 reveal-iris"
              initial={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0 }}
              animate={{ clipPath: 'circle(140% at 50% 50%)', opacity: [0, 0.85, 0] }}
              transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
            />
            {showRevealBloom && (
              <motion.div
                className="absolute inset-0 reveal-bloom"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: [0, 0.9, 0], scale: [0.7, 1.12, 1.24] }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
              />
            )}
            {showRevealBloom && (
              <motion.div
                className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full reveal-ring"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: [0, 0.6, 0], scale: [0.6, 1.04, 1.18] }}
                transition={{ duration: 1.8, ease: 'easeOut' }}
              />
            )}
            {showRevealSheen && (
              <motion.div
                className="absolute -inset-[30%] reveal-sheen"
                initial={{ x: -520, opacity: 0 }}
                animate={{ x: 520, opacity: [0, 0.7, 0] }}
                transition={{ duration: 1.9, ease: 'easeInOut', delay: 0.25 }}
              />
            )}
            {showRevealSheen && (
              <motion.div
                className="absolute -inset-[30%] reveal-sheen"
                initial={{ x: 520, opacity: 0 }}
                animate={{ x: -520, opacity: [0, 0.5, 0] }}
                transition={{ duration: 2.1, ease: 'easeInOut', delay: 0.6 }}
              />
            )}
            {showRevealEmbers && (
              <div className="absolute inset-0 reveal-embers">
                {revealEmbers.map((ember) => (
                  <motion.span
                    key={ember.id}
                    className="reveal-ember"
                    style={{ left: ember.x, top: ember.y }}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: [0, 0.9, 0], scale: [0.6, 1.2, 0.8] }}
                    transition={{ duration: 1.4, ease: 'easeOut', delay: ember.delay }}
                  />
                ))}
              </div>
            )}
            {showRevealDust && (
              <div className="absolute inset-0 reveal-dust">
                {revealDust.map((dust) => (
                  <motion.span
                    key={dust.id}
                    className="reveal-dust-particle"
                    style={{ left: dust.x, top: dust.y, width: dust.size, height: dust.size }}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{
                      opacity: [0, 0.65, 0],
                      x: dust.driftX,
                      y: dust.driftY,
                      scale: [0.6, 1.1, 0.9]
                    }}
                    transition={{ duration: 1.8, ease: 'easeOut', delay: dust.delay }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ParticleLayer
        ripples={ripples}
        sparkles={sparkles}
        petals={petals}
        auras={auras}
        lanterns={lanternsWithGlow}
        shootingStars={shootingStars}
        viewportHeight={viewport.height}
        elevated={postLetterMode && !finaleTriggered}
      />

      <AnimatePresence>
        {pureGardenMode && !pureMenuOpen && (
          <motion.button
            key="pure-garden-menu"
            type="button"
            className="pointer-events-auto absolute bottom-6 right-6 z-[80] rounded-full px-5 py-2 text-[9px] uppercase tracking-[0.38em] text-white/70 backdrop-blur transition hover:text-white lux-button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              setPureMenuOpen(true);
            }}
          >
            Menu
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pureMenuOpen && (
          <motion.div
            className="absolute inset-0 z-[90] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            onPointerDown={(event) => {
              event.stopPropagation();
              if (event.target === event.currentTarget) {
                setPureMenuOpen(false);
              }
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[rgba(5,6,8,0.76)]" />
            <motion.div
              className="relative w-full max-w-xl rounded-[36px] lux-border p-[1px] shadow-[0_0_160px_rgba(0,0,0,0.65)] lux-sheen"
              initial={{ scale: 0.96, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: 10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 190, damping: 22, mass: 0.9 }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="relative overflow-hidden rounded-[35px] px-7 py-8 text-center backdrop-blur-md lux-card">
                <div className="pointer-events-none absolute inset-0 rounded-[35px] lux-engrave" />
                <div className="relative flex flex-col items-center gap-3">
                  <div className="flex items-center gap-3 opacity-80">
                    <span className="h-px w-12 lux-hairline" />
                    <span className="h-2 w-2 lux-gem" />
                    <span className="h-px w-12 lux-hairline" />
                  </div>
                  <h3 className="text-[11px] uppercase tracking-[0.55em] text-white/60 font-display">
                    Menu Taman
                  </h3>
                  <p className="font-script text-3xl text-[var(--garden-ivory)]">
                    Pilih langkahmu
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className="rounded-full px-5 py-2 text-[9px] uppercase tracking-[0.35em] transition hover:text-white lux-button"
                    onClick={() => {
                      setPureMenuOpen(false);
                      setCanvasOpen(true);
                    }}
                  >
                    Canvas
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-5 py-2 text-[9px] uppercase tracking-[0.35em] transition lux-button ${
                      bouquetState.isUnlocked
                        ? 'text-white/75 hover:text-white'
                        : 'text-white/40'
                    }`}
                    onClick={() => {
                      setPureMenuOpen(false);
                      openBouquetBuilder();
                    }}
                    disabled={!bouquetState.isUnlocked}
                  >
                    Bouquet
                  </button>
                  <button
                    type="button"
                    className="rounded-full px-5 py-2 text-[9px] uppercase tracking-[0.35em] transition hover:text-white lux-button sm:col-span-2"
                    onClick={() => {
                      setPureMenuOpen(false);
                      setPureGardenMode(false);
                    }}
                  >
                    Tampilkan kartu
                  </button>
                </div>

                <div className="mt-6 flex items-center justify-center">
                  <button
                    type="button"
                    className="rounded-full px-6 py-2 text-[9px] uppercase tracking-[0.38em] text-white/70 transition hover:text-white lux-button"
                    onClick={() => setPureMenuOpen(false)}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScavengerCharm && (
          <motion.button
            key="scavenger-charm-button"
            type="button"
            aria-label="Pesona tersembunyi"
            ref={charmButtonRef}
            data-scavenger-charm="true"
            className="pointer-events-auto absolute z-[70] flex h-24 w-24 items-center justify-center rounded-full"
            style={{
              left: scavengerCharmPosition.x,
              top: scavengerCharmPosition.y,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            onPointerDown={(event) => {
              event.stopPropagation();
              event.preventDefault();
              markCharmFound();
            }}
            onClick={(event) => {
              event.stopPropagation();
              markCharmFound();
            }}
          >
            <motion.span
              className="absolute inset-0 rounded-full border border-[rgba(216,181,107,0.6)]"
              animate={{ scale: [0.85, 1, 0.85], opacity: [0.8, 0.2, 0.8] }}
              transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
            />
            <motion.span
              className="absolute inset-3 rounded-full border border-[rgba(216,181,107,0.25)]"
              animate={{ scale: [0.85, 1.1, 0.85], opacity: [0.6, 0.1, 0.6] }}
              transition={{ duration: 3.1, ease: 'easeInOut', repeat: Infinity, delay: 0.2 }}
            />
            <motion.svg
              className="absolute left-1/2 top-2 h-8 w-8 -translate-x-1/2"
              viewBox="0 0 24 24"
              fill="none"
              animate={{ y: [0, -5, 0], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
            >
              <path
                d="M12 4v10m0 0l-4-4m4 4l4-4"
                stroke="rgba(216,181,107,0.9)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
            <motion.span
              className="relative z-[1] flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(216,181,107,0.45)] bg-[radial-gradient(circle,_rgba(216,181,107,0.35),_rgba(216,181,107,0.08)_60%,_transparent_70%)] shadow-[0_0_24px_rgba(216,181,107,0.35)]"
              animate={{
                opacity: [0.7, 1, 0.7],
                scale: [1, 1.06, 1],
                y: [0, -4, 0]
              }}
              transition={{ duration: 2.6, ease: 'easeInOut', repeat: Infinity }}
            >
              <span className="h-2 w-2 rounded-full bg-[var(--garden-gold)] shadow-[0_0_12px_rgba(216,181,107,0.9)]" />
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {wishReady && perfTier !== 'low' && (
          <motion.div
            className="pointer-events-none absolute left-1/2 top-[12%] z-[9] w-[280px] -translate-x-1/2 md:w-[340px]"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <motion.path
                d={constellationPath}
                fill="none"
                stroke="rgba(216, 181, 107, 0.6)"
                strokeWidth="0.8"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.6, ease: 'easeInOut' }}
              />
              {constellationPoints.map((point, index) => (
                <motion.circle
                  key={`${point.x}-${point.y}`}
                  cx={point.x}
                  cy={point.y}
                  r={1.6}
                  fill="rgba(247, 242, 232, 0.95)"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: [0.4, 1, 0.6], scale: [0.8, 1.3, 1] }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.2
                  }}
                />
              ))}
            </svg>
            <motion.p
              className="mt-3 text-center text-[11px] uppercase tracking-[0.45em] text-[var(--garden-gold)]/60 font-display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.8 }}
            >
              Doa lengkap
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {postLetterMode ? (
          <motion.div
            key="pattern"
            className="pointer-events-none fixed inset-0 z-[12]"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="post-letter-grid">
              {patternBlooms.map((bloom) => (
                <div
                  key={bloom.id}
                  className="absolute"
                  style={{
                    left: `${bloom.x}%`,
                    top: `${bloom.y}%`,
                    width: bloom.size,
                    height: bloom.size,
                    opacity: bloom.opacity,
                    transform: `translate(-50%, -50%) rotate(${bloom.rotation}deg)`,
                    willChange: 'opacity, transform'
                  }}
                >
                  <Image
                    src={bloom.src}
                    alt=""
                    width={Math.round(bloom.size)}
                    height={Math.round(bloom.size)}
                    sizes="(max-width: 768px) 18vw, 90px"
                    className="h-full w-full object-contain"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    unoptimized
                    priority={false}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          blooms.map((bloom) => (
            <motion.div
              key={bloom.id}
              className="pointer-events-none absolute"
              style={{
                left: bloom.x - bloom.size / 2,
                top: bloom.y - bloom.size / 2,
                width: bloom.size,
                height: bloom.size,
                zIndex: 10 + bloom.layer,
                transformOrigin: '50% 85%'
              }}
              initial={{ opacity: 0, scale: 0.4, rotate: -5, y: 18 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 18,
                mass: 0.95,
                bounce: 0.22,
                opacity: { duration: 0.35, ease: 'easeOut' },
                delay: bloom.swayDelay * 0.05
              }}
            >
              <Flower
                src={bloom.src}
                rotation={bloom.rotation}
                swayDelay={bloom.swayDelay}
                motionLevel={flowerMotionLevel}
              />
            </motion.div>
          ))
        )}
      </AnimatePresence>

      {!pureGardenMode && (
        <HudOverlay
          postLetterMode={postLetterMode}
          introVisible={introVisible}
          mainRevealVariants={mainRevealVariants}
          mainRevealTransition={mainRevealTransition}
          heroShift={heroShift}
          guideHidden={guideHidden}
          recipientName={recipientName}
          giftDate={giftDate}
          giftYear={giftYear}
          muted={isMuted}
          setMuted={handleSetMuted}
          perf={perfTier}
          setPerf={handleSelectPerf}
          brightness={brightness}
          setBrightness={handleSetBrightness}
          hasBlooms={hasBlooms}
          letterUnlocked={letterUnlocked}
          letterOpen={letterOpen}
          totalBlooms={totalBlooms}
          wishProgress={wishProgress}
          wishReady={wishReady}
          wishGoal={wishGoal}
          scavengerState={scavengerState}
          onToggleScavengerCollapsed={toggleScavengerCollapsed}
          bouquetUnlocked={bouquetState.isUnlocked}
          bouquetOpen={bouquetState.isOpen}
          onOpenBouquet={openBouquetBuilder}
          onOpenLetter={() => setLetterOpen(true)}
          postLetterContent={
            <FinaleSequence
              finaleTriggered={finaleTriggered}
              isImploding={isImploding}
              showFinaleVeil={showFinaleVeil}
              showFinaleRibbons={showFinaleRibbons}
              showFinaleMotion={showFinaleMotion}
              showFinaleGlints={showFinaleGlints}
              finaleRibbons={finaleRibbons}
              finaleFlares={finaleFlares}
              finaleGlints={finaleGlints}
              orbVariants={orbVariants}
              isVoicePlaying={isVoicePlaying}
              onToggleVoice={toggleVoice}
              onTriggerFinale={triggerFinale}
              onOpenCanvas={() => setCanvasOpen(true)}
              onOpenBouquet={openBouquetBuilder}
              onReturnToGarden={handleReturnToGarden}
              bouquetUnlocked={bouquetState.isUnlocked}
            />
          }
        />
      )}

      <AnimatePresence>
        {!pureGardenMode && activeMilestone && (
          <motion.div
            className="absolute inset-0 z-40 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onPointerDown={(event) => {
              event.stopPropagation();
              if (event.target === event.currentTarget) {
                closeMilestone();
              }
            }}
          >
            <motion.div
              className="relative w-full max-w-xl rounded-[32px] lux-border p-[1px] shadow-[0_0_120px_rgba(0,0,0,0.55)] lux-sheen"
              initial={{ scale: 0.95, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: 12, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 190, damping: 22, mass: 0.9 }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="relative overflow-hidden rounded-[31px] p-8 text-center backdrop-blur-md lux-card lux-letter">
                <div className="pointer-events-none absolute inset-0 rounded-[31px] lux-engrave" />
                <p className="relative text-[11px] uppercase tracking-[0.5em] text-[var(--garden-gold)]/70 font-display">
                  {activeMilestone.count} Bunga
                </p>
                <h2 className="relative mt-4 text-2xl font-display text-[var(--garden-ivory)]">
                  {milestoneTitle}
                </h2>
                <p className="relative mt-4 text-sm text-white/70 md:text-base">
                  {milestoneMessage}
                </p>
                <div className="relative mt-6 flex items-center justify-center">
                  <span className="h-px w-20 bg-gradient-to-r from-transparent via-[rgba(216,181,107,0.7)] to-transparent" />
                </div>
                <p className="relative mt-5 text-[10px] uppercase tracking-[0.5em] text-white/60 font-display">
                  Ketuk untuk lanjut
                </p>
                <div className="relative mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    className="rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.4em] transition hover:text-white lux-button"
                    onClick={closeMilestone}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LetterModal
        open={letterOpen}
        recipientName={recipientName}
        displayedLetter={displayedLetter}
        isTypingLetter={isTypingLetter}
        letterTypingDone={letterTypingDone}
        signatureText={signatureText}
        tiltXStyle={tiltXStyle}
        tiltYStyle={tiltYStyle}
        onClose={handleCloseLetter}
      />

      <BouquetBuilderModal
        open={bouquetState.isOpen}
        state={bouquetState}
        recipientName={recipientName}
        giftDate={giftDate}
        onClose={closeBouquetBuilder}
        onSetSize={setBouquetSize}
        onSetSlot={setBouquetSlot}
        onSetMessage={setBouquetMessage}
        onSetLayout={setBouquetLayout}
        onRandomize={randomizeBouquet}
        onReset={resetBouquet}
      />

        <WishRitualModal
          open={wishModalOpen && postLetterMode}
          initialText={wish?.text}
          onSubmit={handleWishSubmit}
          onClose={() => setWishModalOpen(false)}
        />

        {adminPeekOpen && (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
    onPointerDown={(e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target === e.currentTarget) setAdminPeekOpen(false);
    }}

  >
    <div
      className="w-full max-w-xl rounded-2xl bg-zinc-950/90 border border-white/10 p-4 shadow-2xl"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}

    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-white/70">Admin Peek</div>
          <div className="text-lg font-semibold text-white">
            Wish yang tersimpan
          </div>
          <div className="text-xs text-white/50 mt-1">
            Toggle: Ctrl + Shift + Alt + W • Tutup: Esc
          </div>
        </div>

        <button
          className="rounded-lg px-3 py-1.5 text-sm bg-white/10 text-white hover:bg-white/15"
          onClick={() => setAdminPeekOpen(false)}
        >
          Close
        </button>
      </div>

      <div className="mt-4">
        {!adminPeekWish ? (
          <div className="text-white/70 text-sm">
            Belum ada wish yang tersimpan di browser ini.
          </div>
        ) : (
          <>
            <div className="text-xs text-white/50 mb-2">
              Ditulis: {new Date(adminPeekWish.createdAt).toLocaleString()}
            </div>

            <textarea
              readOnly
              className="w-full min-h-[160px] rounded-xl bg-black/40 border border-white/10 p-3 text-white/90 text-sm"
              value={adminPeekWish.text}
            />

            <div className="mt-3 flex gap-2">
              <button
                className="rounded-lg px-3 py-2 text-sm bg-white text-black hover:bg-white/90"
                onClick={() => {
                  if (!adminPeekWish?.text) return;
                  void navigator.clipboard?.writeText?.(adminPeekWish.text);
                }}
              >
                Copy
              </button>

              <button
                className="rounded-lg px-3 py-2 text-sm bg-white/10 text-white hover:bg-white/15"
                onClick={() => {
                  setAdminPeekWish(loadWish());
                }}
              >
                Refresh
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
)}

        <GardenCanvasOverlay
          open={canvasOpen}
          onClose={() => setCanvasOpen(false)}
        />

        <AnimatePresence>
          {toastMessage && (
            <motion.div
            className="pointer-events-none fixed bottom-6 left-1/2 z-[90] w-[min(92vw,360px)] -translate-x-1/2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            aria-live="polite"
            role="status"
          >
            <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-full border border-white/10 bg-[rgba(9,10,12,0.78)] px-4 py-2 text-[10px] uppercase tracking-[0.32em] text-[var(--garden-ivory)] shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm">
              <span className="font-display">{toastMessage}</span>
              <button
                type="button"
                aria-label="Tutup notifikasi"
                className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 transition hover:text-white"
                onClick={dismissToast}
              >
                <span aria-hidden="true">x</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={bgmRef} src={audioSources.bgm} preload="none" loop muted={isMuted} />
      <audio ref={popRef} src={audioSources.pop} preload="none" muted={isMuted} />
      <audio ref={sparkleRef} src={audioSources.sparkle} preload="none" muted={isMuted} />
      <audio ref={paperRef} src={audioSources.paper} preload="none" muted={isMuted} />
      <audio ref={finaleRef} src={audioSources.finale} preload="none" muted={isMuted} />
      <audio ref={voiceRef} src={audioSources.voice} preload="none" muted={isMuted} />
    </GardenSurface>
  );
}
