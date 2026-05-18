import { api } from '../api';

export interface RecurringTaskTemplate {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  interval: number;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  nextCreateAt: string | null;
  creator: { id: string; firstName: string; lastName: string };
  assignee: { id: string; firstName: string; lastName: string } | null;
}

export const recurringTasksApi = {
  async list(creatorId?: string): Promise<RecurringTaskTemplate[]> {
    const resp = await api.get<RecurringTaskTemplate[]>('/api/recurring-tasks', {
      params: creatorId ? { creatorId } : undefined,
    });
    return resp.data;
  },
  async create(data: {
    title: string;
    creatorId: string;
    frequency: string;
    startDate: string;
    assigneeId?: string;
    interval?: number;
  }): Promise<RecurringTaskTemplate> {
    const resp = await api.post<RecurringTaskTemplate>('/api/recurring-tasks', data);
    return resp.data;
  },
  async deactivate(id: string): Promise<RecurringTaskTemplate> {
    const resp = await api.patch<RecurringTaskTemplate>(`/api/recurring-tasks/${id}`, {
      isActive: false,
    });
    return resp.data;
  },
};
