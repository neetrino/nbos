/**
 * Calendar reminders (canon: Meeting starts_at → Scheduler → Notifications) are
 * **not implemented** as a runnable job in this codebase as of Video Meetings S07.
 *
 * Video Meetings must not invent a second reminder pipeline. When a
 * `calendarMeetingId` link exists, reminder ownership stays with Calendar
 * **if/when** that scheduler path ships. Linking alone does not enqueue
 * notifications from this module.
 *
 * Call sites may invoke {@link noteCalendarLinkedReminderOwnership} after an
 * explicit link for audit/documentation clarity; it is intentionally a no-op.
 */
export function noteCalendarLinkedReminderOwnership(calendarMeetingId: string | null): void {
  if (!calendarMeetingId) return;
  // No Calendar reminder notifier exists to invoke (S07 discovery).
}
