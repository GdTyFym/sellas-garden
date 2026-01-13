import { clearWish, loadWish, saveWish } from '@/lib/garden/wishStorage';

describe('wishStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves and loads a wish', () => {
    const wish = { text: 'Semoga selalu bahagia', createdAt: 123456 };
    saveWish(wish);
    expect(loadWish()).toEqual(wish);
  });

  it('returns null for invalid JSON', () => {
    window.localStorage.setItem('garden_wish_v1', '{not-json');
    expect(loadWish()).toBeNull();
  });

  it('returns null for invalid shape', () => {
    window.localStorage.setItem('garden_wish_v1', JSON.stringify({ text: 123 }));
    expect(loadWish()).toBeNull();
  });

  it('clears saved wishes', () => {
    saveWish({ text: 'Semoga cerah', createdAt: 99 });
    clearWish();
    expect(loadWish()).toBeNull();
  });
});
