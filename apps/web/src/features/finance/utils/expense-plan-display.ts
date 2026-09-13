import { stripEntityCodePrefix } from '@/lib/format/project-product-display';

const YEARLY_PLAN_FREQUENCIES = new Set(['YEARLY', 'MULTI_YEAR']);

export function formatExpensePlanShortDate(iso: string | null, locale?: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function expensePlanFrequencyLabel(value: string): string {
  const map: Record<string, string> = {
    ONE_TIME: 'One-time',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    YEARLY: 'Yearly',
    MULTI_YEAR: 'Multi-year',
  };
  return map[value] ?? value;
}

export function formatExpensePlanDueMonth(iso: string | null, locale = 'en-US'): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(date);
}

/** Grid API may send `${code} — ${name}`; UI shows the name only. */
export function expensePlanGridProjectName(projectLabel: string | null): string | null {
  return stripEntityCodePrefix(projectLabel);
}

export function formatExpensePlanGridRowSubtitle(input: {
  frequency: string;
  frequencyLabel?: string;
  projectLabel: string | null;
  nextDueDate?: string | null;
  locale?: string;
}): { text: string; title: string } {
  const frequencyText = input.frequencyLabel ?? expensePlanFrequencyLabel(input.frequency);
  const dueMonth = YEARLY_PLAN_FREQUENCIES.has(input.frequency)
    ? formatExpensePlanDueMonth(input.nextDueDate ?? null, input.locale)
    : null;
  const projectName = expensePlanGridProjectName(input.projectLabel);
  const text = [frequencyText, dueMonth, projectName].filter(Boolean).join(' · ');
  return { text, title: text };
}
