import type { StatusVariant } from '@/components/shared/StatusBadge';

export interface DealStage {
  key: string;
  label: string;
  shortLabel: string;
  variant: StatusVariant;
  color: string;
  terminal?: boolean;
}

export const DEAL_STAGES: DealStage[] = [
  {
    key: 'START_CONVERSATION',
    label: 'Start a Conversation',
    shortLabel: 'Start',
    variant: 'blue',
    color: 'bg-blue-400',
  },
  {
    key: 'DISCUSS_NEEDS',
    label: 'Discuss What Is Needed',
    shortLabel: 'Discuss',
    variant: 'blue',
    color: 'bg-blue-500',
  },
  {
    key: 'MEETING',
    label: 'Meeting',
    shortLabel: 'Meeting',
    variant: 'indigo',
    color: 'bg-indigo-500',
  },
  {
    key: 'CAN_WE_DO_IT',
    label: 'Can We Do It?',
    shortLabel: 'Can We?',
    variant: 'purple',
    color: 'bg-purple-500',
  },
  {
    key: 'SEND_OFFER',
    label: 'Send Offer',
    shortLabel: 'Offer',
    variant: 'violet',
    color: 'bg-violet-500',
  },
  {
    key: 'GET_ANSWER',
    label: 'Get Answer',
    shortLabel: 'Answer',
    variant: 'fuchsia',
    color: 'bg-fuchsia-500',
  },
  {
    key: 'DEPOSIT_AND_CONTRACT',
    label: 'Deposit & Contract',
    shortLabel: 'Deposit',
    variant: 'amber',
    color: 'bg-amber-500',
  },
  {
    key: 'FAILED',
    label: 'Failed',
    shortLabel: 'Failed',
    variant: 'red',
    color: 'bg-red-500',
    terminal: true,
  },
  {
    key: 'WON',
    label: 'Deal Won',
    shortLabel: 'Won',
    variant: 'green',
    color: 'bg-green-600',
    terminal: true,
  },
];

export const ACTIVE_DEAL_STAGES = DEAL_STAGES.filter((s) => !s.terminal);
export const TERMINAL_DEAL_STAGES = DEAL_STAGES.filter((s) => s.terminal);

export const DEAL_TYPES = [
  { value: 'PRODUCT', label: 'Product', description: 'New IT product development' },
  { value: 'EXTENSION', label: 'Extension', description: 'Enhancement to an existing product' },
  { value: 'MAINTENANCE', label: 'Maintenance', description: 'Technical support and maintenance' },
  { value: 'OUTSOURCE', label: 'Outsource', description: 'Outsourced to a partner' },
] as const;

export const PRODUCT_CATEGORIES = [
  { value: 'CODE', label: 'Code' },
  { value: 'WORDPRESS', label: 'WordPress' },
  { value: 'SHOPIFY', label: 'Shopify' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const PRODUCT_TYPES = [
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
  { value: 'OTHER', label: 'Other' },
] as const;

export const PRODUCT_TYPES_BY_CATEGORY: Record<string, readonly string[]> = {
  CODE: [
    'BUSINESS_CARD_WEBSITE',
    'COMPANY_WEBSITE',
    'MOBILE_APP',
    'WEB_APP',
    'CRM',
    'ECOMMERCE',
    'SAAS',
    'LANDING',
    'ERP',
  ],
  WORDPRESS: ['BUSINESS_CARD_WEBSITE', 'COMPANY_WEBSITE', 'ECOMMERCE', 'LANDING'],
  SHOPIFY: ['ECOMMERCE'],
  MARKETING: ['LOGO', 'BRANDING', 'DESIGN', 'SEO', 'PPC', 'SMM'],
  OTHER: [],
};

export const PAYMENT_TYPES = [
  { value: 'CLASSIC', label: 'Classic' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
] as const;

export function getDealStage(key: string): DealStage | undefined {
  return DEAL_STAGES.find((s) => s.key === key);
}

export function formatAmount(amount: number | null): string {
  if (!amount) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'AMD',
    maximumFractionDigits: 0,
  }).format(amount);
}
