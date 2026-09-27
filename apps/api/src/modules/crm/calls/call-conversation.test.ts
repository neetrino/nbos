import { describe, expect, it } from 'vitest';
import {
  callConversationKey,
  conversationPhase,
  groupCallConversations,
  mergeCallConversation,
  pageConversationGroups,
  type CallConversationRow,
} from './call-conversation';

const START = new Date('2026-09-26T10:00:00.000Z');
const LATER = new Date('2026-09-26T10:00:05.000Z');

function row(
  overrides: Partial<CallConversationRow> & Pick<CallConversationRow, 'id' | 'uid'>,
): CallConversationRow {
  return {
    calldirect: '0',
    phone: '+37499123456',
    clid: '+37499123456',
    state: 'finish',
    billsec: '10',
    disposition: 'NO ANSWER',
    rate: null,
    leadId: null,
    contactId: null,
    dealId: null,
    responsibleEmployeeId: null,
    answeredEmployeeId: null,
    note: null,
    recordingStatus: null,
    createdAt: START,
    updatedAt: START,
    lid: null,
    ...overrides,
  };
}

describe('call conversations', () => {
  it('returns one card for two UIDs that share a LID', () => {
    const trunk = row({
      id: 'call-trunk',
      uid: 'uid-trunk',
      lid: 'L-1',
      state: 'finish',
      billsec: '3',
      contactId: 'contact-1',
      contact: { firstName: 'John', lastName: 'Smith' },
      responsibleEmployeeId: 'emp-route',
      responsibleEmployee: { firstName: 'Route', lastName: 'Owner' },
      recordingStatus: 'READY',
    });
    const answered = row({
      id: 'call-agent',
      uid: 'uid-agent',
      lid: 'L-1',
      createdAt: LATER,
      updatedAt: LATER,
      state: 'finish',
      billsec: '42',
      disposition: 'ANSWERED',
      answeredEmployeeId: 'emp-anna',
      answeredEmployee: { firstName: 'Anna', lastName: 'Petrosyan' },
      contactId: null,
      phone: null,
      clid: null,
      note: 'Asked about the proposal',
    });

    const [card] = groupCallConversations([answered, trunk]).map(mergeCallConversation);

    expect(card).toMatchObject({
      id: 'call-trunk',
      uid: 'uid-trunk',
      contactId: 'contact-1',
      answeredEmployeeId: 'emp-anna',
      responsibleEmployeeId: 'emp-route',
      state: 'finish',
      billsec: '42',
      disposition: 'ANSWERED',
      note: 'Asked about the proposal',
      recordingStatus: 'READY',
      createdAt: START,
    });
    expect(card?.contact?.firstName).toBe('John');
    expect(card?.answeredEmployee?.firstName).toBe('Anna');
  });

  it('keeps unrelated conversations separate, including matching phones', () => {
    const sharedPhone = '+37499123456';
    const rows = [
      row({ id: 'a', uid: 'ua', lid: 'L-1', phone: sharedPhone, createdAt: START }),
      row({ id: 'b', uid: 'ub', lid: 'L-2', phone: sharedPhone, createdAt: LATER }),
      row({ id: 'c', uid: 'uc', lid: null, phone: sharedPhone, createdAt: START }),
      row({ id: 'd', uid: 'ud', lid: '   ', phone: sharedPhone, createdAt: LATER }),
    ];

    const cards = groupCallConversations(rows).map(mergeCallConversation);

    expect(cards).toHaveLength(4);
    expect(cards.map((card) => card.id).sort()).toEqual(['a', 'b', 'c', 'd']);
    expect(callConversationKey(rows[2]!)).toBe('id:c');
    expect(callConversationKey(rows[3]!)).not.toBe(callConversationKey(rows[2]!));
  });

  it('does not group a repeated missing LID with a nearby call', () => {
    const first = row({ id: 'one', uid: 'u1', lid: null, createdAt: START });
    const second = row({ id: 'two', uid: 'u2', lid: undefined, createdAt: LATER });
    expect(groupCallConversations([first, second])).toHaveLength(2);
  });

  it('keeps each employee connection on the card', () => {
    const starter = row({
      id: 'start',
      uid: 'u-start',
      lid: 'L-9',
      initiatedByEmployeeId: 'emp-start',
      initiatedByEmployee: { firstName: 'Start', lastName: 'User' },
      calldirect: '1',
    });
    const answer = row({
      id: 'answer',
      uid: 'u-answer',
      lid: 'L-9',
      createdAt: LATER,
      answeredEmployeeId: 'emp-answer',
      answeredEmployee: { firstName: 'Answer', lastName: 'User' },
      disposition: 'ANSWERED',
      billsec: '15',
    });

    const card = mergeCallConversation([starter, answer]);
    expect(card.initiatedByEmployeeId).toBe('emp-start');
    expect(card.answeredEmployeeId).toBe('emp-answer');
    expect(card.id).toBe('start');
  });

  it('paginates conversations and keeps the card id stable', () => {
    const groups = groupCallConversations([
      row({ id: 'new', uid: 'u-new', lid: 'L-new', createdAt: LATER }),
      row({ id: 'old-a', uid: 'u-old-a', lid: 'L-old', createdAt: START }),
      row({ id: 'old-b', uid: 'u-old-b', lid: 'L-old', createdAt: LATER }),
      row({ id: 'mid', uid: 'u-mid', lid: null, createdAt: new Date('2026-09-26T10:00:02.000Z') }),
    ]);
    const page = pageConversationGroups(groups, 2, 1);
    const again = pageConversationGroups(groups, 2, 1);

    expect(page.total).toBe(3);
    expect(page.totalPages).toBe(3);
    expect(page.groups[0]?.map((item) => item.id)).toEqual(again.groups[0]?.map((item) => item.id));
    expect(mergeCallConversation(page.groups[0] ?? []).id).toBe('mid');
  });

  it('stays ringing until every connection has ended', () => {
    expect(conversationPhase([{ state: 'finish' }, { state: 'status' }])).toBe('answered');
    expect(conversationPhase([{ state: 'finish' }, { state: 'finish' }])).toBe('ended');
    expect(conversationPhase([{ state: 'start' }, { state: 'start' }])).toBe('ringing');
  });
});
