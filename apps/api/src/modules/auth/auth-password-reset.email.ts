import { Logger } from '@nestjs/common';
import { interpolateSystemCopy, passwordResetEmailCopy } from '@nbos/shared';

const RESEND_API_URL = 'https://api.resend.com/emails';

export function buildPasswordResetEmail(params: {
  locale: unknown;
  resetUrl: string;
  expiresAt: Date;
}): { subject: string; html: string } {
  const copy = passwordResetEmailCopy(params.locale);
  const expiresLabel = params.expiresAt.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const safeUrl = escapeHtml(params.resetUrl);
  return {
    subject: copy.subject,
    html: [
      `<p>${escapeHtml(copy.intro)}</p>`,
      `<p><a href="${safeUrl}">${escapeHtml(copy.action)}</a></p>`,
      `<p>${escapeHtml(interpolateSystemCopy(copy.expires, { expiresLabel }))}</p>`,
      `<p>${escapeHtml(copy.ignore)}</p>`,
    ].join(''),
  };
}

export async function sendPasswordResetEmail(params: {
  email: string;
  resetUrl: string;
  expiresAt: Date;
  logger: Logger;
  locale?: unknown;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const { email, resetUrl, expiresAt, logger, locale } = params;

  if (!apiKey || !fromEmail) {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn(`Password reset email skipped (Resend unset). Dev URL: ${resetUrl}`);
    } else {
      logger.warn('Password reset email skipped: RESEND_API_KEY or RESEND_FROM_EMAIL is unset');
    }
    return;
  }

  const replyTo = process.env.RESEND_ADMIN_EMAIL;
  const { subject, html } = buildPasswordResetEmail({ locale, resetUrl, expiresAt });

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        reply_to: replyTo ? [replyTo] : undefined,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn(`Failed to send password reset email: ${errorText}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.warn(`Resend request failed for password reset: ${message}`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
