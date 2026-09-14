import type { MailMessageRow } from '@/lib/api/mail';

const SAME_DAY_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
};

const SHORT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
};

const FULL_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export function formatMailListDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], SAME_DAY_TIME_OPTIONS);
  }
  return date.toLocaleDateString([], SHORT_DATE_OPTIONS);
}

export function formatMailMessageTime(iso: string): string {
  return new Date(iso).toLocaleString([], FULL_DATE_OPTIONS);
}

export function mailInitialsFromLabel(label: string): string {
  const trimmed = label.trim();
  const source = trimmed.includes('@') ? (trimmed.split('@')[0] ?? trimmed) : trimmed;
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  const first = parts[0]![0] ?? '';
  const last = parts[parts.length - 1]![0] ?? '';
  return `${first}${last}`.toUpperCase();
}

export function messageSenderLabel(message: MailMessageRow): string {
  const from = message.recipients.find((row) => row.kind === 'FROM');
  const named = from?.displayName?.trim();
  if (named) {
    return named;
  }
  if (from?.email) {
    return from.email;
  }
  return message.direction === 'OUTBOUND' ? 'You' : 'Unknown';
}

export function messageTimestampIso(message: MailMessageRow): string | null {
  return message.sentAt ?? message.receivedAt;
}
