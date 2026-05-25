const FIRST_DAY_OF_MONTH = 1;

export function resolvePostingMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function resolvePostingPeriodStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), FIRST_DAY_OF_MONTH));
}

export function resolvePostingPeriodEnd(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, FIRST_DAY_OF_MONTH));
}
