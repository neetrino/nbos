import { describe, expect, it } from 'vitest';
import { CALENDAR_MEETING_CONFLICT_CODE, toApiError } from '../api-errors';
import { parseCalendarMeetingConflicts } from './calendar';

const CONFLICT = {
  code: 'PARTICIPANT_OVERLAP',
  meetingId: 'mtg-1',
  meetingTitle: 'Existing slot',
  detail: 'Participant already booked',
};

describe('parseCalendarMeetingConflicts', () => {
  it('reads top-level conflicts from the API 409 body', () => {
    const error = toApiError(
      {
        statusCode: 409,
        code: CALENDAR_MEETING_CONFLICT_CODE,
        message: 'Meeting overlaps with existing scheduled meetings.',
        conflicts: [CONFLICT],
      },
      'Request failed',
    );

    expect(parseCalendarMeetingConflicts(error)).toEqual([CONFLICT]);
  });

  it('reads conflicts nested under details', () => {
    const error = toApiError(
      {
        statusCode: 409,
        code: CALENDAR_MEETING_CONFLICT_CODE,
        message: 'Meeting overlaps with existing scheduled meetings.',
        details: { conflicts: [CONFLICT] },
      },
      'Request failed',
    );

    expect(parseCalendarMeetingConflicts(error)).toEqual([CONFLICT]);
  });

  it('returns null when the conflict list is missing', () => {
    const error = toApiError(
      {
        statusCode: 409,
        code: CALENDAR_MEETING_CONFLICT_CODE,
        message: 'Meeting overlaps with existing scheduled meetings.',
      },
      'Request failed',
    );

    expect(parseCalendarMeetingConflicts(error)).toBeNull();
  });
});
