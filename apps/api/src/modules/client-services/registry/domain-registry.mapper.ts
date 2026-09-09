import type { DomainRegistryCheckResult } from './domain-registry.types';
import type { DomainRegistryApplyDecision } from './domain-registry.types';
import type { RegistryLookupRaw } from './domain-registry.types';

export function toRegistryCheckResult(input: {
  serviceId: string;
  domainName: string;
  decision: DomainRegistryApplyDecision;
  lookup: RegistryLookupRaw;
  renewalDate: Date | null;
  checkedAt: Date;
}): DomainRegistryCheckResult {
  return {
    serviceId: input.serviceId,
    domainName: input.domainName,
    outcome: input.decision.outcome,
    renewalUpdated: input.decision.outcome === 'updated',
    registryLookupStatus: input.decision.persistStatus,
    registryExpiryDate:
      (input.decision.persistExpiry ?? input.lookup.expiryDate)?.toISOString() ?? null,
    registryCheckedAt: input.checkedAt.toISOString(),
    registryLookupSource: input.decision.persistSource,
    renewalDate: input.renewalDate?.toISOString() ?? null,
  };
}
