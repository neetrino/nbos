import { describe, expect, it } from 'vitest';
import {
  resolveInvoiceDisplaySubtitle,
  resolveInvoiceDisplayTitle,
  resolveOrderDisplayTitle,
} from './invoice-display-title';

describe('resolveInvoiceDisplayTitle', () => {
  it('uses deal name, then order code, then subscription name, then invoice code', () => {
    expect(
      resolveInvoiceDisplayTitle({
        code: 'INV-2026-0138',
        order: {
          code: 'ORD-1',
          deal: { name: 'SEO Qualitech', code: 'D-1' },
        },
      }),
    ).toBe('SEO Qualitech');
    expect(resolveOrderDisplayTitle({ code: 'ORD-1' })).toBe('ORD-1');
    expect(
      resolveInvoiceDisplayTitle({
        code: 'INV-1',
        subscription: { name: 'Acme maintenance', code: 'SUB-1' },
      }),
    ).toBe('Acme maintenance');
    expect(resolveInvoiceDisplayTitle({ code: 'INV-1' })).toBe('INV-1');
  });

  it('returns invoice code as subtitle when title comes from a source', () => {
    expect(
      resolveInvoiceDisplaySubtitle({
        code: 'INV-2026-0138',
        order: { code: 'ORD-1', deal: { name: 'SEO Qualitech', code: 'D-1' } },
      }),
    ).toBe('INV-2026-0138');
    expect(resolveInvoiceDisplaySubtitle({ code: 'INV-1' })).toBeUndefined();
  });
});
