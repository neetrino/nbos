import { describe, expect, it } from 'vitest';
import type { ArmeniaCompanyLookupItem } from '@/lib/api/clients';
import { presentArmeniaLookupResults } from './use-company-armenia-lookup';

function item(tin: string, name: string): ArmeniaCompanyLookupItem {
  return {
    tin,
    name,
    legalForm: 'ՍՊԸ',
    registeredAddress: 'Yerevan',
    registrationDate: '2017-01-11',
    status: 'Գործող',
    isActive: true,
    activityCode: null,
    country: 'Armenia',
  };
}

describe('presentArmeniaLookupResults', () => {
  it('does not treat a single match as an auto-fill', () => {
    const presented = presentArmeniaLookupResults([item('00161665', '«ԷՎՈԼՎԵՐ»')]);
    expect(presented.matches).toHaveLength(1);
    expect(presented.notice).toContain('Review, then fill');
  });

  it('keeps several matches for the user to choose', () => {
    const presented = presentArmeniaLookupResults([
      item('01067855', '«ԷՎՈԼՎԵՐ ԿԱՊԻՏԱԼ»'),
      item('00161665', '«ԷՎՈԼՎԵՐ»'),
    ]);
    expect(presented.matches).toHaveLength(2);
    expect(presented.notice).toContain('Several matches');
  });

  it('reports not found without matches', () => {
    const presented = presentArmeniaLookupResults([]);
    expect(presented.matches).toEqual([]);
    expect(presented.notice).toContain('No company found');
  });
});
