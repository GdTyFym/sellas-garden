'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import type { ReactNode } from 'react';
import PreIntroGate from '@/components/PreIntroGate';

type IntroBurst = {
  id: string;
  x: number;
  y: number;
};

type IntroSpark = {
  id: string;
  x: number;
  y: number;
  size: number;
  driftX: number;
  driftY: number;
  delay: number;
  color: string;
};

type IntroPetal = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  driftX: number;
  driftY: number;
  rotation: number;
  delay: number;
  color: string;
};

type IntroFirework = {
  id: string;
  x: number;
  y: number;
  delay: number;
};

type IntroBloom = {
  id: string;
  x: number;
  y: number;
  size: number;
  src: string;
  rotation: number;
  delay: number;
};

type IntroGateProps = {
  gateComplete: boolean;
  onGateComplete: () => void;
  introVisible: boolean;
  introAnimating: boolean;
  introFlash: boolean;
  introBurst: IntroBurst | null;
  introSparks: IntroSpark[];
  introPetals: IntroPetal[];
  introFireworks: IntroFirework[];
  introBlooms: IntroBloom[];
  introRayCount: number;
  showIntroDust: boolean;
  showIntroPatternMotion: boolean;
  showIntroConstellation: boolean;
  showIntroOuterRing: boolean;
  showIntroBloomDetail: boolean;
  perfTier: 'low' | 'mid' | 'high';
  introCardContent: ReactNode;
};

export default function IntroGate({
  gateComplete,
  onGateComplete,
  introVisible,
  introAnimating,
  introFlash,
  introBurst,
  introSparks,
  introPetals,
  introFireworks,
  introBlooms,
  introRayCount,
  showIntroDust,
  showIntroPatternMotion,
  showIntroConstellation,
  showIntroOuterRing,
  showIntroBloomDetail,
  perfTier,
  introCardContent
}: IntroGateProps) {
  return (
    <>
      <AnimatePresence>
        {!gateComplete && <PreIntroGate onComplete={onGateComplete} />}
      </AnimatePresence>

      <AnimatePresence>
        {introVisible && (
          <motion.div
            className="fixed inset-0 z-[60] grid place-items-center overflow-hidden intro-shell"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pointer-events-none absolute inset-0 z-[0] intro-frame" />
            <div className="pointer-events-none absolute inset-0 z-[1] intro-edge-accent" />
            <div className="pointer-events-none absolute inset-0 z-[0] grain opacity-50" />
            <div className="pointer-events-none absolute inset-0 z-[0] bg-[radial-gradient(circle_at_50%_35%,_rgba(246,233,208,0.08),_transparent_58%)]" />
            <div className="pointer-events-none absolute inset-0 z-[0] intro-vignette" />
            {showIntroDust && (
              <div className="pointer-events-none absolute inset-0 z-[0] intro-dust" />
            )}
            <div
              className={`pointer-events-none absolute inset-0 z-[0] intro-bloom-pattern ${
                showIntroPatternMotion ? '' : 'intro-bloom-pattern-static'
              }`}
            />
            <div className="pointer-events-none absolute inset-0 z-[2] intro-corner-accent" />
            <div className="pointer-events-none absolute inset-[18px] z-[1] intro-inner-frame" />
            {showIntroConstellation && (
              <div className="pointer-events-none absolute inset-0 z-[1] intro-constellation">
                <span className="intro-star star-1" />
                <span className="intro-star star-2" />
                <span className="intro-star star-3" />
                <span className="intro-star star-4" />
                <span className="intro-star star-5" />
                <span className="intro-star star-6" />
              </div>
            )}
            <AnimatePresence>
              {introBlooms.length > 0 && (
                <motion.div
                  className="pointer-events-none absolute inset-0 z-[3] intro-bloom-stage"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                >
                  <div className="intro-bloom-aura" />
                  <div className="intro-bloom-veil" />
                  <div className="intro-bloom-ring intro-bloom-ring-1" />
                  {perfTier !== 'low' && (
                    <div
                      className={`intro-bloom-ring intro-bloom-ring-2 ${
                        perfTier === 'high' ? '' : 'intro-bloom-ring-static'
                      }`}
                    />
                  )}
                  {showIntroOuterRing && (
                    <div className="intro-bloom-ring intro-bloom-ring-3" />
                  )}
                  {showIntroBloomDetail && (
                    <>
                      <div className="intro-bloom-sweep" />
                      <div className="intro-bloom-crown" />
                      <div className="intro-bloom-filament intro-bloom-filament-1" />
                      <div className="intro-bloom-filament intro-bloom-filament-2" />
                      <div className="intro-bloom-glints">
                        <span className="intro-bloom-glint glint-1" />
                        <span className="intro-bloom-glint glint-2" />
                        <span className="intro-bloom-glint glint-3" />
                        <span className="intro-bloom-glint glint-4" />
                        <span className="intro-bloom-glint glint-5" />
                        <span className="intro-bloom-glint glint-6" />
                      </div>
                    </>
                  )}
                </motion.div>
              )}
              {introBlooms.map((bloom) => (
                <motion.div
                  key={bloom.id}
                  className="pointer-events-none absolute z-[4]"
                  style={{
                    left: bloom.x - bloom.size / 2,
                    top: bloom.y - bloom.size / 2,
                    width: bloom.size,
                    height: bloom.size
                  }}
                  initial={{ opacity: 0, scale: 0.2, rotate: bloom.rotation - 6 }}
                  animate={{ opacity: 0.95, scale: 1, rotate: bloom.rotation }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: perfTier === 'low' ? 1.6 : perfTier === 'mid' ? 2.1 : 2.4,
                    ease: 'easeOut',
                    delay: bloom.delay
                  }}
                >
                  <span className="intro-bloom-halo" />
                  <Image
                    src={bloom.src}
                    alt=""
                    width={Math.round(bloom.size)}
                    height={Math.round(bloom.size)}
                    sizes="(max-width: 768px) 35vw, 140px"
                    loading="lazy"
                    decoding="async"
                    className={`h-full w-full intro-bloom ${perfTier === 'low' ? 'intro-bloom-lite' : ''}`}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-1/2 intro-flap intro-flap-top"
              initial={false}
              animate={introAnimating ? { y: '-120%', scaleY: 0.9 } : { y: 0, scaleY: 1 }}
              transition={{ duration: 3.5, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-1/2 intro-flap intro-flap-bottom"
              initial={false}
              animate={introAnimating ? { y: '120%', scaleY: 0.9 } : { y: 0, scaleY: 1 }}
              transition={{ duration: 3.5, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
            />
            {introAnimating && (
              <motion.div
                className="pointer-events-none absolute left-1/2 top-1/2 z-[4] h-px w-[60%] -translate-x-1/2 intro-split-line"
                initial={{ opacity: 0, scaleX: 0.2 }}
                animate={{ opacity: [0, 1, 0], scaleX: [0.2, 1.1, 0.6] }}
                transition={{ duration: 2.4, ease: 'easeOut' }}
              />
            )}
            {introAnimating && (
              <div className="pointer-events-none absolute inset-0 z-[4] intro-sweep" />
            )}
            <AnimatePresence>
              {introFlash && (
                <motion.div
                  className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_center,_rgba(246,233,208,0.9),_rgba(216,181,107,0.35)_45%,_transparent_75%)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {introBurst && (
                <motion.div
                  key={introBurst.id}
                  className="pointer-events-none absolute inset-0 z-[1]"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.span
                    className="absolute rounded-full border border-[rgba(216,181,107,0.55)]"
                    style={{
                      width: 48,
                      height: 48,
                      left: introBurst.x - 24,
                      top: introBurst.y - 24
                    }}
                    initial={{ opacity: 0.9, scale: 0.2 }}
                    animate={{ opacity: 0, scale: 7 }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                  />
                  <motion.span
                    className="absolute rounded-full border border-[rgba(246,233,208,0.5)]"
                    style={{
                      width: 80,
                      height: 80,
                      left: introBurst.x - 40,
                      top: introBurst.y - 40
                    }}
                    initial={{ opacity: 0.8, scale: 0.2 }}
                    animate={{ opacity: 0, scale: 5.6 }}
                    transition={{ duration: 1.1, ease: 'easeOut', delay: 0.05 }}
                  />
                  <motion.span
                    className="absolute rounded-full"
                    style={{
                      width: 140,
                      height: 140,
                      left: introBurst.x - 70,
                      top: introBurst.y - 70,
                      background:
                        'radial-gradient(circle, rgba(248,240,220,0.7), rgba(216,181,107,0.35) 55%, transparent 70%)',
                      filter: 'blur(6px)'
                    }}
                    initial={{ opacity: 0.9, scale: 0.3 }}
                    animate={{ opacity: 0, scale: 2.2 }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                  />
                  {Array.from({ length: introRayCount }).map((_, index) => (
                    <motion.span
                      key={`ray-${index}`}
                      className="absolute h-[2px] w-28 rounded-full"
                      style={{
                        left: introBurst.x - 56,
                        top: introBurst.y - 1,
                        rotate: (360 / introRayCount) * index,
                        background:
                          'linear-gradient(90deg, rgba(216,181,107,0), rgba(216,181,107,0.9), rgba(216,181,107,0))'
                      }}
                      initial={{ opacity: 0, scaleX: 0.2 }}
                      animate={{ opacity: 0.85, scaleX: 1.2 }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: 0.05 }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {introFireworks.map((firework) => (
                <motion.div
                  key={firework.id}
                  className="pointer-events-none absolute inset-0 z-[1]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: firework.delay }}
                >
                  <motion.span
                    className="absolute rounded-full border border-[rgba(216,181,107,0.55)]"
                    style={{
                      width: 32,
                      height: 32,
                      left: firework.x - 16,
                      top: firework.y - 16
                    }}
                    initial={{ opacity: 0.85, scale: 0.2 }}
                    animate={{ opacity: 0, scale: 7 }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: firework.delay }}
                  />
                  <motion.span
                    className="absolute rounded-full border border-[rgba(246,233,208,0.5)]"
                    style={{
                      width: 56,
                      height: 56,
                      left: firework.x - 28,
                      top: firework.y - 28
                    }}
                    initial={{ opacity: 0.7, scale: 0.2 }}
                    animate={{ opacity: 0, scale: 4.8 }}
                    transition={{ duration: 1.1, ease: 'easeOut', delay: firework.delay + 0.05 }}
                  />
                  {Array.from({ length: introRayCount }).map((_, index) => (
                    <motion.span
                      key={`${firework.id}-ray-${index}`}
                      className="absolute h-[2px] w-24 rounded-full"
                      style={{
                        left: firework.x - 48,
                        top: firework.y - 1,
                        rotate: (360 / introRayCount) * index,
                        background:
                          'linear-gradient(90deg, rgba(216,181,107,0), rgba(246,233,208,0.9), rgba(216,181,107,0))'
                      }}
                      initial={{ opacity: 0, scaleX: 0.2 }}
                      animate={{ opacity: 0.85, scaleX: 1.1 }}
                      transition={{
                        duration: 1,
                        ease: 'easeOut',
                        delay: firework.delay + 0.08
                      }}
                    />
                  ))}
                </motion.div>
              ))}
            </AnimatePresence>
            <AnimatePresence>
              {introSparks.map((spark) => (
                <motion.span
                  key={spark.id}
                  className="pointer-events-none absolute z-[1] rounded-full"
                  style={{
                    width: spark.size,
                    height: spark.size,
                    left: spark.x - spark.size / 2,
                    top: spark.y - spark.size / 2,
                    background: spark.color,
                    boxShadow: `0 0 18px ${spark.color}`
                  }}
                  initial={{ opacity: 0, scale: 0.2 }}
                  animate={{
                    opacity: [0, 0.9, 0],
                    x: spark.driftX,
                    y: spark.driftY,
                    scale: [0.4, 1.1, 0.6]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1.1,
                    ease: 'easeOut',
                    delay: spark.delay
                  }}
                />
              ))}
            </AnimatePresence>
            <AnimatePresence>
              {introPetals.map((petal) => (
                <motion.span
                  key={petal.id}
                  className="pointer-events-none absolute z-[1]"
                  style={{
                    left: petal.x - petal.width / 2,
                    top: petal.y - petal.height / 2,
                    width: petal.width,
                    height: petal.height,
                    background: `linear-gradient(135deg, ${petal.color}, rgba(255,255,255,0.1))`,
                    borderRadius: '999px'
                  }}
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
                    duration: 1.1,
                    ease: 'easeOut',
                    delay: petal.delay
                  }}
                />
              ))}
            </AnimatePresence>

            <div className="relative z-[5] -translate-y-[8vh]">
              <div className="mx-auto flex w-[min(90vw,400px)] flex-col items-center gap-4 px-4 text-center">
                <div className="relative w-full">
                  <motion.div
                    className="relative"
                    initial={false}
                    animate={introAnimating ? { y: '120%' } : { y: 0 }}
                    transition={{
                      duration: introAnimating ? 3.5 : 0.8,
                      ease: [0.16, 1, 0.3, 1],
                      delay: introAnimating ? 0.25 : 0
                    }}
                  >
                    {introCardContent}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
