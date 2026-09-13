import { describe, expect, it } from 'vitest';
import { buildInvitationEmail } from './invitation-email';

describe('buildInvitationEmail', () => {
  it('uses the inviter locale for chrome and keeps the invite URL', () => {
    const email = buildInvitationEmail({
      locale: 'ru',
      inviteLink: 'https://nbos.test/accept-invite?invitationId=inv-1',
      expiresAtDate: '2026-09-20',
    });
    expect(email.subject).toBe('Вас пригласили в NBOS');
    expect(email.html).toContain('Принять приглашение');
    expect(email.html).toContain('https://nbos.test/accept-invite?invitationId=inv-1');
    expect(email.html).toContain('2026-09-20');
  });
});
