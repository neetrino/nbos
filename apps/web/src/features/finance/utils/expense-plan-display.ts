const GRID_PROJECT_LABEL_SEPARATOR = ' — ';
const YEARLY_PLAN_FREQUENCIES = new Set(['YEARLY', 'MULTI_YEAR']);

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
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    YEARLY: 'Yearly',
    MULTI_YEAR: 'Multi-year',
  };
  return map[value] ?? value;
}

export function formatExpensePlanDueMonth(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
}

/** Grid API sends `${code} — ${name}`; sidebar shows the name only. */
export function expensePlanGridProjectName(projectLabel: string | null): string | null {
  if (!projectLabel) return null;
  const separatorIndex = projectLabel.indexOf(GRID_PROJECT_LABEL_SEPARATOR);
  if (separatorIndex === -1) {
    return projectLabel.trim() || null;
  }
  const name = projectLabel.slice(separatorIndex + GRID_PROJECT_LABEL_SEPARATOR.length).trim();
  return name || projectLabel.trim() || null;
}

export function expensePlanGridProjectCode(projectLabel: string | null): string | null {
  if (!projectLabel) return null;
  const separatorIndex = projectLabel.indexOf(GRID_PROJECT_LABEL_SEPARATOR);
  if (separatorIndex <= 0) return null;
  return projectLabel.slice(0, separatorIndex).trim() || null;
}

export function formatExpensePlanGridRowSubtitle(input: {
  frequency: string;
  projectLabel: string | null;
  nextDueDate?: string | null;
}): { text: string; title: string } {
  const frequencyText = expensePlanFrequencyLabel(input.frequency);
  const dueMonth = YEARLY_PLAN_FREQUENCIES.has(input.frequency)
    ? formatExpensePlanDueMonth(input.nextDueDate ?? null)
    : null;
  const projectName = expensePlanGridProjectName(input.projectLabel);
  const projectCode = expensePlanGridProjectCode(input.projectLabel);
  const text = [frequencyText, dueMonth, projectName].filter(Boolean).join(' · ');
  const title = [frequencyText, dueMonth, projectName, projectCode].filter(Boolean).join(' · ');
  return { text, title };
}
