import { api } from '../api';
import { postEmployeeAvatarFile } from './post-employee-avatar';

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
  sipId: string | null;
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
  assignable?: boolean;
  _count?: { employees: number };
}

export interface DepartmentMemberEmployee {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  position?: string | null;
  role?: { id: string; name: string; slug: string; level: number };
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
  members?: DepartmentMember[];
}

export interface DepartmentMember {
  id: string;
  employeeId: string;
  departmentId: string;
  deptRole: string;
  isPrimary: boolean;
  employee: DepartmentMemberEmployee;
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
  sipId?: string | null;
  position?: string | null;
  level?: string | null;
  notes?: string | null;
  hireDate?: string | null;
  birthday?: string | null;
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
    seatAssignmentsEnded: number;
    permissionRolesRevoked: number;
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

/** Owner-initiated reset: the response never carries a token or a reset URL. */
export interface EmployeePasswordResetLinkResult {
  employeeId: string;
  sentToEmail: string;
  expiresAt: string;
}

export interface EmployeeSessionRevokeResult {
  employeeId: string;
  sessionsRevoked: number;
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
  async sendPasswordResetLink(id: string): Promise<EmployeePasswordResetLinkResult> {
    const resp = await api.post<EmployeePasswordResetLinkResult>(
      `/api/employees/${id}/security/password-reset-link`,
    );
    return resp.data;
  },
  async revokeSessions(id: string): Promise<EmployeeSessionRevokeResult> {
    const resp = await api.post<EmployeeSessionRevokeResult>(
      `/api/employees/${id}/security/revoke-sessions`,
    );
    return resp.data;
  },
  async uploadAvatar(id: string, file: File): Promise<Employee> {
    return postEmployeeAvatarFile(`/api/employees/${id}/avatar`, file);
  },
  async removeAvatar(id: string): Promise<Employee> {
    const resp = await api.delete<Employee>(`/api/employees/${id}/avatar`);
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
  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      parentId?: string | null;
      sortOrder?: number;
    },
  ): Promise<DepartmentItem> {
    const resp = await api.put<DepartmentItem>(`/api/departments/${id}`, data);
    return resp.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/api/departments/${id}`);
  },
};

export interface IssuedInvitation {
  token: string;
  expiresAt: string;
}

export const invitationsApi = {
  async create(data: {
    email: string;
    roleId: string;
    departmentId?: string;
  }): Promise<IssuedInvitation> {
    const resp = await api.post<IssuedInvitation>('/api/invitations', data);
    return resp.data;
  },
  async openLink(): Promise<IssuedInvitation> {
    const resp = await api.post<IssuedInvitation>('/api/invitations/open');
    return resp.data;
  },
  async accessLink(employeeId: string): Promise<IssuedInvitation> {
    const resp = await api.post<IssuedInvitation>('/api/invitations/access-link', { employeeId });
    return resp.data;
  },
  async getAll(): Promise<unknown[]> {
    const resp = await api.get<unknown[]>('/api/invitations');
    return resp.data;
  },
};
