export type Bloom = {
  id: string;
  x: number;
  y: number;
  size: number;
  src: string;
  rotation: number;
  swayDelay: number;
  layer: number;
};

export type PatternBloom = {
  id: string;
  x: number;
  y: number;
  size: number;
  src: string;
  rotation: number;
  opacity: number;
};

export type GlowOrb = {
  id: string;
  size: number;
  x: string;
  y: string;
  color: string;
  duration: number;
  delay: number;
};

export type Sparkle = {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
};

export type Ripple = {
  id: string;
  x: number;
  y: number;
  size: number;
};

export type ShootingStar = {
  id: string;
  x: number;
  y: number;
  length: number;
  angle: number;
  travelX: number;
  travelY: number;
  duration: number;
};

export type Aura = {
  id: string;
  x: number;
  y: number;
  size: number;
};

export type Petal = {
  id: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
  color: string;
};

export type Lantern = {
  id: string;
  x: number;
  duration: number;
  drift: number;
  litUntil?: number;
};

export type Timed<T> = T & { expiresAt: number };
