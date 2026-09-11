'use client';

import { useEffect } from 'react';
import { registerNbosServiceWorker } from './pwa-runtime';

/** Registers the install-only service worker on every page, including sign-in. */
export function PwaRegister() {
  useEffect(() => {
    void registerNbosServiceWorker(navigator.serviceWorker);
  }, []);

  return null;
}
