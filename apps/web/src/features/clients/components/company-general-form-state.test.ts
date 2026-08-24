import { describe, expect, it } from 'vitest';
import { buildCompanyGeneralPatch, type CompanyGeneralDraft } from './company-general-form-state';

function draft(overrides: Partial<CompanyGeneralDraft> = {}): CompanyGeneralDraft {
  return {
    name: 'Saribekyan',
    type: 'LEGAL',
    taxId: '01234567',
    legalName: 'ООО Сарибекян',
    legalAddress: '',
    notes: '',
    phone: '',
    email: '',
    country: '',
    contactIds: [],
    contactLabels: {},
    billingContactId: '',
    billingContactLabel: '',
    ...overrides,
  };
}

describe('buildCompanyGeneralPatch', () => {
  it('patches legalName independently of display name', () => {
    const snap = draft();
    const patch = buildCompanyGeneralPatch(
      snap,
      draft({ name: 'Saribekyan', legalName: 'Saribekyan LLC' }),
    );
    expect(patch).toEqual({ legalName: 'Saribekyan LLC' });
  });

  it('allows clearing legalName and saving without a contact', () => {
    const snap = draft({ contactIds: ['c1'], contactLabels: { c1: 'Anna' } });
    const patch = buildCompanyGeneralPatch(
      snap,
      draft({ legalName: '', contactIds: [], contactLabels: {} }),
    );
    expect(patch).toEqual({ legalName: null, contactIds: [] });
  });
});
