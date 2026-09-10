import type { MessengerDeltaChangeRow } from './messenger-core-revision.types';
import type { MessengerDeltaHydrationPlan } from './messenger-core-delta-plan';

export type MessengerDeltaHydratedPage<T extends { id: string }> = {
  summaries: T[];
  removedConversationIds: string[];
  changedConversationIds: string[];
};

export function assembleMessengerDeltaPage<T extends { id: string }>(
  pageRows: MessengerDeltaChangeRow[],
  plan: MessengerDeltaHydrationPlan,
  authorized: T[],
): MessengerDeltaHydratedPage<T> {
  const authorizedById = new Map(authorized.map((row) => [row.id, row]));
  const summaries: T[] = [];
  const removedConversationIds: string[] = [];
  const changedConversationIds: string[] = [];
  const removedSet = new Set(plan.removedCandidateIds);
  const changedSet = new Set(plan.changedCandidateIds);
  for (const row of pageRows) {
    const current = authorizedById.get(row.conversationId);
    if (current) {
      summaries.push(current);
      if (changedSet.has(row.conversationId)) changedConversationIds.push(row.conversationId);
      continue;
    }
    if (row.hasAccessRemoved && removedSet.has(row.conversationId)) {
      removedConversationIds.push(row.conversationId);
      changedConversationIds.push(row.conversationId);
    }
  }
  return { summaries, removedConversationIds, changedConversationIds };
}
