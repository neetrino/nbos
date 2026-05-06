import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import {
  EXPENSE_BACKLOG_REMINDER_TYPES,
  ExpenseBacklogRemindersService,
} from './expense-backlog-reminders.service';

describe('ExpenseBacklogRemindersService', () => {
  let prisma: MockPrisma;
  let service: ExpenseBacklogRemindersService;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.notificationJob.findUnique.mockResolvedValue(null);
    prisma.notificationRule.upsert.mockResolvedValue({ id: 'rule-1' });
    prisma.notificationEvent.upsert.mockResolvedValue({ id: 'event-1' });
    service = new ExpenseBacklogRemindersService(prisma as never);
  });

  it('creates a weekly digest when open backlog items exist', async () => {
    prisma.expense.findMany.mockResolvedValue([
      backlogRow({ id: 'e1', amount: 1000, expensePayments: [] }),
    ]);

    const result = await service.runExpenseBacklogReminders({ asOf: new Date('2026-05-05') });

    expect(result.digest.created).toBe(true);
    expect(prisma.notificationJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dedupeKey: expect.stringMatching(/^expense_backlog_digest:\d{4}-\d{2}-\d{2}$/),
        }),
      }),
    );
    expect(prisma.notificationEvent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          eventType: EXPENSE_BACKLOG_REMINDER_TYPES.WEEKLY_DIGEST,
        }),
      }),
    );
  });

  it('skips weekly digest when already scheduled for that week', async () => {
    prisma.expense.findMany.mockResolvedValue([
      backlogRow({ id: 'e1', amount: 1000, expensePayments: [] }),
    ]);
    prisma.notificationJob.findUnique.mockResolvedValueOnce({ id: 'existing' });

    const result = await service.runExpenseBacklogReminders({ asOf: new Date('2026-05-05') });

    expect(result.digest.created).toBe(false);
    expect(result.digest.reason).toBe('already_scheduled');
    expect(prisma.notificationJob.create).not.toHaveBeenCalled();
  });

  it('skips digest when no unpaid backlog rows', async () => {
    prisma.expense.findMany.mockResolvedValue([
      backlogRow({
        id: 'e1',
        amount: 1000,
        expensePayments: [{ amount: 1000 }],
      }),
    ]);

    const result = await service.runExpenseBacklogReminders({ asOf: new Date('2026-05-05') });

    expect(result.digest.created).toBe(false);
    expect(result.digest.reason).toBe('no_open_backlog');
    expect(prisma.notificationJob.create).not.toHaveBeenCalled();
  });

  it('creates due-overdue reminder for backlog expense past due with balance', async () => {
    prisma.expense.findMany
      .mockResolvedValueOnce([
        backlogRow({
          id: 'e-due',
          amount: 5000,
          dueDate: new Date('2026-05-01T00:00:00.000Z'),
          expensePayments: [{ amount: 1000 }],
        }),
      ])
      .mockResolvedValueOnce([
        backlogRow({
          id: 'e-due',
          amount: 5000,
          dueDate: new Date('2026-05-01T00:00:00.000Z'),
          expensePayments: [{ amount: 1000 }],
        }),
      ]);

    const result = await service.runExpenseBacklogReminders({ asOf: new Date('2026-05-05') });

    expect(result.due.created).toEqual([{ created: true, expenseId: 'e-due' }]);
    expect(prisma.notificationEvent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          eventType: EXPENSE_BACKLOG_REMINDER_TYPES.DUE_OVERDUE,
          sourceEntityId: 'e-due',
        }),
      }),
    );
  });
});

function backlogRow(
  overrides: Partial<{
    id: string;
    name: string;
    amount: number;
    dueDate: Date | null;
    backlogReason: string;
    expensePayments: Array<{ amount: number }>;
  }>,
) {
  return {
    id: 'e1',
    name: 'Hosting',
    amount: 1000,
    dueDate: null,
    backlogReason: 'DEBT_PAY_LATER',
    expensePayments: [] as Array<{ amount: number }>,
    ...overrides,
  };
}
