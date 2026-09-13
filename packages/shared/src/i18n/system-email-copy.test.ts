import { describe, expect, it } from 'vitest';
import {
  interpolateSystemCopy,
  invitationEmailCopy,
  passwordResetEmailCopy,
  reportExportEmailCopy,
} from './system-email-copy';

describe('system email copy', () => {
  it('keeps English password-reset chrome as the default', () => {
    expect(passwordResetEmailCopy('en').subject).toBe('Reset your NBOS password');
    expect(passwordResetEmailCopy('de').subject).toBe('Reset your NBOS password');
  });

  it('returns Russian and Armenian password-reset subjects', () => {
    expect(passwordResetEmailCopy('ru').subject).toBe('Сброс пароля NBOS');
    expect(passwordResetEmailCopy('hy').subject).toBe('NBOS գաղտնաբառի վերականգնում');
  });

  it('interpolates report-export placeholders without changing the title', () => {
    const copy = reportExportEmailCopy('ru');
    expect(interpolateSystemCopy(copy.subject, { title: 'Company P&L', format: 'CSV' })).toBe(
      'Company P&L — отчёт CSV готов',
    );
    expect(interpolateSystemCopy(copy.asOf, { date: '2026-08-01' })).toBe('На 2026-08-01');
  });

  it('keeps invitation placeholders aligned across locales', () => {
    expect(invitationEmailCopy('en').expires).toContain('{expiresAt}');
    expect(invitationEmailCopy('ru').expires).toContain('{expiresAt}');
    expect(invitationEmailCopy('hy').expires).toContain('{expiresAt}');
  });
});
