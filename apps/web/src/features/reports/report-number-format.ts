export const EMPTY_REPORT_VALUE = '—';

export function money(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return EMPTY_REPORT_VALUE;
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numeric)) return EMPTY_REPORT_VALUE;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'AMD',
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function count(value: number | undefined | null): string {
  return value === undefined || value === null
    ? EMPTY_REPORT_VALUE
    : new Intl.NumberFormat('en-US').format(value);
}

export function percent(value: number | null | undefined): string {
  return value === null || value === undefined ? EMPTY_REPORT_VALUE : `${value.toFixed(1)}%`;
}

export function ratio(value: number | null | undefined): string {
  return value === null || value === undefined ? EMPTY_REPORT_VALUE : `${value.toFixed(2)}x`;
}

export function numberValue(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  const numeric = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(numeric) ? numeric : 0;
}
