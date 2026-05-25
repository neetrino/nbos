import type { LucideIcon } from 'lucide-react';
import { Code2, Handshake, Layers, Wrench } from 'lucide-react';
import type { StatusVariant } from '@/components/shared/StatusBadge';

export type SubscriptionTypeKey =
  | 'MAINTENANCE_ONLY'
  | 'DEV_AND_MAINTENANCE'
  | 'DEV_ONLY'
  | 'PARTNER_SERVICE';

const SUBSCRIPTION_TYPE_KEYS: readonly SubscriptionTypeKey[] = [
  'MAINTENANCE_ONLY',
  'DEV_AND_MAINTENANCE',
  'DEV_ONLY',
  'PARTNER_SERVICE',
];

export interface SubscriptionTypePresentation {
  key: SubscriptionTypeKey;
  label: string;
  Icon: LucideIcon;
  badgeVariant: StatusVariant;
  iconWrapClassName: string;
  rowAccentClassName: string;
}

const PRESENTATION: Record<SubscriptionTypeKey, SubscriptionTypePresentation> = {
  MAINTENANCE_ONLY: {
    key: 'MAINTENANCE_ONLY',
    label: 'Maintenance',
    Icon: Wrench,
    badgeVariant: 'green',
    iconWrapClassName: 'bg-green-500/10 text-green-600 dark:text-green-400',
    rowAccentClassName: 'border-l-green-500/70',
  },
  DEV_AND_MAINTENANCE: {
    key: 'DEV_AND_MAINTENANCE',
    label: 'Dev + Maintenance',
    Icon: Layers,
    badgeVariant: 'blue',
    iconWrapClassName: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    rowAccentClassName: 'border-l-blue-500/70',
  },
  DEV_ONLY: {
    key: 'DEV_ONLY',
    label: 'Development',
    Icon: Code2,
    badgeVariant: 'purple',
    iconWrapClassName: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    rowAccentClassName: 'border-l-purple-500/70',
  },
  PARTNER_SERVICE: {
    key: 'PARTNER_SERVICE',
    label: 'Partner Service',
    Icon: Handshake,
    badgeVariant: 'orange',
    iconWrapClassName: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    rowAccentClassName: 'border-l-orange-500/70',
  },
};

export function normalizeSubscriptionType(value: string): SubscriptionTypeKey {
  const upper = value.trim().toUpperCase();
  return (SUBSCRIPTION_TYPE_KEYS as readonly string[]).includes(upper)
    ? (upper as SubscriptionTypeKey)
    : 'MAINTENANCE_ONLY';
}

export function getSubscriptionTypePresentation(value: string): SubscriptionTypePresentation {
  return PRESENTATION[normalizeSubscriptionType(value)];
}
