export const bouquetConfig = {
  allowedFlowerBases: [
    'flower-1',
    'flower-2',
    'flower-3',
    'flower-4',
    'flower-5',
    'flower-6',
    'flower-7',
    'flower-8',
    'flower-9',
    'flower-10',
    'flower-11',
    'flower-12',
    'flower-13',
    'flower-14',
    'flower-15',
    'flower-16',
    'flower-17',
    'flower-18',
    'flower-19',
    'flower-20',
    'flower-21',
    'flower-22',
    'flower-23',
    'flower-24',
    'flower-25',
    'flower-26',
    'flower-27',
    'flower-28',
    'flower-tulip'
  ],
  sizeOptions: [3, 5, 7, 9, 11] as const,
  defaultSize: 5,
  maxMessageLength: 60
} as const;

export type BouquetSize = (typeof bouquetConfig.sizeOptions)[number];
