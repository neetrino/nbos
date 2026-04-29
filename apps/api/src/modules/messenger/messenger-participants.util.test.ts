import { describe, it, expect } from 'vitest';
import { orderedParticipantIds } from './messenger-participants.util';

describe('orderedParticipantIds', () => {
  it('orders two UUIDs lexicographically', () => {
    const x = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const y = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    expect(orderedParticipantIds(x, y)).toEqual([y, x]);
    expect(orderedParticipantIds(y, x)).toEqual([y, x]);
  });

  it('returns stable pair for equal ids', () => {
    const id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    expect(orderedParticipantIds(id, id)).toEqual([id, id]);
  });
});
