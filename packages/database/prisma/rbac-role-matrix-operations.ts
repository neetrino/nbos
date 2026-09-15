/**
 * Access matrices for the Support, HR, Operations and Finance-support departments.
 *
 * These four roles close the gap between the eight L1 departments described in
 * `docs/NBOS/02-Modules/07-My-Company/01-Org-Structure.md` and the role catalog, which until
 * now had heads for Sales, Marketing and Delivery only.
 */

import { D, F, L, M, MatrixEntry, N, R, VA } from './rbac-scopes';

/**
 * Head of Support owns maintenance of delivered work, so tickets are full and projects are
 * read-only: Delivery still owns the project itself. Mirrors Head of Delivery elsewhere.
 */
const HEAD_SUPPORT_ROLE_MATRIX: MatrixEntry = {
  CRM_LEADS: N,
  CRM_DEALS: N,
  ORDERS: R,
  FINANCE_INVOICES: N,
  FINANCE_PAYMENTS: N,
  // Maintenance is sold as a subscription, so the head needs to see what is covered.
  FINANCE_SUBSCRIPTIONS: R,
  FINANCE_EXPENSES: N,
  FINANCE_BONUSES: R,
  FINANCE_SALARY: N,
  PROJECTS: R,
  TASKS: F,
  SUPPORT_TICKETS: F,
  // Fixing a client system needs its credentials, but reading every secret does not follow.
  CREDENTIALS: ['OWN', 'ALL', 'ALL', 'NONE'],
  DRIVE: F,
  DOCUMENTS: F,
  MESSENGER: F,
  MAIL: F,
  CALENDAR: F,
  COMPANY: R,
  PARTNERS: N,
  DASHBOARDS: D,
  AUDIT_LOGS: N,
  CLIENTS: VA,
  AI_PLATFORM: N,
};

/**
 * HR runs hiring, onboarding and offboarding, which is why COMPANY is writable. Payroll stays
 * with Finance, so every compensation module is closed — including bonuses.
 */
const HR_MANAGER_ROLE_MATRIX: MatrixEntry = {
  CRM_LEADS: N,
  CRM_DEALS: N,
  ORDERS: N,
  FINANCE_INVOICES: N,
  FINANCE_PAYMENTS: N,
  FINANCE_SUBSCRIPTIONS: N,
  FINANCE_EXPENSES: N,
  FINANCE_BONUSES: N,
  FINANCE_SALARY: N,
  PROJECTS: N,
  TASKS: F,
  SUPPORT_TICKETS: N,
  CREDENTIALS: L,
  DRIVE: D,
  DOCUMENTS: F,
  MESSENGER: F,
  MAIL: F,
  CALENDAR: F,
  // Employees are retired through offboarding, never deleted, so DELETE stays closed.
  COMPANY: M,
  PARTNERS: N,
  DASHBOARDS: D,
  AUDIT_LOGS: N,
  CLIENTS: N,
  AI_PLATFORM: N,
};

/**
 * Operations owns internal process and SOP. Checklist templates are declared explicitly so the
 * role keeps full CRUD on them rather than inheriting only publish/archive from COMPANY.
 * Settings stays closed: platform administration is not an operations concern.
 */
const OPERATIONS_MANAGER_ROLE_MATRIX: MatrixEntry = {
  CRM_LEADS: N,
  CRM_DEALS: N,
  ORDERS: N,
  FINANCE_INVOICES: N,
  FINANCE_PAYMENTS: N,
  // Internal tooling is bought as subscriptions; operations needs to see them, not change them.
  FINANCE_SUBSCRIPTIONS: R,
  FINANCE_EXPENSES: L,
  FINANCE_BONUSES: N,
  FINANCE_SALARY: N,
  PROJECTS: R,
  TASKS: F,
  SUPPORT_TICKETS: N,
  CREDENTIALS: L,
  DRIVE: F,
  DOCUMENTS: F,
  MESSENGER: F,
  MAIL: F,
  CALENDAR: F,
  COMPANY: M,
  CHECKLIST_TEMPLATES: F,
  PARTNERS: N,
  DASHBOARDS: D,
  AUDIT_LOGS: N,
  CLIENTS: N,
  AI_PLATFORM: N,
};

/**
 * Accountant executes what Finance Director decides: invoices, payments and expenses are full,
 * while salary and bonuses stay read-only and budgeting, audit logs and org structure are not
 * theirs. COMPANY is readable because finance screens resolve employees and departments.
 */
const ACCOUNTANT_ROLE_MATRIX: MatrixEntry = {
  CRM_LEADS: N,
  CRM_DEALS: N,
  ORDERS: R,
  FINANCE_INVOICES: F,
  FINANCE_PAYMENTS: F,
  FINANCE_SUBSCRIPTIONS: R,
  FINANCE_EXPENSES: F,
  FINANCE_BONUSES: R,
  FINANCE_SALARY: R,
  PROJECTS: N,
  TASKS: L,
  SUPPORT_TICKETS: N,
  CREDENTIALS: L,
  DRIVE: L,
  DOCUMENTS: R,
  MESSENGER: N,
  MAIL: L,
  CALENDAR: L,
  COMPANY: R,
  PARTNERS: R,
  DASHBOARDS: L,
  AUDIT_LOGS: N,
  CLIENTS: R,
  AI_PLATFORM: N,
};

export const OPERATIONS_ROLE_MATRIX: Record<string, MatrixEntry> = {
  'role-head-support': HEAD_SUPPORT_ROLE_MATRIX,
  'role-hr-manager': HR_MANAGER_ROLE_MATRIX,
  'role-operations-manager': OPERATIONS_MANAGER_ROLE_MATRIX,
  'role-accountant': ACCOUNTANT_ROLE_MATRIX,
};
