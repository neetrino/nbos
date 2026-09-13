import { describe, expect, it } from 'vitest';
import { buildPasswordResetEmail } from './auth-password-reset.email';

describe('buildPasswordResetEmail', () => {
  const expiresAt = new Date('2026-09-13T12:00:00.000Z');

  it('keeps English chrome by default', () => {
    const email = buildPasswordResetEmail({
      locale: 'de',
      resetUrl: 'https://nbos.test/reset-password?token=abc',
      expiresAt,
    });
    expect(email.subject).toBe('Reset your NBOS password');
    expect(email.html).toContain('Set a new password');
    expect(email.html).toContain('https://nbos.test/reset-password?token=abc');
  });

  it('renders Russian chrome for a Russian employee', () => {
    const email = buildPasswordResetEmail({
      locale: 'ru',
      resetUrl: 'https://nbos.test/reset-password?token=abc',
      expiresAt,
    });
    expect(email.subject).toBe('Сброс пароля NBOS');
    expect(email.html).toContain('Задать новый пароль');
    expect(email.html).toContain('2026-09-13 12:00 UTC');
  });
});
