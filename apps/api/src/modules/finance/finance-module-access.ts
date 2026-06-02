import type { CurrentUserPayload } from '../../common/decorators';
import {
  financeScopedAccessFromUser,
  type FinanceScopedAccessContext,
} from './finance-scoped-access';

export function financePaymentAccessFromUser(user: CurrentUserPayload): FinanceScopedAccessContext {
  return financeScopedAccessFromUser(user, 'FINANCE_PAYMENTS_VIEW');
}

export function financeSubscriptionAccessFromUser(
  user: CurrentUserPayload,
): FinanceScopedAccessContext {
  return financeScopedAccessFromUser(user, 'FINANCE_SUBSCRIPTIONS_VIEW');
}

export function financeExpenseAccessFromUser(user: CurrentUserPayload): FinanceScopedAccessContext {
  return financeScopedAccessFromUser(user, 'FINANCE_EXPENSES_VIEW');
}
