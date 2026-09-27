import { BadRequestException, ConflictException } from '@nestjs/common';
import type { TransactionClient } from '@nbos/database';
import {
  compensationProfileInclude,
  type CompensationProfileDbRow,
} from './compensation-profile-serialize';
import {
  lastDateOfPayrollMonth,
  payrollMonthForInstant,
  payrollMonthRangeOf,
  payrollMonthRangesOverlap,
  previousPayrollMonth,
  approvedProfileCoversPayrollMonth,
} from './compensation-profile-payroll-month';
import { APPROVED_COMPENSATION_PROFILE_STATUS } from './resolve-active-compensation-profile';
import { assertEmployeeTakeHomeCurrency } from './compensation-profile-currency';

export type ActivateCompensationProfileTx = Pick<
  TransactionClient,
  'compensationProfile' | 'employee' | '$queryRaw'
>;

export interface ActivateCompensationProfileInput {
  id: string;
  employeeId: string;
  baseSalary: { toString(): string };
  currency: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

interface ApprovedRangeRow {
  id: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

export async function lockEmployeeForCompensationWrite(
  tx: Pick<TransactionClient, '$queryRaw'>,
  employeeId: string,
): Promise<void> {
  await tx.$queryRaw`SELECT id FROM employees WHERE id = ${employeeId} FOR UPDATE`;
}

/**
 * Activates an approved profile without retiring a still-current range.
 * A future start must not copy onto Employee.baseSalary.
 */
export async function activateCompensationProfileInTransaction(
  tx: ActivateCompensationProfileTx,
  profile: ActivateCompensationProfileInput,
  approvedById: string,
  now: Date,
): Promise<CompensationProfileDbRow> {
  assertEmployeeTakeHomeCurrency(profile.currency, `Compensation profile ${profile.id}`);
  await lockEmployeeForCompensationWrite(tx, profile.employeeId);
  const others = await tx.compensationProfile.findMany({
    where: {
      employeeId: profile.employeeId,
      status: APPROVED_COMPENSATION_PROFILE_STATUS,
      id: { not: profile.id },
    },
    select: { id: true, effectiveFrom: true, effectiveTo: true },
  });
  const incomingMonth = payrollMonthForInstant(profile.effectiveFrom);
  const currentMonth = payrollMonthForInstant(now);
  if (incomingMonth < currentMonth) {
    throw new BadRequestException(
      `Cannot activate compensation profile ${profile.id}: start month ${incomingMonth} is before the current payroll month ${currentMonth}`,
    );
  }
  const closedOthers = await closeEarlierOpenEndedProfiles(tx, others, incomingMonth);
  const incomingTo = resolveIncomingEffectiveTo(profile, closedOthers, incomingMonth);
  assertNoOverlappingApprovedRanges(profile.id, incomingMonth, incomingTo, closedOthers);

  const activated = await tx.compensationProfile.update({
    where: { id: profile.id },
    data: {
      status: APPROVED_COMPENSATION_PROFILE_STATUS,
      approvedById,
      approvedAt: now,
      ...(incomingTo != null && profile.effectiveTo == null ? { effectiveTo: incomingTo } : {}),
    },
    include: compensationProfileInclude(),
  });

  if (approvedProfileCoversPayrollMonth(activated, payrollMonthForInstant(now))) {
    await tx.employee.update({
      where: { id: profile.employeeId },
      data: { baseSalary: profile.baseSalary.toString() },
    });
  }
  return activated;
}

async function closeEarlierOpenEndedProfiles(
  tx: ActivateCompensationProfileTx,
  others: ApprovedRangeRow[],
  incomingMonth: string,
): Promise<ApprovedRangeRow[]> {
  const closed: ApprovedRangeRow[] = [];
  for (const other of others) {
    const otherFrom = payrollMonthForInstant(other.effectiveFrom);
    if (other.effectiveTo != null || otherFrom >= incomingMonth) {
      closed.push(other);
      continue;
    }
    const effectiveTo = lastDateOfPayrollMonth(previousPayrollMonth(incomingMonth));
    await tx.compensationProfile.update({
      where: { id: other.id },
      data: { effectiveTo },
    });
    closed.push({ ...other, effectiveTo });
  }
  return closed;
}

function resolveIncomingEffectiveTo(
  profile: ActivateCompensationProfileInput,
  others: ApprovedRangeRow[],
  incomingMonth: string,
): Date | null {
  if (profile.effectiveTo != null) {
    return profile.effectiveTo;
  }
  const laterMonths = others
    .map((row) => payrollMonthForInstant(row.effectiveFrom))
    .filter((from) => from > incomingMonth)
    .sort((left, right) => left.localeCompare(right));
  const nextFrom = laterMonths[0];
  if (nextFrom == null) {
    return null;
  }
  return lastDateOfPayrollMonth(previousPayrollMonth(nextFrom));
}

function assertNoOverlappingApprovedRanges(
  incomingId: string,
  incomingMonth: string,
  incomingTo: Date | null,
  others: ApprovedRangeRow[],
): void {
  const incomingRange = {
    from: incomingMonth,
    to: incomingTo == null ? null : payrollMonthForInstant(incomingTo),
  };
  for (const other of others) {
    const otherRange = payrollMonthRangeOf(other.effectiveFrom, other.effectiveTo);
    if (!payrollMonthRangesOverlap(incomingRange, otherRange)) {
      continue;
    }
    throw new ConflictException(
      `Cannot activate compensation profile ${incomingId}: approved range overlaps another approved profile in payroll month ${overlapStart(incomingRange.from, otherRange.from)}`,
    );
  }
}

function overlapStart(leftFrom: string, rightFrom: string): string {
  return leftFrom > rightFrom ? leftFrom : rightFrom;
}
