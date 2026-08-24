import { describe, expect, it } from 'vitest';
import { applyCompanyLookupFill } from './apply-company-lookup-fill';

const SOURCE = {
  tin: '00161665',
  name: '«ԷՎՈԼՎԵՐ»',
  registeredAddress: 'Yerevan',
  country: 'Armenia',
};

describe('applyCompanyLookupFill', () => {
  it('fills only empty fields', () => {
    const result = applyCompanyLookupFill(
      { name: '', legalName: '', taxId: '', legalAddress: '', country: '' },
      SOURCE,
    );
    expect(result.next).toEqual({
      name: '«ԷՎՈԼՎԵՐ»',
      legalName: '«ԷՎՈԼՎԵՐ»',
      taxId: '00161665',
      legalAddress: 'Yerevan',
      country: 'Armenia',
    });
    expect(result.filled).toEqual(['taxId', 'legalName', 'name', 'legalAddress', 'country']);
  });

  it('does not overwrite occupied fields after the user already filled them', () => {
    const result = applyCompanyLookupFill(
      {
        name: 'Working name',
        legalName: 'Already confirmed LLC',
        taxId: '',
        legalAddress: 'Custom address',
        country: 'Georgia',
      },
      SOURCE,
    );
    expect(result.next).toEqual({
      name: 'Working name',
      legalName: 'Already confirmed LLC',
      taxId: '00161665',
      legalAddress: 'Custom address',
      country: 'Georgia',
    });
    expect(result.filled).toEqual(['taxId']);
  });
});
