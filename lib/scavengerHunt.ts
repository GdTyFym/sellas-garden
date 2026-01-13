export type ScavengerHuntState = {
  stepIndex: number;
  completed: boolean;
  collapsed: boolean;
  completionToastShown: boolean;
};

export type ScavengerHuntAction =
  | { type: 'LOAD_STATE'; payload: ScavengerHuntState }
  | { type: 'BLOOMS_UPDATED'; totalBlooms: number }
  | { type: 'STAR_MADE' }
  | { type: 'CHARM_FOUND' }
  | { type: 'TOGGLE_COLLAPSED' }
  | { type: 'MARK_TOAST_SHOWN' };

export const initialScavengerState: ScavengerHuntState = {
  stepIndex: 0,
  completed: false,
  collapsed: false,
  completionToastShown: false
};

const clampStep = (value: number) => Math.max(0, Math.min(3, Math.floor(value)));

export const normalizeScavengerState = (value: unknown): ScavengerHuntState | null => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const stepIndex = clampStep(typeof record.stepIndex === 'number' ? record.stepIndex : 0);
  const completed = Boolean(record.completed) || stepIndex >= 3;
  const collapsed = Boolean(record.collapsed);
  const completionToastShown = Boolean(record.completionToastShown);
  return {
    stepIndex: completed ? 3 : stepIndex,
    completed,
    collapsed,
    completionToastShown
  };
};

export const scavengerReducer = (
  state: ScavengerHuntState,
  action: ScavengerHuntAction
): ScavengerHuntState => {
  switch (action.type) {
    case 'LOAD_STATE': {
      const stepIndex = clampStep(action.payload.stepIndex);
      const completed = action.payload.completed || stepIndex >= 3;
      return {
        ...state,
        ...action.payload,
        stepIndex: completed ? 3 : stepIndex,
        completed
      };
    }
    case 'BLOOMS_UPDATED': {
      if (state.completed || state.stepIndex > 0) return state;
      if (action.totalBlooms < 7) return state;
      return { ...state, stepIndex: 1 };
    }
    case 'STAR_MADE': {
      if (state.completed || state.stepIndex < 1 || state.stepIndex >= 2) return state;
      return { ...state, stepIndex: 2 };
    }
    case 'CHARM_FOUND': {
      if (state.completed || state.stepIndex < 2) return state;
      return { ...state, stepIndex: 3, completed: true };
    }
    case 'TOGGLE_COLLAPSED':
      return { ...state, collapsed: !state.collapsed };
    case 'MARK_TOAST_SHOWN':
      if (state.completionToastShown) return state;
      return { ...state, completionToastShown: true };
    default:
      return state;
  }
};
