import { CronTime } from 'cron';
import { SCHEDULER_BUSINESS_TIMEZONE } from './scheduler-timezone';

const SLOT_WALK_LIMIT = 5_000;
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const LOOKBACK_SUBHOUR_MS = 2 * HOUR_MS;
const LOOKBACK_DAILY_MS = 26 * HOUR_MS;
const LOOKBACK_WEEKLY_MS = 8 * DAY_MS;
const LOOKBACK_MONTHLY_MS = 62 * DAY_MS;
const LOOKBACK_YEARLY_MS = 366 * DAY_MS;

/**
 * Latest cron instant at or before `now`, in the business timezone.
 * The lookback follows the expression (weekly, monthly, yearly), not a fixed 48h window.
 * The result is an absolute UTC instant, so replicas and host TZ cannot fork the key.
 */
export function resolveSchedulerSlot(
  expression: string,
  now: Date,
  timeZone: string = SCHEDULER_BUSINESS_TIMEZONE,
): Date {
  const cronTime = new CronTime(expression, timeZone);
  const probeStart = new Date(now.getTime() - slotLookbackMs(expression));
  return walkToSlot(cronTime, timeZone, expression, probeStart, now);
}

function walkToSlot(
  cronTime: CronTime,
  timeZone: string,
  expression: string,
  probeStart: Date,
  now: Date,
): Date {
  let probe = probeStart;
  let last: Date | null = null;
  for (let step = 0; step < SLOT_WALK_LIMIT; step += 1) {
    const next = cronTime.getNextDateFrom(probe, timeZone).toJSDate();
    if (next.getTime() > now.getTime()) {
      if (!last) throw new Error(`No scheduler slot at or before ${now.toISOString()}`);
      return last;
    }
    last = next;
    const advanced = new Date(next.getTime() + 1);
    if (advanced.getTime() <= probe.getTime()) {
      throw new Error(`Scheduler slot walk stalled for ${expression}`);
    }
    probe = advanced;
  }
  throw new Error(`Scheduler slot walk exceeded ${SLOT_WALK_LIMIT} steps for ${expression}`);
}

function slotLookbackMs(expression: string): number {
  const fields = expression.trim().split(/\s+/);
  const offset = fields.length >= 6 ? 1 : 0;
  const minute = fields[offset];
  const hour = fields[offset + 1];
  const dayOfMonth = fields[offset + 2];
  const month = fields[offset + 3];
  const dayOfWeek = fields[offset + 4];
  if (!month || !isOpenCronField(month)) return LOOKBACK_YEARLY_MS;
  if (!dayOfMonth || !isOpenCronField(dayOfMonth)) return LOOKBACK_MONTHLY_MS;
  if (!dayOfWeek || !isOpenCronField(dayOfWeek)) return LOOKBACK_WEEKLY_MS;
  if (!hour || !isOpenCronField(hour)) return LOOKBACK_DAILY_MS;
  if (!minute || !isOpenCronField(minute)) return LOOKBACK_SUBHOUR_MS;
  return fields.length >= 6 ? 2 * MINUTE_MS : LOOKBACK_SUBHOUR_MS;
}

function isOpenCronField(field: string): boolean {
  return field === '*' || field === '?';
}
