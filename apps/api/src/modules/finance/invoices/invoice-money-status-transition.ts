import type { InvoiceMoneyStatusEnum, PrismaClient } from '@nbos/database';
import {
  getInvoiceManualProductGateErrors,
  shouldCancelOfficialRequestOnCardCancel,
} from '@nbos/shared';
import { BadRequestException } from '@nestjs/common';
import { cancelOfficialInvoiceRequest } from './invoice-official-request';
import { assertInvoiceTaxMoneyStatusGate } from './invoice-tax-readiness-assert';

export interface InvoiceMoneyStatusTransitionRow {
  id: string;
  type: string;
  taxStatus: string;
  moneyStatus: InvoiceMoneyStatusEnum;
  companyId: string | null;
  productId: string | null;
  officialInvoiceRequestSent: boolean;
  orderId?: string | null;
  orderComment?: string | null;
  company: { name: string; legalName: string | null; taxId: string | null } | null;
}

export const INVOICE_MONEY_STATUS_TRANSITION_SELECT = {
  id: true,
  type: true,
  orderId: true,
  orderComment: true,
  amount: true,
  dueDate: true,
  taxStatus: true,
  moneyStatus: true,
  companyId: true,
  productId: true,
  officialInvoiceRequestSent: true,
  company: { select: { name: true, legalName: true, taxId: true } },
  payments: {
    select: {
      amount: true,
      paymentDate: true,
    },
  },
} as const;

/** Cancelled starts a new payment-window reminder cycle; On Hold does not. */
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
  const productErrors = getInvoiceManualProductGateErrors({
    type: invoice.type,
    productId: invoice.productId,
    targetMoneyStatus,
  });
  if (productErrors[0]) {
    throw new BadRequestException(productErrors[0].message);
  }
  assertInvoiceTaxMoneyStatusGate({
    taxStatus: invoice.taxStatus,
    currentMoneyStatus: invoice.moneyStatus,
    targetMoneyStatus,
    companyId: invoice.companyId,
    company: invoice.company,
    officialInvoiceRequestSent: invoice.officialInvoiceRequestSent,
    orderId: invoice.orderId,
    orderComment: invoice.orderComment,
  });
  if (targetMoneyStatus === 'CANCELLED' && shouldCancelOfficialRequestOnCardCancel(invoice)) {
    await cancelOfficialInvoiceRequest(prisma, invoice.id);
  }
}
