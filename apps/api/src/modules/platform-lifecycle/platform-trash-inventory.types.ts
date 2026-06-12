import type { LifecycleProfile, LifecycleTimestampField } from '@nbos/shared';

export interface PlatformTrashInventoryCategory {
  key: string;
  moduleLabel: string;
  entityLabel: string;
  profile: LifecycleProfile;
  timestampField: LifecycleTimestampField;
  retentionDays: number | null;
  count: number;
  purgeEligibleCount: number;
  webHref: string;
  scheduledPurgeJob?: string;
}

export interface PlatformTrashInventoryResponse {
  generatedAt: string;
  totalTrashed: number;
  totalPurgeEligible: number;
  categories: PlatformTrashInventoryCategory[];
}

export interface PlatformRetentionRuleRow {
  key: string;
  moduleLabel: string;
  entityLabel: string;
  profile: LifecycleProfile;
  timestampField: LifecycleTimestampField;
  retentionDays: number | null;
  scheduledPurgeJob?: string;
}
