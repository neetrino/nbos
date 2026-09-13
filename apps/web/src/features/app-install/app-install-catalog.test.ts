import { describe, expect, it } from 'vitest';
import { APP_INSTALL_CATALOG, buildInstallAbsoluteUrl } from './app-install-catalog';

describe('APP_INSTALL_CATALOG', () => {
  it('lists mini apps before the main NBOS app', () => {
    const kinds = APP_INSTALL_CATALOG.map((entry) => entry.kind);
    expect(kinds.at(-1)).toBe('main');
    expect(kinds.slice(0, -1).every((kind) => kind === 'mini')).toBe(true);
  });
});

describe('buildInstallAbsoluteUrl', () => {
  it('joins origin and path without a double slash', () => {
    expect(buildInstallAbsoluteUrl('https://nbos.example', '/quick/task')).toBe(
      'https://nbos.example/quick/task',
    );
    expect(buildInstallAbsoluteUrl('https://nbos.example/', '/')).toBe('https://nbos.example/');
  });
});
