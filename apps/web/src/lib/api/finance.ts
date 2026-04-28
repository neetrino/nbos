import { api } from '../api';
import type { CreateInvoiceInput } from './finance-create';
import type { FinanceDateRangeParams, ListData } from './finance-common';
export type { CreateInvoiceInput } from './finance-create';
export type {
  Subscription,
  SubscriptionCoverageSummary,
  SubscriptionStats,
  UpdateSubscriptionPayload,
} from './subscriptions';
export { subscriptionsApi } from './subscriptions';

export interface InvoiceListParams extends FinanceDateRangeParams {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  projectId?: string;
  subscriptionId?: string;
  search?: string;
}

export interface Invoice {
  id: string;
  code: string;
  orderId: string | null;
  subscriptionId: string | null;
  projectId: string;
  companyId: string | null;
  amount: string;
  currency: string;
  taxStatus: string;
  type: string;
  status: string;
  dueDate: string | null;
  paidDate: string | null;
  govInvoiceId: string | null;
  description: string | null;
  createdAt: string;
  order: { id: string; code: string } | null;
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
  company?: { id: string; name: string } | null;
  contact?: { id: string; firstName: string; lastName: string } | null;
  invoices: Array<{ id: string; code: string; status: string; amount: string }>;
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
  notes: string | null;
  createdAt: string;
  project?: { id: string; code: string; name: string } | null;
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

export interface InvoiceStats {
  total: number;
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
  gap?: 'uninvoiced' | 'outstanding';
  /** With gap: align stats with the orders list. */
  status?: string;
  projectId?: string;
  search?: string;
}

export interface PaymentStats {
  totalPayments: number;
  totalCollected: number | null;
  thisMonthCollected: number | null;
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
  invoiceStatusItems: Array<{
    status: string;
    count: number;
    amount: number | null;
  }>;
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
  async updateStatus(id: string, status: string): Promise<Invoice> {
    const resp = await api.patch<Invoice>(`/api/finance/invoices/${id}/status`, { status });
    return resp.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/api/finance/invoices/${id}`);
  },
  async getStats(params?: FinanceDateRangeParams): Promise<InvoiceStats> {
    const resp = await api.get<InvoiceStats>('/api/finance/invoices/stats', { params });
    return resp.data;
  },
};

export const paymentsApi = {
  async getAll(params?: Record<string, unknown>): Promise<ListData<Payment>> {
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
  async getAll(params?: Record<string, unknown>): Promise<ListData<Order>> {
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
  async getAll(params?: Record<string, unknown>): Promise<ListData<Expense>> {
    const resp = await api.get<ListData<Expense>>('/api/expenses', { params });
    return resp.data;
  },
  async getById(id: string): Promise<Expense> {
    const resp = await api.get<Expense>(`/api/expenses/${id}`);
    return resp.data;
  },
  async create(data: Record<string, unknown>): Promise<Expense> {
    const resp = await api.post<Expense>('/api/expenses', data);
    return resp.data;
  },
  async update(id: string, data: Record<string, unknown>): Promise<Expense> {
    const resp = await api.put<Expense>(`/api/expenses/${id}`, data);
    return resp.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/api/expenses/${id}`);
  },
  async getStats(params?: FinanceDateRangeParams): Promise<ExpenseStats> {
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
