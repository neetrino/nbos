import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ARMENIAN_FONT_PROBE_SAMPLE, ARMENIAN_FONT_PROBE_TEST_ID } from './armenian-font-probe';

const globalsCss = readFileSync(resolve(__dirname, '../app/globals.css'), 'utf8');
const layoutSource = readFileSync(resolve(__dirname, '../app/layout.tsx'), 'utf8');

describe('Armenian font probe', () => {
  it('keeps Inter ahead of Noto Sans Armenian on the sans stack', () => {
    const sansStack = globalsCss.match(/--font-sans:\s*([^;]+);/)?.[1];
    expect(sansStack).toBeDefined();
    if (!sansStack) return;
    expect(sansStack).toContain('var(--font-inter)');
    expect(sansStack).toContain('var(--font-noto-sans-armenian)');
    expect(sansStack.indexOf('--font-inter')).toBeLessThan(
      sansStack.indexOf('--font-noto-sans-armenian'),
    );
  });

  it('mounts a hidden HY sample without enabling the locale', () => {
    expect(layoutSource).toContain('ArmenianFontProbe');
    expect(layoutSource).toContain("subsets: ['armenian']");
    expect(ARMENIAN_FONT_PROBE_TEST_ID).toBe('armenian-font-probe');
    expect(ARMENIAN_FONT_PROBE_SAMPLE).toMatch(/[\u0530-\u058F]/);
  });
});
