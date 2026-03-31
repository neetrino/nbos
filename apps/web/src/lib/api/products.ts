import { api } from '../api';

export interface ProductEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface Product {
  id: string;
  projectId: string;
  name: string;
  productCategory: string;
  productType: string;
  status: string;
  pmId: string | null;
  deadline: string | null;
  description: string | null;
  checklistTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string; code: string };
  pm: ProductEmployee | null;
  _count: { extensions: number; tasks: number; tickets: number };
}

export interface FullProduct extends Product {
  extensions: ProductExtensionRef[];
  tasks: ProductTaskRef[];
  tickets: ProductTicketRef[];
  order: ProductOrderRef | null;
}

export interface ProductExtensionRef {
  id: string;
  name: string;
  size: string;
  status: string;
  assignedTo: string | null;
  assignee: ProductEmployee | null;
  createdAt: string;
}

export interface ProductTaskRef {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  assignee: ProductEmployee | null;
  dueDate: string | null;
}

export interface ProductTicketRef {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
}

export interface ProductOrderRef {
  id: string;
  code: string;
  type: string;
  totalAmount: string;
  currency: string;
  status: string;
}

export interface ProductStats {
  total: number;
  byStatus: Record<string, number>;
}

interface ListData {
  items: Product[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export interface CreateProductData {
  projectId: string;
  name: string;
  productCategory: string;
  productType: string;
  pmId?: string;
  deadline?: string;
  description?: string;
  checklistTemplateId?: string;
}

export interface UpdateProductData {
  name?: string;
  productCategory?: string;
  productType?: string;
  pmId?: string | null;
  deadline?: string | null;
  description?: string | null;
  checklistTemplateId?: string | null;
}

export const productsApi = {
  async getAll(params?: Record<string, unknown>): Promise<ListData> {
    const resp = await api.get<ListData>('/api/projects/products', { params });
    return resp.data;
  },

  async getById(id: string): Promise<FullProduct> {
    const resp = await api.get<FullProduct>(`/api/projects/products/${id}`);
    return resp.data;
  },

  async create(data: CreateProductData): Promise<Product> {
    const resp = await api.post<Product>('/api/projects/products', data);
    return resp.data;
  },

  async update(id: string, data: UpdateProductData): Promise<Product> {
    const resp = await api.put<Product>(`/api/projects/products/${id}`, data);
    return resp.data;
  },

  async updateStatus(id: string, status: string): Promise<Product> {
    const resp = await api.patch<Product>(`/api/projects/products/${id}/status`, { status });
    return resp.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/projects/products/${id}`);
  },

  async getStats(projectId?: string): Promise<ProductStats> {
    const resp = await api.get<ProductStats>('/api/projects/products/stats', {
      params: projectId ? { projectId } : undefined,
    });
    return resp.data;
  },
};
