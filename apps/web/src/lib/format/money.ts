/** Armenian dram sign (U+058F). */
export const AMD_CURRENCY_SYMBOL = '\u058F';

const MONEY_GROUPING_LOCALE = 'hy-AM';

const groupedNumberFormatter = new Intl.NumberFormat(MONEY_GROUPING_LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Grouped integer amount without currency symbol (`3 500 000`). */
export function formatGroupedNumber(amount: number): string {
  return groupedNumberFormatter.format(amount);
}

/** Grouped amount with dram suffix (`3 500 000 ֏`). */
export function formatMoneyDram(amount: number): string {
  return `${formatGroupedNumber(amount)} ${AMD_CURRENCY_SYMBOL}`;
}

/** Grouped number for CRM cells that show {@link AMD_CURRENCY_SYMBOL} separately. */
export function formatMoneyDramOrDash(amount: number | null | undefined): string {
  if (amount == null || amount === 0) {
    return '—';
  }
  return formatGroupedNumber(amount);
}

/** Parses user/API money strings (strips grouping spaces). */
export function parseMoneyAmount(raw: string | number | null | undefined): number {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : 0;
  }
  if (raw == null || raw === '') {
    return 0;
  }
  const parsed = Number.parseFloat(String(raw).replace(/\s/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Finance display: AMD uses dram suffix; other currencies use grouped Intl currency. */
export function formatAmount(amount: number, currency = 'AMD'): string {
  if (currency === 'AMD') {
    return formatMoneyDram(amount);
  }
  return new Intl.NumberFormat(MONEY_GROUPING_LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** @deprecated Prefer {@link formatGroupedNumber}; kept for finance grids. */
export const formatAmountCompact = formatGroupedNumber;

/** Grid cells: `3 500 000֏` (no space before symbol). */
export function formatAmountDramSuffix(amount: number): string {
  return `${formatGroupedNumber(amount)}${AMD_CURRENCY_SYMBOL}`;
}
