import { ATS_CLICK_TO_CALL_HISTORY_START_SKEW_MS, ATS_YEREVAN_OFFSET_MS } from './ats.constants';
import type { AtsHistoryCallRow } from './ats-history.parse';
import { normalizeAtsCallerPhone } from './ats-phone.util';

export function matchHistoryToPendingCall(
  rows: AtsHistoryCallRow[],
  input: { phoneE164: string; createdAt: Date; now?: Date },
): AtsHistoryCallRow | null {
  const now = input.now ?? new Date();
  const windowStart = new Date(input.createdAt.getTime() - ATS_CLICK_TO_CALL_HISTORY_START_SKEW_MS);
  const matches = rows.filter(
    (row) =>
      row.ended &&
      historyRowMatchesPhone(row, input.phoneE164) &&
      historyRowInWindow(row, windowStart, now),
  );
  if (matches.length === 0) return null;
  return (
    matches.sort((left, right) => compareHistoryMatch(left, right, input.createdAt, now))[0] ?? null
  );
}

function historyRowMatchesPhone(row: AtsHistoryCallRow, phoneE164: string): boolean {
  const expected = normalizeAtsCallerPhone(phoneE164);
  if (!expected.success) return false;
  return row.phones.some((raw) => {
    const phone = normalizeAtsCallerPhone(raw);
    return phone.success && phone.digits === expected.digits;
  });
}

function historyRowInWindow(row: AtsHistoryCallRow, windowStart: Date, now: Date): boolean {
  const startedAt = effectiveHistoryStartedAt(row.startedAt, now);
  if (!startedAt) return true;
  return startedAt >= windowStart && startedAt <= now;
}

function compareHistoryMatch(
  left: AtsHistoryCallRow,
  right: AtsHistoryCallRow,
  createdAt: Date,
  now: Date,
): number {
  const byDirection = Number(isOutCall(right)) - Number(isOutCall(left));
  if (byDirection !== 0) return byDirection;
  return historyStartDelta(left, createdAt, now) - historyStartDelta(right, createdAt, now);
}

function isOutCall(row: AtsHistoryCallRow): boolean {
  return row.direction?.trim().toLowerCase() === 'out call';
}

function historyStartDelta(row: AtsHistoryCallRow, createdAt: Date, now: Date): number {
  const startedAt = effectiveHistoryStartedAt(row.startedAt, now);
  if (!startedAt) return Number.POSITIVE_INFINITY;
  return Math.abs(startedAt.getTime() - createdAt.getTime());
}

/** ATS.am often stamps Yerevan wall clock as UTC, so live peeks look "in the future". */
function effectiveHistoryStartedAt(startedAt: Date | null, now: Date): Date | null {
  if (!startedAt) return null;
  if (startedAt.getTime() <= now.getTime()) return startedAt;
  const shifted = new Date(startedAt.getTime() - ATS_YEREVAN_OFFSET_MS);
  return shifted.getTime() <= now.getTime() ? shifted : startedAt;
}
