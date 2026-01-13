import { useCallback, useEffect, useReducer } from 'react';
import {
  bouquetReducer,
  makeDefaultBouquet,
  type BouquetState
} from '@/lib/bouquet/bouquetState';

const STORAGE_KEY = 'sella_bouquet_v1';
const UNLOCK_KEY = 'sella_bouquet_unlocked_v2';

type UseBouquetBuilderOptions = {
  unlocked?: boolean;
};

export const useBouquetBuilder = ({ unlocked }: UseBouquetBuilderOptions = {}) => {
  const [state, dispatch] = useReducer(bouquetReducer, undefined, makeDefaultBouquet);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<BouquetState>;
      dispatch({ type: 'HYDRATE', payload: parsed });
    } catch {
      // Ignore malformed state.
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedUnlocked = localStorage.getItem(UNLOCK_KEY) === '1';
    if (storedUnlocked || unlocked) {
      dispatch({ type: 'HYDRATE', payload: { isUnlocked: true } });
    }
  }, [unlocked]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const open = useCallback(() => {
    if (!state.isUnlocked) return;
    dispatch({ type: 'OPEN' });
  }, [state.isUnlocked]);

  const close = useCallback(() => {
    dispatch({ type: 'CLOSE' });
  }, []);

  const setSize = useCallback((size: number) => {
    dispatch({ type: 'SET_SIZE', size, now: Date.now() });
  }, []);

  const setSlot = useCallback((index: number, base: string) => {
    dispatch({ type: 'SET_SLOT', index, base, now: Date.now() });
  }, []);

  const setMessage = useCallback((message: string) => {
    dispatch({ type: 'SET_MESSAGE', message, now: Date.now() });
  }, []);

  const setLayout = useCallback(
    (layoutId: BouquetState['layoutId']) => {
      dispatch({ type: 'SET_LAYOUT', layoutId, now: Date.now() });
    },
    []
  );

  const randomize = useCallback(() => {
    dispatch({ type: 'RANDOMIZE', now: Date.now() });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET', now: Date.now() });
  }, []);

  return {
    state,
    open,
    close,
    setSize,
    setSlot,
    setMessage,
    setLayout,
    randomize,
    reset
  };
};
