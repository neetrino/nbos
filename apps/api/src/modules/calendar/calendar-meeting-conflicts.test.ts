import { describe, it, expect } from 'vitest';
import {
  classifyMeetingConflicts,
  type CalendarMeetingOverlapRow,
} from './calendar-meeting-conflicts';

describe('classifyMeetingConflicts', () => {
  const overlapRow = (partial: Partial<CalendarMeetingOverlapRow>): CalendarMeetingOverlapRow => ({
    id: 'm1',
    title: 'Existing',
    internalParticipantIds: ['u1'],
    projectId: 'p1',
    dealId: null,
    contactId: null,
    ...partial,
  });

  it('returns participant overlap when ids intersect', () => {
    const rows: CalendarMeetingOverlapRow[] = [
      overlapRow({ id: 'm1', internalParticipantIds: ['u1'] }),
    ];
    const conflicts = classifyMeetingConflicts(rows, {
      internalParticipantIds: ['u1', 'u2'],
      projectId: null,
      dealId: null,
      contactId: null,
    });
    expect(conflicts.some((c) => c.code === 'PARTICIPANT_OVERLAP')).toBe(true);
  });

  it('returns project overlap when project matches', () => {
    const rows: CalendarMeetingOverlapRow[] = [
      overlapRow({ id: 'm2', projectId: 'p1', internalParticipantIds: ['other'] }),
    ];
    const conflicts = classifyMeetingConflicts(rows, {
      internalParticipantIds: ['u9'],
      projectId: 'p1',
      dealId: null,
      contactId: null,
    });
    expect(conflicts.some((c) => c.code === 'PROJECT_OVERLAP')).toBe(true);
  });

  it('dedupes same code and meeting id', () => {
    const rows: CalendarMeetingOverlapRow[] = [
      overlapRow({ id: 'm3', internalParticipantIds: ['u1'], projectId: 'p1' }),
    ];
    const conflicts = classifyMeetingConflicts(rows, {
      internalParticipantIds: ['u1'],
      projectId: 'p1',
      dealId: null,
      contactId: null,
    });
    const participant = conflicts.filter((c) => c.code === 'PARTICIPANT_OVERLAP');
    expect(participant).toHaveLength(1);
  });
});
