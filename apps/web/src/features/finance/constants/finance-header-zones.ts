import type { PermissionRequirement } from '@/lib/navigation/nav-config';
import type { FinanceSidebarZoneId } from './finance-zone-storage';

export type FinanceHeaderZoneDefinition = {
  zone: FinanceSidebarZoneId;
  label: string;
  permission?: PermissionRequirement;
};

export const FINANCE_HEADER_ZONES: FinanceHeaderZoneDefinition[] = [
  {
    zone: 'overview',
    label: 'Overview',
    permission: { module: 'FINANCE_INVOICES', action: 'VIEW' },
  },
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
];

/** Routes that show Finance area tabs in the app header. */
export function isFinanceHeaderContextPath(pathname: string): boolean {
  return pathname.startsWith('/finance') || pathname.startsWith('/bonus');
}
