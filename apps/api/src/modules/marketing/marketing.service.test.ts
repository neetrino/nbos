import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketingService } from './marketing.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import type { ExpensesService } from '../expenses/expenses.service';

describe('MarketingService', () => {
  let service: MarketingService;
  let prisma: MockPrisma;
  let expensesService: Pick<ExpensesService, 'create'>;

  beforeEach(() => {
    prisma = createMockPrisma();
    expensesService = { create: vi.fn().mockResolvedValue({ id: 'expense-1' }) };
    service = new MarketingService(prisma as never, expensesService as never);
  });

  it('returns account and activity attribution options for a channel', async () => {
    prisma.marketingAccount.findMany.mockResolvedValue([
      { id: 'account-1', name: 'List.am 1', channel: 'LIST_AM', phone: '+374' },
    ]);
    prisma.marketingActivity.findMany.mockResolvedValue([
      { id: 'activity-1', title: 'List.am push', channel: 'LIST_AM', status: 'LAUNCHED' },
    ]);

    const result = await service.getAttributionOptions('list_am');

    expect(result).toEqual([
      {
        id: 'account-1',
        label: 'List.am 1',
        type: 'ACCOUNT',
        channel: 'LIST_AM',
        subtitle: '+374',
      },
      {
        id: 'activity-1',
        label: 'List.am push',
        type: 'ACTIVITY',
        channel: 'LIST_AM',
        subtitle: 'LAUNCHED',
      },
    ]);
  });

  it('adds organic option for social channels', async () => {
    prisma.marketingAccount.findMany.mockResolvedValue([]);
    prisma.marketingActivity.findMany.mockResolvedValue([]);

    const result = await service.getAttributionOptions('META_ADS');

    expect(result).toContainEqual({
      id: 'organic:META_ADS',
      label: 'Organic / Not from ad',
      type: 'ORGANIC',
      channel: 'META_ADS',
    });
  });

  it('blocks List.am launch without account', async () => {
    prisma.marketingActivity.findUnique.mockResolvedValue({
      ...activityFixture(),
      channel: 'LIST_AM',
      type: 'LIST_AM_PROMOTION',
      accountId: null,
    });

    await expect(
      service.launchActivity('activity-1', {
        startDate: '2026-05-01',
        budget: 100,
        expectedPayAt: '2026-05-02',
      }),
    ).rejects.toMatchObject({
      response: {
        errors: expect.arrayContaining([
          { field: 'accountId', message: 'Account is required for this channel.' },
        ]),
      },
    });
  });

  it('blocks paid launch without payment date or no-expense reason', async () => {
    prisma.marketingActivity.findUnique.mockResolvedValue(activityFixture());

    await expect(
      service.launchActivity('activity-1', { startDate: '2026-05-01', budget: 100 }),
    ).rejects.toMatchObject({
      response: {
        errors: expect.arrayContaining([
          {
            field: 'expectedPayAt',
            message: 'Expected payment date or no-expense reason is required.',
          },
        ]),
      },
    });
  });

  it('creates Finance-owned expense proposal and links launched activity', async () => {
    prisma.marketingActivity.findUnique.mockResolvedValue(activityFixture());

    await service.launchActivity('activity-1', {
      startDate: '2026-05-01',
      budget: 100,
      expectedPayAt: '2026-05-02',
    });

    expect(expensesService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'PLANNED',
        category: 'MARKETING',
        status: 'THIS_MONTH',
        amount: 100,
      }),
    );
    expect(prisma.marketingActivity.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'LAUNCHED',
          expenseCardId: 'expense-1',
        }),
      }),
    );
  });

  it('returns conservative dashboard summary from linked marketing data', async () => {
    prisma.marketingAccount.findMany.mockResolvedValue([
      { financeExpensePlanId: 'plan-1' },
      { financeExpensePlanId: null },
    ]);
    prisma.marketingActivity.findMany.mockResolvedValue([
      { status: 'LAUNCHED', budget: 50000, expenseCardId: 'expense-1' },
      { status: 'READY', budget: 25000, expenseCardId: null },
    ]);
    prisma.deal.findMany.mockResolvedValue([
      {
        status: 'WON',
        orders: [
          {
            invoices: [
              {
                payments: [{ amount: 40000 }, { amount: 10000 }],
              },
            ],
          },
        ],
      },
      { status: 'SEND_OFFER', orders: [] },
    ]);

    const summary = await service.getDashboardSummary();

    expect(summary).toMatchObject({
      totals: {
        accounts: 2,
        activities: 2,
        launchedActivities: 1,
        activitiesWithFinanceExpense: 1,
        missingFinanceLinks: 2,
        attributedDeals: 2,
        wonAttributedDeals: 1,
      },
      money: {
        plannedSpend: 75000,
        paidRevenue: 50000,
      },
    });
    expect(summary.warnings).toEqual([
      expect.objectContaining({ code: 'MISSING_ACCOUNT_FINANCE_LINKS', count: 1 }),
      expect.objectContaining({ code: 'MISSING_ACTIVITY_EXPENSE_LINKS', count: 1 }),
    ]);
  });
});

function activityFixture() {
  return {
    id: 'activity-1',
    title: 'Meta Launch',
    channel: 'META_ADS',
    type: 'AD_CAMPAIGN',
    status: 'READY',
    accountId: null,
    ownerId: null,
    description: null,
    budget: null,
    currency: 'AMD',
    startDate: null,
    endDate: null,
    expectedPayAt: null,
    expenseCardId: null,
    expensePlanId: null,
    notes: null,
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-01'),
  };
}
