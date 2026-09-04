export const EXPENSE_CARD_NO_DUE_DATE_LABEL = 'No date';

/** Card face: month and day; year only when it is not the current year. */
export function formatExpenseCardDueDate(
  iso: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!iso) {
    return EXPENSE_CARD_NO_DUE_DATE_LABEL;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return EXPENSE_CARD_NO_DUE_DATE_LABEL;
  }
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
