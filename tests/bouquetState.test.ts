import { bouquetConfig } from '@/lib/bouquet/bouquetConfig';
import { bouquetReducer, makeDefaultBouquet } from '@/lib/bouquet/bouquetState';

describe('bouquetState reducer', () => {
  it('builds a default bouquet state', () => {
    const state = makeDefaultBouquet();
    expect(state.size).toBe(bouquetConfig.defaultSize);
    expect(state.slots).toHaveLength(bouquetConfig.defaultSize);
    expect(state.message).toBe('');
    expect(state.isOpen).toBe(false);
    expect(state.isUnlocked).toBe(false);
  });

  it('resizes slots when size changes', () => {
    const state = makeDefaultBouquet();
    const smaller = bouquetReducer(state, { type: 'SET_SIZE', size: 3, now: 1 });
    expect(smaller.size).toBe(3);
    expect(smaller.slots).toHaveLength(3);

    const larger = bouquetReducer(smaller, { type: 'SET_SIZE', size: 7, now: 2 });
    expect(larger.size).toBe(7);
    expect(larger.slots).toHaveLength(7);
  });

  it('updates a slot safely', () => {
    const state = makeDefaultBouquet();
    const base = bouquetConfig.allowedFlowerBases[1];
    const updated = bouquetReducer(state, { type: 'SET_SLOT', index: 1, base, now: 3 });
    expect(updated.slots[1]).toBe(base);

    const invalid = bouquetReducer(state, { type: 'SET_SLOT', index: 99, base, now: 4 });
    expect(invalid).toEqual(state);
  });

  it('normalizes message and enforces max length', () => {
    const state = makeDefaultBouquet();
    const long = '  hello    there    '.padEnd(200, 'x');
    const next = bouquetReducer(state, { type: 'SET_MESSAGE', message: long, now: 5 });
    expect(next.message.startsWith('hello there')).toBe(true);
    expect(next.message.length).toBeLessThanOrEqual(bouquetConfig.maxMessageLength);
  });

  it('hydrates safely and does not open when locked', () => {
    const state = makeDefaultBouquet();
    const hydrated = bouquetReducer(state, {
      type: 'HYDRATE',
      payload: {
        size: 7,
        slots: ['flower-1'],
        message: 'hi',
        isOpen: true,
        isUnlocked: false
      }
    });
    expect(hydrated.size).toBe(7);
    expect(hydrated.slots).toHaveLength(7);
    expect(hydrated.isOpen).toBe(false);
    expect(hydrated.isUnlocked).toBe(false);
  });
});
