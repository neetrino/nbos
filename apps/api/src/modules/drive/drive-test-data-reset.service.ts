import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { DriveR2Client } from './drive-r2.client';
import { isDriveStorageResetEnabled } from './drive-tenant';
import { NBOS_STORAGE_ROOT, buildTenantFilesPrefix } from './drive-storage-home-path';
import { R2_DRIVE_PREFIX } from './drive-storage';
import { purgeR2Prefix } from './drive-r2-prefix-purge';

export type DriveTestDataResetResult = {
  database: Record<string, number>;
  r2: { drivePrefixDeleted: number; nbosPrefixDeleted: number };
};

@Injectable()
export class DriveTestDataResetService {
  private readonly logger = new Logger(DriveTestDataResetService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly r2: DriveR2Client,
    private readonly config: ConfigService,
  ) {}

  async resetAll(): Promise<DriveTestDataResetResult> {
    if (!isDriveStorageResetEnabled(this.config)) {
      throw new BadRequestException(
        'Drive test-data reset is disabled. Set NBOS_DRIVE_ALLOW_STORAGE_RESET=true to enable.',
      );
    }

    const database = await this.prisma.$transaction(async (tx) => {
      const counts: Record<string, number> = {};

      const docsCleared = await tx.document.updateMany({
        data: { coverFileAssetId: null },
        where: { coverFileAssetId: { not: null } },
      });
      counts.documentCoversCleared = docsCleared.count;

      const partnersCleared = await tx.partner.updateMany({
        data: { agreementFileAssetId: null },
        where: { agreementFileAssetId: { not: null } },
      });
      counts.partnerAgreementsCleared = partnersCleared.count;

      counts.messengerChannelAttachments = (
        await tx.messengerChannelMessageAttachment.deleteMany({})
      ).count;
      counts.messengerDirectAttachments = (
        await tx.messengerDirectMessageAttachment.deleteMany({})
      ).count;
      counts.emailAttachments = (await tx.emailAttachment.deleteMany({})).count;
      counts.documentAttachments = (await tx.documentAttachment.deleteMany({})).count;
      counts.reportExportJobs = (
        await tx.reportExportJob.deleteMany({ where: { fileAssetId: { not: null } } })
      ).count;
      counts.driveZipExportJobs = (await tx.driveZipExportJob.deleteMany({})).count;
      counts.driveFolderItems = (await tx.driveFolderItem.deleteMany({})).count;
      counts.fileUploadSessions = (await tx.fileUploadSession.deleteMany({})).count;
      counts.fileAssets = (await tx.fileAsset.deleteMany({})).count;
      counts.driveFolders = (await tx.driveFolder.deleteMany({})).count;

      return counts;
    });

    const s3 = this.r2.ensureS3();
    const orgId = this.config.get<string>('NBOS_TENANT_ORGANIZATION_ID')?.trim();
    const nbosPrefixes = [`${NBOS_STORAGE_ROOT}/`];
    if (orgId) {
      nbosPrefixes.push(buildTenantFilesPrefix(orgId));
    }

    const drivePurge = await purgeR2Prefix(s3, this.r2.bucket, R2_DRIVE_PREFIX);
    let nbosDeleted = 0;
    for (const prefix of nbosPrefixes) {
      const r = await purgeR2Prefix(s3, this.r2.bucket, prefix);
      nbosDeleted += r.deleted;
    }

    this.logger.warn(
      `Drive test-data reset completed: DB file_assets=${database.fileAssets ?? 0}, R2 Drive=${drivePurge.deleted}, R2 nbos=${nbosDeleted}`,
    );

    return {
      database,
      r2: { drivePrefixDeleted: drivePurge.deleted, nbosPrefixDeleted: nbosDeleted },
    };
  }
}
