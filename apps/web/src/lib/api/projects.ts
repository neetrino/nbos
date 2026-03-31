import { api } from '../api';

export interface EmployeeRef {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  company: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string };
  _count: { orders: number };
}

export interface ProjectOrder {
  id: string;
  code: string;
  type: string;
  paymentType: string;
  totalAmount: string;
  currency: string;
  status: string;
  createdAt: string;
  invoices: ProjectInvoice[];
}

export interface ProjectInvoice {
  id: string;
  code: string;
  status: string;
  amount: string;
  type: string;
  dueDate: string | null;
  paidDate: string | null;
}

export interface ProjectTicket {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  billable: boolean;
  createdAt: string;
  assignee: EmployeeRef | null;
  contact: { id: string; firstName: string; lastName: string } | null;
}

export interface ProjectCredential {
  id: string;
  name: string;
  category: string;
  provider: string | null;
  url: string | null;
  login: string | null;
  accessLevel: string;
  createdAt: string;
}

export interface ProjectSubscription {
  id: string;
  code: string;
  type: string;
  amount: string;
  billingDay: number;
  status: string;
  startDate: string;
  endDate: string | null;
  invoices: ProjectInvoice[];
}

export interface ProjectDomain {
  id: string;
  domainName: string;
  provider: string | null;
  purchaseDate: string | null;
  expiryDate: string | null;
  renewalCost: string | null;
  clientCharge: string | null;
  autoRenew: boolean;
  status: string;
}

export interface ProjectExpense {
  id: string;
  type: string;
  category: string;
  name: string;
  amount: string;
  frequency: string;
  status: string;
  dueDate: string | null;
  isPassThrough: boolean;
}

export interface ProjectAuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

export interface FullProject extends Project {
  orders: ProjectOrder[];
  tickets: ProjectTicket[];
  credentials: ProjectCredential[];
  subscriptions: ProjectSubscription[];
  domains: ProjectDomain[];
  expenses: ProjectExpense[];
  auditLogs: ProjectAuditLog[];
  _count: {
    orders: number;
    tickets: number;
    credentials: number;
    expenses: number;
  };
}

export interface ProjectListData {
  items: Project[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export const projectsApi = {
  async getAll(params?: Record<string, unknown>): Promise<ProjectListData> {
    const resp = await api.get<ProjectListData>('/api/projects', { params });
    return resp.data;
  },

  async getById(id: string): Promise<FullProject> {
    const resp = await api.get<FullProject>(`/api/projects/${id}`);
    return resp.data;
  },

  async create(data: Record<string, unknown>): Promise<Project> {
    const resp = await api.post<Project>('/api/projects', data);
    return resp.data;
  },

  async update(id: string, data: Record<string, unknown>): Promise<Project> {
    const resp = await api.put<Project>(`/api/projects/${id}`, data);
    return resp.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/projects/${id}`);
  },
};
