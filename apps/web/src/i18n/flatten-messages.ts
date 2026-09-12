import type { AbstractIntlMessages } from 'next-intl';

export function flattenMessageKeys(messages: AbstractIntlMessages, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      keys.push(path);
      continue;
    }
    if (isMessageRecord(value)) {
      keys.push(...flattenMessageKeys(value, path));
    }
  }
  return keys;
}

function isMessageRecord(value: unknown): value is AbstractIntlMessages {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
