import { describe, expect, it } from 'vitest';
import { getInvoiceDealTitle, getOrderDisplayTitle } from './order-display';

describe('order display', () => {
  it('prefers deal name over order code', () => {
    expect(
      getOrderDisplayTitle({
        code: 'ORD-2026-0023',
        deal: { name: 'Demo Client 13 — Active engagement', code: 'D-2026-0013' },
      }),
    ).toBe('Demo Client 13 — Active engagement');
  });

  it('falls back to order code without deal', () => {
    expect(getOrderDisplayTitle({ code: 'ORD-2026-0023' })).toBe('ORD-2026-0023');
  });

  it('returns deal title for invoice order context', () => {
    expect(
      getInvoiceDealTitle({
        deal: { name: 'Website redesign', code: 'D-2026-0001' },
      }),
    ).toBe('Website redesign');
  });
});
