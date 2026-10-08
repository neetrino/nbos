import { SCHEDULER_OCCURRENCE_STATUS } from './scheduler-occurrence.constants';

export type SchedulerQueueJobState =
  | 'missing'
  | 'waiting'
  | 'delayed'
  | 'active'
  | 'completed'
  | 'failed';

export type OccurrenceReconcilePlan =
  | 'enqueue'
  | 'mark_succeeded'
  | 'reset_enqueue'
  | 'wait'
  | 'noop';

const TERMINAL = new Set<string>([
  SCHEDULER_OCCURRENCE_STATUS.SUCCEEDED,
  SCHEDULER_OCCURRENCE_STATUS.FAILED,
  SCHEDULER_OCCURRENCE_STATUS.CANCELLED,
]);

const PARKED = new Set<SchedulerQueueJobState>(['waiting', 'delayed', 'active']);

/**
 * Capacity is the queue lane, not a terminal skip.
 * A missing Redis job for a non-terminal occurrence is enqueued again.
 */
export function planOccurrenceReconcile(input: {
  status: string;
  queueState: SchedulerQueueJobState;
  runningStale: boolean;
}): OccurrenceReconcilePlan {
  if (TERMINAL.has(input.status)) return 'noop';
  if (input.status === SCHEDULER_OCCURRENCE_STATUS.RUNNING) {
    return planRunningOccurrence(input.queueState, input.runningStale);
  }
  if (input.queueState === 'completed') return 'mark_succeeded';
  if (PARKED.has(input.queueState)) return 'wait';
  return 'enqueue';
}

function planRunningOccurrence(
  queueState: SchedulerQueueJobState,
  runningStale: boolean,
): OccurrenceReconcilePlan {
  if (!runningStale || queueState === 'active') return 'wait';
  if (queueState === 'completed') return 'mark_succeeded';
  return 'reset_enqueue';
}

/** Worker lane decision. `wait` keeps the firing in the durable queue. */
export function admitSchedulerExecution(running: number, maxConcurrent: number): 'start' | 'wait' {
  if (running >= maxConcurrent) return 'wait';
  return 'start';
}

export function mapBullMqJobState(state: string | null | undefined): SchedulerQueueJobState {
  if (state === 'waiting' || state === 'paused' || state === 'waiting-children') return 'waiting';
  if (state === 'delayed') return 'delayed';
  if (state === 'active') return 'active';
  if (state === 'completed') return 'completed';
  if (state === 'failed') return 'failed';
  return 'missing';
}
