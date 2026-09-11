import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readAuthEdgeSource(): string {
  const fromRoot = path.join(process.cwd(), 'apps/web/src/middleware.ts');
  const fromWeb = path.join(process.cwd(), 'src/middleware.ts');
  try {
    return readFileSync(fromRoot, 'utf8');
  } catch {
    return readFileSync(fromWeb, 'utf8');
  }
}

describe('Auth edge middleware file', () => {
  it('uses middleware.ts so /api/auth/session is a real Auth.js JSON route', () => {
    const source = readAuthEdgeSource();
    expect(source).toMatch(/export const middleware = auth\(/);
    expect(source).not.toMatch(/export const proxy = auth\(/);
    expect(source).toMatch(/api\(\?:\/\|\$\)/);
    expect(source).toMatch(/webmanifest/);
  });
});
