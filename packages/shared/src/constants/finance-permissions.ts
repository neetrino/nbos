/**
 * Independent Finance RBAC modules: expense planning and the client services registry.
 *
 * These were previously gated by `FINANCE_EXPENSES` and `FINANCE_INVOICES`. Splitting
 * them lets an administrator configure each surface in Settings → Roles without a
 * parallel authorization system. Actions remain VIEW / EDIT / ADD / DELETE; scopes
 * remain NONE / OWN / DEPARTMENT / ALL.
 *
 * Canon: `docs/NBOS/02-Modules/16-Settings-Admin/02-Permissions-RBAC.md`.
 */

/** Expense planning (`/finance/expenses/plans`), independent of the expenses journal. */
export const FINANCE_EXPENSE_PLANS_MODULE = 'FINANCE_EXPENSE_PLANS' as const;

/** Client services registry (`/finance/client-services`), independent of invoices. */
export const FINANCE_CLIENT_SERVICES_MODULE = 'FINANCE_CLIENT_SERVICES' as const;

/** Runtime permission key = module_action. */
export const FINANCE_EXPENSE_PLANS_VIEW = `${FINANCE_EXPENSE_PLANS_MODULE}_VIEW` as const;
export const FINANCE_EXPENSE_PLANS_EDIT = `${FINANCE_EXPENSE_PLANS_MODULE}_EDIT` as const;
export const FINANCE_EXPENSE_PLANS_ADD = `${FINANCE_EXPENSE_PLANS_MODULE}_ADD` as const;
export const FINANCE_EXPENSE_PLANS_DELETE = `${FINANCE_EXPENSE_PLANS_MODULE}_DELETE` as const;

export const FINANCE_CLIENT_SERVICES_VIEW = `${FINANCE_CLIENT_SERVICES_MODULE}_VIEW` as const;
export const FINANCE_CLIENT_SERVICES_EDIT = `${FINANCE_CLIENT_SERVICES_MODULE}_EDIT` as const;
export const FINANCE_CLIENT_SERVICES_ADD = `${FINANCE_CLIENT_SERVICES_MODULE}_ADD` as const;
export const FINANCE_CLIENT_SERVICES_DELETE = `${FINANCE_CLIENT_SERVICES_MODULE}_DELETE` as const;

/** Stable `permissions.id` rows; matches seed-rbac `perm-${module}-${action}` ids. */
export const FINANCE_EXPENSE_PLANS_VIEW_PERMISSION_ID = 'perm-finance-expense-plans-view' as const;
export const FINANCE_EXPENSE_PLANS_EDIT_PERMISSION_ID = 'perm-finance-expense-plans-edit' as const;
export const FINANCE_EXPENSE_PLANS_ADD_PERMISSION_ID = 'perm-finance-expense-plans-add' as const;
export const FINANCE_EXPENSE_PLANS_DELETE_PERMISSION_ID =
  'perm-finance-expense-plans-delete' as const;

export const FINANCE_CLIENT_SERVICES_VIEW_PERMISSION_ID =
  'perm-finance-client-services-view' as const;
export const FINANCE_CLIENT_SERVICES_EDIT_PERMISSION_ID =
  'perm-finance-client-services-edit' as const;
export const FINANCE_CLIENT_SERVICES_ADD_PERMISSION_ID =
  'perm-finance-client-services-add' as const;
export const FINANCE_CLIENT_SERVICES_DELETE_PERMISSION_ID =
  'perm-finance-client-services-delete' as const;

/**
 * Roles that receive `FINANCE_EXPENSE_PLANS` by default, mirroring each role's
 * `FINANCE_EXPENSES` level so splitting the key does not change effective access.
 * Every other role stays NONE until granted in Settings → Roles.
 */
export const FINANCE_EXPENSE_PLANS_DEFAULT_ROLE_IDS = [
  'role-owner',
  'role-ceo',
  'role-finance-director',
  'role-accountant',
  'role-tech-specialist',
  'role-operations-manager',
] as const;

export const FINANCE_EXPENSE_PLANS_DEFAULT_ROLE_SLUGS = [
  'owner',
  'ceo',
  'finance-director',
  'accountant',
  'tech-specialist',
  'operations-manager',
] as const;

/**
 * Roles that receive `FINANCE_CLIENT_SERVICES` by default: Owner, CEO and Finance Director
 * (full ALL). Head of Sales and every other role stay NONE until granted in Settings → Roles.
 * This is a deliberate narrowing — do not copy `FINANCE_INVOICES`.
 */
export const FINANCE_CLIENT_SERVICES_DEFAULT_ROLE_IDS = [
  'role-owner',
  'role-ceo',
  'role-finance-director',
] as const;

export const FINANCE_CLIENT_SERVICES_DEFAULT_ROLE_SLUGS = [
  'owner',
  'ceo',
  'finance-director',
] as const;
