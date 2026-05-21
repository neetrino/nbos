import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  FINANCE_ZONE_DEFAULT_HREF,
  readFinanceLastActiveZone,
  readFinanceModuleEntryHref,
  readFinanceZoneHref,
  resolveFinanceZoneFromPathname,
  writeFinanceZoneLastHref,
} from './finance-zone-storage';

describe('finance-zone-storage', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves zones from pathname', () => {
    expect(resolveFinanceZoneFromPathname('/finance/invoices')).toBe('revenue');
    expect(resolveFinanceZoneFromPathname('/finance/client-services')).toBe('expenses');
    expect(resolveFinanceZoneFromPathname('/finance/journal')).toBe('overview');
    expect(resolveFinanceZoneFromPathname('/bonus')).toBe('payroll');
  });

  it('returns default href when nothing stored', () => {
    expect(readFinanceZoneHref('revenue')).toBe(FINANCE_ZONE_DEFAULT_HREF.revenue);
    expect(readFinanceModuleEntryHref()).toBe(FINANCE_ZONE_DEFAULT_HREF.overview);
  });

  it('remembers last href per zone and last active zone', () => {
    writeFinanceZoneLastHref('/finance/invoices');
    expect(readFinanceZoneHref('revenue')).toBe('/finance/invoices');
    expect(readFinanceLastActiveZone()).toBe('revenue');
    expect(readFinanceModuleEntryHref()).toBe('/finance/invoices');

    writeFinanceZoneLastHref('/finance/payments');
    expect(readFinanceZoneHref('revenue')).toBe('/finance/payments');
    expect(readFinanceModuleEntryHref()).toBe('/finance/payments');
    expect(readFinanceZoneHref('expenses')).toBe(FINANCE_ZONE_DEFAULT_HREF.expenses);
  });

  it('reads legacy flat zone map', () => {
    storage.set('nbos:finance:zone-last-href', JSON.stringify({ revenue: '/finance/invoices' }));
    expect(readFinanceZoneHref('revenue')).toBe('/finance/invoices');
    expect(readFinanceModuleEntryHref()).toBe('/finance/invoices');
  });
});
