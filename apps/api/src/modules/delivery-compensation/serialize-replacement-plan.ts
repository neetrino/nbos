import { assertNoFinancialLeak } from '@nbos/shared';

export type ReplacementPlanComponentDto = {
  componentId: string;
  componentKey: string;
  kind: string;
  /** Employees currently holding a share of this component, in allocation order. */
  holders: Array<{
    allocationId: string;
    employeeId: string;
    employeeName: string;
    /** True when payroll already released part of this allocation, so it cannot be moved. */
    hasReleases: boolean;
  }>;
};

export type ReplacementPlanDto = {
  configurationId: string;
  roleKey: string;
  expectedRevision: number | null;
  components: ReplacementPlanComponentDto[];
};

type ComponentRow = {
  id: string;
  componentKey: string;
  kind: string;
  allocations: Array<{
    id: string;
    employeeId: string;
    employee: { firstName: string; lastName: string } | null;
    bonusEntry: { bonusReleases: Array<{ status: string }> } | null;
  }>;
};

const RELEASED_STATUSES = ['APPROVED', 'INCLUDED_IN_PAYROLL', 'PAID'];

/**
 * Operational view of what a replacement must redistribute. Percents are entered by the
 * user and money is computed server-side, so this payload carries no amounts, units or rates.
 */
export function serializeReplacementPlan(input: {
  configurationId: string;
  roleKey: string;
  expectedRevision: number | null;
  components: ComponentRow[];
}): ReplacementPlanDto {
  const dto: ReplacementPlanDto = {
    configurationId: input.configurationId,
    roleKey: input.roleKey,
    expectedRevision: input.expectedRevision,
    components: input.components.map((component) => ({
      componentId: component.id,
      componentKey: component.componentKey,
      kind: component.kind,
      holders: component.allocations.map((allocation) => ({
        allocationId: allocation.id,
        employeeId: allocation.employeeId,
        employeeName: employeeName(allocation.employee),
        hasReleases: (allocation.bonusEntry?.bonusReleases ?? []).some((release) =>
          RELEASED_STATUSES.includes(release.status),
        ),
      })),
    })),
  };
  const leaks = assertNoFinancialLeak(dto);
  if (leaks.length > 0) {
    throw new Error(`Replacement plan leaked financial keys: ${leaks.join(', ')}`);
  }
  return dto;
}

function employeeName(employee: { firstName: string; lastName: string } | null): string {
  if (!employee) return '';
  return `${employee.firstName} ${employee.lastName}`.trim();
}
