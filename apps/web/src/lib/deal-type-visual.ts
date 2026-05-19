import type { LucideIcon } from 'lucide-react';
import { Handshake, Package, Puzzle, Wrench } from 'lucide-react';
import type { StatusVariant } from '@/components/shared/StatusBadge';

export type DealTypeKey = 'PRODUCT' | 'EXTENSION' | 'MAINTENANCE' | 'OUTSOURCE';

const DEAL_TYPE_KEYS: readonly DealTypeKey[] = ['PRODUCT', 'EXTENSION', 'MAINTENANCE', 'OUTSOURCE'];

export interface DealTypePresentation {
  key: DealTypeKey;
  label: string;
  Icon: LucideIcon;
  badgeVariant: StatusVariant;
  cardShellClassName: string;
  iconWrapClassName: string;
  amountIconClassName: string;
  headerIconClassName: string;
  headerBadgeClassName: string;
}

/** Product = green, Extension = orange, Maintenance = purple, Outsource = blue (CRM + delivery). */
const PRESENTATION: Record<DealTypeKey, DealTypePresentation> = {
  PRODUCT: {
    key: 'PRODUCT',
    label: 'Product',
    Icon: Package,
    badgeVariant: 'green',
    cardShellClassName:
      'border-green-200/90 bg-green-50/50 dark:border-green-900/55 dark:bg-green-950/30',
    iconWrapClassName: 'bg-green-500/10 text-green-600 dark:text-green-400',
    amountIconClassName: 'text-green-600 dark:text-green-400',
    headerIconClassName: 'text-green-600 dark:text-green-400',
    headerBadgeClassName:
      'border-green-200 bg-green-50 text-green-700 dark:border-green-900/70 dark:bg-green-950/30 dark:text-green-300',
  },
  EXTENSION: {
    key: 'EXTENSION',
    label: 'Extension',
    Icon: Puzzle,
    badgeVariant: 'orange',
    cardShellClassName:
      'border-orange-200/90 bg-orange-50/50 dark:border-orange-900/55 dark:bg-orange-950/30',
    iconWrapClassName: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    amountIconClassName: 'text-orange-600 dark:text-orange-400',
    headerIconClassName: 'text-orange-600 dark:text-orange-400',
    headerBadgeClassName:
      'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/70 dark:bg-orange-950/30 dark:text-orange-300',
  },
  MAINTENANCE: {
    key: 'MAINTENANCE',
    label: 'Maintenance',
    Icon: Wrench,
    badgeVariant: 'purple',
    cardShellClassName:
      'border-purple-200/90 bg-purple-50/50 dark:border-purple-900/55 dark:bg-purple-950/30',
    iconWrapClassName: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    amountIconClassName: 'text-purple-600 dark:text-purple-400',
    headerIconClassName: 'text-purple-600 dark:text-purple-400',
    headerBadgeClassName:
      'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/70 dark:bg-purple-950/30 dark:text-purple-300',
  },
  OUTSOURCE: {
    key: 'OUTSOURCE',
    label: 'Outsource',
    Icon: Handshake,
    badgeVariant: 'blue',
    cardShellClassName:
      'border-blue-200/90 bg-blue-50/50 dark:border-blue-900/55 dark:bg-blue-950/30',
    iconWrapClassName: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    amountIconClassName: 'text-blue-600 dark:text-blue-400',
    headerIconClassName: 'text-blue-600 dark:text-blue-400',
    headerBadgeClassName:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-300',
  },
};

export function normalizeDealType(value: string): DealTypeKey {
  const upper = value.trim().toUpperCase();
  return (DEAL_TYPE_KEYS as readonly string[]).includes(upper) ? (upper as DealTypeKey) : 'PRODUCT';
}

export function getDealTypePresentation(dealType: string): DealTypePresentation {
  return PRESENTATION[normalizeDealType(dealType)];
}
