'use client';

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform
} from 'framer-motion';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  defaultFlowerSize,
  getFlowerSrc,
  usePreferredFlowerFormat
} from '@/lib/garden/assetSources';
import {
  buildSecretSet,
  isSecretMatch,
  normalizeSecretInput,
  type SecretConfig
} from '@/lib/secretGate';

type GateStep =
  | 'NAME_GATE'
  | 'SECRET_CODE'
  | 'WHICH_ONE'
  | 'FLOWER_PICK'
  | 'WISH_SEAL';

type NameGatePhase = 'idle' | 'checking' | 'warning' | 'shatter';
type SecretPhase = 'idle' | 'checking';

type Props = {
  onComplete: () => void;
};

const nameOptions = ['Sella', 'Sella Zahiya Putri', 'Zee', 'Zeey', 'Cutie'];

const positiveAdjectives = ['Cantik', 'Imut', 'Lucu', 'Menggemaskan'];

// Secret gate config: update primary/aliases to change accepted secrets.
// - primary can be a date (DDMMYYYY / DD-MM-YYYY / DD.MM.YYYY / DD/MM/YYYY) or nickname.
// - aliases add extra accepted strings (nicknames, short forms).
// - allowShortDate lets DDMM match when primary is a full date.
const envSecret = process.env.NEXT_PUBLIC_SURPRISE_CODE;
const secretConfig: SecretConfig = {
  primary: envSecret && envSecret.trim().length > 0 ? envSecret : '02112025',
  aliases: [],
  allowShortDate: false
};

const primarySecretNormalized = normalizeSecretInput(secretConfig.primary);
const primaryLooksDate = /^\d{4,8}$/.test(primarySecretNormalized);
const secretUsesNickname = (secretConfig.aliases ?? []).length > 0;
const isSecretDateMode = primaryLooksDate && !secretUsesNickname;
const secretInputMode = isSecretDateMode ? 'numeric' : 'text';
const secretPlaceholder = primaryLooksDate
  ? secretUsesNickname
    ? 'DD/MM/YYYY atau panggilan'
    : 'DD/MM/YYYY'
  : 'Panggilan rahasia';
const acceptedSecrets = buildSecretSet(secretConfig);
const secretHintMessages = {
  gentle: 'Masih belum pas. Coba lagi ya.',
  first: primaryLooksDate ? 'Petunjuk: ini tanggal.' : 'Petunjuk: panggilan kecil.',
  second: primaryLooksDate
    ? `Coba format DD/MM/YYYY${secretUsesNickname ? ' atau panggilan manis.' : '.'}`
    : 'Coba panggilan yang biasa kita pakai.'
};

type FlowerChoice = {
  id: string;
  label: string;
  base: string;
};

type ResolvedFlowerChoice = FlowerChoice & { src: string };

const flowerChoices: FlowerChoice[] = [
  { id: 'tulip', label: 'Tulip', base: 'flower-tulip' },
  { id: 'rose', label: 'Rose', base: 'flower-7' },
  { id: 'lily', label: 'Lily', base: 'flower-3' },
  { id: 'daisy', label: 'Daisy', base: 'flower-1' },
  { id: 'peony', label: 'Peony', base: 'flower-11' },
  { id: 'orchid', label: 'Orchid', base: 'flower-16' }
];

const dissolveCount = 22;

const holdDurationMs = 1200;

const stepVariants = {
  enter: { opacity: 0, y: 18, filter: 'blur(6px)' },
  center: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -12, filter: 'blur(8px)' }
};

const stepTransition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

const shimmerTransition = { duration: 0.35, ease: 'easeOut' };

const normalizeName = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '');

const formatSecretDate = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const allowedNames = new Set(nameOptions.map(normalizeName));

export default function PreIntroGate({ onComplete }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<GateStep>('NAME_GATE');
  const [nameInput, setNameInput] = useState('');
  const [validatedName, setValidatedName] = useState('');
  const [nameGatePhase, setNameGatePhase] = useState<NameGatePhase>('idle');
  const [secretHint, setSecretHint] = useState<string | null>(null);
  const [secretInput, setSecretInput] = useState('');
  const [secretPhase, setSecretPhase] = useState<SecretPhase>('idle');
  const [secretFeedback, setSecretFeedback] = useState<string | null>(null);
  const [secretShake, setSecretShake] = useState(false);
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [flowerHint, setFlowerHint] = useState<string | null>(null);
  const [sparkleBurst, setSparkleBurst] = useState(false);
  const [holdActive, setHoldActive] = useState(false);
  const [holdComplete, setHoldComplete] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [gateScale, setGateScale] = useState(1);
  const [gateTransition, setGateTransition] = useState<null | { message: string; to: GateStep }>(
    null
  );
  const flowerFormat = usePreferredFlowerFormat();
  const resolvedFlowerChoices = useMemo(
    () =>
      flowerChoices.map((choice) => ({
        ...choice,
        src: getFlowerSrc(choice.base, flowerFormat, defaultFlowerSize)
      })),
    [flowerFormat]
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gateShellRef = useRef<HTMLDivElement | null>(null);
  const gateCardRef = useRef<HTMLDivElement | null>(null);
  const jelekRef = useRef<HTMLButtonElement | null>(null);
  const jelekMoveAtRef = useRef(0);
  const holdStartRef = useRef(0);
  const holdTimeoutRef = useRef<number | null>(null);
  const holdFrameRef = useRef<number | null>(null);
  const holdingRef = useRef(false);
  const holdCompleteRef = useRef(false);
  const warningHandledRef = useRef(false);
  const secretAttemptsRef = useRef(0);
  const secretOkRef = useRef(false);
  const secretCheckRef = useRef<number | null>(null);
  const pendingValidRef = useRef(false);
  const gateTransitionRef = useRef<number | null>(null);
  const [jelekOffset, setJelekOffset] = useState({ x: 0, y: 0 });
  const progress = useMotionValue(0);
  const progressSpring = useSpring(progress, { stiffness: 180, damping: 22, mass: 0.8 });
  const ringOffset = useTransform(progressSpring, (value) => {
    const circumference = 2 * Math.PI * 56;
    return circumference * (1 - value);
  });
  const glowOpacity = useTransform(progressSpring, [0, 1], [0.35, 0.9]);
  const glowScale = useTransform(progressSpring, [0, 1], [1, 1.06]);

  const updateGateScale = useCallback(() => {
    if (typeof window === 'undefined') return;
    const shell = gateShellRef.current;
    if (!shell) return;
    const shellWidth = shell.offsetWidth;
    const shellHeight = shell.offsetHeight;
    if (!shellWidth || !shellHeight) return;
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const paddingX = viewportWidth < 520 ? 24 : 40;
    const paddingY = viewportHeight < 720 ? 24 : 48;
    const availableWidth = viewportWidth - paddingX * 2;
    const availableHeight = viewportHeight - paddingY * 2;
    const scale = Math.min(1, availableWidth / shellWidth, availableHeight / shellHeight);
    const clamped = Math.min(1, Math.max(0.82, scale));
    setGateScale(clamped);
  }, []);

  useEffect(() => {
    updateGateScale();
    if (typeof window === 'undefined') return undefined;
    const handleResize = () => updateGateScale();
    window.addEventListener('resize', handleResize);
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateGateScale());
      if (gateShellRef.current) observer.observe(gateShellRef.current);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
    };
  }, [step, updateGateScale]);

  const collectedList = useMemo(
    () => positiveAdjectives.filter((adjective) => collected.has(adjective)),
    [collected]
  );
  const allCollected = collectedList.length === positiveAdjectives.length;
  const displayName = validatedName || 'Kamu';
  const checkingActive = nameGatePhase === 'checking' || secretPhase === 'checking';
  const overlayActive =
    checkingActive ||
    nameGatePhase === 'warning' ||
    nameGatePhase === 'shatter' ||
    finalizing ||
    gateTransition !== null;
  const dissolveParticles = useMemo(
    () =>
      Array.from({ length: dissolveCount }, (_, index) => {
        const size = 5 + Math.random() * 9;
        const stretch = Math.random() > 0.7 ? 2.2 : 1.4;
        return {
          id: `dissolve-${index}`,
          x: 12 + Math.random() * 76,
          y: 12 + Math.random() * 76,
          size,
          stretch,
          driftX: (Math.random() * 2 - 1) * 70,
          driftY: -70 - Math.random() * 70,
          delay: 0.2 + index * 0.05,
          duration: 1.9 + Math.random() * 1.5,
          opacity: 0.55 + Math.random() * 0.35
        };
      }),
    []
  );

  const moveJelek = useCallback(() => {
    const container = containerRef.current;
    const button = jelekRef.current;
    if (!container || !button) return;
    const bounds = container.getBoundingClientRect();
    const cardBounds = gateCardRef.current?.getBoundingClientRect() ?? null;
    const buttonBounds = button.getBoundingClientRect();
    const padding = 16;
    const width = bounds.width;
    const height = bounds.height;
    const buttonWidth = buttonBounds.width;
    const buttonHeight = buttonBounds.height;
    const cardLeft = cardBounds ? cardBounds.left - bounds.left : width * 0.2;
    const cardRight = cardBounds ? cardBounds.right - bounds.left : width * 0.8;
    const cardTop = cardBounds ? cardBounds.top - bounds.top : height * 0.25;
    const cardBottom = cardBounds ? cardBounds.bottom - bounds.top : height * 0.75;
    const regions: Array<{ xMin: number; xMax: number; yMin: number; yMax: number }> = [];

    const pushRegion = (xMin: number, xMax: number, yMin: number, yMax: number) => {
      if (xMax < xMin || yMax < yMin) return;
      regions.push({ xMin, xMax, yMin, yMax });
    };

    pushRegion(padding, width - buttonWidth - padding, padding, cardTop - buttonHeight - padding);
    pushRegion(
      padding,
      width - buttonWidth - padding,
      cardBottom + padding,
      height - buttonHeight - padding
    );
    pushRegion(
      padding,
      cardLeft - buttonWidth - padding,
      Math.max(padding, cardTop),
      Math.min(height - buttonHeight - padding, cardBottom - buttonHeight)
    );
    pushRegion(
      cardRight + padding,
      width - buttonWidth - padding,
      Math.max(padding, cardTop),
      Math.min(height - buttonHeight - padding, cardBottom - buttonHeight)
    );

    const pick =
      regions[Math.floor(Math.random() * regions.length)] ?? {
        xMin: padding,
        xMax: width - buttonWidth - padding,
        yMin: padding,
        yMax: height - buttonHeight - padding
      };
    const nextLeft = pick.xMin + Math.random() * Math.max(0, pick.xMax - pick.xMin);
    const nextTop = pick.yMin + Math.random() * Math.max(0, pick.yMax - pick.yMin);
    const nextX = nextLeft + buttonWidth / 2 - width / 2;
    const nextY = nextTop + buttonHeight / 2 - height / 2;
    setJelekOffset({ x: nextX, y: nextY });
  }, []);

  const nudgeJelek = useCallback(() => {
    const now = performance.now();
    if (now - jelekMoveAtRef.current < 160) return;
    jelekMoveAtRef.current = now;
    moveJelek();
  }, [moveJelek]);

  const handleNameSubmit = useCallback(() => {
    if (nameGatePhase !== 'idle') return;
    const normalized = normalizeName(nameInput);
    const isValid = allowedNames.has(normalized);
    pendingValidRef.current = isValid;
    if (isValid) {
      const cleaned = nameInput.trim().replace(/\s+/g, ' ');
      const finalName = cleaned || 'Sella';
      setValidatedName(finalName);
      localStorage.setItem('sella_gate_name', finalName);
    }
    setNameGatePhase('checking');
    window.setTimeout(() => {
      if (pendingValidRef.current) {
        setNameGatePhase('idle');
        if (secretOkRef.current) {
          if (gateTransitionRef.current) return;
          setGateTransition({ message: 'Menjaga cahaya.', to: 'WHICH_ONE' });
          gateTransitionRef.current = window.setTimeout(() => {
            setStep('WHICH_ONE');
            setGateTransition(null);
            gateTransitionRef.current = null;
          }, 900);
          return;
        }
        setStep('SECRET_CODE');
      } else {
        setNameGatePhase('warning');
      }
    }, 3000);
  }, [nameGatePhase, nameInput]);

  const handleSecretSubmit = useCallback(() => {
    if (secretPhase !== 'idle' || gateTransitionRef.current) return;
    const trimmedInput = secretInput.trim();
    if (!trimmedInput) {
      setSecretFeedback('Tulis dulu rahasianya.');
      setSecretHint(null);
      return;
    }
    const isValid = isSecretMatch(secretInput, acceptedSecrets);
    if (isValid) {
      secretAttemptsRef.current = 0;
      setSecretFeedback(null);
      setSecretHint(null);
      setSecretPhase('checking');
      if (secretCheckRef.current) {
        window.clearTimeout(secretCheckRef.current);
      }
      secretCheckRef.current = window.setTimeout(() => {
        setSecretPhase('idle');
        secretOkRef.current = true;
        localStorage.setItem('sella_gate_secret_ok', '1');
        if (gateTransitionRef.current) return;
        setGateTransition({ message: 'Menjaga cahaya.', to: 'WHICH_ONE' });
        gateTransitionRef.current = window.setTimeout(() => {
          setStep('WHICH_ONE');
          setGateTransition(null);
          gateTransitionRef.current = null;
        }, 900);
      }, 1100);
      return;
    }

    secretAttemptsRef.current += 1;
    setSecretShake(true);
    if (secretAttemptsRef.current === 1) {
      setSecretFeedback(secretHintMessages.gentle);
      setSecretHint(null);
      return;
    }
    if (secretAttemptsRef.current === 2) {
      setSecretFeedback('Hampir. Ada petunjuk kecil di bawah.');
      setSecretHint(secretHintMessages.first);
      return;
    }
    setSecretFeedback('Belum ya. Petunjuknya makin jelas.');
    setSecretHint(secretHintMessages.second);
  }, [secretInput, secretPhase]);

  const handleSecretReset = useCallback(() => {
    setSecretInput('');
    setSecretFeedback(null);
    setSecretHint(null);
    setSecretShake(false);
    secretAttemptsRef.current = 0;
  }, []);

  const handleCollect = useCallback((adjective: string) => {
    setCollected((prev) => {
      if (prev.has(adjective)) return prev;
      const next = new Set(prev);
      next.add(adjective);
      return next;
    });
  }, []);

  const handleFlowerPick = useCallback(
    (choice: ResolvedFlowerChoice) => {
      if (choice.base === 'flower-tulip') {
        setFlowerHint(null);
        if (gateTransitionRef.current) return;
        setGateTransition({ message: 'Merangkai kelopak.', to: 'WISH_SEAL' });
        gateTransitionRef.current = window.setTimeout(() => {
          setStep('WISH_SEAL');
          setGateTransition(null);
          gateTransitionRef.current = null;
        }, 900);
        return;
      }
      setFlowerHint(`${displayName}, coba yang lain ya.`);
    },
    [displayName]
  );

  const completeGate = useCallback(() => {
    if (holdCompleteRef.current) return;
    holdCompleteRef.current = true;
    holdingRef.current = false;
    setHoldActive(false);
    setHoldComplete(true);
    if (holdTimeoutRef.current) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdFrameRef.current) {
      window.cancelAnimationFrame(holdFrameRef.current);
      holdFrameRef.current = null;
    }
    progress.set(1);
    setSparkleBurst(true);
    setFinalizing(true);
    window.setTimeout(() => {
      onComplete();
    }, 2200);
  }, [onComplete, progress]);

  const tickHold = useCallback(
    (now: number) => {
      if (!holdingRef.current) return;
      const elapsed = now - holdStartRef.current;
      progress.set(Math.min(1, elapsed / holdDurationMs));
      if (elapsed >= holdDurationMs) {
        completeGate();
        return;
      }
      holdFrameRef.current = window.requestAnimationFrame(tickHold);
    },
    [completeGate, progress]
  );

  const startHold = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (holdCompleteRef.current || holdingRef.current) return;
      holdingRef.current = true;
      setHoldActive(true);
      holdStartRef.current = performance.now();
      progress.set(0);
      holdFrameRef.current = window.requestAnimationFrame(tickHold);
      holdTimeoutRef.current = window.setTimeout(() => {
        completeGate();
      }, holdDurationMs);
    },
    [completeGate, progress, tickHold]
  );

  const cancelHold = useCallback(() => {
    if (holdCompleteRef.current || !holdingRef.current) return;
    holdingRef.current = false;
    setHoldActive(false);
    if (holdTimeoutRef.current) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdFrameRef.current) {
      window.cancelAnimationFrame(holdFrameRef.current);
      holdFrameRef.current = null;
    }
    progress.set(0);
  }, [progress]);

  useEffect(() => {
    const stored = localStorage.getItem('sella_gate_name');
    if (stored) {
      setValidatedName(stored);
      setNameInput(stored);
    }
    const secretOk = localStorage.getItem('sella_gate_secret_ok');
    if (secretOk === '1') {
      secretOkRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!secretShake) return;
    const timeout = window.setTimeout(() => setSecretShake(false), 420);
    return () => window.clearTimeout(timeout);
  }, [secretShake]);

  useEffect(() => {
    if (step !== 'WHICH_ONE') return;
    moveJelek();
  }, [moveJelek, step]);

  useEffect(() => {
    if (!sparkleBurst) return;
    const timeout = window.setTimeout(() => setSparkleBurst(false), 700);
    return () => window.clearTimeout(timeout);
  }, [sparkleBurst]);

  useEffect(() => {
    if (nameGatePhase !== 'shatter') return;
    const timeout = window.setTimeout(() => {
      router.replace('/not-found');
    }, 3300);
    return () => window.clearTimeout(timeout);
  }, [nameGatePhase, router]);

  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        window.clearTimeout(holdTimeoutRef.current);
      }
      if (holdFrameRef.current) {
        window.cancelAnimationFrame(holdFrameRef.current);
      }
      if (secretCheckRef.current) {
        window.clearTimeout(secretCheckRef.current);
      }
      if (gateTransitionRef.current) {
        window.clearTimeout(gateTransitionRef.current);
      }
    };
  }, []);

  const renderNameGate = () => (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 opacity-80">
          <span className="h-px w-10 lux-hairline" />
          <span className="h-2 w-2 lux-gem" />
          <span className="h-px w-10 lux-hairline" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.6em] text-white/60 font-display">
          Sebelum masuk
        </p>
        <h2 className="text-2xl font-display text-[var(--garden-ivory)] md:text-3xl text-glow">
          Aku cuma mau pastiin ini benar-benar kamu.
        </h2>
        <div className="flex items-center gap-3 opacity-70">
          <span className="h-px w-16 lux-hairline" />
          <span className="h-1.5 w-1.5 lux-gem" />
          <span className="h-px w-16 lux-hairline" />
        </div>
      </div>
      <div className="relative mt-2 flex min-h-[180px] w-full items-center justify-center">
        <AnimatePresence mode="wait">
          {nameGatePhase === 'idle' && (
            <motion.div
              key="name-input"
              className="flex w-full max-w-md flex-col gap-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <input
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Tulis namamu…"
                className="w-full rounded-full px-5 py-3 text-center text-base text-white/90 outline-none transition placeholder:text-white/40 focus:border-[var(--garden-gold)] focus:ring-2 focus:ring-[rgba(216,181,107,0.35)] backdrop-blur lux-plate"
              />
              <button
                type="button"
                className="rounded-full px-7 py-3 text-[10px] uppercase tracking-[0.45em] transition hover:text-white lux-button lux-sheen font-display"
                onClick={handleNameSubmit}
              >
                Lanjut
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderSecretCode = () => {
    const secretBusy = secretPhase === 'checking' || gateTransition !== null;
    const secretDescriptionId = [
      secretFeedback ? 'secret-feedback' : null,
      secretHint ? 'secret-hint' : null
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="flex w-full flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 opacity-80">
            <span className="h-px w-10 lux-hairline" />
            <span className="h-2 w-2 lux-gem" />
            <span className="h-px w-10 lux-hairline" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.6em] text-white/60 font-display">
            Gerbangnya punya kunci rahasia
          </p>
          <h2 className="text-xl font-display text-[var(--garden-ivory)] md:text-2xl text-glow">
            Enter our secret.
          </h2>
          <div className="flex items-center gap-3 opacity-70">
            <span className="h-px w-16 lux-hairline" />
            <span className="h-1.5 w-1.5 lux-gem" />
            <span className="h-px w-16 lux-hairline" />
          </div>
        </div>
        <form
          className="flex w-full max-w-md flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleSecretSubmit();
          }}
        >
          <label htmlFor="secret-input" className="sr-only">
            Rahasia
          </label>
          <motion.div
            animate={secretShake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.35 }}
          >
            <input
              id="secret-input"
              value={secretInput}
              onChange={(event) => {
                const nextValue = event.target.value;
                setSecretInput(isSecretDateMode ? formatSecretDate(nextValue) : nextValue);
                if (secretFeedback) {
                  setSecretFeedback(null);
                }
              }}
              placeholder={secretPlaceholder}
              inputMode={secretInputMode}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-invalid={Boolean(secretFeedback)}
              aria-describedby={secretDescriptionId}
              className={`w-full rounded-full px-5 py-3 text-center text-base text-white/90 outline-none transition placeholder:text-white/40 focus:border-[var(--garden-gold)] focus:ring-2 focus:ring-[rgba(216,181,107,0.35)] backdrop-blur lux-plate ${
                secretFeedback ? 'ring-1 ring-red-400/60' : ''
              }`}
              disabled={secretBusy}
            />
          </motion.div>
          <div className="flex flex-col items-center gap-2">
            <button
              type="submit"
              className="rounded-full px-7 py-3 text-[10px] uppercase tracking-[0.45em] transition hover:text-white lux-button lux-sheen font-display disabled:cursor-not-allowed disabled:opacity-60"
              disabled={secretBusy}
            >
              Cek
            </button>
            <button
              type="button"
              className="text-[10px] uppercase tracking-[0.4em] text-white/50 transition hover:text-white/80 font-display"
              onClick={handleSecretReset}
              disabled={secretBusy}
            >
              Reset
            </button>
          </div>
          {secretFeedback && (
            <p
              id="secret-feedback"
              role="status"
              aria-live="polite"
              className="text-[11px] text-red-100/80 font-display"
            >
              {secretFeedback}
            </p>
          )}
        </form>
        {secretHint && (
          <motion.p
            id="secret-hint"
            className="rounded-full px-4 py-2 text-[10px] text-white/70 backdrop-blur lux-chip font-display"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shimmerTransition}
          >
            {secretHint}
          </motion.p>
        )}
      </div>
    );
  };

  const renderWhichOne = () => (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 opacity-80">
          <span className="h-px w-10 lux-hairline" />
          <span className="h-2 w-2 lux-gem" />
          <span className="h-px w-10 lux-hairline" />
        </div>
        <h2 className="text-2xl font-display text-[var(--garden-ivory)] text-glow">Kamu yang mana?</h2>
        <div className="flex items-center gap-3 opacity-70">
          <span className="h-px w-16 lux-hairline" />
          <span className="h-1.5 w-1.5 lux-gem" />
          <span className="h-px w-16 lux-hairline" />
        </div>
      </div>
      <div className="w-full max-w-md space-y-6">
        <div className="grid grid-cols-2 gap-4 place-items-center">
          <AnimatePresence>
            {positiveAdjectives.map((adjective) =>
              collected.has(adjective) ? null : (
                <motion.button
                  key={adjective}
                  type="button"
                  className="w-full min-h-[42px] rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-white/80 transition lux-plate lux-sheen hover:text-white font-display"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={shimmerTransition}
                  onClick={() => handleCollect(adjective)}
                >
                  {adjective}
                </motion.button>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
      {collectedList.length > 0 && (
        <motion.div
          className="rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.32em] text-[var(--garden-gold-strong)] backdrop-blur lux-plaque font-display"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shimmerTransition}
        >
          {collectedList.join(', ')}
        </motion.div>
      )}
      {allCollected && (
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shimmerTransition}
        >
          <p className="text-sm text-white/75 font-display">
            Record, record… beliau akhirnya ngaku cantik
          </p>
          <button
            type="button"
            className="rounded-full px-6 py-2 text-[10px] uppercase tracking-[0.45em] transition hover:text-white lux-button lux-sheen font-display"
            onClick={() => {
              if (gateTransitionRef.current) return;
              setGateTransition({ message: 'Menyiapkan bunga.', to: 'FLOWER_PICK' });
              gateTransitionRef.current = window.setTimeout(() => {
                setStep('FLOWER_PICK');
                setGateTransition(null);
                gateTransitionRef.current = null;
              }, 900);
            }}
          >
            Lanjut
          </button>
        </motion.div>
      )}
    </div>
  );

  const renderFlowerPick = () => (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 opacity-80">
          <span className="h-px w-10 lux-hairline" />
          <span className="h-2 w-2 lux-gem" />
          <span className="h-px w-10 lux-hairline" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.6em] text-white/60 font-display">
          Pilih bunga favoritmu
        </p>
        <h2 className="text-2xl font-display text-[var(--garden-ivory)] text-glow">Biar aku tahu.</h2>
        <div className="flex items-center gap-3 opacity-70">
          <span className="h-px w-16 lux-hairline" />
          <span className="h-1.5 w-1.5 lux-gem" />
          <span className="h-px w-16 lux-hairline" />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {resolvedFlowerChoices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            aria-label={choice.label}
            className="group relative flex w-36 flex-col items-center gap-4 rounded-3xl px-4 py-4 text-center transition lux-plate lux-sheen"
            onClick={() => handleFlowerPick(choice)}
          >
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-[rgba(7,9,12,0.6)] shadow-[0_12px_24px_rgba(0,0,0,0.45)]">
              <span className="pointer-events-none absolute inset-0 rounded-2xl border border-white/10" />
              <Image
                src={choice.src}
                alt={choice.label}
                fill
                className="object-contain"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                unoptimized
              />
            </div>
            <span className="pointer-events-none absolute inset-0 rounded-3xl border border-[rgba(216,181,107,0.45)] opacity-0 transition group-hover:opacity-100" />
          </button>
        ))}
      </div>
      {flowerHint && (
        <motion.p
          className="rounded-full px-4 py-2 text-[10px] text-[var(--garden-gold-strong)] backdrop-blur lux-chip font-display"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shimmerTransition}
        >
          {flowerHint}
        </motion.p>
      )}
    </div>
  );

  const renderWishSeal = () => (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 opacity-80">
          <span className="h-px w-10 lux-hairline" />
          <span className="h-2 w-2 lux-gem" />
          <span className="h-px w-10 lux-hairline" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.6em] text-white/60 font-display">
          Tahan sebentar
        </p>
        <h2 className="text-2xl font-display text-[var(--garden-ivory)] text-glow">biar aku mulai ya.</h2>
        <div className="flex items-center gap-3 opacity-70">
          <span className="h-px w-16 lux-hairline" />
          <span className="h-1.5 w-1.5 lux-gem" />
          <span className="h-px w-16 lux-hairline" />
        </div>
      </div>
      <div className="relative flex flex-col items-center gap-4">
        <motion.button
          type="button"
          className="relative flex h-40 w-40 select-none items-center justify-center rounded-full text-xs uppercase tracking-[0.4em] text-white/80 transition lux-plate lux-sheen lux-seal font-display"
          style={{ touchAction: 'none' }}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          disabled={holdComplete}
        >
          <motion.div
            className="absolute inset-3 rounded-full bg-[radial-gradient(circle,_rgba(216,181,107,0.22),_transparent_70%)]"
            style={{ opacity: glowOpacity, scale: glowScale }}
          />
          <svg className="absolute inset-0 h-full w-full -rotate-90">
            <motion.circle
              cx="80"
              cy="80"
              r="56"
              fill="none"
              stroke="rgba(216,181,107,0.75)"
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 56}
              style={{ strokeDashoffset: ringOffset }}
            />
          </svg>
          <span className="relative z-[1] font-display">
            {holdActive ? 'Tahan' : holdComplete ? 'Siap' : 'Mulai'}
          </span>
        </motion.button>
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/65 font-display">
          {holdActive ? 'Jangan lepas dulu…' : 'Tekan dan tahan untuk membuka.'}
        </p>
        <AnimatePresence>
          {sparkleBurst && (
            <motion.div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {Array.from({ length: 6 }).map((_, index) => {
                const angle = (index / 6) * Math.PI * 2;
                const x = Math.cos(angle) * 64;
                const y = Math.sin(angle) * 64;
                return (
                  <motion.span
                    key={`spark-${index}`}
                    className="absolute h-2 w-2 rounded-full bg-[var(--garden-gold-strong)] shadow-[0_0_18px_rgba(216,181,107,0.8)]"
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.6], x, y }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.04 }}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <motion.div
      className="fixed inset-0 z-[95] flex items-center justify-center px-5 py-8 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="pointer-events-none absolute inset-0 lux-backdrop" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(216,181,107,0.08),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 grain" />

      {step === 'WHICH_ONE' && (
        <div ref={containerRef} className="fixed inset-0 z-[2] pointer-events-none">
          <motion.button
            ref={jelekRef}
            type="button"
            className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-5 py-2 text-[11px] uppercase tracking-[0.32em] text-white/80 transition lux-plate lux-sheen font-display"
            animate={{ x: jelekOffset.x, y: jelekOffset.y }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            onPointerEnter={nudgeJelek}
            onPointerMove={nudgeJelek}
            onTouchStart={(event) => {
              event.preventDefault();
              nudgeJelek();
            }}
            onPointerDown={(event) => {
              event.preventDefault();
              nudgeJelek();
            }}
            onClick={(event) => event.preventDefault()}
          >
            Jelek
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {gateTransition && (
          <motion.div
            key="gate-transition"
            className="pointer-events-none fixed inset-0 z-[3] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(8,10,12,0.92),_rgba(4,5,7,0.98))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_38%,_rgba(216,181,107,0.16),_transparent_58%)] mix-blend-screen" />
            <div className="absolute inset-0 lux-vignette opacity-70" />
            <div className="absolute inset-4 rounded-[28px] border border-white/10 sm:inset-8 sm:rounded-[36px]" />
            <motion.div
              className="relative w-[90vw] max-w-sm rounded-[30px] p-[1px] shadow-[0_35px_120px_rgba(0,0,0,0.6)] lux-border lux-sheen sm:rounded-[36px]"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <div className="relative overflow-hidden rounded-[29px] px-6 py-6 text-center backdrop-blur-md lux-card lux-letter sm:rounded-[35px] sm:px-8 sm:py-7">
                <div className="pointer-events-none absolute inset-0 rounded-[29px] lux-engrave sm:rounded-[35px]" />
                <div className="pointer-events-none absolute inset-[2px] rounded-[27px] letter-frame-soft sm:rounded-[33px]" />
                <motion.div
                  className="pointer-events-none absolute -left-1/2 top-0 h-full w-1/2 opacity-30"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(255,255,255,0), rgba(216,181,107,0.9), rgba(255,255,255,0))'
                  }}
                  animate={{ x: ['-60%', '160%'] }}
                  transition={{ duration: 3.6, ease: 'easeInOut', repeat: Infinity }}
                />
                <div className="flex items-center justify-center gap-3 opacity-80">
                  <span className="h-px w-10 lux-hairline" />
                  <span className="h-2 w-2 lux-gem" />
                  <span className="h-px w-10 lux-hairline" />
                </div>
                <p className="mt-3 text-[10px] uppercase tracking-[0.6em] text-white/60 font-display">
                  Sebentar
                </p>
                <p className="mt-3 rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.45em] text-[var(--garden-champagne)] lux-plaque lux-sheen font-display">
                  {gateTransition.message}
                </p>
                <div className="mt-5 flex items-center justify-center gap-3 opacity-80">
                  <span className="h-px w-14 lux-hairline" />
                  <motion.span
                    className="h-2 w-2 lux-gem"
                    animate={{ opacity: [0.6, 1, 0.6], scale: [0.9, 1.1, 0.9] }}
                    transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity }}
                  />
                  <span className="h-px w-14 lux-hairline" />
                </div>
                <div className="mt-4 h-px w-24 overflow-hidden bg-white/10 mx-auto">
                  <motion.div
                    className="h-px w-1/2"
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(255,255,255,0), rgba(216,181,107,0.8), rgba(255,255,255,0))'
                    }}
                    animate={{ x: ['-60%', '160%'] }}
                    transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {finalizing && (
          <motion.div
            key="finalizing-overlay"
            className="pointer-events-none fixed inset-0 z-[3] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(10,12,14,0.92),_rgba(4,5,7,0.98))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_35%,_rgba(216,181,107,0.16),_transparent_55%)] mix-blend-screen" />
            <div className="absolute inset-4 rounded-[28px] border border-white/10 sm:inset-6 sm:rounded-[36px]" />
            <motion.div
              className="relative flex flex-col items-center gap-6"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className="relative flex h-24 w-24 items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(216,181,107,0.22),_transparent_70%)]"
                  animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.96, 1.05, 0.96] }}
                  transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
                />
                <div className="absolute inset-0 rounded-full border border-[rgba(216,181,107,0.25)] shadow-[0_0_35px_rgba(216,181,107,0.25)]" />
                <motion.div
                  className="absolute inset-[2px] rounded-full border border-[rgba(246,233,208,0.4)]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 7, ease: 'linear', repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-[10px] rounded-full border-2 border-[rgba(216,181,107,0.85)] border-l-transparent border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2.4, ease: 'linear', repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3.6, ease: 'linear', repeat: Infinity }}
                >
                  <span
                    className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-[var(--garden-gold-strong)] shadow-[0_0_16px_rgba(216,181,107,0.8)]"
                    style={{ transform: 'translate(-50%, -50%) translateX(36px)' }}
                  />
                  <span
                    className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-[rgba(246,233,208,0.85)] shadow-[0_0_12px_rgba(246,233,208,0.7)]"
                    style={{ transform: 'translate(-50%, -50%) translateX(-32px)' }}
                  />
                </motion.div>
              </div>
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.55em] text-white/70 font-display">
                <span>Menyiapkan</span>
                <span className="flex items-center gap-1">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <motion.span
                      key={`final-dot-${index}`}
                      className="h-1.5 w-1.5 rounded-full bg-[var(--garden-gold)]"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1.2, 0.7] }}
                      transition={{
                        duration: 1.1,
                        ease: 'easeInOut',
                        repeat: Infinity,
                        delay: index * 0.15
                      }}
                    />
                  ))}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
        {checkingActive && (
          <motion.div
            key="checking-overlay"
            className="pointer-events-none fixed inset-0 z-[2] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(12,14,16,0.9),_rgba(6,7,9,0.98))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_35%,_rgba(216,181,107,0.12),_transparent_55%)] mix-blend-screen" />
            <div className="absolute inset-6 rounded-[36px] border border-white/10" />
            <motion.div
              className="relative flex flex-col items-center gap-6"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="relative flex h-24 w-24 items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(216,181,107,0.22),_transparent_70%)]"
                  animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.96, 1.04, 0.96] }}
                  transition={{ duration: 2.6, ease: 'easeInOut', repeat: Infinity }}
                />
                <div className="absolute inset-0 rounded-full border border-[rgba(216,181,107,0.25)] shadow-[0_0_35px_rgba(216,181,107,0.25)]" />
                <motion.div
                  className="absolute inset-[2px] rounded-full border border-[rgba(246,233,208,0.4)]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, ease: 'linear', repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-[10px] rounded-full border-2 border-[rgba(216,181,107,0.85)] border-l-transparent border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.8, ease: 'linear', repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3.2, ease: 'linear', repeat: Infinity }}
                >
                  <span
                    className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-[var(--garden-gold-strong)] shadow-[0_0_16px_rgba(216,181,107,0.8)]"
                    style={{ transform: 'translate(-50%, -50%) translateX(36px)' }}
                  />
                  <span
                    className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-[rgba(246,233,208,0.85)] shadow-[0_0_12px_rgba(246,233,208,0.7)]"
                    style={{ transform: 'translate(-50%, -50%) translateX(-32px)' }}
                  />
                </motion.div>
              </div>
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.55em] text-white/70 font-display">
                <span>Memeriksa</span>
                <span className="flex items-center gap-1">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <motion.span
                      key={`load-dot-${index}`}
                      className="h-1.5 w-1.5 rounded-full bg-[var(--garden-gold)]"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1.2, 0.7] }}
                      transition={{
                        duration: 1.1,
                        ease: 'easeInOut',
                        repeat: Infinity,
                        delay: index * 0.15
                      }}
                    />
                  ))}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
        {nameGatePhase === 'warning' && (
          <motion.div
            key="warning-overlay"
            className="pointer-events-none fixed inset-0 z-[2] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(120,16,16,0.45),_rgba(5,6,8,0.95))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_45%,_rgba(255,255,255,0.08),_transparent_60%)] mix-blend-screen" />
            <div className="absolute inset-4 rounded-[32px] border border-red-200/15" />
            <motion.div
              className="relative flex flex-col items-center gap-4"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{
                opacity: [0, 1, 0, 1, 0],
                scale: [0.92, 1.04, 0.96, 1.04, 0.96],
                filter: [
                  'drop-shadow(0 0 0 rgba(248,113,113,0))',
                  'drop-shadow(0 0 26px rgba(248,113,113,0.85))',
                  'drop-shadow(0 0 0 rgba(248,113,113,0))',
                  'drop-shadow(0 0 26px rgba(248,113,113,0.85))',
                  'drop-shadow(0 0 0 rgba(248,113,113,0))'
                ]
              }}
              transition={{ duration: 2.6, ease: 'easeInOut' }}
              onAnimationComplete={() => {
                if (warningHandledRef.current) return;
                warningHandledRef.current = true;
                setNameGatePhase('shatter');
              }}
            >
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-red-300/60 bg-[radial-gradient(circle_at_35%_35%,_rgba(255,255,255,0.2),_rgba(120,16,16,0.92))] text-3xl text-red-100 shadow-[0_0_30px_rgba(248,113,113,0.35)]">
                <span className="absolute inset-[4px] rounded-full border border-red-200/35" />
                <span className="absolute inset-[12px] rounded-full border border-white/10" />
                <span className="relative font-display">!</span>
              </div>
              <p className="text-xs uppercase tracking-[0.4em] text-red-200/70 font-display">
                Akses ditolak
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {nameGatePhase === 'shatter' && (
          <motion.div
            key="name-shatter"
            className="pointer-events-none fixed inset-0 z-[2]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.3] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.45, 0.1] }}
              transition={{ duration: 3, ease: 'easeOut' }}
              style={{
                background:
                  'radial-gradient(circle at 30% 20%, rgba(216,181,107,0.15), transparent 45%), radial-gradient(circle at 70% 70%, rgba(246,233,208,0.12), transparent 50%), linear-gradient(180deg, rgba(6,7,9,0.9), rgba(6,7,9,0.98))'
              }}
            />
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0], scale: [1, 1.02, 1.08] }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              style={{
                background:
                  'radial-gradient(circle at center, rgba(246,233,208,0.7), rgba(246,233,208,0) 58%)',
                mixBlendMode: 'screen'
              }}
            />
            <motion.div
              className="absolute inset-0 bg-[radial-gradient(circle,_rgba(216,181,107,0.28),_transparent_70%)]"
              animate={{ opacity: [0.1, 0.7, 0] }}
              transition={{ duration: 2.6, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0], scale: [1, 1.03, 1.1] }}
              transition={{ duration: 2.8, ease: 'easeOut' }}
              style={{
                backgroundImage:
                  'linear-gradient(135deg, rgba(255,255,255,0.1), transparent 48%), linear-gradient(225deg, rgba(255,255,255,0.08), transparent 50%), radial-gradient(circle at 35% 45%, rgba(216,181,107,0.22), transparent 60%), radial-gradient(circle at 70% 60%, rgba(246,233,208,0.2), transparent 55%)',
                mixBlendMode: 'screen'
              }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 h-[62vmax] w-[62vmax] rounded-full border border-white/10"
              initial={{ opacity: 0, scale: 0.2 }}
              animate={{ opacity: [0, 0.5, 0], scale: [0.2, 1, 1.45] }}
              transition={{ duration: 2.6, ease: 'easeOut' }}
              style={{
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 80px rgba(216,181,107,0.18)',
                backdropFilter: 'blur(2px)'
              }}
            />
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.65, 0.18] }}
              transition={{ duration: 3, ease: 'easeOut' }}
              style={{
                background:
                  'radial-gradient(circle at center, rgba(0,0,0,0) 40%, rgba(4,4,6,0.82) 100%)'
              }}
            />
            {dissolveParticles.map((particle) => (
              <motion.span
                key={particle.id}
                className="absolute rounded-full bg-[var(--garden-gold-strong)] shadow-[0_0_26px_rgba(216,181,107,0.55)]"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  width: `${particle.size * particle.stretch}px`,
                  height: `${particle.size}px`,
                  transform: 'translate(-50%, -50%)'
                }}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{
                  opacity: [0, particle.opacity, 0],
                  scale: [0.3, 1.15, 0.7],
                  x: particle.driftX,
                  y: particle.driftY,
                  filter: ['blur(0px)', 'blur(2px)', 'blur(6px)']
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  ease: 'easeOut'
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="relative z-[1] flex items-center justify-center"
        style={{ transform: `scale(${gateScale})`, transformOrigin: 'center' }}
      >
        <motion.div
          ref={gateShellRef}
          className="w-full max-w-2xl rounded-[36px] p-[1px] shadow-[0_40px_140px_rgba(0,0,0,0.65)] lux-border lux-sheen"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: overlayActive ? 0 : 1, scale: overlayActive ? 0.98 : 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: overlayActive ? 0.2 : 0.5, ease: 'easeOut' }}
        >
          <div
            ref={gateCardRef}
            className="relative overflow-hidden rounded-[35px] px-8 py-8 text-center backdrop-blur-md lux-card lux-letter"
          >
            <div className="pointer-events-none absolute inset-0 rounded-[35px] lux-engrave" />
            <div className="pointer-events-none absolute inset-[2px] rounded-[33px] letter-frame-soft" />
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={stepTransition}
              >
                {step === 'NAME_GATE' && renderNameGate()}
                {step === 'SECRET_CODE' && renderSecretCode()}
                {step === 'WHICH_ONE' && renderWhichOne()}
                {step === 'FLOWER_PICK' && renderFlowerPick()}
                {step === 'WISH_SEAL' && renderWishSeal()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}


