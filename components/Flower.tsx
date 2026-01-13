'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { memo } from 'react';

type FlowerProps = {
  src: string;
  rotation: number;
  swayDelay: number;
  motionLevel?: 'low' | 'high';
};

const Flower = memo(function Flower({
  src,
  rotation,
  swayDelay,
  motionLevel = 'high'
}: FlowerProps) {
  const reducedMotion = useReducedMotion();
  const allowMotion = motionLevel === 'high' && !reducedMotion;
  const initialState = allowMotion
    ? { scale: 0.92, opacity: 0, rotate: rotation - 6 }
    : { scale: 0.96, opacity: 0, rotate: rotation - 6 };
  const animateState = allowMotion
    ? { scale: 1, opacity: 1, rotate: rotation }
    : { scale: 1, opacity: 1, rotate: rotation };
  const swayAnimation = allowMotion ? { rotate: [0, 2, -2, 0], y: [0, -6, 0] } : undefined;
  return (
    <motion.div
      className="relative h-full w-full"
      style={{ willChange: 'transform, opacity' }}
      initial={initialState}
      animate={animateState}
      transition={{ duration: allowMotion ? 1.8 : 1.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="absolute inset-0"
        animate={swayAnimation}
        transition={
          allowMotion
            ? { duration: 6, ease: 'easeInOut', repeat: Infinity, delay: swayDelay }
            : undefined
        }
      >
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 640px) 22vw, (max-width: 1024px) 16vw, 140px"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          unoptimized
          className="object-contain drop-shadow-[0_0_20px_rgba(216,181,107,0.25)]"
          priority={false}
          aria-hidden="true"
          role="presentation"
        />
      </motion.div>
    </motion.div>
  );
});

export default Flower;
