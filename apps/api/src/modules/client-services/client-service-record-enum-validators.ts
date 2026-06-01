import { BadRequestException } from '@nestjs/common';
import type {
  ClientServiceBillingModel,
  ClientServicePricingModel,
  ClientServiceStatus,
  ClientServiceType,
  ExpenseFrequency,
  TaxStatus,
} from '@nbos/database';

const CLIENT_SERVICE_TYPES = new Set(['DOMAIN', 'HOSTING', 'SERVICE', 'ACCOUNT', 'LICENSE']);
const CLIENT_SERVICE_STATUSES = new Set([
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'EXPIRING_SOON',
  'EXPIRED',
  'CANCELLED',
]);
const CLIENT_SERVICE_BILLING_MODELS = new Set(['WE_PAY', 'REMINDER_ONLY']);
const CLIENT_SERVICE_PRICING_MODELS = new Set(['FIXED', 'USAGE_BASED']);
const CLIENT_SERVICE_FREQUENCIES = new Set([
  'ONE_TIME',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'MULTI_YEAR',
]);
const TAX_STATUSES = new Set(['TAX', 'TAX_FREE']);

function requireEnumValue<T extends string>(
  value: string | undefined,
  allowed: ReadonlySet<string>,
  field: string,
): T {
  const normalized = value?.trim();
  if (!normalized || !allowed.has(normalized)) {
    throw new BadRequestException(`${field} is invalid`);
  }
  return normalized as T;
}

export function requireClientServiceType(value: string | undefined): ClientServiceType {
  return requireEnumValue<ClientServiceType>(value, CLIENT_SERVICE_TYPES, 'type');
}

export function resolveClientServiceStatus(value: string | undefined): ClientServiceStatus {
  if (!value?.trim()) return 'PENDING';
  return requireEnumValue<ClientServiceStatus>(value, CLIENT_SERVICE_STATUSES, 'status');
}

export function resolveClientServiceBillingModel(
  value: string | undefined,
): ClientServiceBillingModel {
  if (!value?.trim()) return 'WE_PAY';
  return requireEnumValue<ClientServiceBillingModel>(
    value,
    CLIENT_SERVICE_BILLING_MODELS,
    'billingModel',
  );
}

export function resolveClientServicePricingModel(
  value: string | undefined,
): ClientServicePricingModel {
  if (!value?.trim()) return 'FIXED';
  return requireEnumValue<ClientServicePricingModel>(
    value,
    CLIENT_SERVICE_PRICING_MODELS,
    'pricingModel',
  );
}

export function resolveClientServiceFrequency(value: string | undefined): ExpenseFrequency {
  if (!value?.trim()) return 'YEARLY';
  return requireEnumValue<ExpenseFrequency>(value, CLIENT_SERVICE_FREQUENCIES, 'frequency');
}

export function resolveClientServiceTaxStatus(value: string | undefined): TaxStatus {
  if (!value?.trim()) return 'TAX';
  return requireEnumValue<TaxStatus>(value, TAX_STATUSES, 'taxStatus');
}
