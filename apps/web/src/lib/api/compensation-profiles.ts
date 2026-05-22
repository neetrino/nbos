import { api } from '../api';

export type CompensationProfileStatus = 'DRAFT' | 'REVIEW' | 'ACTIVE' | 'ARCHIVED';

export interface CompensationProfileRow {
  id: string;
  employeeId: string;
  baseSalary: string;
  currency: string;
  bonusPolicyId: string | null;
  kpiPolicyId: string | null;
  kpiPolicy: { id: string; name: string } | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: CompensationProfileStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompensationProfilePayload {
  baseSalary: number;
  currency?: string;
  kpiPolicyId?: string;
  effectiveFrom: string;
  notes?: string;
}

export interface PatchCompensationProfileDraftPayload {
  baseSalary?: number;
  kpiPolicyId?: string | null;
  effectiveFrom?: string;
  notes?: string | null;
}

export const compensationProfilesApi = {
  listForEmployee(employeeId: string): Promise<{ items: CompensationProfileRow[] }> {
    return api.get<{ items: CompensationProfileRow[] }>(
      `/api/employees/${employeeId}/compensation-profiles`,
    );
  },

  createDraft(
    employeeId: string,
    payload: CreateCompensationProfilePayload,
  ): Promise<CompensationProfileRow> {
    return api.post<CompensationProfileRow>(
      `/api/employees/${employeeId}/compensation-profiles`,
      payload,
    );
  },

  patchDraft(
    id: string,
    payload: PatchCompensationProfileDraftPayload,
  ): Promise<CompensationProfileRow> {
    return api.patch<CompensationProfileRow>(`/api/compensation-profiles/${id}`, payload);
  },

  activate(id: string): Promise<CompensationProfileRow> {
    return api.post<CompensationProfileRow>(`/api/compensation-profiles/${id}/activate`, {});
  },
};
