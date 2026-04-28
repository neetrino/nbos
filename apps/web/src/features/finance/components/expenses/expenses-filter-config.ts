import { EXPENSE_CATEGORIES, EXPENSE_STAGES } from '@/features/finance/constants/finance';

export type ExpenseFilterBarConfig = {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
};

export function buildExpenseFilterConfigs(
  projectFilterOptions: Array<{ value: string; label: string }>,
): ExpenseFilterBarConfig[] {
  const configs: ExpenseFilterBarConfig[] = [
    {
      key: 'category',
      label: 'Category',
      options: EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
    },
    {
      key: 'status',
      label: 'Status',
      options: EXPENSE_STAGES.map((s) => ({ value: s.value, label: s.label })),
    },
  ];
  if (projectFilterOptions.length > 0) {
    configs.push({
      key: 'project',
      label: 'Project',
      options: projectFilterOptions,
    });
  }
  return configs;
}
