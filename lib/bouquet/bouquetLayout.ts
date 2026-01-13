export type BouquetLayoutItem = {
  x: number;
  y: number;
  size: number;
  rotation: number;
  scale: number;
};

export type BouquetLayoutPresetId =
  | 'classic'
  | 'cascade'
  | 'fan'
  | 'heart'
  | 'crown'
  | 'halo'
  | 'sweep'
  | 'oval'
  | 'tiered'
  | 'petal'
  | 'spire'
  | 'radiant';
export type BouquetLayoutId = BouquetLayoutPresetId;

export const bouquetLayoutPresets: Record<BouquetLayoutPresetId, BouquetLayoutItem[]> = {
  classic: [
    { x: 50, y: 60, size: 48, rotation: -2, scale: 1.08 },
    { x: 40, y: 46, size: 34, rotation: -12, scale: 0.96 },
    { x: 60, y: 46, size: 34, rotation: 12, scale: 0.96 },
    { x: 30, y: 60, size: 30, rotation: -18, scale: 0.9 },
    { x: 70, y: 60, size: 30, rotation: 18, scale: 0.9 },
    { x: 38, y: 76, size: 28, rotation: -10, scale: 0.86 },
    { x: 62, y: 76, size: 28, rotation: 10, scale: 0.86 },
    { x: 50, y: 34, size: 28, rotation: 0, scale: 0.82 },
    { x: 34, y: 38, size: 24, rotation: -14, scale: 0.78 },
    { x: 66, y: 38, size: 24, rotation: 14, scale: 0.78 },
    { x: 50, y: 86, size: 24, rotation: 0, scale: 0.8 }
  ],
  cascade: [
    { x: 48, y: 48, size: 44, rotation: -8, scale: 1.03 },
    { x: 30, y: 58, size: 38, rotation: -16, scale: 0.96 },
    { x: 64, y: 58, size: 38, rotation: 8, scale: 0.98 },
    { x: 22, y: 74, size: 30, rotation: -14, scale: 0.86 },
    { x: 52, y: 36, size: 30, rotation: -4, scale: 0.88 },
    { x: 72, y: 44, size: 30, rotation: 14, scale: 0.86 },
    { x: 78, y: 72, size: 32, rotation: 16, scale: 0.9 },
    { x: 24, y: 44, size: 26, rotation: -20, scale: 0.8 },
    { x: 68, y: 30, size: 26, rotation: 12, scale: 0.8 },
    { x: 16, y: 60, size: 24, rotation: -20, scale: 0.78 },
    { x: 84, y: 60, size: 24, rotation: 20, scale: 0.78 }
  ],
  fan: [
    { x: 50, y: 60, size: 46, rotation: 0, scale: 1.04 },
    { x: 26, y: 60, size: 36, rotation: -18, scale: 0.92 },
    { x: 74, y: 60, size: 36, rotation: 18, scale: 0.92 },
    { x: 36, y: 42, size: 32, rotation: -24, scale: 0.86 },
    { x: 64, y: 42, size: 32, rotation: 24, scale: 0.86 },
    { x: 42, y: 28, size: 28, rotation: -10, scale: 0.8 },
    { x: 58, y: 28, size: 28, rotation: 10, scale: 0.8 },
    { x: 24, y: 78, size: 26, rotation: -8, scale: 0.8 },
    { x: 76, y: 78, size: 26, rotation: 8, scale: 0.8 },
    { x: 12, y: 60, size: 24, rotation: -22, scale: 0.76 },
    { x: 88, y: 60, size: 24, rotation: 22, scale: 0.76 }
  ],
  heart: [
    { x: 50, y: 56, size: 44, rotation: -2, scale: 1.02 },
    { x: 34, y: 44, size: 34, rotation: -18, scale: 0.9 },
    { x: 66, y: 44, size: 34, rotation: 18, scale: 0.9 },
    { x: 28, y: 62, size: 30, rotation: -10, scale: 0.84 },
    { x: 72, y: 62, size: 30, rotation: 10, scale: 0.84 },
    { x: 50, y: 32, size: 28, rotation: 4, scale: 0.8 },
    { x: 50, y: 74, size: 28, rotation: -4, scale: 0.8 },
    { x: 24, y: 38, size: 26, rotation: -18, scale: 0.78 },
    { x: 76, y: 38, size: 26, rotation: 18, scale: 0.78 },
    { x: 16, y: 62, size: 24, rotation: 0, scale: 0.76 },
    { x: 84, y: 62, size: 24, rotation: 0, scale: 0.76 }
  ],
  crown: [
    { x: 50, y: 60, size: 44, rotation: -4, scale: 1.02 },
    { x: 30, y: 54, size: 34, rotation: -14, scale: 0.92 },
    { x: 70, y: 54, size: 34, rotation: 14, scale: 0.92 },
    { x: 20, y: 70, size: 30, rotation: -18, scale: 0.86 },
    { x: 80, y: 70, size: 30, rotation: 18, scale: 0.86 },
    { x: 50, y: 34, size: 30, rotation: 4, scale: 0.82 },
    { x: 50, y: 24, size: 24, rotation: 0, scale: 0.78 },
    { x: 34, y: 38, size: 26, rotation: -10, scale: 0.8 },
    { x: 66, y: 38, size: 26, rotation: 10, scale: 0.8 },
    { x: 14, y: 60, size: 24, rotation: -18, scale: 0.76 },
    { x: 86, y: 60, size: 24, rotation: 18, scale: 0.76 }
  ],
  halo: [
    { x: 50, y: 54, size: 40, rotation: 0, scale: 1 },
    { x: 50, y: 30, size: 30, rotation: 0, scale: 0.85 },
    { x: 72, y: 50, size: 30, rotation: 12, scale: 0.85 },
    { x: 28, y: 50, size: 30, rotation: -12, scale: 0.85 },
    { x: 50, y: 76, size: 30, rotation: 0, scale: 0.85 },
    { x: 66, y: 34, size: 26, rotation: 16, scale: 0.78 },
    { x: 34, y: 34, size: 26, rotation: -16, scale: 0.78 },
    { x: 36, y: 72, size: 24, rotation: -12, scale: 0.78 },
    { x: 64, y: 72, size: 24, rotation: 12, scale: 0.78 },
    { x: 26, y: 58, size: 22, rotation: -16, scale: 0.74 },
    { x: 74, y: 58, size: 22, rotation: 16, scale: 0.74 }
  ],
  sweep: [
    { x: 42, y: 56, size: 44, rotation: -8, scale: 1.02 },
    { x: 62, y: 46, size: 36, rotation: 16, scale: 0.94 },
    { x: 28, y: 70, size: 34, rotation: -18, scale: 0.9 },
    { x: 74, y: 62, size: 30, rotation: 18, scale: 0.86 },
    { x: 20, y: 48, size: 28, rotation: -22, scale: 0.82 },
    { x: 56, y: 32, size: 26, rotation: 10, scale: 0.8 },
    { x: 66, y: 78, size: 28, rotation: 14, scale: 0.82 },
    { x: 34, y: 40, size: 26, rotation: -14, scale: 0.8 },
    { x: 78, y: 46, size: 24, rotation: 18, scale: 0.78 },
    { x: 14, y: 52, size: 22, rotation: -22, scale: 0.74 },
    { x: 86, y: 52, size: 22, rotation: 22, scale: 0.74 }
  ],
  oval: [
    { x: 50, y: 56, size: 42, rotation: 0, scale: 1.02 },
    { x: 50, y: 32, size: 32, rotation: 0, scale: 0.9 },
    { x: 50, y: 78, size: 32, rotation: 0, scale: 0.9 },
    { x: 30, y: 54, size: 30, rotation: -12, scale: 0.86 },
    { x: 70, y: 54, size: 30, rotation: 12, scale: 0.86 },
    { x: 38, y: 38, size: 26, rotation: -6, scale: 0.8 },
    { x: 62, y: 38, size: 26, rotation: 6, scale: 0.8 },
    { x: 36, y: 72, size: 26, rotation: -8, scale: 0.8 },
    { x: 64, y: 72, size: 26, rotation: 8, scale: 0.8 },
    { x: 20, y: 60, size: 24, rotation: -20, scale: 0.74 },
    { x: 80, y: 60, size: 24, rotation: 20, scale: 0.74 }
  ],
  tiered: [
    { x: 50, y: 60, size: 44, rotation: -2, scale: 1.02 },
    { x: 50, y: 42, size: 34, rotation: 4, scale: 0.92 },
    { x: 50, y: 76, size: 34, rotation: -6, scale: 0.9 },
    { x: 34, y: 56, size: 30, rotation: -10, scale: 0.85 },
    { x: 66, y: 56, size: 30, rotation: 10, scale: 0.85 },
    { x: 36, y: 30, size: 26, rotation: -8, scale: 0.78 },
    { x: 64, y: 30, size: 26, rotation: 8, scale: 0.78 },
    { x: 34, y: 80, size: 26, rotation: -10, scale: 0.78 },
    { x: 66, y: 80, size: 26, rotation: 10, scale: 0.78 },
    { x: 18, y: 66, size: 24, rotation: -16, scale: 0.74 },
    { x: 82, y: 66, size: 24, rotation: 16, scale: 0.74 }
  ]
  ,
  petal: [
    { x: 50, y: 54, size: 42, rotation: 0, scale: 1.02 },
    { x: 42, y: 40, size: 34, rotation: -12, scale: 0.94 },
    { x: 58, y: 40, size: 34, rotation: 12, scale: 0.94 },
    { x: 28, y: 54, size: 30, rotation: -18, scale: 0.86 },
    { x: 72, y: 54, size: 30, rotation: 18, scale: 0.86 },
    { x: 25, y: 76, size: 28, rotation: -8, scale: 0.82 },
    { x: 75, y: 76, size: 28, rotation: 8, scale: 0.82 },
    { x: 50, y: 28, size: 26, rotation: 0, scale: 0.78 },
    { x: 50, y: 86, size: 26, rotation: 0, scale: 0.78 },
    { x: 16, y: 42, size: 24, rotation: -14, scale: 0.74 },
    { x: 84, y: 42, size: 24, rotation: 14, scale: 0.74 }
  ],
  spire: [
    { x: 50, y: 64, size: 44, rotation: -2, scale: 1.04 },
    { x: 50, y: 50, size: 36, rotation: 0, scale: 0.96 },
    { x: 50, y: 36, size: 34, rotation: 2, scale: 0.94 },
    { x: 38, y: 74, size: 32, rotation: -10, scale: 0.88 },
    { x: 62, y: 74, size: 32, rotation: 10, scale: 0.88 },
    { x: 32, y: 90, size: 28, rotation: -14, scale: 0.82 },
    { x: 68, y: 90, size: 28, rotation: 14, scale: 0.82 },
    { x: 36, y: 42, size: 28, rotation: -12, scale: 0.84 },
    { x: 64, y: 42, size: 28, rotation: 12, scale: 0.84 },
    { x: 18, y: 58, size: 24, rotation: -12, scale: 0.74 },
    { x: 82, y: 58, size: 24, rotation: 12, scale: 0.74 }
  ],
  radiant: [
    { x: 50, y: 54, size: 44, rotation: 0, scale: 1.04 },
    { x: 22, y: 52, size: 34, rotation: -24, scale: 0.92 },
    { x: 78, y: 52, size: 34, rotation: 24, scale: 0.92 },
    { x: 50, y: 30, size: 30, rotation: 0, scale: 0.86 },
    { x: 50, y: 78, size: 30, rotation: 0, scale: 0.86 },
    { x: 32, y: 36, size: 28, rotation: -16, scale: 0.82 },
    { x: 68, y: 36, size: 28, rotation: 16, scale: 0.82 },
    { x: 34, y: 74, size: 26, rotation: -14, scale: 0.8 },
    { x: 66, y: 74, size: 26, rotation: 14, scale: 0.8 },
    { x: 14, y: 62, size: 24, rotation: -14, scale: 0.74 },
    { x: 86, y: 62, size: 24, rotation: 14, scale: 0.74 }
  ]
};

export const bouquetLayoutOptions = [
  { id: 'classic', label: 'Classic' },
  { id: 'cascade', label: 'Cascade' },
  { id: 'fan', label: 'Fan' },
  { id: 'heart', label: 'Heart' },
  { id: 'crown', label: 'Crown' },
  { id: 'halo', label: 'Halo' },
  { id: 'sweep', label: 'Sweep' },
  { id: 'oval', label: 'Oval' },
  { id: 'tiered', label: 'Tiered' },
  { id: 'petal', label: 'Petal' },
  { id: 'spire', label: 'Spire' },
  { id: 'radiant', label: 'Radiant' }
] as const;

export const defaultBouquetLayoutId: BouquetLayoutPresetId = 'classic';

const defaultLayout = bouquetLayoutPresets[defaultBouquetLayoutId];

const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const spreadBouquetLayout = (layout: BouquetLayoutItem[], slotCount: number) => {
  if (slotCount <= 7) return layout;
  const extraSlots = Math.max(0, slotCount - 7);
  const spread = 1 + extraSlots * 0.035;
  const sizeScale = 1 - extraSlots * 0.03;
  const centerX = layout.reduce((sum, item) => sum + item.x, 0) / layout.length;
  const centerY = layout.reduce((sum, item) => sum + item.y, 0) / layout.length;
  return layout.map((item) => ({
    ...item,
    x: clampValue(centerX + (item.x - centerX) * spread, 12, 88),
    y: clampValue(centerY + (item.y - centerY) * spread, 18, 90),
    size: Math.max(20, item.size * sizeScale)
  }));
};

export const getBouquetLayout = (layoutId?: BouquetLayoutId, slotCount?: number) => {
  const base = bouquetLayoutPresets[layoutId ?? defaultBouquetLayoutId] ?? defaultLayout;
  if (!slotCount) return base;
  return spreadBouquetLayout(base, slotCount);
};
