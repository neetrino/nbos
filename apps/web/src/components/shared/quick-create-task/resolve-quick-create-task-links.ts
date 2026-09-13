import type { QuickCreateDraftLink } from './quick-create-task-extras';

export type QuickCreateTaskLinkInput = { entityType: string; entityId: string };

/**
 * Unsorted (inbox) tasks omit `links`. Linked create passes `defaultLinks` or a single `defaultLink`.
 */
export function resolveQuickCreateTaskLinks(
  defaultLinks?: QuickCreateTaskLinkInput[],
  defaultLink?: QuickCreateTaskLinkInput,
  pickedLinks: readonly QuickCreateDraftLink[] = [],
): QuickCreateTaskLinkInput[] | undefined {
  const base = defaultLinks ?? (defaultLink ? [defaultLink] : []);
  const extra = pickedLinks
    .filter((link) => link.kind === 'PROJECT' || link.kind === 'PRODUCT')
    .map((link) => ({ entityType: link.kind, entityId: link.entityId }));
  const merged: QuickCreateTaskLinkInput[] = [...base];
  for (const link of extra) {
    const exists = merged.some(
      (item) => item.entityType === link.entityType && item.entityId === link.entityId,
    );
    if (!exists) merged.push(link);
  }
  return merged.length > 0 ? merged : undefined;
}

export function resolveQuickCreateWorkspaceId(
  defaultWorkspaceId: string | undefined,
  pickedWorkspaceId: string | undefined,
): string | undefined {
  return pickedWorkspaceId || defaultWorkspaceId;
}
