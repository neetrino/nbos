export type QuickCreateTaskLinkInput = { entityType: string; entityId: string };

/**
 * Unsorted (inbox) tasks omit `links`. Linked create passes `defaultLinks` or a single `defaultLink`.
 */
export function resolveQuickCreateTaskLinks(
  defaultLinks?: QuickCreateTaskLinkInput[],
  defaultLink?: QuickCreateTaskLinkInput,
): QuickCreateTaskLinkInput[] | undefined {
  return defaultLinks ?? (defaultLink ? [defaultLink] : undefined);
}
