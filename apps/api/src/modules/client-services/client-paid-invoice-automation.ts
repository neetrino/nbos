import { Logger } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { ClientServiceFlowsService } from './client-service-flows.service';
import { ensureExpenseForPaidInvoice } from './client-paid-invoice-expense';
import { ensurePrepTaskForPaidInvoice } from './client-paid-invoice-task';

const logger = new Logger('ClientPaidInvoiceAutomation');

export interface ClientPaidInvoiceAutomationParams {
  invoiceId: string;
  actorEmployeeId?: string | null;
}

export interface ClientPaidInvoiceAutomationResult {
  taskId: string | null;
  expenseId: string | null;
}

type PrismaLike = Pick<PrismaClient, 'invoice' | 'clientServiceRecord' | 'task' | 'expense'>;

/** After a client-service invoice is fully paid: find/create Expense, maybe a prep Task. */
export async function runClientPaidInvoicePaidAutomation(
  prisma: PrismaLike,
  flows: ClientServiceFlowsService,
  params: ClientPaidInvoiceAutomationParams,
): Promise<ClientPaidInvoiceAutomationResult> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    select: {
      id: true,
      amount: true,
      moneyStatus: true,
      clientServiceRecordId: true,
      paidDate: true,
    },
  });

  if (!invoice?.clientServiceRecordId || invoice.moneyStatus !== 'PAID') {
    return { taskId: null, expenseId: null };
  }

  const service = await prisma.clientServiceRecord.findUnique({
    where: { id: invoice.clientServiceRecordId },
    select: {
      id: true,
      type: true,
      name: true,
      provider: true,
      billingModel: true,
      ourCost: true,
      renewalDate: true,
      connectionMode: true,
      providerAccountId: true,
    },
  });

  if (!service || service.billingModel !== 'WE_PAY') {
    return { taskId: null, expenseId: null };
  }

  const expenseId = await ensureExpenseForPaidInvoice(prisma, flows, {
    invoiceId: invoice.id,
    invoiceAmount: invoice.amount,
    paidDate: invoice.paidDate,
    service,
  });

  if (service.type === 'DOMAIN') {
    return { taskId: null, expenseId };
  }

  const actorId = params.actorEmployeeId?.trim();
  if (!actorId) {
    logger.warn(`Skipped prep task for invoice ${invoice.id}: payment has no confirmedBy employee`);
    return { taskId: null, expenseId };
  }

  const taskId = await ensurePrepTaskForPaidInvoice(prisma, flows, {
    service,
    invoiceId: invoice.id,
    actorEmployeeId: actorId,
  });
  return { taskId, expenseId };
}
