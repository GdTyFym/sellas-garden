import { buildSecretSet, isSecretMatch, normalizeSecretInput } from '@/lib/secretGate';

describe('secretGate', () => {
  it('normalizes input by trimming, lowercasing, and removing separators', () => {
    expect(normalizeSecretInput(' 12/03/2024 ')).toBe('12032024');
    expect(normalizeSecretInput('12-03-2024')).toBe('12032024');
    expect(normalizeSecretInput('12.03.2024')).toBe('12032024');
    expect(normalizeSecretInput('Sa YaNg')).toBe('sayang');
  });

  it('accepts multiple date formats and optional short date', () => {
    const set = buildSecretSet({
      primary: '12/03/2024',
      aliases: ['My Love'],
      allowShortDate: true
    });

    expect(isSecretMatch('12032024', set)).toBe(true);
    expect(isSecretMatch('12-03-2024', set)).toBe(true);
    expect(isSecretMatch('12.03.2024', set)).toBe(true);
    expect(isSecretMatch('12/03/2024', set)).toBe(true);
    expect(isSecretMatch('1203', set)).toBe(true);
    expect(isSecretMatch('my love', set)).toBe(true);
  });

  it('rejects incorrect values', () => {
    const set = buildSecretSet({
      primary: '12/03/2024',
      aliases: ['My Love'],
      allowShortDate: false
    });

    expect(isSecretMatch('1204', set)).toBe(false);
    expect(isSecretMatch('buddy', set)).toBe(false);
  });
});
