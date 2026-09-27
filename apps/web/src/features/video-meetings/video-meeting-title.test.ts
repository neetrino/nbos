import { describe, expect, it } from 'vitest';
import {
  buildGuestInviteJoinUrl,
  resolveVideoMeetingDisplayTitle,
  suggestNextVideoMeetingTitle,
} from './video-meeting-title';

describe('resolveVideoMeetingDisplayTitle', () => {
  it('maps legacy English and Russian defaults to the localized label', () => {
    expect(resolveVideoMeetingDisplayTitle('Instant meeting', 'Мгновенная встреча')).toBe(
      'Мгновенная встреча',
    );
    expect(resolveVideoMeetingDisplayTitle('Мгновенная встреча', 'Instant meeting')).toBe(
      'Instant meeting',
    );
  });

  it('keeps a custom title', () => {
    expect(resolveVideoMeetingDisplayTitle('Client sync', 'Мгновенная встреча')).toBe(
      'Client sync',
    );
  });
});

describe('suggestNextVideoMeetingTitle', () => {
  it('starts at 1 and skips titles that already use the sequence', () => {
    expect(suggestNextVideoMeetingTitle([], 'Meeting')).toBe('Meeting 1');
    expect(suggestNextVideoMeetingTitle(['Meeting 1', 'Meeting 2'], 'Meeting')).toBe('Meeting 3');
    expect(suggestNextVideoMeetingTitle(['Meeting 1', 'Meeting 3'], 'Meeting')).toBe('Meeting 2');
  });

  it('ignores custom titles and the old instant-meeting default', () => {
    expect(suggestNextVideoMeetingTitle(['Instant meeting', 'Client sync'], 'Meeting')).toBe(
      'Meeting 1',
    );
  });
});

describe('buildGuestInviteJoinUrl', () => {
  it('returns a copyable join URL with the invite secret', () => {
    const url = buildGuestInviteJoinUrl('secret-token', 'https://nbos.example');
    expect(url).toBe('https://nbos.example/video-meetings/join?invite=secret-token');
  });
});
