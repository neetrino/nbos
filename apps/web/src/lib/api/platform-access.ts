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

export const platformAccessApi = {
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
  ) {
    return api.put<RoleAccessPolicyRow[]>(`/api/platform-access/roles/${roleId}/policies`, {
      policies,
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
  removeEmployeeOverride(employeeId: string, resourceFamily: PlatformResourceFamily) {
    return api.delete(`/api/platform-access/employees/${employeeId}/overrides/${resourceFamily}`);
  },
};
