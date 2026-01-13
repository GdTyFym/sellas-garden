'use client';

import { useEffect, useState } from 'react';

export type FlowerFormat = 'avif' | 'webp' | 'png';
export const flowerSizes = [256, 512, 1024] as const;
export type FlowerSize = (typeof flowerSizes)[number];

export const flowerBaseNames = [
  'flower-1',
  'flower-2',
  'flower-3',
  'flower-4',
  'flower-5',
  'flower-6',
  'flower-7',
  'flower-8',
  'flower-9',
  'flower-10',
  'flower-11',
  'flower-12',
  'flower-13',
  'flower-14',
  'flower-15',
  'flower-16',
  'flower-17',
  'flower-18',
  'flower-19',
  'flower-20',
  'flower-21',
  'flower-22',
  'flower-23',
  'flower-24',
  'flower-25',
  'flower-26',
  'flower-27',
  'flower-28',
  'flower-tulip'
] as const;

const DEFAULT_FLOWER_SIZE: FlowerSize = 512;
const FLOWER_PROBE = `/flowers/${flowerBaseNames[0]}-${DEFAULT_FLOWER_SIZE}`;
const BGM_OPUS_PROBE = '/audio/bgm.opus';

const supportsImageFormat = (format: 'avif' | 'webp') => {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const data = canvas.toDataURL(`image/${format}`);
    return data.startsWith(`data:image/${format}`);
  } catch {
    return false;
  }
};

const supportsOpus = () => {
  if (typeof document === 'undefined') return false;
  const audio = document.createElement('audio');
  return audio.canPlayType('audio/ogg; codecs="opus"') !== '';
};

const checkExists = async (url: string) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

let preferredFlowerFormatPromise: Promise<FlowerFormat> | null = null;
const resolvePreferredFlowerFormat = async (): Promise<FlowerFormat> => {
  if (typeof window === 'undefined') return 'png';
  if (!preferredFlowerFormatPromise) {
    preferredFlowerFormatPromise = (async () => {
      if (supportsImageFormat('avif') && (await checkExists(`${FLOWER_PROBE}.avif`))) {
        return 'avif';
      }
      if (supportsImageFormat('webp') && (await checkExists(`${FLOWER_PROBE}.webp`))) {
        return 'webp';
      }
      return 'png';
    })();
  }
  return preferredFlowerFormatPromise;
};

let preferredBgmSourcePromise: Promise<string> | null = null;
const resolvePreferredBgmSource = async (): Promise<string> => {
  if (typeof window === 'undefined') return '/audio/bgm.mp3';
  if (!preferredBgmSourcePromise) {
    preferredBgmSourcePromise = (async () => {
      if (supportsOpus() && (await checkExists(BGM_OPUS_PROBE))) {
        return BGM_OPUS_PROBE;
      }
      return '/audio/bgm.mp3';
    })();
  }
  return preferredBgmSourcePromise;
};

export const getFlowerSrc = (
  baseName: string,
  format: FlowerFormat,
  size?: FlowerSize
) => {
  const normalizedSize = format === 'png' ? undefined : size;
  return `/flowers/${baseName}${normalizedSize ? `-${normalizedSize}` : ''}.${format}`;
};

export const selectFlowerSize = ({
  perfTier,
  dpr
}: {
  perfTier: 'low' | 'mid' | 'high';
  dpr: number;
}): FlowerSize => {
  const baseSize = perfTier === 'low' ? 160 : perfTier === 'mid' ? 220 : 280;
  const target = baseSize * Math.min(3, Math.max(1, dpr));
  const cap = 512;
  const clamped = Math.min(target, cap);
  return flowerSizes.find((size) => size >= clamped) ?? flowerSizes[flowerSizes.length - 1];
};

export const defaultFlowerSize = DEFAULT_FLOWER_SIZE;

export function usePreferredFlowerFormat() {
  const [format, setFormat] = useState<FlowerFormat>('png');

  useEffect(() => {
    let active = true;
    resolvePreferredFlowerFormat().then((next) => {
      if (active) setFormat(next);
    });
    return () => {
      active = false;
    };
  }, []);

  return format;
}

export function usePreferredBgmSource() {
  const [src, setSrc] = useState('/audio/bgm.mp3');

  useEffect(() => {
    let active = true;
    resolvePreferredBgmSource().then((next) => {
      if (active) setSrc(next);
    });
    return () => {
      active = false;
    };
  }, []);

  return src;
}
