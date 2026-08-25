import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { AuditService } from '../../audit/audit.service';
import { ActiveCallScreenService } from './active-call-screen.service';
import { CallAccessPolicyService } from './call-access-policy.service';
import { EDIT_ALL_ACTOR, EDIT_OWN_ACTOR, VIEW_ONLY_ALL_ACTOR } from './call-access.test-support';
import { CallNoteService } from './call-note.service';
import {
  CALL_NOTE_NOT_TERMINAL_MESSAGE,
  CALL_NOTE_UPDATED_AUDIT_ACTION,
  CALL_NOTE_VERSION_CONFLICT_MESSAGE,
} from './calls.constants';

const SECRET_NOTE = 'secret follow-up';

const SCREEN_ROW = {
  id: 'call-1',
  uid: 'uid-1',
  calldirect: '0',
  state: 'finish',
  phone: '+37499123456',
  clid: '+37499123456',
  billsec: '42',
  disposition: 'ANSWERED',
  note: 'Follow up',
  noteVersion: 5,
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
  const audit = { log: vi.fn().mockResolvedValue({}) } as unknown as AuditService;
  const access = new CallAccessPolicyService(prisma as never);
  const liveReconcile = { syncIfPending: vi.fn().mockResolvedValue(undefined) };
  const screen = new ActiveCallScreenService(prisma as never, access, liveReconcile as never);
  const service = new CallNoteService(prisma as never, access, audit, screen);
  return { prisma, audit, service };
}

function mockAuthorizedCall(
  prisma: ReturnType<typeof createMockPrisma>,
  row: { note: string | null; noteVersion: number; state: string | null },
) {
  prisma.atsCallEvent.findUnique.mockImplementation(
    (args: { select?: Record<string, unknown> }) => {
      if (args.select?.uid) {
        return Promise.resolve({ ...SCREEN_ROW, ...row, noteVersion: row.noteVersion + 1 });
      }
      if (args.select?.noteVersion) return Promise.resolve(row);
      return Promise.resolve({ id: 'call-1' });
    },
  );
  prisma.atsCallEvent.findFirst.mockResolvedValue({ id: 'call-1' });
  prisma.atsCallEvent.findMany.mockResolvedValue([]);
}

describe('CallNoteService authorization', () => {
  it('denies VIEW without EDIT before update and audit', async () => {
    const { prisma, audit, service } = createService();
    prisma.atsCallEvent.findUnique.mockResolvedValue({ id: 'call-1' });
    prisma.atsCallEvent.findFirst
      .mockResolvedValueOnce({ id: 'call-1' })
      .mockResolvedValueOnce(null);

    await expect(
      service.updateNote('call-1', SECRET_NOTE, 4, VIEW_ONLY_ALL_ACTOR),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.atsCallEvent.updateMany).not.toHaveBeenCalled();
    expect(prisma.atsCallEvent.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('allows an EDIT ALL actor after object-level checks', async () => {
    const { prisma, audit, service } = createService();
    mockAuthorizedCall(prisma, { note: null, noteVersion: 4, state: 'finish' });
    prisma.atsCallEvent.updateMany.mockResolvedValue({ count: 1 });

    const snapshot = await service.updateNote('call-1', 'Follow up', 4, EDIT_ALL_ACTOR);
    expect(snapshot.noteVersion).toBe(5);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.atsCallEvent.updateMany).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalled();
  });

  it('allows an EDIT OWN actor when the access predicate matches', async () => {
    const { prisma, service } = createService();
    mockAuthorizedCall(prisma, { note: null, noteVersion: 0, state: 'end' });
    prisma.atsCallEvent.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.updateNote('call-1', 'Mine', 0, EDIT_OWN_ACTOR)).resolves.toMatchObject({
      callId: 'call-1',
    });
  });
});

describe('CallNoteService lifecycle', () => {
  it.each(['start', 'status', 'initiated'] as const)(
    'rejects %s before update and audit',
    async (state) => {
      const { prisma, audit, service } = createService();
      mockAuthorizedCall(prisma, { note: null, noteVersion: 0, state });

      await expect(
        service.updateNote('call-1', SECRET_NOTE, 0, EDIT_ALL_ACTOR),
      ).rejects.toMatchObject({ response: { message: CALL_NOTE_NOT_TERMINAL_MESSAGE } });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.atsCallEvent.updateMany).not.toHaveBeenCalled();
      expect(audit.log).not.toHaveBeenCalled();
    },
  );

  it('allows finish and end', async () => {
    const { prisma, service } = createService();
    mockAuthorizedCall(prisma, { note: null, noteVersion: 0, state: 'finish' });
    prisma.atsCallEvent.updateMany.mockResolvedValue({ count: 1 });
    await expect(service.updateNote('call-1', 'Done', 0, EDIT_ALL_ACTOR)).resolves.toBeDefined();

    mockAuthorizedCall(prisma, { note: null, noteVersion: 0, state: 'END' });
    prisma.atsCallEvent.updateMany.mockResolvedValue({ count: 1 });
    await expect(service.updateNote('call-1', 'Done', 0, EDIT_ALL_ACTOR)).resolves.toBeDefined();
  });
});

describe('CallNoteService concurrency', () => {
  it('increments noteVersion on a matching conditional update', async () => {
    const { prisma, service } = createService();
    mockAuthorizedCall(prisma, { note: 'old', noteVersion: 4, state: 'finish' });
    prisma.atsCallEvent.updateMany.mockResolvedValue({ count: 1 });

    await service.updateNote('call-1', 'new', 4, EDIT_ALL_ACTOR);
    expect(prisma.atsCallEvent.updateMany).toHaveBeenCalledWith({
      where: { id: 'call-1', noteVersion: 4, state: 'finish' },
      data: { note: 'new', noteVersion: { increment: 1 } },
    });
  });

  it('returns 409 and skips update and audit when the in-transaction version does not match', async () => {
    const { prisma, audit, service } = createService();
    mockAuthorizedCall(prisma, { note: 'server', noteVersion: 5, state: 'finish' });
    prisma.atsCallEvent.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.updateNote('call-1', SECRET_NOTE, 4, EDIT_ALL_ACTOR),
    ).rejects.toMatchObject({
      response: { message: CALL_NOTE_VERSION_CONFLICT_MESSAGE },
    });
    expect(prisma.atsCallEvent.updateMany).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('does not audit a stale snapshot when a future expected version would match after a parallel write', async () => {
    const { prisma, audit, service } = createService();
    mockAuthorizedCall(prisma, { note: 'pre-parallel', noteVersion: 3, state: 'finish' });
    prisma.atsCallEvent.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.updateNote('call-1', 'client-note', 4, EDIT_ALL_ACTOR),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.atsCallEvent.updateMany).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('lets the first save win when two saves share one expected version', async () => {
    const { prisma, audit, service } = createService();
    mockAuthorizedCall(prisma, { note: 'old', noteVersion: 4, state: 'finish' });
    prisma.atsCallEvent.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    await service.updateNote('call-1', 'first', 4, EDIT_ALL_ACTOR);
    await expect(service.updateNote('call-1', 'second', 4, EDIT_ALL_ACTOR)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.atsCallEvent.updateMany.mock.calls[1]?.[0]?.data?.note).toBe('second');
    expect(audit.log).toHaveBeenCalledTimes(1);
  });

  it('does not update when state changed after the terminal check', async () => {
    const { prisma, audit, service } = createService();
    mockAuthorizedCall(prisma, { note: 'old', noteVersion: 4, state: 'finish' });
    prisma.atsCallEvent.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.updateNote('call-1', 'new', 4, EDIT_ALL_ACTOR)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.atsCallEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ state: 'finish' }) }),
    );
    expect(audit.log).not.toHaveBeenCalled();
  });
});

describe('CallNoteService audit', () => {
  it('audits the in-transaction row after a parallel write already reached the expected version', async () => {
    const { prisma, audit, service } = createService();
    mockAuthorizedCall(prisma, { note: 'from-parallel', noteVersion: 4, state: 'finish' });
    prisma.atsCallEvent.updateMany.mockResolvedValue({ count: 1 });

    await service.updateNote('call-1', 'client-note', 4, EDIT_ALL_ACTOR);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: {
          oldNote: 'from-parallel',
          newNote: 'client-note',
          oldVersion: 4,
          newVersion: 5,
        },
      }),
      prisma,
    );
  });

  it('writes actor, call, old/new note and versions only after a successful update', async () => {
    const { prisma, audit, service } = createService();
    const order: string[] = [];
    mockAuthorizedCall(prisma, { note: 'old', noteVersion: 4, state: 'finish' });
    prisma.atsCallEvent.updateMany.mockImplementation(async () => {
      order.push('update');
      return { count: 1 };
    });
    audit.log = vi.fn().mockImplementation(async () => {
      order.push('audit');
    });

    await service.updateNote('call-1', 'new', 4, EDIT_ALL_ACTOR);
    expect(order).toEqual(['update', 'audit']);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      {
        entityType: 'CALL',
        entityId: 'call-1',
        action: CALL_NOTE_UPDATED_AUDIT_ACTION,
        userId: EDIT_ALL_ACTOR.employeeId,
        changes: { oldNote: 'old', newNote: 'new', oldVersion: 4, newVersion: 5 },
      },
      prisma,
    );
  });

  it('keeps note and audit in one transaction so audit failure does not commit', async () => {
    const { prisma, audit, service } = createService();
    mockAuthorizedCall(prisma, { note: 'old', noteVersion: 4, state: 'finish' });
    prisma.atsCallEvent.updateMany.mockResolvedValue({ count: 1 });
    audit.log = vi.fn().mockRejectedValue(new Error('audit failed'));

    await expect(service.updateNote('call-1', 'new', 4, EDIT_ALL_ACTOR)).rejects.toThrow(
      'audit failed',
    );
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalled();
  });

  it('audits a cleared note without putting note text on exceptions', async () => {
    const { prisma, audit, service } = createService();
    mockAuthorizedCall(prisma, { note: SECRET_NOTE, noteVersion: 1, state: 'finish' });
    prisma.atsCallEvent.updateMany.mockResolvedValue({ count: 1 });

    await service.updateNote('call-1', null, 1, EDIT_ALL_ACTOR);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: { oldNote: SECRET_NOTE, newNote: null, oldVersion: 1, newVersion: 2 },
      }),
      prisma,
    );

    mockAuthorizedCall(prisma, { note: null, noteVersion: 2, state: 'start' });
    await expect(
      service.updateNote('call-1', SECRET_NOTE, 2, EDIT_ALL_ACTOR),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.updateNote('call-1', SECRET_NOTE, 2, EDIT_ALL_ACTOR),
    ).rejects.not.toMatchObject({ message: expect.stringContaining(SECRET_NOTE) });
  });
});
