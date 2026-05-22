import type { Prisma } from '@nbos/database';

import type { CompensationProfileDto } from './compensation-profiles.types';

const profileInclude = {
  approvedBy: { select: { id: true, firstName: true, lastName: true } },
  kpiPolicy: { select: { id: true, name: true } },
} as const;

export type CompensationProfileDbRow = Prisma.CompensationProfileGetPayload<{
  include: typeof profileInclude;
}>;

export function compensationProfileInclude() {
  return profileInclude;
}

export function serializeCompensationProfile(
  row: CompensationProfileDbRow,
): CompensationProfileDto {
  return {
    id: row.id,
    employeeId: row.employeeId,
    baseSalary: row.baseSalary.toString(),
    currency: row.currency,
    payoutSchedule: row.payoutSchedule,
    bonusPolicyId: row.bonusPolicyId,
    kpiPolicyId: row.kpiPolicyId,
    kpiPolicy: row.kpiPolicy,
    effectiveFrom: row.effectiveFrom.toISOString().slice(0, 10),
    effectiveTo: row.effectiveTo?.toISOString().slice(0, 10) ?? null,
    status: row.status,
    source: row.source,
    notes: row.notes,
    approvedBy: row.approvedBy,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
