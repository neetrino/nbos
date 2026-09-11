import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readServiceWorkerSource(): string {
  const fromRoot = path.join(process.cwd(), 'apps/web/public/sw.js');
  const fromWeb = path.join(process.cwd(), 'public/sw.js');
  try {
    return readFileSync(fromRoot, 'utf8');
  } catch {
    return readFileSync(fromWeb, 'utf8');
  }
}

describe('Install-only service worker', () => {
  it('does not open a Cache Storage or cache authenticated responses', () => {
    const source = readServiceWorkerSource();
    expect(source).toMatch(/skipWaiting/);
    expect(source).toMatch(/clients\.claim/);
    expect(source).not.toMatch(/caches\./);
    expect(source).not.toMatch(/cache\.put/);
    expect(source).toMatch(/event\.respondWith\(fetch\(event\.request\)\)/);
  });
});
