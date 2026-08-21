import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { assertCanCreateCall, hasCallCreatePermission } from './click-to-call-access';

const LEAD_EDIT = { CRM_LEADS_EDIT: 'OWN', CRM_LEADS_VIEW: 'OWN' };
const DEAL_EDIT = { CRM_DEALS_EDIT: 'ALL' };
const VIEW_ONLY = { CRM_LEADS_VIEW: 'ALL', CRM_LEADS_EDIT: 'NONE' };

describe('hasCallCreatePermission', () => {
  it('maps CALL_CREATE to CRM EDIT on the parent', () => {
    expect(hasCallCreatePermission(LEAD_EDIT, 'lead')).toBe(true);
    expect(hasCallCreatePermission(DEAL_EDIT, 'deal')).toBe(true);
    expect(hasCallCreatePermission(LEAD_EDIT, 'contact')).toBe(true);
    expect(hasCallCreatePermission(VIEW_ONLY, 'lead')).toBe(false);
  });
});

describe('assertCanCreateCall', () => {
  it('allows an authorized user', () => {
    expect(() =>
      assertCanCreateCall(
        { id: 'emp-1', permissions: LEAD_EDIT },
        { parent: 'lead', assignedEmployeeIds: ['emp-1'] },
      ),
    ).not.toThrow();
  });

  it('forbids a user without CALL_CREATE', () => {
    expect(() =>
      assertCanCreateCall(
        { id: 'emp-1', permissions: VIEW_ONLY },
        { parent: 'lead', assignedEmployeeIds: ['emp-1'] },
      ),
    ).toThrow(ForbiddenException);
  });

  it('forbids OWN-scope access to someone else Lead', () => {
    expect(() =>
      assertCanCreateCall(
        { id: 'emp-1', permissions: LEAD_EDIT },
        { parent: 'lead', assignedEmployeeIds: ['emp-2'] },
      ),
    ).toThrow(ForbiddenException);
  });
});
