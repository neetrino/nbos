import { describe, expect, it } from 'vitest';
import { buildCallAccessWhere, CALL_ACCESS_DENIED_WHERE } from './call-access.where';
import { ACTOR_ID, COLLEAGUE_ID } from './call-access.test-support';
import {
  buildCallJournalAccessWhere,
  buildJournalCrmAssignmentWhere,
} from './call-journal-access.where';

describe('buildCallJournalAccessWhere', () => {
  it('returns every call when CALLS_VIEW is ALL', () => {
    expect(
      buildCallJournalAccessWhere({
        callsScope: 'ALL',
        actorId: ACTOR_ID,
        departmentEmployeeIds: [],
        crmWhere: CALL_ACCESS_DENIED_WHERE,
      }),
    ).toEqual({});
  });

  it('OWN matches Call employees and keeps CRM assignment as OR', () => {
    const crmWhere = { leadId: 'lead-1' };
    expect(
      buildCallJournalAccessWhere({
        callsScope: 'OWN',
        actorId: ACTOR_ID,
        departmentEmployeeIds: [],
        crmWhere,
      }),
    ).toEqual({
      OR: [
        {
          OR: [
            { responsibleEmployeeId: { in: [ACTOR_ID] } },
            { initiatedByEmployeeId: { in: [ACTOR_ID] } },
            { answeredEmployeeId: { in: [ACTOR_ID] } },
          ],
        },
        crmWhere,
      ],
    });
  });

  it('DEPARTMENT includes colleagues and ignores a denied CRM predicate', () => {
    expect(
      buildCallJournalAccessWhere({
        callsScope: 'DEPARTMENT',
        actorId: ACTOR_ID,
        departmentEmployeeIds: [COLLEAGUE_ID],
        crmWhere: CALL_ACCESS_DENIED_WHERE,
      }),
    ).toEqual({
      OR: [
        {
          OR: [
            { responsibleEmployeeId: { in: [ACTOR_ID, COLLEAGUE_ID] } },
            { initiatedByEmployeeId: { in: [ACTOR_ID, COLLEAGUE_ID] } },
            { answeredEmployeeId: { in: [ACTOR_ID, COLLEAGUE_ID] } },
          ],
        },
      ],
    });
  });

  it('does not OR an unrestricted CRM predicate into CALLS OWN', () => {
    expect(
      buildCallJournalAccessWhere({
        callsScope: 'OWN',
        actorId: ACTOR_ID,
        departmentEmployeeIds: [],
        crmWhere: {},
      }),
    ).toEqual({
      OR: [
        {
          OR: [
            { responsibleEmployeeId: { in: [ACTOR_ID] } },
            { initiatedByEmployeeId: { in: [ACTOR_ID] } },
            { answeredEmployeeId: { in: [ACTOR_ID] } },
          ],
        },
      ],
    });
  });

  it('narrows CRM ALL to assignment OWN so Seller CALLS OWN stays scoped', () => {
    const crmWhere = buildJournalCrmAssignmentWhere({
      leadsScope: 'ALL',
      dealsScope: 'ALL',
      actorId: ACTOR_ID,
    });
    expect(crmWhere).toEqual(
      buildCallAccessWhere({
        leadsScope: 'OWN',
        dealsScope: 'OWN',
        actorId: ACTOR_ID,
        departmentEmployeeIds: [],
      }),
    );
    const where = buildCallJournalAccessWhere({
      callsScope: 'OWN',
      actorId: ACTOR_ID,
      departmentEmployeeIds: [],
      crmWhere,
    });
    expect(where).not.toEqual({});
    expect(JSON.stringify(where)).toContain(ACTOR_ID);
    expect(JSON.stringify(where)).not.toMatch(/"OR":\[.*,\{\}\]/);
  });

  it('denies when CALLS is NONE and CRM is denied', () => {
    expect(
      buildCallJournalAccessWhere({
        callsScope: 'NONE',
        actorId: ACTOR_ID,
        departmentEmployeeIds: [],
        crmWhere: CALL_ACCESS_DENIED_WHERE,
      }),
    ).toEqual(CALL_ACCESS_DENIED_WHERE);
  });
});
