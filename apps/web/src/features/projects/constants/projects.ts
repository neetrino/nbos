import type { StatusVariant } from '@/components/shared/StatusBadge';

export const PROJECT_HUB_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
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

export const EXTENSION_STATUSES = [
  { value: 'NEW', label: 'New', variant: 'blue' as StatusVariant, color: 'bg-blue-500' },
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
  { value: 'DONE', label: 'Done', variant: 'green' as StatusVariant, color: 'bg-green-500' },
  { value: 'LOST', label: 'Lost', variant: 'red' as StatusVariant, color: 'bg-red-500' },
] as const;

export const EXTENSION_SIZES = [
  { value: 'MICRO', label: 'Micro', variant: 'gray' as StatusVariant },
  { value: 'SMALL', label: 'Small', variant: 'blue' as StatusVariant },
  { value: 'MEDIUM', label: 'Medium', variant: 'purple' as StatusVariant },
  { value: 'LARGE', label: 'Large', variant: 'orange' as StatusVariant },
] as const;

export function getProductCategory(value: string) {
  return PRODUCT_CATEGORIES.find((c) => c.value === value);
}

export function getProductType(value: string) {
  return PRODUCT_TYPES.find((t) => t.value === value);
}

/**
 * Возвращает отфильтрованный список ProductType по категории.
 * OTHER всегда добавляется в конец.
 */
export function getProductTypesForCategory(category: string) {
  const allowed = PRODUCT_TYPES_BY_CATEGORY[category] ?? [];
  const filtered = PRODUCT_TYPES.filter((t) => allowed.includes(t.value) || t.value === 'OTHER');
  return filtered;
}

export function getProductStatus(value: string) {
  return PRODUCT_STATUSES.find((s) => s.value === value);
}

export function getExtensionStatus(value: string) {
  return EXTENSION_STATUSES.find((s) => s.value === value);
}

export function getExtensionSize(value: string) {
  return EXTENSION_SIZES.find((s) => s.value === value);
}
