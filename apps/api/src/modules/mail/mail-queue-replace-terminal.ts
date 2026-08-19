export const MAIL_JOB_IN_FLIGHT_STATES = [
  'waiting',
  'active',
  'delayed',
  'prioritized',
  'waiting-children',
] as const;

export type MailQueueJobHandle = {
  getState: () => Promise<string>;
  remove: () => Promise<unknown>;
};

export type MailQueueJobLookup = {
  getJob: (jobId: string) => Promise<MailQueueJobHandle | undefined | null>;
};

export function isMailJobInFlight(state: string): boolean {
  return (MAIL_JOB_IN_FLIGHT_STATES as readonly string[]).includes(state);
}

export function shouldReplaceTerminalMailJob(state: string): boolean {
  return state === 'completed' || state === 'failed';
}

/**
 * Drops completed/failed jobs so the same jobId can be re-queued.
 * In-flight jobs stay (debounce).
 */
export async function prepareMailJobIdForEnqueue(
  queue: MailQueueJobLookup,
  jobId: string,
): Promise<'in_flight' | 'ready'> {
  const existing = await queue.getJob(jobId);
  if (!existing) {
    return 'ready';
  }
  const state = await existing.getState();
  if (isMailJobInFlight(state)) {
    return 'in_flight';
  }
  if (shouldReplaceTerminalMailJob(state)) {
    await existing.remove();
  }
  return 'ready';
}
