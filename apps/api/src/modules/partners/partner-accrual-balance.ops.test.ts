import { describe, it, expect, beforeEach } from 'vitest';
import { Decimal } from '@nbos/database';
import { loadPartnerAccrualBalance } from './partner-accrual-balance.ops';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('loadPartnerAccrualBalance', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it('returns zeroed byStatus when there are no accruals', async () => {
    prisma.partnerAccrual.groupBy.mockResolvedValue([]);

    const result = await loadPartnerAccrualBalance(prisma as never, 'partner-1');

    expect(result.unpaidTotal).toBe('0.00');
    expect(result.paidTotal).toBe('0.00');
    expect(result.byStatus.ELIGIBLE).toBe('0.00');
    expect(result.byStatus.PAID).toBe('0.00');
  });

  it('aggregates unpaid and paid from groupBy sums', async () => {
    prisma.partnerAccrual.groupBy.mockResolvedValue([
      { status: 'ELIGIBLE', _sum: { amount: new Decimal('100.50') } },
      { status: 'IN_BATCH', _sum: { amount: new Decimal('20') } },
      { status: 'PAID', _sum: { amount: new Decimal('50.25') } },
    ]);

    const result = await loadPartnerAccrualBalance(prisma as never, 'partner-1');

    expect(result.byStatus.ELIGIBLE).toBe('100.50');
    expect(result.byStatus.IN_BATCH).toBe('20.00');
    expect(result.byStatus.PAID).toBe('50.25');
    expect(result.unpaidTotal).toBe('120.50');
    expect(result.paidTotal).toBe('50.25');
  });
});
