'use client';

import { useEffect, useState } from 'react';

/**
 * Returns a value that updates after `delayMs` of stability.
 * Clears pending updates when `value` or `delayMs` changes.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
