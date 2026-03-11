import { api } from '../api';

export interface Project {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string | null;
  isArchived: boolean;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  company: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string };
  pm: { id: string; firstName: string; lastName: string } | null;
  seller: { id: string; firstName: string; lastName: string } | null;
  _count: { products: number; orders: number };
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

  async getById(id: string): Promise<Project> {
    const resp = await api.get<Project>(`/api/projects/${id}`);
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
