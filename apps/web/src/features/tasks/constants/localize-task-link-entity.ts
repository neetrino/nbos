const TASK_LINK_ENTITY_KEYS = [
  'PROJECT',
  'PRODUCT',
  'EXTENSION',
  'ORDER',
  'DEAL',
  'LEAD',
  'INVOICE',
  'SUPPORT_TICKET',
  'WORK_SPACE',
] as const;

export type TaskLinkEntityMessageKey = (typeof TASK_LINK_ENTITY_KEYS)[number];

function normalizeTaskLinkEntityKey(entityType: string): TaskLinkEntityMessageKey | null {
  if (entityType === 'WORKSPACE') return 'WORK_SPACE';
  return TASK_LINK_ENTITY_KEYS.find((key) => key === entityType) ?? null;
}

/** Translate a known task-link type. Unknown types stay as stored codes. */
export function localizeTaskLinkEntityLabel(
  entityType: string,
  t: (key: `sheet.entity.${TaskLinkEntityMessageKey}`) => string,
  fallback: string,
): string {
  const key = normalizeTaskLinkEntityKey(entityType);
  if (!key) return fallback;
  return t(`sheet.entity.${key}`);
}
