import { api } from '../api';

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurringTaskPerson {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
}

export interface RecurringTaskTemplate {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  interval: number;
  daysOfWeek: string[];
  dayOfMonth: number | null;
  priority: string;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  dueDateOffset: number | null;
  lastCreatedAt: string | null;
  nextCreateAt: string | null;
  checklistData: unknown;
  linksData: unknown;
  spawnedTaskCount: number;
  creator: RecurringTaskPerson;
  assignee: RecurringTaskPerson | null;
}

export interface RecurringTaskWritePayload {
  title: string;
  creatorId?: string;
  description?: string | null;
  assigneeId?: string | null;
  priority?: string;
  frequency: string;
  interval: number;
  daysOfWeek?: string[];
  dayOfMonth?: number | null;
  startDate: string;
  endDate?: string | null;
  dueDateOffset?: number | null;
  isActive?: boolean;
  checklistData?: { title: string; items: string[] } | null;
}

export interface RecurringDueRunResult {
  created: number;
  failed: number;
  taskIds: string[];
}

export interface RecurringRunNowResult {
  template: RecurringTaskTemplate;
  task: { id: string; code: string; title: string };
}

export const recurringTasksApi = {
  async list(): Promise<RecurringTaskTemplate[]> {
    const resp = await api.get<RecurringTaskTemplate[]>('/api/recurring-tasks');
    return resp.data;
  },

  async getById(id: string): Promise<RecurringTaskTemplate> {
    const resp = await api.get<RecurringTaskTemplate>(`/api/recurring-tasks/${id}`);
    return resp.data;
  },

  async create(
    data: RecurringTaskWritePayload & { creatorId: string },
  ): Promise<RecurringTaskTemplate> {
    const resp = await api.post<RecurringTaskTemplate>('/api/recurring-tasks', data);
    return resp.data;
  },

  async update(
    id: string,
    data: Partial<RecurringTaskWritePayload>,
  ): Promise<RecurringTaskTemplate> {
    const resp = await api.patch<RecurringTaskTemplate>(`/api/recurring-tasks/${id}`, data);
    return resp.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/recurring-tasks/${id}`);
  },

  async processDue(): Promise<RecurringDueRunResult> {
    const resp = await api.post<RecurringDueRunResult>('/api/recurring-tasks/actions/process-due');
    return resp.data;
  },

  async runNow(id: string): Promise<RecurringRunNowResult> {
    const resp = await api.post<RecurringRunNowResult>(`/api/recurring-tasks/${id}/run-now`);
    return resp.data;
  },
};
