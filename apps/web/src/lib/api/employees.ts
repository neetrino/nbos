import { api } from '../api';

export interface EmployeeDepartment {
  id: string;
  departmentId: string;
  deptRole: string;
  isPrimary: boolean;
  department: { id: string; name: string; slug: string };
}

export interface EmployeeRole {
  id: string;
  name: string;
  slug: string;
  level: number;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  telegram: string | null;
  avatar: string | null;
  birthday: string | null;
  notes: string | null;
  position: string | null;
  role: EmployeeRole;
  departments: EmployeeDepartment[];
  level: string | null;
  baseSalary: string | null;
  hireDate: string | null;
  fireDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    dealsSelling: number;
    productsManaging: number;
    tasksAssigned: number;
    tasksCreated: number;
  };
}

export interface RoleItem {
  id: string;
  name: string;
  slug: string;
  level: number;
  isSystem: boolean;
  _count?: { employees: number };
}

export interface DepartmentItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  parent?: { id: string; name: string; slug: string } | null;
  _count?: { members: number };
}

export interface DepartmentMember {
  id: string;
  employeeId: string;
  departmentId: string;
  deptRole: string;
  isPrimary: boolean;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    role?: { id: string; name: string; slug: string; level: number };
  };
}

export interface DepartmentWithMembers extends DepartmentItem {
  members: DepartmentMember[];
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

export const rolesApi = {
  async getAll(): Promise<RoleItem[]> {
    const resp = await api.get<RoleItem[]>('/api/roles');
    return resp.data;
  },
};

export const departmentsApi = {
  async getAll(): Promise<DepartmentItem[]> {
    const resp = await api.get<DepartmentItem[]>('/api/departments');
    return resp.data;
  },
  async getById(id: string): Promise<DepartmentWithMembers> {
    const resp = await api.get<DepartmentWithMembers>(`/api/departments/${id}`);
    return resp.data;
  },
  async create(data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    sortOrder?: number;
  }): Promise<DepartmentItem> {
    const resp = await api.post<DepartmentItem>('/api/departments', data);
    return resp.data;
  },
};

export const invitationsApi = {
  async create(data: { email: string; roleId: string; departmentId?: string }): Promise<unknown> {
    const resp = await api.post('/api/invitations', data);
    return resp.data;
  },
  async getAll(): Promise<unknown[]> {
    const resp = await api.get<unknown[]>('/api/invitations');
    return resp.data;
  },
};
