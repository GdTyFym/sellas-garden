import { act, render } from '@testing-library/react';
import { createRef, forwardRef, useImperativeHandle } from 'react';
import { useTimedList } from '@/lib/garden/useTimedList';

type ListHandle = {
  items: Array<{ id: string; expiresAt: number }>;
  push: (item: { id: string }, ttlMs: number) => void;
  pushMany: (items: Array<{ item: { id: string }; ttlMs: number }>) => void;
};

const Harness = forwardRef<ListHandle>((_, ref) => {
  const list = useTimedList<{ id: string }>(2, 50);
  useImperativeHandle(ref, () => list);
  return null;
});

Harness.displayName = 'Harness';

describe('useTimedList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps the newest items up to max', () => {
    const ref = createRef<ListHandle>();
    render(<Harness ref={ref} />);

    act(() => {
      ref.current?.push({ id: 'a' }, 1000);
      ref.current?.push({ id: 'b' }, 1000);
      ref.current?.push({ id: 'c' }, 1000);
    });

    expect(ref.current?.items.map((item) => item.id)).toEqual(['b', 'c']);
  });

  it('expires items after their ttl', async () => {
    const ref = createRef<ListHandle>();
    render(<Harness ref={ref} />);

    act(() => {
      ref.current?.push({ id: 'a' }, 50);
    });

    expect(ref.current?.items).toHaveLength(1);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(ref.current?.items).toHaveLength(0);
  });

  it('pushMany respects max ordering', () => {
    const ref = createRef<ListHandle>();
    render(<Harness ref={ref} />);

    act(() => {
      ref.current?.pushMany([
        { item: { id: 'a' }, ttlMs: 500 },
        { item: { id: 'b' }, ttlMs: 500 },
        { item: { id: 'c' }, ttlMs: 500 }
      ]);
    });

    expect(ref.current?.items.map((item) => item.id)).toEqual(['b', 'c']);
  });
});
