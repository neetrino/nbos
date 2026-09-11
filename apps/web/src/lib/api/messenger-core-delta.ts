import { api } from '../api';
import type { MessengerCoreConversationRow } from './messenger-core';
import type { MessengerClientConversationRow } from './messenger-core-client';

export type MessengerDeltaPage<T> = {
  checkpoint: string;
  authorizationEpoch: string;
  resetRequired: boolean;
  summaries: T[];
  removedConversationIds: string[];
  changedConversationIds: string[];
  hasMore: boolean;
  nextCursor?: string;
};

export async function listInternalMessengerDelta(params: {
  after: string;
  cursor?: string;
  authorizationEpoch?: string;
}): Promise<MessengerDeltaPage<MessengerCoreConversationRow>> {
  const resp = await api.get<MessengerDeltaPage<MessengerCoreConversationRow>>(
    '/api/messenger/core/internal/delta',
    { params },
  );
  return resp.data;
}

export async function listClientMessengerDelta(params: {
  after: string;
  cursor?: string;
  authorizationEpoch?: string;
}): Promise<MessengerDeltaPage<MessengerClientConversationRow>> {
  const resp = await api.get<MessengerDeltaPage<MessengerClientConversationRow>>(
    '/api/messenger/core/client/delta',
    { params },
  );
  return resp.data;
}
