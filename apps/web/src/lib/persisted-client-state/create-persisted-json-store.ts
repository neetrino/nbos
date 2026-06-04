'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type PersistedJsonStoreConfig<T extends object> = {
  storageKey: string;
  defaultValue: T;
  parse: (raw: string | null) => T;
  /** Defaults to `${storageKey}:change`. */
  changeEvent?: string;
};

export type PersistedJsonStore<T extends object> = {
  storageKey: string;
  defaultValue: T;
  read: () => T;
  write: (partial: Partial<T>) => void;
  subscribe: (onStoreChange: () => void) => () => void;
  getServerSnapshot: () => T;
  useValue: () => readonly [T, (partial: Partial<T>) => void];
};

/** SSR-safe JSON preference object synced with localStorage after hydration. */
export function createPersistedJsonStore<T extends object>(
  config: PersistedJsonStoreConfig<T>,
): PersistedJsonStore<T> {
  const { storageKey, defaultValue, parse } = config;
  const changeEvent = config.changeEvent ?? `${storageKey}:change`;

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
    cachedSnapshot = parse(raw);
    return cachedSnapshot;
  }

  function read(): T {
    return getSnapshot();
  }

  function write(partial: Partial<T>): void {
    if (typeof window === 'undefined') {
      return;
    }
    const next = { ...getSnapshot(), ...partial };
    const serialized = JSON.stringify(next);
    try {
      window.localStorage.setItem(storageKey, serialized);
      cachedRaw = serialized;
      cachedSnapshot = next;
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

  function getServerSnapshot(): T {
    return defaultValue;
  }

  function useValue(): readonly [T, (partial: Partial<T>) => void] {
    const value = useSyncExternalStore(subscribe, read, getServerSnapshot);
    const setValue = useCallback((partial: Partial<T>) => {
      write(partial);
    }, []);
    return [value, setValue];
  }

  return {
    storageKey,
    defaultValue,
    read,
    write,
    subscribe,
    getServerSnapshot,
    useValue,
  };
}
