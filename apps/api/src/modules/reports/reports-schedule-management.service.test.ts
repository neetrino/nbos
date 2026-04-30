import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AuditService } from '../audit/audit.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { ReportsScheduleManagementService } from './reports-schedule-management.service';

const SCHEDULE = {
  id: 'schedule-1',
  reportKey: 'company-pnl',
  ownerId: 'employee-1',
  status: 'ACTIVE',
  frequency: 'WEEKLY',
  timezone: 'Asia/Yerevan',
  timeOfDay: '09:00',
  startDate: new Date('2026-04-01T00:00:00.000Z'),
  dayOfWeek: 1,
  dayOfMonth: null,
};

describe('ReportsScheduleManagementService', () => {
  let prisma: MockPrisma;
  let audit: { log: ReturnType<typeof vi.fn> };
  let service: ReportsScheduleManagementService;

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = { log: vi.fn() };
    prisma.reportSchedule.findFirst.mockResolvedValue(SCHEDULE);
    prisma.reportSchedule.update.mockImplementation(({ data }) =>
      Promise.resolve({ ...SCHEDULE, ...data }),
    );
    service = new ReportsScheduleManagementService(
      prisma as never,
      audit as Partial<AuditService> as never,
    );
  });

  it('pauses owned schedules with audit', async () => {
    const result = await service.pauseSchedule('employee-1', 'schedule-1');

    expect(result.status).toBe('PAUSED');
    expect(prisma.reportSchedule.findFirst).toHaveBeenCalledWith({
      where: { id: 'schedule-1', ownerId: 'employee-1' },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'report_schedule.paused',
        changes: expect.objectContaining({ sensitive: true, confidentiality: 'FINANCE_SENSITIVE' }),
      }),
    );
  });

  it('resumes owned schedules and recalculates next run', async () => {
    const result = await service.resumeSchedule(
      'employee-1',
      'schedule-1',
      new Date('2026-04-30T08:00:00.000Z'),
    );

    expect(result.status).toBe('ACTIVE');
    expect(prisma.reportSchedule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nextRunAt: expect.any(Date),
          failureReason: null,
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'report_schedule.resumed',
        changes: expect.objectContaining({ sensitive: true, confidentiality: 'FINANCE_SENSITIVE' }),
      }),
    );
  });

  it('archives owned schedules with audit', async () => {
    const result = await service.archiveSchedule('employee-1', 'schedule-1');

    expect(result.status).toBe('ARCHIVED');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'report_schedule.archived',
        changes: expect.objectContaining({ sensitive: true, confidentiality: 'FINANCE_SENSITIVE' }),
      }),
    );
  });

  it('rejects missing schedules', async () => {
    prisma.reportSchedule.findFirst.mockResolvedValueOnce(null);

    await expect(service.pauseSchedule('employee-1', 'missing')).rejects.toThrow(NotFoundException);
  });

  it('does not resume archived schedules', async () => {
    prisma.reportSchedule.findFirst.mockResolvedValueOnce({ ...SCHEDULE, status: 'ARCHIVED' });

    await expect(service.resumeSchedule('employee-1', 'schedule-1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
