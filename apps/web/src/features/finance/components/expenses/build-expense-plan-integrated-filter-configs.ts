import type { FilterConfig } from '@/components/shared/FilterBar';
import { EXPENSE_CATEGORIES } from '@/features/finance/constants/finance';

const PLAN_CATEGORY_OPTIONS = EXPENSE_CATEGORIES.filter((c) => c.value !== 'OFFICE');

export function buildExpensePlanIntegratedFilterConfigs(
  projects: Array<{ id: string; code: string; name: string }>,
): FilterConfig[] {
  const configs: FilterConfig[] = [
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
        label: `${p.code} — ${p.name}`,
      })),
    });
  }

  return configs;
}
