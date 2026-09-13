import { describe, expect, it, vi } from 'vitest';
import { registerNbosServiceWorker } from './pwa-runtime';

describe('registerNbosServiceWorker', () => {
  it('returns false when the browser has no service worker container', async () => {
    await expect(registerNbosServiceWorker(undefined)).resolves.toBe(false);
  });

  it('registers the install-only worker at site root', async () => {
    const register = vi.fn().mockResolvedValue({});
    await expect(registerNbosServiceWorker({ register })).resolves.toBe(true);
    expect(register).toHaveBeenCalledWith('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });
  });
});
