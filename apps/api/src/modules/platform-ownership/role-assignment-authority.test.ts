import { describe, expect, it } from 'vitest';
import { roleAssignmentAuthority } from './role-assignment-authority';

describe('roleAssignmentAuthority', () => {
  it('uses only the primary role for governance authority', () => {
    expect(roleAssignmentAuthority('seller')).toBe('seller');
    expect(roleAssignmentAuthority('ceo')).toBe('ceo');
  });
});
