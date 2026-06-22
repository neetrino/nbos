import type { LifecycleProfile, LifecycleTimestampField } from '@nbos/shared';

/** Default recoverable-trash retention before automated purge (Profile A/B/C). */
export const PLATFORM_DEFAULT_TRASH_RETENTION_DAYS = 30;

export type TrashInventoryPrismaModel =
  | 'contact'
  | 'company'
  | 'lead'
  | 'deal'
  | 'partner'
  | 'project'
  | 'credential'
  | 'fileAsset'
  | 'emailThread';

export interface PlatformTrashInventoryEntryDefinition {
  key: string;
  moduleLabel: string;
  entityLabel: string;
  profile: LifecycleProfile;
  timestampField: LifecycleTimestampField;
  /** `null` = no automated purge (manual/admin only). */
  retentionDays: number | null;
  prismaModel: TrashInventoryPrismaModel;
  /** Drive Profile B — uses status + deletedAt instead of a single timestamp field. */
  driveTrash?: boolean;
  webHref: string;
  scheduledPurgeJob?: string;
}

export const PLATFORM_TRASH_INVENTORY_ENTRIES: PlatformTrashInventoryEntryDefinition[] = [
  {
    key: 'contact',
    moduleLabel: 'Clients',
    entityLabel: 'Contacts',
    profile: 'A',
    timestampField: 'trashedAt',
    retentionDays: PLATFORM_DEFAULT_TRASH_RETENTION_DAYS,
    prismaModel: 'contact',
    webHref: '/clients/contacts?scope=trash',
    scheduledPurgeJob: 'POST /scheduler/platform-trash-purge',
  },
  {
    key: 'company',
    moduleLabel: 'Clients',
    entityLabel: 'Companies',
    profile: 'A',
    timestampField: 'trashedAt',
    retentionDays: PLATFORM_DEFAULT_TRASH_RETENTION_DAYS,
    prismaModel: 'company',
    webHref: '/clients/companies?scope=trash',
    scheduledPurgeJob: 'POST /scheduler/platform-trash-purge',
  },
  {
    key: 'lead',
    moduleLabel: 'CRM',
    entityLabel: 'Leads',
    profile: 'A',
    timestampField: 'trashedAt',
    retentionDays: PLATFORM_DEFAULT_TRASH_RETENTION_DAYS,
    prismaModel: 'lead',
    webHref: '/crm/leads?scope=trash',
    scheduledPurgeJob: 'POST /scheduler/platform-trash-purge',
  },
  {
    key: 'deal',
    moduleLabel: 'CRM',
    entityLabel: 'Deals',
    profile: 'A',
    timestampField: 'trashedAt',
    retentionDays: PLATFORM_DEFAULT_TRASH_RETENTION_DAYS,
    prismaModel: 'deal',
    webHref: '/crm/deals?scope=trash',
    scheduledPurgeJob: 'POST /scheduler/platform-trash-purge',
  },
  {
    key: 'partner',
    moduleLabel: 'Partners',
    entityLabel: 'Partners',
    profile: 'A',
    timestampField: 'trashedAt',
    retentionDays: PLATFORM_DEFAULT_TRASH_RETENTION_DAYS,
    prismaModel: 'partner',
    webHref: '/partners?scope=trash',
    scheduledPurgeJob: 'POST /scheduler/platform-trash-purge',
  },
  {
    key: 'project',
    moduleLabel: 'Projects',
    entityLabel: 'Projects',
    profile: 'A',
    timestampField: 'trashedAt',
    retentionDays: PLATFORM_DEFAULT_TRASH_RETENTION_DAYS,
    prismaModel: 'project',
    webHref: '/projects',
    scheduledPurgeJob: 'POST /scheduler/platform-trash-purge',
  },
  {
    key: 'credential',
    moduleLabel: 'Credentials',
    entityLabel: 'Credentials',
    profile: 'C',
    timestampField: 'trashedAt',
    retentionDays: PLATFORM_DEFAULT_TRASH_RETENTION_DAYS,
    prismaModel: 'credential',
    webHref: '/credentials',
    scheduledPurgeJob: 'POST /scheduler/platform-trash-purge',
  },
  {
    key: 'mail_thread',
    moduleLabel: 'Mail',
    entityLabel: 'Threads',
    profile: 'A',
    timestampField: 'trashedAt',
    retentionDays: PLATFORM_DEFAULT_TRASH_RETENTION_DAYS,
    prismaModel: 'emailThread',
    webHref: '/mail?folder=trash',
    scheduledPurgeJob: 'POST /scheduler/platform-trash-purge',
  },
  {
    key: 'drive_file',
    moduleLabel: 'Drive',
    entityLabel: 'Files',
    profile: 'B',
    timestampField: 'deletedAt',
    retentionDays: PLATFORM_DEFAULT_TRASH_RETENTION_DAYS,
    prismaModel: 'fileAsset',
    driveTrash: true,
    webHref: '/drive',
    scheduledPurgeJob: 'POST /scheduler/platform-trash-purge',
  },
];
