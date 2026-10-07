import { CronTime } from 'cron';
import { SCHEDULER_BUSINESS_TIMEZONE } from './scheduler-timezone';

const SLOT_WALK_LIMIT = 5_000;
const SLOT_HORIZON_MS = 48 * 60 * 60 * 1000;

/**
 * Latest cron instant at or before `now`, computed in the business timezone.
 * The result is an absolute UTC instant, so replicas and host TZ cannot fork the key.
 */
export function resolveSchedulerSlot(
  expression: string,
  now: Date,
  timeZone: string = SCHEDULER_BUSINESS_TIMEZONE,
): Date {
  const cronTime = new CronTime(expression, timeZone);
  const immediate = cronTime.getNextDateFrom(new Date(now.getTime() - 1), timeZone).toJSDate();
  if (immediate.getTime() <= now.getTime()) return immediate;
  return walkBackToSlot(cronTime, timeZone, now);
}

function walkBackToSlot(cronTime: CronTime, timeZone: string, now: Date): Date {
  let probe = new Date(now.getTime() - SLOT_HORIZON_MS);
  let last: Date | null = null;
  for (let step = 0; step < SLOT_WALK_LIMIT; step += 1) {
    const next = cronTime.getNextDateFrom(probe, timeZone).toJSDate();
    if (next.getTime() > now.getTime()) break;
    last = next;
    probe = new Date(next.getTime() + 1);
  }
  if (!last) {
    throw new Error(`No scheduler slot at or before ${now.toISOString()}`);
  }
  return last;
}
