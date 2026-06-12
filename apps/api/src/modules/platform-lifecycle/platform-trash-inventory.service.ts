import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { buildDriveRecoverableTrashWhere } from '../../common/lifecycle/entity-lifecycle-scope';
import { softDeletedRetentionWhere } from '../drive/drive-cleanup-where';
import {
  PLATFORM_TRASH_INVENTORY_ENTRIES,
  type PlatformTrashInventoryEntryDefinition,
} from '../../common/lifecycle/platform-trash-inventory.registry';
import {
  listResolvedRetentionRules,
  resolveRetentionDaysForEntity,
  resolveRetentionMsForEntity,
} from '../../common/lifecycle/platform-retention-rules.resolver';
import {
  purgeableTrashedCompanyWhere,
  purgeableTrashedContactWhere,
  purgeableTrashedDealWhere,
  purgeableTrashedLeadWhere,
  purgeableTrashedPartnerWhere,
  purgeableTrashedProjectWhere,
} from '../../common/lifecycle/profile-a-purgeable-where';
import type {
  PlatformRetentionRuleRow,
  PlatformTrashInventoryCategory,
  PlatformTrashInventoryResponse,
} from './platform-trash-inventory.types';

function retentionCutoff(now: Date, retentionDays: number): Date {
  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}

function profileAPurgeableWhere(key: string, now: Date, retentionMs: number): object | null {
  if (key === 'contact') return purgeableTrashedContactWhere(now, retentionMs);
  if (key === 'company') return purgeableTrashedCompanyWhere(now, retentionMs);
  if (key === 'lead') return purgeableTrashedLeadWhere(now, retentionMs);
  if (key === 'deal') return purgeableTrashedDealWhere(now, retentionMs);
  if (key === 'partner') return purgeableTrashedPartnerWhere(now, retentionMs);
  if (key === 'project') return purgeableTrashedProjectWhere(now, retentionMs);
  return null;
}

@Injectable()
export class PlatformTrashInventoryService {
  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  listRetentionRules(): PlatformRetentionRuleRow[] {
    return listResolvedRetentionRules().map((rule) => ({
      key: rule.key,
      moduleLabel: rule.moduleLabel,
      entityLabel: rule.entityLabel,
      profile: rule.profile,
      timestampField: rule.timestampField,
      retentionDays: rule.retentionDays,
      scheduledPurgeJob: rule.scheduledPurgeJob,
      registryRetentionDays: rule.registryRetentionDays,
      automatedPurge: rule.automatedPurge,
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
    const retentionDays = resolveRetentionDaysForEntity(entry.key, entry.retentionDays);
    return {
      key: entry.key,
      moduleLabel: entry.moduleLabel,
      entityLabel: entry.entityLabel,
      profile: entry.profile,
      timestampField: entry.timestampField,
      retentionDays,
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
    const retentionDays = resolveRetentionDaysForEntity(entry.key, entry.retentionDays);
    if (retentionDays == null) return Promise.resolve(0);
    if (entry.driveTrash) {
      return this.prisma.fileAsset.count({
        where: softDeletedRetentionWhere(now, retentionDays * 24 * 60 * 60 * 1000),
      });
    }
    if (entry.profile === 'A') {
      return this.countProfileAPurgeEligible(entry.key, now);
    }
    const cutoff = retentionCutoff(now, retentionDays);
    return this.countByTimestampField(entry.prismaModel, entry.timestampField, 'purge', cutoff);
  }

  private countProfileAPurgeEligible(key: string, now: Date): Promise<number> {
    const retentionMs = resolveRetentionMsForEntity(key);
    if (retentionMs == null) return Promise.resolve(0);
    const where = profileAPurgeableWhere(key, now, retentionMs);
    if (!where) return Promise.resolve(0);
    return this.countProfileAModel(key, where);
  }

  private countProfileAModel(key: string, where: object): Promise<number> {
    if (key === 'contact') return this.prisma.contact.count({ where });
    if (key === 'company') return this.prisma.company.count({ where });
    if (key === 'lead') return this.prisma.lead.count({ where });
    if (key === 'deal') return this.prisma.deal.count({ where });
    if (key === 'partner') return this.prisma.partner.count({ where });
    if (key === 'project') return this.prisma.project.count({ where });
    return Promise.resolve(0);
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
