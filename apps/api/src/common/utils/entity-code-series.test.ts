import { describe, expect, it } from 'vitest';
import {
  ENTITY_CODE_PREFIX,
  formatYearScopedEntityCode,
  parseYearScopedEntityCode,
} from './entity-code-series';

describe('year-scoped entity codes', () => {
  it('pads to four digits and grows past the padding width', () => {
    expect(formatYearScopedEntityCode(ENTITY_CODE_PREFIX.invoice, 2026, 7)).toBe('INV-2026-0007');
    expect(formatYearScopedEntityCode(ENTITY_CODE_PREFIX.invoice, 2026, 9999)).toBe(
      'INV-2026-9999',
    );
    expect(formatYearScopedEntityCode(ENTITY_CODE_PREFIX.invoice, 2026, 10000)).toBe(
      'INV-2026-10000',
    );
    expect(formatYearScopedEntityCode(ENTITY_CODE_PREFIX.supportTicket, 2026, 10000)).toBe(
      'TKT-2026-10000',
    );
  });

  it('parses the suffix as a number rather than as text', () => {
    expect(parseYearScopedEntityCode('INV-2026-0007', ENTITY_CODE_PREFIX.invoice)).toEqual({
      prefix: 'INV',
      year: 2026,
      numericSuffix: 7,
    });
    expect(parseYearScopedEntityCode('INV-2026-10000', ENTITY_CODE_PREFIX.invoice)).toEqual({
      prefix: 'INV',
      year: 2026,
      numericSuffix: 10000,
    });
  });

  it('rejects malformed historical codes instead of guessing', () => {
    expect(parseYearScopedEntityCode('INV-2026-foo', ENTITY_CODE_PREFIX.invoice)).toBeNull();
    expect(parseYearScopedEntityCode('INV-26-0001', ENTITY_CODE_PREFIX.invoice)).toBeNull();
    expect(parseYearScopedEntityCode('D-2026-0001', ENTITY_CODE_PREFIX.invoice)).toBeNull();
    expect(parseYearScopedEntityCode('INV-2026-0001-extra', ENTITY_CODE_PREFIX.invoice)).toBeNull();
    expect(parseYearScopedEntityCode('INV-2026-0', ENTITY_CODE_PREFIX.invoice)).toBeNull();
    expect(parseYearScopedEntityCode('INV-2026-2147483648', ENTITY_CODE_PREFIX.invoice)).toBeNull();
  });

  it('exposes the lexicographic trap that used to pick 9999 over 10000', () => {
    expect('INV-2026-9999' > 'INV-2026-10000').toBe(true);
    const parsedWide = parseYearScopedEntityCode('INV-2026-10000', ENTITY_CODE_PREFIX.invoice);
    const parsedNarrow = parseYearScopedEntityCode('INV-2026-9999', ENTITY_CODE_PREFIX.invoice);
    expect(
      parsedWide && parsedNarrow && parsedWide.numericSuffix > parsedNarrow.numericSuffix,
    ).toBe(true);
  });
});
