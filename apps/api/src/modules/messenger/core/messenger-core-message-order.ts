export function sortCoreMessagesByCreatedAtId<T extends { createdAt: Date; id: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((left, right) => {
    const delta = left.createdAt.getTime() - right.createdAt.getTime();
    if (delta !== 0) return delta;
    if (left.id < right.id) return -1;
    if (left.id > right.id) return 1;
    return 0;
  });
}
