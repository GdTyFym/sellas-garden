import {
  defaultBouquetLayoutId,
  getBouquetLayout,
  type BouquetLayoutId
} from '@/lib/bouquet/bouquetLayout';
import { getFlowerSrc } from '@/lib/garden/assetSources';

export type BouquetCardInput = {
  slots: string[];
  message: string;
  recipientName: string;
  giftDate: string;
  layoutId?: BouquetLayoutId;
  flowerFormat?: 'avif' | 'webp' | 'png';
  flowerSize?: number;
};

type BouquetPlanItem = {
  base: string;
  src: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
};

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;
const DEFAULT_FLOWER_SIZE = 512;
const imageCache = new Map<string, Promise<HTMLImageElement>>();

const loadImage = (src: string) => {
  const cached = imageCache.get(src);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (img.decode) {
        img.decode().then(
          () => resolve(img),
          (error) => reject(error)
        );
      } else {
        resolve(img);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
  imageCache.set(src, promise);
  return promise;
};

const getBestFlowerSrc = (base: string, format: 'avif' | 'webp' | 'png', size: number) =>
  getFlowerSrc(base, format, size as 256 | 512 | 1024);

export const makeBouquetCardPlan = ({
  slots,
  canvasWidth,
  canvasHeight,
  flowerFormat,
  flowerSize,
  layoutId
}: {
  slots: string[];
  canvasWidth: number;
  canvasHeight: number;
  flowerFormat?: 'avif' | 'webp' | 'png';
  flowerSize?: number;
  layoutId?: BouquetLayoutId;
}): BouquetPlanItem[] => {
  const baseSize = Math.min(canvasWidth, canvasHeight);
  const size = flowerSize ?? DEFAULT_FLOWER_SIZE;
  const format = flowerFormat ?? 'webp';
  const layout = getBouquetLayout(layoutId ?? defaultBouquetLayoutId, slots.length);
  const plan = slots.map((base, index) => {
    const layoutItem = layout[index] ?? layout[layout.length - 1];
    const pixelSize = (baseSize * layoutItem.size * layoutItem.scale) / 100;
    return {
      base,
      src: getBestFlowerSrc(base, format, size),
      x: (layoutItem.x / 100) * canvasWidth,
      y: (layoutItem.y / 100) * canvasHeight,
      size: pixelSize,
      rotation: (layoutItem.rotation * Math.PI) / 180
    };
  });
  return fitPlanToSafeArea(plan, canvasWidth, canvasHeight);
};

const getPlanBounds = (plan: BouquetPlanItem[]) => {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  plan.forEach((item) => {
    const half = item.size / 2;
    minX = Math.min(minX, item.x - half);
    maxX = Math.max(maxX, item.x + half);
    minY = Math.min(minY, item.y - half);
    maxY = Math.max(maxY, item.y + half);
  });
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
};

const fitPlanToSafeArea = (plan: BouquetPlanItem[], width: number, height: number) => {
  if (plan.length === 0) return plan;
  const safeRect = {
    left: width * 0.08,
    right: width * 0.92,
    top: height * 0.25,
    bottom: height * 0.86
  };
  const bounds = getPlanBounds(plan);
  const safeWidth = safeRect.right - safeRect.left;
  const safeHeight = safeRect.bottom - safeRect.top;
  const scale = Math.min(1.08, safeWidth / bounds.width, safeHeight / bounds.height);
  let adjusted = plan.map((item) => ({
    ...item,
    size: item.size * scale,
    x: bounds.centerX + (item.x - bounds.centerX) * scale,
    y: bounds.centerY + (item.y - bounds.centerY) * scale
  }));

  const scaledBounds = getPlanBounds(adjusted);
  let shiftX = 0;
  let shiftY = 0;
  if (scaledBounds.minX < safeRect.left) {
    shiftX = safeRect.left - scaledBounds.minX;
  } else if (scaledBounds.maxX > safeRect.right) {
    shiftX = safeRect.right - scaledBounds.maxX;
  }
  if (scaledBounds.minY < safeRect.top) {
    shiftY = safeRect.top - scaledBounds.minY;
  } else if (scaledBounds.maxY > safeRect.bottom) {
    shiftY = safeRect.bottom - scaledBounds.maxY;
  }

  if (shiftX !== 0 || shiftY !== 0) {
    adjusted = adjusted.map((item) => ({
      ...item,
      x: item.x + shiftX,
      y: item.y + shiftY
    }));
  }

  return adjusted;
};

const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0b0d11');
  gradient.addColorStop(0.35, '#10161b');
  gradient.addColorStop(0.7, '#0c1014');
  gradient.addColorStop(1, '#07080a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  drawSilkSheen(ctx, width, height);
  drawGoldVeil(ctx, width, height);
  drawBackgroundDust(ctx, width, height);
  drawGoldFrame(ctx, width, height);

  const glow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.3,
    width * 0.1,
    width * 0.5,
    height * 0.3,
    width * 0.8
  );
  glow.addColorStop(0, 'rgba(216,181,107,0.22)');
  glow.addColorStop(0.6, 'rgba(216,181,107,0.05)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(
    width * 0.5,
    height * 0.55,
    width * 0.4,
    width * 0.5,
    height * 0.55,
    width * 0.9
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
};

const drawSilkSheen = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.save();
  const sheen = ctx.createLinearGradient(0, height * 0.15, width * 0.75, height * 0.85);
  sheen.addColorStop(0, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.4, 'rgba(255,255,255,0.05)');
  sheen.addColorStop(0.6, 'rgba(216,181,107,0.06)');
  sheen.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sheen;
  ctx.globalCompositeOperation = 'screen';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
};

const drawBackgroundDust = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 160; i += 1) {
    const x = (i * 73) % width;
    const y = (i * 157) % height;
    const size = 0.6 + ((i % 5) * 0.25);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

const drawGoldVeil = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.save();
  ctx.globalAlpha = 0.12;
  const gradient = ctx.createLinearGradient(0, height * 0.05, width * 0.7, height);
  gradient.addColorStop(0, 'rgba(255,255,255,0.16)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.03)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(216,181,107,0.18)';
  ctx.beginPath();
  ctx.ellipse(width * 0.52, height * 0.32, width * 0.32, height * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawGoldFrame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.save();
  ctx.lineJoin = 'round';
  const outer = 26;
  const inner = 32;
  const frameGradient = ctx.createLinearGradient(0, 0, width, 0);
  frameGradient.addColorStop(0, 'rgba(216,181,107,0.15)');
  frameGradient.addColorStop(0.5, 'rgba(255,244,219,0.6)');
  frameGradient.addColorStop(1, 'rgba(216,181,107,0.15)');

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(outer, outer, width - outer * 2, height - outer * 2);

  ctx.strokeStyle = frameGradient;
  ctx.lineWidth = 2;
  ctx.strokeRect(inner, inner, width - inner * 2, height - inner * 2);

  ctx.strokeStyle = 'rgba(216,181,107,0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 10]);
  ctx.strokeRect(inner + 6, inner + 6, width - (inner + 6) * 2, height - (inner + 6) * 2);
  ctx.setLineDash([]);

  drawOrnateCorners(ctx, width, height, inner + 2, 18);
  ctx.restore();
};

const drawOrnateCorners = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  inset: number,
  length: number
) => {
  ctx.save();
  ctx.strokeStyle = 'rgba(216,181,107,0.45)';
  ctx.lineWidth = 1.2;
  const corners = [
    [inset, inset, 1, 1],
    [width - inset, inset, -1, 1],
    [inset, height - inset, 1, -1],
    [width - inset, height - inset, -1, -1]
  ] as const;

  corners.forEach(([x, y, dirX, dirY]) => {
    ctx.beginPath();
    ctx.moveTo(x, y + dirY * length);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dirX * length, y);
    ctx.stroke();
  });
  ctx.restore();
};

const drawOrnateDivider = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  width: number
) => {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - width / 2, y);
  ctx.lineTo(centerX + width / 2, y);
  ctx.stroke();

  ctx.fillStyle = 'rgba(216,181,107,0.7)';
  ctx.beginPath();
  ctx.moveTo(centerX, y - 6);
  ctx.lineTo(centerX + 8, y);
  ctx.lineTo(centerX, y + 6);
  ctx.lineTo(centerX - 8, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const drawTextBlock = (
  ctx: CanvasRenderingContext2D,
  {
    recipientName,
    giftDate,
    message,
    width,
    height
  }: {
    recipientName: string;
    giftDate: string;
    message: string;
    width: number;
    height: number;
  }
) => {
  ctx.save();
  ctx.fillStyle = 'rgba(246,233,208,0.9)';
  ctx.textAlign = 'center';
  const centerX = width / 2;
  const headerHeight = height * 0.18;

  // subtle brushed halo behind the header text
  ctx.save();
  const headerGradient = ctx.createLinearGradient(0, 0, 0, headerHeight);
  headerGradient.addColorStop(0, 'rgba(0,0,0,0)');
  headerGradient.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = headerGradient;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillRect(0, 0, width, headerHeight);
  ctx.restore();

  ctx.save();
  ctx.font = '600 18px "Cinzel", serif';
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fillText('BOUQUET ATELIER', centerX, height * 0.08);
  ctx.restore();

  drawOrnateDivider(ctx, centerX, height * 0.115, 260);

  ctx.save();
  ctx.font = '700 62px "Cinzel", serif';
  const nameGradient = ctx.createLinearGradient(centerX - 180, 0, centerX + 180, 0);
  nameGradient.addColorStop(0, 'rgba(243,226,195,0.95)');
  nameGradient.addColorStop(0.5, 'rgba(255,248,232,1)');
  nameGradient.addColorStop(1, 'rgba(221,190,125,0.95)');
  ctx.fillStyle = nameGradient;
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 18;
  ctx.fillText(recipientName || 'For you', centerX, height * 0.185);
  ctx.restore();

  ctx.save();
  ctx.shadowColor = 'transparent';
  ctx.font = '400 24px "Cormorant Garamond", serif';
  ctx.fillStyle = 'rgba(216,181,107,0.88)';
  ctx.fillText(giftDate || '', centerX, height * 0.245);
  ctx.restore();

  const trimmedMessage = message.trim();
  if (trimmedMessage.length > 0) {
    ctx.save();
    const messageHeight = height * 0.08;
    const messageTop = height * 0.865;
    const plaqueGradient = ctx.createLinearGradient(0, messageTop - messageHeight, 0, messageTop);
    plaqueGradient.addColorStop(0, 'rgba(18,20,24,0.85)');
    plaqueGradient.addColorStop(1, 'rgba(8,10,12,0.9)');
    ctx.fillStyle = plaqueGradient;
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(centerX - 178, messageTop - messageHeight, 356, messageHeight, 12);
    ctx.fill();

    ctx.strokeStyle = 'rgba(216,181,107,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.font = '400 26px "Cormorant Garamond", serif';
    ctx.fillStyle = 'rgba(246,233,208,0.95)';
    ctx.fillText(trimmedMessage, centerX, messageTop - messageHeight / 2);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = 'rgba(246,233,208,0.8)';
    ctx.beginPath();
    ctx.ellipse(centerX, height * 0.92, 56, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
};

const drawFlower = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  item: BouquetPlanItem
) => {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate(item.rotation);
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = Math.max(6, item.size * 0.08);
  ctx.shadowOffsetY = item.size * 0.04;
  ctx.drawImage(image, -item.size / 2, -item.size / 2, item.size, item.size);
  ctx.restore();
};

const resolveFlowerImage = async (
  base: string,
  format: 'avif' | 'webp' | 'png',
  size: number
) => {
  const primarySrc = getBestFlowerSrc(base, format, size);
  try {
    return await loadImage(primarySrc);
  } catch (error) {
    if (format === 'avif') {
      const fallbackSrc = getBestFlowerSrc(base, 'webp', size);
      return loadImage(fallbackSrc);
    }
    if (format === 'webp') {
      const fallbackSrc = getBestFlowerSrc(base, 'png', size);
      return loadImage(fallbackSrc);
    }
    throw error;
  }
};

const downloadCanvas = (canvas: HTMLCanvasElement) =>
  new Promise<void>((resolve) => {
    const finish = (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bouquet-card.png';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 800);
      resolve();
    };

    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (blob) {
          finish(blob);
        } else {
          const dataUrl = canvas.toDataURL('image/png');
          const binary = atob(dataUrl.split(',')[1] || '');
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
          }
          finish(new Blob([bytes], { type: 'image/png' }));
        }
      }, 'image/png');
    } else {
      const dataUrl = canvas.toDataURL('image/png');
      const binary = atob(dataUrl.split(',')[1] || '');
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      finish(new Blob([bytes], { type: 'image/png' }));
    }
  });

export const downloadBouquetCardPng = async (input: BouquetCardInput) => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness failures.
    }
  }

  drawBackground(ctx, canvas.width, canvas.height);

  const plan = makeBouquetCardPlan({
    slots: input.slots,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    flowerFormat: input.flowerFormat,
    flowerSize: input.flowerSize,
    layoutId: input.layoutId
  });

  const format = input.flowerFormat ?? 'webp';
  const size = input.flowerSize ?? DEFAULT_FLOWER_SIZE;
  const sizeCandidates = Array.from(
    new Set(format === 'png' ? [size] : [size, 512, 256])
  ).filter((candidate) => candidate > 0);
  let images: HTMLImageElement[] | null = null;
  let lastError: unknown = null;

  for (const candidate of sizeCandidates) {
    try {
      images = await Promise.all(
        plan.map((item) => resolveFlowerImage(item.base, format, candidate))
      );
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!images) {
    throw lastError ?? new Error('Failed to prepare bouquet artwork');
  }

  const renderItems = plan
    .map((item, index) => ({ item, image: images[index] }))
    .sort((a, b) => (a.item.y === b.item.y ? a.item.size - b.item.size : a.item.y - b.item.y));

  renderItems.forEach(({ image, item }) => {
    drawFlower(ctx, image, item);
  });

  drawTextBlock(ctx, {
    recipientName: input.recipientName,
    giftDate: input.giftDate,
    message: input.message,
    width: canvas.width,
    height: canvas.height
  });

  await downloadCanvas(canvas);
};
