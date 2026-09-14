import type { MailMessageRow } from '@/lib/api/mail';

export function latestOutboundDraftMessage(messages: MailMessageRow[]): MailMessageRow | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.direction === 'OUTBOUND' && message.deliveryStatus === 'DRAFT') {
      return message;
    }
  }
  return null;
}

export function emailsForRecipientKind(message: MailMessageRow, kind: string): string {
  return message.recipients
    .filter((row) => row.kind === kind)
    .map((row) => row.email)
    .join(', ');
}

export function isMailComposeOnlyDraftThread(thread: { lastInboundAt: string | null }): boolean {
  return thread.lastInboundAt === null;
}

export function splitEmailList(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function defaultReplyToFromMessages(messages: MailMessageRow[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (!m || m.direction !== 'INBOUND') continue;
    const from = m.recipients.find((r) => r.kind === 'FROM');
    if (from?.email) return from.email;
  }
  return '';
}

export function defaultReplySubjectFromMessages(messages: MailMessageRow[]): string {
  const sub =
    messages.find((m) => m.direction === 'INBOUND')?.subject ?? messages[0]?.subject ?? '';
  if (/^re:\s*/i.test(sub)) return sub;
  return sub ? `Re: ${sub}` : 'Re:';
}

export function defaultForwardSubjectFromMessages(messages: MailMessageRow[]): string {
  const sub =
    messages.find((m) => m.direction === 'INBOUND')?.subject ?? messages[0]?.subject ?? '';
  if (/^fwd:\s*/i.test(sub)) return sub;
  return sub ? `Fwd: ${sub}` : 'Fwd:';
}
