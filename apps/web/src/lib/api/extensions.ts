import { api } from '../api';

export interface ExtensionEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface Extension {
  id: string;
  projectId: string;
  productId: string | null;
  name: string;
  size: string;
  status: string;
  assignedTo: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string; code: string };
  product: { id: string; name: string } | null;
  assignee: ExtensionEmployee | null;
  order?: { id: string; code: string; status: string } | null;
  readiness?: ExtensionReadinessSummary;
  _count: { tasks: number };
}

export interface FullExtension extends Extension {
  tasks: ExtensionTaskRef[];
  order: ExtensionOrderRef | null;
}

export interface ExtensionReadinessSummary {
  isReadyForDevelopment: boolean;
  missing: ExtensionReadinessIssue[];
}

export interface ExtensionReadinessIssue {
  field: string;
  message: string;
}

export interface ExtensionTaskRef {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  assignee: ExtensionEmployee | null;
  dueDate: string | null;
}

export interface ExtensionOrderRef {
  id: string;
  code: string;
  type: string;
  totalAmount: string;
  currency: string;
  status: string;
}

export interface ExtensionStats {
  total: number;
  byStatus: Record<string, number>;
}

interface ListData {
  items: Extension[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export interface CreateExtensionData {
  projectId: string;
  productId?: string;
  name: string;
  size?: string;
  assignedTo?: string;
  description?: string;
}

export interface UpdateExtensionData {
  name?: string;
  productId?: string | null;
  size?: string;
  assignedTo?: string | null;
  description?: string | null;
}

export const extensionsApi = {
  async getAll(params?: Record<string, unknown>): Promise<ListData> {
    const resp = await api.get<ListData>('/api/projects/extensions', { params });
    return resp.data;
  },

  async getById(id: string): Promise<FullExtension> {
    const resp = await api.get<FullExtension>(`/api/projects/extensions/${id}`);
    return resp.data;
  },

  async create(data: CreateExtensionData): Promise<Extension> {
    const resp = await api.post<Extension>('/api/projects/extensions', data);
    return resp.data;
  },

  async update(id: string, data: UpdateExtensionData): Promise<Extension> {
    const resp = await api.put<Extension>(`/api/projects/extensions/${id}`, data);
    return resp.data;
  },

  async updateStatus(id: string, status: string): Promise<Extension> {
    const resp = await api.patch<Extension>(`/api/projects/extensions/${id}/status`, { status });
    return resp.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/projects/extensions/${id}`);
  },

  async getStats(projectId?: string): Promise<ExtensionStats> {
    const resp = await api.get<ExtensionStats>('/api/projects/extensions/stats', {
      params: projectId ? { projectId } : undefined,
    });
    return resp.data;
  },
};
