import { BadRequestException } from '@nestjs/common';

/** Separator between partner service type and product name in Route D titles. */
export const PARTNER_SERVICE_SUBSCRIPTION_NAME_SEPARATOR = ' — ';

/**
 * Commercial subscription name from a won deal (Routes A/B).
 * Prefers trimmed deal.name; falls back to deal.code.
 */
export function resolveDealSubscriptionName(deal: {
  name: string | null | undefined;
  code: string;
}): string {
  const trimmed = deal.name?.trim();
  return trimmed || deal.code;
}

/**
 * Commercial subscription name for Partner Service Route D (no deal).
 */
export function resolvePartnerServiceSubscriptionName(
  serviceType: string,
  productName: string,
): string {
  return `${serviceType}${PARTNER_SERVICE_SUBSCRIPTION_NAME_SEPARATOR}${productName}`;
}

/**
 * Validates a required commercial name from finance create DTO.
 * @throws BadRequestException when missing or blank after trim
 */
export function parseRequiredSubscriptionName(value: unknown): string {
  if (typeof value !== 'string') {
    throw new BadRequestException('name is required and must be a non-empty string');
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new BadRequestException('name is required and must be a non-empty string');
  }
  return trimmed;
}

/**
 * Validates an optional commercial name on update; when provided must be non-empty after trim.
 * @returns trimmed name, or undefined when the field was omitted
 */
export function parseOptionalSubscriptionName(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return parseRequiredSubscriptionName(value);
}
