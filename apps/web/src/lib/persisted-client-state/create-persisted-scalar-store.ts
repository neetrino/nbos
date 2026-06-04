'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type PersistedScalarStoreConfig<T extends string> = {
  storageKey: string;
  defaultValue: T;
  parse: (raw: string | null) => T;
  /** Defaults to `${storageKey}:change`. */
  changeEvent?: string;
};

export type PersistedScalarStore<T extends string> = {
  storageKey: string;
  defaultValue: T;
  read: () => T;
  write: (value: T) => void;
  subscribe: (onStoreChange: () => void) => () => void;
  getServerSnapshot: () => T;
  useValue: () => readonly [T, (value: T) => void];
};

/** SSR-safe scalar preference synced with localStorage after hydration. */
export function createPersistedScalarStore<T extends string>(
  config: PersistedScalarStoreConfig<T>,
): PersistedScalarStore<T> {
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

  function write(value: T): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(storageKey, value);
      cachedRaw = value;
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

  function getServerSnapshot(): T {
    return defaultValue;
  }

  function useValue(): readonly [T, (value: T) => void] {
    const value = useSyncExternalStore(subscribe, read, getServerSnapshot);
    const setValue = useCallback((next: T) => {
      write(next);
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
