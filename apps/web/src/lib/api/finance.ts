import { api } from '../api';

export interface Invoice {
  id: string;
  code: string;
  orderId: string | null;
  subscriptionId: string | null;
  projectId: string;
  companyId: string | null;
  amount: string;
  taxStatus: string;
  type: string;
  status: string;
  dueDate: string | null;
  paidDate: string | null;
  govInvoiceId: string | null;
  createdAt: string;
  order: { id: string; code: string } | null;
  company: { id: string; name: string } | null;
  payments: Payment[];
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
  invoice?: { id: string; code: string; projectId: string };
  confirmer?: { id: string; firstName: string; lastName: string } | null;
}

export interface Order {
  id: string;
  code: string;
  projectId: string;
  type: string;
  paymentType: string;
  totalAmount: string;
  currency: string;
  status: string;
  createdAt: string;
  project: { id: string; code: string; name: string };
  product: { id: string; name: string } | null;
  extension: { id: string; name: string } | null;
  invoices: Array<{ id: string; code: string; status: string; amount: string }>;
}

export interface Subscription {
  id: string;
  code: string;
  projectId: string;
  type: string;
  amount: string;
  billingDay: number;
  taxStatus: string;
  status: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  project: { id: string; code: string; name: string };
  invoices: Array<{ id: string; code: string; status: string; amount: string }>;
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

interface ListData<T> {
  items: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export const invoicesApi = {
  async getAll(params?: Record<string, unknown>): Promise<ListData<Invoice>> {
    const resp = await api.get<ListData<Invoice>>('/api/finance/invoices', { params });
    return resp.data;
  },
  async getById(id: string): Promise<Invoice> {
    const resp = await api.get<Invoice>(`/api/finance/invoices/${id}`);
    return resp.data;
  },
  async create(data: Record<string, unknown>): Promise<Invoice> {
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
  async getStats() {
    const resp = await api.get('/api/finance/invoices/stats');
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
};

export const subscriptionsApi = {
  async getAll(params?: Record<string, unknown>): Promise<ListData<Subscription>> {
    const resp = await api.get<ListData<Subscription>>('/api/finance/subscriptions', { params });
    return resp.data;
  },
  async getById(id: string): Promise<Subscription> {
    const resp = await api.get<Subscription>(`/api/finance/subscriptions/${id}`);
    return resp.data;
  },
  async create(data: Record<string, unknown>): Promise<Subscription> {
    const resp = await api.post<Subscription>('/api/finance/subscriptions', data);
    return resp.data;
  },
  async update(id: string, data: Record<string, unknown>): Promise<Subscription> {
    const resp = await api.put<Subscription>(`/api/finance/subscriptions/${id}`, data);
    return resp.data;
  },
  async updateStatus(id: string, status: string): Promise<Subscription> {
    const resp = await api.patch<Subscription>(`/api/finance/subscriptions/${id}/status`, {
      status,
    });
    return resp.data;
  },
  async getStats() {
    const resp = await api.get('/api/finance/subscriptions/stats');
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
  async getStats() {
    const resp = await api.get('/api/expenses/stats');
    return resp.data;
  },
};
