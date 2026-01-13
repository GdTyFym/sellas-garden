import { initialScavengerState, scavengerReducer } from '@/lib/scavengerHunt';

describe('scavengerHunt reducer', () => {
  it('completes step 1 when blooms reach the threshold', () => {
    let state = scavengerReducer(initialScavengerState, { type: 'BLOOMS_UPDATED', totalBlooms: 6 });
    expect(state.stepIndex).toBe(0);

    state = scavengerReducer(state, { type: 'BLOOMS_UPDATED', totalBlooms: 7 });
    expect(state.stepIndex).toBe(1);
  });

  it('completes step 2 only after step 1 is done', () => {
    let state = scavengerReducer(initialScavengerState, { type: 'STAR_MADE' });
    expect(state.stepIndex).toBe(0);

    state = scavengerReducer({ ...initialScavengerState, stepIndex: 1 }, { type: 'STAR_MADE' });
    expect(state.stepIndex).toBe(2);
  });

  it('completes the hunt when the charm is found', () => {
    const state = scavengerReducer({ ...initialScavengerState, stepIndex: 2 }, { type: 'CHARM_FOUND' });
    expect(state.stepIndex).toBe(3);
    expect(state.completed).toBe(true);
  });
});
