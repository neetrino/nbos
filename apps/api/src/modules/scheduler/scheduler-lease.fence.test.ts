import { describe, expect, it, vi } from 'vitest';
import { isSchedulerLeaseHeld } from './scheduler-lease.fence';

const FENCE = { jobName: 'ai-model-catalog-sync', ownerId: 'pid:owner-1', fencingToken: 4n };

function txStub(rows: Array<{ job_name: string }>) {
  return { $queryRaw: vi.fn().mockResolvedValue(rows) };
}

describe('scheduler lease fencing', () => {
  it('confirms ownership when the row still belongs to this owner and token', async () => {
    const tx = txStub([{ job_name: FENCE.jobName }]);

    await expect(isSchedulerLeaseHeld(tx as never, FENCE)).resolves.toBe(true);
  });

  it('refuses once a successor owns the lease', async () => {
    const tx = txStub([]);

    await expect(isSchedulerLeaseHeld(tx as never, FENCE)).resolves.toBe(false);
  });

  it('matches on owner and fencing token, and locks the row it matched', async () => {
    const tx = txStub([{ job_name: FENCE.jobName }]);

    await isSchedulerLeaseHeld(tx as never, FENCE);

    const [fragments, jobName, ownerId, fencingToken] = tx.$queryRaw.mock.calls[0] as unknown[] as [
      TemplateStringsArray,
      string,
      string,
      bigint,
    ];
    expect(jobName).toBe(FENCE.jobName);
    expect(ownerId).toBe(FENCE.ownerId);
    expect(fencingToken).toBe(FENCE.fencingToken);
    const sql = fragments.join(' ');
    expect(sql).toContain('FOR UPDATE');
    // An expired lease is not ownership, and `now()` would report the
    // transaction start time rather than the moment of the check.
    expect(sql).toContain('clock_timestamp()');
  });
});
