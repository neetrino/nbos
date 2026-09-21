import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = dirname(fileURLToPath(import.meta.url));

describe('sale price default endpoint', () => {
  it('is gone from the catalog structure routes', () => {
    const source = readFileSync(join(root, 'catalog-structure.controller.ts'), 'utf8');
    expect(source).not.toContain('default-unit-price');
    expect(source).not.toContain('defaultUnitPrice');
    expect(source).not.toContain('setDefaultUnitPrice');
  });
});
