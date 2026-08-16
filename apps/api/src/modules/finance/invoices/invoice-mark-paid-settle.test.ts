import { describe, expect, it } from 'vitest';
import {
  MARK_PAID_AUTO_PAYMENT_METHOD,
  MARK_PAID_AUTO_PAYMENT_NOTE,
  markPaidPaymentDateIso,
} from './invoice-mark-paid-settle';

describe('invoice-mark-paid-settle', () => {
  it('exposes default method and audit note for Mark Paid auto Payment', () => {
    expect(MARK_PAID_AUTO_PAYMENT_METHOD).toBe('TRANSACTION');
    expect(MARK_PAID_AUTO_PAYMENT_NOTE).toContain('marked as paid');
  });

  it('exposes payments DI token for Mark Paid settle without circular import', async () => {
    const { PAYMENTS_SERVICE_TOKEN } = await import('./invoice-mark-paid-settle');
    expect(PAYMENTS_SERVICE_TOKEN).toBe('NBOS_PAYMENTS_SERVICE');
  });

  it('formats payment date as YYYY-MM-DD UTC calendar day', () => {
    expect(markPaidPaymentDateIso(new Date('2026-07-17T18:04:00.000Z'))).toBe('2026-07-17');
  });
});
