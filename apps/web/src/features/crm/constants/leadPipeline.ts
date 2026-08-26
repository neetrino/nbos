import type { StatusVariant } from '@/components/shared/StatusBadge';

export interface LeadStage {
  key: string;
  label: string;
  shortLabel: string;
  variant: StatusVariant;
  color: string;
  hexColor: string;
  terminal?: true;
}

export const LEAD_STAGES: LeadStage[] = [
  {
    key: 'NEW',
    label: 'New',
    shortLabel: 'New',
    variant: 'blue',
    color: 'bg-blue-500',
    hexColor: '#3B82F6',
  },
  {
    key: 'DIDNT_GET_THROUGH',
    label: "Didn't Get Through",
    shortLabel: "Didn't…",
    variant: 'gray',
    color: 'bg-gray-400',
    hexColor: '#9CA3AF',
  },
  {
    key: 'CONTACT_ESTABLISHED',
    label: 'Contact Established',
    shortLabel: 'Contact',
    variant: 'indigo',
    color: 'bg-indigo-500',
    hexColor: '#6366F1',
  },
  {
    key: 'MQL',
    label: 'Qualification (MQL)',
    shortLabel: 'MQL',
    variant: 'purple',
    color: 'bg-purple-500',
    hexColor: '#A855F7',
  },
  {
    key: 'ON_HOLD',
    label: 'On Hold',
    shortLabel: 'On Hold',
    variant: 'gray',
    color: 'bg-stone-900',
    hexColor: '#171717',
  },
  {
    key: 'SPAM',
    label: 'Spam',
    shortLabel: 'Spam',
    variant: 'red',
    color: 'bg-red-400',
    hexColor: '#F87171',
    terminal: true,
  },
  {
    key: 'SQL',
    label: 'Lead Won',
    shortLabel: 'Lead Won',
    variant: 'emerald',
    color: 'bg-emerald-500',
    hexColor: '#10B981',
    terminal: true,
  },
];

export const LEAD_NEW_STAGE_KEY = 'NEW';

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

export { MARKETING_CHANNELS } from '@/features/marketing/constants';

export const INTEREST_TYPES = [
  { value: 'BUSINESS_CARD_WEBSITE', label: 'Business Card Website' },
  { value: 'COMPANY_WEBSITE', label: 'Company Website' },
  { value: 'MOBILE_APP', label: 'Mobile App' },
  { value: 'WEB_APP', label: 'Web Application' },
  { value: 'CRM', label: 'CRM System' },
  { value: 'ECOMMERCE', label: 'E-Commerce' },
  { value: 'SAAS', label: 'SaaS Platform' },
  { value: 'LANDING', label: 'Landing Page' },
  { value: 'ERP', label: 'ERP System' },
  { value: 'LOGO', label: 'Logo' },
  { value: 'BRANDING', label: 'Branding' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'SEO', label: 'SEO' },
  { value: 'PPC', label: 'PPC' },
  { value: 'SMM', label: 'SMM' },
  { value: 'MAINTENANCE', label: 'Maintenance & Support' },
  { value: 'EXTENSION', label: 'Extension / Enhancement' },
  { value: 'OTHER', label: 'Other' },
] as const;

export function getLeadStage(key: string) {
  return LEAD_STAGES.find((s) => s.key === key);
}

export function getLeadSource(value: string | null | undefined) {
  return LEAD_SOURCES.find((s) => s.value === value);
}
