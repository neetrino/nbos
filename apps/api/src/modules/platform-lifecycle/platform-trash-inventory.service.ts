import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { buildDriveRecoverableTrashWhere } from '../../common/lifecycle/entity-lifecycle-scope';
import { softDeletedRetentionWhere } from '../drive/drive-cleanup-where';
import {
  PLATFORM_TRASH_INVENTORY_ENTRIES,
  type PlatformTrashInventoryEntryDefinition,
} from '../../common/lifecycle/platform-trash-inventory.registry';
import type {
  PlatformRetentionRuleRow,
  PlatformTrashInventoryCategory,
  PlatformTrashInventoryResponse,
} from './platform-trash-inventory.types';

function retentionCutoff(now: Date, retentionDays: number): Date {
  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}

@Injectable()
export class PlatformTrashInventoryService {
  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  listRetentionRules(): PlatformRetentionRuleRow[] {
    return PLATFORM_TRASH_INVENTORY_ENTRIES.map((entry) => ({
      key: entry.key,
      moduleLabel: entry.moduleLabel,
      entityLabel: entry.entityLabel,
      profile: entry.profile,
      timestampField: entry.timestampField,
      retentionDays: entry.retentionDays,
      scheduledPurgeJob: entry.scheduledPurgeJob,
    }));
  }

  async getInventory(now = new Date()): Promise<PlatformTrashInventoryResponse> {
    const categories = await Promise.all(
      PLATFORM_TRASH_INVENTORY_ENTRIES.map((entry) => this.countEntry(entry, now)),
    );
    return {
      generatedAt: now.toISOString(),
      totalTrashed: categories.reduce((sum, row) => sum + row.count, 0),
      totalPurgeEligible: categories.reduce((sum, row) => sum + row.purgeEligibleCount, 0),
      categories,
    };
  }

  private async countEntry(
    entry: PlatformTrashInventoryEntryDefinition,
    now: Date,
  ): Promise<PlatformTrashInventoryCategory> {
    const [count, purgeEligibleCount] = await Promise.all([
      this.countTrashed(entry),
      this.countPurgeEligible(entry, now),
    ]);
    return {
      key: entry.key,
      moduleLabel: entry.moduleLabel,
      entityLabel: entry.entityLabel,
      profile: entry.profile,
      timestampField: entry.timestampField,
      retentionDays: entry.retentionDays,
      count,
      purgeEligibleCount,
      webHref: entry.webHref,
      scheduledPurgeJob: entry.scheduledPurgeJob,
    };
  }

  private countTrashed(entry: PlatformTrashInventoryEntryDefinition): Promise<number> {
    if (entry.driveTrash) {
      return this.prisma.fileAsset.count({ where: buildDriveRecoverableTrashWhere() });
    }
    return this.countByTimestampField(entry.prismaModel, entry.timestampField, 'trash');
  }

  private countPurgeEligible(
    entry: PlatformTrashInventoryEntryDefinition,
    now: Date,
  ): Promise<number> {
    if (entry.retentionDays == null) return Promise.resolve(0);
    if (entry.driveTrash) {
      return this.prisma.fileAsset.count({ where: softDeletedRetentionWhere(now) });
    }
    const cutoff = retentionCutoff(now, entry.retentionDays);
    return this.countByTimestampField(entry.prismaModel, entry.timestampField, 'purge', cutoff);
  }

  private countByTimestampField(
    model: PlatformTrashInventoryEntryDefinition['prismaModel'],
    field: PlatformTrashInventoryEntryDefinition['timestampField'],
    mode: 'trash' | 'purge',
    cutoff?: Date,
  ): Promise<number> {
    const trashFilter =
      mode === 'trash' ? { [field]: { not: null } } : { [field]: { lt: cutoff ?? new Date(0) } };

    switch (model) {
      case 'contact':
        return this.prisma.contact.count({ where: trashFilter });
      case 'company':
        return this.prisma.company.count({ where: trashFilter });
      case 'lead':
        return this.prisma.lead.count({ where: trashFilter });
      case 'deal':
        return this.prisma.deal.count({ where: trashFilter });
      case 'partner':
        return this.prisma.partner.count({ where: trashFilter });
      case 'project':
        return this.prisma.project.count({ where: trashFilter });
      case 'credential':
        return this.prisma.credential.count({ where: trashFilter });
      default:
        return Promise.resolve(0);
    }
  }
}
