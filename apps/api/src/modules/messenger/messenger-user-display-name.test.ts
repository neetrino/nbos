import { describe, it, expect } from 'vitest';
import { messengerUserDisplayName } from './messenger-user-display-name';
import type { CurrentUserPayload } from '../../common/decorators';

function baseUser(overrides: Partial<CurrentUserPayload> = {}): CurrentUserPayload {
  return {
    id: 'e1',
    email: 'a@b.co',
    role: 'r',
    roleLevel: 1,
    departmentIds: [],
    firstName: '',
    lastName: '',
    permissions: {},
    ...overrides,
  };
}

describe('messengerUserDisplayName', () => {
  it('uses first and last name when present', () => {
    expect(
      messengerUserDisplayName(baseUser({ firstName: 'Ann', lastName: 'Lee', email: 'ann@x.com' })),
    ).toBe('Ann Lee');
  });

  it('falls back to email when names empty', () => {
    expect(messengerUserDisplayName(baseUser({ email: 'only@x.com' }))).toBe('only@x.com');
  });
});
