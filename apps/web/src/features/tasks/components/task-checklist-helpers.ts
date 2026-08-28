const NUMBERED_DEFAULT_TITLE = /^Checklist (\d+)$/i;

/** Next unused `Checklist N`. Custom titles are ignored. */
export function nextDefaultChecklistTitle(existingTitles: readonly string[]): string {
  const used = new Set<number>();
  for (const title of existingTitles) {
    const match = title.trim().match(NUMBERED_DEFAULT_TITLE);
    if (!match) continue;
    const n = Number(match[1]);
    if (Number.isInteger(n) && n > 0) used.add(n);
  }
  let next = 1;
  while (used.has(next)) next += 1;
  return `Checklist ${next}`;
}

export function newEmptyChecklistId(
  checklists: ReadonlyArray<{ id: string; items: readonly unknown[] }>,
): string | null {
  const last = checklists.at(-1);
  return last && last.items.length === 0 ? last.id : null;
}

export function visibleChecklistItems<T extends { checked: boolean }>(
  items: readonly T[],
  hideCompleted: boolean,
): T[] {
  if (!hideCompleted) return [...items];
  return items.filter((item) => !item.checked);
}

export function checklistProgressLabel(done: number, total: number): string {
  return `${done}/${total} done`;
}

export type ChecklistTextCommitDecision =
  | { action: 'cancel' }
  | { action: 'noop' }
  | { action: 'commit'; value: string };

/** Empty draft restores the previous value; unchanged text does not save. */
export function resolveChecklistTextCommit(
  draft: string,
  currentValue: string,
): ChecklistTextCommitDecision {
  const trimmed = draft.trim();
  if (!trimmed) return { action: 'cancel' };
  if (trimmed === currentValue) return { action: 'noop' };
  return { action: 'commit', value: trimmed };
}
