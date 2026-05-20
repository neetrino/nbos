const DUE_SOON_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Open receivables on the Invoice Card money layer (excludes PAID, CANCELLED, ON_HOLD). */
export const OPEN_INVOICE_MONEY_STATUSES = ['NEW', 'AWAITING_PAYMENT', 'OVERDUE'] as const;
export const ACTIVE_EXPENSE_STATUSES = [
  'PLANNED',
  'DUE_SOON',
  'DUE_NOW',
  'OVERDUE',
  'ON_HOLD',
  'BACKLOG',
] as const;

type OpenInvoiceMoneyStatus = (typeof OPEN_INVOICE_MONEY_STATUSES)[number];

interface MoneyBucket {
  count: number;
  amount: number;
}

export interface InvoiceCardMetricRow {
  amount: unknown;
  dueDate: Date | null;
  moneyStatus: string;
  payments: Array<{ amount: unknown }>;
}

export interface ExpenseCardMetricRow {
  amount: unknown;
  dueDate: Date | null;
  status: string;
  backlogReason: string | null;
  expensePayments: Array<{ amount: unknown }>;
}

export function foldInvoiceCards(invoices: InvoiceCardMetricRow[]) {
  const today = startOfToday();
  const seed = emptyMoneyBucket();

  return invoices.reduce(
    (summary, invoice) => {
      const outstanding = getRemainingAmount(invoice.amount, invoice.payments);
      const isOpen = OPEN_INVOICE_MONEY_STATUSES.includes(
        invoice.moneyStatus as OpenInvoiceMoneyStatus,
      );
      const isOverdue = isOpen && Boolean(invoice.dueDate && invoice.dueDate < today);

      if (isOpen && outstanding > 0) addToBucket(summary.outstanding, outstanding);
      if (isOverdue && outstanding > 0) addToBucket(summary.overdue, outstanding);

      return summary;
    },
    { outstanding: { ...seed }, overdue: { ...seed } },
  );
}

export function foldExpenseCards(expenses: ExpenseCardMetricRow[]) {
  const today = startOfToday();
  const dueSoonEnd = new Date(today.getTime() + DUE_SOON_DAYS * MS_PER_DAY);
  const seed = emptyMoneyBucket();

  return expenses.reduce(
    (summary, expense) => {
      const remaining = getRemainingAmount(expense.amount, expense.expensePayments);
      if (expense.status === 'PAID' || remaining <= 0) {
        return summary;
      }

      const dueBucket = getExpenseDueBucket(expense, today, dueSoonEnd);
      if (dueBucket) addToBucket(summary[dueBucket], remaining);

      return summary;
    },
    {
      dueNow: { ...seed },
      dueSoon: { ...seed },
      overdue: { ...seed },
      onHold: { ...seed },
      backlog: { ...seed },
    },
  );
}

function getExpenseDueBucket(
  expense: ExpenseCardMetricRow,
  today: Date,
  dueSoonEnd: Date,
): 'dueNow' | 'dueSoon' | 'overdue' | 'onHold' | 'backlog' | null {
  if (expense.status === 'BACKLOG' || Boolean(expense.backlogReason)) return 'backlog';
  if (expense.status === 'ON_HOLD') return 'onHold';
  if (expense.status === 'DUE_NOW') return 'dueNow';
  if (expense.status === 'OVERDUE') return 'overdue';
  if (expense.status === 'DUE_SOON') return 'dueSoon';
  if (expense.dueDate && expense.dueDate < today) return 'overdue';
  if (expense.dueDate && expense.dueDate <= dueSoonEnd) return 'dueSoon';
  return null;
}

function getRemainingAmount(amount: unknown, payments: Array<{ amount: unknown }>) {
  return Math.max(0, Number(amount) - sumUnknownAmounts(payments));
}

function addToBucket(bucket: MoneyBucket, amount: number) {
  bucket.count += 1;
  bucket.amount += amount;
}

function emptyMoneyBucket(): MoneyBucket {
  return { count: 0, amount: 0 };
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function sumUnknownAmounts(items: Array<{ amount: unknown }>) {
  return items.reduce((sum, item) => sum + Number(item.amount), 0);
}
