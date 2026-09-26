import { describe, expect, it } from 'vitest';
import { buildGuestInviteJoinUrl, resolveVideoMeetingDisplayTitle } from './video-meeting-title';

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

describe('buildGuestInviteJoinUrl', () => {
  it('returns a copyable join URL with the invite secret', () => {
    const url = buildGuestInviteJoinUrl('secret-token', 'https://nbos.example');
    expect(url).toBe('https://nbos.example/video-meetings/join?invite=secret-token');
  });
});
