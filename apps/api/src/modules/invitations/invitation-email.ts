import { interpolateSystemCopy, invitationEmailCopy } from '@nbos/shared';

export function buildInvitationEmail(params: {
  locale: unknown;
  inviteLink: string;
  expiresAtDate: string;
}): { subject: string; html: string } {
  const copy = invitationEmailCopy(params.locale);
  const safeLink = escapeInvitationHtml(params.inviteLink);
  return {
    subject: copy.subject,
    html: [
      `<p>${escapeInvitationHtml(copy.intro)}</p>`,
      `<p>${escapeInvitationHtml(copy.action)}: <a href="${safeLink}">${safeLink}</a></p>`,
      `<p>${escapeInvitationHtml(
        interpolateSystemCopy(copy.expires, { expiresAt: params.expiresAtDate }),
      )}</p>`,
    ].join(''),
  };
}

function escapeInvitationHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
