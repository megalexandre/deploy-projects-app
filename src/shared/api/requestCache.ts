type CacheEntry<T> = {
  value?: T;
  expiresAt: number;
  promise?: Promise<T>;
};

const invalidators = new Set<() => void>();

const effectiveTtl = (ttlMs: number) => (import.meta.env.MODE === 'test' ? 0 : ttlMs);

export const clearAllRequestCaches = () => {
  invalidators.forEach((invalidate) => invalidate());
};

export const createRequestCache = <T>(ttlMs = 30_000) => {
  let entry: CacheEntry<T> | undefined;

  const invalidate = () => {
    entry = undefined;
  };
  invalidators.add(invalidate);

  return {
    get(loader: () => Promise<T>, force = false): Promise<T> {
      const now = Date.now();
      if (!force && entry?.promise) return entry.promise;
      if (!force && entry?.value !== undefined && entry.expiresAt > now) {
        return Promise.resolve(entry.value);
      }

      const promise = loader()
        .then((value) => {
          entry = { value, expiresAt: Date.now() + effectiveTtl(ttlMs) };
          return value;
        })
        .catch((error) => {
          entry = undefined;
          throw error;
        });
      entry = { expiresAt: 0, promise };
      return promise;
    },
    invalidate,
  };
};

export const createKeyedRequestCache = <T>(ttlMs = 30_000) => {
  const entries = new Map<string, CacheEntry<T>>();

  const invalidate = (key?: string) => {
    if (key === undefined) {
      entries.clear();
      return;
    }
    entries.delete(key);
  };
  invalidators.add(() => invalidate());

  return {
    get(key: string, loader: () => Promise<T>, force = false): Promise<T> {
      const entry = entries.get(key);
      const now = Date.now();
      if (!force && entry?.promise) return entry.promise;
      if (!force && entry?.value !== undefined && entry.expiresAt > now) {
        return Promise.resolve(entry.value);
      }

      const promise = loader()
        .then((value) => {
          entries.set(key, { value, expiresAt: Date.now() + effectiveTtl(ttlMs) });
          return value;
        })
        .catch((error) => {
          entries.delete(key);
          throw error;
        });
      entries.set(key, { expiresAt: 0, promise });
      return promise;
    },
    invalidate,
  };
};
