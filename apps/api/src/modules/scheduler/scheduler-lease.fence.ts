import type { TransactionClient } from '@nbos/database';

/** Identifies one lease generation: job, owner and the token acquire handed out. */
export type SchedulerLeaseFence = {
  jobName: string;
  ownerId: string;
  fencingToken: bigint;
};

/**
 * Database-level fencing for a job that writes inside its own transaction.
 *
 * An `AbortSignal` only reports what the last heartbeat saw, so a run can lose
 * the lease after the final in-memory check and still commit beside its
 * successor. This locks the lease row instead: while the caller's transaction is
 * open, `SchedulerLeaseService.acquire` cannot take the job over, because its
 * `ON CONFLICT DO UPDATE` waits for the same row. If the takeover already
 * happened, the owner/token no longer match and no row comes back, so the caller
 * must abandon the transaction before writing anything.
 *
 * `clock_timestamp()` rather than `now()`: `now()` is the transaction start
 * time, which would treat a lease that expired during the transaction as live.
 *
 * Call it as the first statement of the transaction that performs the writes.
 * Called anywhere else it proves nothing, because the lock is released on
 * commit.
 */
export async function isSchedulerLeaseHeld(
  tx: TransactionClient,
  fence: SchedulerLeaseFence,
): Promise<boolean> {
  const rows = await tx.$queryRaw<Array<{ job_name: string }>>`
    SELECT "job_name"
    FROM "scheduler_leases"
    WHERE "job_name" = ${fence.jobName}
      AND "owner_id" = ${fence.ownerId}
      AND "fencing_token" = ${fence.fencingToken}
      AND "lease_until" > clock_timestamp()
    FOR UPDATE
  `;
  return rows.length > 0;
}
