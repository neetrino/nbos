import { describe, expect, it } from 'vitest';
import { detectBonusPoolFundingMismatch } from '@/features/finance/utils/bonus-pool-funding-mismatch';
import type { BonusPoolTimelineEvent } from '@/lib/api/bonus';

const payment = (amount: string): BonusPoolTimelineEvent => ({
  id: 'p1',
  kind: 'PAYMENT_IN',
  occurredAt: '2026-01-01T00:00:00.000Z',
  amount,
  label: 'Payment',
  orderCode: 'ORD-1',
  employeeName: null,
  releaseType: null,
  releaseStatus: null,
  releaseReason: null,
  invoiceId: 'inv1',
  bonusEntryId: null,
});

describe('detectBonusPoolFundingMismatch', () => {
  it('returns no mismatch when payment sum matches ledger received', () => {
    const result = detectBonusPoolFundingMismatch('200000.00', [
      payment('125000.00'),
      payment('75000.00'),
    ]);
    expect(result.hasMismatch).toBe(false);
  });

  it('flags mismatch when ledger is stale vs payments', () => {
    const result = detectBonusPoolFundingMismatch('200000.00', [
      payment('1250000.00'),
      payment('1250000.00'),
    ]);
    expect(result.hasMismatch).toBe(true);
    expect(result.paymentsTotal).toBe(2500000);
    expect(result.ledgerReceived).toBe(200000);
  });
});
