import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { resolveRetentionMsForEntity } from '../../common/lifecycle/platform-retention-rules.resolver';
import { purgeTrashedCredentialsPastRetention } from '../credentials/credential-trash-purge.ops';
import { DriveR2Client } from '../drive/drive-r2.client';
import { purgeDriveTrashRetentionBatch } from '../drive/drive-trash-retention-purge.ops';
import {
  PLATFORM_TRASH_PURGE_AUDIT_ACTION,
  PLATFORM_TRASH_PURGE_AUDIT_ENTITY,
} from './platform-trash-purge.constants';
import type { PlatformTrashPurgeRunResult } from './platform-trash-inventory.types';

@Injectable()
export class PlatformTrashPurgeService {
  private readonly logger = new Logger(PlatformTrashPurgeService.name);

  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
    private readonly driveR2: DriveR2Client,
  ) {}

  async runRetentionPurge(now = new Date()): Promise<PlatformTrashPurgeRunResult> {
    const startedAt = now.toISOString();
    const credentialRetentionMs = resolveRetentionMsForEntity('credential');
    const driveRetentionMs = resolveRetentionMsForEntity('drive_file');

    const [credentials, driveFiles] = await Promise.all([
      purgeTrashedCredentialsPastRetention(
        this.prisma,
        this.auditService,
        now,
        credentialRetentionMs ?? undefined,
      ),
      purgeDriveTrashRetentionBatch(
        this.prisma,
        this.driveR2,
        this.logger,
        now,
        driveRetentionMs ?? undefined,
      ),
    ]);

    const completedAt = new Date().toISOString();
    const result: PlatformTrashPurgeRunResult = {
      startedAt,
      completedAt,
      credentials,
      driveFiles,
      totalPurged: credentials.purged + driveFiles.purged,
    };

    await this.auditService.log({
      entityType: PLATFORM_TRASH_PURGE_AUDIT_ENTITY,
      entityId: PLATFORM_TRASH_PURGE_AUDIT_ENTITY,
      action: PLATFORM_TRASH_PURGE_AUDIT_ACTION,
      changes: result,
    });

    this.logger.log(
      `Platform trash retention purge: credentials=${credentials.purged}, driveFiles=${driveFiles.purged}`,
    );
    return result;
  }
}
