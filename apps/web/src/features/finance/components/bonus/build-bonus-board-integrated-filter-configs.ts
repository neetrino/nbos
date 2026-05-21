import type { FilterConfig } from '@/components/shared/FilterBar';
import { BONUS_BOARD_TYPE_CONFIG } from '@/features/finance/constants/bonus-board';
import type { BonusType } from '@/lib/api/bonus';

export const BONUS_FILTER_TYPE_KEY = 'type' as const;
export const BONUS_FILTER_PROJECT_KEY = 'project' as const;
export const BONUS_FILTER_EMPLOYEE_KEY = 'employee' as const;

export function buildBonusBoardIntegratedFilterConfigs(
  projects: Array<{ id: string; label: string }>,
  employees: Array<{ id: string; label: string }>,
): FilterConfig[] {
  return [
    {
      key: BONUS_FILTER_TYPE_KEY,
      label: 'Type',
      options: (Object.keys(BONUS_BOARD_TYPE_CONFIG) as BonusType[]).map((key) => ({
        value: key,
        label: BONUS_BOARD_TYPE_CONFIG[key].label,
      })),
    },
    {
      key: BONUS_FILTER_PROJECT_KEY,
      label: 'Project',
      options: projects.map((p) => ({ value: p.id, label: p.label })),
    },
    {
      key: BONUS_FILTER_EMPLOYEE_KEY,
      label: 'Employee',
      options: employees.map((e) => ({ value: e.id, label: e.label })),
    },
  ];
}
