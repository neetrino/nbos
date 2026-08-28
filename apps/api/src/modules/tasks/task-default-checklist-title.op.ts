export const DEFAULT_CHECKLIST_TITLE_PREFIX = 'Checklist';

const NUMBERED_DEFAULT_TITLE = /^Checklist (\d+)$/i;

/**
 * Next unused `Checklist N` title. Named titles (QA, Launch) are ignored.
 */
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
  return `${DEFAULT_CHECKLIST_TITLE_PREFIX} ${next}`;
}

export function resolveChecklistTitle(
  requestedTitle: string | undefined,
  existingTitles: readonly string[],
): string {
  const trimmed = requestedTitle?.trim();
  if (trimmed) return trimmed;
  return nextDefaultChecklistTitle(existingTitles);
}
