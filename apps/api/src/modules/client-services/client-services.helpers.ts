import { BadRequestException } from '@nestjs/common';
import { Decimal, PrismaClient, type Prisma } from '@nbos/database';
import { CLIENT_SERVICE_TASK_ENTITY_TYPE } from './client-service-flow-helpers';
import { computeClientServicePaymentStage } from './client-service-payment-stage';

const CLIENT_SERVICE_PAGE_SIZE_DEFAULT = 50;
const CLIENT_SERVICE_PAGE_SIZE_MAX = 200;

export const CLIENT_SERVICE_RENEWAL_WINDOW_DAYS = 30;
export const CLIENT_SERVICE_SORT_FIELDS = new Set(['createdAt', 'renewalDate', 'name', 'ourCost']);

export function normalizeClientServicePage(value: number | undefined): number {
  return Number.isInteger(value) && value && value > 0 ? value : 1;
}

export function normalizeClientServicePageSize(value: number | undefined): number {
  if (!Number.isInteger(value) || !value || value <= 0) return CLIENT_SERVICE_PAGE_SIZE_DEFAULT;
  return Math.min(value, CLIENT_SERVICE_PAGE_SIZE_MAX);
}

export function toOptionalMoneyDecimal(
  value: number | null | undefined,
  field: string,
): Decimal | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Number.isFinite(value) || value < 0) {
    throw new BadRequestException(`${field} must be a non-negative number`);
  }
  return new Decimal(value);
}

export function parseOptionalDate(value: string | null | undefined, field: string): Date | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new BadRequestException(`${field} is invalid`);
  return date;
}

export function serializeClientServiceRow<T extends { ourCost?: unknown; clientCharge?: unknown }>(
  row: T,
) {
  return {
    ...row,
    ourCost: row.ourCost === null || row.ourCost === undefined ? null : String(row.ourCost),
    clientCharge:
      row.clientCharge === null || row.clientCharge === undefined ? null : String(row.clientCharge),
  };
}

export const clientServiceListInclude = {
  project: { select: { id: true, code: true, name: true } },
  product: { select: { id: true, name: true } },
  providerAccount: { select: { id: true, name: true, provider: true } },
  _count: { select: { invoices: true, expensePlans: true, expenses: true } },
  invoices: { select: { moneyStatus: true }, orderBy: { createdAt: 'desc' }, take: 100 },
  expenses: { select: { status: true }, orderBy: { createdAt: 'desc' }, take: 100 },
} satisfies Prisma.ClientServiceRecordInclude;

export type ClientServiceListRow = Prisma.ClientServiceRecordGetPayload<{
  include: typeof clientServiceListInclude;
}>;

/**
 * Serializes a list row and attaches the computed payment stage + overdue overlay,
 * stripping the raw invoice/expense status arrays used only for the computation.
 */
export function serializeClientServiceListRow(row: ClientServiceListRow, now: Date = new Date()) {
  const { invoices, expenses, ...rest } = row;
  const { stage, overdue } = computeClientServicePaymentStage(
    {
      renewalDate: rest.renewalDate,
      billingModel: rest.billingModel,
      invoiceMoneyStatuses: invoices.map((invoice) => invoice.moneyStatus),
      expenseStatuses: expenses.map((expense) => expense.status),
    },
    now,
  );
  return { ...serializeClientServiceRow(rest), paymentStage: stage, overdue };
}

export const clientServiceDetailInclude = {
  ...clientServiceListInclude,
  invoices: {
    select: {
      id: true,
      code: true,
      moneyStatus: true,
      amount: true,
      type: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  },
  expensePlans: {
    select: { id: true, name: true, category: true, amount: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  },
  expenses: {
    select: { id: true, name: true, status: true, amount: true, type: true, category: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  },
} satisfies Prisma.ClientServiceRecordInclude;

export type ClientServiceDetailRow = Prisma.ClientServiceRecordGetPayload<{
  include: typeof clientServiceDetailInclude;
}>;

export interface ClientServiceLinkedTask {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  workspaceId: string | null;
}

export function buildClientServiceListInclude(): Prisma.ClientServiceRecordInclude {
  return clientServiceListInclude;
}

export function buildClientServiceDetailInclude(): Prisma.ClientServiceRecordInclude {
  return clientServiceDetailInclude;
}

export async function fetchLinkedTasksForClientService(
  prisma: InstanceType<typeof PrismaClient>,
  recordId: string,
): Promise<ClientServiceLinkedTask[]> {
  const links = await prisma.taskLink.findMany({
    where: { entityType: CLIENT_SERVICE_TASK_ENTITY_TYPE, entityId: recordId },
    select: {
      task: {
        select: { id: true, title: true, status: true, dueDate: true, workspaceId: true },
      },
    },
  });
  return links.map((link) => ({
    id: link.task.id,
    title: link.task.title,
    status: link.task.status,
    dueDate: link.task.dueDate?.toISOString() ?? null,
    workspaceId: link.task.workspaceId,
  }));
}

export function serializeClientServiceDetail(
  row: ClientServiceDetailRow,
  linkedTasks: ClientServiceLinkedTask[],
) {
  const { invoices, expensePlans, expenses, ...rest } = row;
  return {
    ...serializeClientServiceRow(rest),
    financeLinks: {
      invoices: invoices.map((inv) => ({
        id: inv.id,
        code: inv.code,
        moneyStatus: inv.moneyStatus,
        amount: String(inv.amount),
        type: inv.type,
      })),
      expensePlans: expensePlans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        category: plan.category,
        amount: String(plan.amount),
      })),
      expenses: expenses.map((exp) => ({
        id: exp.id,
        name: exp.name,
        status: exp.status,
        amount: String(exp.amount),
        type: exp.type,
        category: exp.category,
      })),
      tasks: linkedTasks,
    },
  };
}
