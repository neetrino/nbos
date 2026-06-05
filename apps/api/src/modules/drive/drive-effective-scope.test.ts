import { describe, expect, it } from 'vitest';
import { mergeDriveEffectiveScope } from './drive-effective-scope';

describe('mergeDriveEffectiveScope', () => {
  it('uses RBAC scope when policy is ALL', () => {
    expect(mergeDriveEffectiveScope('ALL', 'ALL')).toBe('ALL');
    expect(mergeDriveEffectiveScope('DEPARTMENT', 'ALL')).toBe('DEPARTMENT');
    expect(mergeDriveEffectiveScope('OWN', 'ALL')).toBe('OWN');
  });

  it('narrows ALL and DEPARTMENT to OWN when policy is ASSIGNED', () => {
    expect(mergeDriveEffectiveScope('ALL', 'ASSIGNED')).toBe('OWN');
    expect(mergeDriveEffectiveScope('DEPARTMENT', 'ASSIGNED')).toBe('OWN');
    expect(mergeDriveEffectiveScope('OWN', 'ASSIGNED')).toBe('OWN');
  });

  it('preserves ALL for global owner role when policy is ASSIGNED', () => {
    expect(mergeDriveEffectiveScope('ALL', 'ASSIGNED', { globalOwnerRole: true })).toBe('ALL');
    expect(mergeDriveEffectiveScope('DEPARTMENT', 'ASSIGNED', { globalOwnerRole: true })).toBe(
      'OWN',
    );
  });

  it('narrows to OWN when policy is NONE', () => {
    expect(mergeDriveEffectiveScope('ALL', 'NONE')).toBe('OWN');
    expect(mergeDriveEffectiveScope('DEPARTMENT', 'NONE')).toBe('OWN');
  });

  it('defaults invalid RBAC to OWN', () => {
    expect(mergeDriveEffectiveScope(undefined, 'ALL')).toBe('OWN');
    expect(mergeDriveEffectiveScope('TEAM', 'ALL')).toBe('OWN');
  });
});
