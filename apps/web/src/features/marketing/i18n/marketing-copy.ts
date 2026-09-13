import type { useTranslations } from 'next-intl';
import type { CrmTranslate } from '@/features/crm/i18n/crm-copy';
import { translateDealStageLabel, translateLeadStageLabel } from '@/features/crm/i18n/crm-copy';
import type { MarketingDashboardPeriodPreset } from '@/features/marketing/constants/marketing-dashboard-period';

export type MarketingTranslate = ReturnType<typeof useTranslations<'marketing'>>;

export type MarketingLabelCatalog =
  | 'channels'
  | 'accountStatus'
  | 'activityStatus'
  | 'activityType';

const MARKETING_CHANNEL_VALUES = [
  'SMM',
  'WEBSITE',
  'LIST_AM',
  'GOOGLE_ADS',
  'META_ADS',
  'CONTENT',
  'SEO',
  'OFFLINE',
  'OTHER',
] as const;

const MARKETING_ACCOUNT_STATUS_VALUES = ['ACTIVE', 'PAUSED', 'ARCHIVED'] as const;

const MARKETING_ACTIVITY_STATUS_VALUES = [
  'IDEA',
  'PREPARING',
  'READY',
  'LAUNCHED',
  'FINISHED',
  'ARCHIVED',
] as const;

const MARKETING_ACTIVITY_TYPE_VALUES = [
  'AD_CAMPAIGN',
  'SMM_POST',
  'STORY_REEL',
  'LIST_AM_PROMOTION',
  'WEBSITE_LANDING',
  'SEO_WORK',
  'OFFLINE_ACTIVITY',
  'OTHER',
] as const;

const LEAD_ATTRIBUTION_STATUS_VALUES = [
  'NEW',
  'DIDNT_GET_THROUGH',
  'CONTACT_ESTABLISHED',
  'MQL',
  'ON_HOLD',
  'SPAM',
  'SQL',
] as const;

const DEAL_ATTRIBUTION_STATUS_VALUES = [
  'START_CONVERSATION',
  'DISCUSS_NEEDS',
  'SEND_OFFER',
  'GET_ANSWER',
  'DEPOSIT_AND_CONTRACT',
  'FAILED',
  'WON',
] as const;

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

export function marketingMessage(
  t: MarketingTranslate,
  key: string,
  values?: Record<string, string | number | Date>,
): string {
  return t(key as never, values as never);
}

export function translateMarketingChannelLabel(t: MarketingTranslate, value: string): string {
  if (isOneOf(value, MARKETING_CHANNEL_VALUES)) {
    return marketingMessage(t, `channels.${value}`);
  }
  return value;
}

export function translateMarketingAccountStatusLabel(t: MarketingTranslate, value: string): string {
  if (isOneOf(value, MARKETING_ACCOUNT_STATUS_VALUES)) {
    return marketingMessage(t, `accountStatus.${value}`);
  }
  return value;
}

export function translateMarketingActivityStatusLabel(
  t: MarketingTranslate,
  value: string,
): string {
  if (isOneOf(value, MARKETING_ACTIVITY_STATUS_VALUES)) {
    return marketingMessage(t, `activityStatus.${value}`);
  }
  return value;
}

export function translateMarketingActivityTypeLabel(t: MarketingTranslate, value: string): string {
  if (isOneOf(value, MARKETING_ACTIVITY_TYPE_VALUES)) {
    return marketingMessage(t, `activityType.${value}`);
  }
  return value;
}

export function translateMarketingDashboardPeriodLabel(
  t: MarketingTranslate,
  preset: MarketingDashboardPeriodPreset,
): string {
  return marketingMessage(t, `dashboard.period.${preset}`);
}

export function getMarketingLabel(
  catalog: MarketingLabelCatalog,
  value: string,
  t: MarketingTranslate,
): string {
  switch (catalog) {
    case 'channels':
      return translateMarketingChannelLabel(t, value);
    case 'accountStatus':
      return translateMarketingAccountStatusLabel(t, value);
    case 'activityStatus':
      return translateMarketingActivityStatusLabel(t, value);
    case 'activityType':
      return translateMarketingActivityTypeLabel(t, value);
    default:
      return value;
  }
}

export function resolveAttributionStatusLabel(tCrm: CrmTranslate, status: string): string {
  if (isOneOf(status, LEAD_ATTRIBUTION_STATUS_VALUES)) {
    return translateLeadStageLabel(tCrm, status);
  }
  if (isOneOf(status, DEAL_ATTRIBUTION_STATUS_VALUES)) {
    return translateDealStageLabel(tCrm, status);
  }
  return status.replace(/_/g, ' ');
}
