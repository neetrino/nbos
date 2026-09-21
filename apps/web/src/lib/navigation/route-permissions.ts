import {
  DELIVERY_COMPENSATION_RULES_MODULE,
  FINANCE_CLIENT_SERVICES_MODULE,
  FINANCE_EXPENSE_PLANS_MODULE,
  FUNCTION_CATALOG_MODULE,
  SETTINGS_MODULE,
  SETTINGS_RBAC_MODULE,
  SETTINGS_SCHEDULER_MODULE,
} from '@nbos/shared/constants';
import {
  FINANCE_INVOICES_VIEW_REQUIREMENT,
  FINANCE_MODULE_VIEW_REQUIREMENT,
} from './finance-nav-permissions';
import type { PermissionRequirement } from './permission-requirement';

export interface RoutePermissionEntry {
  href: string;
  permission: PermissionRequirement;
}

const FINANCE_INVOICES_VIEW_ROUTES = [
  '/finance/dashboard',
  '/finance/unit-economics',
  '/finance/reports',
  '/finance/journal',
  '/finance/orders',
  '/finance/invoices',
  '/finance/payroll',
  '/finance/salary',
  '/finance/bonuses',
  '/finance/bonus-pools',
] as const;

/**
 * Routes that must be permission-checked even when they are not sidebar links.
 *
 * The sidebar only hides links; this registry closes the URL. Every Settings / Admin
 * route is listed here so a direct address cannot reach an admin screen. Finance URLs
 * are listed so the `/finance` parent gate (VIEW on any reachable Finance module) cannot
 * open Invoices, Payments, Expenses, Expense Plans or Client Services that the API
 * protects with their own keys. Longest matching path wins, so
 * `/finance/expenses/plans` (`FINANCE_EXPENSE_PLANS`) beats `/finance/expenses`, and
 * `/finance/expenses/[id]`, `/closed`, `/pay`, `/backlog` stay on `FINANCE_EXPENSES`.
 *
 * Every route is checked against its own module, so a delegated section opens on its
 * own right: `/finance/client-services` needs `FINANCE_CLIENT_SERVICES VIEW`,
 * `/settings/audit-log` needs `AUDIT_LOGS VIEW`, and the RBAC screens need
 * `SETTINGS_RBAC VIEW`. `SETTINGS.VIEW` gates the hub plus every section without a dedicated
 * module. Unlisted `/settings` and `/finance` subpaths inherit their parent through
 * prefix matching, so a new page fails closed rather than open.
 */
export const EXPLICIT_ROUTE_PERMISSIONS: RoutePermissionEntry[] = [
  { href: '/settings', permission: { module: SETTINGS_MODULE, action: 'VIEW' } },
  { href: '/settings/appearance', permission: { module: SETTINGS_MODULE, action: 'EDIT' } },
  { href: '/settings/lists', permission: { module: SETTINGS_MODULE, action: 'VIEW' } },
  { href: '/settings/module-settings', permission: { module: SETTINGS_MODULE, action: 'VIEW' } },
  { href: '/settings/integrations', permission: { module: SETTINGS_MODULE, action: 'EDIT' } },
  { href: '/settings/security', permission: { module: SETTINGS_MODULE, action: 'EDIT' } },
  { href: '/settings/feature-flags', permission: { module: SETTINGS_MODULE, action: 'EDIT' } },
  { href: '/settings/trash-inventory', permission: { module: SETTINGS_MODULE, action: 'VIEW' } },
  { href: '/settings/roles', permission: { module: SETTINGS_RBAC_MODULE, action: 'VIEW' } },
  {
    href: '/settings/access-policies',
    permission: { module: SETTINGS_RBAC_MODULE, action: 'VIEW' },
  },
  {
    href: '/settings/scheduler',
    permission: { module: SETTINGS_SCHEDULER_MODULE, action: 'VIEW' },
  },
  { href: '/settings/audit-log', permission: { module: 'AUDIT_LOGS', action: 'VIEW' } },
  { href: '/finance', permission: FINANCE_MODULE_VIEW_REQUIREMENT },
  ...FINANCE_INVOICES_VIEW_ROUTES.map((href) => ({
    href,
    permission: FINANCE_INVOICES_VIEW_REQUIREMENT,
  })),
  { href: '/finance/payments', permission: { module: 'FINANCE_PAYMENTS', action: 'VIEW' } },
  {
    href: '/finance/subscriptions',
    permission: { module: 'FINANCE_SUBSCRIPTIONS', action: 'VIEW' },
  },
  { href: '/finance/expenses', permission: { module: 'FINANCE_EXPENSES', action: 'VIEW' } },
  {
    href: '/finance/expenses/plans',
    permission: { module: FINANCE_EXPENSE_PLANS_MODULE, action: 'VIEW' },
  },
  {
    href: '/finance/client-services',
    permission: { module: FINANCE_CLIENT_SERVICES_MODULE, action: 'VIEW' },
  },
  {
    href: '/my-company/function-catalog',
    permission: { module: FUNCTION_CATALOG_MODULE, action: 'VIEW' },
  },
  {
    href: '/my-company/delivery-norms',
    permission: { module: DELIVERY_COMPENSATION_RULES_MODULE, action: 'VIEW' },
  },
];
