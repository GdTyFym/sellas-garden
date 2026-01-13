'use client';

import { motion } from 'framer-motion';
import type { Transition, Variants } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DISPLAY_LOCALE,
  MILESTONE_LABEL,
  RELATIONSHIP_START_DATE,
  countdownTo,
  daysSince,
  nextAnniversaryDate,
  parseYMD
} from '@/lib/relationshipCounter';
import type { ScavengerHuntState } from '@/lib/scavengerHunt';
import HudSettingsPanel from '@/components/HudSettingsPanel';

type HudOverlayProps = {
  postLetterMode: boolean;
  introVisible: boolean;
  mainRevealVariants: Variants;
  mainRevealTransition: Transition;
  heroShift: number;
  guideHidden: boolean;
  recipientName: string;
  giftDate: string;
  giftYear: string;
  muted: boolean;
  setMuted: (next: boolean) => void;
  perf: 'low' | 'mid' | 'high';
  setPerf: (next: 'low' | 'mid' | 'high') => void;
  brightness: number;
  setBrightness: (value: number) => void;
  hasBlooms: boolean;
  letterUnlocked: boolean;
  letterOpen: boolean;
  totalBlooms: number;
  wishProgress: number;
  wishReady: boolean;
  wishGoal: number;
  scavengerState: ScavengerHuntState;
  onToggleScavengerCollapsed: () => void;
  bouquetUnlocked: boolean;
  bouquetOpen: boolean;
  onOpenBouquet: () => void;
  onOpenLetter: () => void;
  postLetterContent: ReactNode;
};

const formatCountdown = (value: number) => String(value).padStart(2, '0');

const RelationshipCounter = ({ fallbackName }: { fallbackName: string }) => {
  const [now, setNow] = useState<Date | null>(null);
  const [storedName, setStoredName] = useState<string | null>(null);

  useEffect(() => {
    const name = localStorage.getItem('sella_gate_name');
    if (name) {
      setStoredName(name);
    }
  }, []);

  useEffect(() => {
    setNow(new Date());
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const startParts = useMemo(() => parseYMD(RELATIONSHIP_START_DATE), []);
  const startDate = useMemo(
    () => new Date(Date.UTC(startParts.y, startParts.m - 1, startParts.d)),
    [startParts]
  );
  const daysTogether = useMemo(
    () => (now ? Math.max(0, daysSince(startDate, now)) : null),
    [startDate, now]
  );
  const nextMilestone = useMemo(
    () => (now ? nextAnniversaryDate(startDate, now) : null),
    [startDate, now]
  );
  const countdown = useMemo(
    () => (now && nextMilestone ? countdownTo(nextMilestone, now) : null),
    [nextMilestone, now]
  );

  const displayName = storedName ?? fallbackName;
  const namePrefix = displayName ? `${displayName}, ` : '';
  const togetherText =
    DISPLAY_LOCALE === 'id-ID'
      ? `${namePrefix}kita udah bareng ${daysTogether ?? '--'} hari`
      : `${namePrefix}we've been together ${daysTogether ?? '--'} days`;
  const milestoneLabel =
    MILESTONE_LABEL ?? (DISPLAY_LOCALE === 'id-ID' ? 'Anniversary' : 'Anniversary');
  const countdownText = countdown
    ? DISPLAY_LOCALE === 'id-ID'
      ? `Menuju ${milestoneLabel}: ${countdown.days} hari ${formatCountdown(
          countdown.hours
        )}:${formatCountdown(countdown.minutes)}:${formatCountdown(countdown.seconds)}`
      : `Until ${milestoneLabel}: ${countdown.days} days ${formatCountdown(
          countdown.hours
        )}:${formatCountdown(countdown.minutes)}:${formatCountdown(countdown.seconds)}`
    : DISPLAY_LOCALE === 'id-ID'
      ? `Menuju ${milestoneLabel}: -- hari --:--:--`
      : `Until ${milestoneLabel}: -- days --:--:--`;

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl px-4 py-3 text-[10px] uppercase tracking-[0.35em] text-white/70 backdrop-blur lux-plate font-display">
      <span className="text-white/80">{togetherText}</span>
      <span className="text-white/55">{countdownText}</span>
    </div>
  );
};

const ScavengerHuntCard = ({
  state,
  totalBlooms,
  onToggleCollapsed
}: {
  state: ScavengerHuntState;
  totalBlooms: number;
  onToggleCollapsed: () => void;
}) => {
  const bloomsProgress = Math.min(totalBlooms, 7);
  const steps = [
    {
      id: 'blooms',
      label: `Tanam 7 bunga (${bloomsProgress}/7)`,
      done: state.stepIndex >= 1
    },
    { id: 'star', label: 'Buat bintang jatuh', done: state.stepIndex >= 2 },
    {
      id: 'charm',
      label: 'Temukan pesona tersembunyi',
      done: state.stepIndex >= 3
    }
  ];
  const hint =
    state.completed
      ? 'Selesai. Bouquet terbuka.'
      : state.stepIndex === 0
        ? 'Tebar tujuh bunga kecil dulu.'
        : state.stepIndex === 1
          ? 'Panggil satu bintang jatuh.'
          : 'Cari pesona kecil yang bersinar.';

  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl px-4 py-3 text-[10px] uppercase tracking-[0.35em] text-white/70 backdrop-blur lux-plate font-display">
      <div className="flex w-full items-center justify-between gap-3">
        <span className="text-white/80">Scavenger Hunt</span>
        <button
          type="button"
          className="text-[9px] uppercase tracking-[0.4em] text-white/45 transition hover:text-white/70"
          onClick={onToggleCollapsed}
          aria-expanded={!state.collapsed}
        >
          {state.collapsed ? 'Tampilkan' : 'Sembunyikan'}
        </button>
      </div>
      {!state.collapsed && (
        <>
          <div className="flex flex-col gap-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 ${
                  step.done ? 'text-white/85' : 'text-white/50'
                }`}
              >
                <span className="text-[10px]">{step.done ? '[x]' : '[ ]'}</span>
                <span className="tracking-[0.25em]">{step.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[9px] uppercase tracking-[0.35em] text-white/40">{hint}</p>
        </>
      )}
    </div>
  );
};

const BouquetEntry = ({
  isUnlocked,
  isOpen,
  onOpen
}: {
  isUnlocked: boolean;
  isOpen: boolean;
  onOpen: () => void;
}) => (
  <div className="flex w-full flex-col items-center gap-2 rounded-2xl px-4 py-3 text-[10px] uppercase tracking-[0.35em] text-white/70 backdrop-blur lux-plate font-display">
    <span className="text-white/80">Bouquet</span>
    {isUnlocked ? (
      <button
        type="button"
        className="rounded-full px-4 py-2 text-[9px] uppercase tracking-[0.4em] transition hover:text-white lux-button disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onOpen}
        disabled={isOpen}
      >
        {isOpen ? 'Bouquet terbuka' : 'Open Bouquet Builder'}
      </button>
    ) : (
      <span className="text-center text-[9px] uppercase tracking-[0.35em] text-white/50">
        Complete the scavenger hunt to unlock
      </span>
    )}
  </div>
);

export default function HudOverlay({
  postLetterMode,
  introVisible,
  mainRevealVariants,
  mainRevealTransition,
  heroShift,
  guideHidden,
  recipientName,
  giftDate,
  giftYear,
  muted,
  setMuted,
  perf,
  setPerf,
  brightness,
  setBrightness,
  hasBlooms,
  letterUnlocked,
  letterOpen,
  totalBlooms,
  wishProgress,
  wishReady,
  wishGoal,
  scavengerState,
  onToggleScavengerCollapsed,
  bouquetUnlocked,
  bouquetOpen,
  onOpenBouquet,
  onOpenLetter,
  postLetterContent
}: HudOverlayProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hudExpanded, setHudExpanded] = useState(true);
  const handleToggleSettings = useCallback(() => {
    setSettingsOpen((prev) => !prev);
  }, []);
  const handleCloseSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);
  const handleToggleHud = useCallback(() => {
    setHudExpanded((prev) => !prev);
  }, []);
  useEffect(() => {
    if (guideHidden) {
      setHudExpanded(false);
    }
  }, [guideHidden]);

  return (
    <motion.div
      className={`relative z-30 flex min-h-screen flex-col px-6 py-12 md:px-10 ${
        postLetterMode ? 'justify-center post-letter-mode' : 'justify-between'
      }`}
      style={{ willChange: 'transform, opacity, filter' }}
      variants={mainRevealVariants}
      initial="hidden"
      animate={introVisible ? 'hidden' : 'show'}
      transition={mainRevealTransition}
    >
      <div className="pointer-events-auto absolute right-6 top-6 z-[35] flex items-center md:right-10 md:top-8">
        <button
          type="button"
          aria-label="Pengaturan"
          aria-haspopup="dialog"
          aria-expanded={settingsOpen}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] transition lux-button ${
            settingsOpen ? 'text-white' : 'text-white/70 hover:text-white'
          }`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={handleToggleSettings}
        >
          <span aria-hidden="true">⚙️</span>
        </button>
      </div>

      <HudSettingsPanel
        open={settingsOpen}
        onClose={handleCloseSettings}
        muted={muted}
        setMuted={setMuted}
        perf={perf}
        setPerf={setPerf}
        brightness={brightness}
        setBrightness={setBrightness}
      />

      {postLetterMode ? (
        postLetterContent
      ) : (
        <>
          <motion.header
            className="relative mx-auto flex max-w-4xl flex-col items-center text-center"
            initial={{ opacity: 0, y: 18 }}
            animate={{
              opacity: 1,
              y: guideHidden ? heroShift : 0,
              scale: guideHidden ? 0.985 : 1
            }}
            transition={{
              duration: 1.6,
              ease: [0.22, 1, 0.36, 1],
              delay: guideHidden ? 0.2 : 0.05
            }}
          >
            <div className="relative z-[1] flex flex-col items-center">
              <div className="flex flex-col items-center gap-3">
                <p className="rounded-full px-6 py-2 text-[9px] uppercase tracking-[0.7em] text-[var(--garden-champagne)]/85 backdrop-blur font-display lux-plaque lux-sheen">
                  {recipientName}&apos;s Garden
                </p>
                <div className="flex items-center gap-4 text-white/50">
                  <span className="h-px w-16 lux-hairline" />
                  <span className="text-[9px] uppercase tracking-[0.6em] text-[var(--garden-gold-strong)]/80 font-display">
                    {giftDate}
                  </span>
                  <span className="h-px w-16 lux-hairline" />
                </div>
              </div>
              <div className="mt-7 flex w-full max-w-[44rem] flex-col items-center gap-4">
                <div className="hero-minimal">
                  {hasBlooms && <span className="hero-minimal-glow" />}
                  <h1 className="text-4xl font-display tracking-[0.18em] text-[var(--garden-ivory)] md:text-6xl md:leading-[1.02] md:tracking-[0.22em] text-glow lux-emboss type-static">
                    Sebuah doa yang{' '}
                    <span className="font-script lux-foil tracking-[0.08em] text-[var(--garden-gold-strong)] drop-shadow-[0_12px_18px_rgba(0,0,0,0.45)]">
                      tumbuh
                    </span>
                  </h1>
                  <p className="mt-4 text-[9px] uppercase tracking-[0.7em] text-[var(--garden-champagne)]/80 font-display">
                    Selamat ulang tahun, {recipientName}
                  </p>
                  <p
                    className={`mt-4 max-w-[36rem] text-[13px] leading-[1.8] tracking-[0.01em] text-white/78 md:mt-5 md:text-[15px] ${
                      guideHidden ? 'hidden sm:block' : ''
                    }`}
                  >
                    Hadiah ulang tahun ini kubuat perlahan, agar setiap sentuhan terasa seperti
                    pelukan dan doa yang pulang padamu.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex w-full flex-col items-center gap-6" />
            </div>
          </motion.header>

          <motion.div
            className="pointer-events-auto fixed inset-x-0 bottom-6 z-[34] flex justify-center px-6 md:px-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          >
            <div className="w-full max-w-[520px] rounded-3xl px-5 py-4 text-center backdrop-blur-xl hud-dock sm:max-w-3xl sm:px-7 sm:py-5">
              <div className="flex items-center justify-between gap-3 text-[9px] uppercase tracking-[0.45em] text-white/55 font-display">
                <div className="flex items-center gap-2 text-white/70">
                  <span className="lux-crest" />
                  <span>Doa dan bunga</span>
                </div>
                <button
                  type="button"
                  className="text-[9px] uppercase tracking-[0.4em] text-white/50 transition hover:text-white/80"
                  onClick={handleToggleHud}
                >
                  {hudExpanded ? 'Ringkas' : 'Detail'}
                </button>
              </div>

              {hudExpanded ? (
                <div className="mt-4 flex flex-col items-center gap-4 text-center">
                  {letterUnlocked && !letterOpen && (
                    <div className="pointer-events-auto rounded-full lux-border p-[1px] shadow-[0_0_40px_rgba(216,181,107,0.25)]">
                      <button
                        type="button"
                        className="rounded-full px-6 py-2 text-[10px] uppercase tracking-[0.45em] backdrop-blur transition hover:text-white lux-button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenLetter();
                        }}
                      >
                        Buka surat ulang tahun
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <div className="flex items-center gap-3 rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.35em] text-white/70 backdrop-blur lux-plate font-display">
                      <span>Blooms</span>
                      <span className="text-white">{totalBlooms}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-[9px] uppercase tracking-[0.35em] text-white/50 font-display">
                        Energi doa
                      </p>
                      <div className="h-[2px] w-40 overflow-hidden rounded-full bg-white/15">
                        <motion.span
                          className="block h-full rounded-full lux-meter"
                          animate={{ width: `${Math.max(8, wishProgress * 100)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                      <p className="text-[9px] uppercase tracking-[0.35em] text-white/45 font-display">
                        {wishReady ? 'Doa lengkap terbuka' : `Doa lengkap di ${wishGoal} bunga`}
                      </p>
                    </div>
                  </div>
                  <div className="grid w-full gap-3 md:grid-cols-2">
                    <RelationshipCounter fallbackName={recipientName} />
                    <BouquetEntry
                      isUnlocked={bouquetUnlocked}
                      isOpen={bouquetOpen}
                      onOpen={onOpenBouquet}
                    />
                  </div>
                  <ScavengerHuntCard
                    state={scavengerState}
                    totalBlooms={totalBlooms}
                    onToggleCollapsed={onToggleScavengerCollapsed}
                  />
                  <p className="text-[9px] uppercase tracking-[0.5em] text-[var(--garden-gold)]/60 font-display">
                    {giftYear}
                  </p>
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center gap-3 text-center">
                  {letterUnlocked && !letterOpen && (
                    <button
                      type="button"
                      className="rounded-full px-5 py-2 text-[9px] uppercase tracking-[0.4em] transition hover:text-white lux-button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenLetter();
                      }}
                    >
                      Buka surat
                    </button>
                  )}
                  <div className="flex items-center gap-3 rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.35em] text-white/70 backdrop-blur lux-plate font-display">
                    <span>Blooms</span>
                    <span className="text-white">{totalBlooms}</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-[2px] w-40 overflow-hidden rounded-full bg-white/15">
                      <motion.span
                        className="block h-full rounded-full lux-meter"
                        animate={{ width: `${Math.max(8, wishProgress * 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <p className="text-[9px] uppercase tracking-[0.35em] text-white/45 font-display">
                      {wishReady ? 'Doa lengkap terbuka' : `Doa lengkap di ${wishGoal} bunga`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
