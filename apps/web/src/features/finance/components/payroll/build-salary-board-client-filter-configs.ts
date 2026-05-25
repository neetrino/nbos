import type { FilterConfig } from '@/components/shared/FilterBar';
import { COMPENSATION_PAYOUT_PHASE_UI } from '@/features/finance/constants/compensation-payout-phase-ui';
import type { CompensationPayoutPhase } from '@/lib/api/payroll-runs';
import { SALARY_LINE_STATUS_FILTER_OPTIONS } from './salary-board-entries';

export const SALARY_BOARD_EMPLOYEE_FILTER_KEY = 'employee' as const;
export const SALARY_BOARD_DEPARTMENT_FILTER_KEY = 'department' as const;
export const SALARY_BOARD_LINE_STATUS_FILTER_KEY = 'lineStatus' as const;
export const SALARY_BOARD_PAYOUT_PHASE_FILTER_KEY = 'payoutPhase' as const;

export function buildSalaryBoardClientFilterConfigs(
  employees: Array<{ id: string; label: string }>,
  departments: Array<{ id: string; label: string }>,
): FilterConfig[] {
  const payoutOptions = (
    Object.keys(COMPENSATION_PAYOUT_PHASE_UI) as CompensationPayoutPhase[]
  ).map((phase) => ({
    value: phase,
    label: COMPENSATION_PAYOUT_PHASE_UI[phase].label,
  }));

  return [
    {
      key: SALARY_BOARD_DEPARTMENT_FILTER_KEY,
      label: 'Department',
      options: departments.map((d) => ({ value: d.id, label: d.label })),
    },
    {
      key: SALARY_BOARD_EMPLOYEE_FILTER_KEY,
      label: 'Employee',
      options: employees.map((e) => ({ value: e.id, label: e.label })),
    },
    {
      key: SALARY_BOARD_LINE_STATUS_FILTER_KEY,
      label: 'Line status',
      options: SALARY_LINE_STATUS_FILTER_OPTIONS.filter((o) => o.value !== 'all').map((o) => ({
        value: o.value,
        label: o.label,
      })),
    },
    {
      key: SALARY_BOARD_PAYOUT_PHASE_FILTER_KEY,
      label: 'Payout phase',
      options: payoutOptions,
    },
  ];
}
