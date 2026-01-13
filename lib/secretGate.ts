export type SecretConfig = {
  primary: string;
  aliases?: string[];
  allowShortDate?: boolean;
};

const separatorRegex = /[\s/.-]+/g;

export const normalizeSecretInput = (value: string) =>
  value.trim().toLowerCase().replace(separatorRegex, '');

const isEightDigitDate = (value: string) => /^\d{8}$/.test(value);

export const buildSecretSet = (config: SecretConfig): Set<string> => {
  const set = new Set<string>();
  const normalizedPrimary = normalizeSecretInput(config.primary);
  if (normalizedPrimary) {
    set.add(normalizedPrimary);
    if (config.allowShortDate && isEightDigitDate(normalizedPrimary)) {
      set.add(normalizedPrimary.slice(0, 4));
    }
  }
  for (const alias of config.aliases ?? []) {
    const normalizedAlias = normalizeSecretInput(alias);
    if (normalizedAlias) {
      set.add(normalizedAlias);
    }
  }
  return set;
};

export const isSecretMatch = (input: string, accepted: Set<string>) => {
  if (!input) return false;
  const normalized = normalizeSecretInput(input);
  return normalized.length > 0 && accepted.has(normalized);
};
