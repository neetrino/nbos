import type { InvoiceSourceFamily } from './invoice-source-label';

export type InvoiceSourceCardChrome = {
  cardShellClassName: string;
  sheetShellClassName: string;
  headerBandClassName: string;
  accentBarClassName: string;
  sourceLabelClassName: string;
  iconClassName: string;
  badgeClassName: string;
};

const DEAL_CHROME: InvoiceSourceCardChrome = {
  cardShellClassName:
    'overflow-hidden border-violet-300 bg-violet-100 dark:border-violet-700 dark:bg-violet-900',
  sheetShellClassName: 'border-violet-300 bg-violet-100 dark:border-violet-700 dark:bg-violet-900',
  headerBandClassName: 'bg-violet-200 dark:bg-violet-800',
  accentBarClassName: 'bg-violet-600 dark:bg-violet-400',
  sourceLabelClassName: 'text-violet-800 dark:text-violet-200',
  iconClassName: 'text-violet-700 dark:text-violet-300',
  badgeClassName:
    'border-violet-400 bg-violet-50 text-violet-800 dark:border-violet-500 dark:bg-violet-950 dark:text-violet-200',
};

const SUBSCRIPTION_CHROME: InvoiceSourceCardChrome = {
  cardShellClassName:
    'overflow-hidden border-sky-300 bg-sky-100 dark:border-sky-700 dark:bg-sky-900',
  sheetShellClassName: 'border-sky-300 bg-sky-100 dark:border-sky-700 dark:bg-sky-900',
  headerBandClassName: 'bg-sky-200 dark:bg-sky-800',
  accentBarClassName: 'bg-sky-600 dark:bg-sky-400',
  sourceLabelClassName: 'text-sky-800 dark:text-sky-200',
  iconClassName: 'text-sky-700 dark:text-sky-300',
  badgeClassName:
    'border-sky-400 bg-sky-50 text-sky-800 dark:border-sky-500 dark:bg-sky-950 dark:text-sky-200',
};

const CLIENT_SERVICE_CHROME: InvoiceSourceCardChrome = {
  cardShellClassName:
    'overflow-hidden border-amber-300 bg-amber-100 dark:border-amber-700 dark:bg-amber-900',
  sheetShellClassName: 'border-amber-300 bg-amber-100 dark:border-amber-700 dark:bg-amber-900',
  headerBandClassName: 'bg-amber-200 dark:bg-amber-800',
  accentBarClassName: 'bg-amber-600 dark:bg-amber-400',
  sourceLabelClassName: 'text-amber-900 dark:text-amber-200',
  iconClassName: 'text-amber-800 dark:text-amber-300',
  badgeClassName:
    'border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-200',
};

const OTHER_CHROME: InvoiceSourceCardChrome = {
  cardShellClassName:
    'overflow-hidden border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800',
  sheetShellClassName: 'border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800',
  headerBandClassName: 'bg-slate-200 dark:bg-slate-700',
  accentBarClassName: 'bg-slate-500 dark:bg-slate-300',
  sourceLabelClassName: 'text-slate-700 dark:text-slate-200',
  iconClassName: 'text-slate-600 dark:text-slate-300',
  badgeClassName:
    'border-slate-400 bg-slate-50 text-slate-700 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-200',
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
