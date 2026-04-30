import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AuditService } from '../audit/audit.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { ReportsQueueService } from './reports-queue.service';
import { ReportsScheduleRunnerService } from './reports-schedule-runner.service';

const QUEUED_JOB = {
  id: 'job-1',
  reportKey: 'company-pnl',
  reportTitle: 'Company P&L',
  ownerModule: 'FINANCE',
  format: 'CSV',
  requestedById: 'employee-1',
  filters: { dateFrom: '2026-04-01', dateTo: '2026-04-30' },
};

const DUE_SCHEDULE = {
  id: 'schedule-1',
  reportKey: 'company-pnl',
  reportTitle: 'Company P&L',
  ownerModule: 'FINANCE',
  format: 'CSV',
  status: 'ACTIVE',
  ownerId: 'employee-1',
  recipientEmails: ['finance@example.com'],
  scheduleLabel: 'Monthly finance packet',
  filters: { dateFrom: '2026-04-01', dateTo: '2026-04-30' },
  frequency: 'MONTHLY',
  timezone: 'Asia/Yerevan',
  timeOfDay: '09:00',
  startDate: new Date('2026-04-01T00:00:00.000Z'),
  dayOfWeek: null,
  dayOfMonth: 5,
  nextRunAt: new Date('2026-04-05T05:00:00.000Z'),
};

describe('ReportsScheduleRunnerService', () => {
  let prisma: MockPrisma;
  let audit: { log: ReturnType<typeof vi.fn> };
  let queue: { enqueueExport: ReturnType<typeof vi.fn> };
  let service: ReportsScheduleRunnerService;

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = { log: vi.fn() };
    queue = { enqueueExport: vi.fn().mockResolvedValue(true) };
    prisma.reportExportJob.create.mockResolvedValue(QUEUED_JOB);
    service = new ReportsScheduleRunnerService(
      prisma as never,
      audit as Partial<AuditService> as never,
      queue as Partial<ReportsQueueService> as never,
    );
  });

  it('creates export jobs for due schedules and advances next run', async () => {
    prisma.reportSchedule.findMany.mockResolvedValueOnce([DUE_SCHEDULE]);

    const result = await service.runDueSchedules(new Date('2026-04-06T00:00:00.000Z'));

    expect(result).toEqual({ processed: 1, failed: 0 });
    expect(prisma.reportExportJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reportKey: 'company-pnl',
          requestedById: 'employee-1',
          filters: DUE_SCHEDULE.filters,
        }),
      }),
    );
    expect(queue.enqueueExport).toHaveBeenCalledWith({ jobId: 'job-1', actorId: 'employee-1' });
    expect(prisma.reportSchedule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'schedule-1' },
        data: expect.objectContaining({
          lastExportJobId: 'job-1',
          nextRunAt: expect.any(Date),
          failureReason: null,
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'report_schedule.export_queued' }),
    );
  });
});
