import type {
  PayrollAllocationMatrix,
  PayrollAllocationMatrixCell,
  PayrollMatrixCellState,
} from '@/lib/api/payroll-allocation-matrix';
import type {
  PayrollEmployeeBonusHistory,
  PayrollEmployeeBonusHistoryMeta,
  PayrollEmployeeBonusHistoryProject,
  PayrollEmployeeBonusHistorySlice,
} from '@/lib/api/payroll-employee-bonus-history';

function parseMoney(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(n: number): string {
  return n.toFixed(2);
}

/** Cell states that mean an actual bonus exists for the employee on this order. */
const PROJECT_BONUS_STATES = new Set<PayrollMatrixCellState>([
  'READY',
  'PROGRESS',
  'PARTIALLY_FUNDED',
  'MANUAL_BONUS',
  'EXTRA_BONUS',
  'OVER_FUNDING',
  'RELEASE_SET',
]);

/**
 * Row grouping rank, mirroring the Employee × Order intent: projects where the
 * employee has a bonus sit on top, then linked-but-empty projects, then the
 * remaining (colorless / no-link) projects at the bottom.
 */
function projectSortRank(project: PayrollEmployeeBonusHistoryProject): number {
  const hasHistoryAmount = project.monthAmounts.some((a) => a != null);
  const cell = project.focusCell;
  const hasBonus =
    hasHistoryAmount ||
    (cell != null &&
      (parseMoney(cell.releaseThisMonth) > 0 || PROJECT_BONUS_STATES.has(cell.state)));
  if (hasBonus) return 0;
  if (cell?.linked) return 1;
  return 2;
}

export function compareEmployeeBonusHistoryProjects(
  a: PayrollEmployeeBonusHistoryProject,
  b: PayrollEmployeeBonusHistoryProject,
): number {
  const rankDiff = projectSortRank(a) - projectSortRank(b);
  if (rankDiff !== 0) return rankDiff;
  return a.label.localeCompare(b.label);
}

function focusMonthBonusTotal(cells: PayrollAllocationMatrixCell[]): string {
  let sum = 0;
  for (const cell of cells) {
    sum += parseMoney(cell.releaseThisMonth);
  }
  return formatMoney(sum);
}

/** Instant view from matrix + meta (focus month only; history columns empty). */
export function buildOptimisticEmployeeBonusHistory(
  meta: PayrollEmployeeBonusHistoryMeta,
  matrix: PayrollAllocationMatrix,
  employeeId: string,
): PayrollEmployeeBonusHistory {
  const cells = matrix.cells.filter((c) => c.employeeId === employeeId);
  const cellsByOrder = new Map(cells.map((c) => [c.orderId, c]));
  const unitByOrder = new Map(meta.deliveryUnits.map((u) => [u.orderId, u]));

  const orderIds = new Set<string>();
  for (const unit of meta.deliveryUnits) {
    orderIds.add(unit.orderId);
  }
  for (const cell of cells) {
    if (cell.linked || parseMoney(cell.releaseThisMonth) > 0) {
      orderIds.add(cell.orderId);
    }
  }

  const focusIndex = meta.months.findIndex((m) => m.isFocusMonth);
  const monthCount = meta.months.length;

  const projects = [...orderIds]
    .map((orderId) => {
      const unit = unitByOrder.get(orderId);
      const focusCell = cellsByOrder.get(orderId) ?? null;
      const monthAmounts = Array.from<string | null>({ length: monthCount }).fill(null);
      if (focusIndex >= 0 && focusCell) {
        const amount = parseMoney(focusCell.releaseThisMonth);
        monthAmounts[focusIndex] = amount > 0 ? formatMoney(amount) : null;
      }

      return {
        orderId,
        projectId: unit?.projectId ?? orderId,
        projectCode: unit?.projectCode ?? '',
        label: unit?.label ?? orderId,
        deliveryOpen: unit?.deliveryOpen ?? false,
        totalPlannedBonus: unit?.totalPlannedBonus ?? '0.00',
        totalReleasedBonus: unit?.totalReleasedBonus ?? '0.00',
        totalPaidBonus: unit?.totalPaidBonus ?? '0.00',
        totalRemainingBonus: unit?.totalRemainingBonus ?? '0.00',
        availableFunding: unit?.availableFunding ?? '0.00',
        monthAmounts,
        focusCell,
      };
    })
    .sort(compareEmployeeBonusHistoryProjects);

  const months = meta.months.map((m) => ({
    ...m,
    monthBonusTotal: m.isFocusMonth ? focusMonthBonusTotal(cells) : '0.00',
  }));

  return {
    payrollRunId: meta.payrollRunId,
    payrollMonth: meta.payrollMonth,
    runStatus: meta.runStatus,
    editable: meta.editable,
    payrollMonthFrom: meta.payrollMonthFrom,
    payrollMonthTo: meta.payrollMonthTo,
    months,
    employees: meta.employees,
    selectedEmployeeId: employeeId,
    projects,
  };
}

export function mergeEmployeeBonusHistorySlice(
  base: PayrollEmployeeBonusHistory,
  slice: PayrollEmployeeBonusHistorySlice,
  matrix: PayrollAllocationMatrix,
): PayrollEmployeeBonusHistory {
  const cellsByOrder = new Map(
    matrix.cells.filter((c) => c.employeeId === slice.employeeId).map((c) => [c.orderId, c]),
  );

  const totalsByMonth = new Map(slice.months.map((m) => [m.payrollMonth, m.monthBonusTotal]));
  const sliceByOrder = new Map(slice.projects.map((p) => [p.orderId, p]));
  const focusIndex = base.months.findIndex((m) => m.isFocusMonth);

  const mergedProjects = slice.projects.map((sp) => {
    const baseProject = base.projects.find((p) => p.orderId === sp.orderId);
    const monthAmounts = sp.monthAmounts.slice();
    if (base.editable && focusIndex >= 0 && baseProject?.monthAmounts[focusIndex] != null) {
      monthAmounts[focusIndex] = baseProject.monthAmounts[focusIndex];
    }
    return {
      ...sp,
      monthAmounts,
      focusCell: cellsByOrder.get(sp.orderId) ?? null,
    };
  });

  for (const project of base.projects) {
    if (!sliceByOrder.has(project.orderId)) {
      mergedProjects.push({
        ...project,
        focusCell: cellsByOrder.get(project.orderId) ?? project.focusCell,
      });
    }
  }

  mergedProjects.sort(compareEmployeeBonusHistoryProjects);

  return {
    ...base,
    selectedEmployeeId: slice.employeeId,
    months: base.months.map((m) => ({
      ...m,
      monthBonusTotal:
        m.isFocusMonth && base.editable
          ? m.monthBonusTotal
          : (totalsByMonth.get(m.payrollMonth) ?? m.monthBonusTotal),
    })),
    projects: mergedProjects,
  };
}
