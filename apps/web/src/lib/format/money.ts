/** Armenian dram sign (U+058F). */
export const AMD_CURRENCY_SYMBOL = '\u058F';

/**
 * Money field usage:
 * - display: formatAmount / formatGroupedNumber
 * - input (dialogs/forms): NbosMoneyInput
 * - input (detail sheets): InlineField type="money"
 * - parse at submit/API: parseMoneyAmount
 */

const MONEY_GROUPING_LOCALE = 'hy-AM';

/** Spaces and NBSP stripped from typed/displayed money strings. */
const MONEY_INPUT_GROUPING_PATTERN = /[\s\u00a0\u202f]/g;

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

/**
 * Normalizes typed money input to a plain numeric string (`3500000`, `3500.5`, ``).
 * Keeps at most one decimal point; drops other non-digit characters.
 */
export function sanitizeMoneyInput(raw: string): string {
  const withoutGrouping = raw.replace(MONEY_INPUT_GROUPING_PATTERN, '');
  let hasDecimal = false;
  let result = '';

  for (const char of withoutGrouping) {
    if (char === '-' && result === '') {
      result += '-';
      continue;
    }
    if (char >= '0' && char <= '9') {
      result += char;
      continue;
    }
    if (char === '.' && !hasDecimal) {
      hasDecimal = true;
      result += '.';
    }
  }

  return result;
}

/** Formats a money input value with hy-AM thousand grouping while typing. */
export function formatMoneyInput(raw: string | number | null | undefined): string {
  if (raw == null || raw === '') {
    return '';
  }

  const normalized =
    typeof raw === 'number' ? (Number.isFinite(raw) ? String(raw) : '') : sanitizeMoneyInput(raw);

  if (normalized === '') {
    return '';
  }
  if (normalized === '-' || normalized === '.') {
    return normalized;
  }

  const isNegative = normalized.startsWith('-');
  const unsigned = isNegative ? normalized.slice(1) : normalized;

  if (unsigned === '') {
    return isNegative ? '-' : '';
  }
  if (unsigned === '.') {
    return isNegative ? '-.' : '.';
  }

  const [intPart = '', decPart] = unsigned.split('.');
  if (intPart === '' && decPart !== undefined) {
    return `${isNegative ? '-' : ''}.${decPart}`;
  }
  if (intPart === '') {
    return isNegative ? '-' : '';
  }

  const intValue = Number.parseInt(intPart, 10);
  const groupedInt = Number.isFinite(intValue) ? groupedNumberFormatter.format(intValue) : intPart;

  const formatted = decPart !== undefined ? `${groupedInt}.${decPart}` : groupedInt;

  return isNegative ? `-${formatted}` : formatted;
}

/** Parses user/API money strings (strips grouping spaces). */
export function parseMoneyAmount(raw: string | number | null | undefined): number {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : 0;
  }
  if (raw == null || raw === '') {
    return 0;
  }
  const parsed = Number.parseFloat(String(raw).replace(MONEY_INPUT_GROUPING_PATTERN, ''));
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

const AMOUNT_ABBREV_K = 1_000;
const AMOUNT_ABBREV_M = 1_000_000;

function formatAbbreviatedMagnitude(value: number, divisor: number, suffix: string): string {
  const scaled = value / divisor;
  if (Number.isInteger(scaled)) {
    return `${scaled}${suffix}`;
  }
  return `${parseFloat(scaled.toFixed(1))}${suffix}`;
}

/** Salary board cells: `250K`, `2.5M` — totals should keep {@link formatAmount}. */
export function formatAmountAbbreviated(amount: number): string {
  const absolute = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absolute >= AMOUNT_ABBREV_M) {
    return `${sign}${formatAbbreviatedMagnitude(absolute, AMOUNT_ABBREV_M, 'M')}`;
  }
  if (absolute >= AMOUNT_ABBREV_K) {
    return `${sign}${formatAbbreviatedMagnitude(absolute, AMOUNT_ABBREV_K, 'K')}`;
  }
  return `${sign}${formatGroupedNumber(Math.round(absolute))}`;
}
