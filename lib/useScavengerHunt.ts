import { useCallback, useEffect, useReducer } from 'react';
import {
  initialScavengerState,
  normalizeScavengerState,
  scavengerReducer
} from '@/lib/scavengerHunt';

const STORAGE_KEY = 'sella_scavenger_v2';
const BOUQUET_UNLOCK_KEY = 'sella_bouquet_unlocked_v2';

type UseScavengerHuntOptions = {
  totalBlooms: number;
  onComplete?: () => void;
};

export const useScavengerHunt = ({ totalBlooms, onComplete }: UseScavengerHuntOptions) => {
  const [state, dispatch] = useReducer(scavengerReducer, initialScavengerState);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const normalized = normalizeScavengerState(parsed);
      if (normalized) {
        dispatch({ type: 'LOAD_STATE', payload: normalized });
      }
    } catch {
      // Ignore malformed state.
    }
  }, []);

  useEffect(() => {
    dispatch({ type: 'BLOOMS_UPDATED', totalBlooms });
  }, [totalBlooms]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!state.completed) return;
    localStorage.setItem(BOUQUET_UNLOCK_KEY, '1');
    if (!state.completionToastShown) {
      if (onComplete) {
        onComplete();
      }
      dispatch({ type: 'MARK_TOAST_SHOWN' });
    }
  }, [onComplete, state.completed, state.completionToastShown]);

  const markStarMade = useCallback(() => dispatch({ type: 'STAR_MADE' }), []);
  const markCharmFound = useCallback(() => dispatch({ type: 'CHARM_FOUND' }), []);
  const toggleCollapsed = useCallback(() => dispatch({ type: 'TOGGLE_COLLAPSED' }), []);

  return {
    state,
    showCharm: state.stepIndex === 2 && !state.completed,
    markStarMade,
    markCharmFound,
    toggleCollapsed
  };
};
