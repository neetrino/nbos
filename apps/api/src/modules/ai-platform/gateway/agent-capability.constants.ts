/** Default page size for agent list/discovery projections. */
export const AGENT_LIST_DEFAULT_PAGE_SIZE = 20;

export const AGENT_LIST_MAX_PAGE_SIZE = 50;

export const AGENT_LIST_MIN_PAGE_SIZE = 1;

/** How long a stored idempotent COMPLETED result can be replayed. */
export const AGENT_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1_000;

export const AGENT_IDEMPOTENCY_KEY_MAX_LENGTH = 128;

export const AGENT_IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._~:-]+$/;

export const TASK_AGENT_PERMITTED_LINK_ENTITY_TYPES = [
  'PROJECT',
  'PRODUCT',
  'WORKSPACE',
  'TASK',
] as const;

export const AGENT_TASK_SORT_FIELDS = ['updatedAt', 'createdAt', 'dueDate', 'priority'] as const;
