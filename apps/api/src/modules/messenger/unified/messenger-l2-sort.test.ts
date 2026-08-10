import { describe, expect, it } from 'vitest';
import { sortMessengerProjectTopics } from './messenger-l2-sort';
import type { MessengerL2ConversationDto } from './messenger-unified.types';

function row(
  partial: Partial<MessengerL2ConversationDto> & Pick<MessengerL2ConversationDto, 'id' | 'type'>,
): MessengerL2ConversationDto {
  return {
    title: partial.title ?? partial.id,
    status: 'ACTIVE',
    lastMessageAt: partial.lastMessageAt ?? null,
    lastMessagePreview: null,
    unreadCount: 0,
    primaryEntityType: null,
    primaryEntityId: null,
    peerEmployeeId: null,
    ...partial,
  };
}

describe('sortMessengerProjectTopics', () => {
  it('pins PROJECT_GENERAL first even with older activity', () => {
    const sorted = sortMessengerProjectTopics([
      row({
        id: 'product',
        type: 'PRODUCT',
        lastMessageAt: '2026-08-10T12:00:00.000Z',
      }),
      row({
        id: 'general',
        type: 'PROJECT_GENERAL',
        lastMessageAt: '2026-01-01T00:00:00.000Z',
      }),
      row({
        id: 'deal',
        type: 'DEAL',
        lastMessageAt: '2026-08-09T12:00:00.000Z',
      }),
    ]);
    expect(sorted.map((r) => r.id)).toEqual(['general', 'product', 'deal']);
  });

  it('uses id as deterministic tie-breaker', () => {
    const sorted = sortMessengerProjectTopics([
      row({ id: 'b', type: 'TASK', lastMessageAt: null }),
      row({ id: 'a', type: 'TASK', lastMessageAt: null }),
    ]);
    expect(sorted.map((r) => r.id)).toEqual(['a', 'b']);
  });
});
