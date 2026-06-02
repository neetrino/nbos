import type { CurrentUserPayload } from '../../../common/decorators';
import {
  financeScopedAccessFromUser,
  financeScopedBypassRowFilter,
  type FinanceScopedAccessContext,
} from '../finance-scoped-access';

/** Caller identity + RBAC scope for invoice list/stats row filter. */
export type FinanceInvoiceAccessContext = FinanceScopedAccessContext;

export const financeInvoicesBypassRowFilter = financeScopedBypassRowFilter;

export function financeInvoiceAccessFromUser(
  user: CurrentUserPayload,
): FinanceInvoiceAccessContext {
  return financeScopedAccessFromUser(user, 'FINANCE_INVOICES_VIEW');
}
