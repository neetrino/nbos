import {
  FINANCE_CLIENT_SERVICES_MODULE,
  FINANCE_EXPENSE_PLANS_MODULE,
} from '@nbos/shared/constants';
import type { PermissionClause, PermissionRequirement } from './permission-requirement';

const VIEW_ACTION = 'VIEW';

export const FINANCE_INVOICES_VIEW_REQUIREMENT: PermissionClause = {
  module: 'FINANCE_INVOICES',
  action: VIEW_ACTION,
};

/**
 * VIEW on any Finance module that currently has a reachable page. Used for the
 * `/finance` sidebar row and the module index so a delegated section can open
 * without `FINANCE_INVOICES`.
 */
export const FINANCE_MODULE_VIEW_REQUIREMENT: PermissionRequirement = {
  anyOf: [
    FINANCE_INVOICES_VIEW_REQUIREMENT,
    { module: 'FINANCE_PAYMENTS', action: VIEW_ACTION },
    { module: 'FINANCE_SUBSCRIPTIONS', action: VIEW_ACTION },
    { module: 'FINANCE_EXPENSES', action: VIEW_ACTION },
    { module: FINANCE_EXPENSE_PLANS_MODULE, action: VIEW_ACTION },
    { module: FINANCE_CLIENT_SERVICES_MODULE, action: VIEW_ACTION },
  ],
};

/** Expenses header zone: Pay Now, Expenses Plan, or Client services. */
export const FINANCE_EXPENSES_ZONE_VIEW_REQUIREMENT: PermissionRequirement = {
  anyOf: [
    { module: 'FINANCE_EXPENSES', action: VIEW_ACTION },
    { module: FINANCE_EXPENSE_PLANS_MODULE, action: VIEW_ACTION },
    { module: FINANCE_CLIENT_SERVICES_MODULE, action: VIEW_ACTION },
  ],
};
