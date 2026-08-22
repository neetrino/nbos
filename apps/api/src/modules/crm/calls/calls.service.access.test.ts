import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { CallAccessPolicyService } from './call-access-policy.service';
import {
  ALL_ACTOR,
  ACTOR_ID,
  COLLEAGUE_ID,
  DEPARTMENT_ACTOR,
  NONE_ACTOR,
  OWN_ACTOR,
} from './call-access.test-support';
import {
  buildCallAccessWhere,
  buildCallParentWhere,
  mergeCallListWhere,
} from './call-access.where';
import { CallsService } from './calls.service';

function createService() {
  const prisma = createMockPrisma();
  const service = new CallsService(prisma as never, new CallAccessPolicyService(prisma as never));
  return { prisma, service };
}

function expectedListWhere(
  parent: 'lead' | 'deal' | 'contact',
  ids: { leadId?: string; contactId?: string; dealId?: string },
  access: ReturnType<typeof buildCallAccessWhere>,
) {
  return mergeCallListWhere(buildCallParentWhere(parent, ids), access);
}

const OWN_WHERE = buildCallAccessWhere({
  leadsScope: 'OWN',
  dealsScope: 'OWN',
  actorId: ACTOR_ID,
  departmentEmployeeIds: [],
});

describe('CallsService object-level access', () => {
  it('OWN Seller can query Calls of their Lead', async () => {
    const { prisma, service } = createService();
    await service.findAll({ leadId: 'lead-own' }, OWN_ACTOR);
    expect(prisma.atsCallEvent.findMany.mock.calls[0]?.[0]?.where).toEqual(
      expectedListWhere('lead', { leadId: 'lead-own' }, OWN_WHERE),
    );
  });

  it('OWN Seller cannot load another Seller Lead Calls without the access predicate', async () => {
    const { prisma, service } = createService();
    await service.findAll({ leadId: 'lead-other' }, OWN_ACTOR);
    const where = prisma.atsCallEvent.findMany.mock.calls[0]?.[0]?.where;
    expect(where).toEqual(expectedListWhere('lead', { leadId: 'lead-other' }, OWN_WHERE));
    expect(JSON.stringify(where)).toContain(ACTOR_ID);
    expect(where).not.toEqual({ leadId: 'lead-other' });
  });

  it('OWN Seller can query Calls of their Deal', async () => {
    const { prisma, service } = createService();
    await service.findAll({ dealId: 'deal-own' }, OWN_ACTOR);
    expect(prisma.atsCallEvent.findMany.mock.calls[0]?.[0]?.where).toEqual(
      expectedListWhere('deal', { dealId: 'deal-own' }, OWN_WHERE),
    );
  });

  it('OWN Seller cannot list another Seller Deal Calls as an unfiltered dealId', async () => {
    const { prisma, service } = createService();
    await service.findAll({ dealId: 'deal-other' }, OWN_ACTOR);
    expect(prisma.atsCallEvent.findMany.mock.calls[0]?.[0]?.where).not.toEqual({
      dealId: 'deal-other',
    });
  });

  it('OWN does not grant arbitrary Contact UUID access', async () => {
    const { prisma, service } = createService();
    await service.findAll({ contactId: 'contact-arbitrary' }, OWN_ACTOR);
    const where = prisma.atsCallEvent.findMany.mock.calls[0]?.[0]?.where;
    expect(where).toEqual(
      expectedListWhere('contact', { contactId: 'contact-arbitrary' }, OWN_WHERE),
    );
    expect(where).not.toEqual({ contactId: 'contact-arbitrary' });
  });

  it('DEPARTMENT allows the same department via EmployeeDepartment ids', async () => {
    const { prisma, service } = createService();
    prisma.employeeDepartment.findMany.mockResolvedValue([{ employeeId: COLLEAGUE_ID }]);
    await service.findAll({ leadId: 'lead-1' }, DEPARTMENT_ACTOR);
    expect(prisma.atsCallEvent.findMany.mock.calls[0]?.[0]?.where).toEqual(
      expectedListWhere(
        'lead',
        { leadId: 'lead-1' },
        buildCallAccessWhere({
          leadsScope: 'DEPARTMENT',
          dealsScope: 'DEPARTMENT',
          actorId: ACTOR_ID,
          departmentEmployeeIds: [COLLEAGUE_ID],
        }),
      ),
    );
  });

  it('DEPARTMENT does not grant another department', async () => {
    const { prisma, service } = createService();
    prisma.employeeDepartment.findMany.mockResolvedValue([]);
    await service.findAll({ leadId: 'lead-1' }, DEPARTMENT_ACTOR);
    const where = prisma.atsCallEvent.findMany.mock.calls[0]?.[0]?.where;
    expect(JSON.stringify(where)).not.toContain(COLLEAGUE_ID);
    expect(where).not.toEqual(expectedListWhere('lead', { leadId: 'lead-1' }, {}));
  });

  it('ALL allows parent Calls and NONE is rejected before the query', async () => {
    const { prisma, service } = createService();
    await service.findAll({ leadId: 'lead-1' }, ALL_ACTOR);
    expect(prisma.atsCallEvent.findMany.mock.calls[0]?.[0]?.where).toEqual(
      expectedListWhere('lead', { leadId: 'lead-1' }, {}),
    );
    await expect(service.findAll({ leadId: 'lead-1' }, NONE_ACTOR)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
