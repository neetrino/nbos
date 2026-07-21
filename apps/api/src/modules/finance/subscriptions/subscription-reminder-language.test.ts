import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SUBSCRIPTION_REMINDER_LANGUAGE,
  parseReminderLanguage,
} from './subscription-reminder-language';

describe('parseReminderLanguage', () => {
  it('defaults to HY', () => {
    expect(parseReminderLanguage(undefined)).toBe(DEFAULT_SUBSCRIPTION_REMINDER_LANGUAGE);
    expect(parseReminderLanguage('')).toBe('HY');
  });

  it('accepts HY / RU / EN case-insensitively', () => {
    expect(parseReminderLanguage('hy')).toBe('HY');
    expect(parseReminderLanguage('RU')).toBe('RU');
    expect(parseReminderLanguage('en')).toBe('EN');
  });

  it('rejects unknown values', () => {
    expect(() => parseReminderLanguage('FR')).toThrow(BadRequestException);
  });
});
