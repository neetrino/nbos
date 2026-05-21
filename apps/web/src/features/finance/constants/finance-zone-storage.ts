const STORAGE_KEY = 'nbos:finance:zone-last-href';

export type FinanceSidebarZoneId = 'overview' | 'revenue' | 'expenses' | 'payroll';

export const FINANCE_ZONE_DEFAULT_HREF: Record<FinanceSidebarZoneId, string> = {
  overview: '/finance/dashboard',
  revenue: '/finance/orders',
  expenses: '/finance/expenses',
  payroll: '/finance/payroll',
};

type FinanceZoneStorageState = {
  lastZone?: FinanceSidebarZoneId;
  zones: Partial<Record<FinanceSidebarZoneId, string>>;
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

function isFinanceSidebarZoneId(value: string): value is FinanceSidebarZoneId {
  return value === 'overview' || value === 'revenue' || value === 'expenses' || value === 'payroll';
}

function readStoredState(): FinanceZoneStorageState {
  if (typeof window === 'undefined') {
    return { zones: {} };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { zones: {} };
    const parsed: unknown = JSON.parse(raw);
    if (parsed == null || typeof parsed !== 'object') return { zones: {} };

    const record = parsed as Record<string, unknown>;
    if (record.zones != null && typeof record.zones === 'object') {
      const zones = record.zones as Partial<Record<FinanceSidebarZoneId, string>>;
      const lastZone = record.lastZone;
      return {
        zones,
        lastZone:
          typeof lastZone === 'string' && isFinanceSidebarZoneId(lastZone) ? lastZone : undefined,
      };
    }

    const legacyZones: Partial<Record<FinanceSidebarZoneId, string>> = {};
    for (const key of Object.keys(record)) {
      if (isFinanceSidebarZoneId(key) && typeof record[key] === 'string') {
        legacyZones[key] = record[key];
      }
    }
    return { zones: legacyZones };
  } catch {
    return { zones: {} };
  }
}

function writeStoredState(state: FinanceZoneStorageState): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Last active Finance zone (for parent sidebar entry). */
export function readFinanceLastActiveZone(): FinanceSidebarZoneId {
  const state = readStoredState();
  if (state.lastZone) {
    return state.lastZone;
  }
  const withPath = (['payroll', 'expenses', 'revenue', 'overview'] as const).find(
    (z) => state.zones[z],
  );
  return withPath ?? 'overview';
}

/** Top-level Finance sidebar target: last zone + last page in that zone. */
export function readFinanceModuleEntryHref(): string {
  return readFinanceZoneHref(readFinanceLastActiveZone());
}

/** Zone link target (last visited path in zone or default). */
export function readFinanceZoneHref(zone: FinanceSidebarZoneId): string {
  const path = readStoredState().zones[zone];
  if (path && isHrefAllowedInZone(path, zone)) {
    return path;
  }
  return FINANCE_ZONE_DEFAULT_HREF[zone];
}

/** Remember pathname per zone and which zone was visited last. */
export function writeFinanceZoneLastHref(pathname: string): void {
  const zone = resolveFinanceZoneFromPathname(pathname);
  if (!zone) {
    return;
  }
  const state = readStoredState();
  state.zones[zone] = pathname.split('?')[0] ?? pathname;
  state.lastZone = zone;
  writeStoredState(state);
}
