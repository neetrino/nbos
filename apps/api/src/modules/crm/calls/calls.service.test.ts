import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { CallsService } from './calls.service';

const LEAD_PERMS = { CRM_LEADS_VIEW: 'OWN' };
const DEAL_PERMS = { CRM_DEALS_VIEW: 'ALL' };
const NONE_PERMS = { CRM_LEADS_VIEW: 'NONE', CRM_DEALS_VIEW: 'NONE' };

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
};

const CALL_WITHOUT_CONTACT = {
  ...CALL_ROW,
  id: 'call-orphan-contact',
  contactId: null,
  contact: null,
  dealId: null,
  deal: null,
};

describe('CallsService', () => {
  it('lists CALL activities for a Lead', async () => {
    const prisma = createMockPrisma();
    prisma.atsCallEvent.findMany.mockResolvedValue([CALL_ROW]);
    prisma.atsCallEvent.count.mockResolvedValue(1);
    const service = new CallsService(prisma as never);

    const result = await service.findAll({ leadId: 'lead-1', page: 1, pageSize: 20 }, LEAD_PERMS);

    expect(prisma.atsCallEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { leadId: 'lead-1' },
        skip: 0,
        take: 20,
      }),
    );
    expect(result.items).toHaveLength(1);
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
    });
  });

  it('lists CALL activities for a Contact', async () => {
    const prisma = createMockPrisma();
    prisma.atsCallEvent.findMany.mockResolvedValue([CALL_ROW]);
    prisma.atsCallEvent.count.mockResolvedValue(1);
    const service = new CallsService(prisma as never);

    const result = await service.findAll({ contactId: 'contact-1' }, LEAD_PERMS);
    expect(result.items[0]?.type).toBe('CALL');
    expect(prisma.atsCallEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { contactId: 'contact-1' } }),
    );
  });

  it('lists CALL activities for a Deal', async () => {
    const prisma = createMockPrisma();
    prisma.atsCallEvent.findMany.mockResolvedValue([CALL_ROW]);
    prisma.atsCallEvent.count.mockResolvedValue(1);
    const service = new CallsService(prisma as never);

    const result = await service.findAll({ dealId: 'deal-1' }, DEAL_PERMS);
    expect(result.items[0]?.dealName).toBe('Corporate website');
  });

  it('still returns a call without a Contact', async () => {
    const prisma = createMockPrisma();
    prisma.atsCallEvent.findMany.mockResolvedValue([CALL_WITHOUT_CONTACT]);
    prisma.atsCallEvent.count.mockResolvedValue(1);
    const service = new CallsService(prisma as never);

    const result = await service.findAll({ leadId: 'lead-1' }, LEAD_PERMS);
    expect(result.items[0]).toMatchObject({
      type: 'CALL',
      contactId: null,
      contactName: null,
      phone: '+37499123456',
      leadName: 'Website project',
    });
  });

  it('rejects a global list without a parent filter', async () => {
    const prisma = createMockPrisma();
    const service = new CallsService(prisma as never);
    await expect(service.findAll({}, LEAD_PERMS)).rejects.toThrow(
      'Provide exactly one of leadId, contactId, or dealId',
    );
  });

  it('rejects list when CRM VIEW permission is missing', async () => {
    const prisma = createMockPrisma();
    const service = new CallsService(prisma as never);
    await expect(service.findAll({ leadId: 'lead-1' }, NONE_PERMS)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('returns a call by id when the user can view a linked parent', async () => {
    const prisma = createMockPrisma();
    prisma.atsCallEvent.findUnique.mockResolvedValue(CALL_ROW);
    const service = new CallsService(prisma as never);

    await expect(service.findById('call-1', LEAD_PERMS)).resolves.toMatchObject({
      type: 'CALL',
      id: 'call-1',
      durationSec: 42,
    });
  });

  it('throws NotFoundException when the call is missing', async () => {
    const prisma = createMockPrisma();
    prisma.atsCallEvent.findUnique.mockResolvedValue(null);
    const service = new CallsService(prisma as never);

    await expect(service.findById('missing', LEAD_PERMS)).rejects.toThrow(NotFoundException);
  });
});
