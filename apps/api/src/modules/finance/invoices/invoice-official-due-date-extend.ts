import type { PrismaClient } from '@nbos/database';
import { clampBillingDayInMonth } from '../billing/subscription-billing-days';
import { resolveSubscriptionInvoiceDueDate } from './subscription-invoice-due-date';
import { yerevanCalendarDayStart } from './yerevan-calendar-date';

/** Extends subscription dueDate when official issue is later than the pay-day anchor. */
export async function extendSubscriptionDueDateAfterOfficialSend(
  prisma: InstanceType<typeof PrismaClient>,
  invoiceId: string,
  officialSentAt: Date,
): Promise<void> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      dueDate: true,
      coverageStartMonth: true,
      subscription: { select: { billingDay: true } },
    },
  });
  if (!invoice?.subscription || invoice.dueDate == null) return;
  const expectedPayDate = expectedPayDateFromCoverage(
    invoice.coverageStartMonth,
    invoice.subscription.billingDay,
  );
  if (expectedPayDate == null) return;
  const nextDue = resolveSubscriptionInvoiceDueDate({
    expectedPayDate,
    issuedOn: officialSentAt,
  });
  if (nextDue.getTime() <= invoice.dueDate.getTime()) return;
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { dueDate: nextDue },
  });
}

function expectedPayDateFromCoverage(
  coverageStartMonth: string | null,
  billingDay: number,
): Date | null {
  if (coverageStartMonth == null || !/^\d{4}-\d{2}$/.test(coverageStartMonth)) return null;
  const year = Number(coverageStartMonth.slice(0, 4));
  const month = Number(coverageStartMonth.slice(5, 7));
  const day = clampBillingDayInMonth(year, month, billingDay);
  const key = `${coverageStartMonth}-${String(day).padStart(2, '0')}`;
  return yerevanCalendarDayStart(key);
}
