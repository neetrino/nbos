/** Map insert index from a list that excludes the dragged row back to full list index. */
export function mapFilteredInsertToFullIndex(fromIndex: number, filteredInsert: number): number {
  if (filteredInsert <= fromIndex) return filteredInsert;
  return filteredInsert + 1;
}

/** Drop on the same slot or directly below — no visible reorder. */
export function isReorderNoop(fromIndex: number, toIndex: number): boolean {
  return toIndex === fromIndex || toIndex === fromIndex + 1;
}

export function reorderArrayAtIndex<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= items.length) return items;
  if (fromIndex === toIndex) return items;

  const next = [...items];
  const [removed] = next.splice(fromIndex, 1);
  if (removed === undefined) return items;

  const clamped = Math.max(0, Math.min(toIndex, next.length));
  next.splice(clamped, 0, removed);
  return next;
}

/** Reorder items in one kanban column while preserving other items' list positions. */
export function reorderItemsInColumn<T>(
  items: T[],
  itemId: string,
  toIndex: number,
  isInColumn: (item: T) => boolean,
  getItemId: (item: T) => string,
): T[] {
  const slots: { globalIndex: number }[] = [];
  const columnItems: T[] = [];

  items.forEach((item, globalIndex) => {
    if (!isInColumn(item)) return;
    slots.push({ globalIndex });
    columnItems.push(item);
  });

  const fromIndex = columnItems.findIndex((item) => getItemId(item) === itemId);
  if (fromIndex < 0) return items;

  const reordered = reorderArrayAtIndex(columnItems, fromIndex, toIndex);
  const next = [...items];
  slots.forEach((slot, columnIdx) => {
    const item = reordered[columnIdx];
    if (item) next[slot.globalIndex] = item;
  });
  return next;
}
