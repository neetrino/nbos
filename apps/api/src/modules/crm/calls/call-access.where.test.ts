import { describe, expect, it } from 'vitest';
import {
  buildCallAccessWhere,
  buildCallParentWhere,
  CALL_ACCESS_DENIED_WHERE,
  mergeCallListWhere,
  normalizeCallRbacScope,
} from './call-access.where';
import { ACTOR_ID, COLLEAGUE_ID, OTHER_EMPLOYEE_ID } from './call-access.test-support';

const OWN_PARAMS = {
  leadsScope: 'OWN' as const,
  dealsScope: 'OWN' as const,
  actorId: ACTOR_ID,
  departmentEmployeeIds: [] as string[],
};

describe('normalizeCallRbacScope', () => {
  it('treats blank and unknown values as NONE', () => {
    expect(normalizeCallRbacScope(undefined)).toBe('NONE');
    expect(normalizeCallRbacScope('')).toBe('NONE');
    expect(normalizeCallRbacScope('team')).toBe('NONE');
    expect(normalizeCallRbacScope('department')).toBe('DEPARTMENT');
  });
});

describe('buildCallAccessWhere', () => {
  it('denies when both CRM modules are NONE', () => {
    expect(
      buildCallAccessWhere({
        ...OWN_PARAMS,
        leadsScope: 'NONE',
        dealsScope: 'NONE',
      }),
    ).toEqual(CALL_ACCESS_DENIED_WHERE);
  });

  it('allows every call when both modules are ALL', () => {
    expect(
      buildCallAccessWhere({
        ...OWN_PARAMS,
        leadsScope: 'ALL',
        dealsScope: 'ALL',
      }),
    ).toEqual({});
  });

  it('OWN matches assigned Lead, Deal seller/assistant, and Call employees', () => {
    expect(buildCallAccessWhere(OWN_PARAMS)).toEqual({
      OR: [
        { lead: { assignedTo: { in: [ACTOR_ID] } } },
        {
          deal: {
            OR: [{ sellerId: { in: [ACTOR_ID] } }, { sellerAssistantId: { in: [ACTOR_ID] } }],
          },
        },
        { responsibleEmployeeId: { in: [ACTOR_ID] } },
        { initiatedByEmployeeId: { in: [ACTOR_ID] } },
        { answeredEmployeeId: { in: [ACTOR_ID] } },
      ],
    });
  });

  it('OWN does not match another employee id', () => {
    const where = buildCallAccessWhere(OWN_PARAMS);
    expect(JSON.stringify(where)).not.toContain(OTHER_EMPLOYEE_ID);
  });

  it('OWN does not treat a Contact UUID as an edit grant', () => {
    expect(JSON.stringify(buildCallAccessWhere(OWN_PARAMS))).not.toContain('contactId');
  });

  it('ALL on one CRM module allows contact-only Calls without a Contact UUID', () => {
    expect(
      buildCallAccessWhere({
        ...OWN_PARAMS,
        leadsScope: 'ALL',
        dealsScope: 'NONE',
      }),
    ).toEqual({
      OR: [{ leadId: { not: null } }, { AND: [{ leadId: null }, { dealId: null }] }],
    });
  });

  it('DEPARTMENT uses colleague employee ids, not the scope name alone', () => {
    const where = buildCallAccessWhere({
      leadsScope: 'DEPARTMENT',
      dealsScope: 'DEPARTMENT',
      actorId: ACTOR_ID,
      departmentEmployeeIds: [COLLEAGUE_ID],
    });
    expect(where).toEqual({
      OR: [
        { lead: { assignedTo: { in: [ACTOR_ID, COLLEAGUE_ID] } } },
        {
          deal: {
            OR: [
              { sellerId: { in: [ACTOR_ID, COLLEAGUE_ID] } },
              { sellerAssistantId: { in: [ACTOR_ID, COLLEAGUE_ID] } },
            ],
          },
        },
        { responsibleEmployeeId: { in: [ACTOR_ID, COLLEAGUE_ID] } },
        { initiatedByEmployeeId: { in: [ACTOR_ID, COLLEAGUE_ID] } },
        { answeredEmployeeId: { in: [ACTOR_ID, COLLEAGUE_ID] } },
      ],
    });
  });
});

describe('buildCallParentWhere', () => {
  it('lists Contact calls through primary and additional Lead/Deal relations', () => {
    expect(buildCallParentWhere('contact', { contactId: 'contact-1' })).toEqual({
      OR: [
        { contactId: 'contact-1' },
        {
          lead: {
            OR: [
              { contactId: 'contact-1' },
              { additionalContacts: { some: { contactId: 'contact-1' } } },
            ],
          },
        },
        {
          deal: {
            OR: [
              { contactId: 'contact-1' },
              { additionalContacts: { some: { contactId: 'contact-1' } } },
            ],
          },
        },
      ],
    });
  });
});

describe('mergeCallListWhere', () => {
  it('ANDs parent and access predicates for findMany and count', () => {
    const parent = { leadId: 'lead-1' };
    const access = buildCallAccessWhere(OWN_PARAMS);
    expect(mergeCallListWhere(parent, access)).toEqual({ AND: [parent, access] });
  });
});
