import type { StatusVariant } from '@/components/shared/StatusBadge';

export const PROJECT_TYPES = [
  { value: 'WHITE_LABEL', label: 'White Label', variant: 'blue' as StatusVariant },
  { value: 'MIX', label: 'Mix', variant: 'purple' as StatusVariant },
  { value: 'CUSTOM_CODE', label: 'Custom Code', variant: 'orange' as StatusVariant },
] as const;

export const PROJECT_TABS = [
  { value: 'all', label: 'All Projects' },
  { value: 'development', label: 'Development' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'closed', label: 'Closed / Archived' },
] as const;

export const PRODUCT_TYPES = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'MOBILE_APP', label: 'Mobile App' },
  { value: 'WEB_APP', label: 'Web Application' },
  { value: 'CRM', label: 'CRM System' },
  { value: 'ECOMMERCE', label: 'E-Commerce' },
  { value: 'SAAS', label: 'SaaS Platform' },
  { value: 'LANDING', label: 'Landing Page' },
  { value: 'ERP', label: 'ERP System' },
  { value: 'LOGO', label: 'Logo / Branding' },
  { value: 'SMM', label: 'SMM' },
  { value: 'SEO', label: 'SEO' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const PRODUCT_STATUSES = [
  { value: 'NEW', label: 'New', variant: 'blue' as StatusVariant, color: 'bg-blue-500' },
  {
    value: 'CREATING',
    label: 'Creating',
    variant: 'indigo' as StatusVariant,
    color: 'bg-indigo-500',
  },
  {
    value: 'DEVELOPMENT',
    label: 'Development',
    variant: 'purple' as StatusVariant,
    color: 'bg-purple-500',
  },
  { value: 'QA', label: 'QA', variant: 'amber' as StatusVariant, color: 'bg-amber-500' },
  {
    value: 'TRANSFER',
    label: 'Transfer',
    variant: 'orange' as StatusVariant,
    color: 'bg-orange-500',
  },
  { value: 'ON_HOLD', label: 'On Hold', variant: 'gray' as StatusVariant, color: 'bg-gray-400' },
  { value: 'DONE', label: 'Done', variant: 'green' as StatusVariant, color: 'bg-green-500' },
  { value: 'LOST', label: 'Lost', variant: 'red' as StatusVariant, color: 'bg-red-500' },
] as const;

export function getProjectType(value: string) {
  return PROJECT_TYPES.find((t) => t.value === value);
}

export function getProductStatus(value: string) {
  return PRODUCT_STATUSES.find((s) => s.value === value);
}
