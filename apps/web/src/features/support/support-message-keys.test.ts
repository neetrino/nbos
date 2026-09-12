import { describe, expect, it } from 'vitest';
import { flattenMessageKeys } from '@/i18n/flatten-messages';
import enSupport from '@/messages/en/support.json';
import ruSupport from '@/messages/ru/support.json';
import {
  SUPPORT_TICKET_CLOSE_REASON_OPTIONS,
  TICKET_CATEGORIES,
  TICKET_COVERAGE_DECISIONS,
  TICKET_PRIORITIES,
  TICKET_SLA_STATES,
  TICKET_STATUSES,
  TICKET_WAITING_STATES,
} from '@/features/support/constants/support';
import {
  SUPPORT_CATEGORY_MESSAGE_KEYS,
  SUPPORT_CLOSE_REASON_MESSAGE_KEYS,
  SUPPORT_COVERAGE_MESSAGE_KEYS,
  SUPPORT_PRIORITY_MESSAGE_KEYS,
  SUPPORT_SLA_MESSAGE_KEYS,
  SUPPORT_STATUS_MESSAGE_KEYS,
  SUPPORT_WAITING_MESSAGE_KEYS,
} from './support-message-keys';

function extractIcuPlaceholders(value: string): string[] {
  return [...value.matchAll(/\{(\w+)/g)]
    .map((match) => match[1])
    .filter((token): token is string => Boolean(token))
    .sort();
}

describe('support message keys', () => {
  it('covers every ticket value code', () => {
    expect(Object.keys(SUPPORT_CATEGORY_MESSAGE_KEYS).sort()).toEqual(
      TICKET_CATEGORIES.map((row) => row.value).sort(),
    );
    expect(Object.keys(SUPPORT_PRIORITY_MESSAGE_KEYS).sort()).toEqual(
      TICKET_PRIORITIES.map((row) => row.value).sort(),
    );
    expect(Object.keys(SUPPORT_STATUS_MESSAGE_KEYS).sort()).toEqual(
      TICKET_STATUSES.map((row) => row.value).sort(),
    );
    expect(Object.keys(SUPPORT_COVERAGE_MESSAGE_KEYS).sort()).toEqual(
      TICKET_COVERAGE_DECISIONS.map((row) => row.value).sort(),
    );
    expect(Object.keys(SUPPORT_SLA_MESSAGE_KEYS).sort()).toEqual(
      TICKET_SLA_STATES.map((row) => row.value).sort(),
    );
    expect(Object.keys(SUPPORT_WAITING_MESSAGE_KEYS).sort()).toEqual(
      TICKET_WAITING_STATES.map((row) => row.value).sort(),
    );
    expect(Object.keys(SUPPORT_CLOSE_REASON_MESSAGE_KEYS)).toEqual(
      expect.arrayContaining([
        ...SUPPORT_TICKET_CLOSE_REASON_OPTIONS.map((row) => row.value),
        'EXTENSION_DELIVERED',
      ]),
    );
  });

  it('keeps EN/RU keys and ICU placeholders aligned', () => {
    const enKeys = flattenMessageKeys(enSupport).sort();
    const ruKeys = flattenMessageKeys(ruSupport).sort();
    expect(ruKeys).toEqual(enKeys);

    expect(extractIcuPlaceholders(enSupport.resolve.description)).toEqual(['min']);
    expect(extractIcuPlaceholders(ruSupport.resolve.description)).toEqual(['min']);
  });
});
