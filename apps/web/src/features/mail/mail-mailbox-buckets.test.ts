import { describe, expect, it } from 'vitest';
import {
  moveMailboxToBucket,
  partitionMailAccountsByBucket,
  resolveMailboxBucket,
  type MailMailboxListOverrides,
} from './mail-mailbox-buckets';

const EMPTY: MailMailboxListOverrides = {
  pinToMy: [],
  pinToCompany: [],
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
});

describe('moveMailboxToBucket', () => {
  it('pins a tenant mailbox into My', () => {
    expect(moveMailboxToBucket(EMPTY, 't1', 'tenant', 'my')).toEqual({
      ...EMPTY,
      pinToMy: ['t1'],
    });
  });

  it('clears pins when returning to the natural bucket', () => {
    const pinned = moveMailboxToBucket(EMPTY, 't1', 'tenant', 'my');
    expect(moveMailboxToBucket(pinned, 't1', 'tenant', 'company')).toEqual(EMPTY);
  });
});
