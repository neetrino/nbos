import type { MessengerConversationZone } from '@nbos/database';
import type { MessengerClientConversationListItem } from './messenger-core-client.types';
import type { MessengerInternalConversationListItem } from './messenger-core-internal.types';
import type {
  MessengerRecoveryMode,
  MessengerRevisionChangeKind,
} from './messenger-core-revision.constants';

export type MessengerCheckpointFields = {
  recoveryMode: MessengerRecoveryMode;
  checkpoint: string | null;
  authorizationEpoch: string | null;
};

export type MessengerInternalBootstrapResult = {
  summaries: import('./messenger-core-internal.types').MessengerInternalListResult;
  collections: import('./messenger-core-collection.ops').MessengerCoreCollectionDto[];
} & MessengerCheckpointFields;

export type MessengerClientBootstrapResult = {
  summaries: import('./messenger-core-client.types').MessengerClientListResult;
  collections: import('./messenger-core-collection.ops').MessengerCoreCollectionDto[];
} & MessengerCheckpointFields;

export type MessengerDeltaCursor = {
  highWater: string;
  revision: string;
  conversationId: string;
};

export type MessengerDeltaChangeRow = {
  conversationId: string;
  revision: string;
  changeKind: MessengerRevisionChangeKind;
  lane: 'G' | 'T';
  hasConversation: boolean;
  hasAccessRemoved: boolean;
};

export type MessengerInternalDeltaResult = MessengerCheckpointFields & {
  resetRequired: boolean;
  summaries: MessengerInternalConversationListItem[];
  removedConversationIds: string[];
  changedConversationIds: string[];
  hasMore: boolean;
  nextCursor?: string;
};

export type MessengerClientDeltaResult = MessengerCheckpointFields & {
  resetRequired: boolean;
  summaries: MessengerClientConversationListItem[];
  removedConversationIds: string[];
  changedConversationIds: string[];
  hasMore: boolean;
  nextCursor?: string;
};

export type MessengerDeltaQuery = {
  after: string;
  cursor?: string;
  authorizationEpoch?: string;
  pageSize?: number;
};

export type MessengerZoneAccessFingerprintInput = {
  employeeId: string;
  viewScope: string;
  editScope: string;
  clientReadScope: string;
  clientSendScope: string;
  tasksViewScope?: string;
  departmentIds?: string[];
  taskAclDigest?: string;
  grantAclDigest?: string;
  zone: MessengerConversationZone;
};
