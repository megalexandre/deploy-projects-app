export const isBrowser = typeof window !== 'undefined';

export const createArrayStorage = <T>(key: string) => ({
  read: (): T[] => {
    if (!isBrowser) return [];
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  },
  write: (items: T[]): void => {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  },
});

export const createRecordStorage = <T>(key: string) => ({
  read: (): Record<string, T> => {
    if (!isBrowser) return {};
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, T>)
        : {};
    } catch {
      return {};
    }
  },
  write: (record: Record<string, T>): void => {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(record));
    } catch {
      // ignore storage errors
    }
  },
});
