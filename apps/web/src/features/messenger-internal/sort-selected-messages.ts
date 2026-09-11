export function sortSelectedMessages<T extends { createdAt: string; id: string }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => {
    const delta = Date.parse(left.createdAt) - Date.parse(right.createdAt);
    if (delta !== 0) return delta;
    return left.id.localeCompare(right.id);
  });
}
