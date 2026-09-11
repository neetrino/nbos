import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readAuthEdgeSource(): string {
  const fromRoot = path.join(process.cwd(), 'apps/web/src/proxy.ts');
  const fromWeb = path.join(process.cwd(), 'src/proxy.ts');
  try {
    return readFileSync(fromRoot, 'utf8');
  } catch {
    return readFileSync(fromWeb, 'utf8');
  }
}

describe('Auth edge proxy file', () => {
  it('reads the session cookie and never re-issues it via the Auth.js auth() wrapper', () => {
    const source = readAuthEdgeSource();
    expect(source).toMatch(/export async function proxy\(/);
    expect(source).toMatch(/readAuthJsSessionToken/);
    expect(source).not.toMatch(/export const middleware = auth\(/);
    expect(source).not.toMatch(/export const proxy = auth\(/);
    expect(source).toMatch(/api\(\?:\/\|\$\)/);
    expect(source).toMatch(/webmanifest/);
  });
});
