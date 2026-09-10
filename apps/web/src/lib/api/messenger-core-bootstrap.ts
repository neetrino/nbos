import { api } from '../api';
import type { MessengerCoreCollectionRow, MessengerCoreConversationRow } from './messenger-core';

const INTERNAL_ROOT = '/api/messenger/core/internal';

export type MessengerBootstrapCheckpoint = {
  recoveryMode?: 'FULL' | 'DELTA' | null;
  checkpoint?: string | null;
  authorizationEpoch?: string | null;
};

export type InternalMessengerBootstrapResponse = {
  summaries: {
    items: MessengerCoreConversationRow[];
    mentionsAvailable: boolean;
    hasMore?: boolean;
  };
  collections: MessengerCoreCollectionRow[];
} & MessengerBootstrapCheckpoint;

export async function bootstrapInternalMessenger(): Promise<InternalMessengerBootstrapResponse> {
  const resp = await api.post<InternalMessengerBootstrapResponse>(`${INTERNAL_ROOT}/bootstrap`);
  return resp.data;
}
