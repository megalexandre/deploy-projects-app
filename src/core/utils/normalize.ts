export type UnknownRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

export const asBooleanString = (value: unknown): string | undefined => {
  if (typeof value === 'boolean') return value ? 'sim' : 'nao';
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === 'sim') return 'sim';
    if (normalized === 'false' || normalized === 'nao') return 'nao';
    return value;
  }
  return undefined;
};

export const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value
      .trim()
      .replace(/[^\d,.-]/g, '')
      .replace(/\.(?=.*\.)/g, '')
      .replace(',', '.');
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

export const asArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];
