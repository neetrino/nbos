import { describe, expect, it } from 'vitest';
import {
  buildRecentConversationCards,
  pickRecentConversationGroups,
  type RecentConnection,
} from './active-call-recent';

function row(id: string, lid: string | null, createdAt: string, billsec: string): RecentConnection {
  return {
    id,
    lid,
    calldirect: '0',
    state: 'finish',
    createdAt: new Date(createdAt),
    billsec,
  };
}

describe('active call recent conversations', () => {
  it('collapses one LID and leaves unrelated calls separate', () => {
    const scanned = [
      row('call-new', 'L-9', '2026-09-26T09:05:00.000Z', '40'),
      row('call-old', 'L-9', '2026-09-26T09:00:00.000Z', '12'),
      row('call-other', 'L-8', '2026-09-26T08:00:00.000Z', '3'),
      row('call-plain', null, '2026-09-26T07:00:00.000Z', '1'),
    ];
    const picked = pickRecentConversationGroups(scanned, 5);
    const earliest = row('call-earliest', 'L-9', '2026-09-26T08:30:00.000Z', '7');
    const cards = buildRecentConversationCards(picked, [earliest, ...scanned]);

    expect(cards.map((card) => card.id)).toEqual(['call-earliest', 'call-other', 'call-plain']);
    expect(cards[0]).toMatchObject({ durationSec: 40, phase: 'ended' });
  });
});
