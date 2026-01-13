'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';

type FinaleChoiceOverlayProps = {
  open: boolean;
  onPick: (choice: 'stars' | 'lanterns' | 'blooms' | 'random') => void;
  onClose: () => void;
};

export default function FinaleChoiceOverlay({
  open,
  onPick,
  onClose
}: FinaleChoiceOverlayProps) {
  const actionStampRef = useRef(0);
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, open]);

  const runAction = useCallback((action: () => void) => {
    const now = Date.now();
    if (now - actionStampRef.current < 300) return;
    actionStampRef.current = now;
    action();
  }, []);

  const handleBackdropPress = useCallback(
    (event: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      if (event.target !== event.currentTarget) return;
      runAction(onClose);
    },
    [onClose, runAction]
  );

  const handlePick = useCallback(
    (choice: 'stars' | 'lanterns' | 'blooms' | 'random') =>
      (event: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        runAction(() => onPick(choice));
      },
    [onPick, runAction]
  );

  const handleSkip = useCallback(
    (event: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      runAction(onClose);
    },
    [onClose, runAction]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="finale-choice-title"
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={handleBackdropPress}
          onClick={handleBackdropPress}
        >
          <div className="pointer-events-none absolute inset-0 bg-[rgba(5,6,8,0.72)]" />
          <motion.div
            className="relative w-full max-w-lg rounded-[32px] lux-border p-[1px] shadow-[0_0_120px_rgba(0,0,0,0.55)] lux-sheen"
            initial={{ scale: 0.95, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 190, damping: 22, mass: 0.9 }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-[31px] px-6 py-8 text-center backdrop-blur-md sm:px-8 sm:py-10 lux-card">
              <div className="pointer-events-none absolute inset-0 rounded-[31px] lux-engrave" />
              <div className="relative flex flex-col items-center gap-3">
                <div className="flex items-center gap-3 opacity-80">
                  <span className="h-px w-12 lux-hairline" />
                  <span className="h-2 w-2 lux-gem" />
                  <span className="h-px w-12 lux-hairline" />
                </div>
                <h2
                  id="finale-choice-title"
                  className="text-2xl font-display text-[var(--garden-ivory)]"
                >
                  Mau ditutup dengan apa?
                </h2>
              </div>

              <div className="relative mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="lux-cut flex items-center justify-center gap-2 px-4 py-2 text-[9px] uppercase tracking-[0.32em] transition hover:text-white lux-button sm:text-[10px] sm:tracking-[0.38em]"
                  onPointerUp={handlePick('stars')}
                  onClick={handlePick('stars')}
                >
                  <span className="h-1.5 w-1.5 lux-gem" />
                  Bintang
                  <span className="h-1.5 w-1.5 lux-gem" />
                </button>
                <button
                  type="button"
                  className="lux-cut flex items-center justify-center gap-2 px-4 py-2 text-[9px] uppercase tracking-[0.32em] transition hover:text-white lux-button sm:text-[10px] sm:tracking-[0.38em]"
                  onPointerUp={handlePick('lanterns')}
                  onClick={handlePick('lanterns')}
                >
                  <span className="h-1.5 w-1.5 lux-gem" />
                  Lampion
                  <span className="h-1.5 w-1.5 lux-gem" />
                </button>
                <button
                  type="button"
                  className="lux-cut flex items-center justify-center gap-2 px-4 py-2 text-[9px] uppercase tracking-[0.32em] transition hover:text-white lux-button sm:text-[10px] sm:tracking-[0.38em]"
                  onPointerUp={handlePick('blooms')}
                  onClick={handlePick('blooms')}
                >
                  <span className="h-1.5 w-1.5 lux-gem" />
                  Gelombang Bunga
                  <span className="h-1.5 w-1.5 lux-gem" />
                </button>
                <button
                  type="button"
                  className="lux-cut flex items-center justify-center gap-2 px-4 py-2 text-[9px] uppercase tracking-[0.32em] transition hover:text-white lux-button sm:text-[10px] sm:tracking-[0.38em]"
                  onPointerUp={handlePick('random')}
                  onClick={handlePick('random')}
                >
                  <span className="h-1.5 w-1.5 lux-gem" />
                  Surprise me
                  <span className="h-1.5 w-1.5 lux-gem" />
                </button>
              </div>

              <div className="relative mt-6 flex items-center justify-center">
                <button
                  type="button"
                  className="rounded-full px-5 py-2 text-[9px] uppercase tracking-[0.32em] text-white/70 transition hover:text-white lux-button sm:text-[10px] sm:tracking-[0.38em]"
                  onPointerUp={handleSkip}
                  onClick={handleSkip}
                >
                  Lewati
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
