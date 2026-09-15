import { describe, expect, it } from 'vitest';
import { canEmployeeReactivate } from './employee-reactivation-access';

describe('canEmployeeReactivate', () => {
  it('allows CEO and Founder identity, not the legacy owner slug', () => {
    expect(canEmployeeReactivate({ roleSlug: 'owner', roleSlugs: ['owner'] })).toBe(false);
    expect(
      canEmployeeReactivate({ roleSlug: 'pm', isPlatformOwner: true, roleSlugs: ['pm'] }),
    ).toBe(true);
    expect(canEmployeeReactivate({ roleSlug: 'ceo', roleSlugs: ['ceo'] })).toBe(true);
  });

  it('allows the HR Manager role', () => {
    expect(canEmployeeReactivate({ roleSlug: 'hr-manager', roleSlugs: ['hr-manager'] })).toBe(true);
  });

  it('allows HR Manager held as an additional role next to another primary', () => {
    expect(canEmployeeReactivate({ roleSlug: 'pm', roleSlugs: ['pm', 'hr-manager'] })).toBe(true);
  });

  it('denies other roles', () => {
    expect(canEmployeeReactivate({ roleSlug: 'developer', roleSlugs: ['developer'] })).toBe(false);
  });

  it('no longer depends on a department, which silently broke after a rename', () => {
    expect(canEmployeeReactivate({ roleSlug: 'pm', roleSlugs: ['pm'] })).toBe(false);
  });
});
