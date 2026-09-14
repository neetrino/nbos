import type { StatusVariant } from '@/components/shared/StatusBadge';

/** Scan card surface — matches Marketing Attribution review cards. */
export const MARKETING_SETTINGS_CARD_SURFACE_CLASS =
  'border-border/70 bg-card hover:border-primary/30 focus-visible:ring-ring rounded-2xl border p-5 text-left shadow-sm transition-[border-color,box-shadow,background-color] hover:shadow-md focus-visible:ring-2 focus-visible:outline-none';

export const MARKETING_ACCOUNT_CARD_GRID_CLASS = 'grid gap-3 md:grid-cols-2';

export const MARKETING_CRM_WHERE_LIST_CLASS = 'grid gap-2';

export const MARKETING_SETTINGS_MAP_STACK_CLASS = 'space-y-2';

export const MARKETING_CHANNEL_ACCENT_FALLBACK_CLASS = 'bg-amber-500';

/** Catalog map row (CRM Where) — not a single channel. */
export const MARKETING_SETTINGS_MAP_CATALOG_ACCENT_CLASS = 'bg-violet-500';

const MARKETING_CHANNEL_ACCENT_CLASS: Record<string, string> = {
  LIST_AM: 'bg-amber-500',
  META_ADS: 'bg-sky-500',
  SMM: 'bg-sky-500',
  GOOGLE_ADS: 'bg-emerald-500',
  WEBSITE: 'bg-violet-500',
  SEO: 'bg-teal-500',
  CONTENT: 'bg-teal-500',
  OFFLINE: 'bg-slate-400',
  OTHER: 'bg-slate-400',
};

/** List.am accounts identify the source by phone number. */
export const MARKETING_ACCOUNT_PHONE_CHANNEL = 'LIST_AM';

export function getMarketingChannelAccentClass(channel: string): string {
  return MARKETING_CHANNEL_ACCENT_CLASS[channel] ?? MARKETING_CHANNEL_ACCENT_FALLBACK_CLASS;
}

export function marketingAccountUsesPhone(channel: string): boolean {
  return channel === MARKETING_ACCOUNT_PHONE_CHANNEL;
}

export function getMarketingAccountStatusVariant(status: string): StatusVariant {
  if (status === 'ACTIVE') return 'green';
  if (status === 'PAUSED') return 'amber';
  return 'gray';
}
