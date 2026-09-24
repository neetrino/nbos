import { describe, expect, it } from 'vitest';
import {
  parseMailAccountIdsQuery,
  resolveMailAccountViewerRelation,
} from './mail-account-relation.ops';

describe('resolveMailAccountViewerRelation', () => {
  it('returns owned when the viewer owns the mailbox', () => {
    expect(
      resolveMailAccountViewerRelation({
        employeeId: 'e1',
        ownerEmployeeId: 'e1',
        hasDelegatedAccess: false,
      }),
    ).toBe('owned');
  });

  it('returns shared when the viewer has a delegated access row', () => {
    expect(
      resolveMailAccountViewerRelation({
        employeeId: 'e1',
        ownerEmployeeId: 'owner',
        hasDelegatedAccess: true,
      }),
    ).toBe('shared');
  });

  it('returns tenant when visibility is only via wide scope', () => {
    expect(
      resolveMailAccountViewerRelation({
        employeeId: 'ceo',
        ownerEmployeeId: 'owner',
        hasDelegatedAccess: false,
      }),
    ).toBe('tenant');
  });
});

describe('parseMailAccountIdsQuery', () => {
  it('returns undefined only when the param is absent', () => {
    expect(parseMailAccountIdsQuery(undefined)).toBeUndefined();
  });

  it('returns an empty list for an explicit empty param', () => {
    expect(parseMailAccountIdsQuery('')).toEqual([]);
    expect(parseMailAccountIdsQuery('  ,  ')).toEqual([]);
  });

  it('parses unique trimmed ids', () => {
    expect(parseMailAccountIdsQuery(' a, b ,a ')).toEqual(['a', 'b']);
  });
});
