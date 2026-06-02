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

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  phone?: string;
  telegram?: string;
  position?: string;
}

export interface UpdateEmployeePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  telegram?: string | null;
  position?: string | null;
  level?: string | null;
  notes?: string | null;
  hireDate?: string | null;
}

export interface EmployeeOffboardingInventory {
  activeTaskCount: number;
  projectTeamCount: number;
  productTeamCount: number;
  resourceGrantCount: number;
  fileGrantCount: number;
  credentialGrantCount: number;
  projectIds: string[];
  productIds: string[];
  credentialIds: string[];
}

export interface EmployeeOffboardingPreview {
  employeeId: string;
  employeeName: string;
  currentStatus: string;
  alreadyTerminated: boolean;
  inventory: EmployeeOffboardingInventory;
}

export interface EmployeeOffboardingResult {
  employeeId: string;
  status: string;
  fireDate: string;
  checklistInstanceId: string;
  inventory: EmployeeOffboardingInventory;
  revoked: {
    resourceGrantsRevoked: number;
    fileGrantsRevoked: number;
    projectTeamRemovals: number;
    productTeamRemovals: number;
    credentialGrantsRevoked: number;
    accessOverridesClosed: number;
  };
  financeNotificationsSent: number;
}

export type EmployeeReactivationTargetStatus = 'ACTIVE' | 'PROBATION';

export interface EmployeeReactivationResult {
  employeeId: string;
  status: string;
  fireDate: null;
  checklistInstanceId: string;
  previousFireDate: string | null;
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
  async create(data: CreateEmployeePayload): Promise<Employee> {
    const resp = await api.post<Employee>('/api/employees', data);
    return resp.data;
  },
  async update(id: string, data: UpdateEmployeePayload): Promise<Employee> {
    const resp = await api.put<Employee>(`/api/employees/${id}`, data);
    return resp.data;
  },
  async changeStatus(id: string, status: string): Promise<Employee> {
    const resp = await api.patch<Employee>(`/api/employees/${id}/status`, { status });
    return resp.data;
  },
  async changeRole(id: string, roleId: string): Promise<Employee> {
    const resp = await api.patch<Employee>(`/api/employees/${id}/role`, { roleId });
    return resp.data;
  },
  async addDepartment(
    id: string,
    data: { departmentId: string; deptRole?: string; isPrimary?: boolean },
  ): Promise<EmployeeDepartment> {
    const resp = await api.post<EmployeeDepartment>(`/api/employees/${id}/departments`, data);
    return resp.data;
  },
  async updateDepartment(
    id: string,
    departmentId: string,
    data: { deptRole?: string; isPrimary?: boolean },
  ): Promise<EmployeeDepartment> {
    const resp = await api.patch<EmployeeDepartment>(
      `/api/employees/${id}/departments/${departmentId}`,
      data,
    );
    return resp.data;
  },
  async removeDepartment(id: string, departmentId: string): Promise<void> {
    await api.delete(`/api/employees/${id}/departments/${departmentId}`);
  },
  async offboardPreview(id: string): Promise<EmployeeOffboardingPreview> {
    const resp = await api.get<EmployeeOffboardingPreview>(`/api/employees/${id}/offboard-preview`);
    return resp.data;
  },
  async offboard(id: string): Promise<EmployeeOffboardingResult> {
    const resp = await api.post<EmployeeOffboardingResult>(`/api/employees/${id}/offboard`);
    return resp.data;
  },
  async reactivate(
    id: string,
    body: { status: EmployeeReactivationTargetStatus },
  ): Promise<EmployeeReactivationResult> {
    const resp = await api.post<EmployeeReactivationResult>(
      `/api/employees/${id}/reactivate`,
      body,
    );
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
