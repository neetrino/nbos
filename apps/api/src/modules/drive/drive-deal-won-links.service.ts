import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient, type FilePurposeEnum, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { DEAL_WON_AUTO_LINK_PURPOSES } from './drive-deal-won-link.constants';
import type { DealWonDriveLinkTargets } from './drive-deal-won-links.types';

type LinkTarget = { entityType: string; entityId: string };

@Injectable()
export class DriveDealWonLinksService {
  private readonly logger = new Logger(DriveDealWonLinksService.name);

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async linkApprovedDealMaterials(targets: DealWonDriveLinkTargets): Promise<number> {
    const fileAssetIds = await this.findHandoffFileAssetIds(targets.dealId);
    if (fileAssetIds.length === 0) return 0;

    const linkTargets = this.buildLinkTargets(targets);
    let created = 0;
    for (const fileAssetId of fileAssetIds) {
      created += await this.ensureLinksForFile(fileAssetId, linkTargets);
    }
    if (created > 0) {
      this.logger.log(
        `Deal Won: added ${created} FileLink(s) for deal ${targets.dealId} (${fileAssetIds.length} file(s))`,
      );
    }
    return created;
  }

  private async findHandoffFileAssetIds(dealId: string): Promise<string[]> {
    const purposeFilter = this.handoffPurposeWhere();
    const rows = await this.prisma.fileLink.findMany({
      where: {
        entityType: 'DEAL',
        entityId: dealId,
        unlinkedAt: null,
        fileAsset: { deletedAt: null, ...purposeFilter },
      },
      select: { fileAssetId: true },
      distinct: ['fileAssetId'],
    });
    return rows.map((row) => row.fileAssetId);
  }

  private handoffPurposeWhere(): Prisma.FileAssetWhereInput {
    return {
      OR: [
        { purpose: { in: [...DEAL_WON_AUTO_LINK_PURPOSES] } },
        {
          links: {
            some: {
              purposeOverride: { in: [...DEAL_WON_AUTO_LINK_PURPOSES] },
              unlinkedAt: null,
            },
          },
        },
      ],
    };
  }

  private buildLinkTargets(targets: DealWonDriveLinkTargets): LinkTarget[] {
    const out: LinkTarget[] = [{ entityType: 'PROJECT', entityId: targets.projectId }];
    if (targets.contactId) {
      out.push({ entityType: 'CONTACT', entityId: targets.contactId });
    }
    if (targets.productId) {
      out.push({ entityType: 'PRODUCT', entityId: targets.productId });
    }
    if (targets.extensionId) {
      out.push({ entityType: 'EXTENSION', entityId: targets.extensionId });
    }
    if (targets.companyId) {
      out.push({ entityType: 'COMPANY', entityId: targets.companyId });
    }
    return out;
  }

  private async ensureLinksForFile(fileAssetId: string, targets: LinkTarget[]): Promise<number> {
    const asset = await this.prisma.fileAsset.findFirst({
      where: { id: fileAssetId, deletedAt: null },
      select: { purpose: true },
    });
    if (!asset) return 0;

    let created = 0;
    for (const target of targets) {
      const added = await this.ensureSingleLink(
        fileAssetId,
        target,
        asset.purpose as FilePurposeEnum | null,
      );
      if (added) created += 1;
    }
    return created;
  }

  private async ensureSingleLink(
    fileAssetId: string,
    target: LinkTarget,
    purpose: FilePurposeEnum | null,
  ): Promise<boolean> {
    const existing = await this.prisma.fileLink.findFirst({
      where: {
        fileAssetId,
        entityType: target.entityType,
        entityId: target.entityId,
        unlinkedAt: null,
      },
      select: { id: true },
    });
    if (existing) return false;

    await this.prisma.fileLink.create({
      data: {
        fileAssetId,
        entityType: target.entityType,
        entityId: target.entityId,
        linkType: 'HANDOFF',
        purposeOverride: purpose ?? undefined,
        isPrimary: false,
      },
    });
    return true;
  }
}
