import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { assertCallCreatePermission, hasCallCreatePermission } from './click-to-call-access';

const LEAD_EDIT = { CRM_LEADS_EDIT: 'OWN', CRM_LEADS_VIEW: 'OWN' };
const DEAL_EDIT = { CRM_DEALS_EDIT: 'ALL' };
const VIEW_ONLY = { CRM_LEADS_VIEW: 'ALL', CRM_LEADS_EDIT: 'NONE' };

describe('hasCallCreatePermission', () => {
  it('maps CALL_CREATE to CRM EDIT on the parent', () => {
    expect(hasCallCreatePermission(LEAD_EDIT, 'lead')).toBe(true);
    expect(hasCallCreatePermission(DEAL_EDIT, 'deal')).toBe(true);
    expect(hasCallCreatePermission(LEAD_EDIT, 'contact')).toBe(true);
    expect(hasCallCreatePermission(VIEW_ONLY, 'lead')).toBe(false);
    expect(hasCallCreatePermission(VIEW_ONLY, 'contact')).toBe(false);
  });

  it('does not treat Contact OWN permission as object-level access by itself', () => {
    expect(hasCallCreatePermission({ CRM_LEADS_EDIT: 'OWN' }, 'contact')).toBe(true);
  });
});

describe('assertCallCreatePermission', () => {
  it('forbids a user without CALL_CREATE', () => {
    expect(() => assertCallCreatePermission(VIEW_ONLY, 'lead')).toThrow(ForbiddenException);
  });
});
