import { render, screen, waitFor } from '@testing-library/react';

const originalFetch = globalThis.fetch;

const setupCanvasSupport = (options: { avif?: boolean; webp?: boolean }) => {
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation((type?: string) => {
    if (type === 'image/avif' && options.avif) {
      return 'data:image/avif;base64,';
    }
    if (type === 'image/webp' && options.webp) {
      return 'data:image/webp;base64,';
    }
    return 'data:image/png;base64,';
  });
};

const setupAudioSupport = (supported: boolean) => {
  vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockImplementation(() =>
    supported ? 'probably' : ''
  );
};

describe('assetSources', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (globalThis as { fetch?: typeof fetch }).fetch;
    }
  });

  it('builds flower src paths', async () => {
    const { getFlowerSrc } = await import('@/lib/garden/assetSources');
    expect(getFlowerSrc('flower-1', 'webp')).toBe('/flowers/flower-1.webp');
    expect(getFlowerSrc('flower-1', 'webp', 512)).toBe('/flowers/flower-1-512.webp');
  });

  it('prefers avif when supported and available', async () => {
    setupCanvasSupport({ avif: true, webp: true });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true }) as typeof fetch;

    const { usePreferredFlowerFormat } = await import('@/lib/garden/assetSources');
    const Probe = () => <div data-testid="format">{usePreferredFlowerFormat()}</div>;
    render(<Probe />);

    await waitFor(() => {
      expect(screen.getByTestId('format')).toHaveTextContent('avif');
    });
  });

  it('falls back to webp when avif is unavailable', async () => {
    setupCanvasSupport({ webp: true });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true }) as typeof fetch;

    const { usePreferredFlowerFormat } = await import('@/lib/garden/assetSources');
    const Probe = () => <div data-testid="format">{usePreferredFlowerFormat()}</div>;
    render(<Probe />);

    await waitFor(() => {
      expect(screen.getByTestId('format')).toHaveTextContent('webp');
    });
  });

  it('defaults to png when optimized formats are unavailable', async () => {
    setupCanvasSupport({});
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false }) as typeof fetch;

    const { usePreferredFlowerFormat } = await import('@/lib/garden/assetSources');
    const Probe = () => <div data-testid="format">{usePreferredFlowerFormat()}</div>;
    render(<Probe />);

    await waitFor(() => {
      expect(screen.getByTestId('format')).toHaveTextContent('png');
    });
  });

  it('prefers opus when supported and present', async () => {
    setupAudioSupport(true);
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true }) as typeof fetch;

    const { usePreferredBgmSource } = await import('@/lib/garden/assetSources');
    const Probe = () => <div data-testid="bgm">{usePreferredBgmSource()}</div>;
    render(<Probe />);

    await waitFor(() => {
      expect(screen.getByTestId('bgm')).toHaveTextContent('/audio/bgm.opus');
    });
  });

  it('falls back to mp3 when opus is not available', async () => {
    setupAudioSupport(false);
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false }) as typeof fetch;

    const { usePreferredBgmSource } = await import('@/lib/garden/assetSources');
    const Probe = () => <div data-testid="bgm">{usePreferredBgmSource()}</div>;
    render(<Probe />);

    await waitFor(() => {
      expect(screen.getByTestId('bgm')).toHaveTextContent('/audio/bgm.mp3');
    });
  });
});
