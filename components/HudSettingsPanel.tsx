'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

type HudSettingsPanelProps = {
  open: boolean;
  onClose: () => void;
  muted: boolean;
  setMuted: (next: boolean) => void;
  perf: 'low' | 'mid' | 'high';
  setPerf: (next: 'low' | 'mid' | 'high') => void;
  brightness: number;
  setBrightness: (value: number) => void;
};

const perfOptions = [
  { id: 'low', label: 'Hemat' },
  { id: 'mid', label: 'Normal' },
  { id: 'high', label: 'Cinematic' }
] as const;

export default function HudSettingsPanel({
  open,
  onClose,
  muted,
  setMuted,
  perf,
  setPerf,
  brightness,
  setBrightness
}: HudSettingsPanelProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[65] flex items-start justify-end px-5 py-6 sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={(event) => {
            event.stopPropagation();
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            role="dialog"
            aria-label="Pengaturan"
            className="relative w-[min(92vw,280px)] rounded-2xl p-4 text-white/80 backdrop-blur-md lux-card lux-sheen"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ type: 'spring', stiffness: 190, damping: 20, mass: 0.8 }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(216,181,107,0.16),_transparent_70%)]" />
            <div className="relative flex items-center justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.5em] text-[var(--garden-gold)]/75 font-display">
                Pengaturan
              </p>
              <button
                type="button"
                aria-label="Tutup pengaturan"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] text-white/70 transition hover:text-white lux-button"
                onClick={onClose}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <span aria-hidden="true">x</span>
              </button>
            </div>

            <div className="relative mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-[9px] uppercase tracking-[0.4em] text-white/60 font-display">
                  Suara
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={!muted}
                    className={`rounded-full px-3 py-2 text-[9px] uppercase tracking-[0.35em] transition lux-button ${
                      !muted ? 'text-white' : 'text-white/60 hover:text-white'
                    }`}
                    onClick={() => setMuted(false)}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    Nyala
                  </button>
                  <button
                    type="button"
                    aria-pressed={muted}
                    className={`rounded-full px-3 py-2 text-[9px] uppercase tracking-[0.35em] transition lux-button ${
                      muted ? 'text-white' : 'text-white/60 hover:text-white'
                    }`}
                    onClick={() => setMuted(true)}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    Mati
                  </button>
                </div>
              </div>

              <div className="h-px w-full bg-white/10" />

              <div className="flex flex-col gap-2">
                <p className="text-[9px] uppercase tracking-[0.4em] text-white/60 font-display">
                  Kualitas Visual
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {perfOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={perf === option.id}
                      className={`rounded-full px-3 py-2 text-[9px] uppercase tracking-[0.32em] transition lux-button ${
                        perf === option.id ? 'text-white' : 'text-white/60 hover:text-white'
                      }`}
                      onClick={() => setPerf(option.id)}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px w-full bg-white/10" />

              <div className="flex flex-col gap-2">
                <p className="text-[9px] uppercase tracking-[0.4em] text-white/60 font-display">
                  Kecerahan
                </p>
                <div className="flex items-center gap-3 rounded-full px-3 py-2 lux-plate">
                  <input
                    type="range"
                    min={0.7}
                    max={1.3}
                    step={0.05}
                    value={brightness}
                    onChange={(event) => setBrightness(Number(event.target.value))}
                    className="h-1 w-full accent-[var(--garden-gold)]"
                  />
                  <span className="text-[9px] uppercase tracking-[0.3em] text-white/65 font-display">
                    {Math.round(brightness * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
