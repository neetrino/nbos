import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@nbos/database';

export interface InvoiceOfficialRequestRow {
  id: string;
  taxStatus: string;
  officialInvoiceRequestSent: boolean;
  officialInvoiceSentAt: Date | null;
  officialInvoiceCancelledAt: Date | null;
  govInvoiceId: string | null;
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

  const now = new Date();
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      officialInvoiceRequestSent: true,
      officialInvoiceSentAt: now,
      officialInvoiceCancelledAt: null,
    },
    select: officialRequestSelect,
  });
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
  officialInvoiceRequestSent: true,
  officialInvoiceSentAt: true,
  officialInvoiceCancelledAt: true,
  govInvoiceId: true,
} satisfies Prisma.InvoiceSelect;
