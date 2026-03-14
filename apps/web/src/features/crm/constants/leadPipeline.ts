import type { StatusVariant } from '@/components/shared/StatusBadge';

export const LEAD_STAGES = [
  { key: 'NEW', label: 'New', variant: 'blue' as StatusVariant, color: 'bg-blue-500' },
  {
    key: 'DIDNT_GET_THROUGH',
    label: "Didn't Get Through",
    variant: 'gray' as StatusVariant,
    color: 'bg-gray-400',
  },
  {
    key: 'CONTACT_ESTABLISHED',
    label: 'Contact Established',
    variant: 'indigo' as StatusVariant,
    color: 'bg-indigo-500',
  },
  {
    key: 'MQL',
    label: 'Qualification (MQL)',
    variant: 'purple' as StatusVariant,
    color: 'bg-purple-500',
  },
  {
    key: 'SPAM',
    label: 'Spam',
    variant: 'red' as StatusVariant,
    color: 'bg-red-400',
    terminal: true,
  },
  {
    key: 'SQL',
    label: 'Lead Won',
    variant: 'emerald' as StatusVariant,
    color: 'bg-emerald-500',
    terminal: true,
  },
] as const;

export const ACTIVE_LEAD_STAGES = LEAD_STAGES.filter((s) => !('terminal' in s));
export const TERMINAL_LEAD_STAGES = LEAD_STAGES.filter((s) => 'terminal' in s);

export const LEAD_SOURCES = [
  { value: 'MARKETING', label: 'Marketing', icon: '📣' },
  { value: 'SALES', label: 'Sales', icon: '📞' },
  { value: 'PARTNER', label: 'Partner', icon: '🏢' },
  { value: 'CLIENT', label: 'Client', icon: '🤝' },
] as const;

export const SALES_CHANNELS = [
  { value: 'COLD_CALL', label: 'Cold Call' },
  { value: 'COLD_DM_IG', label: 'Cold DM (Instagram)' },
  { value: 'COLD_DM_FB', label: 'Cold DM (Facebook)' },
  { value: 'COLD_DM_LINKEDIN', label: 'Cold DM (LinkedIn)' },
  { value: 'COLD_EMAIL', label: 'Cold Email' },
  { value: 'NETWORKING', label: 'Networking' },
] as const;

export const MARKETING_CHANNELS = [
  { value: 'SMM', label: 'SMM' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'LIST_AM', label: 'List.am' },
  { value: 'GOOGLE_ADS', label: 'Google Ads' },
  { value: 'META_ADS', label: 'Meta Ads' },
  { value: 'CONTENT', label: 'Content Marketing' },
] as const;

export const INTEREST_TYPES = [
  { value: 'WEBSITE', label: 'Website Development' },
  { value: 'MOBILE_APP', label: 'Mobile Application' },
  { value: 'CRM_SYSTEM', label: 'CRM System' },
  { value: 'BRANDING', label: 'Branding & Logo' },
  { value: 'SMM', label: 'SMM & Marketing' },
  { value: 'SEO', label: 'SEO' },
  { value: 'MAINTENANCE', label: 'Maintenance & Support' },
  { value: 'EXTENSION', label: 'Extension / Enhancement' },
  { value: 'OTHER', label: 'Other' },
] as const;

export function getLeadStage(key: string) {
  return LEAD_STAGES.find((s) => s.key === key);
}

export function getLeadSource(value: string) {
  return LEAD_SOURCES.find((s) => s.value === value);
}
