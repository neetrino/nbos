import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@nbos/database';
import { sumAmounts } from '../finance-status.utils';

const TAX_STATUSES = new Set(['TAX', 'TAX_FREE']);

export type UpdateInvoiceGeneralInput = {
  amount?: number;
  taxStatus?: string;
};

export function parseUpdateInvoiceGeneralInput(
  body: UpdateInvoiceGeneralInput,
): UpdateInvoiceGeneralInput {
  const out: UpdateInvoiceGeneralInput = {};

  if (body.amount !== undefined) {
    if (!Number.isFinite(body.amount) || body.amount <= 0) {
      throw new BadRequestException('Invoice amount must be greater than zero');
    }
    out.amount = body.amount;
  }

  if (body.taxStatus !== undefined) {
    if (!TAX_STATUSES.has(body.taxStatus)) {
      throw new BadRequestException(`Unknown taxStatus: ${body.taxStatus}`);
    }
    out.taxStatus = body.taxStatus;
  }

  if (out.amount === undefined && out.taxStatus === undefined) {
    throw new BadRequestException('No fields to update');
  }

  return out;
}

export async function applyInvoiceGeneralUpdate(
  prisma: PrismaClient,
  id: string,
  input: UpdateInvoiceGeneralInput,
): Promise<void> {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: {
      id: true,
      amount: true,
      taxStatus: true,
      payments: { select: { amount: true } },
    },
  });
  if (!invoice) {
    throw new NotFoundException(`Invoice ${id} not found`);
  }

  const paid = sumAmounts(invoice.payments);
  if (input.amount !== undefined && input.amount < paid) {
    throw new BadRequestException(`Invoice amount cannot be less than recorded payments (${paid})`);
  }

  const data: Prisma.InvoiceUpdateInput = {};

  if (input.amount !== undefined) {
    data.amount = input.amount;
  }

  if (input.taxStatus !== undefined && input.taxStatus !== invoice.taxStatus) {
    data.taxStatus = input.taxStatus as Prisma.EnumTaxStatusFieldUpdateOperationsInput['set'];
    if (input.taxStatus === 'TAX_FREE') {
      data.officialInvoiceRequestSent = false;
      data.officialInvoiceSentAt = null;
      data.officialInvoiceCancelledAt = null;
      data.govInvoiceId = null;
    }
  }

  if (Object.keys(data).length === 0) return;

  await prisma.invoice.update({ where: { id }, data });
}
