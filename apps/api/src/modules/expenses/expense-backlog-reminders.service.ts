import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

const FINANCE_TEAM_RESOLVER = 'FINANCE_TEAM';
const SOURCE_MODULE = 'finance';

export const EXPENSE_BACKLOG_REMINDER_TYPES = {
  WEEKLY_DIGEST: 'finance.expense.backlog_weekly_digest',
  DUE_OVERDUE: 'finance.expense.backlog_due_overdue',
} as const;

type ExpenseBacklogReminderType =
  (typeof EXPENSE_BACKLOG_REMINDER_TYPES)[keyof typeof EXPENSE_BACKLOG_REMINDER_TYPES];

interface ExpenseBacklogRunParams {
  asOf?: Date;
}

interface BacklogRow {
  id: string;
  name: string;
  amount: unknown;
  dueDate: Date | null;
  /** Present for rows loaded with `backlogReason: { not: null }`; typed nullable for Prisma select. */
  backlogReason: string | null;
  expensePayments: Array<{ amount: unknown }>;
}

@Injectable()
export class ExpenseBacklogRemindersService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async runExpenseBacklogReminders(params: ExpenseBacklogRunParams = {}) {
    const asOf = startOfDayUtc(params.asOf ?? new Date());
    const digest = await this.runWeeklyDigest(asOf);
    const due = await this.runDueBacklogReminders(asOf);
    return { asOf: asOf.toISOString(), digest, due };
  }

  private async runWeeklyDigest(asOf: Date) {
    const weekKey = mondayUtcKey(asOf);
    const digestDedupeKey = `expense_backlog_digest:${weekKey}`;
    const existing = await this.prisma.notificationJob.findUnique({
      where: { dedupeKey: digestDedupeKey },
    });
    if (existing) {
      return { created: false, weekKey, reason: 'already_scheduled' as const };
    }

    const rows = await this.loadBacklogRows();
    const withRemaining = rows
      .map((row) => ({ row, remaining: expenseRemaining(row.amount, row.expensePayments) }))
      .filter((x) => x.remaining > 0);

    if (withRemaining.length === 0) {
      return { created: false, weekKey, reason: 'no_open_backlog' as const };
    }

    const totalRemaining = withRemaining.reduce((s, x) => s + x.remaining, 0);
    const payload: InputJsonValue = {
      weekOfMonday: weekKey,
      expenseCount: withRemaining.length,
      totalRemaining: String(totalRemaining),
      items: withRemaining.map(({ row, remaining }) => ({
        id: row.id,
        name: row.name,
        backlogReason: row.backlogReason,
        remaining: String(remaining),
        dueDate: row.dueDate?.toISOString() ?? null,
      })),
    };

    await this.createNotificationJob({
      eventType: EXPENSE_BACKLOG_REMINDER_TYPES.WEEKLY_DIGEST,
      priority: 'normal',
      sourceEntityType: null,
      sourceEntityId: null,
      payload,
      dedupeKey: digestDedupeKey,
      idempotencyKey: `expense-backlog-digest:${weekKey}`,
      scheduledFor: asOf,
    });

    return { created: true, weekKey, expenseCount: withRemaining.length };
  }

  private async runDueBacklogReminders(asOf: Date) {
    const rows = await this.loadBacklogRows();
    const created: Array<{ created: boolean; expenseId: string }> = [];
    let skippedExisting = 0;

    for (const row of rows) {
      const remaining = expenseRemaining(row.amount, row.expensePayments);
      if (remaining <= 0) continue;
      if (!row.dueDate || startOfDayUtc(row.dueDate).getTime() > asOf.getTime()) continue;

      const dayK = dayKey(asOf);
      const dedupeKey = `expense_backlog_due:${row.id}:${dayK}`;
      const existing = await this.prisma.notificationJob.findUnique({ where: { dedupeKey } });
      if (existing) {
        skippedExisting += 1;
        continue;
      }

      const payload: InputJsonValue = {
        expenseId: row.id,
        name: row.name,
        backlogReason: row.backlogReason,
        remaining: String(remaining),
        dueDate: row.dueDate.toISOString(),
        asOf: asOf.toISOString(),
      };

      await this.createNotificationJob({
        eventType: EXPENSE_BACKLOG_REMINDER_TYPES.DUE_OVERDUE,
        priority: 'high',
        sourceEntityType: 'Expense',
        sourceEntityId: row.id,
        payload,
        dedupeKey,
        idempotencyKey: `expense-backlog-due:${row.id}:${dayK}`,
        scheduledFor: asOf,
      });
      created.push({ created: true, expenseId: row.id });
    }

    return { created, skippedExisting };
  }

  private async loadBacklogRows(): Promise<BacklogRow[]> {
    return this.prisma.expense.findMany({
      where: {
        status: 'BACKLOG',
        backlogReason: { not: null },
      },
      select: {
        id: true,
        name: true,
        amount: true,
        dueDate: true,
        backlogReason: true,
        expensePayments: { select: { amount: true } },
      },
    });
  }

  private async createNotificationJob(args: {
    eventType: ExpenseBacklogReminderType;
    priority: 'normal' | 'high';
    sourceEntityType: string | null;
    sourceEntityId: string | null;
    payload: InputJsonValue;
    dedupeKey: string;
    idempotencyKey: string;
    scheduledFor: Date;
  }) {
    const rule = await this.prisma.notificationRule.upsert({
      where: { code: args.eventType },
      update: { enabled: true, priority: args.priority },
      create: {
        code: args.eventType,
        eventType: args.eventType,
        recipientResolver: FINANCE_TEAM_RESOLVER,
        priority: args.priority,
      },
    });

    const event = await this.prisma.notificationEvent.upsert({
      where: { idempotencyKey: args.idempotencyKey },
      update: {},
      create: {
        eventType: args.eventType,
        sourceModule: SOURCE_MODULE,
        sourceEntityType: args.sourceEntityType,
        sourceEntityId: args.sourceEntityId,
        payload: args.payload,
        idempotencyKey: args.idempotencyKey,
      },
    });

    await this.prisma.notificationJob.create({
      data: {
        eventId: event.id,
        ruleId: rule.id,
        status: 'PENDING',
        scheduledFor: args.scheduledFor,
        dedupeKey: args.dedupeKey,
      },
    });
  }
}

function expenseRemaining(amount: unknown, payments: Array<{ amount: unknown }>): number {
  const total = Number(amount);
  const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  return Math.max(0, total - paid);
}

function startOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayKey(date: Date): string {
  return startOfDayUtc(date).toISOString().slice(0, 10);
}

/** ISO date (YYYY-MM-DD) of the Monday of the UTC week containing `date`. */
function mondayUtcKey(date: Date): string {
  const utc = startOfDayUtc(date);
  const dow = utc.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  utc.setUTCDate(utc.getUTCDate() + mondayOffset);
  return utc.toISOString().slice(0, 10);
}
