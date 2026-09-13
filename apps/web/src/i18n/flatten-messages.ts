import type { AbstractIntlMessages } from 'next-intl';

export type FlattenedMessage = {
  path: string;
  value: string;
};

export function flattenMessageKeys(messages: AbstractIntlMessages, prefix = ''): string[] {
  return flattenMessageEntries(messages, prefix).map((entry) => entry.path);
}

export function flattenMessageEntries(
  messages: AbstractIntlMessages,
  prefix = '',
): FlattenedMessage[] {
  const entries: FlattenedMessage[] = [];
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      entries.push({ path, value });
      continue;
    }
    if (isMessageRecord(value)) {
      entries.push(...flattenMessageEntries(value, path));
    }
  }
  return entries;
}

function isMessageRecord(value: unknown): value is AbstractIntlMessages {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
