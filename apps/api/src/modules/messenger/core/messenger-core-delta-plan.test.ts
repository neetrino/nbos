import { describe, expect, it } from 'vitest';
import { assembleMessengerDeltaPage } from './messenger-core-delta-assemble';
import { planMessengerDeltaHydration } from './messenger-core-delta-plan';
import type { MessengerDeltaChangeRow } from './messenger-core-revision.types';

function change(
  conversationId: string,
  revision: string,
  extras: Partial<MessengerDeltaChangeRow>,
): MessengerDeltaChangeRow {
  return {
    conversationId,
    revision,
    changeKind: 'CONVERSATION',
    lane: 'G',
    hasConversation: false,
    hasAccessRemoved: false,
    ...extras,
  };
}

describe('Messenger delta hydration plan', () => {
  it('keeps ACCESS_REMOVED after a newer global and purges when still denied', () => {
    const rows = [
      change('lost', '6', {
        changeKind: 'ACCESS_REMOVED',
        lane: 'T',
        hasConversation: true,
        hasAccessRemoved: true,
      }),
    ];
    const assembled = assembleMessengerDeltaPage(rows, planMessengerDeltaHydration(rows), []);
    expect(assembled.summaries).toEqual([]);
    expect(assembled.removedConversationIds).toEqual(['lost']);
    expect(assembled.changedConversationIds).toEqual(['lost']);
  });

  it('returns a current summary instead of purge when access has returned', () => {
    const rows = [
      change('lost', '6', {
        changeKind: 'ACCESS_REMOVED',
        lane: 'T',
        hasConversation: true,
        hasAccessRemoved: true,
      }),
    ];
    const assembled = assembleMessengerDeltaPage(rows, planMessengerDeltaHydration(rows), [
      { id: 'lost', title: 'restored' },
    ]);
    expect(assembled.summaries).toEqual([{ id: 'lost', title: 'restored' }]);
    expect(assembled.removedConversationIds).toEqual([]);
    expect(assembled.changedConversationIds).toEqual(['lost']);
  });

  it('returns a summary and thread invalidation for targeted read plus a newer global', () => {
    const rows = [
      change('a', '8', { changeKind: 'READ', lane: 'T', hasConversation: true }),
    ];
    const assembled = assembleMessengerDeltaPage(rows, planMessengerDeltaHydration(rows), [
      { id: 'a', title: 'visible' },
    ]);
    expect(assembled.summaries.map((row) => row.id)).toEqual(['a']);
    expect(assembled.changedConversationIds).toEqual(['a']);
    expect(assembled.removedConversationIds).toEqual([]);
  });

  it('does not leak an inaccessible global conversation id without targeted remove', () => {
    const rows = [change('secret', '5', { hasConversation: true })];
    const assembled = assembleMessengerDeltaPage(rows, planMessengerDeltaHydration(rows), []);
    expect(assembled.summaries).toEqual([]);
    expect(assembled.removedConversationIds).toEqual([]);
    expect(assembled.changedConversationIds).toEqual([]);
  });
});
