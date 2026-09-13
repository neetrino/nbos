export const MARKETING_CHANNEL_VALUES = [
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

export const MARKETING_ACCOUNT_STATUS_VALUES = ['ACTIVE', 'PAUSED', 'ARCHIVED'] as const;

export const MARKETING_ACTIVITY_STATUS_VALUES = [
  'IDEA',
  'PREPARING',
  'READY',
  'LAUNCHED',
  'FINISHED',
  'ARCHIVED',
] as const;

export const MARKETING_ACTIVITY_TYPE_VALUES = [
  'AD_CAMPAIGN',
  'SMM_POST',
  'STORY_REEL',
  'LIST_AM_PROMOTION',
  'WEBSITE_LANDING',
  'SEO_WORK',
  'OFFLINE_ACTIVITY',
  'OTHER',
] as const;

export const MARKETING_CHANNELS = MARKETING_CHANNEL_VALUES.map((value) => ({ value }));

export const MARKETING_ACCOUNT_STATUSES = MARKETING_ACCOUNT_STATUS_VALUES.map((value) => ({
  value,
}));

export const MARKETING_ACTIVITY_STATUSES = MARKETING_ACTIVITY_STATUS_VALUES.map((value) => ({
  value,
}));

export const MARKETING_ACTIVITY_TYPES = MARKETING_ACTIVITY_TYPE_VALUES.map((value) => ({
  value,
}));

export type { MarketingLabelCatalog } from './i18n/marketing-copy';
export { getMarketingLabel } from './i18n/marketing-copy';
