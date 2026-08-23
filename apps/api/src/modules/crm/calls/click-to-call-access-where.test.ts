import { describe, expect, it } from 'vitest';
import { ACTOR_ID, COLLEAGUE_ID, OTHER_EMPLOYEE_ID } from './call-access.test-support';
import {
  buildContactClickToCallWhere,
  buildDealClickToCallWhere,
  buildLeadClickToCallWhere,
  CLICK_TO_CALL_DENIED_WHERE,
} from './click-to-call-access-where';

const OWN = {
  leadsScope: 'OWN' as const,
  dealsScope: 'OWN' as const,
  actorId: ACTOR_ID,
  departmentEmployeeIds: [] as string[],
};

describe('buildLeadClickToCallWhere', () => {
  it('scopes OWN to assignedTo and DEPARTMENT to colleague ids', () => {
    expect(buildLeadClickToCallWhere('OWN', ACTOR_ID, [])).toEqual({
      assignedTo: { in: [ACTOR_ID] },
    });
    expect(buildLeadClickToCallWhere('DEPARTMENT', ACTOR_ID, [COLLEAGUE_ID])).toEqual({
      assignedTo: { in: [ACTOR_ID, COLLEAGUE_ID] },
    });
    expect(buildLeadClickToCallWhere('ALL', ACTOR_ID, [])).toEqual({});
    expect(buildLeadClickToCallWhere('NONE', ACTOR_ID, [])).toEqual(CLICK_TO_CALL_DENIED_WHERE);
  });
});

describe('buildDealClickToCallWhere', () => {
  it('scopes OWN to seller or assistant without treating DEPARTMENT as ALL', () => {
    expect(buildDealClickToCallWhere('OWN', ACTOR_ID, [])).toEqual({
      OR: [{ sellerId: { in: [ACTOR_ID] } }, { sellerAssistantId: { in: [ACTOR_ID] } }],
    });
    expect(buildDealClickToCallWhere('DEPARTMENT', ACTOR_ID, [])).toEqual({
      OR: [{ sellerId: { in: [ACTOR_ID] } }, { sellerAssistantId: { in: [ACTOR_ID] } }],
    });
    expect(buildDealClickToCallWhere('ALL', ACTOR_ID, [])).toEqual({});
  });
});

describe('buildContactClickToCallWhere', () => {
  it('requires primary and additional Lead/Deal relations for OWN', () => {
    const where = buildContactClickToCallWhere({ ...OWN, dealsScope: 'NONE' });
    expect(where).toEqual({
      OR: [
        { leads: { some: { trashedAt: null, assignedTo: { in: [ACTOR_ID] } } } },
        {
          leadAdditionalLinks: {
            some: { lead: { trashedAt: null, assignedTo: { in: [ACTOR_ID] } } },
          },
        },
      ],
    });
    expect(JSON.stringify(where)).not.toContain(OTHER_EMPLOYEE_ID);
  });

  it('requires Deal seller/assistant primary and additional relations', () => {
    const where = buildContactClickToCallWhere({ ...OWN, leadsScope: 'NONE' });
    expect(where).toEqual({
      OR: [
        {
          deals: {
            some: {
              trashedAt: null,
              OR: [{ sellerId: { in: [ACTOR_ID] } }, { sellerAssistantId: { in: [ACTOR_ID] } }],
            },
          },
        },
        {
          dealAdditionalLinks: {
            some: {
              deal: {
                trashedAt: null,
                OR: [{ sellerId: { in: [ACTOR_ID] } }, { sellerAssistantId: { in: [ACTOR_ID] } }],
              },
            },
          },
        },
      ],
    });
  });

  it('does not use trashed Lead/Deal as ownership and denies unowned OWN/DEPARTMENT', () => {
    const own = buildContactClickToCallWhere(OWN);
    expect(JSON.stringify(own)).toContain('"trashedAt":null');
    expect(own).not.toEqual({});
    expect(
      buildContactClickToCallWhere({ ...OWN, leadsScope: 'NONE', dealsScope: 'NONE' }),
    ).toEqual(CLICK_TO_CALL_DENIED_WHERE);
    expect(
      buildContactClickToCallWhere({
        leadsScope: 'DEPARTMENT',
        dealsScope: 'DEPARTMENT',
        actorId: ACTOR_ID,
        departmentEmployeeIds: [],
      }),
    ).not.toEqual({});
  });

  it('allows any active Contact for ALL and denies NONE', () => {
    expect(buildContactClickToCallWhere({ ...OWN, leadsScope: 'ALL', dealsScope: 'NONE' })).toEqual(
      {},
    );
    expect(
      buildContactClickToCallWhere({
        leadsScope: 'NONE',
        dealsScope: 'NONE',
        actorId: ACTOR_ID,
        departmentEmployeeIds: [],
      }),
    ).toEqual(CLICK_TO_CALL_DENIED_WHERE);
  });
});
