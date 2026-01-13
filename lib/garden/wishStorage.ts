export type Wish = {
  text: string;
  createdAt: number;
};

const STORAGE_KEY = 'garden_wish_v1';

export function loadWish(): Wish | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Wish;
    if (!parsed || typeof parsed.text !== 'string' || typeof parsed.createdAt !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveWish(wish: Wish) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(wish));
  } catch {
    // Ignore storage errors.
  }
}

export function clearWish() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}
