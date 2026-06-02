import { api } from '@/lib/api';
import type { AccessScopeMode, PlatformAccessAction, PlatformResourceFamily } from '@nbos/shared';

export interface RoleAccessPolicyRow {
  resourceFamily: PlatformResourceFamily;
  defaultLevel: PlatformAccessAction;
  scopeMode: AccessScopeMode;
  persisted: boolean;
}

export interface EmployeeAccessOverrideRow {
  id: string;
  employeeId: string;
  resourceFamily: PlatformResourceFamily;
  level: PlatformAccessAction;
  scopeMode: AccessScopeMode | null;
  reason: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
}

export interface TeamMemberEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string | null;
}

export interface ProjectTeamMemberRow {
  id: string;
  projectId: string;
  employeeId: string;
  role: string;
  accessLevel: string;
  source: string;
  employee: TeamMemberEmployee;
}

export interface ProductTeamMemberRow {
  id: string;
  productId: string;
  employeeId: string;
  slot: string | null;
  accessLevel: string;
  source: string;
  isPrimary: boolean;
  employee: TeamMemberEmployee;
}

export const platformAccessApi = {
  listProjectTeam(projectId: string) {
    return api.get<ProjectTeamMemberRow[]>(`/api/projects/${projectId}/team`);
  },
  listProductTeam(productId: string) {
    return api.get<ProductTeamMemberRow[]>(`/api/projects/products/${productId}/team`);
  },
  addProjectTeamMember(projectId: string, body: { employeeId: string; role?: 'ADMIN' | 'MEMBER' }) {
    return api.post<ProjectTeamMemberRow>(`/api/projects/${projectId}/team`, body);
  },
  updateProjectTeamMember(
    projectId: string,
    employeeId: string,
    body: { role?: 'ADMIN' | 'MEMBER' },
  ) {
    return api.put<ProjectTeamMemberRow>(`/api/projects/${projectId}/team/${employeeId}`, body);
  },
  removeProjectTeamMember(projectId: string, employeeId: string) {
    return api.delete(`/api/projects/${projectId}/team/${employeeId}`);
  },
  listRolePolicies(roleId: string) {
    return api.get<RoleAccessPolicyRow[]>(`/api/platform-access/roles/${roleId}/policies`);
  },
  saveRolePolicies(
    roleId: string,
    policies: Array<{
      resourceFamily: PlatformResourceFamily;
      defaultLevel: PlatformAccessAction;
      scopeMode: AccessScopeMode;
    }>,
    changeReason?: string | null,
  ) {
    return api.put<RoleAccessPolicyRow[]>(`/api/platform-access/roles/${roleId}/policies`, {
      policies,
      changeReason: changeReason ?? null,
    });
  },
  listEmployeeOverrides(employeeId: string) {
    return api.get<EmployeeAccessOverrideRow[]>(
      `/api/platform-access/employees/${employeeId}/overrides`,
    );
  },
  upsertEmployeeOverride(
    employeeId: string,
    body: {
      resourceFamily: PlatformResourceFamily;
      level: PlatformAccessAction;
      scopeMode?: AccessScopeMode | null;
      reason?: string | null;
    },
  ) {
    return api.put<EmployeeAccessOverrideRow>(
      `/api/platform-access/employees/${employeeId}/overrides`,
      body,
    );
  },
  removeEmployeeOverride(
    employeeId: string,
    resourceFamily: PlatformResourceFamily,
    changeReason?: string | null,
  ) {
    const params = changeReason?.trim() ? { changeReason: changeReason.trim() } : undefined;
    return api.delete(`/api/platform-access/employees/${employeeId}/overrides/${resourceFamily}`, {
      params,
    });
  },
};
