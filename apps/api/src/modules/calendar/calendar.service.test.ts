import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('CalendarService', () => {
  let prisma: MockPrisma;
  let audit: { log: ReturnType<typeof vi.fn> };
  let service: CalendarService;

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    service = new CalendarService(prisma as never, audit as never);
  });

  const validMeetingBody = {
    title: 'Client call',
    startsAt: '2026-06-10T10:00:00.000Z',
    endsAt: '2026-06-10T11:00:00.000Z',
  };

  describe('createMeeting', () => {
    it('creates when no scheduled overlaps', async () => {
      prisma.calendarMeeting.findMany.mockResolvedValue([]);
      prisma.calendarMeeting.create.mockResolvedValue({
        id: 'new-m',
        title: 'Client call',
        projectId: null,
      } as never);

      await service.createMeeting('u1', validMeetingBody);

      expect(prisma.calendarMeeting.create).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'calendar.meeting_created', entityId: 'new-m' }),
      );
    });

    it('throws ConflictException when overlap without override', async () => {
      prisma.calendarMeeting.findMany.mockResolvedValue([
        {
          id: 'm-x',
          title: 'Busy',
          internalParticipantIds: ['u1'],
          projectId: null,
          dealId: null,
          contactId: null,
        },
      ]);

      await expect(service.createMeeting('u1', validMeetingBody)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.calendarMeeting.create).not.toHaveBeenCalled();
    });

    it('creates with conflict override reason when overlaps exist', async () => {
      prisma.calendarMeeting.findMany.mockResolvedValue([
        {
          id: 'm-x',
          title: 'Busy',
          internalParticipantIds: ['u1'],
          projectId: null,
          dealId: null,
          contactId: null,
        },
      ]);
      prisma.calendarMeeting.create.mockResolvedValue({
        id: 'new-m',
        title: 'Client call',
        projectId: null,
      } as never);

      await service.createMeeting('u1', {
        ...validMeetingBody,
        conflictOverrideReason: 'Client insisted on this slot',
      });

      expect(prisma.calendarMeeting.create).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'calendar.meeting_created',
          changes: expect.objectContaining({
            conflictOverrideReason: 'Client insisted on this slot',
          }),
        }),
      );
    });

    it('skips overlap query when status is not SCHEDULED', async () => {
      prisma.calendarMeeting.create.mockResolvedValue({ id: 'c1' } as never);

      await service.createMeeting('u1', { ...validMeetingBody, status: 'CANCELLED' });

      expect(prisma.calendarMeeting.findMany).not.toHaveBeenCalled();
      expect(prisma.calendarMeeting.create).toHaveBeenCalled();
    });
  });
});
