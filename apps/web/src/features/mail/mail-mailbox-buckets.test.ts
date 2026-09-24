import { describe, expect, it } from 'vitest';
import {
  applyMailboxListOrder,
  moveMailboxToBucket,
  partitionMailAccountsByBucket,
  placeMailboxInList,
  resolveMailboxBucket,
  type MailMailboxListOverrides,
} from './mail-mailbox-buckets';

const EMPTY: MailMailboxListOverrides = {
  pinToMy: [],
  pinToCompany: [],
  myOrder: [],
  companyOrder: [],
  companyExpanded: false,
};

describe('resolveMailboxBucket', () => {
  it('defaults owned/shared to My and tenant to Company', () => {
    expect(resolveMailboxBucket('a', 'owned', EMPTY)).toBe('my');
    expect(resolveMailboxBucket('a', 'shared', EMPTY)).toBe('my');
    expect(resolveMailboxBucket('a', 'tenant', EMPTY)).toBe('company');
  });

  it('honors pin overrides', () => {
    expect(resolveMailboxBucket('t1', 'tenant', { ...EMPTY, pinToMy: ['t1'] })).toBe('my');
    expect(resolveMailboxBucket('o1', 'owned', { ...EMPTY, pinToCompany: ['o1'] })).toBe('company');
  });
});

describe('partitionMailAccountsByBucket', () => {
  it('splits accounts into My and Company', () => {
    const result = partitionMailAccountsByBucket(
      [
        { id: 'mine', relation: 'owned' },
        { id: 'shared', relation: 'shared' },
        { id: 'other', relation: 'tenant' },
      ],
      EMPTY,
    );
    expect(result.my.map((row) => row.id)).toEqual(['mine', 'shared']);
    expect(result.company.map((row) => row.id)).toEqual(['other']);
  });

  it('applies myOrder when present', () => {
    const result = partitionMailAccountsByBucket(
      [
        { id: 'a', relation: 'owned' },
        { id: 'b', relation: 'owned' },
        { id: 'c', relation: 'owned' },
      ],
      { ...EMPTY, myOrder: ['c', 'a'] },
    );
    expect(result.my.map((row) => row.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('applyMailboxListOrder', () => {
  it('keeps unknown order ids ignored and appends missing accounts', () => {
    expect(
      applyMailboxListOrder([{ id: 'a' }, { id: 'b' }], ['x', 'b', 'a']).map((row) => row.id),
    ).toEqual(['b', 'a']);
  });
});

describe('placeMailboxInList', () => {
  it('reorders within My before a target id', () => {
    const next = placeMailboxInList(EMPTY, 'c', 'owned', 'my', 'a', ['a', 'b', 'c'], []);
    expect(next.myOrder).toEqual(['c', 'a', 'b']);
  });

  it('moves from Company into My at the end', () => {
    const next = placeMailboxInList(EMPTY, 't1', 'tenant', 'my', null, ['a'], ['t1']);
    expect(next.pinToMy).toEqual(['t1']);
    expect(next.myOrder).toEqual(['a', 't1']);
    expect(next.companyOrder).toEqual([]);
  });
});

describe('moveMailboxToBucket', () => {
  it('pins a tenant mailbox into My', () => {
    expect(moveMailboxToBucket(EMPTY, 't1', 'tenant', 'my', [], ['t1'])).toEqual({
      ...EMPTY,
      pinToMy: ['t1'],
      myOrder: ['t1'],
      companyOrder: [],
    });
  });

  it('clears pins when returning to the natural bucket', () => {
    const pinned = moveMailboxToBucket(EMPTY, 't1', 'tenant', 'my', [], ['t1']);
    expect(moveMailboxToBucket(pinned, 't1', 'tenant', 'company', ['t1'], [])).toEqual({
      ...EMPTY,
      companyOrder: ['t1'],
      myOrder: [],
    });
  });
});
