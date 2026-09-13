import { describe, expect, it } from 'vitest';
import { flattenMessageKeys } from '@/i18n/flatten-messages';
import en from '@/messages/en/client-services.json';
import ru from '@/messages/ru/client-services.json';
import {
  CLIENT_SERVICE_BILLING_MESSAGE_KEYS,
  CLIENT_SERVICE_FREQUENCY_MESSAGE_KEYS,
  CLIENT_SERVICE_REGISTRY_TOAST_MESSAGE_KEYS,
  CLIENT_SERVICE_STAGE_MESSAGE_KEYS,
  CLIENT_SERVICE_STATUS_MESSAGE_KEYS,
  CLIENT_SERVICE_TYPE_MESSAGE_KEYS,
} from './client-service-message-keys';

describe('client-service message catalogs', () => {
  it('keeps EN/RU keys aligned', () => {
    expect(flattenMessageKeys(ru).sort()).toEqual(flattenMessageKeys(en).sort());
  });

  it('covers type, status, billing, frequency, stage, and registry outcomes', () => {
    expect(Object.keys(CLIENT_SERVICE_TYPE_MESSAGE_KEYS)).toEqual([
      'DOMAIN',
      'HOSTING',
      'SERVICE',
      'ACCOUNT',
      'LICENSE',
    ]);
    expect(Object.keys(CLIENT_SERVICE_STATUS_MESSAGE_KEYS)).toEqual([
      'PENDING',
      'ACTIVE',
      'SUSPENDED',
      'EXPIRING_SOON',
      'EXPIRED',
      'CANCELLED',
    ]);
    expect(Object.keys(CLIENT_SERVICE_BILLING_MESSAGE_KEYS)).toEqual(['WE_PAY', 'REMINDER_ONLY']);
    expect(Object.keys(CLIENT_SERVICE_FREQUENCY_MESSAGE_KEYS)).toEqual([
      'ONE_TIME',
      'MONTHLY',
      'QUARTERLY',
      'YEARLY',
      'MULTI_YEAR',
    ]);
    expect(Object.keys(CLIENT_SERVICE_STAGE_MESSAGE_KEYS)).toEqual([
      'pay_now',
      'invoice',
      'upcoming',
      'active',
    ]);
    expect(Object.keys(CLIENT_SERVICE_REGISTRY_TOAST_MESSAGE_KEYS)).toEqual([
      'updated',
      'unchanged',
      'not_found',
      'no_expiry',
      'failed',
    ]);
  });
});
