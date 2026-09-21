import { describe, expect, it } from 'vitest';
import {
  groupProfileRows,
  profileRowMatchingSize,
  resolveSelectedSize,
} from './group-profile-rows';
import type { DeliveryBaseProfileFinancialDto } from '@nbos/shared';
import type { BaseProfileLabelDictionaries } from './base-profile-label';

const LABELS = {
  productTypes: {
    COMPANY_WEBSITE: 'Корпоративный сайт',
    CRM: 'CRM',
  },
  sizes: {
    SMALL: 'Small',
    CLASSIC: 'Classic',
    LARGE: 'Large',
    VERY_LARGE: 'Very large',
    ENTERPRISE: 'Enterprise',
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
  it('groups seeded size keys into one product kind', () => {
    const groups = groupProfileRows(
      [
        row('1', 'company-site-code-classic'),
        row('2', 'company-site-code-small'),
        row('3', 'crm-code-classic'),
      ],
      LABELS,
    );
    expect(groups).toHaveLength(2);
    expect(groups[0]?.kindId).toBe('COMPANY_WEBSITE');
    expect(groups[0]?.title).toBe('Корпоративный сайт');
    expect(groups[0]?.rows).toHaveLength(2);
    expect(groups[1]?.kindId).toBe('CRM');
  });
});

describe('profileRowMatchingSize', () => {
  it('picks the row whose key carries that size', () => {
    const [group] = groupProfileRows(
      [row('1', 'crm-code-classic'), row('2', 'crm-code-small')],
      LABELS,
    );
    expect(group).toBeDefined();
    if (!group) {
      return;
    }
    expect(profileRowMatchingSize(group, 'SMALL')?.id).toBe('2');
    expect(profileRowMatchingSize(group, 'CLASSIC')?.id).toBe('1');
    expect(profileRowMatchingSize(group, 'LARGE')).toBeNull();
  });
});

describe('resolveSelectedSize', () => {
  it('keeps the size when that profile exists and otherwise falls back to the first present size', () => {
    const [group] = groupProfileRows(
      [row('1', 'crm-code-classic'), row('2', 'crm-code-small')],
      LABELS,
    );
    expect(group).toBeDefined();
    if (!group) {
      return;
    }
    expect(resolveSelectedSize(group, 'CLASSIC')).toBe('CLASSIC');
    expect(resolveSelectedSize(group, 'LARGE')).toBe('SMALL');
  });
});
