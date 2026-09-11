import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  canRunSchedulerJobNow,
  runSchedulerJobByName,
  type SchedulerJobRunners,
} from './scheduler-job-runner';
import type { SchedulerAiService } from './scheduler-ai.service';
import type { SchedulerService } from './scheduler.service';
import { SCHEDULER_JOB_NAMES, SCHEDULER_TRIGGER } from './scheduler-lease.constants';

function runners(): {
  runners: SchedulerJobRunners;
  runAiModelCatalogSync: ReturnType<typeof vi.fn>;
  runBilling: ReturnType<typeof vi.fn>;
} {
  const runAiModelCatalogSync = vi.fn().mockResolvedValue({ processedCount: 0 });
  const runBilling = vi.fn().mockResolvedValue({ processedCount: 0 });
  return {
    runners: {
      scheduler: { runBilling } as unknown as SchedulerService,
      ai: { runAiModelCatalogSync } as unknown as SchedulerAiService,
    },
    runAiModelCatalogSync,
    runBilling,
  };
}

describe('scheduler manual job runner', () => {
  it('dispatches the AI catalog sync to its own service (AA 420)', async () => {
    const { runners: dispatchTargets, runAiModelCatalogSync } = runners();

    await runSchedulerJobByName(
      dispatchTargets,
      SCHEDULER_JOB_NAMES.aiModelCatalogSync,
      SCHEDULER_TRIGGER.manualAdmin,
    );

    expect(runAiModelCatalogSync).toHaveBeenCalledWith(SCHEDULER_TRIGGER.manualAdmin);
  });

  it('dispatches messenger outbound reconcile to SchedulerService', async () => {
    const runMessengerOutboundReconcile = vi.fn().mockResolvedValue({ status: 'SUCCEEDED' });
    const { runners: dispatchTargets } = runners();
    dispatchTargets.scheduler = {
      ...dispatchTargets.scheduler,
      runMessengerOutboundReconcile,
    } as unknown as SchedulerService;

    await runSchedulerJobByName(
      dispatchTargets,
      SCHEDULER_JOB_NAMES.messengerOutboundReconcile,
      SCHEDULER_TRIGGER.manualAdmin,
    );

    expect(runMessengerOutboundReconcile).toHaveBeenCalledWith(SCHEDULER_TRIGGER.manualAdmin);
  });

  it('advertises messenger outbound reconcile as runnable from Settings', () => {
    expect(canRunSchedulerJobNow(SCHEDULER_JOB_NAMES.messengerOutboundReconcile)).toBe(true);
  });

  it('still refuses a job name with no runner', async () => {
    const { runners: dispatchTargets } = runners();

    await expect(
      runSchedulerJobByName(dispatchTargets, 'not-a-job', SCHEDULER_TRIGGER.manualAdmin),
    ).rejects.toThrow(BadRequestException);
  });
});
