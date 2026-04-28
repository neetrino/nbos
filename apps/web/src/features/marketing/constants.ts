export const MARKETING_CHANNELS = [
  { value: 'SMM', label: 'SMM' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'LIST_AM', label: 'List.am' },
  { value: 'GOOGLE_ADS', label: 'Google Ads' },
  { value: 'META_ADS', label: 'Meta Ads' },
  { value: 'CONTENT', label: 'Content Marketing' },
  { value: 'SEO', label: 'SEO' },
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const MARKETING_ACCOUNT_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'ARCHIVED', label: 'Archived' },
] as const;

export const MARKETING_ACTIVITY_STATUSES = [
  { value: 'IDEA', label: 'Idea' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'READY', label: 'Ready' },
  { value: 'LAUNCHED', label: 'Launched' },
  { value: 'FINISHED', label: 'Finished' },
  { value: 'ARCHIVED', label: 'Archived' },
] as const;

export const MARKETING_ACTIVITY_TYPES = [
  { value: 'AD_CAMPAIGN', label: 'Ad campaign' },
  { value: 'SMM_POST', label: 'SMM post' },
  { value: 'STORY_REEL', label: 'Story / Reel' },
  { value: 'LIST_AM_PROMOTION', label: 'List.am promotion' },
  { value: 'WEBSITE_LANDING', label: 'Website landing' },
  { value: 'SEO_WORK', label: 'SEO work' },
  { value: 'OFFLINE_ACTIVITY', label: 'Offline activity' },
  { value: 'OTHER', label: 'Other' },
] as const;

export function getMarketingLabel(
  options: readonly { value: string; label: string }[],
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}
