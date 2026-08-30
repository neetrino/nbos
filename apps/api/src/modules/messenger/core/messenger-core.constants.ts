import type { MessengerConversationType, MessengerConversationZone } from '@nbos/database';

export const MESSENGER_CORE_INTERNAL_TYPES: readonly MessengerConversationType[] = [
  'PROJECT_GENERAL',
  'PRODUCT',
  'DEAL',
  'TASK',
  'DIRECT',
  'INTERNAL_GROUP',
];

export const MESSENGER_CORE_CLIENT_TYPES: readonly MessengerConversationType[] = ['EXTERNAL'];

export const MESSENGER_CORE_INTERNAL_ZONE: MessengerConversationZone = 'INTERNAL';
export const MESSENGER_CORE_CLIENT_ZONE: MessengerConversationZone = 'CLIENT';

export const MESSENGER_CORE_ZONE_IMMUTABLE_MESSAGE = 'Conversation zone is immutable';
export const MESSENGER_CORE_CLIENT_SEND_DISABLED = 'Client send is not enabled';
export const MESSENGER_CORE_INTERNAL_PROVIDER_FORBIDDEN =
  'Internal conversations cannot have a provider mapping';
export const MESSENGER_CORE_INTERNAL_OUTBOX_FORBIDDEN =
  'Internal conversations cannot enqueue provider send';

export const MESSENGER_CORE_LEGACY_CHANNEL_KEY_PREFIX = 'legacy:channel:';
export const MESSENGER_CORE_DIRECT_KEY_PREFIX = 'direct:';
export const MESSENGER_CORE_RESERVED_CANONICAL_KEY_PREFIXES = [
  'product:',
  'direct:',
  'legacy:channel:',
  'project_general:',
  'deal:',
  'task:',
] as const;
