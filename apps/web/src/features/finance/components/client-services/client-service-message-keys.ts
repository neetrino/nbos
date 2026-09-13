import { useTranslations } from 'next-intl';
import type {
  ClientServicePaymentStage,
  ClientServiceRegistryCheckOutcome,
} from '@/lib/api/client-services';

/** Parent registers the `clientServices` namespace after this slice. */
export function useClientServicesT() {
  return useTranslations('clientServices');
}

export type ClientServicesTranslate = ReturnType<typeof useClientServicesT>;

const TYPE_KEYS = {
  DOMAIN: 'type.DOMAIN',
  HOSTING: 'type.HOSTING',
  SERVICE: 'type.SERVICE',
  ACCOUNT: 'type.ACCOUNT',
  LICENSE: 'type.LICENSE',
} as const;

const STATUS_KEYS = {
  PENDING: 'status.PENDING',
  ACTIVE: 'status.ACTIVE',
  SUSPENDED: 'status.SUSPENDED',
  EXPIRING_SOON: 'status.EXPIRING_SOON',
  EXPIRED: 'status.EXPIRED',
  CANCELLED: 'status.CANCELLED',
} as const;

const STATUS_SHORT_KEYS = {
  PENDING: 'statusShort.PENDING',
  ACTIVE: 'statusShort.ACTIVE',
  SUSPENDED: 'statusShort.SUSPENDED',
  EXPIRING_SOON: 'statusShort.EXPIRING_SOON',
  EXPIRED: 'statusShort.EXPIRED',
  CANCELLED: 'statusShort.CANCELLED',
} as const;

const BILLING_KEYS = {
  WE_PAY: 'billing.WE_PAY',
  REMINDER_ONLY: 'billing.REMINDER_ONLY',
} as const;

const BILLING_SHORT_KEYS = {
  WE_PAY: 'billingShort.WE_PAY',
  REMINDER_ONLY: 'billingShort.REMINDER_ONLY',
} as const;

const PRICING_KEYS = {
  FIXED: 'pricing.FIXED',
  USAGE_BASED: 'pricing.USAGE_BASED',
} as const;

const PRICING_SHORT_KEYS = {
  FIXED: 'pricingShort.FIXED',
  USAGE_BASED: 'pricingShort.USAGE_BASED',
} as const;

const FREQUENCY_KEYS = {
  ONE_TIME: 'frequency.ONE_TIME',
  MONTHLY: 'frequency.MONTHLY',
  QUARTERLY: 'frequency.QUARTERLY',
  YEARLY: 'frequency.YEARLY',
  MULTI_YEAR: 'frequency.MULTI_YEAR',
} as const;

const FREQUENCY_SHORT_KEYS = {
  ONE_TIME: 'frequencyShort.ONE_TIME',
  MONTHLY: 'frequencyShort.MONTHLY',
  QUARTERLY: 'frequencyShort.QUARTERLY',
  YEARLY: 'frequencyShort.YEARLY',
  MULTI_YEAR: 'frequencyShort.MULTI_YEAR',
} as const;

const TAX_KEYS = {
  TAX: 'tax.TAX',
  TAX_FREE: 'tax.TAX_FREE',
} as const;

const STAGE_KEYS = {
  pay_now: 'stage.pay_now',
  invoice: 'stage.invoice',
  upcoming: 'stage.upcoming',
  active: 'stage.active',
} as const;

const REGISTRY_TOAST_KEYS = {
  updated: 'registry.toast.updated',
  unchanged: 'registry.toast.unchanged',
  not_found: 'registry.toast.not_found',
  no_expiry: 'registry.toast.no_expiry',
  failed: 'registry.toast.failed',
} as const;

function lookupKey(map: Record<string, string>, value: string | null | undefined): string | null {
  if (!value) return null;
  return map[value] ?? null;
}

export function translateMappedLabel(
  t: ClientServicesTranslate,
  map: Record<string, string>,
  value: string | null | undefined,
  fallback: string,
): string {
  const key = lookupKey(map, value);
  return key ? t(key as never) : fallback;
}

export function translateClientServiceType(
  t: ClientServicesTranslate,
  value: string | null | undefined,
  fallback: string,
): string {
  return translateMappedLabel(t, TYPE_KEYS, value, fallback);
}

export function translateClientServiceStatus(
  t: ClientServicesTranslate,
  value: string | null | undefined,
  fallback: string,
): string {
  return translateMappedLabel(t, STATUS_KEYS, value, fallback);
}

export function translateClientServiceBilling(
  t: ClientServicesTranslate,
  value: string | null | undefined,
  fallback: string,
): string {
  return translateMappedLabel(t, BILLING_KEYS, value, fallback);
}

export function translateClientServiceFrequency(
  t: ClientServicesTranslate,
  value: string | null | undefined,
  fallback: string,
): string {
  return translateMappedLabel(t, FREQUENCY_KEYS, value, fallback);
}

export function translateClientServiceStage(
  t: ClientServicesTranslate,
  stage: ClientServicePaymentStage,
): string {
  return t(STAGE_KEYS[stage] as never);
}

export function translateClientServiceRegistryToast(
  t: ClientServicesTranslate,
  outcome: ClientServiceRegistryCheckOutcome,
): string {
  return t(REGISTRY_TOAST_KEYS[outcome] as never);
}

export function localizeOptionLabels<T extends { value: string; label: string }>(
  options: ReadonlyArray<T>,
  t: ClientServicesTranslate,
  map: Record<string, string>,
): Array<{ value: string; label: string }> {
  return options.map((option) => ({
    value: option.value,
    label: translateMappedLabel(t, map, option.value, option.label),
  }));
}

export const CLIENT_SERVICE_TYPE_MESSAGE_KEYS = TYPE_KEYS;
export const CLIENT_SERVICE_STATUS_MESSAGE_KEYS = STATUS_KEYS;
export const CLIENT_SERVICE_STATUS_SHORT_MESSAGE_KEYS = STATUS_SHORT_KEYS;
export const CLIENT_SERVICE_BILLING_MESSAGE_KEYS = BILLING_KEYS;
export const CLIENT_SERVICE_BILLING_SHORT_MESSAGE_KEYS = BILLING_SHORT_KEYS;
export const CLIENT_SERVICE_PRICING_MESSAGE_KEYS = PRICING_KEYS;
export const CLIENT_SERVICE_PRICING_SHORT_MESSAGE_KEYS = PRICING_SHORT_KEYS;
export const CLIENT_SERVICE_FREQUENCY_MESSAGE_KEYS = FREQUENCY_KEYS;
export const CLIENT_SERVICE_FREQUENCY_SHORT_MESSAGE_KEYS = FREQUENCY_SHORT_KEYS;
export const CLIENT_SERVICE_TAX_MESSAGE_KEYS = TAX_KEYS;
export const CLIENT_SERVICE_STAGE_MESSAGE_KEYS = STAGE_KEYS;
export const CLIENT_SERVICE_REGISTRY_TOAST_MESSAGE_KEYS = REGISTRY_TOAST_KEYS;
