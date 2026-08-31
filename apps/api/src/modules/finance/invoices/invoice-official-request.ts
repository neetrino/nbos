import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@nbos/database';
import { OFFICIAL_SEND_CANCELLED_MESSAGE } from './invoice-official-awaiting-send';
import { extendSubscriptionDueDateAfterOfficialSend } from './invoice-official-due-date-extend';
import { assertOfficialInvoiceRequestSend } from './invoice-tax-readiness-assert';

export interface InvoiceOfficialRequestRow {
  id: string;
  taxStatus: string;
  moneyStatus: string;
  companyId: string | null;
  orderId: string | null;
  orderComment: string | null;
  officialInvoiceRequestSent: boolean;
  officialInvoiceSentAt: Date | null;
  officialInvoiceCancelledAt: Date | null;
  govInvoiceId: string | null;
  company: { name: string; legalName: string | null; taxId: string | null } | null;
}

export function isOfficialRequestBlockingTaxReminders(invoice: {
  taxStatus: string;
  officialInvoiceRequestSent: boolean;
}): boolean {
  return invoice.taxStatus === 'TAX' && !invoice.officialInvoiceRequestSent;
}

export async function sendOfficialInvoiceRequest(
  prisma: InstanceType<typeof PrismaClient>,
  invoiceId: string,
): Promise<InvoiceOfficialRequestRow> {
  const invoice = await loadInvoice(prisma, invoiceId);
  if (invoice.taxStatus !== 'TAX') {
    throw new BadRequestException('Official invoice request applies only to Tax invoices');
  }
  if (invoice.moneyStatus === 'CANCELLED') {
    throw new BadRequestException(OFFICIAL_SEND_CANCELLED_MESSAGE);
  }
  assertOfficialInvoiceRequestSend(invoice);

  const now = new Date();
  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      officialInvoiceRequestSent: true,
      officialInvoiceSentAt: now,
      officialInvoiceCancelledAt: null,
    },
    select: officialRequestSelect,
  });
  await extendSubscriptionDueDateAfterOfficialSend(prisma, invoiceId, now);
  return updated;
}

export async function cancelOfficialInvoiceRequest(
  prisma: InstanceType<typeof PrismaClient>,
  invoiceId: string,
): Promise<InvoiceOfficialRequestRow> {
  const invoice = await loadInvoice(prisma, invoiceId);
  if (invoice.taxStatus !== 'TAX') {
    throw new BadRequestException('Official invoice request applies only to Tax invoices');
  }
  if (!invoice.officialInvoiceRequestSent) {
    throw new BadRequestException('No active official invoice request to cancel');
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      officialInvoiceRequestSent: false,
      officialInvoiceCancelledAt: new Date(),
    },
    select: officialRequestSelect,
  });
}

export async function updateOfficialInvoiceGovId(
  prisma: InstanceType<typeof PrismaClient>,
  invoiceId: string,
  govInvoiceId: string | null,
): Promise<InvoiceOfficialRequestRow> {
  await loadInvoice(prisma, invoiceId);
  const trimmed = govInvoiceId?.trim() ?? '';
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { govInvoiceId: trimmed.length > 0 ? trimmed : null },
    select: officialRequestSelect,
  });
}

async function loadInvoice(
  prisma: InstanceType<typeof PrismaClient>,
  invoiceId: string,
): Promise<InvoiceOfficialRequestRow> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: officialRequestSelect,
  });
  if (!invoice) throw new NotFoundException(`Invoice ${invoiceId} not found`);
  return invoice;
}

const officialRequestSelect = {
  id: true,
  taxStatus: true,
  moneyStatus: true,
  companyId: true,
  orderId: true,
  orderComment: true,
  officialInvoiceRequestSent: true,
  officialInvoiceSentAt: true,
  officialInvoiceCancelledAt: true,
  govInvoiceId: true,
  company: { select: { name: true, legalName: true, taxId: true } },
} satisfies Prisma.InvoiceSelect;
