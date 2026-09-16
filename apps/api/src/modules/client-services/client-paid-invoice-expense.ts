import { Logger } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { ClientServiceFlowsService } from './client-service-flows.service';
import {
  matchExpenseForPaidInvoice,
  resolveDomainExpenseAmount,
  type CycleExpenseRow,
} from './domain-purchase/domain-expense-cycle';
import { formatClientServiceExpenseNotes } from './client-service-flow-helpers';

const logger = new Logger('ClientPaidInvoiceExpense');

type PrismaDb = Pick<PrismaClient, 'expense'>;

export interface PaidInvoiceExpenseContext {
  invoiceId: string;
  invoiceAmount: unknown;
  paidDate: Date | null;
  service: {
    id: string;
    name: string;
    ourCost: unknown;
    renewalDate: Date | null;
  };
}

export async function ensureExpenseForPaidInvoice(
  prisma: PrismaDb,
  flows: ClientServiceFlowsService,
  ctx: PaidInvoiceExpenseContext,
): Promise<string | null> {
  const paidAt = ctx.paidDate ?? new Date();
  const expenses = await prisma.expense.findMany({
    where: { clientServiceRecordId: ctx.service.id },
    select: { id: true, sourceInvoiceId: true, dueDate: true, status: true, notes: true },
  });
  const match = matchExpenseForPaidInvoice({
    invoiceId: ctx.invoiceId,
    paidAt,
    expenses: expenses as CycleExpenseRow[],
  });

  if (match.kind === 'linked' && match.expenseId) return match.expenseId;
  if (match.kind === 'ambiguous') {
    logger.warn(`Manual expense link required for invoice ${ctx.invoiceId}`);
    return null;
  }
  if (match.kind === 'reuse' && match.expenseId) {
    await prisma.expense.update({
      where: { id: match.expenseId },
      data: { sourceInvoiceId: ctx.invoiceId },
    });
    return match.expenseId;
  }

  const fromLegacyNotes = expenses.find((row) =>
    Boolean(
      (row as CycleExpenseRow & { notes?: string | null }).notes?.includes(
        `NBOS invoiceId=${ctx.invoiceId}`,
      ),
    ),
  );
  if (fromLegacyNotes) {
    if (!fromLegacyNotes.sourceInvoiceId) {
      await prisma.expense.update({
        where: { id: fromLegacyNotes.id },
        data: { sourceInvoiceId: ctx.invoiceId },
      });
    }
    return fromLegacyNotes.id;
  }

  const amount = resolveDomainExpenseAmount(ctx.service.ourCost, ctx.invoiceAmount);
  if (amount == null) {
    logger.warn(`Skipped expense for invoice ${ctx.invoiceId}: no provider or invoice amount`);
    return null;
  }

  const expense = await flows.createExpense(ctx.service.id, {
    amount,
    dueDate: ctx.service.renewalDate?.toISOString() ?? paidAt.toISOString(),
    status: 'DUE_NOW',
    notes: formatClientServiceExpenseNotes(ctx.service.name, ctx.invoiceId),
    sourceInvoiceId: ctx.invoiceId,
  });
  return expense.id;
}
