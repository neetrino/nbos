import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
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
};

describe('CallsService', () => {
  it('lists calls filtered by leadId, contactId, or dealId', async () => {
    const prisma = createMockPrisma();
    prisma.atsCallEvent.findMany.mockResolvedValue([CALL_ROW]);
    prisma.atsCallEvent.count.mockResolvedValue(1);
    const service = new CallsService(prisma as never);

    const result = await service.findAll({ leadId: 'lead-1', page: 1, pageSize: 20 });

    expect(prisma.atsCallEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { leadId: 'lead-1' },
        skip: 0,
        take: 20,
      }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 'call-1',
      uid: 'uid-1',
      direction: 'INBOUND',
      phone: '+37499123456',
      status: 'finish',
      durationSec: 42,
      leadId: 'lead-1',
      contactId: 'contact-1',
      dealId: 'deal-1',
    });
    expect(result.meta).toEqual({ total: 1, page: 1, pageSize: 20, totalPages: 1 });
  });

  it('returns a call by id', async () => {
    const prisma = createMockPrisma();
    prisma.atsCallEvent.findUnique.mockResolvedValue(CALL_ROW);
    const service = new CallsService(prisma as never);

    await expect(service.findById('call-1')).resolves.toMatchObject({
      id: 'call-1',
      direction: 'INBOUND',
      durationSec: 42,
    });
  });

  it('throws NotFoundException when the call is missing', async () => {
    const prisma = createMockPrisma();
    prisma.atsCallEvent.findUnique.mockResolvedValue(null);
    const service = new CallsService(prisma as never);

    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });
});
