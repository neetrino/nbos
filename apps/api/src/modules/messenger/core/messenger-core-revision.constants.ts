import type { MessengerConversationZone } from '@nbos/database';
import {
  MESSENGER_CORE_CLIENT_LIST_PAGE_SIZE,
  MESSENGER_CORE_INTERNAL_LIST_PAGE_SIZE,
} from './messenger-core.constants';

export const MESSENGER_REVISION_CHANGE_CONVERSATION = 'CONVERSATION' as const;
export const MESSENGER_REVISION_CHANGE_READ = 'READ' as const;
export const MESSENGER_REVISION_CHANGE_FAVORITE = 'FAVORITE' as const;
export const MESSENGER_REVISION_CHANGE_ACCESS_REMOVED = 'ACCESS_REMOVED' as const;

export type MessengerRevisionChangeKind =
  | typeof MESSENGER_REVISION_CHANGE_CONVERSATION
  | typeof MESSENGER_REVISION_CHANGE_READ
  | typeof MESSENGER_REVISION_CHANGE_FAVORITE
  | typeof MESSENGER_REVISION_CHANGE_ACCESS_REMOVED;

export const MESSENGER_CHECKPOINT_MAX_DIGITS = 20;
export const MESSENGER_DELTA_CURSOR_MAX_LENGTH = 180;
export const MESSENGER_AUTHORIZATION_EPOCH_LENGTH = 32;

export const MESSENGER_CHECKPOINT_PATTERN = /^(0|[1-9]\d{0,19})$/;
export const MESSENGER_AUTHORIZATION_EPOCH_PATTERN = /^[a-f0-9]{32}$/;

export const MESSENGER_WRITE_ISOLATION_READ_COMMITTED = 'ReadCommitted' as const;

export const MESSENGER_DELTA_RECOVERY_ENABLED_ENV = 'MESSENGER_DELTA_RECOVERY_ENABLED';
export const MESSENGER_DELTA_DISABLED_CODE = 'MESSENGER_DELTA_DISABLED';
export const MESSENGER_RECOVERY_MODE_FULL = 'FULL' as const;
export const MESSENGER_RECOVERY_MODE_DELTA = 'DELTA' as const;
export type MessengerRecoveryMode =
  | typeof MESSENGER_RECOVERY_MODE_FULL
  | typeof MESSENGER_RECOVERY_MODE_DELTA;

export const MESSENGER_TASK_ACL_BYPASS_SENTINEL = 'TASK_VIEW_ALL';
export const MESSENGER_TASK_ACL_ABSENT_SENTINEL = 'TASK_ACL_ABSENT';

export function messengerDeltaPageSize(zone: MessengerConversationZone): number {
  return zone === 'CLIENT'
    ? MESSENGER_CORE_CLIENT_LIST_PAGE_SIZE
    : MESSENGER_CORE_INTERNAL_LIST_PAGE_SIZE;
}

export function revisionToCheckpoint(revision: bigint): string {
  return revision.toString(10);
}
