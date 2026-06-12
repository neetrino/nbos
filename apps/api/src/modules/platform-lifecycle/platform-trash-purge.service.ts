import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { resolveRetentionMsForEntity } from '../../common/lifecycle/platform-retention-rules.resolver';
import { purgeTrashedCredentialsPastRetention } from '../credentials/credential-trash-purge.ops';
import { DriveR2Client } from '../drive/drive-r2.client';
import { purgeDriveTrashRetentionBatch } from '../drive/drive-trash-retention-purge.ops';
import { purgeProfileATrashPastRetention } from '../../common/lifecycle/profile-a-trash-purge.ops';
import { purgeTrashedMailThreadsPastRetention } from '../mail/mail-trash-purge.ops';
import {
  PLATFORM_SCHEDULER_AUDIT_ACTOR_ID,
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
    const mailRetentionMs = resolveRetentionMsForEntity('mail_thread');

    const [credentials, driveFiles, mailThreads, profileA] = await Promise.all([
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
      purgeTrashedMailThreadsPastRetention(
        this.prisma,
        this.auditService,
        now,
        mailRetentionMs ?? undefined,
      ),
      purgeProfileATrashPastRetention(this.prisma, this.auditService, now),
    ]);

    const profileAPurged = profileA.reduce((sum, slice) => sum + slice.purged, 0);
    const completedAt = new Date().toISOString();
    const result: PlatformTrashPurgeRunResult = {
      startedAt,
      completedAt,
      credentials,
      driveFiles,
      mailThreads,
      profileA,
      totalPurged: credentials.purged + driveFiles.purged + mailThreads.purged + profileAPurged,
    };

    await this.auditService.log({
      entityType: PLATFORM_TRASH_PURGE_AUDIT_ENTITY,
      entityId: PLATFORM_TRASH_PURGE_AUDIT_ENTITY,
      action: PLATFORM_TRASH_PURGE_AUDIT_ACTION,
      userId: PLATFORM_SCHEDULER_AUDIT_ACTOR_ID,
      changes: result as unknown as InputJsonValue,
    });

    this.logger.log(
      `Platform trash retention purge: credentials=${credentials.purged}, driveFiles=${driveFiles.purged}, mailThreads=${mailThreads.purged}, profileA=${profileAPurged}`,
    );
    return result;
  }
}
