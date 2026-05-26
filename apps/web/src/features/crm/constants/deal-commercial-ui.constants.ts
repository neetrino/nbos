export type DealWonMode = 'STANDARD' | 'EXCEPTION_FREE' | 'EXCEPTION_POSTPAID';

export type DealExceptionType = 'FREE' | 'POSTPAID';

export type OrderPaymentMode = 'STANDARD_PREPAY' | 'POSTPAID' | 'FREE';

export type OrderDeliveryStartMode = 'AFTER_PAYMENT' | 'EARLY_START' | 'EXCEPTION_IMMEDIATE';

export const ORDER_EARLY_START_BADGE = {
  label: 'Early start · Payment pending',
  className:
    'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
} as const;

export const ORDER_EXCEPTION_BADGES: Record<
  OrderPaymentMode,
  { label: string; className: string } | null
> = {
  STANDARD_PREPAY: null,
  POSTPAID: {
    label: 'Postpaid',
    className:
      'border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  },
  FREE: {
    label: 'Free exception',
    className:
      'border-stone-300 bg-stone-100 text-stone-700 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-300',
  },
};

export const DEAL_WON_MODE_LABELS: Record<DealWonMode, string> = {
  STANDARD: 'Standard',
  EXCEPTION_FREE: 'Exception · Free',
  EXCEPTION_POSTPAID: 'Exception · Postpaid',
};
