import { describe, expect, it } from 'vitest';
import { buildAcceptInviteUrl, isOpenInviteEmail, openInviteEmail } from './invitation-link';

describe('invitation link', () => {
  it('puts the invitation token in the accept URL', () => {
    const url = buildAcceptInviteUrl('https://nbos.neetrino.com/', 'tok-1');
    expect(url).toBe('https://nbos.neetrino.com/accept-invite?token=tok-1');
    expect(url).not.toContain('invitationId');
  });

  it('marks open-link placeholders and leaves real emails alone', () => {
    const placeholder = openInviteEmail('inv-1');
    expect(isOpenInviteEmail(placeholder)).toBe(true);
    expect(isOpenInviteEmail('person@mail.ru')).toBe(false);
  });
});
