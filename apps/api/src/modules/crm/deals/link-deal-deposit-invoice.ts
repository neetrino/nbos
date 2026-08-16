import type { Logger } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { financeCalendarMonthKey } from '../../finance/subscriptions/subscription-coverage-month';
import {
  formatUnlinkedDepositAmountWarning,
  resolveDepositCoverageMonthCount,
} from './deal-subscription-deposit-coverage';

const SUBSCRIPTION_INVOICE_TYPE = 'SUBSCRIPTION';

type DealDepositInvoiceDb = Pick<InstanceType<typeof PrismaClient>, 'invoice'>;

export interface LinkDealDepositInvoiceInput {
  prisma: DealDepositInvoiceDb;
  logger: Pick<Logger, 'warn'>;
  dealId: string;
  dealCode: string;
  invoiceId: string | undefined;
  subscriptionId: string;
  periodAmount: unknown;
  periodCoverageMonthCount: number;
}

interface LinkableDepositInvoice {
  id: string;
  code: string;
  amount: unknown;
  paidDate: Date | null;
}

/**
 * Attach this deal's first paid invoice to a newly created Route A subscription
 * when the amount equals a whole number of period prices. Does not change amount,
 * type, moneyStatus, or payments. No-op when the invoice is already linked.
 */
export async function linkDealDepositInvoiceToSubscription(
  input: LinkDealDepositInvoiceInput,
): Promise<void> {
  if (!input.invoiceId) {
    return;
  }

  const invoice = await loadLinkableDepositInvoice(input.prisma, input.invoiceId, input.dealId);
  if (!invoice) {
    return;
  }

  const coverageMonthCount = resolveDepositCoverageMonthCount({
    invoiceAmount: invoice.amount,
    periodAmount: input.periodAmount,
    periodCoverageMonthCount: input.periodCoverageMonthCount,
  });
  if (coverageMonthCount == null) {
    input.logger.warn(
      formatUnlinkedDepositAmountWarning(
        input.dealCode,
        invoice.code,
        invoice.amount,
        input.periodAmount,
      ),
    );
    return;
  }
  if (invoice.paidDate == null) {
    input.logger.warn(
      `Deal ${input.dealCode}: deposit invoice ${invoice.code} has no paidDate; leaving unlinked`,
    );
    return;
  }

  await input.prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      subscriptionId: input.subscriptionId,
      coverageStartMonth: financeCalendarMonthKey(invoice.paidDate),
      coverageMonthCount,
    },
  });
}

async function loadLinkableDepositInvoice(
  prisma: DealDepositInvoiceDb,
  invoiceId: string,
  dealId: string,
): Promise<LinkableDepositInvoice | null> {
  const row = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      code: true,
      amount: true,
      paidDate: true,
      subscriptionId: true,
      type: true,
      order: { select: { dealId: true } },
    },
  });
  if (!row) {
    return null;
  }
  if (row.subscriptionId != null) {
    return null;
  }
  if (row.type !== SUBSCRIPTION_INVOICE_TYPE) {
    return null;
  }
  if (row.order?.dealId !== dealId) {
    return null;
  }
  return { id: row.id, code: row.code, amount: row.amount, paidDate: row.paidDate };
}
