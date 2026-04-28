import { api } from '../api';
import type { Expense } from './finance';
import type { ListData } from './finance-common';

export interface ExpensePlan {
  id: string;
  name: string;
  category: string;
  amount: string;
  frequency: string;
  nextDueDate: string | null;
  provider: string | null;
  projectId: string | null;
  autoGenerate: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; code: string; name: string } | null;
  _count: { expenses: number };
}

export interface CreateExpensePlanPayload {
  name: string;
  category: string;
  amount: number;
  frequency?: string;
  nextDueDate?: string | null;
  provider?: string | null;
  projectId?: string | null;
  autoGenerate?: boolean;
  notes?: string | null;
}

export const expensePlansApi = {
  async getAll(params?: Record<string, unknown>): Promise<ListData<ExpensePlan>> {
    const resp = await api.get<ListData<ExpensePlan>>('/api/expense-plans', { params });
    return resp.data;
  },

  async getById(id: string): Promise<ExpensePlan> {
    const resp = await api.get<ExpensePlan>(`/api/expense-plans/${id}`);
    return resp.data;
  },

  async create(data: CreateExpensePlanPayload): Promise<ExpensePlan> {
    const resp = await api.post<ExpensePlan>('/api/expense-plans', data);
    return resp.data;
  },

  async update(id: string, data: Partial<CreateExpensePlanPayload>): Promise<ExpensePlan> {
    const resp = await api.put<ExpensePlan>(`/api/expense-plans/${id}`, data);
    return resp.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/expense-plans/${id}`);
  },

  async generateCard(planId: string, body?: { dueDate?: string | null }): Promise<Expense> {
    const resp = await api.post<Expense>(`/api/expense-plans/${planId}/cards`, body ?? {});
    return resp.data;
  },
};
