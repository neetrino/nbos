import { describe, expect, it, vi } from 'vitest';
import { Decimal } from '@nbos/database';

import { createMockPrisma } from '../../test-utils/mock-prisma';

import { applyMarketingBonusAccrual } from './marketing-bonus-accrual-apply';

vi.mock('./marketing-bonus-accrual-preview', () => ({
  queryMarketingBonusAccrualPreview: vi.fn(),
}));

vi.mock('./company-bonus-anchor', () => ({
  resolveCompanyBonusAnchor: vi.fn().mockResolvedValue({
    orderId: 'ord1',
    projectId: 'proj1',
    orderCode: 'O-1',
    projectCode: 'P-1',
  }),
}));

import { queryMarketingBonusAccrualPreview } from './marketing-bonus-accrual-preview';

describe('applyMarketingBonusAccrual', () => {
  it('creates bonus entries for preview rows', async () => {
    vi.mocked(queryMarketingBonusAccrualPreview).mockResolvedValue({
      payrollMonth: '2026-05',
      ratesConfigured: true,
      amountPerSql: '50000.00',
      amountPerMql: '15000.00',
      rows: [
        {
          employeeId: 'e1',
          firstName: 'A',
          lastName: 'B',
          mqlCount: 1,
          sqlCount: 1,
          suggestedAmount: '65000.00',
        },
      ],
      totals: { mqlCount: 1, sqlCount: 1, suggestedAmount: '65000.00' },
      note: '',
    });

    const prisma = createMockPrisma();
    prisma.bonusEntry.findFirst.mockResolvedValue(null);
    prisma.bonusEntry.create.mockResolvedValue({ id: 'be1' });
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord1',
      projectId: 'proj1',
      productId: null,
      extensionId: null,
      product: null,
      extension: null,
    });

    const result = await applyMarketingBonusAccrual(prisma as never, '2026-05');

    expect(result.created).toBe(1);
    expect(result.skipped).toBe(0);
    expect(prisma.bonusEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employeeId: 'e1',
          type: 'MARKETING',
          amount: new Decimal('65000.00'),
        }),
      }),
    );
  });
});
