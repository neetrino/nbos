/**
 * UTC day boundary helpers for “due on or before end of day” auto-generation queries.
 */

/** Inclusive end of the UTC calendar day for the calendar day of `instant` (23:59:59.999Z). */
export function endOfUtcDayUtc(instant: Date): Date {
  return new Date(
    Date.UTC(
      instant.getUTCFullYear(),
      instant.getUTCMonth(),
      instant.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}
