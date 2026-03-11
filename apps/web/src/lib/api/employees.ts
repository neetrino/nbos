import { api } from '../api';

export interface Employee {
  id: string;
  clerkUserId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string | null;
  level: string | null;
  baseSalary: string | null;
  status: string;
  createdAt: string;
  _count?: {
    projectsSelling: number;
    projectsManaging: number;
    tasksAssigned: number;
    tasksCreated: number;
  };
}

interface ListData<T> {
  items: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export const employeesApi = {
  async getAll(params?: Record<string, unknown>): Promise<ListData<Employee>> {
    const resp = await api.get<ListData<Employee>>('/api/employees', { params });
    return resp.data;
  },
  async getById(id: string): Promise<Employee> {
    const resp = await api.get<Employee>(`/api/employees/${id}`);
    return resp.data;
  },
  async create(data: Record<string, unknown>): Promise<Employee> {
    const resp = await api.post<Employee>('/api/employees', data);
    return resp.data;
  },
  async update(id: string, data: Record<string, unknown>): Promise<Employee> {
    const resp = await api.put<Employee>(`/api/employees/${id}`, data);
    return resp.data;
  },
};
