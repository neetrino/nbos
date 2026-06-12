import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import {
  DRIVE_CLEANUP_APPLY_ALL_CAP,
  DRIVE_CLEANUP_APPLY_ALL_KINDS,
  DRIVE_CLEANUP_APPLY_KINDS,
  DRIVE_CLEANUP_APPLY_MAX_IDS,
  DRIVE_CLEANUP_AUDIT_ENTITY,
  type DriveCleanupApplyKind,
} from './drive-cleanup.constants';
import {
  duplicateChecksumFileWhere,
  expiredPendingUploadSessionWhere,
  failedUploadSessionWhere,
  oldTaskAttachmentLinkWhere,
  orphanFileWhere,
  temporaryExportFileWhere,
} from './drive-cleanup-where';
import { DriveR2Client } from './drive-r2.client';
import { purgeRetentionFileAssets } from './drive-retention-purge.ops';
import { jsonSafeForHttp } from './drive-json-safe';

export interface DriveCleanupApplyResult {
  kind: DriveCleanupApplyKind;
  applied: number;
  skipped: number;
  ids: string[];
}

@Injectable()
export class DriveCleanupApplyService {
  private readonly logger = new Logger(DriveCleanupApplyService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AuditService,
    private readonly r2: DriveR2Client,
  ) {}

  async applyCleanup(
    userId: string,
    kindInput: string,
    idsInput: string[] | undefined,
    applyAll: boolean | undefined,
  ): Promise<DriveCleanupApplyResult> {
    const kind = this.normalizeKind(kindInput);
    const uniqueIds = [...new Set((idsInput ?? []).map((id) => id.trim()).filter(Boolean))];

    if (applyAll) {
      if (!DRIVE_CLEANUP_APPLY_ALL_KINDS.has(kind)) {
        throw new BadRequestException(`applyAll is not supported for cleanup kind "${kind}".`);
      }
      if (uniqueIds.length > 0) {
        throw new BadRequestException('Provide either applyAll or ids, not both.');
      }
      const batchResult = await this.applyAllForKind(userId, kind);
      return jsonSafeForHttp(batchResult);
    }

    if (uniqueIds.length === 0) {
      throw new BadRequestException('ids must include at least one candidate id.');
    }
    if (uniqueIds.length > DRIVE_CLEANUP_APPLY_MAX_IDS) {
      throw new BadRequestException(
        `At most ${DRIVE_CLEANUP_APPLY_MAX_IDS} ids per cleanup apply.`,
      );
    }

    const result = await this.applyIds(userId, kind, uniqueIds);
    await this.writeAudit(userId, kind, result);
    return jsonSafeForHttp(result);
  }

  private normalizeKind(kindInput: string): DriveCleanupApplyKind {
    const kind = kindInput.trim().toLowerCase().replace(/-/g, '_');
    if (!DRIVE_CLEANUP_APPLY_KINDS.includes(kind as DriveCleanupApplyKind)) {
      throw new BadRequestException(`kind must be one of: ${DRIVE_CLEANUP_APPLY_KINDS.join(', ')}`);
    }
    return kind as DriveCleanupApplyKind;
  }

  private async applyAllForKind(
    userId: string,
    kind: DriveCleanupApplyKind,
  ): Promise<DriveCleanupApplyResult> {
    const now = new Date();
    let applied = 0;
    let ids: string[] = [];

    if (kind === 'failed_upload_sessions') {
      const rows = await this.prisma.fileUploadSession.findMany({
        where: failedUploadSessionWhere(),
        select: { id: true },
        take: DRIVE_CLEANUP_APPLY_ALL_CAP,
      });
      ids = rows.map((row) => row.id);
      const r = await this.prisma.fileUploadSession.deleteMany({
        where: { id: { in: ids }, ...failedUploadSessionWhere() },
      });
      applied = r.count;
    } else if (kind === 'expired_pending_upload_sessions') {
      const where = expiredPendingUploadSessionWhere(now);
      const rows = await this.prisma.fileUploadSession.findMany({
        where,
        select: { id: true },
        take: DRIVE_CLEANUP_APPLY_ALL_CAP,
      });
      ids = rows.map((row) => row.id);
      const r = await this.prisma.fileUploadSession.deleteMany({
        where: { id: { in: ids }, ...where },
      });
      applied = r.count;
    } else if (kind === 'temporary_exports') {
      const fileWhere = temporaryExportFileWhere(now);
      const rows = await this.prisma.fileAsset.findMany({
        where: fileWhere,
        select: { id: true },
        take: DRIVE_CLEANUP_APPLY_ALL_CAP,
      });
      ids = rows.map((row) => row.id);
      applied = await this.softDeleteFileAssets(userId, ids, fileWhere);
    }

    const result: DriveCleanupApplyResult = {
      kind,
      applied,
      skipped: 0,
      ids,
    };
    await this.writeAudit(userId, kind, result, { applyAll: true });
    return result;
  }

  private async applyIds(
    userId: string,
    kind: DriveCleanupApplyKind,
    ids: string[],
  ): Promise<DriveCleanupApplyResult> {
    const now = new Date();
    let applied = 0;

    switch (kind) {
      case 'failed_upload_sessions': {
        const r = await this.prisma.fileUploadSession.deleteMany({
          where: { id: { in: ids }, ...failedUploadSessionWhere() },
        });
        applied = r.count;
        break;
      }
      case 'expired_pending_upload_sessions': {
        const where = expiredPendingUploadSessionWhere(now);
        const r = await this.prisma.fileUploadSession.deleteMany({
          where: { id: { in: ids }, ...where },
        });
        applied = r.count;
        break;
      }
      case 'orphan_files': {
        applied = await this.softDeleteFileAssets(userId, ids, {
          id: { in: ids },
          ...orphanFileWhere(),
        });
        break;
      }
      case 'temporary_exports': {
        applied = await this.softDeleteFileAssets(userId, ids, {
          id: { in: ids },
          ...temporaryExportFileWhere(now),
        });
        break;
      }
      case 'soft_deleted_retention': {
        applied = await this.markRetentionPurged(userId, ids, now);
        break;
      }
      case 'old_task_attachments': {
        const where = oldTaskAttachmentLinkWhere(now);
        const r = await this.prisma.fileLink.updateMany({
          where: { id: { in: ids }, ...where },
          data: { unlinkedAt: now },
        });
        applied = r.count;
        break;
      }
      case 'duplicate_checksum': {
        const checksums = await this.loadDuplicateChecksums(ids);
        if (checksums.length === 0) {
          throw new NotFoundException('No duplicate-checksum candidates matched the given ids.');
        }
        applied = await this.softDeleteFileAssets(userId, ids, {
          id: { in: ids },
          ...duplicateChecksumFileWhere(checksums),
        });
        break;
      }
      default:
        throw new BadRequestException('Unsupported cleanup kind.');
    }

    return {
      kind,
      applied,
      skipped: Math.max(0, ids.length - applied),
      ids,
    };
  }

  private async softDeleteFileAssets(
    userId: string,
    ids: string[],
    where: Parameters<typeof this.prisma.fileAsset.updateMany>[0]['where'],
  ): Promise<number> {
    const matched = await this.prisma.fileAsset.findMany({
      where,
      select: { id: true },
    });
    const matchedIds = matched.map((row) => row.id);
    if (matchedIds.length === 0) return 0;

    await this.prisma.$transaction(async (tx) => {
      await tx.fileAsset.updateMany({
        where: { id: { in: matchedIds } },
        data: { status: 'DELETED', deletedAt: new Date() },
      });
      await tx.fileAuditEvent.createMany({
        data: matchedIds.map((fileAssetId) => ({
          fileAssetId,
          actorId: userId,
          action: 'cleanup_applied',
          metadata: { source: 'drive_cleanup_apply' },
        })),
      });
    });
    return matchedIds.length;
  }

  private async markRetentionPurged(_userId: string, ids: string[], now: Date): Promise<number> {
    return purgeRetentionFileAssets(this.prisma, this.r2, this.logger, ids, now);
  }

  private async loadDuplicateChecksums(ids: string[]): Promise<string[]> {
    const rows = await this.prisma.fileAsset.findMany({
      where: { id: { in: ids }, deletedAt: null, checksum: { not: null } },
      select: { checksum: true },
      distinct: ['checksum'],
    });
    return rows.map((row) => row.checksum).filter((value): value is string => Boolean(value));
  }

  private async writeAudit(
    userId: string,
    kind: DriveCleanupApplyKind,
    result: DriveCleanupApplyResult,
    extra?: Record<string, unknown>,
  ) {
    await this.audit.log({
      entityType: DRIVE_CLEANUP_AUDIT_ENTITY,
      entityId: kind,
      action: 'drive_cleanup.applied',
      userId,
      changes: {
        kind,
        applied: result.applied,
        skipped: result.skipped,
        idCount: result.ids.length,
        ...extra,
      },
    });
  }
}
