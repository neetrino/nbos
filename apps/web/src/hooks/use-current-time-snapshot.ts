'use client';

import { useSyncExternalStore } from 'react';

const CLOCK_REFRESH_MS = 60 * 1000;

let currentTimeSnapshot = Date.now();
let clockTimerId: number | undefined;
const clockListeners = new Set<() => void>();

function subscribeToClock(onStoreChange: () => void): () => void {
  clockListeners.add(onStoreChange);
  if (!clockTimerId) {
    clockTimerId = window.setInterval(() => {
      currentTimeSnapshot = Date.now();
      clockListeners.forEach((listener) => listener());
    }, CLOCK_REFRESH_MS);
  }
  return () => {
    clockListeners.delete(onStoreChange);
    if (clockListeners.size === 0 && clockTimerId) {
      window.clearInterval(clockTimerId);
      clockTimerId = undefined;
    }
  };
}

function getCurrentTimeSnapshot(): number {
  return currentTimeSnapshot;
}

/** Current time that updates on an interval — safe to read during render. */
export function useCurrentTimeSnapshot(): number {
  return useSyncExternalStore(subscribeToClock, getCurrentTimeSnapshot, getCurrentTimeSnapshot);
}
