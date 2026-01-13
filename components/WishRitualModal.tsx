'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

type WishRitualModalProps = {
  open: boolean;
  initialText?: string;
  onSubmit: (text: string) => void;
  onClose: () => void;
};

export default function WishRitualModal({
  open,
  initialText = '',
  onSubmit,
  onClose
}: WishRitualModalProps) {
  const [draft, setDraft] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(initialText);
  }, [initialText, open]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const handleSubmit = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }, [draft, onSubmit]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, onClose]
  );

  const count = draft.length;
  const canSubmit = draft.trim().length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wish-ritual-title"
          aria-describedby="wish-ritual-desc"
          onKeyDown={handleKeyDown}
          onPointerDown={(event) => {
            event.stopPropagation();
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[rgba(5,6,8,0.75)]" />
          <motion.div
            className="relative w-full max-w-xl rounded-[32px] lux-border p-[1px] shadow-[0_0_120px_rgba(0,0,0,0.55)] lux-sheen"
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
                <p className="text-[10px] uppercase tracking-[0.5em] text-[var(--garden-gold)]/70 font-display">
                  Ritual Harapan
                </p>
                <h2
                  id="wish-ritual-title"
                  className="text-2xl font-display text-[var(--garden-ivory)]"
                >
                  Tuliskan satu doa
                </h2>
                <p id="wish-ritual-desc" className="text-sm text-white/70">
                  Kirimkan satu harapan lembut untuk langit malam.
                </p>
              </div>

              <div className="relative mt-6">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={200}
                  rows={5}
                  placeholder="Tulis harapanmu di sini..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-[rgba(216,181,107,0.6)] md:text-sm"
                />
                <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.32em] text-white/45 font-display">
                  <span>{count}/200</span>
                  <span>Ctrl+Enter untuk kirim</span>
                </div>
              </div>

              <div className="relative mt-6 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  className="lux-cut flex w-full max-w-[220px] items-center justify-center gap-2 px-4 py-2 text-[9px] uppercase tracking-[0.32em] transition hover:text-white lux-button sm:text-[10px] sm:tracking-[0.38em] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                >
                  <span className="h-1.5 w-1.5 lux-gem" />
                  Kirim ke Langit
                  <span className="h-1.5 w-1.5 lux-gem" />
                </button>
                <button
                  type="button"
                  className="rounded-full px-5 py-2 text-[9px] uppercase tracking-[0.32em] text-white/70 transition hover:text-white lux-button sm:text-[10px] sm:tracking-[0.38em]"
                  onClick={onClose}
                >
                  Nanti dulu
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
