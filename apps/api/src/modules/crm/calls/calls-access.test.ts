import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { assertCanListCalls, resolveCallListParent } from './calls-access';

const LEAD_VIEW = { CRM_LEADS_VIEW: 'OWN' };
const DEAL_VIEW = { CRM_DEALS_VIEW: 'ALL' };
const NONE = { CRM_LEADS_VIEW: 'NONE', CRM_DEALS_VIEW: 'NONE' };

describe('resolveCallListParent', () => {
  it('requires exactly one parent id', () => {
    expect(resolveCallListParent({ leadId: 'lead-1' })).toBe('lead');
    expect(resolveCallListParent({ contactId: 'c1' })).toBe('contact');
    expect(resolveCallListParent({ dealId: 'd1' })).toBe('deal');
    expect(() => resolveCallListParent({})).toThrow(BadRequestException);
    expect(() => resolveCallListParent({ leadId: 'l1', dealId: 'd1' })).toThrow(
      BadRequestException,
    );
  });
});

describe('assertCanListCalls', () => {
  it('uses existing CRM VIEW permissions as a module gate', () => {
    expect(() => assertCanListCalls(LEAD_VIEW, 'lead')).not.toThrow();
    expect(() => assertCanListCalls(DEAL_VIEW, 'deal')).not.toThrow();
    expect(() => assertCanListCalls(LEAD_VIEW, 'contact')).not.toThrow();
    expect(() => assertCanListCalls(NONE, 'lead')).toThrow(ForbiddenException);
    expect(() => assertCanListCalls(LEAD_VIEW, 'deal')).toThrow(ForbiddenException);
  });
});
