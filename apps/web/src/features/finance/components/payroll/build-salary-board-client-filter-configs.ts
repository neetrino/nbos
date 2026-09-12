import type { FilterConfig } from '@/components/shared/FilterBar';
import { SALARY_BOARD_KANBAN_PHASE_ORDER } from '@/features/finance/constants/compensation-payout-phase-ui';
import type { CompensationPayoutPhase, SalaryLineStatus } from '@/lib/api/payroll-runs';
import { PAYOUT_PHASE_MESSAGE_KEY, SALARY_LINE_STATUS_MESSAGE_KEY } from './payroll-i18n-keys';
import { SALARY_LINE_STATUS_FILTER_OPTIONS } from './salary-board-entries';

export const SALARY_BOARD_EMPLOYEE_FILTER_KEY = 'employee' as const;
export const SALARY_BOARD_DEPARTMENT_FILTER_KEY = 'department' as const;
export const SALARY_BOARD_LINE_STATUS_FILTER_KEY = 'lineStatus' as const;
export const SALARY_BOARD_PAYOUT_PHASE_FILTER_KEY = 'payoutPhase' as const;

export type SalaryBoardFilterLabelKey =
  | 'salaryFilters.department'
  | 'salaryFilters.employee'
  | 'salaryFilters.lineStatus'
  | 'salaryFilters.payoutPhase'
  | 'salaryFilters.allDepartments'
  | 'salaryFilters.allEmployees'
  | 'salaryFilters.allLineStatuses'
  | 'salaryFilters.allPhases'
  | (typeof SALARY_LINE_STATUS_MESSAGE_KEY)[SalaryLineStatus]
  | (typeof PAYOUT_PHASE_MESSAGE_KEY)[CompensationPayoutPhase];

export type SalaryBoardFilterTranslator = (key: SalaryBoardFilterLabelKey) => string;

export function buildSalaryBoardClientFilterConfigs(
  employees: Array<{ id: string; label: string }>,
  departments: Array<{ id: string; label: string }>,
  t: SalaryBoardFilterTranslator,
): FilterConfig[] {
  const payoutOptions = SALARY_BOARD_KANBAN_PHASE_ORDER.map((phase) => ({
    value: phase,
    label: t(PAYOUT_PHASE_MESSAGE_KEY[phase]),
  }));

  return [
    {
      key: SALARY_BOARD_DEPARTMENT_FILTER_KEY,
      label: t('salaryFilters.department'),
      allOptionLabel: t('salaryFilters.allDepartments'),
      options: departments.map((d) => ({ value: d.id, label: d.label })),
    },
    {
      key: SALARY_BOARD_EMPLOYEE_FILTER_KEY,
      label: t('salaryFilters.employee'),
      allOptionLabel: t('salaryFilters.allEmployees'),
      options: employees.map((e) => ({ value: e.id, label: e.label })),
    },
    {
      key: SALARY_BOARD_LINE_STATUS_FILTER_KEY,
      label: t('salaryFilters.lineStatus'),
      allOptionLabel: t('salaryFilters.allLineStatuses'),
      options: SALARY_LINE_STATUS_FILTER_OPTIONS.filter(
        (
          o,
        ): o is (typeof SALARY_LINE_STATUS_FILTER_OPTIONS)[number] & {
          value: SalaryLineStatus;
        } => o.value !== 'all',
      ).map((o) => ({
        value: o.value,
        label: t(SALARY_LINE_STATUS_MESSAGE_KEY[o.value]),
      })),
    },
    {
      key: SALARY_BOARD_PAYOUT_PHASE_FILTER_KEY,
      label: t('salaryFilters.payoutPhase'),
      allOptionLabel: t('salaryFilters.allPhases'),
      options: payoutOptions,
    },
  ];
}
