/**
 * Platform entity lifecycle vocabulary — Profiles A–G, scopes, and API action names.
 * @see docs/NBOS/03-Business-Logic/09-Entity-Lifecycle-Standard.md
 */

export const ENTITY_LIFECYCLE_SCOPES = ['active', 'trash'] as const;
export type EntityLifecycleScope = (typeof ENTITY_LIFECYCLE_SCOPES)[number];

export const LIFECYCLE_PROFILES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
export type LifecycleProfile = (typeof LIFECYCLE_PROFILES)[number];

/** Canonical lifecycle mutation action names (API audit + client copy). */
export const LIFECYCLE_ACTIONS = {
  MOVE_TO_TRASH: 'move_to_trash',
  RESTORE_FROM_TRASH: 'restore_from_trash',
  PURGE: 'purge',
} as const;

export type LifecycleAction = (typeof LIFECYCLE_ACTIONS)[keyof typeof LIFECYCLE_ACTIONS];

/** Transitional timestamp columns while modules migrate to `trashedAt`. */
export const LIFECYCLE_TIMESTAMP_FIELDS = ['trashedAt', 'archivedAt', 'deletedAt'] as const;
export type LifecycleTimestampField = (typeof LIFECYCLE_TIMESTAMP_FIELDS)[number];

const SCOPE_ALIASES: Record<string, EntityLifecycleScope> = {
  active: 'active',
  trash: 'trash',
  /** Credentials / legacy list param — maps to trash scope. */
  archived: 'trash',
};

/**
 * Parses `?scope=` (or legacy trash aliases). Defaults to `active`.
 */
export function parseEntityLifecycleScope(
  raw: string | null | undefined,
  fallback: EntityLifecycleScope = 'active',
): EntityLifecycleScope {
  if (raw == null || raw.trim() === '') return fallback;
  const normalized = raw.trim().toLowerCase();
  return SCOPE_ALIASES[normalized] ?? fallback;
}

export function isTrashScope(scope: EntityLifecycleScope): boolean {
  return scope === 'trash';
}

export function isActiveScope(scope: EntityLifecycleScope): boolean {
  return scope === 'active';
}
