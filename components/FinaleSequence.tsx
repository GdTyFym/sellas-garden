'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useState } from 'react';
import type { CSSProperties } from 'react';

type FinaleRibbon = {
  id: string;
  top: string;
  rotate: number;
  opacity: number;
  height: string;
  duration: number;
  delay: number;
};

type FinaleFlare = {
  id: string;
  size: string;
  delay: number;
  duration: number;
};

type FinaleGlint = {
  id: string;
  left: string;
  delay: number;
  duration: number;
  size: number;
  drift: number;
  opacity: number;
};

type FinaleSequenceProps = {
  finaleTriggered: boolean;
  isImploding: boolean;
  showFinaleVeil: boolean;
  showFinaleRibbons: boolean;
  showFinaleMotion: boolean;
  showFinaleGlints: boolean;
  finaleRibbons: FinaleRibbon[];
  finaleFlares: FinaleFlare[];
  finaleGlints: FinaleGlint[];
  orbVariants: Variants;
  isVoicePlaying: boolean;
  onToggleVoice: () => void;
  onTriggerFinale: () => void;
  onOpenCanvas: () => void;
  onOpenBouquet: () => void;
  onReturnToGarden: () => void;
  bouquetUnlocked: boolean;
};

export default function FinaleSequence({
  finaleTriggered,
  isImploding,
  showFinaleVeil,
  showFinaleRibbons,
  showFinaleMotion,
  showFinaleGlints,
  finaleRibbons,
  finaleFlares,
  finaleGlints,
  orbVariants,
  isVoicePlaying,
  onToggleVoice,
  onTriggerFinale,
  onOpenCanvas,
  onOpenBouquet,
  onReturnToGarden,
  bouquetUnlocked
}: FinaleSequenceProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="relative flex flex-1 items-center justify-center">
      <AnimatePresence>
        {isImploding && !finaleTriggered && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[55] bg-[rgba(5,5,6,0.75)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!finaleTriggered && (
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          >
            <div className="post-letter-stage">
              <div className="post-letter-glow" />
              <div className="post-letter-aura" />
              <div className="post-letter-veil" />
              <motion.div
                className="post-letter-diamond post-letter-diamond-outer"
                style={{ scale: 1.08 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 160, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="post-letter-diamond post-letter-diamond-mid"
                style={{ scale: 0.9 }}
                animate={{ rotate: -360 }}
                transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
              />
              <div className="post-letter-diamond post-letter-diamond-inner" />
              <div className="post-letter-filigree" />
              <motion.div
                className="post-letter-halo"
                animate={{ opacity: [0.25, 0.5, 0.25], scale: [0.96, 1, 0.96] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="post-letter-sheen" />
              <span className="post-letter-gem post-letter-gem-top lux-gem" />
              <span className="post-letter-gem post-letter-gem-right lux-gem" />
              <span className="post-letter-gem post-letter-gem-bottom lux-gem" />
              <span className="post-letter-gem post-letter-gem-left lux-gem" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {finaleTriggered && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          >
            <div className="absolute inset-0 bg-[rgba(5,6,8,0.96)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,_rgba(216,181,107,0.22),_transparent_60%),radial-gradient(circle_at_50%_70%,_rgba(182,232,208,0.16),_transparent_64%),linear-gradient(180deg,_rgba(4,5,6,0.96),_rgba(8,10,12,0.98))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(246,233,208,0.22),_transparent_62%)] opacity-80" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0),_rgba(0,0,0,0.7))]" />
            {showFinaleVeil && (
              <>
                <div className="absolute -inset-40 opacity-45 aurora" />
                <div className="absolute inset-0 opacity-55 mist-drift" />
              </>
            )}
            {showFinaleRibbons &&
              finaleRibbons.map((ribbon) => (
                <motion.div
                  key={ribbon.id}
                  className="absolute left-1/2 w-[130%] -translate-x-1/2 rounded-[999px]"
                  style={{
                    top: ribbon.top,
                    height: ribbon.height,
                    rotate: ribbon.rotate,
                    opacity: ribbon.opacity,
                    background:
                      'linear-gradient(90deg, rgba(216,181,107,0), rgba(216,181,107,0.35), rgba(246,233,208,0.4), rgba(216,181,107,0))',
                    filter: 'blur(2px)'
                  }}
                  animate={{
                    x: ['-2%', '2%', '-2%'],
                    opacity: [ribbon.opacity * 0.7, ribbon.opacity, ribbon.opacity * 0.75]
                  }}
                  transition={{
                    duration: ribbon.duration + 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: ribbon.delay
                  }}
                />
              ))}
            {showFinaleMotion && (
              <>
                <motion.div
                  className="absolute left-1/2 top-1/2 h-[140%] w-[35%] -translate-x-1/2 -translate-y-1/2"
                  style={{
                    rotate: -12,
                    background:
                      'linear-gradient(180deg, rgba(246,233,208,0.0), rgba(246,233,208,0.35), rgba(216,181,107,0.0))'
                  }}
                  animate={{ opacity: [0, 0.55, 0], rotate: [-8, 8, -8] }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
              </>
            )}
            <motion.div
              className="absolute left-1/2 top-1/2 h-[86vmin] w-[86vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(216,181,107,0.35)] shadow-[0_0_140px_rgba(216,181,107,0.2)]"
              animate={{ rotate: 360 }}
              transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 h-[64vmin] w-[64vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[rgba(246,233,208,0.3)]"
              animate={{ rotate: -360 }}
              transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 h-[42vmin] w-[42vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(216,181,107,0.5)] shadow-[0_0_80px_rgba(216,181,107,0.28)]"
              animate={{ opacity: [0.2, 0.6, 0.25] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            {showFinaleMotion &&
              finaleFlares.map((flare) => (
                <motion.div
                  key={flare.id}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(216,181,107,0.35)]"
                  style={{ width: flare.size, height: flare.size }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 0.5, 0], scale: [0.7, 1.2, 0.9] }}
                  transition={{
                    duration: flare.duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: flare.delay
                  }}
                />
              ))}
            {showFinaleGlints &&
              finaleGlints.map((glint) => (
                <motion.span
                  key={glint.id}
                  className="absolute top-[-10%] rounded-full"
                  style={{
                    left: glint.left,
                    width: glint.size,
                    height: glint.size,
                    opacity: glint.opacity,
                    background:
                      'radial-gradient(circle, rgba(247,242,232,0.95), rgba(216,181,107,0.6), rgba(216,181,107,0))',
                    boxShadow: '0 0 16px rgba(216,181,107,0.45)'
                  }}
                  animate={{
                    y: ['-10%', '110%'],
                    x: [0, glint.drift],
                    opacity: [0, glint.opacity, 0]
                  }}
                  transition={{
                    duration: glint.duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: glint.delay
                  }}
                />
              ))}
            <motion.div
              className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(246,233,208,0.15)]"
              initial={{ opacity: 0.8, scale: 0.4 }}
              animate={{ opacity: [0.7, 0], scale: [0.4, 1.5] }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label="Center action"
        className={`center-orb relative z-[70] ${
          finaleTriggered || isImploding ? 'pointer-events-none' : ''
        }`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onTriggerFinale();
        }}
        variants={orbVariants}
        initial="idle"
        animate={finaleTriggered ? 'finale' : isImploding ? 'imploding' : 'idle'}
      >
        <div className="center-orb-core intro-emblem">
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
          <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 lux-gem" />
        </div>
      </motion.button>

      {!finaleTriggered && (
        <div className="pointer-events-auto absolute bottom-10 left-1/2 z-[70] -translate-x-1/2">
          <button
            type="button"
            className="rounded-full px-6 py-2 text-[9px] uppercase tracking-[0.38em] text-white/70 backdrop-blur transition hover:text-white lux-button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen(true);
            }}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
          >
            Menu
          </button>
        </div>
      )}

      <AnimatePresence>
        {finaleTriggered && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center px-6"
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
            transition={{ duration: 2, delay: 3.5 }}
          >
            <div className="flex w-full max-w-[92vw] flex-col items-center gap-6">
              <div className="relative flex w-full flex-col items-center gap-5 rounded-[36px] px-8 py-8 text-center backdrop-blur-md lux-border lux-sheen md:px-12 md:py-10">
                <div className="pointer-events-none absolute inset-0 rounded-[31px] lux-engrave" />
                <div className="pointer-events-none absolute inset-[2px] rounded-[34px] letter-frame-soft" />
                <div className="flex items-center gap-3 opacity-80">
                  <span className="h-px w-10 lux-hairline" />
                  <span className="h-2 w-2 lux-gem" />
                  <span className="h-px w-10 lux-hairline" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.55em] text-white/60 font-display">
                  Sella&apos;s Garden
                </p>
                <p className="font-script text-3xl text-luxury-gold md:text-5xl">
                  Semoga semesta mengaminkan semua doamu.
                </p>
                <div className="mt-1 flex items-center justify-center gap-3">
                  <span className="h-px w-16 lux-hairline" />
                  <span className="h-1.5 w-1.5 lux-gem" />
                  <span className="h-px w-16 lux-hairline" />
                </div>
              </div>
              <div className="voice-dock">
                <button
                  type="button"
                  className={`voice-minimal ${isVoicePlaying ? 'voice-minimal-playing' : ''}`}
                  aria-label={isVoicePlaying ? 'Jeda pesan' : 'Putar pesan'}
                  aria-pressed={isVoicePlaying}
                  aria-describedby="voice-help"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={onToggleVoice}
                >
                  <span className="voice-minimal-line" />
                  <div className="voice-minimal-bars">
                    {Array.from({ length: 14 }).map((_, index) => (
                      <span
                        key={`voice-bar-finale-${index}`}
                        className="voice-bar"
                        style={
                          {
                            '--bar-delay': `${(index % 5) * 0.08}s`,
                            '--bar-duration': `${1 + (index % 4) * 0.18}s`,
                            '--bar-max': `${8 + (index % 6) * 2}px`
                          } as CSSProperties
                        }
                      />
                    ))}
                  </div>
                </button>
                <p className="voice-label font-display" id="voice-help">
                  {isVoicePlaying ? 'Mendengarkan...' : 'Klik untuk mendengarkan pesan'}
                </p>
              </div>
              <div className="pointer-events-auto flex items-center justify-center gap-3">
                <button
                  type="button"
                  className="rounded-full px-6 py-2 text-[9px] uppercase tracking-[0.38em] text-white/70 backdrop-blur transition hover:text-white lux-button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen(true);
                  }}
                  aria-expanded={menuOpen}
                  aria-haspopup="dialog"
                >
                  Menu
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            onPointerDown={(event) => {
              event.stopPropagation();
              if (event.target === event.currentTarget) {
                setMenuOpen(false);
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
                    Menu Akhir
                  </h3>
                  <p className="font-script text-3xl text-[var(--garden-ivory)]">
                    Pilih perjalananmu
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className="rounded-full px-5 py-2 text-[9px] uppercase tracking-[0.35em] transition hover:text-white lux-button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenCanvas();
                    }}
                  >
                    Canvas
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-5 py-2 text-[9px] uppercase tracking-[0.35em] transition lux-button ${
                      bouquetUnlocked ? 'text-white/75 hover:text-white' : 'text-white/40'
                    }`}
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenBouquet();
                    }}
                    disabled={!bouquetUnlocked}
                  >
                    Bouquet
                  </button>
                  <button
                    type="button"
                    className="rounded-full px-5 py-2 text-[9px] uppercase tracking-[0.35em] transition hover:text-white lux-button"
                    onClick={() => {
                      setMenuOpen(false);
                      onReturnToGarden();
                    }}
                  >
                    Kembali ke taman
                  </button>
                </div>

                <div className="mt-6 flex items-center justify-center">
                  <button
                    type="button"
                    className="rounded-full px-6 py-2 text-[9px] uppercase tracking-[0.38em] text-white/70 transition hover:text-white lux-button"
                    onClick={() => setMenuOpen(false)}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
