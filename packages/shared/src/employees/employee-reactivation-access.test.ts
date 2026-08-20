import { describe, expect, it } from 'vitest';
import { canEmployeeReactivate } from './employee-reactivation-access';

describe('canEmployeeReactivate', () => {
  it('allows CEO and Founder identity, not the legacy owner slug', () => {
    expect(canEmployeeReactivate({ roleSlug: 'owner', departmentSlugs: [] })).toBe(false);
    expect(
      canEmployeeReactivate({ roleSlug: 'pm', isPlatformOwner: true, departmentSlugs: [] }),
    ).toBe(true);
    expect(canEmployeeReactivate({ roleSlug: 'ceo', departmentSlugs: [] })).toBe(true);
  });

  it('allows hr department members', () => {
    expect(canEmployeeReactivate({ roleSlug: 'pm', departmentSlugs: ['delivery', 'hr'] })).toBe(
      true,
    );
  });

  it('denies other roles without hr department', () => {
    expect(canEmployeeReactivate({ roleSlug: 'developer', departmentSlugs: ['development'] })).toBe(
      false,
    );
  });
});
