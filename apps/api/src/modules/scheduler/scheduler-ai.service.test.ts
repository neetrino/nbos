import { describe, expect, it, vi } from 'vitest';
import { AI_MODEL_CATALOG_SYNC_CONTRACT } from '../ai-platform/models/ai-model-catalog.contract';
import type {
  AiModelSyncService,
  ModelSyncOwnership,
} from '../ai-platform/models/ai-model-sync.service';
import { SchedulerAiService } from './scheduler-ai.service';
import type { SchedulerLeaseService } from './scheduler-lease.service';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';

type LeaseContext = { signal: AbortSignal; ownerId: string; fencingToken: bigint };
type LeaseWork = (context: LeaseContext) => Promise<unknown>;

const OWNER_ID = 'pid:owner-1';
const FENCING_TOKEN = 7n;

/** Runs the work immediately so the runner body is observable without a lease. */
function leaseStub(aborted = false): {
  lease: SchedulerLeaseService;
  runWithLease: ReturnType<typeof vi.fn>;
} {
  const runWithLease = vi.fn(async (_options: unknown, work: LeaseWork) =>
    work({
      signal: { aborted } as AbortSignal,
      ownerId: OWNER_ID,
      fencingToken: FENCING_TOKEN,
    }),
  );
  return { lease: { runWithLease } as unknown as SchedulerLeaseService, runWithLease };
}

function syncStub(outcomes: Array<{ connectionId: string; ok: boolean }>): {
  modelSync: AiModelSyncService;
  runScheduledCatalogSync: ReturnType<typeof vi.fn>;
} {
  const runScheduledCatalogSync = vi.fn().mockResolvedValue(outcomes);
  return {
    modelSync: { runScheduledCatalogSync } as unknown as AiModelSyncService,
    runScheduledCatalogSync,
  };
}

describe('SchedulerAiService', () => {
  it('binds the catalog sync contract runner method (AA 420)', async () => {
    const { lease } = leaseStub();
    const { modelSync, runScheduledCatalogSync } = syncStub([{ connectionId: 'conn-1', ok: true }]);

    await new SchedulerAiService(modelSync, lease).runAiModelCatalogSync('cron');

    expect(AI_MODEL_CATALOG_SYNC_CONTRACT.runnerMethod).toBe('runScheduledCatalogSync');
    expect(runScheduledCatalogSync).toHaveBeenCalledTimes(1);
  });

  it('runs under the shared lease with the catalog job name and trigger', async () => {
    const { lease, runWithLease } = leaseStub();
    const { modelSync } = syncStub([]);

    await new SchedulerAiService(modelSync, lease).runAiModelCatalogSync('cron');

    expect(runWithLease).toHaveBeenCalledWith(
      { jobName: SCHEDULER_JOB_NAMES.aiModelCatalogSync, trigger: 'cron' },
      expect.any(Function),
    );
  });

  it('reports failed connections without failing the run', async () => {
    const { lease } = leaseStub();
    const { modelSync } = syncStub([
      { connectionId: 'conn-1', ok: true },
      { connectionId: 'conn-2', ok: false },
    ]);

    const result = await new SchedulerAiService(modelSync, lease).runAiModelCatalogSync('cron');

    expect(result).toEqual({
      processedCount: 2,
      metadata: { connections: 2, failed: 1, failedConnectionIds: ['conn-2'] },
    });
  });

  it('does not sync when the lease signal is already aborted', async () => {
    const { lease } = leaseStub(true);
    const { modelSync, runScheduledCatalogSync } = syncStub([]);

    await new SchedulerAiService(modelSync, lease).runAiModelCatalogSync('cron');

    expect(runScheduledCatalogSync).not.toHaveBeenCalled();
  });

  it('hands the lease signal to the sync so it can stop between connections', async () => {
    const { lease } = leaseStub();
    const { modelSync, runScheduledCatalogSync } = syncStub([]);

    await new SchedulerAiService(modelSync, lease).runAiModelCatalogSync('cron');

    const ownership = runScheduledCatalogSync.mock.calls[0]?.[0] as ModelSyncOwnership;
    expect(ownership.signal?.aborted).toBe(false);
  });

  it('fences the sync on this run’s own lease row', async () => {
    const { lease } = leaseStub();
    const { modelSync, runScheduledCatalogSync } = syncStub([]);
    const tx = { $queryRaw: vi.fn().mockResolvedValue([{ job_name: 'x' }]) };

    await new SchedulerAiService(modelSync, lease).runAiModelCatalogSync('cron');
    const ownership = runScheduledCatalogSync.mock.calls[0]?.[0] as ModelSyncOwnership;
    const held = await ownership.stillOwned(tx as never);

    expect(held).toBe(true);
    const [, jobName, ownerId, fencingToken] = tx.$queryRaw.mock.calls[0] as unknown[];
    expect(jobName).toBe(SCHEDULER_JOB_NAMES.aiModelCatalogSync);
    expect(ownerId).toBe(OWNER_ID);
    expect(fencingToken).toBe(FENCING_TOKEN);
  });
});
