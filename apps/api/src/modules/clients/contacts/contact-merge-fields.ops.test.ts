import { describe, expect, it } from 'vitest';
import { resolveContactMergeFields } from './contact-merge-fields.ops';

function source(overrides: Record<string, unknown> = {}) {
  return {
    id: 'surv-1',
    firstName: 'Anna',
    lastName: 'Sargsyan',
    phone: '+37499000000',
    email: 'a@old.test',
    role: 'CLIENT',
    notes: 'Keep',
    messengerLinks: null,
    extraPhones: [{ e164: '+37499111111' }],
    ...overrides,
  };
}

describe('resolveContactMergeFields', () => {
  it('uses absorbed picks and unions extras without duplicating the primary', () => {
    const resolved = resolveContactMergeFields(
      source(),
      source({
        id: 'abs-1',
        firstName: 'Anahit',
        phone: '+37499222222',
        email: 'b@new.test',
        extraPhones: [{ e164: '+37499000000' }, { e164: '+37499333333' }],
        notes: null,
      }),
      { firstName: 'absorbed', phone: 'absorbed', email: 'absorbed' },
    );

    expect(resolved.firstName).toBe('Anahit');
    expect(resolved.phone).toBe('+37499222222');
    expect(resolved.email).toBe('b@new.test');
    expect(resolved.extraPhoneE164).toEqual(['+37499000000', '+37499111111', '+37499333333']);
    expect(resolved.notes).toBe('Keep');
  });

  it('fills an empty survivor phone from absorbed without a choice', () => {
    const resolved = resolveContactMergeFields(
      source({ phone: null, extraPhones: [] }),
      source({ id: 'abs-1', phone: '+37499222222', extraPhones: [] }),
      {},
    );
    expect(resolved.phone).toBe('+37499222222');
    expect(resolved.extraPhoneE164).toEqual([]);
  });
});
