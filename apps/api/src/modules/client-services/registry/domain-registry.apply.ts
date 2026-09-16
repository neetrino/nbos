import { isRegistryExpiryEarlier, isRegistryExpiryLater } from './expiry-parse';
import type {
  DomainRegistryApplyDecision,
  DomainRegistryApplyInput,
  DomainRegistryCheckOutcome,
} from './domain-registry.types';

export function isRegistryRenewalWrite(outcome: DomainRegistryCheckOutcome): boolean {
  return outcome === 'updated' || outcome === 'corrected';
}

export function decideRegistryApply(input: DomainRegistryApplyInput): DomainRegistryApplyDecision {
  const { storedRenewalDate, lookup } = input;
  if (lookup.status === 'NOT_FOUND') {
    return buildDecision('not_found', lookup.status, storedRenewalDate, null, lookup.source);
  }
  if (lookup.status === 'FAILED') {
    return buildDecision('failed', lookup.status, storedRenewalDate, null, lookup.source);
  }
  if (lookup.status === 'NO_EXPIRY' || !lookup.expiryDate) {
    return buildDecision('no_expiry', 'NO_EXPIRY', storedRenewalDate, null, lookup.source);
  }
  if (!storedRenewalDate || isRegistryExpiryLater(lookup.expiryDate, storedRenewalDate)) {
    return observedWrite('updated', lookup.expiryDate, lookup.source);
  }
  if (input.allowEarlier && isRegistryExpiryEarlier(lookup.expiryDate, storedRenewalDate)) {
    return observedWrite('corrected', lookup.expiryDate, lookup.source);
  }
  return buildDecision(
    'unchanged',
    'OBSERVED',
    storedRenewalDate,
    lookup.expiryDate,
    lookup.source,
  );
}

function observedWrite(
  outcome: 'updated' | 'corrected',
  expiryDate: Date,
  persistSource: DomainRegistryApplyDecision['persistSource'],
): DomainRegistryApplyDecision {
  return {
    outcome,
    nextRenewalDate: expiryDate,
    persistStatus: 'OBSERVED',
    persistExpiry: expiryDate,
    persistSource,
  };
}

function buildDecision(
  outcome: DomainRegistryApplyDecision['outcome'],
  persistStatus: DomainRegistryApplyDecision['persistStatus'],
  nextRenewalDate: Date | null,
  persistExpiry: Date | null,
  persistSource: DomainRegistryApplyDecision['persistSource'],
): DomainRegistryApplyDecision {
  return { outcome, nextRenewalDate, persistStatus, persistExpiry, persistSource };
}

export function shouldSkipRenewalInvoiceForRegistry(input: {
  type: string;
  outcome: DomainRegistryApplyDecision['outcome'] | null;
}): boolean {
  if (input.type !== 'DOMAIN') return false;
  return input.outcome === 'updated' || input.outcome === 'not_found';
}
