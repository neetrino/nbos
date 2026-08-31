import type { MessengerConversationType, MessengerConversationZone } from '@nbos/database';

export const MESSENGER_CORE_INTERNAL_TYPES: readonly MessengerConversationType[] = [
  'PROJECT_GENERAL',
  'PRODUCT',
  'DEAL',
  'TASK',
  'WORKSPACE',
  'DIRECT',
  'INTERNAL_GROUP',
];

export const MESSENGER_CORE_CLIENT_TYPES: readonly MessengerConversationType[] = ['EXTERNAL'];

export const MESSENGER_CORE_INTERNAL_ZONE: MessengerConversationZone = 'INTERNAL';
export const MESSENGER_CORE_CLIENT_ZONE: MessengerConversationZone = 'CLIENT';

export const MESSENGER_CORE_ZONE_IMMUTABLE_MESSAGE = 'Conversation zone is immutable';
export const MESSENGER_CORE_CLIENT_SEND_DISABLED = 'Client send is not enabled';
export const MESSENGER_CORE_CLIENT_SEND_FORBIDDEN = 'Client SEND permission is required';
export const MESSENGER_CORE_CLIENT_READ_ONLY = 'Client conversation is read-only for this employee';
export const MESSENGER_CORE_INTERNAL_WRITE_FORBIDDEN =
  'Internal conversation write access is required';
export const MESSENGER_CORE_CLIENT_WRITE_FORBIDDEN = 'Client conversation write access is required';
export const MESSENGER_CORE_CLIENT_CREATE_FORBIDDEN =
  'Client conversation create requires Client READ';
export const MESSENGER_CORE_COLLECTION_ZONE_MISMATCH =
  'Collection zone must match conversation zone';
export const MESSENGER_CORE_COLLECTION_ZONE_IMMUTABLE = 'Collection zone is immutable';
export const MESSENGER_CORE_INTERNAL_PROVIDER_FORBIDDEN =
  'Internal conversations cannot have a provider mapping';
export const MESSENGER_CORE_INTERNAL_OUTBOX_FORBIDDEN =
  'Internal conversations cannot enqueue provider send';

export const MESSENGER_CORE_LEGACY_CHANNEL_KEY_PREFIX = 'legacy:channel:';
export const MESSENGER_CORE_DIRECT_KEY_PREFIX = 'direct:';
export const MESSENGER_CORE_PRODUCT_KEY_PREFIX = 'product:';
export const MESSENGER_CORE_WORKSPACE_KEY_PREFIX = 'workspace:';
export const MESSENGER_CORE_DEAL_KEY_PREFIX = 'deal:';
export const MESSENGER_CORE_TASK_KEY_PREFIX = 'task:';
export const MESSENGER_CORE_PROJECT_GENERAL_KEY_PREFIX = 'project_general:';
export const MESSENGER_CORE_RESERVED_CANONICAL_KEY_PREFIXES = [
  'product:',
  'workspace:',
  'direct:',
  'legacy:channel:',
  'project_general:',
  'deal:',
  'task:',
] as const;

export const MESSENGER_CORE_FAVORITES_NAME = 'Favorites';
export const MESSENGER_CORE_INTERNAL_LIST_PAGE_SIZE = 100;
export const MESSENGER_CORE_INTERNAL_MESSAGE_PAGE_SIZE = 100;
export const MESSENGER_CORE_INTERNAL_CLIENT_ZONE_FORBIDDEN =
  'Internal Messenger cannot open Client conversations';
export const MESSENGER_CORE_INTERNAL_CREATE_TYPE_FORBIDDEN =
  'Internal Messenger can create Groups and Direct only';
export const MESSENGER_CORE_INTERNAL_MENTIONS_UNAVAILABLE =
  'Mentions filter is a Slice 6 hook until mention persist exists';

export const MESSENGER_INTERNAL_SECTIONS = [
  'all',
  'products',
  'tasks',
  'deals',
  'workspaces',
  'groups',
  'direct',
  'collections',
] as const;

export type MessengerInternalSection = (typeof MESSENGER_INTERNAL_SECTIONS)[number];
