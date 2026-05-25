import { Logger } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import {
  CLIENT_SERVICE_OPEN_TASK_STATUSES,
  CLIENT_SERVICE_TASK_ENTITY_TYPE,
  formatClientServiceExpenseNotes,
  formatClientServiceTaskDescription,
  clientServiceTaskTitle,
} from './client-service-flow-helpers';
import type { ClientServiceFlowsService } from './client-service-flows.service';

const logger = new Logger('ClientPaidInvoiceAutomation');

export interface ClientPaidInvoiceAutomationParams {
  invoiceId: string;
  /** Employee who recorded the payment; used as task creator when present. */
  actorEmployeeId?: string | null;
}

export interface ClientPaidInvoiceAutomationResult {
  taskId: string | null;
  expenseId: string | null;
}

type PrismaLike = Pick<PrismaClient, 'invoice' | 'clientServiceRecord' | 'task' | 'expense'>;

/**
 * After a client-paid service invoice is fully covered, materialize purchase task and
 * provider expense card (idempotent per invoice / open task).
 */
export async function runClientPaidInvoicePaidAutomation(
  prisma: PrismaLike,
  flows: ClientServiceFlowsService,
  params: ClientPaidInvoiceAutomationParams,
): Promise<ClientPaidInvoiceAutomationResult> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    select: {
      id: true,
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
      projectId: true,
      type: true,
      name: true,
      provider: true,
      billingModel: true,
      ourCost: true,
      renewalDate: true,
    },
  });

  if (!service || service.billingModel !== 'CLIENT_PAID') {
    return { taskId: null, expenseId: null };
  }

  const expenseNotes = formatClientServiceExpenseNotes(service.name, invoice.id);
  const result: ClientPaidInvoiceAutomationResult = { taskId: null, expenseId: null };

  const existingExpense = await prisma.expense.findFirst({
    where: {
      clientServiceRecordId: service.id,
      notes: { contains: `NBOS invoiceId=${invoice.id}` },
    },
    select: { id: true },
  });

  if (!existingExpense) {
    const expense = await flows.createExpense(service.id, {
      dueDate: service.renewalDate?.toISOString() ?? invoice.paidDate?.toISOString(),
      status: 'DUE_NOW',
      notes: expenseNotes,
    });
    result.expenseId = expense.id;
    logger.log(`Created expense ${expense.id} for paid client-service invoice ${invoice.id}`);
  }

  const actorId = params.actorEmployeeId?.trim();
  if (!actorId) {
    logger.warn(
      `Skipped purchase task for invoice ${invoice.id}: payment has no confirmedBy employee`,
    );
    return result;
  }

  const openTask = await prisma.task.findFirst({
    where: {
      status: { in: [...CLIENT_SERVICE_OPEN_TASK_STATUSES] },
      links: {
        some: {
          entityType: CLIENT_SERVICE_TASK_ENTITY_TYPE,
          entityId: service.id,
        },
      },
    },
    select: { id: true },
  });

  if (openTask) {
    return result;
  }

  const task = await flows.createTask(service.id, {
    creatorId: actorId,
    title: clientServiceTaskTitle(service.name, service.type),
    description: formatClientServiceTaskDescription(service, invoice.id),
    dueDate: service.renewalDate?.toISOString() ?? undefined,
    priority: 'HIGH',
  });
  result.taskId = task.id;
  logger.log(`Created task ${task.id} for paid client-service invoice ${invoice.id}`);

  return result;
}
