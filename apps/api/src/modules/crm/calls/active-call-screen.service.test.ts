import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { ActiveCallScreenService } from './active-call-screen.service';
import { CallAccessPolicyService } from './call-access-policy.service';
import { ALL_ACTOR, NONE_ACTOR, OWN_ACTOR, VIEW_ONLY_ALL_ACTOR } from './call-access.test-support';

const SCREEN_ROW = {
  id: 'call-1',
  uid: 'uid-1',
  calldirect: '0',
  state: 'finish',
  phone: '+37499123456',
  clid: '+37499123456',
  billsec: '42',
  disposition: 'ANSWERED',
  note: null,
  noteVersion: 4,
  recordingStatus: null,
  leadId: 'lead-1',
  contactId: 'contact-1',
  dealId: null,
  lead: { name: 'Website project', contactName: 'Incoming call' },
  contact: {
    firstName: 'John',
    lastName: 'Smith',
    phone: '+37499123456',
    extraPhones: [],
    companies: [],
  },
  deal: null,
};

function createService() {
  const prisma = createMockPrisma();
  const service = new ActiveCallScreenService(
    prisma as never,
    new CallAccessPolicyService(prisma as never),
  );
  return { prisma, service };
}

describe('ActiveCallScreenService access', () => {
  it('loads the screen after object-level authorization', async () => {
    const { prisma, service } = createService();
    prisma.atsCallEvent.findUnique.mockResolvedValue(SCREEN_ROW);
    prisma.atsCallEvent.findFirst.mockResolvedValue({ id: 'call-1' });
    prisma.atsCallEvent.findMany.mockResolvedValue([]);

    const snapshot = await service.getScreen('call-1', OWN_ACTOR);
    expect(snapshot.callId).toBe('call-1');
    expect(snapshot.noteVersion).toBe(4);
    expect(prisma.atsCallEvent.findFirst).toHaveBeenCalled();
  });

  it('keeps Call metadata VIEW available without EDIT', async () => {
    const { prisma, service } = createService();
    prisma.atsCallEvent.findUnique.mockResolvedValue(SCREEN_ROW);
    prisma.atsCallEvent.findFirst.mockResolvedValue({ id: 'call-1' });
    prisma.atsCallEvent.findMany.mockResolvedValue([]);

    await expect(service.getScreen('call-1', VIEW_ONLY_ALL_ACTOR)).resolves.toMatchObject({
      callId: 'call-1',
    });
    await expect(service.getScreen('call-1', ALL_ACTOR)).resolves.toMatchObject({
      callId: 'call-1',
    });
  });

  it('denies screen for NONE and for an unauthorized OWN call', async () => {
    const { prisma, service } = createService();
    prisma.atsCallEvent.findUnique.mockResolvedValue({ id: 'call-1' });
    prisma.atsCallEvent.findFirst.mockResolvedValue(null);

    await expect(service.getScreen('call-1', NONE_ACTOR)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.getScreen('call-1', OWN_ACTOR)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.atsCallEvent.findMany).not.toHaveBeenCalled();
  });

  it('throws NotFound when the screen call is missing', async () => {
    const { prisma, service } = createService();
    prisma.atsCallEvent.findUnique.mockResolvedValue(null);

    await expect(service.getScreen('missing', OWN_ACTOR)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('ActiveCallScreenService recent-call filter', () => {
  it('applies the same access predicate to recent calls', async () => {
    const { prisma, service } = createService();
    prisma.atsCallEvent.findUnique.mockResolvedValue(SCREEN_ROW);
    prisma.atsCallEvent.findFirst.mockResolvedValue({ id: 'call-1' });
    prisma.atsCallEvent.findMany.mockResolvedValue([]);
    const policy = new CallAccessPolicyService(prisma as never);
    const accessWhere = await policy.resolveAccessWhere(OWN_ACTOR);

    await service.getScreen('call-1', OWN_ACTOR);
    expect(prisma.atsCallEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ phone: '+37499123456', id: { not: 'call-1' } }, accessWhere] },
      }),
    );
  });
});
