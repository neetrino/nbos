import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { InvoiceOrderCommentEnum, Prisma, PrismaClient } from '@nbos/database';
import { isInvoiceOrderComment, isInvoicePayerContextLocked } from '@nbos/shared';
import { parseOptionalEntityNotes } from '../parse-entity-notes';
import { sumAmounts } from '../finance-status.utils';
import { resolveInvoiceProductOwnership } from './invoice-product-ownership';

const INVOICE_PAYER_ISSUED_ERROR =
  'Company and product cannot be changed after the invoice is issued';

const TAX_STATUSES = new Set(['TAX', 'TAX_FREE']);

export type UpdateInvoiceGeneralInput = {
  amount?: number;
  taxStatus?: string;
  companyId?: string | null;
  productId?: string | null;
  orderComment?: string | null;
  notes?: string | null;
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

  if (body.companyId !== undefined) {
    out.companyId = body.companyId?.trim() ? body.companyId.trim() : null;
  }

  if (body.productId !== undefined) {
    out.productId = body.productId?.trim() ? body.productId.trim() : null;
  }

  if (body.orderComment !== undefined) {
    if (body.orderComment == null || body.orderComment.trim() === '') {
      out.orderComment = null;
    } else if (isInvoiceOrderComment(body.orderComment)) {
      out.orderComment = body.orderComment;
    } else {
      throw new BadRequestException(`Unknown orderComment: ${body.orderComment}`);
    }
  }

  if (body.notes !== undefined) {
    out.notes = parseOptionalEntityNotes(body.notes) ?? null;
  }

  assertHasInvoiceGeneralFields(out);
  return out;
}

function assertHasInvoiceGeneralFields(out: UpdateInvoiceGeneralInput): void {
  if (
    out.amount === undefined &&
    out.taxStatus === undefined &&
    out.companyId === undefined &&
    out.productId === undefined &&
    out.orderComment === undefined &&
    out.notes === undefined
  ) {
    throw new BadRequestException('No fields to update');
  }
}

function assertInvoicePayerContextEditable(
  invoice: { moneyStatus: string; officialInvoiceRequestSent: boolean },
  input: UpdateInvoiceGeneralInput,
): void {
  if (input.companyId === undefined && input.productId === undefined) return;
  const officialInvoiceRequestSent =
    input.taxStatus === 'TAX_FREE' ? false : invoice.officialInvoiceRequestSent;
  if (
    isInvoicePayerContextLocked({
      moneyStatus: invoice.moneyStatus,
      officialInvoiceRequestSent,
    })
  ) {
    throw new BadRequestException(INVOICE_PAYER_ISSUED_ERROR);
  }
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
      type: true,
      orderId: true,
      amount: true,
      taxStatus: true,
      moneyStatus: true,
      officialInvoiceRequestSent: true,
      payments: { select: { amount: true } },
    },
  });
  if (!invoice) {
    throw new NotFoundException(`Invoice ${id} not found`);
  }

  if (input.productId !== undefined && invoice.type !== 'MANUAL') {
    throw new BadRequestException('Product can only be linked on manual invoices');
  }

  assertInvoicePayerContextEditable(invoice, input);

  const paid = sumAmounts(invoice.payments);
  if (input.amount !== undefined && input.amount < paid) {
    throw new BadRequestException(`Invoice amount cannot be less than recorded payments (${paid})`);
  }

  const data: Prisma.InvoiceUpdateInput = {};
  if (input.amount !== undefined) data.amount = input.amount;
  if (input.notes !== undefined) data.notes = input.notes;
  applyTaxStatusPatch(invoice, input, data);
  await applyOwnershipPatch(prisma, input, data);
  applyOrderCommentPatch(invoice, input, data);
  if (Object.keys(data).length === 0) return;
  await prisma.invoice.update({ where: { id }, data });
}

function applyTaxStatusPatch(
  invoice: { taxStatus: string },
  input: UpdateInvoiceGeneralInput,
  data: Prisma.InvoiceUpdateInput,
): void {
  if (input.taxStatus === undefined || input.taxStatus === invoice.taxStatus) return;
  data.taxStatus = input.taxStatus as Prisma.EnumTaxStatusFieldUpdateOperationsInput['set'];
  if (input.taxStatus !== 'TAX_FREE') return;
  data.officialInvoiceRequestSent = false;
  data.officialInvoiceSentAt = null;
  data.officialInvoiceCancelledAt = null;
  data.govInvoiceId = null;
}

async function applyOwnershipPatch(
  prisma: PrismaClient,
  input: UpdateInvoiceGeneralInput,
  data: Prisma.InvoiceUpdateInput,
): Promise<void> {
  if (input.companyId !== undefined) {
    data.company = input.companyId ? { connect: { id: input.companyId } } : { disconnect: true };
  }
  if (input.productId === undefined) return;
  const ownership = await resolveInvoiceProductOwnership(prisma, {
    productId: input.productId,
  });
  data.product = ownership.productId
    ? { connect: { id: ownership.productId } }
    : { disconnect: true };
  data.project = ownership.projectId
    ? { connect: { id: ownership.projectId } }
    : { disconnect: true };
  if (input.companyId !== undefined) return;
  data.company = ownership.companyId
    ? { connect: { id: ownership.companyId } }
    : { disconnect: true };
}

function applyOrderCommentPatch(
  invoice: { orderId: string | null },
  input: UpdateInvoiceGeneralInput,
  data: Prisma.InvoiceUpdateInput,
): void {
  if (input.orderComment === undefined) return;
  if (!invoice.orderId) {
    throw new BadRequestException('Accountant note applies only to deal/order invoices');
  }
  data.orderComment = input.orderComment as InvoiceOrderCommentEnum | null;
}
