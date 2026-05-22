import type { InputJsonValue } from '@nbos/database';

export interface CreateCompensationProfileBody {
  baseSalary: number;
  currency?: string;
  payoutSchedule?: InputJsonValue;
  bonusPolicyId?: string;
  kpiPolicyId?: string;
  effectiveFrom: string;
  notes?: string;
  source?: string;
}

export interface PatchCompensationProfileDraftBody {
  baseSalary?: number;
  currency?: string;
  kpiPolicyId?: string | null;
  bonusPolicyId?: string | null;
  effectiveFrom?: string;
  notes?: string | null;
}

export interface ActivateCompensationProfileMeta {
  approvedById?: string | null;
}

export interface CompensationProfileKpiPolicyRef {
  id: string;
  name: string;
}

export interface CompensationProfileBonusPolicyRef {
  id: string;
  name: string;
  templateCode: string;
}

export interface CompensationProfileDto {
  id: string;
  employeeId: string;
  baseSalary: string;
  currency: string;
  payoutSchedule: unknown;
  bonusPolicyId: string | null;
  bonusPolicy: CompensationProfileBonusPolicyRef | null;
  kpiPolicyId: string | null;
  kpiPolicy: CompensationProfileKpiPolicyRef | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: string;
  source: string | null;
  notes: string | null;
  approvedBy: { id: string; firstName: string; lastName: string } | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
