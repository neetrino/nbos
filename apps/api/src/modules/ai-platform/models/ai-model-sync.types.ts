import type { TransactionClient } from '@nbos/database';
import { AiProviderHttpError } from '../providers/ai-provider-http';
import type { AiModelView } from './ai-model.mapper';

export type ModelSyncActor = { kind: 'employee'; employeeId: string } | { kind: 'system' };

export interface ModelSyncResult {
  connectionId: string;
  created: number;
  refreshed: number;
  disappeared: number;
  models: AiModelView[];
}

export type ModelSyncConnectionOutcome =
  | { connectionId: string; ok: true; result: ModelSyncResult }
  | { connectionId: string; ok: false; errorCode: string };

/** Reported per connection when a scheduled run lost its lease mid-flight. */
export const MODEL_SYNC_LEASE_LOST_CODE = 'LEASE_LOST';

export class ModelSyncLeaseLostError extends Error {
  constructor() {
    super('The scheduler lease was lost before the catalog could be written');
    this.name = 'ModelSyncLeaseLostError';
  }
}

/**
 * How a scheduled run proves it is still the owner.
 *
 * `signal` is the cheap check between provider steps. `stillOwned` is the
 * authoritative one: it runs inside the write transaction and must lock whatever
 * row grants ownership, so a successor cannot start committing while this run is
 * mid-transaction. The AI Platform never learns what that row is — the scheduler
 * owns the lease implementation and passes the probe in.
 */
export interface ModelSyncOwnership {
  readonly signal?: AbortSignal;
  stillOwned(tx: TransactionClient): Promise<boolean>;
}

/**
 * Fencing check for a scheduled run: the provider call can take long enough for
 * the lease to expire, and a successor may already be working, so the run must
 * stop before it commits anything else.
 */
export function assertSyncOwnership(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new ModelSyncLeaseLostError();
  }
}

/**
 * Transaction-scoped ownership check. A run without an ownership probe is an
 * employee-triggered sync, which is authorized by the request rather than by a
 * lease and therefore has nothing to fence against.
 */
export async function assertSyncOwnershipInTransaction(
  tx: TransactionClient,
  ownership: ModelSyncOwnership | undefined,
): Promise<void> {
  if (!ownership) return;
  if (!(await ownership.stillOwned(tx))) {
    throw new ModelSyncLeaseLostError();
  }
}

export function toModelSyncErrorCode(error: unknown): string {
  if (error instanceof ModelSyncLeaseLostError) {
    return MODEL_SYNC_LEASE_LOST_CODE;
  }
  if (error instanceof AiProviderHttpError) {
    return error.errorCode;
  }
  return 'SYNC_FAILED';
}
