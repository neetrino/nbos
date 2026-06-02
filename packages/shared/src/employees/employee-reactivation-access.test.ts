import { describe, expect, it } from 'vitest';
import { canEmployeeReactivate } from './employee-reactivation-access';

describe('canEmployeeReactivate', () => {
  it('allows owner and ceo roles', () => {
    expect(canEmployeeReactivate({ roleSlug: 'owner', departmentSlugs: [] })).toBe(true);
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
