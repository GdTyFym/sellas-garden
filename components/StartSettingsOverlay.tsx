'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

type StartSettingsOverlayProps = {
  open: boolean;
  isMuted: boolean;
  perfTier: 'low' | 'mid' | 'high';
  brightness: number;
  rememberChoice: boolean;
  onSetMuted: (muted: boolean) => void;
  onSelectPerf: (tier: 'low' | 'mid' | 'high') => void;
  onSetBrightness: (value: number) => void;
  onToggleRemember: (value: boolean) => void;
  onResetDefaults: () => void;
  onContinue: () => void;
};

const perfOptions = [
  { id: 'low', label: 'Hemat', hint: 'Paling ringan' },
  { id: 'mid', label: 'Normal', hint: 'Seimbang' },
  { id: 'high', label: 'Cinematic', hint: 'Paling indah' }
] as const;

export default function StartSettingsOverlay({
  open,
  isMuted,
  perfTier,
  brightness,
  rememberChoice,
  onSetMuted,
  onSelectPerf,
  onSetBrightness,
  onToggleRemember,
  onResetDefaults,
  onContinue
}: StartSettingsOverlayProps) {
  const continueRef = useRef<HTMLButtonElement | null>(null);
  const [supportsFullscreen, setSupportsFullscreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (open) {
      continueRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const canFullscreen = Boolean(document.documentElement?.requestFullscreen);
    setSupportsFullscreen(canFullscreen);
    if (!canFullscreen) return;

    const handleChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    handleChange();
    document.addEventListener('fullscreenchange', handleChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
    };
  }, []);

  const handleFullscreenToggle = () => {
    if (!supportsFullscreen || typeof document === 'undefined') return;
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
      return;
    }
    void document.documentElement.requestFullscreen?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex min-h-[100svh] items-center justify-center px-4 py-4 sm:px-6 sm:py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="absolute inset-0 lux-backdrop" />
          <div className="absolute inset-0 aurora opacity-60" />
          <div className="absolute inset-0 mist-drift opacity-55" />
          <div className="absolute inset-0 sky-grid opacity-35" />
          <div className="absolute inset-0 golden-dust opacity-45" />
          <div className="absolute inset-0 lux-vignette opacity-70" />
          <div className="absolute inset-0 grain opacity-40" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-settings-title"
            className="relative w-full max-w-[560px] rounded-[36px] p-[1px] shadow-[0_45px_160px_rgba(0,0,0,0.65)] preflight-frame lux-sheen sm:max-w-3xl"
            initial={{ scale: 0.94, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22, mass: 0.9 }}
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onContinue();
              }
            }}
          >
            <div className="relative overflow-hidden rounded-[35px] lux-card preflight-panel">
              <div className="pointer-events-none absolute inset-0 rounded-[35px] preflight-engrave" />
              <div className="pointer-events-none absolute inset-[2px] rounded-[33px] preflight-inner" />
              <div className="pointer-events-none absolute -left-24 top-10 h-52 w-52 preflight-halo" />
              <div className="pointer-events-none absolute -right-20 bottom-0 h-48 w-48 preflight-halo preflight-halo-soft" />

              <div className="relative px-5 py-6 text-center sm:px-10 sm:py-9">
                <div className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-7 md:text-left">
                  <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
                    <div className="flex items-center gap-3 opacity-80">
                      <span className="h-px w-12 lux-hairline" />
                      <span className="h-2 w-2 lux-gem" />
                      <span className="h-px w-12 lux-hairline" />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.5em] text-[var(--garden-gold)]/75 font-display sm:text-[11px] sm:tracking-[0.6em]">
                      Siapkan suasananya
                    </p>
                    <h2
                      id="start-settings-title"
                      className="text-[clamp(18px,6.2vw,30px)] font-display text-[var(--garden-ivory)] tracking-[0.1em] text-glow sm:text-[clamp(22px,4.4vw,32px)] sm:tracking-[0.12em]"
                    >
                      Biar momennya terasa pas.
                    </h2>
                    <p className="max-w-sm text-[12px] leading-[1.6] text-white/65 sm:text-sm sm:leading-[1.7]">
                      Biar momen kecil ini terasa pas. Pilih suasana favoritmu dulu.
                    </p>
                    <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.32em] text-white/45 sm:text-[10px] sm:tracking-[0.45em]">
                      <span className="lux-crest" />
                      <span>Profil bisa diubah kapan saja</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5 md:border-l md:border-white/10 md:pl-8">
                    <div className="flex flex-col gap-2">
                      <p className="text-[9px] uppercase tracking-[0.4em] text-white/60 font-display sm:text-[10px]">
                        Suara
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                        <button
                          type="button"
                          aria-pressed={!isMuted}
                          className={`rounded-full px-3 py-2 text-[8px] uppercase tracking-[0.32em] transition preflight-toggle sm:px-4 sm:text-[9px] ${
                            !isMuted ? 'preflight-toggle-active' : ''
                          }`}
                          onClick={() => onSetMuted(false)}
                        >
                          Nyala
                        </button>
                        <button
                          type="button"
                          aria-pressed={isMuted}
                          className={`rounded-full px-3 py-2 text-[8px] uppercase tracking-[0.32em] transition preflight-toggle sm:px-4 sm:text-[9px] ${
                            isMuted ? 'preflight-toggle-active' : ''
                          }`}
                          onClick={() => onSetMuted(true)}
                        >
                          Mati
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="text-[9px] uppercase tracking-[0.4em] text-white/60 font-display sm:text-[10px]">
                        Kualitas visual
                      </p>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {perfOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            aria-pressed={perfTier === option.id}
                            className={`rounded-2xl px-2.5 py-2 text-center text-[8px] uppercase tracking-[0.26em] transition preflight-option sm:px-4 sm:py-3 sm:text-[9px] sm:tracking-[0.28em] md:text-left md:tracking-[0.32em] ${
                              perfTier === option.id ? 'preflight-option-active' : ''
                            }`}
                            onClick={() => onSelectPerf(option.id)}
                          >
                            <div className="flex items-center justify-center gap-2 md:justify-between">
                              <span className="block text-[9px] tracking-[0.24em] sm:text-[10px] sm:tracking-[0.28em] md:text-[11px] md:tracking-[0.32em]">
                                {option.label}
                              </span>
                              {perfTier === option.id && (
                                <span className="hidden lg:inline-flex preflight-tag rounded-full px-2 py-1 text-[8px] uppercase tracking-[0.3em]">
                                  Rekomendasi
                                </span>
                              )}
                            </div>
                            <span className="mt-1 hidden text-[9px] uppercase tracking-[0.28em] text-white/45 md:block">
                              {option.hint}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="text-[9px] uppercase tracking-[0.4em] text-white/60 font-display sm:text-[10px]">
                        Kecerahan
                      </p>
                      <div className="flex items-center gap-3 rounded-2xl px-3 py-2 preflight-foot">
                        <input
                          type="range"
                          min={0.7}
                          max={1.3}
                          step={0.05}
                          value={brightness}
                          onChange={(event) => onSetBrightness(Number(event.target.value))}
                          className="h-1 w-full accent-[var(--garden-gold)]"
                        />
                        <span className="text-[9px] uppercase tracking-[0.3em] text-white/65 font-display">
                          {Math.round(brightness * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-3 py-2 text-[8px] uppercase tracking-[0.32em] text-white/60 preflight-foot sm:px-4 sm:py-3 sm:text-[9px] sm:tracking-[0.35em]">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={rememberChoice}
                          onChange={(event) => onToggleRemember(event.target.checked)}
                          className="h-4 w-4 rounded border-white/20 bg-transparent accent-[var(--garden-gold)]"
                        />
                        Ingat pilihanku
                      </label>
                      <button
                        type="button"
                        className="text-white/50 transition hover:text-white/80"
                        onClick={onResetDefaults}
                      >
                        Reset ke default
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-center gap-3 sm:mt-7">
                  <button
                    ref={continueRef}
                    type="button"
                    className="w-full max-w-[220px] rounded-full px-7 py-3 text-[9px] uppercase tracking-[0.45em] transition hover:text-white preflight-cta lux-sheen font-display sm:text-[10px] sm:tracking-[0.5em]"
                    onClick={onContinue}
                  >
                    Mulai
                  </button>
                  {supportsFullscreen && (
                    <button
                      type="button"
                      className="rounded-full px-6 py-2 text-[8px] uppercase tracking-[0.4em] transition preflight-toggle sm:text-[9px]"
                      onClick={handleFullscreenToggle}
                    >
                      {isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
                    </button>
                  )}
                  <p className="text-[8px] uppercase tracking-[0.32em] text-white/45 sm:text-[9px] sm:tracking-[0.35em]">
                    Tenang, ini bisa diubah nanti.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
