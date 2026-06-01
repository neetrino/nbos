import type { PermissionRequirement } from '@/lib/navigation/nav-config';
import type { FinanceSectionId } from '@/lib/navigation/module-last-visit';

export type FinanceSidebarZoneId = FinanceSectionId;

export type FinanceHeaderZoneDefinition = {
  zone: FinanceSectionId;
  label: string;
  permission?: PermissionRequirement;
};

export const FINANCE_HEADER_ZONES: FinanceHeaderZoneDefinition[] = [
  {
    zone: 'revenue',
    label: 'Revenue',
    permission: { module: 'FINANCE_INVOICES', action: 'VIEW' },
  },
  {
    zone: 'expenses',
    label: 'Expenses',
    permission: { module: 'FINANCE_EXPENSES', action: 'VIEW' },
  },
  {
    zone: 'payroll',
    label: 'Payroll & bonus',
    permission: { module: 'FINANCE_INVOICES', action: 'VIEW' },
  },
  {
    zone: 'overview',
    label: 'Overview',
    permission: { module: 'FINANCE_INVOICES', action: 'VIEW' },
  },
];
