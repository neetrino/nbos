import { describe, it, expect } from 'vitest';
import { isMeetingVisibleToViewer, type MeetingVisibilityIds } from './calendar-meeting-visibility';

describe('isMeetingVisibleToViewer', () => {
  const ids: MeetingVisibilityIds = {
    linkedDealIds: ['d1'],
    linkedProjectIds: ['p1'],
    linkedContactIds: ['c1'],
  };

  const baseMeeting = {
    createdById: 'other',
    internalParticipantIds: [] as string[],
    dealId: null as string | null,
    projectId: null as string | null,
    contactId: null as string | null,
  };

  it('allows any meeting for ALL scope', () => {
    expect(
      isMeetingVisibleToViewer({ ...baseMeeting }, 'u1', 'ALL', {
        linkedDealIds: [],
        linkedProjectIds: [],
        linkedContactIds: [],
      }),
    ).toBe(true);
  });

  it('allows creator for OWN scope', () => {
    expect(isMeetingVisibleToViewer({ ...baseMeeting, createdById: 'u1' }, 'u1', 'OWN', ids)).toBe(
      true,
    );
  });

  it('allows internal participant for OWN scope', () => {
    expect(
      isMeetingVisibleToViewer(
        { ...baseMeeting, internalParticipantIds: ['u1'] },
        'u1',
        'OWN',
        ids,
      ),
    ).toBe(true);
  });

  it('allows linked deal for OWN scope', () => {
    expect(isMeetingVisibleToViewer({ ...baseMeeting, dealId: 'd1' }, 'u1', 'OWN', ids)).toBe(true);
  });

  it('allows linked project for OWN scope', () => {
    expect(isMeetingVisibleToViewer({ ...baseMeeting, projectId: 'p1' }, 'u1', 'OWN', ids)).toBe(
      true,
    );
  });

  it('allows linked contact for OWN scope', () => {
    expect(isMeetingVisibleToViewer({ ...baseMeeting, contactId: 'c1' }, 'u1', 'OWN', ids)).toBe(
      true,
    );
  });

  it('denies unrelated user for OWN scope', () => {
    expect(isMeetingVisibleToViewer({ ...baseMeeting, dealId: 'dx' }, 'u1', 'OWN', ids)).toBe(
      false,
    );
  });
});
