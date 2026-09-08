/** Drops repeated ids so Hub cards/rows keep a stable React key. */
export function uniqueProjectsById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/** Appends the next Hub page without repeating project ids. */
export function appendUniqueProjects<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const seen = new Set(current.map((item) => item.id));
  const appended = incoming.filter((item) => !seen.has(item.id));
  return appended.length > 0 ? [...current, ...appended] : current;
}
