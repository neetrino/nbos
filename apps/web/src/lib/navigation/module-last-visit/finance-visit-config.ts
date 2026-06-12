import type { SectionModuleVisitConfig } from './types';

export type FinanceSectionId = 'overview' | 'revenue' | 'expenses' | 'payroll';

export const FINANCE_SECTION_DEFAULTS: Record<FinanceSectionId, string> = {
  overview: '/finance/dashboard',
  revenue: '/finance/orders',
  expenses: '/finance/expenses',
  payroll: '/finance/payroll',
};

const EXPENSES_PREFIX = '/finance/expenses';
const PAYROLL_RUN_DETAIL_PATTERN = /^\/finance\/payroll\/[^/]+$/;

function isOverviewPath(pathname: string): boolean {
  return (
    pathname.startsWith('/finance/dashboard') ||
    pathname.startsWith('/finance/unit-economics') ||
    pathname.startsWith('/finance/reports') ||
    pathname.startsWith('/finance/journal')
  );
}

function isRevenuePath(pathname: string): boolean {
  return (
    pathname.startsWith('/finance/orders') ||
    pathname.startsWith('/finance/invoices') ||
    pathname.startsWith('/finance/payments') ||
    pathname.startsWith('/finance/subscriptions')
  );
}

function isExpensesPath(pathname: string): boolean {
  return pathname.startsWith(EXPENSES_PREFIX) || pathname.startsWith('/finance/client-services');
}

function isPayrollPath(pathname: string): boolean {
  return (
    pathname.startsWith('/finance/payroll') ||
    pathname.startsWith('/finance/salary') ||
    pathname.startsWith('/finance/bonuses') ||
    pathname.startsWith('/bonus')
  );
}

export function resolveFinanceSectionId(pathname: string): FinanceSectionId | null {
  if (isOverviewPath(pathname)) return 'overview';
  if (isRevenuePath(pathname)) return 'revenue';
  if (isExpensesPath(pathname)) return 'expenses';
  if (isPayrollPath(pathname)) return 'payroll';
  return null;
}

export function isFinanceSectionPath(pathname: string, sectionId: FinanceSectionId): boolean {
  switch (sectionId) {
    case 'overview':
      return isOverviewPath(pathname);
    case 'revenue':
      return isRevenuePath(pathname);
    case 'expenses':
      return isExpensesPath(pathname);
    case 'payroll':
      return isPayrollPath(pathname);
    default: {
      const _exhaustive: never = sectionId;
      return _exhaustive;
    }
  }
}

export const FINANCE_MODULE_VISIT_CONFIG: SectionModuleVisitConfig = {
  kind: 'sections',
  defaultSection: 'overview',
  sectionDefaults: FINANCE_SECTION_DEFAULTS,
  resolveSection: resolveFinanceSectionId,
  isPathInSection: (pathname, sectionId) =>
    isFinanceSectionPath(pathname, sectionId as FinanceSectionId),
  resolveStoredPath: (pathname, sectionId) => {
    if (sectionId === 'payroll' && PAYROLL_RUN_DETAIL_PATTERN.test(pathname)) {
      return FINANCE_SECTION_DEFAULTS.payroll;
    }
    return pathname;
  },
};

export function isFinanceModulePath(pathname: string): boolean {
  return resolveFinanceSectionId(pathname) !== null;
}
