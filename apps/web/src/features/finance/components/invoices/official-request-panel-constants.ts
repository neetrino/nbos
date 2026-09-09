export const AWAITING_PAYMENT_MONEY_STATUS = 'AWAITING_PAYMENT';

export const OFFICIAL_AWAITING_SEND_PENDING_TIMEOUT_MS = 60_000;

export function didEnterAwaitingPayment(previous: string, current: string): boolean {
  return previous !== AWAITING_PAYMENT_MONEY_STATUS && current === AWAITING_PAYMENT_MONEY_STATUS;
}
