import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  readFinanceSectionHref,
  readModuleEntryHref,
  readModuleSectionHref,
  resolveFinanceSectionId,
  writeModuleLastVisitFromPathname,
} from './module-last-visit-storage';

describe('module-last-visit-storage', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves finance sections from pathname', () => {
    expect(resolveFinanceSectionId('/finance/invoices')).toBe('revenue');
    expect(resolveFinanceSectionId('/bonus')).toBe('payroll');
    expect(resolveFinanceSectionId('/finance/bonuses')).toBe('payroll');
  });

  it('remembers finance last visit for parent entry', () => {
    writeModuleLastVisitFromPathname('/finance/invoices');
    expect(readFinanceSectionHref('revenue')).toBe('/finance/invoices');
    expect(readModuleEntryHref('finance')).toBe('/finance/invoices');

    writeModuleLastVisitFromPathname('/finance/payments');
    expect(readModuleEntryHref('finance')).toBe('/finance/payments');
  });

  it('keeps payroll section entry on payroll landing instead of run detail', () => {
    writeModuleLastVisitFromPathname('/finance/payroll/29de90ae-7fc4-4b7c-8d15-bd1e1c2269a1');

    expect(readFinanceSectionHref('payroll')).toBe('/finance/payroll');
    expect(readModuleEntryHref('finance')).toBe('/finance/payroll');
  });

  it('remembers crm last visit', () => {
    writeModuleLastVisitFromPathname('/crm/deals');
    expect(readModuleEntryHref('crm')).toBe('/crm/deals');
    expect(readModuleSectionHref('crm', 'leads')).toBe('/crm/leads');
  });

  it('remembers credentials last visit', () => {
    writeModuleLastVisitFromPathname('/credentials');
    expect(readModuleEntryHref('credentials')).toBe('/credentials');
  });

  it('migrates legacy finance storage key', () => {
    storage.set(
      'nbos:finance:zone-last-href',
      JSON.stringify({ lastZone: 'revenue', zones: { revenue: '/finance/invoices' } }),
    );
    expect(readModuleEntryHref('finance')).toBe('/finance/invoices');
    expect(storage.has('nbos:finance:zone-last-href')).toBe(false);
    expect(storage.has('nbos:module-last-visit')).toBe(true);
  });
});
