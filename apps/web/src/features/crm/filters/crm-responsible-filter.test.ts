import { describe, expect, it } from 'vitest';
import {
  CRM_RESPONSIBLE_ME,
  CRM_RESPONSIBLE_ME_ASSISTANT,
  CRM_RESPONSIBLE_ME_SELLER,
  buildCrmResponsibleFilterOptions,
  resolveDealResponsibilityQuery,
  resolveLeadAssignedToFilter,
} from './crm-responsible-filter';

const employees = [
  { id: 'emp-me', label: 'Ada Seller' },
  { id: 'emp-2', label: 'Ivan Petrov' },
];

describe('buildCrmResponsibleFilterOptions', () => {
  it('adds Me for leads and skips the current employee in the list', () => {
    const options = buildCrmResponsibleFilterOptions('lead', employees, 'emp-me');
    expect(options).toEqual([
      { value: CRM_RESPONSIBLE_ME, label: 'Me' },
      { value: 'emp-2', label: 'Ivan Petrov' },
    ]);
  });

  it('adds role shortcuts for deals', () => {
    const options = buildCrmResponsibleFilterOptions('deal', employees, 'emp-me');
    expect(options.map((option) => option.value)).toEqual([
      CRM_RESPONSIBLE_ME,
      CRM_RESPONSIBLE_ME_SELLER,
      CRM_RESPONSIBLE_ME_ASSISTANT,
      'emp-2',
    ]);
  });

  it('omits Me shortcuts when the current employee is unknown', () => {
    const options = buildCrmResponsibleFilterOptions('deal', employees, null);
    expect(options).toEqual([
      { value: 'emp-me', label: 'Ada Seller' },
      { value: 'emp-2', label: 'Ivan Petrov' },
    ]);
  });
});

describe('resolveLeadAssignedToFilter', () => {
  it('maps Me to the current employee', () => {
    expect(resolveLeadAssignedToFilter(CRM_RESPONSIBLE_ME, 'emp-me')).toBe('emp-me');
  });

  it('maps a seller id through', () => {
    expect(resolveLeadAssignedToFilter('emp-2', 'emp-me')).toBe('emp-2');
  });

  it('ignores empty and deal-only tokens', () => {
    expect(resolveLeadAssignedToFilter('all', 'emp-me')).toBeUndefined();
    expect(resolveLeadAssignedToFilter(CRM_RESPONSIBLE_ME_SELLER, 'emp-me')).toBeUndefined();
  });
});

describe('resolveDealResponsibilityQuery', () => {
  it('maps Me to involved employee', () => {
    expect(resolveDealResponsibilityQuery(CRM_RESPONSIBLE_ME, 'emp-me')).toEqual({
      involvedEmployeeId: 'emp-me',
    });
  });

  it('maps role shortcuts', () => {
    expect(resolveDealResponsibilityQuery(CRM_RESPONSIBLE_ME_SELLER, 'emp-me')).toEqual({
      sellerId: 'emp-me',
    });
    expect(resolveDealResponsibilityQuery(CRM_RESPONSIBLE_ME_ASSISTANT, 'emp-me')).toEqual({
      sellerAssistantId: 'emp-me',
    });
  });

  it('maps a picked employee to seller', () => {
    expect(resolveDealResponsibilityQuery('emp-2', 'emp-me')).toEqual({ sellerId: 'emp-2' });
  });
});
