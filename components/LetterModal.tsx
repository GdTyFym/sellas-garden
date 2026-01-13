'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { MotionValue } from 'framer-motion';

type LetterModalProps = {
  open: boolean;
  recipientName: string;
  displayedLetter: string;
  isTypingLetter: boolean;
  letterTypingDone: boolean;
  signatureText: string;
  tiltXStyle: number | MotionValue<number>;
  tiltYStyle: number | MotionValue<number>;
  onClose: () => void;
};

export default function LetterModal({
  open,
  recipientName,
  displayedLetter,
  isTypingLetter,
  letterTypingDone,
  signatureText,
  tiltXStyle,
  tiltYStyle,
  onClose
}: LetterModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-40 flex items-center justify-center px-6"
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
            className="relative max-w-2xl rounded-[32px] lux-border p-[1px] shadow-[0_0_120px_rgba(0,0,0,0.55)] lux-sheen"
            initial={{ scale: 0.94, y: 26, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 175, damping: 21, mass: 0.9 }}
            style={{
              rotateX: tiltXStyle,
              rotateY: tiltYStyle,
              transformPerspective: 1200
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="relative max-h-[78vh] overflow-y-hidden overflow-x-hidden rounded-[31px] px-5 py-8 text-center backdrop-blur-md sm:px-7 sm:py-10 md:max-h-[75vh] md:px-14 md:py-14 lux-card lux-letter shadow-[0_45px_140px_rgba(0,0,0,0.68)]">
              <div className="pointer-events-none absolute inset-0 rounded-[31px] letter-foil" />
              <div className="pointer-events-none absolute inset-[2px] rounded-[30px] letter-frame" />
              <div className="pointer-events-none absolute inset-[10px] rounded-[24px] letter-frame-soft" />
              <div className="pointer-events-none absolute inset-[16px] rounded-[22px] letter-frame-inner" />
              <div className="pointer-events-none absolute inset-0 rounded-[31px] letter-texture" />
              <div className="pointer-events-none absolute inset-0 rounded-[31px] lux-engrave" />
              <div className="pointer-events-none absolute inset-0 letter-watermark" />
              <span className="pointer-events-none absolute left-8 top-8 letter-corner letter-corner-tl" />
              <span className="pointer-events-none absolute right-8 top-8 letter-corner letter-corner-tr" />
              <span className="pointer-events-none absolute left-8 bottom-8 letter-corner letter-corner-bl" />
              <span className="pointer-events-none absolute right-8 bottom-8 letter-corner letter-corner-br" />
              <div className="relative flex flex-col items-center gap-3">
                <div className="flex items-center gap-3 opacity-80">
                  <span className="h-px w-12 lux-hairline" />
                  <span className="h-2 w-2 lux-gem" />
                  <span className="h-px w-12 lux-hairline" />
                </div>
                <motion.p
                  className="relative text-[11px] uppercase tracking-[0.5em] text-[var(--garden-gold)]/75 font-display"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                >
                  Untuk {recipientName}
                </motion.p>
              </div>
              <motion.p
                className="letter-body relative mt-6 max-w-[36rem] font-garden normal-case text-[clamp(13px,3.2vw,18px)] leading-[1.85] tracking-[0.01em] text-[var(--garden-ivory)]/90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                style={{ whiteSpace: 'pre-line' }}
              >
                {displayedLetter}
                {isTypingLetter && displayedLetter.length > 0 && (
                  <span className="type-cursor text-[var(--garden-gold)]" aria-hidden="true">
                    |
                  </span>
                )}
              </motion.p>
              <div className="relative mt-9 flex items-center justify-center">
                <span className="h-px w-24 bg-gradient-to-r from-transparent via-[rgba(216,181,107,0.7)] to-transparent" />
              </div>
              {letterTypingDone && (
                <motion.p
                  className="relative mt-5 font-garden italic normal-case text-[clamp(11px,2.4vw,16px)] tracking-[0.06em] text-[var(--garden-gold-strong)]/90"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.6, ease: 'easeOut' }}
                >
                  {signatureText}
                </motion.p>
              )}
              <div className="relative mt-6 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                  type="button"
                  className="lux-cut flex w-full max-w-[200px] items-center justify-center gap-2 px-4 py-2 text-[9px] uppercase tracking-[0.32em] transition hover:text-white lux-button sm:text-[10px] sm:tracking-[0.38em]"
                  onClick={onClose}
                >
                  <span className="h-1.5 w-1.5 lux-gem" />
                  Tutup
                  <span className="h-1.5 w-1.5 lux-gem" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
