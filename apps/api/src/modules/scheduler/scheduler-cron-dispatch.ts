export type SchedulerCronTick = {
  jobName: string;
  expression: string;
};

type SchedulerCronDispatch = (tick: SchedulerCronTick) => Promise<void>;

let dispatch: SchedulerCronDispatch | null = null;

/** Registered from the occurrence service constructor, before cron ticks. */
export function registerSchedulerCronDispatch(next: SchedulerCronDispatch | null): void {
  dispatch = next;
}

export function schedulerCronDispatch(): SchedulerCronDispatch | null {
  return dispatch;
}
