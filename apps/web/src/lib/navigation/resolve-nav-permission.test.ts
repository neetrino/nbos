import { describe, expect, it } from 'vitest';
import {
  DELIVERY_COMPENSATION_RULES_MODULE,
  FINANCE_CLIENT_SERVICES_MODULE,
  FINANCE_EXPENSE_PLANS_MODULE,
  FUNCTION_CATALOG_MODULE,
} from '@nbos/shared/constants';
import { FINANCE_MODULE_VIEW_REQUIREMENT } from './finance-nav-permissions';
import { getPermissionClauses } from './permission-requirement';
import { resolveNavPermission } from './resolve-nav-permission';
import { EXPLICIT_ROUTE_PERMISSIONS } from './route-permissions';

describe('resolveNavPermission', () => {
  it('resolves dashboard permission', () => {
    expect(resolveNavPermission('/dashboard')).toEqual({
      module: 'DASHBOARDS',
      action: 'VIEW',
    });
  });

  it('resolves clients nested paths', () => {
    expect(resolveNavPermission('/clients/contacts')).toEqual({
      module: 'CLIENTS',
      action: 'VIEW',
    });
  });

  it('gates the Settings hub itself', () => {
    expect(resolveNavPermission('/settings')).toEqual({
      module: 'SETTINGS',
      action: 'VIEW',
    });
  });

  it('resolves settings child with its own permission', () => {
    expect(resolveNavPermission('/settings/roles')).toEqual({
      module: 'SETTINGS_RBAC',
      action: 'VIEW',
    });
  });

  it('gates settings routes that have no sidebar link', () => {
    expect(resolveNavPermission('/settings/access-policies')).toEqual({
      module: 'SETTINGS_RBAC',
      action: 'VIEW',
    });
    expect(resolveNavPermission('/settings/trash-inventory')).toEqual({
      module: 'SETTINGS',
      action: 'VIEW',
    });
  });

  it('keeps every gated Settings route off the My Company COMPANY key', () => {
    const modules = EXPLICIT_ROUTE_PERMISSIONS.flatMap((route) =>
      getPermissionClauses(route.permission).map((clause) => clause.module),
    );

    expect(modules).not.toContain('COMPANY');
  });

  it('falls back to the Settings gate for unlisted settings subpaths', () => {
    expect(resolveNavPermission('/settings/departments')).toEqual({
      module: 'SETTINGS',
      action: 'VIEW',
    });
    expect(resolveNavPermission('/settings/something-new')).toEqual({
      module: 'SETTINGS',
      action: 'VIEW',
    });
  });

  it('does not treat the marketing settings page as platform admin', () => {
    expect(resolveNavPermission('/marketing/settings')).toEqual({
      module: 'MARKETING',
      action: 'VIEW',
    });
  });

  it('returns undefined for routes without nav permission', () => {
    expect(resolveNavPermission('/my-account')).toBeUndefined();
  });

  it('gates Finance sections by their own module, not only invoices VIEW', () => {
    expect(resolveNavPermission('/finance')).toEqual(FINANCE_MODULE_VIEW_REQUIREMENT);
    expect(resolveNavPermission('/finance/invoices')).toEqual({
      module: 'FINANCE_INVOICES',
      action: 'VIEW',
    });
    expect(resolveNavPermission('/finance/payments')).toEqual({
      module: 'FINANCE_PAYMENTS',
      action: 'VIEW',
    });
    expect(resolveNavPermission('/finance/subscriptions')).toEqual({
      module: 'FINANCE_SUBSCRIPTIONS',
      action: 'VIEW',
    });
    expect(resolveNavPermission('/finance/expenses')).toEqual({
      module: 'FINANCE_EXPENSES',
      action: 'VIEW',
    });
    expect(resolveNavPermission('/finance/expenses/plans')).toEqual({
      module: FINANCE_EXPENSE_PLANS_MODULE,
      action: 'VIEW',
    });
    expect(resolveNavPermission('/finance/client-services')).toEqual({
      module: FINANCE_CLIENT_SERVICES_MODULE,
      action: 'VIEW',
    });
  });

  it('keeps nested expense journal routes on FINANCE_EXPENSES, not plans', () => {
    expect(resolveNavPermission('/finance/expenses/closed')).toEqual({
      module: 'FINANCE_EXPENSES',
      action: 'VIEW',
    });
    expect(resolveNavPermission('/finance/expenses/pay')).toEqual({
      module: 'FINANCE_EXPENSES',
      action: 'VIEW',
    });
    expect(resolveNavPermission('/finance/expenses/backlog')).toEqual({
      module: 'FINANCE_EXPENSES',
      action: 'VIEW',
    });
    expect(resolveNavPermission('/finance/expenses/expense-1')).toEqual({
      module: 'FINANCE_EXPENSES',
      action: 'VIEW',
    });
  });

  it('lets expense-plan detail win over the expenses journal prefix', () => {
    expect(resolveNavPermission('/finance/expenses/plans/plan-1')).toEqual({
      module: FINANCE_EXPENSE_PLANS_MODULE,
      action: 'VIEW',
    });
  });

  it('keeps overview, revenue, and payroll pages on FINANCE_INVOICES', () => {
    expect(resolveNavPermission('/finance/dashboard')).toEqual({
      module: 'FINANCE_INVOICES',
      action: 'VIEW',
    });
    expect(resolveNavPermission('/finance/orders')).toEqual({
      module: 'FINANCE_INVOICES',
      action: 'VIEW',
    });
    expect(resolveNavPermission('/finance/payroll')).toEqual({
      module: 'FINANCE_INVOICES',
      action: 'VIEW',
    });
  });

  it('inherits the Finance anyOf gate for unlisted finance subpaths', () => {
    expect(resolveNavPermission('/finance/something-new')).toEqual(FINANCE_MODULE_VIEW_REQUIREMENT);
  });

  it('gates the function catalog on FUNCTION_CATALOG, not COMPANY or Compensation', () => {
    expect(resolveNavPermission('/my-company/function-catalog')).toEqual({
      module: FUNCTION_CATALOG_MODULE,
      action: 'VIEW',
    });
    expect(resolveNavPermission('/my-company/function-catalog/fn-1')).toEqual({
      module: FUNCTION_CATALOG_MODULE,
      action: 'VIEW',
    });
    expect(resolveNavPermission('/my-company')).toEqual({
      module: 'COMPANY',
      action: 'VIEW',
    });
    expect(resolveNavPermission('/my-company/team')).toEqual({
      module: 'COMPANY',
      action: 'VIEW',
    });
    expect(resolveNavPermission('/my-company/compensation')).toEqual({
      module: 'FINANCE_SALARY',
      action: 'VIEW',
    });
  });

  it('gates delivery norms on DELIVERY_COMPENSATION_RULES, not COMPANY', () => {
    expect(resolveNavPermission('/my-company/delivery-norms')).toEqual({
      module: DELIVERY_COMPENSATION_RULES_MODULE,
      action: 'VIEW',
    });
  });
});
