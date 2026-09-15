import type { InvoiceSourceFamily } from './invoice-source-label';

export type InvoiceSourceCardChrome = {
  cardShellClassName: string;
  accentBarClassName: string;
  sourceLabelClassName: string;
};

const DEAL_CHROME: InvoiceSourceCardChrome = {
  cardShellClassName:
    'border-violet-200/90 bg-violet-50/50 dark:border-violet-900/55 dark:bg-violet-950/30',
  accentBarClassName: 'bg-violet-500',
  sourceLabelClassName: 'text-violet-700 dark:text-violet-300',
};

const SUBSCRIPTION_CHROME: InvoiceSourceCardChrome = {
  cardShellClassName: 'border-sky-200/90 bg-sky-50/50 dark:border-sky-900/55 dark:bg-sky-950/30',
  accentBarClassName: 'bg-sky-500',
  sourceLabelClassName: 'text-sky-700 dark:text-sky-300',
};

const CLIENT_SERVICE_CHROME: InvoiceSourceCardChrome = {
  cardShellClassName:
    'border-amber-200/90 bg-amber-50/50 dark:border-amber-900/55 dark:bg-amber-950/30',
  accentBarClassName: 'bg-amber-500',
  sourceLabelClassName: 'text-amber-800 dark:text-amber-300',
};

const OTHER_CHROME: InvoiceSourceCardChrome = {
  cardShellClassName:
    'border-slate-200/90 bg-slate-50/60 dark:border-slate-800/70 dark:bg-slate-950/30',
  accentBarClassName: 'bg-slate-400',
  sourceLabelClassName: 'text-slate-600 dark:text-slate-300',
};

const CHROME_BY_FAMILY: Record<InvoiceSourceFamily, InvoiceSourceCardChrome> = {
  deal: DEAL_CHROME,
  subscription: SUBSCRIPTION_CHROME,
  client_service: CLIENT_SERVICE_CHROME,
  order: OTHER_CHROME,
  manual: OTHER_CHROME,
};

/** Board tint by invoice origin: deal, subscription, client service, or other. */
export function getInvoiceSourceCardChrome(family: InvoiceSourceFamily): InvoiceSourceCardChrome {
  return CHROME_BY_FAMILY[family];
}
