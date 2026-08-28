import type { InvoiceTypeEnum, PrismaClient } from '@nbos/database';
import { resolveInvoiceDueDate } from './invoice-create-resolver';
import { resolveSubscriptionInvoiceDueDate } from './subscription-invoice-due-date';
import { financeCalendarMonthKey } from '../subscriptions/subscription-coverage-month';
import {
  resolveSubscriptionBillingTarget,
  yerevanYearMonth,
  buildSubscriptionBillingTarget,
} from '../billing/subscription-billing-window';

export interface InvoiceCreateSchedule {
  dueDate: Date;
  coverageStartMonth: string | null;
}

/**
 * Subscription cards without an explicit dueDate use pay-day + 5 grace.
 * Explicit dueDate keeps coverage on that date. Other types stay +10.
 */
export async function resolveInvoiceCreateSchedule(
  prisma: InstanceType<typeof PrismaClient>,
  data: { subscriptionId?: string; dueDate?: string; type: InvoiceTypeEnum },
  now: Date = new Date(),
): Promise<InvoiceCreateSchedule> {
  if (data.type !== 'SUBSCRIPTION' || !data.subscriptionId?.trim()) {
    return { dueDate: resolveInvoiceDueDate(data.dueDate), coverageStartMonth: null };
  }
  if (data.dueDate?.trim()) {
    const dueDate = resolveInvoiceDueDate(data.dueDate);
    return { dueDate, coverageStartMonth: financeCalendarMonthKey(dueDate) };
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: data.subscriptionId },
    select: { billingDay: true },
  });
  const billingDay = subscription?.billingDay ?? 1;
  const target =
    resolveSubscriptionBillingTarget(now, billingDay) ?? currentMonthTarget(now, billingDay);
  return {
    dueDate: resolveSubscriptionInvoiceDueDate({
      expectedPayDate: target.expectedPayDate,
      issuedOn: now,
    }),
    coverageStartMonth: target.coverageMonthKey,
  };
}

function currentMonthTarget(now: Date, billingDay: number) {
  const { year, month } = yerevanYearMonth(now);
  return buildSubscriptionBillingTarget(year, month, billingDay);
}
