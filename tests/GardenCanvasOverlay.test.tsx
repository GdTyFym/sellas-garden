import { fireEvent, render, screen } from '@testing-library/react';
import GardenCanvasOverlay from '@/components/GardenCanvasOverlay';

const mockRect = {
  width: 800,
  height: 600,
  top: 0,
  left: 0,
  right: 800,
  bottom: 600,
  x: 0,
  y: 0,
  toJSON: () => ({})
} as DOMRect;

const mockContext = {
  setTransform: vi.fn(),
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  lineCap: 'round',
  lineJoin: 'round',
  globalCompositeOperation: 'source-over',
  lineWidth: 1,
  strokeStyle: '#fff',
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high'
} as unknown as CanvasRenderingContext2D;

describe('GardenCanvasOverlay', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 1,
      configurable: true
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(mockRect);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation((type?: string) => {
      if (type === 'image/webp') {
        return 'data:image/webp;base64,abc';
      }
      return 'data:image/png;base64,abc';
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('stores a compact snapshot in localStorage', () => {
    render(<GardenCanvasOverlay open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));

    const stored = window.localStorage.getItem('garden_canvas_v1');
    expect(stored).toMatch(/^data:image\/webp/);
  });

  it('shows a friendly message when storage is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    render(<GardenCanvasOverlay open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));

    expect(
      screen.getByText(/Gagal menyimpan: storage penuh/i)
    ).toBeInTheDocument();
  });
});
