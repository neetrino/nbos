import type { InvoiceSourceFamily } from './invoice-source-label';

export type InvoiceSourceCardChrome = {
  cardShellClassName: string;
  headerBandClassName: string;
  accentBarClassName: string;
  sourceLabelClassName: string;
};

const DEAL_CHROME: InvoiceSourceCardChrome = {
  cardShellClassName:
    'overflow-hidden border-violet-300 bg-violet-100 dark:border-violet-700 dark:bg-violet-900',
  headerBandClassName: 'bg-violet-200 dark:bg-violet-800',
  accentBarClassName: 'bg-violet-600 dark:bg-violet-400',
  sourceLabelClassName: 'text-violet-800 dark:text-violet-200',
};

const SUBSCRIPTION_CHROME: InvoiceSourceCardChrome = {
  cardShellClassName:
    'overflow-hidden border-sky-300 bg-sky-100 dark:border-sky-700 dark:bg-sky-900',
  headerBandClassName: 'bg-sky-200 dark:bg-sky-800',
  accentBarClassName: 'bg-sky-600 dark:bg-sky-400',
  sourceLabelClassName: 'text-sky-800 dark:text-sky-200',
};

const CLIENT_SERVICE_CHROME: InvoiceSourceCardChrome = {
  cardShellClassName:
    'overflow-hidden border-amber-300 bg-amber-100 dark:border-amber-700 dark:bg-amber-900',
  headerBandClassName: 'bg-amber-200 dark:bg-amber-800',
  accentBarClassName: 'bg-amber-600 dark:bg-amber-400',
  sourceLabelClassName: 'text-amber-900 dark:text-amber-200',
};

const OTHER_CHROME: InvoiceSourceCardChrome = {
  cardShellClassName:
    'overflow-hidden border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800',
  headerBandClassName: 'bg-slate-200 dark:bg-slate-700',
  accentBarClassName: 'bg-slate-500 dark:bg-slate-300',
  sourceLabelClassName: 'text-slate-700 dark:text-slate-200',
};

const CHROME_BY_FAMILY: Record<InvoiceSourceFamily, InvoiceSourceCardChrome> = {
  deal: DEAL_CHROME,
  subscription: SUBSCRIPTION_CHROME,
  client_service: CLIENT_SERVICE_CHROME,
  order: OTHER_CHROME,
  manual: OTHER_CHROME,
};

/** Opaque board tint by invoice origin — no translucent washes. */
export function getInvoiceSourceCardChrome(family: InvoiceSourceFamily): InvoiceSourceCardChrome {
  return CHROME_BY_FAMILY[family];
}
