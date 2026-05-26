import { api } from '../api';
import type { CreateInvoiceInput } from './finance-create';
import type { FinanceDateRangeParams, ListData } from './finance-common';
export type { CreateInvoiceInput } from './finance-create';
export type {
  Subscription,
  SubscriptionCoverageSummary,
  SubscriptionGridCell,
  SubscriptionGridCellKind,
  SubscriptionGridPayload,
  SubscriptionGridQueryParams,
  SubscriptionGridRow,
  SubscriptionStats,
  SubscriptionStatsQueryParams,
  UpdateSubscriptionPayload,
} from './subscriptions';
export { subscriptionsApi } from './subscriptions';

export interface InvoiceListParams extends FinanceDateRangeParams {
  page?: number;
  pageSize?: number;
  /** Filter by canonical money layer (`Invoice.moneyStatus`). */
  moneyStatus?: string;
  type?: string;
  projectId?: string;
  subscriptionId?: string;
  search?: string;
}

/** Query params for `invoicesApi.getStats` (optional subscription drill-down parity). */
export interface InvoiceStatsQueryParams extends FinanceDateRangeParams {
  subscriptionId?: string;
}

export interface InvoiceDealSummary {
  id: string;
  name: string | null;
  code: string;
}

export interface InvoiceOrderSummary {
  id: string;
  code: string;
  deal?: InvoiceDealSummary | null;
}

export interface Invoice {
  id: string;
  code: string;
  orderId: string | null;
  subscriptionId: string | null;
  projectId: string | null;
  companyId: string | null;
  amount: string;
  currency: string;
  taxStatus: string;
  type: string;
  moneyStatus: string;
  dueDate: string | null;
  paidDate: string | null;
  govInvoiceId: string | null;
  officialInvoiceRequestSent: boolean;
  officialInvoiceSentAt: string | null;
  officialInvoiceCancelledAt: string | null;
  notificationsEnabled: boolean;
  description: string | null;
  createdAt: string;
  order: InvoiceOrderSummary | null;
  company: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
  payments: Payment[];
  paymentCoverage?: InvoicePaymentCoverage;
  _count: { payments: number };
}

export interface InvoicePaymentCoverage {
  paidAmount: number;
  outstandingAmount: number;
  paymentCount: number;
  isFullyPaid: boolean;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string | null;
  confirmedBy: string | null;
  notes: string | null;
  createdAt: string;
  invoice?: { id: string; code: string; projectId: string; type?: string };
  project?: { id: string; name: string } | null;
  company?: { id: string; name: string } | null;
  confirmer?: { id: string; firstName: string; lastName: string } | null;
}

export interface PaymentListParams extends FinanceDateRangeParams {
  page?: number;
  pageSize?: number;
  search?: string;
  invoiceId?: string;
}

export interface Order {
  id: string;
  code: string;
  projectId: string;
  type: string;
  paymentType: string;
  totalAmount: string;
  amount?: string;
  paidAmount?: number;
  currency: string;
  status: string;
  createdAt: string;
  project: { id: string; code: string; name: string };
  deal?: InvoiceDealSummary | null;
  company?: { id: string; name: string } | null;
  contact?: { id: string; firstName: string; lastName: string } | null;
  invoices: Array<{ id: string; code: string; moneyStatus: string; amount: string }>;
  reconciliation?: OrderReconciliation;
  _count?: { invoices: number };
}

export interface OrderReconciliation {
  orderAmount: number;
  invoicedAmount: number;
  paidAmount: number;
  uninvoicedAmount: number;
  outstandingAmount: number;
  invoiceCount: number;
  isFullyInvoiced: boolean;
  isFullyPaid: boolean;
  warnings: OrderReconciliationWarning[];
}

export interface OrderReconciliationWarning {
  code: 'NO_INVOICES' | 'UNINVOICED_AMOUNT' | 'OUTSTANDING_AMOUNT';
  message: string;
}

/** Query `gap` for `GET /finance/orders` reconciliation drill-down. */
export type OrderReconciliationListGap = 'uninvoiced' | 'outstanding';

export interface OrderListParams extends FinanceDateRangeParams {
  page?: number;
  pageSize?: number;
  status?: string;
  projectId?: string;
  partnerId?: string;
  search?: string;
  gap?: OrderReconciliationListGap;
}

/** Ledger roll-up from `GET /expenses/:id` (optional on list rows). */
export type ExpenseLedgerPaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface ExpensePaymentEntry {
  id: string;
  amount: string;
  paymentDate: string;
  notes: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  type: string;
  category: string;
  name: string;
  amount: string;
  frequency: string;
  dueDate: string | null;
  status: string;
  projectId: string | null;
  isPassThrough: boolean;
  taxStatus: string;
  backlogReason: string | null;
  notes: string | null;
  createdAt: string;
  /** Set when this expense is linked to a payroll salary line (materialization). */
  linkedPayrollRun?: {
    payrollRunId: string;
    payrollMonth: string;
    salaryLineId: string;
  } | null;
  /** Present when this expense was created from an Expense Plan (Plan→Card). */
  linkedExpensePlan?: { id: string; name: string } | null;
  project?: { id: string; code: string; name: string } | null;
  paidAmount?: string;
  remainingAmount?: string;
  paymentStatus?: ExpenseLedgerPaymentStatus;
  payments?: ExpensePaymentEntry[];
}

export interface ExpenseStats {
  byCategory: Array<{
    category: string;
    _count: number;
    _sum: { amount: number | null };
  }>;
  byStatus: Array<{
    status: string;
    _count: number;
    _sum: { amount: number | null };
  }>;
  totalAmount: number | null;
  paidAmount: number | null;
  unpaidAmount: number | null;
}

/** Query params for `expensesApi.getStats` (optional project drill-down parity). */
export interface ExpenseStatsQueryParams extends FinanceDateRangeParams {
  projectId?: string;
  /** When set, aggregates match expenses linked to this plan (list parity). */
  expensePlanId?: string;
  /** When set, aggregates match the same status scope as the expenses list. */
  status?: string;
  /** When true and `status` is omitted: same scope as `GET /expenses?activeBoard=true`. */
  activeBoard?: boolean;
  /** When true and `status` is omitted: same scope as `GET /expenses?closedBoard=true`. */
  closedBoard?: boolean;
  payrollLinked?: boolean;
  payrollMonth?: string;
  payrollEmployeeId?: string;
}

/** Allowed `sortBy` values for `GET /expenses` (aligned with ExpensesService allowlist). */
export type ExpenseListSortField = 'createdAt' | 'dueDate' | 'amount' | 'name' | 'status';

export interface ExpenseListParams extends FinanceDateRangeParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  status?: string;
  projectId?: string;
  /** Filter by linked expense plan (`GET /expenses?expensePlanId=`). */
  expensePlanId?: string;
  type?: string;
  frequency?: string;
  /** Filter by `ExpenseBacklogReasonEnum` when present (ignored if unknown). */
  backlogReason?: string;
  sortBy?: ExpenseListSortField;
  sortOrder?: 'asc' | 'desc';
  /**
   * When true and `status` is omitted: exclude `PAID` and `BACKLOG` (board vs closed/backlog), per NBOS.
   */
  activeBoard?: boolean;
  /** When true and `status` is omitted: only `PAID` and `CANCELLED` (closed expense route). */
  closedBoard?: boolean;
  /** When true: only payroll-materialized salary expenses. */
  payrollLinked?: boolean;
  payrollMonth?: string;
  payrollEmployeeId?: string;
}

/** Body for `PUT /expenses/:id` (aligned with ExpensesController). */
export interface CreateExpensePayload {
  name: string;
  type: string;
  category: string;
  amount: number;
  frequency?: string;
  dueDate?: string | null;
  status?: string;
  projectId?: string | null;
  expensePlanId?: string | null;
  isPassThrough?: boolean;
  taxStatus?: string;
  backlogReason?: string | null;
  notes?: string | null;
}

/** Body for `POST /expenses/:id/payments`. */
export interface AddExpensePaymentPayload {
  amount: number;
  paymentDate: string;
  notes?: string;
}

export interface UpdateExpensePayload {
  name?: string;
  type?: string;
  category?: string;
  amount?: number;
  frequency?: string;
  dueDate?: string | null;
  status?: string;
  projectId?: string | null;
  isPassThrough?: boolean;
  taxStatus?: string;
  backlogReason?: string | null;
  notes?: string | null;
}

export interface InvoiceStats {
  total: number;
  /** Breakdown by `Invoice.moneyStatus` (values: NEW, AWAITING_PAYMENT, …). Field name kept for API shape. */
  byStatus: Array<{
    status: string;
    _count: number;
    _sum: { amount: number | null };
  }>;
  totalRevenue: number | null;
  outstanding: { count: number; amount: number | null };
  overdue: { count: number; amount: number | null };
}

export interface OrderStats {
  totalOrders: number;
  totalAmount: number | null;
  collectedAmount: number | null;
  outstandingAmount: number;
  byStatus: Array<{
    status: string;
    _count: number;
    _sum: { totalAmount: number | null };
  }>;
}

/** Query params for `ordersApi.getStats` (optional reconciliation drill-down). */
export interface OrderStatsQueryParams extends FinanceDateRangeParams {
  gap?: OrderReconciliationListGap;
  /** With gap: align stats with the orders list. */
  status?: string;
  projectId?: string;
  /** Partner drill-down: stats scoped like `GET /finance/orders?partnerId=`. */
  partnerId?: string;
  search?: string;
}

export interface PaymentStats {
  totalPayments: number;
  totalCollected: number | null;
  thisMonthCollected: number | null;
}

/** Workspace-wide payroll aggregates from `GET /payroll-runs/stats` (same shape as list stats). */
export interface FinanceDashboardPayrollRuns {
  runCount: number;
  totals: {
    totalBaseSalary: string;
    totalBonuses: string;
    totalAdjustments: string;
    totalDeductions: string;
    totalPayable: string;
    totalPaid: string;
    totalRemaining: string;
  };
  byStatus: Array<{
    status: string;
    runCount: number;
    totalPayable: string;
    totalPaid: string;
    totalRemaining: string;
  }>;
}

export interface FinanceDashboardMoneyBucket {
  count: number;
  amount: number;
}

export interface FinanceDashboardExpenseCards {
  dueNow: FinanceDashboardMoneyBucket;
  dueSoon: FinanceDashboardMoneyBucket;
  overdue: FinanceDashboardMoneyBucket;
  onHold: FinanceDashboardMoneyBucket;
  backlog: FinanceDashboardMoneyBucket;
}

export interface FinanceDashboardSummary {
  kpis: {
    totalRevenue: number | null;
    outstandingAmount: number | null;
    outstandingCount: number;
    overdueAmount: number | null;
    overdueCount: number;
    monthlyRecurringRevenue: number | null;
    activeSubscriptions: number;
  };
  /** Breakdown by `Invoice.moneyStatus` (`status` field is the money enum value). */
  invoiceStatusItems: Array<{
    status: string;
    count: number;
    amount: number | null;
  }>;
  expenseCards: FinanceDashboardExpenseCards;
  reconciliation: {
    orderCount: number;
    orderAmount: number;
    invoicedAmount: number;
    paidAmount: number;
    uninvoicedAmount: number;
    outstandingAmount: number;
    fullyInvoicedCount: number;
    fullyPaidCount: number;
    warnings: Array<{
      code: 'UNINVOICED_ORDERS' | 'OUTSTANDING_ORDERS';
      message: string;
      count: number;
    }>;
  };
  recentPayments: Array<{
    id: string;
    amount: number | null;
    paymentDate: string;
    invoice: { id: string; code: string };
    company: { id: string; name: string } | null;
    project: { id: string; name: string } | null;
  }>;
  upcomingInvoices: Array<{
    id: string;
    code: string;
    amount: number | null;
    dueDate: string | null;
    company: { id: string; name: string } | null;
    projectId: string;
  }>;
  payrollRuns: FinanceDashboardPayrollRuns;
}

export const invoicesApi = {
  async getAll(params?: InvoiceListParams): Promise<ListData<Invoice>> {
    const resp = await api.get<ListData<Invoice>>('/api/finance/invoices', { params });
    return resp.data;
  },
  async getById(id: string): Promise<Invoice> {
    const resp = await api.get<Invoice>(`/api/finance/invoices/${id}`);
    return resp.data;
  },
  async create(data: CreateInvoiceInput): Promise<Invoice> {
    const resp = await api.post<Invoice>('/api/finance/invoices', data);
    return resp.data;
  },
  async updateGeneral(
    id: string,
    data: {
      amount?: number;
      taxStatus?: string;
      companyId?: string | null;
      projectId?: string | null;
    },
  ): Promise<Invoice> {
    const resp = await api.patch<Invoice>(`/api/finance/invoices/${id}`, data);
    return resp.data;
  },
  async updateMoneyStatus(id: string, moneyStatus: string): Promise<Invoice> {
    const resp = await api.patch<Invoice>(`/api/finance/invoices/${id}/money-status`, {
      moneyStatus,
    });
    return resp.data;
  },
  async sendOfficialInvoiceRequest(id: string): Promise<Invoice> {
    const resp = await api.post<Invoice>(`/api/finance/invoices/${id}/official-request/send`);
    return resp.data;
  },
  async cancelOfficialInvoiceRequest(id: string): Promise<Invoice> {
    const resp = await api.post<Invoice>(`/api/finance/invoices/${id}/official-request/cancel`);
    return resp.data;
  },
  async updateOfficialInvoiceGovId(id: string, govInvoiceId: string | null): Promise<Invoice> {
    const resp = await api.patch<Invoice>(`/api/finance/invoices/${id}/official-request`, {
      govInvoiceId,
    });
    return resp.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/api/finance/invoices/${id}`);
  },
  async getStats(params?: InvoiceStatsQueryParams): Promise<InvoiceStats> {
    const resp = await api.get<InvoiceStats>('/api/finance/invoices/stats', { params });
    return resp.data;
  },
};

export const paymentsApi = {
  async getAll(params?: PaymentListParams): Promise<ListData<Payment>> {
    const resp = await api.get<ListData<Payment>>('/api/finance/payments', { params });
    return resp.data;
  },
  async create(data: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    confirmedBy?: string;
    notes?: string;
  }): Promise<Payment> {
    const resp = await api.post<Payment>('/api/finance/payments', data);
    return resp.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/api/finance/payments/${id}`);
  },
  async getStats(params?: FinanceDateRangeParams): Promise<PaymentStats> {
    const resp = await api.get<PaymentStats>('/api/finance/payments/stats', { params });
    return resp.data;
  },
};

export const ordersApi = {
  async getAll(params?: OrderListParams): Promise<ListData<Order>> {
    const resp = await api.get<ListData<Order>>('/api/finance/orders', { params });
    return resp.data;
  },
  async getById(id: string): Promise<Order> {
    const resp = await api.get<Order>(`/api/finance/orders/${id}`);
    return resp.data;
  },
  async create(data: Record<string, unknown>): Promise<Order> {
    const resp = await api.post<Order>('/api/finance/orders', data);
    return resp.data;
  },
  async updateStatus(id: string, status: string): Promise<Order> {
    const resp = await api.patch<Order>(`/api/finance/orders/${id}/status`, { status });
    return resp.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/api/finance/orders/${id}`);
  },
  async getStats(params?: OrderStatsQueryParams): Promise<OrderStats> {
    const resp = await api.get<OrderStats>('/api/finance/orders/stats', { params });
    return resp.data;
  },
};

export const expensesApi = {
  async getAll(params?: ExpenseListParams): Promise<ListData<Expense>> {
    const resp = await api.get<ListData<Expense>>('/api/expenses', { params });
    return resp.data;
  },
  async getById(id: string): Promise<Expense> {
    const resp = await api.get<Expense>(`/api/expenses/${id}`);
    return resp.data;
  },
  async create(data: CreateExpensePayload): Promise<Expense> {
    const resp = await api.post<Expense>('/api/expenses', data);
    return resp.data;
  },
  async update(id: string, data: UpdateExpensePayload): Promise<Expense> {
    const resp = await api.put<Expense>(`/api/expenses/${id}`, data);
    return resp.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/api/expenses/${id}`);
  },
  async addPayment(id: string, data: AddExpensePaymentPayload): Promise<Expense> {
    const resp = await api.post<Expense>(`/api/expenses/${id}/payments`, data);
    return resp.data;
  },
  async deletePayment(expenseId: string, paymentId: string): Promise<Expense> {
    const resp = await api.delete<Expense>(`/api/expenses/${expenseId}/payments/${paymentId}`);
    return resp.data;
  },
  async getStats(params?: ExpenseStatsQueryParams): Promise<ExpenseStats> {
    const resp = await api.get<ExpenseStats>('/api/expenses/stats', { params });
    return resp.data;
  },
};

export const financeSummaryApi = {
  async getDashboard(params?: FinanceDateRangeParams): Promise<FinanceDashboardSummary> {
    const resp = await api.get<FinanceDashboardSummary>('/api/finance/summary/dashboard', {
      params,
    });
    return resp.data;
  },
};
