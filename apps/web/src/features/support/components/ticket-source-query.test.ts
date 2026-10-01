import { describe, expect, it } from 'vitest';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import { ticketSourceMessageCacheMatches } from './ticket-source-query';

describe('ticket source cache match', () => {
  it('matches a source conversation message cache and ignores other keys', () => {
    expect(ticketSourceMessageCacheMatches(messengerQueryKeys.messages('conv-1'), ['conv-1'])).toBe(
      true,
    );
    expect(ticketSourceMessageCacheMatches(messengerQueryKeys.messages('conv-2'), ['conv-1'])).toBe(
      false,
    );
    expect(ticketSourceMessageCacheMatches(['support', 'ticket-sources', 't1'], ['conv-1'])).toBe(
      false,
    );
  });
});
