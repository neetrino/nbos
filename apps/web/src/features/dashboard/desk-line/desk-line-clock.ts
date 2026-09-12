'use client';

import { useEffect, useState } from 'react';
import { nextYerevanMidnightUtc } from './desk-line-calendar';

const MAX_TIMEOUT_MS = 2_147_483_647;

export interface DeskClockHost {
  setTimeout: (handler: () => void, delay: number) => number;
  clearTimeout: (id: number) => void;
  addWindowListener: (type: 'focus', handler: () => void) => void;
  removeWindowListener: (type: 'focus', handler: () => void) => void;
  addDocumentListener: (type: 'visibilitychange', handler: () => void) => void;
  removeDocumentListener: (type: 'visibilitychange', handler: () => void) => void;
  isDocumentVisible: () => boolean;
}

export function browserDeskClockHost(): DeskClockHost {
  return {
    setTimeout: (handler, delay) => window.setTimeout(handler, delay),
    clearTimeout: (id) => window.clearTimeout(id),
    addWindowListener: (type, handler) => window.addEventListener(type, handler),
    removeWindowListener: (type, handler) => window.removeEventListener(type, handler),
    addDocumentListener: (type, handler) => document.addEventListener(type, handler),
    removeDocumentListener: (type, handler) => document.removeEventListener(type, handler),
    isDocumentVisible: () => document.visibilityState === 'visible',
  };
}

export function subscribeYerevanDeskClock(
  tick: () => void,
  host: DeskClockHost = browserDeskClockHost(),
  now: () => Date = () => new Date(),
): () => void {
  const onVisible = (): void => {
    if (host.isDocumentVisible()) tick();
  };
  host.addWindowListener('focus', tick);
  host.addDocumentListener('visibilitychange', onVisible);

  let timeoutId = 0;
  const arm = (): void => {
    const wait = Math.min(Math.max(nextYerevanMidnightUtc(now()).getTime() - now().getTime(), 1), MAX_TIMEOUT_MS);
    timeoutId = host.setTimeout(() => {
      tick();
      arm();
    }, wait);
  };
  arm();

  return () => {
    host.removeWindowListener('focus', tick);
    host.removeDocumentListener('visibilitychange', onVisible);
    host.clearTimeout(timeoutId);
  };
}

export function useYerevanDeskClock(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = (): void => {
      setNow(new Date());
    };
    tick();
    return subscribeYerevanDeskClock(tick);
  }, []);

  return now;
}
