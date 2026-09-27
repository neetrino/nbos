import { BadRequestException } from '@nestjs/common';
import { Decimal, type TransactionClient } from '@nbos/database';

import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import { payrollMonthForInstant } from '../compensation-profiles/compensation-profile-payroll-month';

const TERMINATED_EMPLOYEE_STATUS = 'TERMINATED';

export type BonusSettlementSalaryLineTx = Pick<TransactionClient, 'salaryLine' | 'employee'>;

export type BonusSettlementSalaryLineSnapshot = {
  id: string;
  baseSalary: Decimal;
  bonusesTotal: Decimal;
  paidAmount: Decimal;
};

const SETTLEMENT_LINE_SELECT = {
  id: true,
  baseSalary: true,
  bonusesTotal: true,
  paidAmount: true,
} as const;

/**
 * Post-fire bonus settlement: no salary amount and no profile to convert.
 * Ordinary salary lines keep their profile currency check.
 */
export function isZeroSalaryBonusSettlementLine(line: {
  baseSalary: Decimal;
  compensationProfileId?: string | null;
  compensationProfile?: { currency?: string } | null;
}): boolean {
  if (line.compensationProfileId != null || line.compensationProfile != null) {
    return false;
  }
  return line.baseSalary.eq(BONUS_POOL_ZERO);
}

/**
 * True when a terminated employee has no salary entitlement in this payroll
 * month, so an unpaid earned bonus may use a zero-salary settlement line.
 */
export function canCreateTerminatedBonusSettlementLine(
  employee: { status: string; fireDate: Date | null } | null,
  payrollMonth: string,
): boolean {
  if (employee == null || employee.status !== TERMINATED_EMPLOYEE_STATUS) {
    return false;
  }
  if (employee.fireDate == null) {
    return true;
  }
  return payrollMonthForInstant(employee.fireDate) < payrollMonth;
}

export async function loadOrCreateBonusSettlementSalaryLine(
  tx: BonusSettlementSalaryLineTx,
  params: { payrollRunId: string; employeeId: string; payrollMonth: string },
): Promise<BonusSettlementSalaryLineSnapshot> {
  const existing = await tx.salaryLine.findUnique({
    where: {
      payrollRunId_employeeId: {
        payrollRunId: params.payrollRunId,
        employeeId: params.employeeId,
      },
    },
    select: SETTLEMENT_LINE_SELECT,
  });
  if (existing != null) {
    return existing;
  }
  return createTerminatedBonusSettlementSalaryLine(tx, params);
}

async function createTerminatedBonusSettlementSalaryLine(
  tx: BonusSettlementSalaryLineTx,
  params: { payrollRunId: string; employeeId: string; payrollMonth: string },
): Promise<BonusSettlementSalaryLineSnapshot> {
  const employee = await tx.employee.findUnique({
    where: { id: params.employeeId },
    select: { status: true, fireDate: true },
  });
  if (!canCreateTerminatedBonusSettlementLine(employee, params.payrollMonth)) {
    throw new BadRequestException(
      `No salary line for employee ${params.employeeId} in this payroll run; seed or add the line first.`,
    );
  }
  return tx.salaryLine.create({
    data: {
      payrollRunId: params.payrollRunId,
      employeeId: params.employeeId,
      compensationProfileId: null,
      baseSalary: BONUS_POOL_ZERO,
      bonusesTotal: BONUS_POOL_ZERO,
      totalPayable: BONUS_POOL_ZERO,
      paidAmount: BONUS_POOL_ZERO,
      remainingAmount: BONUS_POOL_ZERO,
    },
    select: SETTLEMENT_LINE_SELECT,
  });
}
