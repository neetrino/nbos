import type { FilterConfig } from '@/components/shared/FilterBar';
import { buildExpensePlanStatusFilterConfig } from '@/features/finance/constants/expense-plan-status';
import { EXPENSE_CATEGORIES } from '@/features/finance/constants/finance';

const PLAN_CATEGORY_OPTIONS = EXPENSE_CATEGORIES;

export function buildExpensePlanIntegratedFilterConfigs(
  projects: Array<{ id: string; code: string; name: string }>,
): FilterConfig[] {
  const configs: FilterConfig[] = [
    buildExpensePlanStatusFilterConfig(),
    {
      key: 'category',
      label: 'Category',
      options: PLAN_CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: c.label })),
    },
  ];

  if (projects.length > 0) {
    configs.push({
      key: 'project',
      label: 'Project',
      options: projects.map((p) => ({
        value: p.id,
        label: p.name,
      })),
    });
  }

  return configs;
}
