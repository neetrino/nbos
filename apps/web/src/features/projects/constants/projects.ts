import type { StatusVariant } from '@/components/shared/StatusBadge';
import { listedProductTypesForPicker, PRODUCT_TYPES as PRODUCT_TYPE_VALUES } from '@nbos/shared';

export const PROJECT_HUB_TABS = [
  { value: 'all', label: 'All' },
  { value: 'incoming', label: 'Incoming' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'trash', label: 'Trash' },
] as const;

export const PRODUCT_HUB_TABS = [
  { value: 'all', label: 'All' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'closed', label: 'Closed' },
] as const;

export const PRODUCT_CATEGORIES = [
  { value: 'CODE', label: 'Code' },
  { value: 'WORDPRESS', label: 'WordPress' },
  { value: 'SHOPIFY', label: 'Shopify' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const PRODUCT_TYPES = PRODUCT_TYPE_VALUES.map((value) => ({ value, label: value }));

export function getProductTypesForCategory(
  category: string,
  currentType?: string,
  productPlatform?: string | null,
) {
  const listed = listedProductTypesForPicker(category, currentType, productPlatform);
  return PRODUCT_TYPES.filter((t) => listed.includes(t.value));
}

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
  { value: 'SMALL', label: 'Small', variant: 'blue' as StatusVariant },
  { value: 'STANDARD', label: 'Standard', variant: 'purple' as StatusVariant },
  { value: 'LARGE', label: 'Large', variant: 'orange' as StatusVariant },
] as const;

export function getProductCategory(value: string) {
  return PRODUCT_CATEGORIES.find((c) => c.value === value);
}

export function getProductType(value: string) {
  return PRODUCT_TYPES.find((t) => t.value === value);
}

/** i18n key under the `forms` namespace. */
export function formsProductTypeKey(value: string) {
  return `product.types.${value}` as const;
}

export function getProductStatus(value: string) {
  return PRODUCT_STATUSES.find((s) => s.value === value);
}

export function formatDeliveryLifecycleLabel(lifecycle: {
  stage: string | null;
  workStatus: string;
  resolution: string | null;
  onHoldUntil?: string | null;
}) {
  if (lifecycle.resolution === 'DONE') return 'Done';
  if (lifecycle.resolution === 'CANCELLED') return 'Cancelled';
  const stageLabel = lifecycle.stage === 'STARTING' ? 'Starting' : lifecycle.stage;
  if (isDeliveryHoldExpired(lifecycle)) {
    return stageLabel ? `${stageLabel} · Hold expired` : 'Hold expired';
  }
  if (lifecycle.workStatus === 'ON_HOLD') return stageLabel ? `${stageLabel} · On Hold` : 'On Hold';
  return stageLabel ? toTitleCase(stageLabel) : 'Not staged';
}

export function getDeliveryLifecycleVariant(lifecycle: {
  workStatus: string;
  resolution: string | null;
  onHoldUntil?: string | null;
}): StatusVariant {
  if (lifecycle.resolution === 'DONE') return 'green';
  if (lifecycle.resolution === 'CANCELLED') return 'red';
  if (isDeliveryHoldExpired(lifecycle)) return 'amber';
  if (lifecycle.workStatus === 'ON_HOLD') return 'gray';
  return 'purple';
}

export function isDeliveryHoldExpired(lifecycle: {
  workStatus: string;
  resolution: string | null;
  onHoldUntil?: string | null;
}) {
  if (lifecycle.resolution || lifecycle.workStatus !== 'ON_HOLD' || !lifecycle.onHoldUntil) {
    return false;
  }
  return new Date(lifecycle.onHoldUntil).getTime() < Date.now();
}

export function formatDeliveryHoldUntil(onHoldUntil: string | null) {
  if (!onHoldUntil) return null;
  return new Date(onHoldUntil).toLocaleDateString();
}

export function getExtensionStatus(value: string) {
  return EXTENSION_STATUSES.find((s) => s.value === value);
}

export function getExtensionSize(value: string) {
  return EXTENSION_SIZES.find((s) => s.value === value);
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
