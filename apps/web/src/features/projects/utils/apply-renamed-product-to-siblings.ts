/**
 * Keep product switcher list in sync after an inline rename on the detail page.
 */
export function applyRenamedProductToSiblings<
  T extends { id: string; name: string; updatedAt: string },
>(siblings: T[], renamed: Pick<T, 'id' | 'name' | 'updatedAt'>): T[] {
  return siblings.map((item) =>
    item.id === renamed.id ? { ...item, name: renamed.name, updatedAt: renamed.updatedAt } : item,
  );
}
