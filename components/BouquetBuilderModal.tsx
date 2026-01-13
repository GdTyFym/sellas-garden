'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Flower from '@/components/Flower';
import { bouquetConfig } from '@/lib/bouquet/bouquetConfig';
import type { BouquetState } from '@/lib/bouquet/bouquetState';
import {
  bouquetLayoutOptions,
  getBouquetLayout,
  type BouquetLayoutId
} from '@/lib/bouquet/bouquetLayout';
import {
  defaultFlowerSize,
  getFlowerSrc,
  usePreferredFlowerFormat
} from '@/lib/garden/assetSources';

type BouquetBuilderModalProps = {
  open: boolean;
  state: BouquetState;
  recipientName: string;
  giftDate: string;
  onClose: () => void;
  onSetSize: (size: number) => void;
  onSetSlot: (index: number, base: string) => void;
  onSetMessage: (value: string) => void;
  onSetLayout: (layoutId: BouquetLayoutId) => void;
  onRandomize: () => void;
  onReset: () => void;
};

export default function BouquetBuilderModal({
  open,
  state,
  recipientName,
  giftDate,
  onClose,
  onSetSize,
  onSetSlot,
  onSetMessage,
  onSetLayout,
  onRandomize,
  onReset
}: BouquetBuilderModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState(0);

  const flowerFormat = usePreferredFlowerFormat();
  const flowerSources = useMemo(
    () =>
      state.slots.map((base) => getFlowerSrc(base, flowerFormat, defaultFlowerSize)),
    [flowerFormat, state.slots]
  );
  const paletteSources = useMemo(
    () =>
      bouquetConfig.allowedFlowerBases.map((base) => ({
        base,
        src: getFlowerSrc(base, flowerFormat, 256)
      })),
    [flowerFormat]
  );
  const slotSources = useMemo(
    () => state.slots.map((base) => getFlowerSrc(base, flowerFormat, 256)),
    [flowerFormat, state.slots]
  );
  const layoutItems = useMemo(
    () => getBouquetLayout(state.layoutId, state.size),
    [state.layoutId, state.size]
  );
  const activeSlotBase = state.slots[activeSlot];

  useEffect(() => {
    if (activeSlot >= state.slots.length) {
      setActiveSlot(Math.max(0, state.slots.length - 1));
    }
  }, [activeSlot, state.slots.length]);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const { downloadBouquetCardPng } = await import('@/lib/bouquet/bouquetCard');
      await downloadBouquetCardPng({
        slots: state.slots,
        message: state.message,
        recipientName,
        giftDate,
        flowerFormat,
        flowerSize: 1024,
        layoutId: state.layoutId
      });
    } catch (error) {
      console.error(error);
      setDownloadError('Gagal menyiapkan kartu. Coba lagi ya.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleLayoutSelect = useCallback(
    (layoutId: BouquetLayoutId) => {
      onSetLayout(layoutId);
    },
    [onSetLayout]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center px-6"
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
            className="relative w-full max-w-5xl rounded-[32px] lux-border p-[1px] shadow-[0_0_120px_rgba(0,0,0,0.55)] lux-sheen"
            initial={{ scale: 0.94, y: 26, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22, mass: 0.9 }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="relative max-h-[82vh] overflow-y-auto rounded-[31px] px-6 py-8 text-center backdrop-blur-md sm:px-8 sm:py-10 lux-card lux-letter">
              <div className="pointer-events-none absolute inset-0 rounded-[31px] lux-engrave" />
              <div className="pointer-events-none absolute inset-[2px] rounded-[30px] letter-frame-soft" />
              <div className="relative flex flex-col items-center gap-3">
                <div className="flex items-center gap-3 opacity-80">
                  <span className="h-px w-12 lux-hairline" />
                  <span className="h-2 w-2 lux-gem" />
                  <span className="h-px w-12 lux-hairline" />
                </div>
                <p className="text-[11px] uppercase tracking-[0.5em] text-[var(--garden-gold)]/75 font-display">
                  Bouquet Atelier
                </p>
                <p className="text-[9px] uppercase tracking-[0.35em] text-white/45 font-display">
                  Pilih komposisi
                </p>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <div className="flex flex-col gap-5">
                  <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,_rgba(8,10,12,0.8),_rgba(16,18,20,0.9))] p-4 shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
                    <div
                      className="relative mx-auto h-[260px] w-[260px] sm:h-[300px] sm:w-[300px]"
                    >
                      <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top,_rgba(216,181,107,0.16),_transparent_62%)]" />
                      {flowerSources.map((src, index) => {
                        const layout = layoutItems[index] ?? layoutItems[0];
                        const active = index === activeSlot;
                        return (
                          <motion.button
                            key={`bouquet-flower-${index}`}
                            type="button"
                            className="absolute cursor-pointer"
                            style={{
                              left: `${layout.x}%`,
                              top: `${layout.y}%`,
                              width: `${layout.size}%`,
                              height: `${layout.size}%`,
                              transform: `translate(-50%, -50%) scale(${layout.scale})`
                            }}
                            onClick={() => setActiveSlot(index)}
                          >
                            <div
                              className={`absolute -inset-2 rounded-full transition ${
                                active
                                  ? 'border border-[rgba(216,181,107,0.65)] shadow-[0_0_24px_rgba(216,181,107,0.35)]'
                                  : 'border border-transparent'
                              }`}
                            />
                            <Flower
                              src={src}
                              rotation={layout.rotation}
                              swayDelay={index * 0.2}
                              motionLevel="low"
                            />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-3xl px-4 py-4 text-left backdrop-blur lux-plate">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-white/60 font-display">
                      Layout
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                      {bouquetLayoutOptions.map((option) => {
                        const isActive = state.layoutId === option.id;
                        const previewLayout = getBouquetLayout(option.id, state.size);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-3 text-[9px] uppercase tracking-[0.3em] transition ${
                              isActive
                                ? 'border-[var(--garden-gold)] text-white'
                                : 'border-white/10 text-white/55 hover:text-white/80'
                            }`}
                            onClick={() => handleLayoutSelect(option.id)}
                          >
                            <div className="relative h-14 w-14 rounded-xl border border-white/10 bg-[linear-gradient(180deg,_rgba(8,10,12,0.6),_rgba(16,18,20,0.85))]">
                              {previewLayout.slice(0, state.size).map((item, index) => {
                                const dotSize = Math.max(5, item.size * 0.12);
                                return (
                                  <span
                                    key={`${option.id}-dot-${index}`}
                                    className="absolute rounded-full bg-[rgba(216,181,107,0.8)]"
                                    style={{
                                      left: `${item.x}%`,
                                      top: `${item.y}%`,
                                      width: `${dotSize}px`,
                                      height: `${dotSize}px`,
                                      transform: 'translate(-50%, -50%)'
                                    }}
                                  />
                                );
                              })}
                            </div>
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-5 text-left">
                  <div className="rounded-3xl px-4 py-4 backdrop-blur lux-plate">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-white/60 font-display">
                      Size
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {bouquetConfig.sizeOptions.map((size) => (
                        <button
                          key={`size-${size}`}
                          type="button"
                          className={`rounded-full px-4 py-2 text-[9px] uppercase tracking-[0.35em] transition lux-button ${
                            state.size === size
                              ? 'text-white'
                              : 'text-white/60 hover:text-white'
                          }`}
                          onClick={() => onSetSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl px-4 py-4 backdrop-blur lux-plate">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-white/60 font-display">
                      Slots
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {slotSources.map((src, index) => {
                        const isActive = index === activeSlot;
                        return (
                          <button
                            key={`slot-select-${index}`}
                            type="button"
                            className={`relative h-12 w-12 overflow-hidden rounded-2xl border transition ${
                              isActive
                                ? 'border-[var(--garden-gold)] shadow-[0_0_18px_rgba(216,181,107,0.35)]'
                                : 'border-white/10 hover:border-white/40'
                            }`}
                            onClick={() => setActiveSlot(index)}
                          >
                            <Image
                              src={src}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-contain"
                              unoptimized
                              priority={false}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-3xl px-4 py-4 backdrop-blur lux-plate">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-white/60 font-display">
                      Flowers
                    </p>
                    <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
                      {paletteSources.map((item) => {
                        const isActive = item.base === activeSlotBase;
                        return (
                        <button
                          key={item.base}
                          type="button"
                          className={`relative h-14 w-14 overflow-hidden rounded-2xl border transition ${
                            isActive
                              ? 'border-[var(--garden-gold)] shadow-[0_0_16px_rgba(216,181,107,0.35)]'
                              : 'border-white/10 hover:border-[rgba(216,181,107,0.55)]'
                          }`}
                          onClick={() => onSetSlot(activeSlot, item.base)}
                        >
                          <Image
                            src={item.src}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-contain"
                            unoptimized
                            priority={false}
                          />
                        </button>
                      );
                      })}
                    </div>
                  </div>

                  <div className="rounded-3xl px-4 py-4 backdrop-blur lux-plate">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-[0.4em] text-white/60 font-display">
                        Message
                      </p>
                      <span className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-display">
                        {state.message.length}/{bouquetConfig.maxMessageLength}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={state.message}
                      maxLength={bouquetConfig.maxMessageLength}
                      placeholder="Short line (optional)"
                      onChange={(event) => onSetMessage(event.target.value)}
                      className="mt-3 w-full rounded-full bg-[rgba(12,14,16,0.6)] px-4 py-2 text-[12px] text-white/85 outline-none transition placeholder:text-white/35 focus:ring-2 focus:ring-[rgba(216,181,107,0.35)]"
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="rounded-full px-4 py-2 text-[9px] uppercase tracking-[0.35em] transition hover:text-white lux-button"
                      onClick={onRandomize}
                    >
                      Randomize
                    </button>
                    <button
                      type="button"
                      className="rounded-full px-4 py-2 text-[9px] uppercase tracking-[0.35em] transition hover:text-white lux-button"
                      onClick={onReset}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      className="rounded-full px-5 py-2 text-[9px] uppercase tracking-[0.35em] transition hover:text-white lux-button"
                      onClick={onClose}
                    >
                      Save + Close
                    </button>
                    <button
                      type="button"
                      className="rounded-full px-5 py-2 text-[9px] uppercase tracking-[0.35em] transition hover:text-white lux-button disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={handleDownload}
                      disabled={isDownloading}
                    >
                      {isDownloading ? 'Preparing...' : 'Download Card'}
                    </button>
                  </div>
                  {downloadError && (
                    <p className="text-[9px] uppercase tracking-[0.35em] text-red-200/80 font-display">
                      {downloadError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
