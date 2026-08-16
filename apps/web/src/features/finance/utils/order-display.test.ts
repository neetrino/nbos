import { describe, expect, it } from 'vitest';
import {
  getInvoiceDealTitle,
  getInvoiceDisplaySubtitle,
  getInvoiceDisplayTitle,
  getOrderDisplayTitle,
} from './order-display';

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

  it('uses deal/order title as primary invoice label', () => {
    expect(
      getInvoiceDisplayTitle({
        code: 'INV-2026-0042',
        order: {
          code: 'ORD-2026-0023',
          deal: { name: 'Website redesign', code: 'D-2026-0001' },
        },
      }),
    ).toBe('Website redesign');
  });

  it('prefers order title over subscription name', () => {
    expect(
      getInvoiceDisplayTitle({
        code: 'INV-2026-0042',
        order: { code: 'ORD-2026-0023' },
        subscription: { name: 'Acme maintenance', code: 'SUB-2026-0001' },
      }),
    ).toBe('ORD-2026-0023');
  });

  it('uses subscription name when invoice has no order', () => {
    expect(
      getInvoiceDisplayTitle({
        code: 'INV-2026-0042',
        subscription: { name: 'Acme maintenance', code: 'SUB-2026-0001' },
      }),
    ).toBe('Acme maintenance');
  });

  it('falls back to subscription code for blank subscription name', () => {
    expect(
      getInvoiceDisplayTitle({
        code: 'INV-2026-0042',
        subscription: { name: '   ', code: 'SUB-2026-0001' },
      }),
    ).toBe('SUB-2026-0001');
  });

  it('falls back to invoice code without order or subscription', () => {
    expect(getInvoiceDisplayTitle({ code: 'INV-2026-0042' })).toBe('INV-2026-0042');
  });

  it('returns invoice code as subtitle when title comes from order or subscription', () => {
    expect(
      getInvoiceDisplaySubtitle({
        code: 'INV-2026-0042',
        subscription: { name: 'Acme maintenance', code: 'SUB-2026-0001' },
      }),
    ).toBe('INV-2026-0042');
    expect(getInvoiceDisplaySubtitle({ code: 'INV-2026-0042' })).toBeUndefined();
  });
});
