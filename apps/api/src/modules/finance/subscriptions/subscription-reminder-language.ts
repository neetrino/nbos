import { BadRequestException } from '@nestjs/common';
import { type Prisma, type SubscriptionReminderLanguage } from '@nbos/database';

const REMINDER_LANGUAGES: SubscriptionReminderLanguage[] = ['HY', 'RU', 'EN'];

export const DEFAULT_SUBSCRIPTION_REMINDER_LANGUAGE: SubscriptionReminderLanguage = 'HY';

export function parseReminderLanguage(raw: string | undefined): SubscriptionReminderLanguage {
  if (raw === undefined || raw === '') return DEFAULT_SUBSCRIPTION_REMINDER_LANGUAGE;
  const upper = raw.trim().toUpperCase();
  if (REMINDER_LANGUAGES.includes(upper as SubscriptionReminderLanguage)) {
    return upper as SubscriptionReminderLanguage;
  }
  throw new BadRequestException(`Unknown reminderLanguage: ${raw}`);
}

export function applyReminderLanguagePatch(
  raw: string | undefined,
  updateData: Prisma.SubscriptionUpdateInput,
): void {
  if (raw === undefined) return;
  updateData.reminderLanguage = parseReminderLanguage(raw);
}
