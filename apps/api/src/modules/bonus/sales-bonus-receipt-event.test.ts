import { describe, expect, it } from 'vitest';
import { salesBonusEarnedPeriod, salesBonusReceiptEventAt } from './sales-bonus-receipt-event';

describe('sales-bonus-receipt-event', () => {
  it('uses the completing receipt, not job run time', () => {
    const paidDate = new Date('2026-09-15T10:00:00.000Z');
    expect(
      salesBonusReceiptEventAt({
        paidDate,
        payments: [{ paymentDate: new Date('2026-09-01T10:00:00.000Z') }],
      }),
    ).toEqual(paidDate);
  });

  it('falls back to the latest payment when paidDate is missing', () => {
    const later = new Date('2026-09-20T12:00:00.000Z');
    expect(
      salesBonusReceiptEventAt({
        paidDate: null,
        payments: [{ paymentDate: new Date('2026-09-01T10:00:00.000Z') }, { paymentDate: later }],
      }),
    ).toEqual(later);
  });

  it('labels the earned month in Asia/Yerevan, not UTC', () => {
    const receiptAt = new Date('2026-03-31T21:00:00.000Z');
    expect(salesBonusEarnedPeriod(receiptAt)).toBe('2026-04');
  });
});
