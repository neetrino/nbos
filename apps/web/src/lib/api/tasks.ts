import { api } from '../api';

export interface Task {
  id: string;
  code: string;
  title: string;
  description: string | null;
  projectId: string;
  productId: string | null;
  extensionId: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  hasChat: boolean;
  createdAt: string;
  updatedAt: string;
  project: { id: string; code: string; name: string };
  product: { id: string; name: string } | null;
  extension: { id: string; name: string } | null;
  creator: { id: string; firstName: string; lastName: string };
  assignee: { id: string; firstName: string; lastName: string } | null;
}

interface ListData<T> {
  items: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

interface TaskQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  projectId?: string;
  assigneeId?: string;
  search?: string;
}

export const tasksApi = {
  async getAll(params?: TaskQueryParams): Promise<ListData<Task>> {
    const resp = await api.get<ListData<Task>>('/api/tasks', { params });
    return resp.data;
  },
  async getById(id: string): Promise<Task> {
    const resp = await api.get<Task>(`/api/tasks/${id}`);
    return resp.data;
  },
  async create(data: {
    title: string;
    projectId: string;
    creatorId: string;
    description?: string;
    productId?: string;
    assigneeId?: string;
    priority?: string;
    dueDate?: string;
  }): Promise<Task> {
    const resp = await api.post<Task>('/api/tasks', data);
    return resp.data;
  },
  async update(id: string, data: Record<string, unknown>): Promise<Task> {
    const resp = await api.put<Task>(`/api/tasks/${id}`, data);
    return resp.data;
  },
  async updateStatus(id: string, status: string): Promise<Task> {
    const resp = await api.patch<Task>(`/api/tasks/${id}/status`, { status });
    return resp.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/api/tasks/${id}`);
  },
  async getStats() {
    const resp = await api.get('/api/tasks/stats');
    return resp.data;
  },
};
