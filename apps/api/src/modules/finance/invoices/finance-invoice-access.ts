import type { CurrentUserPayload } from '../../../common/decorators';

/** Caller identity + RBAC scope for invoice list/stats row filter. */
export interface FinanceInvoiceAccessContext {
  employeeId: string;
  departmentIds: string[];
  /** RBAC `FINANCE_INVOICES_VIEW` scope; ALL bypasses project participation filter. */
  viewScope?: string;
}

export function financeInvoicesBypassRowFilter(scope: string | undefined): boolean {
  return scope?.trim().toUpperCase() === 'ALL';
}

export function financeInvoiceAccessFromUser(
  user: CurrentUserPayload,
): FinanceInvoiceAccessContext {
  return {
    employeeId: user.id,
    departmentIds: user.departmentIds ?? [],
    viewScope: user.permissions.FINANCE_INVOICES_VIEW,
  };
}
