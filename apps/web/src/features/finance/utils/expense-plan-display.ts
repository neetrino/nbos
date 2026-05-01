export function formatExpensePlanShortDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function expensePlanFrequencyLabel(value: string): string {
  const map: Record<string, string> = {
    ONE_TIME: 'One-time',
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    YEARLY: 'Yearly',
    MULTI_YEAR: 'Multi-year',
  };
  return map[value] ?? value;
}
