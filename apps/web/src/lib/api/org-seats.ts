import { api } from '../api';
import type { EmployeeRole } from './employees';

export type OrgSeatKind = 'HEAD' | 'DEPUTY' | 'STANDARD';
export type OrgSeatAssignmentStatus = 'ACTIVE' | 'TEMPORARY' | 'ENDED';

export interface OrgSeatEmployee {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  position: string | null;
  role: EmployeeRole;
}

export interface OrgSeatAssignment {
  id: string;
  seatId: string;
  employeeId: string;
  status: OrgSeatAssignmentStatus;
  allocationPct: number;
  isPrimary: boolean;
  startsAt: string;
  endsAt: string | null;
  employee: OrgSeatEmployee;
}

export interface OrgSeat {
  id: string;
  departmentId: string;
  title: string;
  description: string | null;
  defaultPermissionRoleId: string | null;
  kind: OrgSeatKind;
  status: 'ACTIVE' | 'ARCHIVED';
  sortOrder: number;
  department: { id: string; name: string; slug: string; headSeatId: string | null };
  defaultPermissionRole: (EmployeeRole & { assignable: boolean }) | null;
  assignments: OrgSeatAssignment[];
}

export interface CreateOrgSeatPayload {
  departmentId: string;
  title: string;
  description?: string;
  defaultPermissionRoleId?: string | null;
  kind?: OrgSeatKind;
  sortOrder?: number;
}

export interface UpdateOrgSeatPayload {
  title?: string;
  description?: string | null;
  defaultPermissionRoleId?: string | null;
  kind?: OrgSeatKind;
  sortOrder?: number;
}

export interface EmployeeEffectiveAccess {
  employee: { id: string; firstName: string; lastName: string };
  roles: Array<{
    id: string;
    source: 'LEGACY' | 'MANUAL' | 'SEAT';
    role: EmployeeRole;
    scopeDepartment: { id: string; name: string } | null;
    seatAssignment: {
      id: string;
      seat: { id: string; title: string; departmentId: string; kind: OrgSeatKind };
    } | null;
  }>;
  seats: Array<{
    id: string;
    status: OrgSeatAssignmentStatus;
    allocationPct: number;
    isPrimary: boolean;
    seat: {
      id: string;
      title: string;
      kind: OrgSeatKind;
      department: { id: string; name: string };
    };
  }>;
  effectivePermissions: Record<string, string>;
}

export interface SeatAccessGrant {
  own: boolean;
  all: boolean;
  department: boolean;
  departmentIds: string[];
}

export interface SeatAccessPreview {
  changes: Array<{
    permission: string;
    before: SeatAccessGrant | null;
    after: SeatAccessGrant | null;
  }>;
}

export interface SeatHistoryEntry {
  id: string;
  startsAt: string;
  endsAt: string | null;
  employee: { firstName: string; lastName: string };
}

export const orgSeatsApi = {
  async preview(
    seatId: string,
    employeeId: string,
    operation: 'ASSIGN' | 'END',
  ): Promise<SeatAccessPreview> {
    return (
      await api.post<SeatAccessPreview>(`/api/org-seats/${seatId}/access-preview`, {
        employeeId,
        operation,
      })
    ).data;
  },
  async history(seatId: string): Promise<SeatHistoryEntry[]> {
    return (await api.get<SeatHistoryEntry[]>(`/api/org-seats/${seatId}/history`)).data;
  },
  async getAll(departmentId?: string): Promise<OrgSeat[]> {
    const response = await api.get<OrgSeat[]>('/api/org-seats', {
      params: departmentId ? { departmentId } : undefined,
    });
    return response.data;
  },
  async create(data: CreateOrgSeatPayload): Promise<OrgSeat> {
    const response = await api.post<OrgSeat>('/api/org-seats', data);
    return response.data;
  },
  async update(id: string, data: UpdateOrgSeatPayload): Promise<OrgSeat> {
    const response = await api.patch<OrgSeat>(`/api/org-seats/${id}`, data);
    return response.data;
  },
  async archive(id: string): Promise<void> {
    await api.post(`/api/org-seats/${id}/archive`);
  },
  async assign(
    seatId: string,
    data: { employeeId: string; allocationPct?: number; isPrimary?: boolean },
  ): Promise<OrgSeatAssignment> {
    const response = await api.post<OrgSeatAssignment>(
      `/api/org-seats/${seatId}/assignments`,
      data,
    );
    return response.data;
  },
  async endAssignment(assignmentId: string, reason?: string): Promise<void> {
    await api.post(`/api/org-seats/assignments/${assignmentId}/end`, { reason });
  },
  async getEmployeeEffectiveAccess(employeeId: string): Promise<EmployeeEffectiveAccess> {
    const response = await api.get<EmployeeEffectiveAccess>(
      `/api/employees/${employeeId}/effective-access`,
    );
    return response.data;
  },
};
