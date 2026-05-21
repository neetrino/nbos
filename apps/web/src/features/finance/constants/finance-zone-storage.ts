const STORAGE_KEY = 'nbos:finance:zone-last-href';

export type FinanceSidebarZoneId = 'overview' | 'revenue' | 'expenses' | 'payroll';

export const FINANCE_ZONE_DEFAULT_HREF: Record<FinanceSidebarZoneId, string> = {
  overview: '/finance/dashboard',
  revenue: '/finance/orders',
  expenses: '/finance/expenses',
  payroll: '/finance/payroll',
};

const FINANCE_EXPENSE_PLANS_PREFIX = '/finance/expenses/plans';
const FINANCE_EXPENSES_PREFIX = '/finance/expenses';

function isOverviewPath(pathname: string): boolean {
  return (
    pathname.startsWith('/finance/dashboard') ||
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
  return (
    pathname.startsWith(FINANCE_EXPENSES_PREFIX) || pathname.startsWith('/finance/client-services')
  );
}

function isPayrollPath(pathname: string): boolean {
  return (
    pathname.startsWith('/finance/payroll') ||
    pathname.startsWith('/finance/salary') ||
    pathname.startsWith('/finance/bonus-pools') ||
    pathname.startsWith('/bonus')
  );
}

/** Maps a Finance (or bonus) route to a sidebar zone, if any. */
export function resolveFinanceZoneFromPathname(pathname: string): FinanceSidebarZoneId | null {
  if (isOverviewPath(pathname)) return 'overview';
  if (isRevenuePath(pathname)) return 'revenue';
  if (isExpensesPath(pathname)) return 'expenses';
  if (isPayrollPath(pathname)) return 'payroll';
  return null;
}

export function isFinanceZonePath(pathname: string, zone: FinanceSidebarZoneId): boolean {
  switch (zone) {
    case 'overview':
      return isOverviewPath(pathname);
    case 'revenue':
      return isRevenuePath(pathname);
    case 'expenses':
      return isExpensesPath(pathname);
    case 'payroll':
      return isPayrollPath(pathname);
    default: {
      const _exhaustive: never = zone;
      return _exhaustive;
    }
  }
}

function isHrefAllowedInZone(href: string, zone: FinanceSidebarZoneId): boolean {
  const path = href.split('?')[0] ?? href;
  return isFinanceZonePath(path, zone);
}

function readStoredZoneHrefs(): Partial<Record<FinanceSidebarZoneId, string>> {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed == null || typeof parsed !== 'object') return {};
    return parsed as Partial<Record<FinanceSidebarZoneId, string>>;
  } catch {
    return {};
  }
}

/** Sidebar link target for a zone (last visited path or zone default). */
export function readFinanceZoneHref(zone: FinanceSidebarZoneId): string {
  const stored = readStoredZoneHrefs()[zone];
  if (stored && isHrefAllowedInZone(stored, zone)) {
    return stored;
  }
  return FINANCE_ZONE_DEFAULT_HREF[zone];
}

export function writeFinanceZoneLastHref(pathname: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  const zone = resolveFinanceZoneFromPathname(pathname);
  if (!zone) {
    return;
  }
  const map = readStoredZoneHrefs();
  map[zone] = pathname.split('?')[0] ?? pathname;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}
