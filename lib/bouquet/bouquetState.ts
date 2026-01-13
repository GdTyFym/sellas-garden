import { bouquetConfig } from '@/lib/bouquet/bouquetConfig';
import {
  bouquetLayoutPresets,
  defaultBouquetLayoutId,
  type BouquetLayoutId
} from '@/lib/bouquet/bouquetLayout';

type PartialBouquetState = Partial<BouquetState>;

type RandomizeAction = { type: 'RANDOMIZE'; rng?: () => number; now?: number };

type SetSizeAction = { type: 'SET_SIZE'; size: number; now?: number };

type SetSlotAction = { type: 'SET_SLOT'; index: number; base: string; now?: number };

type SetMessageAction = { type: 'SET_MESSAGE'; message: string; now?: number };

type SetLayoutAction = {
  type: 'SET_LAYOUT';
  layoutId: BouquetLayoutId;
  now?: number;
};

type ResetAction = { type: 'RESET'; now?: number };

type HydrateAction = { type: 'HYDRATE'; payload: PartialBouquetState };

export type BouquetState = {
  size: number;
  slots: string[];
  message: string;
  layoutId: BouquetLayoutId;
  isOpen: boolean;
  isUnlocked: boolean;
  lastUpdated: number | null;
};

export type BouquetAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | SetSizeAction
  | SetSlotAction
  | SetMessageAction
  | SetLayoutAction
  | RandomizeAction
  | ResetAction
  | HydrateAction;

const allowedBases = bouquetConfig.allowedFlowerBases;
const defaultBase = allowedBases[0];
type AllowedBase = (typeof allowedBases)[number];

const isAllowedBase = (value: string): value is AllowedBase =>
  allowedBases.includes(value as AllowedBase);

const layoutIds = Object.keys(bouquetLayoutPresets) as BouquetLayoutId[];
const isLayoutId = (value: string): value is BouquetLayoutId =>
  layoutIds.includes(value as BouquetLayoutId);

export const clampSize = (value: number) => {
  const options = bouquetConfig.sizeOptions;
  if (options.includes(value as (typeof options)[number])) return value;
  const distances = options.map((option) => Math.abs(option - value));
  const closestIndex = distances.indexOf(Math.min(...distances));
  return options[closestIndex];
};

const normalizeSlots = (slots: string[] | undefined, size: number) => {
  const next: string[] = [];
  const sanitized = Array.isArray(slots) ? slots.filter((slot) => typeof slot === 'string') : [];
  for (let i = 0; i < size; i += 1) {
    const candidate = sanitized[i];
    if (candidate && isAllowedBase(candidate)) {
      next.push(candidate);
    } else {
      next.push(allowedBases[i % allowedBases.length] ?? defaultBase);
    }
  }
  return next;
};

export const normalizeMessage = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, bouquetConfig.maxMessageLength);

export const randomizeBouquet = (size: number, rng: () => number = Math.random) => {
  const slots: string[] = [];
  for (let i = 0; i < size; i += 1) {
    const pick = Math.floor(rng() * allowedBases.length);
    slots.push(allowedBases[pick] ?? defaultBase);
  }
  return slots;
};

export const makeDefaultBouquet = (): BouquetState => {
  const size = bouquetConfig.defaultSize;
  return {
    size,
    slots: normalizeSlots([], size),
    message: '',
    layoutId: defaultBouquetLayoutId,
    isOpen: false,
    isUnlocked: false,
    lastUpdated: null
  };
};

const mergeBouquetState = (state: BouquetState, payload: PartialBouquetState): BouquetState => {
  const size = clampSize(payload.size ?? state.size);
  const layoutId = isLayoutId(payload.layoutId ?? '') ? payload.layoutId! : state.layoutId;
  const isUnlocked = payload.isUnlocked ?? state.isUnlocked;
  const isOpen = isUnlocked ? payload.isOpen ?? state.isOpen : false;
  return {
    size,
    slots: normalizeSlots(payload.slots ?? state.slots, size),
    message: normalizeMessage(payload.message ?? state.message),
    layoutId,
    isOpen,
    isUnlocked,
    lastUpdated:
      typeof payload.lastUpdated === 'number' ? payload.lastUpdated : state.lastUpdated
  };
};

const withUpdatedAt = (state: BouquetState, now?: number) => ({
  ...state,
  lastUpdated: typeof now === 'number' ? now : state.lastUpdated
});

export const bouquetReducer = (state: BouquetState, action: BouquetAction): BouquetState => {
  switch (action.type) {
    case 'OPEN':
      if (!state.isUnlocked || state.isOpen) return state;
      return { ...state, isOpen: true };
    case 'CLOSE':
      return !state.isOpen ? state : { ...state, isOpen: false };
    case 'SET_SIZE': {
      const size = clampSize(action.size);
      if (size === state.size) return state;
      return withUpdatedAt(
        {
          ...state,
          size,
          slots: normalizeSlots(state.slots, size)
        },
        action.now
      );
    }
    case 'SET_SLOT': {
      if (action.index < 0 || action.index >= state.slots.length) return state;
      if (!isAllowedBase(action.base)) return state;
      if (state.slots[action.index] === action.base) return state;
      const slots = [...state.slots];
      slots[action.index] = action.base;
      return withUpdatedAt({ ...state, slots }, action.now);
    }
    case 'SET_MESSAGE': {
      const message = normalizeMessage(action.message);
      if (message === state.message) return state;
      return withUpdatedAt({ ...state, message }, action.now);
    }
    case 'SET_LAYOUT': {
      if (!isLayoutId(action.layoutId)) return state;
      if (state.layoutId === action.layoutId) return state;
      return withUpdatedAt(
        {
          ...state,
          layoutId: action.layoutId
        },
        action.now
      );
    }
    case 'RANDOMIZE': {
      const slots = randomizeBouquet(state.size, action.rng);
      return withUpdatedAt({ ...state, slots }, action.now);
    }
    case 'RESET': {
      const base = makeDefaultBouquet();
      return withUpdatedAt(
        {
          ...base,
          isOpen: state.isOpen,
          isUnlocked: state.isUnlocked
        },
        action.now
      );
    }
    case 'HYDRATE':
      return mergeBouquetState(state, action.payload);
    default:
      return state;
  }
};
