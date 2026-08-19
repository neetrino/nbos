'use client';

type PersistedReplaceStore<T> = {
  read: () => T;
  replace: (value: T) => void;
  subscribe: (onStoreChange: () => void) => () => void;
};

const storeCache = new Map<string, PersistedReplaceStore<unknown>>();

/**
 * SSR-safe JSON store with replace (not merge) writes.
 * Cached per storage key so the same pageId shares one snapshot.
 */
export function getPersistedReplaceStore<T>(
  storageKey: string,
  defaultValue: T,
  parseRaw: (raw: string | null) => T,
): PersistedReplaceStore<T> {
  const cached = storeCache.get(storageKey);
  if (cached) {
    return cached as PersistedReplaceStore<T>;
  }

  const changeEvent = `${storageKey}:change`;
  let cachedRaw: string | null | undefined;
  let cachedSnapshot: T = defaultValue;

  function getSnapshot(): T {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    const raw = window.localStorage.getItem(storageKey);
    if (raw === cachedRaw) {
      return cachedSnapshot;
    }
    cachedRaw = raw;
    cachedSnapshot = parseRaw(raw);
    return cachedSnapshot;
  }

  function replace(value: T): void {
    if (typeof window === 'undefined') {
      return;
    }
    const serialized = JSON.stringify(value);
    try {
      window.localStorage.setItem(storageKey, serialized);
      cachedRaw = serialized;
      cachedSnapshot = value;
      window.dispatchEvent(new Event(changeEvent));
    } catch {
      // Private mode / quota
    }
  }

  function subscribe(onStoreChange: () => void): () => void {
    const onChange = () => onStoreChange();
    window.addEventListener('storage', onChange);
    window.addEventListener(changeEvent, onChange);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener(changeEvent, onChange);
    };
  }

  const store: PersistedReplaceStore<T> = {
    read: getSnapshot,
    replace,
    subscribe,
  };
  storeCache.set(storageKey, store as PersistedReplaceStore<unknown>);
  return store;
}
