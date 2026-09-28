import { Decimal } from '@nbos/database';

import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import type { AccessibleEmployeeIds } from '../compensation-profiles/finance-pay-access';
import {
  remainingForBonusEntry,
  type PayrollAllocationSourceRemainingEntry,
  type PayrollAllocationSourceRemainingRelease,
} from './payroll-allocation-source-amounts';
import { isPayrollMatrixBonusEntryVisible } from './payroll-bonus-release-base';

export type PayrollMatrixUnpaidPayeeEntry = PayrollAllocationSourceRemainingEntry & {
  employeeId: string;
};

export type PayrollMatrixEmployeeRowModel = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  position: string | null;
  baseSalary: string;
  salaryLineId: string | null;
  bonusTotalThisRun: string;
  payableTotal: string;
};

export function extraPayrollMatrixPayeeIds(params: {
  entries: PayrollMatrixUnpaidPayeeEntry[];
  releases: PayrollAllocationSourceRemainingRelease[];
  payrollMonth: string;
  payrollRunId: string;
  existingEmployeeIds: ReadonlySet<string>;
  draftEmployeeIds: Iterable<string>;
}): string[] {
  const extra = new Set(
    unpaidPayrollMatrixPayeeIds({
      entries: params.entries,
      releases: params.releases,
      payrollMonth: params.payrollMonth,
      payrollRunId: params.payrollRunId,
      existingEmployeeIds: params.existingEmployeeIds,
    }),
  );
  for (const employeeId of params.draftEmployeeIds) {
    if (!params.existingEmployeeIds.has(employeeId)) {
      extra.add(employeeId);
    }
  }
  return [...extra];
}

export function unpaidPayrollMatrixPayeeIds(params: {
  entries: PayrollMatrixUnpaidPayeeEntry[];
  releases: PayrollAllocationSourceRemainingRelease[];
  payrollMonth: string;
  payrollRunId: string;
  existingEmployeeIds: ReadonlySet<string>;
}): string[] {
  const payees = new Set<string>();
  for (const entry of params.entries) {
    if (params.existingEmployeeIds.has(entry.employeeId) || payees.has(entry.employeeId)) {
      continue;
    }
    if (!hasUnpaidVisibleBonus(entry, params)) {
      continue;
    }
    payees.add(entry.employeeId);
  }
  return [...payees];
}

function hasUnpaidVisibleBonus(
  entry: PayrollMatrixUnpaidPayeeEntry,
  params: {
    releases: PayrollAllocationSourceRemainingRelease[];
    payrollMonth: string;
    payrollRunId: string;
  },
): boolean {
  if (!isPayrollMatrixBonusEntryVisible(entry, params.payrollMonth)) {
    return false;
  }
  return remainingForBonusEntry({
    entry,
    releases: params.releases,
    payrollMonth: params.payrollMonth,
    payrollRunId: params.payrollRunId,
  }).gt(BONUS_POOL_ZERO);
}

export function filterAccessibleEmployeeIds(
  employeeIds: string[],
  accessible: AccessibleEmployeeIds,
): string[] {
  if (accessible === 'ALL') {
    return employeeIds;
  }
  return employeeIds.filter((id) => accessible.includes(id));
}

export async function appendAccessibleBonusOnlyPayees(params: {
  findEmployees: (
    ids: string[],
  ) => Promise<Array<{ id: string; firstName: string; lastName: string; position: string | null }>>;
  rows: PayrollMatrixEmployeeRowModel[];
  entries: PayrollMatrixUnpaidPayeeEntry[];
  releases: PayrollAllocationSourceRemainingRelease[];
  payrollMonth: string;
  payrollRunId: string;
  draftEmployeeIds: Iterable<string>;
  draftBonusesByEmployee: Map<string, Decimal>;
  accessible: AccessibleEmployeeIds;
}): Promise<PayrollMatrixEmployeeRowModel[]> {
  const extraPayeeIds = filterAccessibleEmployeeIds(
    extraPayrollMatrixPayeeIds({
      entries: params.entries,
      releases: params.releases,
      payrollMonth: params.payrollMonth,
      payrollRunId: params.payrollRunId,
      existingEmployeeIds: new Set(params.rows.map((row) => row.employeeId)),
      draftEmployeeIds: params.draftEmployeeIds,
    }),
    params.accessible,
  );
  if (extraPayeeIds.length === 0) {
    return params.rows;
  }
  const extraEmployees = await params.findEmployees(extraPayeeIds);
  return [
    ...params.rows,
    ...payrollMatrixBonusOnlyEmployeeRows(extraEmployees, params.draftBonusesByEmployee),
  ];
}

export function payrollMatrixBonusOnlyEmployeeRows(
  employees: Array<{ id: string; firstName: string; lastName: string; position: string | null }>,
  draftBonusesByEmployee: Map<string, Decimal>,
): PayrollMatrixEmployeeRowModel[] {
  return employees.map((employee) => {
    const draftBonus = draftBonusesByEmployee.get(employee.id) ?? BONUS_POOL_ZERO;
    return {
      id: employee.id,
      employeeId: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      position: employee.position,
      baseSalary: BONUS_POOL_ZERO.toFixed(2),
      salaryLineId: null,
      bonusTotalThisRun: draftBonus.toFixed(2),
      payableTotal: draftBonus.toFixed(2),
    };
  });
}
