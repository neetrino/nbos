import type { FilterConfig } from '@/components/shared/FilterBar';
import {
  buildExpensePlanStatusFilterConfig,
  type ExpensePlanStatusFilterLabels,
} from '@/features/finance/constants/expense-plan-status';
import { EXPENSE_CATEGORIES } from '@/features/finance/constants/finance';

const PLAN_CATEGORY_OPTIONS = EXPENSE_CATEGORIES;

export interface ExpensePlanIntegratedFilterLabels extends ExpensePlanStatusFilterLabels {
  category: string;
  project: string;
  categoryLabel: (value: string, fallback: string) => string;
}

export function buildExpensePlanIntegratedFilterConfigs(
  projects: Array<{ id: string; code: string; name: string }>,
  labels?: ExpensePlanIntegratedFilterLabels,
): FilterConfig[] {
  const configs: FilterConfig[] = [
    buildExpensePlanStatusFilterConfig(labels),
    {
      key: 'category',
      label: labels?.category ?? 'Category',
      options: PLAN_CATEGORY_OPTIONS.map((c) => ({
        value: c.value,
        label: labels?.categoryLabel(c.value, c.label) ?? c.label,
      })),
    },
  ];

  if (projects.length > 0) {
    configs.push({
      key: 'project',
      label: labels?.project ?? 'Project',
      options: projects.map((p) => ({
        value: p.id,
        label: p.name,
      })),
    });
  }

  return configs;
}
