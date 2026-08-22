import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { CallAccessPolicyService } from './call-access-policy.service';
import { ALL_ACTOR, NONE_ACTOR, OWN_ACTOR } from './call-access.test-support';
import {
  buildCallAccessWhere,
  buildCallParentWhere,
  mergeCallListWhere,
} from './call-access.where';
import { CallsService } from './calls.service';

const CALL_ROW = {
  id: 'call-1',
  uid: 'uid-1',
  calldirect: '0',
  phone: '+37499123456',
  clid: '+37499123456',
  state: 'finish',
  billsec: '42',
  disposition: 'ANSWERED',
  rate: '5',
  leadId: 'lead-1',
  contactId: 'contact-1',
  dealId: 'deal-1',
  responsibleEmployeeId: 'emp-1',
  answeredEmployeeId: 'emp-2',
  createdAt: new Date('2026-08-21T10:00:00.000Z'),
  updatedAt: new Date('2026-08-21T10:01:00.000Z'),
  lead: { name: 'Website project', contactName: 'Incoming call +37499123456' },
  contact: { firstName: 'John', lastName: 'Smith' },
  deal: { name: 'Corporate website', code: 'D-1' },
  responsibleEmployee: { firstName: 'Edgar', lastName: 'Sargsyan' },
  answeredEmployee: { firstName: 'Edgar', lastName: 'Sargsyan' },
  recordingStatus: null,
};

const CALL_WITHOUT_CONTACT = {
  ...CALL_ROW,
  id: 'call-orphan-contact',
  contactId: null,
  contact: null,
  dealId: null,
  deal: null,
};

function createService() {
  const prisma = createMockPrisma();
  const service = new CallsService(prisma as never, new CallAccessPolicyService(prisma as never));
  return { prisma, service };
}

function ownAccessWhere() {
  return buildCallAccessWhere({
    leadsScope: 'OWN',
    dealsScope: 'OWN',
    actorId: OWN_ACTOR.employeeId,
    departmentEmployeeIds: [],
  });
}

describe('CallsService', () => {
  it('lists CALL activities for a Lead with an access predicate', async () => {
    const { prisma, service } = createService();
    prisma.atsCallEvent.findMany.mockResolvedValue([CALL_ROW]);
    prisma.atsCallEvent.count.mockResolvedValue(1);

    const result = await service.findAll({ leadId: 'lead-1', page: 1, pageSize: 20 }, OWN_ACTOR);
    const where = mergeCallListWhere(
      buildCallParentWhere('lead', { leadId: 'lead-1' }),
      ownAccessWhere(),
    );

    expect(prisma.atsCallEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where, skip: 0, take: 20 }),
    );
    expect(prisma.atsCallEvent.count).toHaveBeenCalledWith({ where });
    expect(result.items[0]).toMatchObject({
      type: 'CALL',
      id: 'call-1',
      direction: 'INBOUND',
      phone: '+37499123456',
      status: 'finish',
      durationSec: 42,
      leadId: 'lead-1',
      contactName: 'John Smith',
      leadName: 'Website project',
      employeeName: 'Edgar Sargsyan',
      recordingStatus: null,
    });
  });

  it('lists CALL activities for a Contact through authorized relations', async () => {
    const { prisma, service } = createService();
    prisma.atsCallEvent.findMany.mockResolvedValue([CALL_ROW]);
    prisma.atsCallEvent.count.mockResolvedValue(1);

    const result = await service.findAll({ contactId: 'contact-1' }, OWN_ACTOR);
    expect(result.items[0]?.type).toBe('CALL');
    expect(prisma.atsCallEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: mergeCallListWhere(
          buildCallParentWhere('contact', { contactId: 'contact-1' }),
          ownAccessWhere(),
        ),
      }),
    );
  });

  it('lists CALL activities for a Deal', async () => {
    const { prisma, service } = createService();
    prisma.atsCallEvent.findMany.mockResolvedValue([CALL_ROW]);
    prisma.atsCallEvent.count.mockResolvedValue(1);

    const result = await service.findAll({ dealId: 'deal-1' }, OWN_ACTOR);
    expect(result.items[0]?.dealName).toBe('Corporate website');
  });

  it('still returns a call without a Contact', async () => {
    const { prisma, service } = createService();
    prisma.atsCallEvent.findMany.mockResolvedValue([CALL_WITHOUT_CONTACT]);
    prisma.atsCallEvent.count.mockResolvedValue(1);

    const result = await service.findAll({ leadId: 'lead-1' }, OWN_ACTOR);
    expect(result.items[0]).toMatchObject({
      type: 'CALL',
      contactId: null,
      contactName: null,
      phone: '+37499123456',
      leadName: 'Website project',
    });
  });

  it('rejects a global list without a parent filter', async () => {
    const { service } = createService();
    await expect(service.findAll({}, OWN_ACTOR)).rejects.toThrow(
      'Provide exactly one of leadId, contactId, or dealId',
    );
  });

  it('rejects list when CRM VIEW permission is NONE', async () => {
    const { prisma, service } = createService();
    await expect(service.findAll({ leadId: 'lead-1' }, NONE_ACTOR)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.atsCallEvent.findMany).not.toHaveBeenCalled();
  });

  it('uses the same Prisma access predicate for findMany and count', async () => {
    const { prisma, service } = createService();
    prisma.atsCallEvent.findMany.mockResolvedValue([]);
    prisma.atsCallEvent.count.mockResolvedValue(0);

    await service.findAll({ leadId: 'lead-own' }, OWN_ACTOR);
    const findWhere = prisma.atsCallEvent.findMany.mock.calls[0]?.[0]?.where;
    const countWhere = prisma.atsCallEvent.count.mock.calls[0]?.[0]?.where;
    expect(findWhere).toEqual(countWhere);
    expect(findWhere).toEqual(
      mergeCallListWhere(buildCallParentWhere('lead', { leadId: 'lead-own' }), ownAccessWhere()),
    );
  });

  it('ALL lists the parent without treating OWN as sufficient', async () => {
    const { prisma, service } = createService();
    prisma.atsCallEvent.findMany.mockResolvedValue([CALL_ROW]);
    prisma.atsCallEvent.count.mockResolvedValue(1);

    await service.findAll({ leadId: 'lead-1' }, ALL_ACTOR);
    expect(prisma.atsCallEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: mergeCallListWhere(buildCallParentWhere('lead', { leadId: 'lead-1' }), {}),
      }),
    );
  });

  it('returns a call by id after object-level authorization', async () => {
    const { prisma, service } = createService();
    prisma.atsCallEvent.findUnique.mockResolvedValue(CALL_ROW);
    prisma.atsCallEvent.findFirst.mockResolvedValue({ id: 'call-1' });

    await expect(service.findById('call-1', OWN_ACTOR)).resolves.toMatchObject({
      type: 'CALL',
      id: 'call-1',
      durationSec: 42,
    });
  });

  it('throws NotFoundException when the call is missing', async () => {
    const { prisma, service } = createService();
    prisma.atsCallEvent.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing', OWN_ACTOR)).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when a known call is outside OWN scope', async () => {
    const { prisma, service } = createService();
    prisma.atsCallEvent.findUnique.mockResolvedValue({ id: 'call-foreign' });
    prisma.atsCallEvent.findFirst.mockResolvedValue(null);

    await expect(service.findById('call-foreign', OWN_ACTOR)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('returns call metadata without CRM_CALL_RECORDINGS_PLAY', async () => {
    const { prisma, service } = createService();
    prisma.atsCallEvent.findUnique.mockResolvedValue(CALL_ROW);
    prisma.atsCallEvent.findFirst.mockResolvedValue({ id: 'call-1' });

    expect(OWN_ACTOR.permissions.CRM_CALL_RECORDINGS_PLAY).toBeUndefined();
    await expect(service.findById('call-1', OWN_ACTOR)).resolves.toMatchObject({
      type: 'CALL',
      id: 'call-1',
    });
  });
});
