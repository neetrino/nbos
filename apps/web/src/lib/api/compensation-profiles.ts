import { api } from '../api';

export type CompensationProfileStatus = 'DRAFT' | 'REVIEW' | 'ACTIVE' | 'ARCHIVED';

export interface CompensationProfileRow {
  id: string;
  employeeId: string;
  baseSalary: string;
  currency: string;
  bonusPolicyId: string | null;
  bonusPolicy: { id: string; name: string; templateCode: string } | null;
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
  bonusPolicyId?: string;
  kpiPolicyId?: string;
  effectiveFrom: string;
  notes?: string;
}

export interface PatchCompensationProfileDraftPayload {
  baseSalary?: number;
  bonusPolicyId?: string | null;
  kpiPolicyId?: string | null;
  effectiveFrom?: string;
  notes?: string | null;
}

export const compensationProfilesApi = {
  async listForEmployee(employeeId: string): Promise<{ items: CompensationProfileRow[] }> {
    const { data } = await api.get<{ items: CompensationProfileRow[] }>(
      `/api/employees/${employeeId}/compensation-profiles`,
    );
    return data;
  },

  async createDraft(
    employeeId: string,
    payload: CreateCompensationProfilePayload,
  ): Promise<CompensationProfileRow> {
    const { data } = await api.post<CompensationProfileRow>(
      `/api/employees/${employeeId}/compensation-profiles`,
      payload,
    );
    return data;
  },

  async patchDraft(
    id: string,
    payload: PatchCompensationProfileDraftPayload,
  ): Promise<CompensationProfileRow> {
    const { data } = await api.patch<CompensationProfileRow>(
      `/api/compensation-profiles/${id}`,
      payload,
    );
    return data;
  },

  async activate(id: string): Promise<CompensationProfileRow> {
    const { data } = await api.post<CompensationProfileRow>(
      `/api/compensation-profiles/${id}/activate`,
      {},
    );
    return data;
  },
};
