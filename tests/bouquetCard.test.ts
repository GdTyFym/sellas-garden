import { makeBouquetCardPlan } from '@/lib/bouquet/bouquetCard';

describe('bouquetCard plan', () => {
  it('creates plan items within bounds', () => {
    const slots = ['flower-1', 'flower-3', 'flower-7', 'flower-10', 'flower-12'];
    const plan = makeBouquetCardPlan({
      slots,
      canvasWidth: 1080,
      canvasHeight: 1350,
      flowerFormat: 'webp',
      flowerSize: 512
    });

    expect(plan).toHaveLength(slots.length);
    plan.forEach((item) => {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.x).toBeLessThanOrEqual(1080);
      expect(item.y).toBeGreaterThanOrEqual(0);
      expect(item.y).toBeLessThanOrEqual(1350);
      expect(item.size).toBeGreaterThan(0);
      expect(item.size).toBeLessThanOrEqual(1080);
    });
  });
});
