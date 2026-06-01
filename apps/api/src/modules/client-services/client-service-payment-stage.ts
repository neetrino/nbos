import type {
  ClientServiceBillingModel,
  ExpenseStatusEnum,
  InvoiceMoneyStatusEnum,
  Prisma,
} from '@nbos/database';

/** Computed payment lifecycle stage for a client service record (not a DB column). */
export type ClientServicePaymentStage = 'active' | 'upcoming' | 'invoice' | 'pay_now';

export const CLIENT_SERVICE_PAYMENT_STAGES: readonly ClientServicePaymentStage[] = [
  'active',
  'upcoming',
  'invoice',
  'pay_now',
];

/** `renewal_date` within this window triggers the Invoice stage (matches EXP-04 auto-invoice). */
const INVOICE_WINDOW_DAYS = 60;
/** `renewal_date` within this wider window (but past the invoice window) is Upcoming. */
const UPCOMING_WINDOW_DAYS = 90;

const INACTIVE_INVOICE_STATUSES: InvoiceMoneyStatusEnum[] = ['PAID', 'CANCELLED'];
const INACTIVE_EXPENSE_STATUSES: ExpenseStatusEnum[] = ['PAID', 'CANCELLED'];

function isInactiveInvoiceStatus(status: string): boolean {
  return (INACTIVE_INVOICE_STATUSES as readonly string[]).includes(status);
}

function isInactiveExpenseStatus(status: string): boolean {
  return (INACTIVE_EXPENSE_STATUSES as readonly string[]).includes(status);
}

export function isClientServicePaymentStage(value: string): value is ClientServicePaymentStage {
  return (CLIENT_SERVICE_PAYMENT_STAGES as readonly string[]).includes(value);
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export interface ClientServiceStageInput {
  renewalDate: Date | null;
  billingModel: ClientServiceBillingModel;
  invoiceMoneyStatuses: readonly string[];
  expenseStatuses: readonly string[];
}

export interface ClientServiceStageResult {
  stage: ClientServicePaymentStage;
  overdue: boolean;
}

/**
 * Derives the payment stage + overdue overlay for a client service record.
 * Linked invoice/expense state takes priority over the time-based fallback so the
 * stage stays consistent with {@link buildClientServiceStageWhere}.
 */
export function computeClientServicePaymentStage(
  input: ClientServiceStageInput,
  now: Date = new Date(),
): ClientServiceStageResult {
  const { renewalDate, billingModel } = input;
  const isClientPaid = billingModel === 'CLIENT_PAID';
  const hasActiveExpense = input.expenseStatuses.some((status) => !isInactiveExpenseStatus(status));
  const hasActiveInvoice = input.invoiceMoneyStatuses.some(
    (status) => !isInactiveInvoiceStatus(status),
  );

  const invoiceWindowEnd = addDays(now, INVOICE_WINDOW_DAYS);
  const upcomingWindowEnd = addDays(now, UPCOMING_WINDOW_DAYS);

  const stage = resolveStage({
    hasActiveExpense,
    hasActiveInvoice,
    isClientPaid,
    renewalDate,
    invoiceWindowEnd,
    upcomingWindowEnd,
  });

  const overdue =
    input.invoiceMoneyStatuses.includes('OVERDUE') ||
    input.expenseStatuses.includes('OVERDUE') ||
    (!hasActiveExpense &&
      !hasActiveInvoice &&
      renewalDate !== null &&
      renewalDate.getTime() < now.getTime());

  return { stage, overdue };
}

interface ResolveStageInput {
  hasActiveExpense: boolean;
  hasActiveInvoice: boolean;
  isClientPaid: boolean;
  renewalDate: Date | null;
  invoiceWindowEnd: Date;
  upcomingWindowEnd: Date;
}

function resolveStage(input: ResolveStageInput): ClientServicePaymentStage {
  if (input.hasActiveExpense) return 'pay_now';
  if (input.isClientPaid && input.hasActiveInvoice) return 'invoice';

  const due = input.renewalDate?.getTime();
  if (due === undefined) return 'active';
  if (due <= input.invoiceWindowEnd.getTime()) return input.isClientPaid ? 'invoice' : 'pay_now';
  if (due <= input.upcomingWindowEnd.getTime()) return 'upcoming';
  return 'active';
}

/**
 * Prisma `where` predicate for a payment stage so each board column paginates at the
 * database level. The four stage predicates partition the record set and mirror
 * {@link computeClientServicePaymentStage}.
 */
export function buildClientServiceStageWhere(
  stage: ClientServicePaymentStage,
  now: Date = new Date(),
): Prisma.ClientServiceRecordWhereInput {
  const invoiceWindowEnd = addDays(now, INVOICE_WINDOW_DAYS);
  const upcomingWindowEnd = addDays(now, UPCOMING_WINDOW_DAYS);

  const activeExpense: Prisma.ClientServiceRecordWhereInput = {
    expenses: { some: { status: { notIn: INACTIVE_EXPENSE_STATUSES } } },
  };
  const noActiveExpense: Prisma.ClientServiceRecordWhereInput = {
    expenses: { none: { status: { notIn: INACTIVE_EXPENSE_STATUSES } } },
  };
  const activeInvoice: Prisma.ClientServiceRecordWhereInput = {
    invoices: { some: { moneyStatus: { notIn: INACTIVE_INVOICE_STATUSES } } },
  };
  const noActiveInvoice: Prisma.ClientServiceRecordWhereInput = {
    invoices: { none: { moneyStatus: { notIn: INACTIVE_INVOICE_STATUSES } } },
  };

  switch (stage) {
    case 'pay_now':
      return {
        OR: [
          activeExpense,
          {
            AND: [
              noActiveExpense,
              noActiveInvoice,
              { billingModel: 'COMPANY_PAID' },
              { renewalDate: { lte: invoiceWindowEnd } },
            ],
          },
        ],
      };
    case 'invoice':
      return {
        AND: [
          noActiveExpense,
          {
            OR: [
              { AND: [{ billingModel: 'CLIENT_PAID' }, activeInvoice] },
              {
                AND: [
                  noActiveInvoice,
                  { billingModel: 'CLIENT_PAID' },
                  { renewalDate: { lte: invoiceWindowEnd } },
                ],
              },
            ],
          },
        ],
      };
    case 'upcoming':
      return {
        AND: [
          noActiveExpense,
          noActiveInvoice,
          { renewalDate: { gt: invoiceWindowEnd, lte: upcomingWindowEnd } },
        ],
      };
    case 'active':
    default:
      return {
        AND: [
          noActiveExpense,
          noActiveInvoice,
          { OR: [{ renewalDate: null }, { renewalDate: { gt: upcomingWindowEnd } }] },
        ],
      };
  }
}

/** Prisma `where` predicate for the overdue overlay flag. */
export function buildClientServiceOverdueWhere(
  now: Date = new Date(),
): Prisma.ClientServiceRecordWhereInput {
  return {
    OR: [
      { invoices: { some: { moneyStatus: 'OVERDUE' } } },
      { expenses: { some: { status: 'OVERDUE' } } },
      {
        AND: [
          { invoices: { none: { moneyStatus: { notIn: INACTIVE_INVOICE_STATUSES } } } },
          { expenses: { none: { status: { notIn: INACTIVE_EXPENSE_STATUSES } } } },
          { renewalDate: { lt: now } },
        ],
      },
    ],
  };
}
