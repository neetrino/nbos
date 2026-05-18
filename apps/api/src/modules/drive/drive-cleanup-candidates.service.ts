import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { jsonSafeForHttp } from './drive-json-safe';
import { DRIVE_CLEANUP_CANDIDATE_PREVIEW_LIMIT } from './drive-zip-export.constants';
import {
  expiredPendingUploadSessionWhere,
  failedUploadSessionWhere,
  oldTaskAttachmentLinkWhere,
  orphanFileWhere,
  softDeletedRetentionWhere,
  temporaryExportFileWhere,
} from './drive-cleanup-where';

export interface DriveCleanupCandidateItem {
  id: string;
  kind: string;
  label: string;
  detail?: string;
  sizeBytes?: string | null;
  createdAt?: string;
}

export interface DriveCleanupCandidateCategory {
  kind: string;
  label: string;
  count: number;
  preview: DriveCleanupCandidateItem[];
}

@Injectable()
export class DriveCleanupCandidatesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listCandidates(): Promise<{ categories: DriveCleanupCandidateCategory[] }> {
    const now = new Date();
    const categories = await Promise.all([
      this.orphanFiles(),
      this.failedUploadSessions(),
      this.expiredPendingUploadSessions(now),
      this.duplicateChecksums(),
      this.temporaryExports(now),
      this.softDeletedRetention(now),
      this.oldTaskAttachments(now),
    ]);
    return jsonSafeForHttp({ categories });
  }

  private async orphanFiles(): Promise<DriveCleanupCandidateCategory> {
    const where = orphanFileWhere();
    const rows = await this.prisma.fileAsset.findMany({
      where,
      select: { id: true, displayName: true, sizeBytes: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: DRIVE_CLEANUP_CANDIDATE_PREVIEW_LIMIT,
    });
    const count = await this.prisma.fileAsset.count({ where });
    return this.category(
      'orphan_files',
      'Orphan files (no links or folder placement)',
      count,
      rows,
    );
  }

  private async failedUploadSessions(): Promise<DriveCleanupCandidateCategory> {
    const where = failedUploadSessionWhere();
    const rows = await this.prisma.fileUploadSession.findMany({
      where,
      select: { id: true, displayName: true, storageKey: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: DRIVE_CLEANUP_CANDIDATE_PREVIEW_LIMIT,
    });
    const count = await this.prisma.fileUploadSession.count({ where });
    return this.category(
      'failed_upload_sessions',
      'Failed upload sessions',
      count,
      rows,
      (row) => ({
        id: row.id,
        kind: 'upload_session',
        label: row.displayName,
        detail: row.storageKey,
        createdAt: row.createdAt.toISOString(),
      }),
    );
  }

  private async expiredPendingUploadSessions(now: Date): Promise<DriveCleanupCandidateCategory> {
    const where = expiredPendingUploadSessionWhere(now);
    const rows = await this.prisma.fileUploadSession.findMany({
      where,
      select: { id: true, displayName: true, expiresAt: true, createdAt: true },
      orderBy: { expiresAt: 'asc' },
      take: DRIVE_CLEANUP_CANDIDATE_PREVIEW_LIMIT,
    });
    const count = await this.prisma.fileUploadSession.count({ where });
    return this.category(
      'expired_pending_upload_sessions',
      'Expired pending upload sessions',
      count,
      rows,
      (row) => ({
        id: row.id,
        kind: 'upload_session',
        label: row.displayName,
        detail: row.expiresAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
      }),
    );
  }

  private async duplicateChecksums(): Promise<DriveCleanupCandidateCategory> {
    const groups = await this.prisma.fileAsset.groupBy({
      by: ['checksum'],
      where: { deletedAt: null, checksum: { not: null } },
      _count: { id: true },
      having: { id: { _count: { gt: 1 } } },
      orderBy: { _count: { id: 'desc' } },
      take: DRIVE_CLEANUP_CANDIDATE_PREVIEW_LIMIT,
    });
    const checksums = groups
      .map((group) => group.checksum)
      .filter((value): value is string => Boolean(value));
    const rows =
      checksums.length === 0
        ? []
        : await this.prisma.fileAsset.findMany({
            where: { checksum: { in: checksums }, deletedAt: null },
            select: {
              id: true,
              displayName: true,
              checksum: true,
              sizeBytes: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
            take: DRIVE_CLEANUP_CANDIDATE_PREVIEW_LIMIT,
          });
    const count = checksums.length;
    return this.category('duplicate_checksum', 'Duplicate checksum groups', count, rows, (row) => ({
      id: row.id,
      kind: 'file_asset',
      label: row.displayName,
      detail: row.checksum ?? undefined,
      sizeBytes: row.sizeBytes?.toString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  private async temporaryExports(now: Date): Promise<DriveCleanupCandidateCategory> {
    const fileWhere = temporaryExportFileWhere(now);
    const rows = await this.prisma.fileAsset.findMany({
      where: fileWhere,
      select: { id: true, displayName: true, sizeBytes: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: DRIVE_CLEANUP_CANDIDATE_PREVIEW_LIMIT,
    });
    const count = await this.prisma.fileAsset.count({ where: fileWhere });
    return this.category(
      'temporary_exports',
      'Expired Drive ZIP export artifacts',
      count,
      rows,
      (row) => ({
        id: row.id,
        kind: 'file_asset',
        label: row.displayName,
        sizeBytes: row.sizeBytes?.toString() ?? null,
        createdAt: row.createdAt.toISOString(),
      }),
    );
  }

  private async softDeletedRetention(now: Date): Promise<DriveCleanupCandidateCategory> {
    const where = softDeletedRetentionWhere(now);
    const rows = await this.prisma.fileAsset.findMany({
      where,
      select: { id: true, displayName: true, deletedAt: true, sizeBytes: true },
      orderBy: { deletedAt: 'asc' },
      take: DRIVE_CLEANUP_CANDIDATE_PREVIEW_LIMIT,
    });
    const count = await this.prisma.fileAsset.count({ where });
    return this.category(
      'soft_deleted_retention',
      'Trash files past retention',
      count,
      rows,
      (row) => ({
        id: row.id,
        kind: 'file_asset',
        label: row.displayName,
        detail: row.deletedAt?.toISOString(),
        sizeBytes: row.sizeBytes?.toString() ?? null,
        createdAt: row.deletedAt?.toISOString(),
      }),
    );
  }

  private async oldTaskAttachments(now: Date): Promise<DriveCleanupCandidateCategory> {
    const where = oldTaskAttachmentLinkWhere(now);
    const rows = await this.prisma.fileLink.findMany({
      where,
      select: {
        id: true,
        linkedAt: true,
        fileAsset: { select: { id: true, displayName: true, sizeBytes: true } },
      },
      orderBy: { linkedAt: 'asc' },
      take: DRIVE_CLEANUP_CANDIDATE_PREVIEW_LIMIT,
    });
    const count = await this.prisma.fileLink.count({ where });
    return this.category(
      'old_task_attachments',
      'Old task attachment links',
      count,
      rows,
      (row) => ({
        id: row.id,
        kind: 'file_link',
        label: row.fileAsset?.displayName ?? row.id,
        detail: row.fileAsset?.id ?? undefined,
        sizeBytes: row.fileAsset?.sizeBytes?.toString() ?? null,
        createdAt: row.linkedAt.toISOString(),
      }),
    );
  }

  private category<T>(
    kind: string,
    label: string,
    count: number,
    rows: T[],
    mapRow: (row: T) => DriveCleanupCandidateItem,
  ): DriveCleanupCandidateCategory;
  private category(
    kind: string,
    label: string,
    count: number,
    rows: { id: string; displayName: string; sizeBytes?: bigint | null; createdAt: Date }[],
  ): DriveCleanupCandidateCategory;
  private category<T>(
    kind: string,
    label: string,
    count: number,
    rows: T[],
    mapRow?: (row: T) => DriveCleanupCandidateItem,
  ): DriveCleanupCandidateCategory {
    const preview = mapRow
      ? rows.map(mapRow)
      : (
          rows as { id: string; displayName: string; sizeBytes?: bigint | null; createdAt: Date }[]
        ).map((row) => ({
          id: row.id,
          kind: 'file_asset',
          label: row.displayName,
          sizeBytes: row.sizeBytes?.toString() ?? null,
          createdAt: row.createdAt.toISOString(),
        }));
    return { kind, label, count, preview };
  }
}
