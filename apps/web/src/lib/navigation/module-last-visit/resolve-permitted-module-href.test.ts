import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  FINANCE_CLIENT_SERVICES_MODULE,
  FINANCE_EXPENSE_PLANS_MODULE,
} from '@nbos/shared/constants';
import {
  resolvePermittedFinanceSectionHref,
  resolvePermittedModuleEntryHref,
} from './resolve-permitted-module-href';
import { writeModuleLastVisitFromPathname } from './module-last-visit-storage';

describe('resolvePermittedModuleEntryHref', () => {
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

  const canClientServicesOnly = (action: string, module: string) =>
    action === 'VIEW' && module === FINANCE_CLIENT_SERVICES_MODULE;

  it('falls back from a forbidden last Finance page to Client services', () => {
    writeModuleLastVisitFromPathname('/finance/invoices');

    expect(resolvePermittedModuleEntryHref('finance', canClientServicesOnly)).toBe(
      '/finance/client-services',
    );
  });

  it('lands a first visit with only client-services VIEW on Client services', () => {
    expect(resolvePermittedModuleEntryHref('finance', canClientServicesOnly)).toBe(
      '/finance/client-services',
    );
  });

  it('points the expenses zone pill at Client services when the journal is forbidden', () => {
    writeModuleLastVisitFromPathname('/finance/expenses');

    expect(resolvePermittedFinanceSectionHref('expenses', canClientServicesOnly)).toBe(
      '/finance/client-services',
    );
  });

  it('lands a first visit with only expense-plans VIEW on Expenses Plan', () => {
    const can = (action: string, module: string) =>
      action === 'VIEW' && module === FINANCE_EXPENSE_PLANS_MODULE;

    expect(resolvePermittedModuleEntryHref('finance', can)).toBe('/finance/expenses/plans');
  });

  it('keeps an expenses-only viewer on the journal instead of the new areas', () => {
    writeModuleLastVisitFromPathname('/finance/expenses/plans');
    const can = (action: string, module: string) =>
      action === 'VIEW' && module === 'FINANCE_EXPENSES';

    expect(resolvePermittedModuleEntryHref('finance', can)).toBe('/finance/expenses');
    expect(resolvePermittedFinanceSectionHref('expenses', can)).toBe('/finance/expenses');
  });
});
