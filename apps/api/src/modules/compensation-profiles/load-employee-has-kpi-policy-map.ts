import type { PrismaClient } from '@nbos/database';

import { resolveCompensationProfileForPayrollMonth } from './resolve-active-compensation-profile';

type Db = Pick<InstanceType<typeof PrismaClient>, 'compensationProfile'>;

/** True when the employee's active compensation profile has a KPI policy assigned. */
export async function loadEmployeeHasKpiPolicyMap(
  db: Db,
  employeeIds: string[],
  payrollMonth: string,
): Promise<Map<string, boolean>> {
  const uniqueIds = [...new Set(employeeIds)];
  const entries = await Promise.all(
    uniqueIds.map(async (employeeId) => {
      const profile = await resolveCompensationProfileForPayrollMonth(db, employeeId, payrollMonth);
      return [employeeId, profile?.kpiPolicyId != null] as const;
    }),
  );
  return new Map(entries);
}
