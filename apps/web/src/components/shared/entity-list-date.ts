const LIST_DATE_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const LIST_DATE_DAY_FORMATTER = new Intl.DateTimeFormat('en-US', { day: 'numeric' });

const LIST_DATE_MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
});

const CARD_DATE_DAY_MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const CARD_DATE_YEAR_FORMATTER = new Intl.DateTimeFormat('en-US', { year: 'numeric' });

export interface EntityListDateParts {
  day: string;
  monthYear: string;
}

export interface EntityCardDateParts {
  dayMonth: string;
  year: string;
}

function parseListDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatEntityListDate(value: string): string {
  const date = parseListDate(value);
  return date ? LIST_DATE_FORMATTER.format(date) : '';
}

/** @deprecated Prefer {@link formatEntityListDate}. */
export const formatFinanceListDate = formatEntityListDate;

export function resolveEntityListDateParts(value: string): EntityListDateParts | null {
  const date = parseListDate(value);
  if (!date) return null;
  return {
    day: LIST_DATE_DAY_FORMATTER.format(date),
    monthYear: LIST_DATE_MONTH_YEAR_FORMATTER.format(date),
  };
}

export function resolveEntityCardDateParts(value: string): EntityCardDateParts | null {
  const date = parseListDate(value);
  if (!date) return null;
  return {
    dayMonth: CARD_DATE_DAY_MONTH_FORMATTER.format(date),
    year: CARD_DATE_YEAR_FORMATTER.format(date),
  };
}
