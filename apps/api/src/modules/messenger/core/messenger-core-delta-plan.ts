import type { MessengerDeltaChangeRow } from './messenger-core-revision.types';

export type MessengerDeltaHydrationPlan = {
  orderedIds: string[];
  removedCandidateIds: string[];
  changedCandidateIds: string[];
};

export function planMessengerDeltaHydration(rows: MessengerDeltaChangeRow[]): MessengerDeltaHydrationPlan {
  const orderedIds: string[] = [];
  const removedCandidateIds: string[] = [];
  const changedCandidateIds: string[] = [];
  for (const row of rows) {
    orderedIds.push(row.conversationId);
    if (row.hasAccessRemoved) removedCandidateIds.push(row.conversationId);
    if (row.hasConversation || row.hasAccessRemoved) {
      changedCandidateIds.push(row.conversationId);
    }
  }
  return { orderedIds, removedCandidateIds, changedCandidateIds };
}

export function splitDeltaPage<T>(rows: T[], pageSize: number): { items: T[]; hasMore: boolean } {
  const hasMore = rows.length > pageSize;
  return { items: hasMore ? rows.slice(0, pageSize) : rows, hasMore };
}
