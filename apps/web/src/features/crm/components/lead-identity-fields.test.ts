import { describe, expect, it } from 'vitest';
import { shouldHideLeadIdentityFields } from './lead-identity-fields';

describe('shouldHideLeadIdentityFields', () => {
  it('shows free-text when no Contact is linked', () => {
    expect(shouldHideLeadIdentityFields({ contactId: null, contactIds: [] })).toBe(false);
    expect(shouldHideLeadIdentityFields({ contactId: '', contactIds: [] })).toBe(false);
  });

  it('hides free-text when contactId or linked contacts exist', () => {
    expect(shouldHideLeadIdentityFields({ contactId: 'c-1', contactIds: [] })).toBe(true);
    expect(shouldHideLeadIdentityFields({ contactId: null, contactIds: ['c-2'] })).toBe(true);
  });
});
