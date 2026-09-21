import { describe, expect, it } from 'vitest';
import { groupProfileRows } from './group-profile-rows';
import type { DeliveryBaseProfileFinancialDto } from '@nbos/shared';
import type { BaseProfileLabelDictionaries } from './base-profile-label';

const LABELS = {
  productTypes: {
    COMPANY_WEBSITE: 'Корпоративный сайт',
    CRM: 'CRM',
  },
} as unknown as BaseProfileLabelDictionaries;

function row(id: string, profileKey: string): DeliveryBaseProfileFinancialDto {
  return {
    id,
    profileKey,
    version: 1,
    status: 'DRAFT',
    roleUnits: [],
    includedFunctionIds: [],
  };
}

describe('groupProfileRows', () => {
  it('groups one published core per product kind', () => {
    const groups = groupProfileRows([row('1', 'company-site-code'), row('2', 'crm-code')], LABELS);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.kindId).toBe('COMPANY_WEBSITE');
    expect(groups[0]?.title).toBe('Корпоративный сайт');
    expect(groups[0]?.productType).toBe('COMPANY_WEBSITE');
    expect(groups[0]?.rows).toHaveLength(1);
    expect(groups[1]?.kindId).toBe('CRM');
  });

  it('does not offer the retired mobile-app core', () => {
    const groups = groupProfileRows(
      [row('1', 'company-site-code'), row('2', 'mobile-app-code')],
      LABELS,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]?.kindId).toBe('COMPANY_WEBSITE');
  });
});
