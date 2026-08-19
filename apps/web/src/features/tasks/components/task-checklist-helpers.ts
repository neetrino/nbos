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
