import { Injectable } from '@nestjs/common';
import { AI_MODEL_CATALOG_SYNC_CONTRACT } from '../ai-platform/models/ai-model-catalog.contract';
import { AiModelSyncService } from '../ai-platform/models/ai-model-sync.service';
import { isSchedulerLeaseHeld } from './scheduler-lease.fence';
import { SchedulerLeaseService } from './scheduler-lease.service';
import {
  SCHEDULER_JOB_NAMES,
  SCHEDULER_TRIGGER,
  type SchedulerTrigger,
} from './scheduler-lease.constants';

/**
 * Scheduler entry point for AI Platform jobs.
 *
 * A sibling of `SchedulerService` rather than another method on it: that file
 * is already at the top of the size budget, and AI jobs bring their own module
 * dependency. Lease, run recording and trigger semantics are the shared ones.
 */
@Injectable()
export class SchedulerAiService {
  constructor(
    private readonly modelSync: AiModelSyncService,
    private readonly lease: SchedulerLeaseService,
  ) {}

  /**
   * Binds `AI_MODEL_CATALOG_SYNC_CONTRACT.runnerMethod` (checklist AA 420).
   *
   * The runner is discovery-only: it refreshes provider catalogs under a SYSTEM
   * actor and never promotes a model to `ACTIVE`, so a scheduled tick cannot
   * change which models production may use.
   */
  async runAiModelCatalogSync(trigger: SchedulerTrigger = SCHEDULER_TRIGGER.manualHttp) {
    return this.lease.runWithLease(
      { jobName: SCHEDULER_JOB_NAMES.aiModelCatalogSync, trigger },
      async ({ signal, ownerId, fencingToken }) => {
        if (signal.aborted) return;
        // Ownership travels into the sync itself: the signal stops the run
        // between provider steps, and the lease row is re-checked under lock
        // inside the write transaction, so a lease lost mid-commit cannot
        // produce writes beside the successor that took the job over.
        const fence = {
          jobName: SCHEDULER_JOB_NAMES.aiModelCatalogSync,
          ownerId,
          fencingToken,
        };
        const outcomes = await this.modelSync[AI_MODEL_CATALOG_SYNC_CONTRACT.runnerMethod]({
          signal,
          stillOwned: (tx) => isSchedulerLeaseHeld(tx, fence),
        });
        const failed = outcomes.filter((outcome) => !outcome.ok);
        return {
          processedCount: outcomes.length,
          metadata: {
            connections: outcomes.length,
            failed: failed.length,
            failedConnectionIds: failed.map((outcome) => outcome.connectionId),
          },
        };
      },
    );
  }
}
