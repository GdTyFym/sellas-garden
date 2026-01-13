'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

type GardenCanvasOverlayProps = {
  open: boolean;
  onClose: () => void;
};

type Tool = 'pen' | 'eraser' | 'stamp';
type InkStyleId = 'champagne' | 'rose' | 'sage' | 'ivory' | 'moonlight';
type BackgroundId = 'velvet' | 'moonlit' | 'champagne' | 'rose';
type StampId = 'heart' | 'infinity' | 'crest';

type InkStyle = {
  id: InkStyleId;
  label: string;
  colors: string[];
  shadow: string;
  glow: number;
  alpha: number;
  sparkle: string;
};

type BackgroundGlow = {
  x: number;
  y: number;
  radius: number;
  color: string;
};

type BackgroundStyle = {
  id: BackgroundId;
  label: string;
  colors: [string, string];
  glows: BackgroundGlow[];
  stars: number;
};

type StoredCanvasPayload = {
  version: 2;
  background: BackgroundId;
  drawing: string | null;
};

type StoredCanvasRead = StoredCanvasPayload | { legacy: string };

const STORAGE_KEY = 'garden_canvas_v1';
const STORAGE_MAX_DIMENSION = 1200;
const STORAGE_WEBP_QUALITY = 0.82;
const STORAGE_QUOTA_MESSAGE =
  'Gagal menyimpan: storage penuh. Coba hapus atau unduh dulu.';

const DEFAULT_BACKGROUND: BackgroundId = 'velvet';
const DEFAULT_INK: InkStyleId = 'champagne';
const DEFAULT_STAMP: StampId = 'heart';

const INK_STYLES: InkStyle[] = [
  {
    id: 'champagne',
    label: 'Champagne',
    colors: ['#f7f2e8', '#d8b56b', '#f1ddb0'],
    shadow: 'rgba(216, 181, 107, 0.6)',
    glow: 18,
    alpha: 0.95,
    sparkle: 'rgba(246, 233, 208, 0.9)'
  },
  {
    id: 'rose',
    label: 'Rose',
    colors: ['#f6b7a9', '#f2a3b6', '#f7c9c3'],
    shadow: 'rgba(246, 183, 169, 0.55)',
    glow: 14,
    alpha: 0.9,
    sparkle: 'rgba(255, 220, 214, 0.9)'
  },
  {
    id: 'sage',
    label: 'Sage',
    colors: ['#b6e8d0', '#7fc8b0', '#d8f3e6'],
    shadow: 'rgba(182, 232, 208, 0.5)',
    glow: 12,
    alpha: 0.9,
    sparkle: 'rgba(216, 248, 236, 0.9)'
  },
  {
    id: 'ivory',
    label: 'Ivory',
    colors: ['#f7f2e8', '#e6dcc6', '#fff5df'],
    shadow: 'rgba(247, 242, 232, 0.45)',
    glow: 10,
    alpha: 0.9,
    sparkle: 'rgba(255, 250, 240, 0.85)'
  },
  {
    id: 'moonlight',
    label: 'Moonlight',
    colors: ['#d4e6ff', '#7aa6e6', '#c7d8ff'],
    shadow: 'rgba(155, 190, 255, 0.55)',
    glow: 16,
    alpha: 0.92,
    sparkle: 'rgba(210, 228, 255, 0.85)'
  }
];

const BACKGROUND_STYLES: BackgroundStyle[] = [
  {
    id: 'velvet',
    label: 'Velvet',
    colors: ['#060709', '#14181c'],
    glows: [
      { x: 0.2, y: 0.25, radius: 0.45, color: 'rgba(216, 181, 107, 0.2)' },
      { x: 0.82, y: 0.18, radius: 0.35, color: 'rgba(182, 232, 208, 0.12)' },
      { x: 0.5, y: 0.82, radius: 0.5, color: 'rgba(246, 233, 208, 0.08)' }
    ],
    stars: 92
  },
  {
    id: 'moonlit',
    label: 'Moonlit',
    colors: ['#05070b', '#101828'],
    glows: [
      { x: 0.2, y: 0.2, radius: 0.5, color: 'rgba(155, 190, 255, 0.18)' },
      { x: 0.78, y: 0.24, radius: 0.4, color: 'rgba(216, 181, 107, 0.12)' },
      { x: 0.45, y: 0.78, radius: 0.48, color: 'rgba(182, 232, 208, 0.1)' }
    ],
    stars: 118
  },
  {
    id: 'champagne',
    label: 'Champagne',
    colors: ['#120c09', '#251a13'],
    glows: [
      { x: 0.22, y: 0.28, radius: 0.42, color: 'rgba(216, 181, 107, 0.22)' },
      { x: 0.8, y: 0.22, radius: 0.36, color: 'rgba(246, 233, 208, 0.16)' },
      { x: 0.55, y: 0.78, radius: 0.46, color: 'rgba(182, 232, 208, 0.08)' }
    ],
    stars: 82
  },
  {
    id: 'rose',
    label: 'Rose',
    colors: ['#120b0c', '#1d1417'],
    glows: [
      { x: 0.24, y: 0.3, radius: 0.42, color: 'rgba(246, 183, 169, 0.2)' },
      { x: 0.8, y: 0.26, radius: 0.34, color: 'rgba(216, 181, 107, 0.12)' },
      { x: 0.5, y: 0.8, radius: 0.45, color: 'rgba(246, 233, 208, 0.1)' }
    ],
    stars: 90
  }
];

const STAMP_STYLES = [
  { id: 'heart', label: 'Hati' },
  { id: 'infinity', label: 'Infinity' },
  { id: 'crest', label: 'Crest' }
] as const;

const isQuotaExceededError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  const domError = error as DOMException & { code?: number };
  return (
    domError.name === 'QuotaExceededError' ||
    domError.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    domError.code === 22
  );
};

const getInkStyle = (id: InkStyleId) =>
  INK_STYLES.find((style) => style.id === id) ?? INK_STYLES[0];

const getBackgroundStyle = (id: BackgroundId) =>
  BACKGROUND_STYLES.find((style) => style.id === id) ?? BACKGROUND_STYLES[0];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const createRandom = (seed: number) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const drawStarfield = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  count: number,
  seedKey: string
) => {
  const seed = hashString(seedKey) + Math.round(width * 13) + Math.round(height * 7);
  const random = createRandom(seed);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < count; i += 1) {
    const x = random() * width;
    const y = random() * height;
    const size = 0.4 + random() * 1.4;
    const alpha = 0.2 + random() * 0.5;
    const roll = random();
    const color =
      roll > 0.86
        ? `rgba(182, 232, 208, ${alpha})`
        : roll > 0.65
          ? `rgba(216, 181, 107, ${alpha})`
          : `rgba(246, 233, 208, ${alpha})`;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

const drawRibbons = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.save();
  ctx.strokeStyle = 'rgba(216, 181, 107, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width * -0.1, height * 0.22);
  ctx.bezierCurveTo(
    width * 0.15,
    height * 0.1,
    width * 0.5,
    height * 0.28,
    width * 1.1,
    height * 0.12
  );
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(width * -0.05, height * 0.68);
  ctx.bezierCurveTo(
    width * 0.35,
    height * 0.5,
    width * 0.72,
    height * 0.82,
    width * 1.05,
    height * 0.62
  );
  ctx.stroke();
  ctx.restore();
};

type RoundRectFn = (x: number, y: number, w: number, h: number, r: number) => void;

const strokeRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const ctxRR = ctx as unknown as { roundRect?: RoundRectFn };

  if (typeof ctxRR.roundRect === "function") {
    ctx.beginPath();
    ctxRR.roundRect(x, y, width, height, radius);
    ctx.stroke();
    return;
  }

  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.stroke();
};

const drawSparkle = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const radius = 3 + Math.random() * 6;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
  glow.addColorStop(0, color);
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.9, y);
  ctx.lineTo(x + radius * 0.9, y);
  ctx.moveTo(x, y - radius * 0.9);
  ctx.lineTo(x, y + radius * 0.9);
  ctx.stroke();
  ctx.restore();
};

export default function GardenCanvasOverlay({ open, onClose }: GardenCanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const backgroundRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const bgCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const activePointerRef = useRef<number | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastSparkleRef = useRef(0);
  const historyRef = useRef<string[]>([]);
  const sizeRef = useRef({ width: 0, height: 0, ratio: 1 });
  const backgroundIdRef = useRef<BackgroundId>(DEFAULT_BACKGROUND);
  const frameEnabledRef = useRef(true);

  const [tool, setTool] = useState<Tool>('pen');
  const [inkStyleId, setInkStyleId] = useState<InkStyleId>(DEFAULT_INK);
  const [backgroundId, setBackgroundId] = useState<BackgroundId>(DEFAULT_BACKGROUND);
  const [stampId, setStampId] = useState<StampId>(DEFAULT_STAMP);
  const [brushSize, setBrushSize] = useState(4);
  const [stampSize, setStampSize] = useState(64);
  const [glowEnabled, setGlowEnabled] = useState(true);
  const [sparkleEnabled, setSparkleEnabled] = useState(true);
  const [guideEnabled, setGuideEnabled] = useState(false);
  const [frameEnabled, setFrameEnabled] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(true);

  const inkStyle = useMemo(() => getInkStyle(inkStyleId), [inkStyleId]);

  useEffect(() => {
    frameEnabledRef.current = frameEnabled;
  }, [frameEnabled]);

  useEffect(() => {
    backgroundIdRef.current = backgroundId;
  }, [backgroundId]);

  const setupCanvas = useCallback(() => {
    const wrapper = wrapperRef.current;
    const drawCanvas = canvasRef.current;
    const bgCanvas = backgroundRef.current;
    if (!wrapper || !drawCanvas || !bgCanvas) return;
    const rect = wrapper.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    sizeRef.current = { width, height, ratio };
    const configureCanvas = (canvas: HTMLCanvasElement) => {
      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.max(1, Math.floor(height * ratio));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      return ctx;
    };
    const drawCtx = configureCanvas(drawCanvas);
    const bgCtx = configureCanvas(bgCanvas);
    if (!drawCtx || !bgCtx) return;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    ctxRef.current = drawCtx;
    bgCtxRef.current = bgCtx;
  }, []);

  const paintBackground = useCallback((id: BackgroundId, withFrame: boolean) => {
    const ctx = bgCtxRef.current;
    const { width, height } = sizeRef.current;
    if (!ctx || !width || !height) return;
    const style = getBackgroundStyle(id);
    ctx.clearRect(0, 0, width, height);
    const baseGradient = ctx.createLinearGradient(0, 0, width, height);
    baseGradient.addColorStop(0, style.colors[0]);
    baseGradient.addColorStop(1, style.colors[1]);
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    style.glows.forEach((glow) => {
      const x = glow.x * width;
      const y = glow.y * height;
      const radius = glow.radius * Math.min(width, height);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, glow.color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    });
    ctx.restore();
    drawRibbons(ctx, width, height);
    drawStarfield(ctx, width, height, style.stars, style.id);
    if (withFrame) {
      const margin = Math.max(12, Math.min(width, height) * 0.05);
      const radius = Math.max(18, Math.min(width, height) * 0.08);
      const borderGradient = ctx.createLinearGradient(
        margin,
        margin,
        width - margin,
        height - margin
      );
      borderGradient.addColorStop(0, 'rgba(216, 181, 107, 0.5)');
      borderGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
      borderGradient.addColorStop(1, 'rgba(216, 181, 107, 0.35)');
      ctx.strokeStyle = borderGradient;
      ctx.lineWidth = 1.2;
      strokeRoundedRect(ctx, margin, margin, width - margin * 2, height - margin * 2, radius);
      ctx.strokeStyle = 'rgba(216, 181, 107, 0.2)';
      ctx.lineWidth = 0.8;
      strokeRoundedRect(
        ctx,
        margin + 10,
        margin + 10,
        width - (margin + 10) * 2,
        height - (margin + 10) * 2,
        Math.max(6, radius - 10)
      );
    }
  }, []);

  const drawImageToLayer = useCallback((image: CanvasImageSource) => {
    const ctx = ctxRef.current;
    const { width, height } = sizeRef.current;
    if (!ctx || !width || !height) return;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
  }, []);

  const createStorageSnapshot = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return null;
    const { width, height } = sizeRef.current;
    if (!width || !height) return null;
    const maxDimension = Math.max(width, height);
    const scale =
      maxDimension > STORAGE_MAX_DIMENSION ? STORAGE_MAX_DIMENSION / maxDimension : 1;
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));
    const snapshotCanvas = document.createElement('canvas');
    snapshotCanvas.width = targetWidth;
    snapshotCanvas.height = targetHeight;
    const snapshotCtx = snapshotCanvas.getContext('2d');
    if (!snapshotCtx) return null;
    snapshotCtx.imageSmoothingEnabled = true;
    snapshotCtx.imageSmoothingQuality = 'high';
    snapshotCtx.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      0,
      0,
      targetWidth,
      targetHeight
    );
    try {
      const webpUrl = snapshotCanvas.toDataURL('image/webp', STORAGE_WEBP_QUALITY);
      if (webpUrl.startsWith('data:image/webp')) {
        return webpUrl;
      }
    } catch {
      // Fallback below.
    }
    try {
      return snapshotCanvas.toDataURL('image/png');
    } catch {
      return null;
    }
  }, []);

  const createCompositeCanvas = useCallback(() => {
    const drawCanvas = canvasRef.current;
    const bgCanvas = backgroundRef.current;
    if (!drawCanvas || !bgCanvas) return null;
    const composite = document.createElement('canvas');
    composite.width = drawCanvas.width;
    composite.height = drawCanvas.height;
    const compositeCtx = composite.getContext('2d');
    if (!compositeCtx) return null;
    compositeCtx.drawImage(bgCanvas, 0, 0);
    compositeCtx.drawImage(drawCanvas, 0, 0);
    return composite;
  }, []);

  const readStorage = useCallback((): StoredCanvasRead | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      if (raw.startsWith('data:image/')) {
        return { legacy: raw };
      }
      const parsed = JSON.parse(raw) as StoredCanvasPayload;
      if (parsed && parsed.version === 2) {
        return parsed;
      }
    } catch {
      // Ignore storage errors.
    }
    return null;
  }, []);

  const seedHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      historyRef.current = [canvas.toDataURL('image/png')];
      setCanUndo(false);
    } catch {
      historyRef.current = [];
      setCanUndo(false);
    }
  }, []);

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const snapshot = canvas.toDataURL('image/png');
      const history = historyRef.current;
      if (history[history.length - 1] === snapshot) return;
      history.push(snapshot);
      if (history.length > 12) {
        history.shift();
      }
      setCanUndo(history.length > 1);
    } catch {
      // Ignore snapshot errors.
    }
  }, []);

  const saveToStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    const snapshot = createStorageSnapshot(canvasRef.current);
    const payload: StoredCanvasPayload = {
      version: 2,
      background: backgroundId,
      drawing: snapshot
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setStorageError(null);
    } catch (error) {
      if (isQuotaExceededError(error)) {
        setStorageError(STORAGE_QUOTA_MESSAGE);
      }
    }
  }, [backgroundId, createStorageSnapshot]);

  const loadDrawingFromDataUrl = useCallback(
    (dataUrl: string | null, shouldSeed: boolean) => {
      if (!dataUrl) return;
      const image = new Image();
      image.onload = () => {
        drawImageToLayer(image);
        if (shouldSeed) {
          seedHistory();
        }
      };
      image.src = dataUrl;
    },
    [drawImageToLayer, seedHistory]
  );

  const clearDrawing = useCallback(() => {
    const ctx = ctxRef.current;
    const { width, height } = sizeRef.current;
    if (!ctx || !width || !height) return;
    ctx.clearRect(0, 0, width, height);
  }, []);

  const getPoint = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }, []);

  const getPressure = (event: ReactPointerEvent<HTMLCanvasElement>) =>
    event.pressure && event.pressure > 0 ? event.pressure : 0.5;

  const drawInkSegment = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      from: { x: number; y: number },
      to: { x: number; y: number },
      pressure: number
    ) => {
      const width = Math.max(1, brushSize * (0.6 + pressure));
      const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      gradient.addColorStop(0, inkStyle.colors[0]);
      if (inkStyle.colors[1]) gradient.addColorStop(0.55, inkStyle.colors[1]);
      if (inkStyle.colors[2]) gradient.addColorStop(1, inkStyle.colors[2]);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = inkStyle.alpha;
      ctx.shadowColor = glowEnabled ? inkStyle.shadow : 'transparent';
      ctx.shadowBlur = glowEnabled ? inkStyle.glow : 0;
      ctx.strokeStyle = gradient;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    },
    [brushSize, glowEnabled, inkStyle]
  );

  const drawInkDot = useCallback(
    (ctx: CanvasRenderingContext2D, point: { x: number; y: number }, pressure: number) => {
      const width = Math.max(1, brushSize * (0.6 + pressure));
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = inkStyle.alpha;
      ctx.shadowColor = glowEnabled ? inkStyle.shadow : 'transparent';
      ctx.shadowBlur = glowEnabled ? inkStyle.glow : 0;
      ctx.fillStyle = inkStyle.colors[0];
      ctx.beginPath();
      ctx.arc(point.x, point.y, width * 0.5, 0, Math.PI * 2);
      ctx.fill();
    },
    [brushSize, glowEnabled, inkStyle]
  );

  const drawEraserSegment = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      from: { x: number; y: number },
      to: { x: number; y: number },
      pressure: number
    ) => {
      const width = Math.max(8, brushSize * 5.5 * (0.6 + pressure));
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    },
    [brushSize]
  );

  const drawEraserDot = useCallback(
    (ctx: CanvasRenderingContext2D, point: { x: number; y: number }, pressure: number) => {
      const width = Math.max(8, brushSize * 5.5 * (0.6 + pressure));
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.beginPath();
      ctx.arc(point.x, point.y, width * 0.5, 0, Math.PI * 2);
      ctx.fill();
    },
    [brushSize]
  );

  const drawStamp = useCallback(
    (ctx: CanvasRenderingContext2D, point: { x: number; y: number }) => {
      const size = stampSize;
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = inkStyle.alpha;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      if (glowEnabled) {
        ctx.shadowColor = inkStyle.shadow;
        ctx.shadowBlur = inkStyle.glow;
      } else {
        ctx.shadowBlur = 0;
      }
      const gradient = ctx.createLinearGradient(
        point.x - size,
        point.y - size,
        point.x + size,
        point.y + size
      );
      gradient.addColorStop(0, inkStyle.colors[0]);
      if (inkStyle.colors[1]) gradient.addColorStop(0.5, inkStyle.colors[1]);
      if (inkStyle.colors[2]) gradient.addColorStop(1, inkStyle.colors[2]);
      ctx.fillStyle = gradient;
      ctx.strokeStyle = inkStyle.colors[0];
      ctx.lineWidth = Math.max(1.5, size * 0.06);
      const drawHeart = () => {
        const width = size;
        const height = size * 0.9;
        const topCurveHeight = height * 0.3;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y + topCurveHeight);
        ctx.bezierCurveTo(
          point.x,
          point.y,
          point.x - width / 2,
          point.y,
          point.x - width / 2,
          point.y + topCurveHeight
        );
        ctx.bezierCurveTo(
          point.x - width / 2,
          point.y + (height + topCurveHeight) / 2,
          point.x,
          point.y + (height + topCurveHeight) / 2,
          point.x,
          point.y + height
        );
        ctx.bezierCurveTo(
          point.x,
          point.y + (height + topCurveHeight) / 2,
          point.x + width / 2,
          point.y + (height + topCurveHeight) / 2,
          point.x + width / 2,
          point.y + topCurveHeight
        );
        ctx.bezierCurveTo(
          point.x + width / 2,
          point.y,
          point.x,
          point.y,
          point.x,
          point.y + topCurveHeight
        );
        ctx.closePath();
      };
      const drawInfinity = () => {
        const loop = size * 0.25;
        const gap = size * 0.18;
        ctx.beginPath();
        ctx.moveTo(point.x - gap, point.y);
        ctx.bezierCurveTo(
          point.x - gap - loop,
          point.y - loop,
          point.x - gap - loop,
          point.y + loop,
          point.x - gap,
          point.y
        );
        ctx.bezierCurveTo(
          point.x - gap + loop,
          point.y - loop,
          point.x + gap - loop,
          point.y - loop,
          point.x + gap,
          point.y
        );
        ctx.bezierCurveTo(
          point.x + gap + loop,
          point.y + loop,
          point.x + gap + loop,
          point.y - loop,
          point.x + gap,
          point.y
        );
        ctx.bezierCurveTo(
          point.x + gap - loop,
          point.y + loop,
          point.x - gap + loop,
          point.y + loop,
          point.x - gap,
          point.y
        );
        ctx.closePath();
      };
      const drawCrest = () => {
        const radius = size * 0.6;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y - radius);
        ctx.lineTo(point.x + radius, point.y);
        ctx.lineTo(point.x, point.y + radius);
        ctx.lineTo(point.x - radius, point.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        const inner = radius * 0.45;
        ctx.globalAlpha = inkStyle.alpha * 0.75;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y - inner);
        ctx.lineTo(point.x + inner, point.y);
        ctx.lineTo(point.x, point.y + inner);
        ctx.lineTo(point.x - inner, point.y);
        ctx.closePath();
        ctx.stroke();
      };
      if (stampId === 'heart') {
        drawHeart();
        ctx.fill();
        ctx.stroke();
      } else if (stampId === 'infinity') {
        drawInfinity();
        ctx.stroke();
      } else {
        drawCrest();
      }
      ctx.restore();
      if (sparkleEnabled) {
        drawSparkle(ctx, point.x, point.y, inkStyle.sparkle);
      }
    },
    [glowEnabled, inkStyle, sparkleEnabled, stampId, stampSize]
  );

  const maybeSparkle = useCallback(
    (ctx: CanvasRenderingContext2D, point: { x: number; y: number }) => {
      if (!sparkleEnabled) return;
      const now = performance.now();
      if (now - lastSparkleRef.current < 70) return;
      lastSparkleRef.current = now;
      if (Math.random() > 0.4) return;
      drawSparkle(ctx, point.x, point.y, inkStyle.sparkle);
    },
    [inkStyle.sparkle, sparkleEnabled]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    activePointerRef.current = null;
    pushHistory();
    saveToStorage();
  }, [pushHistory, saveToStorage]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!open) return;
      const ctx = ctxRef.current;
      const point = getPoint(event);
      if (!ctx || !point) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      activePointerRef.current = event.pointerId;
      const pressure = getPressure(event);
      if (tool === 'stamp') {
        drawStamp(ctx, point);
        pushHistory();
        saveToStorage();
        activePointerRef.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }
      isDrawingRef.current = true;
      lastPointRef.current = point;
      if (tool === 'eraser') {
        drawEraserDot(ctx, point, pressure);
      } else {
        drawInkDot(ctx, point, pressure);
        if (sparkleEnabled) {
          drawSparkle(ctx, point.x, point.y, inkStyle.sparkle);
        }
      }
    },
    [
      drawEraserDot,
      drawInkDot,
      drawStamp,
      getPoint,
      inkStyle.sparkle,
      open,
      pushHistory,
      saveToStorage,
      sparkleEnabled,
      tool
    ]
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      if (activePointerRef.current !== event.pointerId) return;
      const ctx = ctxRef.current;
      const point = getPoint(event);
      if (!ctx || !point) return;
      event.preventDefault();
      const last = lastPointRef.current;
      if (!last) {
        lastPointRef.current = point;
        return;
      }
      const pressure = getPressure(event);
      if (tool === 'eraser') {
        drawEraserSegment(ctx, last, point, pressure);
      } else {
        drawInkSegment(ctx, last, point, pressure);
        maybeSparkle(ctx, point);
      }
      lastPointRef.current = point;
    },
    [drawEraserSegment, drawInkSegment, getPoint, maybeSparkle, tool]
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (activePointerRef.current !== event.pointerId) return;
      event.preventDefault();
      event.currentTarget.releasePointerCapture(event.pointerId);
      stopDrawing();
    },
    [stopDrawing]
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (activePointerRef.current !== event.pointerId) return;
      event.preventDefault();
      stopDrawing();
    },
    [stopDrawing]
  );

  const handleUndo = useCallback(() => {
    const history = historyRef.current;
    if (history.length <= 1) return;
    history.pop();
    const snapshot = history[history.length - 1];
    if (!snapshot) return;
    const image = new Image();
    image.onload = () => {
      drawImageToLayer(image);
      setCanUndo(history.length > 1);
      saveToStorage();
    };
    image.src = snapshot;
  }, [drawImageToLayer, saveToStorage]);

  const handleClear = useCallback(() => {
    clearDrawing();
    seedHistory();
    saveToStorage();
    setStorageError(null);
  }, [clearDrawing, saveToStorage, seedHistory]);

  const handleSavePng = useCallback(() => {
    const composite = createCompositeCanvas();
    if (!composite) return;
    const url = composite.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = 'garden-canvas.png';
    link.click();
    saveToStorage();
  }, [createCompositeCanvas, saveToStorage]);

  useEffect(() => {
    if (!open) return;
    setStorageError(null);
    setupCanvas();
    const stored = readStorage();
    const storedBackground =
      stored && 'background' in stored ? stored.background : DEFAULT_BACKGROUND;
    const isKnownBackground = BACKGROUND_STYLES.some(
      (style) => style.id === storedBackground
    );
    const nextBackground = isKnownBackground ? storedBackground : DEFAULT_BACKGROUND;
    setBackgroundId(nextBackground);
    backgroundIdRef.current = nextBackground;
    paintBackground(nextBackground, frameEnabledRef.current);
    if (stored && 'drawing' in stored && stored.drawing) {
      loadDrawingFromDataUrl(stored.drawing, true);
    } else if (stored && 'legacy' in stored) {
      loadDrawingFromDataUrl(stored.legacy, true);
    } else {
      clearDrawing();
      seedHistory();
    }
    const handleResize = () => {
      const drawCanvas = canvasRef.current;
      if (!drawCanvas) return;
      let snapshot: string | null = null;
      try {
        snapshot = drawCanvas.toDataURL('image/png');
      } catch {
        snapshot = null;
      }
      setupCanvas();
      paintBackground(backgroundIdRef.current, frameEnabledRef.current);
      if (snapshot) {
        const image = new Image();
        image.onload = () => {
          drawImageToLayer(image);
          seedHistory();
        };
        image.src = snapshot;
      } else {
        seedHistory();
      }
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [
    clearDrawing,
    drawImageToLayer,
    loadDrawingFromDataUrl,
    open,
    paintBackground,
    readStorage,
    seedHistory,
    setupCanvas
  ]);

  useEffect(() => {
    if (!open) return;
    paintBackground(backgroundId, frameEnabled);
  }, [backgroundId, frameEnabled, open, paintBackground]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      saveToStorage();
      onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open, saveToStorage]);

  useEffect(() => {
    if (!open) return;
    return () => {
      saveToStorage();
    };
  }, [open, saveToStorage]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto px-4 py-6 sm:px-6"
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-[rgba(5,6,8,0.82)]" />
      <div className="relative z-[1] flex w-full max-w-6xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-full px-4 py-2 text-[9px] uppercase tracking-[0.35em] text-white/70 backdrop-blur lux-plate">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`rounded-full px-4 py-2 tracking-[0.35em] transition lux-button ${
                canUndo ? 'text-white' : 'text-white/40'
              }`}
              onClick={handleUndo}
              aria-disabled={!canUndo}
            >
              Undo
            </button>
            <button
              type="button"
              className="rounded-full px-4 py-2 tracking-[0.35em] transition lux-button text-white/70 hover:text-white"
              onClick={handleClear}
            >
              Bersihkan
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`rounded-full px-4 py-2 tracking-[0.35em] transition lux-button ${
                controlsOpen ? 'text-white/70 hover:text-white' : 'text-white'
              }`}
              onClick={() => setControlsOpen((prev) => !prev)}
              aria-pressed={!controlsOpen}
            >
              {controlsOpen ? 'Fokus' : 'Kontrol'}
            </button>
            <button
              type="button"
              className="rounded-full px-4 py-2 tracking-[0.35em] transition lux-button text-white/70 hover:text-white"
              onClick={handleSavePng}
            >
              Simpan PNG
            </button>
            <button
              type="button"
              className="rounded-full px-4 py-2 tracking-[0.35em] transition lux-button text-white/70 hover:text-white"
              onClick={() => {
                saveToStorage();
                onClose();
              }}
            >
              Tutup
            </button>
          </div>
        </div>

        {controlsOpen && (
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.9fr]">
            <div className="rounded-[28px] lux-plate p-4 text-[10px] uppercase tracking-[0.32em] text-white/60">
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span>Alat</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className={`rounded-full px-4 py-2 tracking-[0.35em] transition lux-button ${
                            tool === 'pen' ? 'text-white' : 'text-white/60'
                          }`}
                          onClick={() => setTool('pen')}
                          aria-pressed={tool === 'pen'}
                        >
                          Pena
                        </button>
                        <button
                          type="button"
                          className={`rounded-full px-4 py-2 tracking-[0.35em] transition lux-button ${
                            tool === 'eraser' ? 'text-white' : 'text-white/60'
                          }`}
                          onClick={() => setTool('eraser')}
                          aria-pressed={tool === 'eraser'}
                        >
                          Hapus
                        </button>
                        <button
                          type="button"
                          className={`rounded-full px-4 py-2 tracking-[0.35em] transition lux-button ${
                            tool === 'stamp' ? 'text-white' : 'text-white/60'
                          }`}
                          onClick={() => setTool('stamp')}
                          aria-pressed={tool === 'stamp'}
                        >
                          Segel
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase tracking-[0.3em] text-white/50">
                      Tinta
                    </span>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {INK_STYLES.map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          aria-label={style.label}
                          aria-pressed={inkStyleId === style.id}
                          className={`relative h-9 w-9 rounded-full border transition shadow-[0_0_18px_rgba(0,0,0,0.35)] ${
                            inkStyleId === style.id
                              ? 'border-[var(--garden-gold)] ring-2 ring-[rgba(216,181,107,0.35)]'
                              : 'border-white/15'
                          }`}
                          style={{
                            background: `linear-gradient(135deg, ${style.colors[0]}, ${
                              style.colors[1] ?? style.colors[0]
                            })`
                          }}
                          onClick={() => setInkStyleId(style.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex flex-col gap-2 text-[9px] uppercase tracking-[0.3em] text-white/50">
                      Ukuran
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={1}
                          max={12}
                          step={1}
                          value={brushSize}
                          onChange={(event) => setBrushSize(Number(event.target.value))}
                          className="h-1 w-40 accent-[var(--garden-gold)]"
                        />
                        <span className="text-[10px] text-white/70">{brushSize}</span>
                      </div>
                    </label>
                    {tool === 'stamp' && (
                      <label className="flex flex-col gap-2 text-[9px] uppercase tracking-[0.3em] text-white/50">
                        Ukuran Segel
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={32}
                            max={140}
                            step={4}
                            value={stampSize}
                            onChange={(event) => setStampSize(Number(event.target.value))}
                            className="h-1 w-36 accent-[var(--garden-gold)]"
                          />
                          <span className="text-[10px] text-white/70">{stampSize}</span>
                        </div>
                      </label>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className={`rounded-full px-4 py-2 tracking-[0.35em] transition lux-button ${
                        glowEnabled ? 'text-white' : 'text-white/60'
                      }`}
                      onClick={() => setGlowEnabled((prev) => !prev)}
                      aria-pressed={glowEnabled}
                    >
                      Glow
                    </button>
                    <button
                      type="button"
                      className={`rounded-full px-4 py-2 tracking-[0.35em] transition lux-button ${
                        sparkleEnabled ? 'text-white' : 'text-white/60'
                      }`}
                      onClick={() => setSparkleEnabled((prev) => !prev)}
                      aria-pressed={sparkleEnabled}
                    >
                      Sparkle
                    </button>
                    <button
                      type="button"
                      className={`rounded-full px-4 py-2 tracking-[0.35em] transition lux-button ${
                        guideEnabled ? 'text-white' : 'text-white/60'
                      }`}
                      onClick={() => setGuideEnabled((prev) => !prev)}
                      aria-pressed={guideEnabled}
                    >
                      Panduan
                    </button>
                  </div>

                  {tool === 'stamp' && (
                    <div>
                      <span className="text-[9px] uppercase tracking-[0.3em] text-white/50">
                        Pilih Segel
                      </span>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {STAMP_STYLES.map((stamp) => (
                          <button
                            key={stamp.id}
                            type="button"
                            className={`rounded-full px-4 py-2 tracking-[0.35em] transition lux-button ${
                              stampId === stamp.id ? 'text-white' : 'text-white/60'
                            }`}
                            onClick={() => setStampId(stamp.id)}
                            aria-pressed={stampId === stamp.id}
                          >
                            {stamp.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] lux-plate p-4 text-[10px] uppercase tracking-[0.32em] text-white/60">
              <span>Latar</span>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {BACKGROUND_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    aria-label={style.label}
                    aria-pressed={backgroundId === style.id}
                    className={`relative h-14 rounded-2xl border px-2 text-[9px] uppercase tracking-[0.25em] transition ${
                      backgroundId === style.id
                        ? 'border-[var(--garden-gold)] text-white'
                        : 'border-white/15 text-white/60'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${style.colors[0]}, ${style.colors[1]})`
                    }}
                    onClick={() => setBackgroundId(style.id)}
                  >
                    <span className="absolute inset-0 rounded-2xl bg-[rgba(0,0,0,0.35)]" />
                    <span className="relative">{style.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 tracking-[0.35em] transition lux-button ${
                    frameEnabled ? 'text-white' : 'text-white/60'
                  }`}
                  onClick={() => setFrameEnabled((prev) => !prev)}
                  aria-pressed={frameEnabled}
                >
                  Bingkai
                </button>
              </div>
              <p className="mt-4 text-[10px] uppercase tracking-[0.28em] text-white/45">
                Geser untuk melukis, ketuk untuk segel, simpan untuk kenangan.
              </p>
            </div>
          </div>
        )}

        {storageError && (
          <p className="px-4 text-[10px] text-[var(--garden-gold)]/70">
            {storageError}
          </p>
        )}

        <div
          ref={wrapperRef}
          className={`relative w-full overflow-hidden rounded-[32px] lux-border p-[1px] shadow-[0_0_120px_rgba(0,0,0,0.55)] lux-sheen ${
            controlsOpen ? 'h-[60vh] md:h-[62vh]' : 'h-[74vh] md:h-[78vh]'
          }`}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[31px] bg-[rgba(7,8,10,0.8)]">
            <canvas
              ref={backgroundRef}
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            />
            {guideEnabled && (
              <div className="pointer-events-none absolute inset-0 opacity-40 sky-grid" />
            )}
            <canvas
              ref={canvasRef}
              className="relative h-full w-full touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
            />
            <div className="pointer-events-none absolute inset-0 lux-vignette opacity-60" />
            <div className="pointer-events-none absolute inset-0 grain opacity-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
