import { ConflictException } from '@nestjs/common';
import { type CompensationProfileStatusEnum, type TransactionClient } from '@nbos/database';
import {
  approvedProfileCoversPayrollMonth,
  endOfPayrollMonthUtc,
  startOfPayrollMonthUtc,
} from './compensation-profile-payroll-month';

export type CompensationProfileDb = Pick<TransactionClient, 'compensationProfile'>;

export interface ResolvedCompensationProfile {
  id: string;
  baseSalary: { toString(): string };
  currency: string;
  kpiPolicyId: string | null;
}

export const APPROVED_COMPENSATION_PROFILE_STATUS: CompensationProfileStatusEnum = 'ACTIVE';
export const ARCHIVED_COMPENSATION_PROFILE_STATUS: CompensationProfileStatusEnum = 'ARCHIVED';
export const HISTORICAL_COMPENSATION_PROFILE_STATUSES: CompensationProfileStatusEnum[] = [
  APPROVED_COMPENSATION_PROFILE_STATUS,
  ARCHIVED_COMPENSATION_PROFILE_STATUS,
];

export interface ApprovedCompensationProfileRange {
  id: string;
  employeeId: string;
  baseSalary: { toString(): string };
  currency: string;
  kpiPolicyId: string | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  status?: CompensationProfileStatusEnum;
}

/**
 * Approved (activated) profile whose range covers the full payroll month.
 * DRAFT/REVIEW are never used. Multiple covering ranges are a conflict, not a latest-row pick.
 */
export async function resolveCompensationProfileForPayrollMonth(
  db: CompensationProfileDb,
  employeeId: string,
  payrollMonth: string,
): Promise<ResolvedCompensationProfile | null> {
  const monthStart = startOfPayrollMonthUtc(payrollMonth);
  const monthEnd = endOfPayrollMonthUtc(payrollMonth);
  const rows = await db.compensationProfile.findMany({
    where: {
      employeeId,
      status: APPROVED_COMPENSATION_PROFILE_STATUS,
      effectiveFrom: { lte: monthEnd },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: monthStart } }],
    },
    select: { id: true, baseSalary: true, currency: true, kpiPolicyId: true },
  });
  return pickSingleCoveringApprovedProfile(rows, employeeId, payrollMonth);
}

export function coveringApprovedProfiles<T extends { employeeId: string } & RangeFields>(
  profiles: T[],
  employeeId: string,
  payrollMonth: string,
): T[] {
  return profiles.filter(
    (profile) =>
      profile.employeeId === employeeId &&
      isApprovedProfileStatus(profile.status) &&
      approvedProfileCoversPayrollMonth(profile, payrollMonth),
  );
}

export function hasApprovedProfileStartingAfterPayrollMonth(
  profiles: { employeeId: string; effectiveFrom: Date; status?: CompensationProfileStatusEnum }[],
  employeeId: string,
  payrollMonth: string,
): boolean {
  const monthEnd = endOfPayrollMonthUtc(payrollMonth);
  return profiles.some(
    (profile) =>
      profile.employeeId === employeeId &&
      isApprovedProfileStatus(profile.status) &&
      profile.effectiveFrom > monthEnd,
  );
}

/** ACTIVE or ARCHIVED terms that began on or before this month — a later start does not hide this gap. */
export function hasHistoricalProfileStartingOnOrBeforePayrollMonth(
  profiles: { employeeId: string; effectiveFrom: Date; status?: CompensationProfileStatusEnum }[],
  employeeId: string,
  payrollMonth: string,
): boolean {
  const monthEnd = endOfPayrollMonthUtc(payrollMonth);
  return profiles.some(
    (profile) =>
      profile.employeeId === employeeId &&
      isHistoricalProfileStatus(profile.status) &&
      profile.effectiveFrom <= monthEnd,
  );
}

export function uniqueCoveringProfilePerEmployee<T extends { employeeId: string }>(
  rows: T[],
  payrollMonth: string,
): T[] {
  const byEmployee = new Map<string, T[]>();
  for (const row of rows) {
    const group = byEmployee.get(row.employeeId) ?? [];
    group.push(row);
    byEmployee.set(row.employeeId, group);
  }
  const unique: T[] = [];
  for (const [employeeId, group] of byEmployee) {
    const picked = pickSingleCoveringApprovedProfile(group, employeeId, payrollMonth);
    if (picked != null) {
      unique.push(picked);
    }
  }
  return unique;
}

export function pickSingleCoveringApprovedProfile<T>(
  covering: T[],
  employeeId: string,
  payrollMonth: string,
): T | null {
  if (covering.length > 1) {
    throw new ConflictException(
      `Multiple approved compensation profiles cover payroll month ${payrollMonth} for employee ${employeeId}`,
    );
  }
  return covering[0] ?? null;
}

type RangeFields = {
  effectiveFrom: Date;
  effectiveTo: Date | null;
  status?: CompensationProfileStatusEnum;
};

function isApprovedProfileStatus(status: CompensationProfileStatusEnum | undefined): boolean {
  return status == null || status === APPROVED_COMPENSATION_PROFILE_STATUS;
}

function isHistoricalProfileStatus(status: CompensationProfileStatusEnum | undefined): boolean {
  return (
    status == null ||
    status === APPROVED_COMPENSATION_PROFILE_STATUS ||
    status === ARCHIVED_COMPENSATION_PROFILE_STATUS
  );
}
