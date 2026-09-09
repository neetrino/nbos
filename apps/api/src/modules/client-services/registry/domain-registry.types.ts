import type {
  ClientServiceRegistryLookupSourceEnum,
  ClientServiceRegistryLookupStatusEnum,
} from '@nbos/database';

export type RegistryLookupStatus = ClientServiceRegistryLookupStatusEnum;
export type RegistryLookupSource = ClientServiceRegistryLookupSourceEnum;

export interface RegistryLookupRaw {
  status: RegistryLookupStatus;
  expiryDate: Date | null;
  source: RegistryLookupSource;
}

export type DomainRegistryCheckOutcome =
  | 'updated'
  | 'unchanged'
  | 'not_found'
  | 'no_expiry'
  | 'failed';

export interface DomainRegistryCheckResult {
  serviceId: string;
  domainName: string;
  outcome: DomainRegistryCheckOutcome;
  renewalUpdated: boolean;
  registryLookupStatus: RegistryLookupStatus;
  registryExpiryDate: string | null;
  registryCheckedAt: string;
  registryLookupSource: RegistryLookupSource | null;
  renewalDate: string | null;
}

export interface DomainRegistryApplyInput {
  storedRenewalDate: Date | null;
  lookup: RegistryLookupRaw;
}

export interface DomainRegistryApplyDecision {
  outcome: DomainRegistryCheckOutcome;
  nextRenewalDate: Date | null;
  persistStatus: RegistryLookupStatus;
  persistExpiry: Date | null;
  persistSource: RegistryLookupSource;
}
