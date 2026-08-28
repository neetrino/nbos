import type { InvoiceMoneyStatusEnum, PrismaClient } from '@nbos/database';
import { shouldCancelOfficialRequestOnCardCancel } from '@nbos/shared';
import { cancelOfficialInvoiceRequest } from './invoice-official-request';
import { assertInvoiceTaxMoneyStatusGate } from './invoice-tax-readiness-assert';

export interface InvoiceMoneyStatusTransitionRow {
  id: string;
  taxStatus: string;
  moneyStatus: InvoiceMoneyStatusEnum;
  companyId: string | null;
  officialInvoiceRequestSent: boolean;
  company: { name: string; legalName: string | null; taxId: string | null } | null;
}

export const INVOICE_MONEY_STATUS_TRANSITION_SELECT = {
  id: true,
  orderId: true,
  amount: true,
  dueDate: true,
  taxStatus: true,
  moneyStatus: true,
  companyId: true,
  officialInvoiceRequestSent: true,
  company: { select: { name: true, legalName: true, taxId: true } },
  payments: {
    select: {
      amount: true,
      paymentDate: true,
    },
  },
} as const;

/** Cancelled starts a new D-10/D-2 cycle; On Hold and other statuses do not. */
export function paymentReminderCycleIncrement(
  current: InvoiceMoneyStatusEnum,
  target: InvoiceMoneyStatusEnum,
): { increment: 1 } | undefined {
  if (target !== 'CANCELLED' || current === 'CANCELLED') return undefined;
  return { increment: 1 };
}

/** Gates Tax money-status changes and cancels an issued official request on card cancel. */
export async function prepareInvoiceMoneyStatusTransition(
  prisma: InstanceType<typeof PrismaClient>,
  invoice: InvoiceMoneyStatusTransitionRow,
  targetMoneyStatus: InvoiceMoneyStatusEnum,
): Promise<void> {
  assertInvoiceTaxMoneyStatusGate({
    taxStatus: invoice.taxStatus,
    currentMoneyStatus: invoice.moneyStatus,
    targetMoneyStatus,
    companyId: invoice.companyId,
    company: invoice.company,
    officialInvoiceRequestSent: invoice.officialInvoiceRequestSent,
  });
  if (targetMoneyStatus === 'CANCELLED' && shouldCancelOfficialRequestOnCardCancel(invoice)) {
    await cancelOfficialInvoiceRequest(prisma, invoice.id);
  }
}
