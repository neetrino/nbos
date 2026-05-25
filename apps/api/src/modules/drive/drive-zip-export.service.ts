import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { DriveService } from './drive.service';
import type { DriveEntityAccess, DriveEntityContextAccess } from './drive-access.types';
import { DriveTypedExportResolver } from './drive-typed-export-resolver';
import {
  normalizeDriveZipExportKind,
  parseDriveZipExportParams,
  type DriveZipExportParams,
} from './drive-export-kinds';
import { DriveExportZipQueueService } from './drive-export-zip-queue.service';
import { R2_DRIVE_PREFIX } from './drive-storage';
import { jsonSafeForHttp } from './drive-json-safe';
import { buildDriveZipBufferFromFiles } from './drive-zip-export-build.ops';
import {
  buildDriveZipExportManifestPayload,
  type DriveZipManifestEntry,
} from './drive-zip-export-manifest.ops';
import { disambiguatedZipEntryPath } from './drive-zip-export-path.ops';
import {
  DRIVE_ZIP_EXPORT_AUDIT_ENTITY,
  DRIVE_ZIP_EXPORT_DISPATCH_ERROR_MESSAGE,
  DRIVE_ZIP_EXPORT_LIST_LIMIT,
  DRIVE_ZIP_EXPORT_MAX_ACTIVE_PER_USER,
  DRIVE_ZIP_EXPORT_MAX_FILES,
  DRIVE_ZIP_EXPORT_MAX_RAW_BYTES,
  DRIVE_ZIP_EXPORT_SYNC_FALLBACK_ENV,
} from './drive-zip-export.constants';

export interface DriveZipExportAccessSnapshot {
  departmentIds: string[];
  driveScope?: string | null;
  exportKind?: string;
  exportParams?: DriveZipExportParams;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((x) => typeof x === 'string');
}

function parseJobFileIds(raw: unknown): string[] {
  if (!isStringArray(raw)) return [];
  return raw;
}

function parseAccessSnapshot(raw: unknown): DriveZipExportAccessSnapshot {
  if (!raw || typeof raw !== 'object') {
    return { departmentIds: [], driveScope: null };
  }
  const o = raw as Record<string, unknown>;
  const departmentIds = Array.isArray(o.departmentIds)
    ? o.departmentIds.filter((x): x is string => typeof x === 'string')
    : [];
  const driveScope = typeof o.driveScope === 'string' ? o.driveScope : null;
  const exportKind = typeof o.exportKind === 'string' ? o.exportKind : undefined;
  const exportParams = parseDriveZipExportParams(o.exportParams);
  return { departmentIds, driveScope, exportKind, exportParams };
}

function snapshotToAccess(
  employeeId: string,
  snapshot: DriveZipExportAccessSnapshot,
): DriveEntityAccess {
  return {
    employeeId,
    departmentIds: snapshot.departmentIds,
    driveScope: snapshot.driveScope ?? undefined,
  };
}

function normalizeUniqueFileIds(fileIds: string[]): string[] {
  const unique = [...new Set(fileIds.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) {
    throw new BadRequestException('fileIds must include at least one id.');
  }
  if (unique.length > DRIVE_ZIP_EXPORT_MAX_FILES) {
    throw new BadRequestException(`At most ${DRIVE_ZIP_EXPORT_MAX_FILES} files per ZIP export.`);
  }
  return unique;
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught);
}

@Injectable()
export class DriveZipExportService {
  private readonly logger = new Logger(DriveZipExportService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly driveService: DriveService,
    private readonly typedExports: DriveTypedExportResolver,
    private readonly audit: AuditService,
    private readonly queue: DriveExportZipQueueService,
  ) {}

  async createZipExportJob(
    requestedById: string,
    input: {
      fileIds?: string[];
      exportKind?: string;
      exportParams?: unknown;
    },
    access: DriveEntityContextAccess,
  ) {
    const selectionIds = input.fileIds?.map((id) => id.trim()).filter(Boolean) ?? [];
    if (selectionIds.length === 0 && !input.exportKind?.trim()) {
      throw new BadRequestException('Provide fileIds or exportKind with exportParams.');
    }
    const exportKind = normalizeDriveZipExportKind(
      selectionIds.length > 0 ? 'drive.selection_zip' : input.exportKind,
    );
    let ids: string[];
    let exportParams: DriveZipExportParams = {};
    if (selectionIds.length > 0) {
      if (input.exportKind && input.exportKind !== 'drive.selection_zip') {
        throw new BadRequestException('Provide either fileIds or exportKind, not both.');
      }
      ids = normalizeUniqueFileIds(selectionIds);
    } else {
      const resolved = await this.typedExports.resolveFileIds(
        exportKind,
        input.exportParams,
        access,
      );
      ids = resolved.fileIds;
      exportParams = resolved.exportParams;
    }
    await this.assertUnderActiveJobCap(requestedById);
    const accessSnapshot: DriveZipExportAccessSnapshot = {
      departmentIds: [...access.departmentIds],
      driveScope: access.driveScope ?? null,
      exportKind,
      exportParams,
    };
    const job = await this.prisma.driveZipExportJob.create({
      data: {
        requestedById,
        fileIds: ids,
        accessSnapshot: accessSnapshot as unknown as InputJsonValue,
      },
    });
    await this.audit.log({
      entityType: DRIVE_ZIP_EXPORT_AUDIT_ENTITY,
      entityId: job.id,
      action: 'drive_zip_export.requested',
      userId: requestedById,
      changes: { fileCount: ids.length, exportKind },
    });
    try {
      await this.dispatchJob(job.id, requestedById);
    } catch (caught) {
      await this.failJob(job.id, requestedById, errorMessage(caught));
      throw caught;
    }
    return jsonSafeForHttp(job);
  }

  async listZipExportJobs(requestedById: string) {
    const rows = await this.prisma.driveZipExportJob.findMany({
      where: { requestedById },
      orderBy: { queuedAt: 'desc' },
      take: DRIVE_ZIP_EXPORT_LIST_LIMIT,
      include: { fileAsset: { select: { id: true, displayName: true, mimeType: true } } },
    });
    return jsonSafeForHttp(rows);
  }

  async getZipExportJob(jobId: string, requestedById: string) {
    const job = await this.prisma.driveZipExportJob.findFirst({
      where: { id: jobId, requestedById },
      include: { fileAsset: { select: { id: true, displayName: true, mimeType: true } } },
    });
    if (!job) throw new NotFoundException('ZIP export job was not found.');
    return jsonSafeForHttp(job);
  }

  async cancelZipExportJob(jobId: string, requestedById: string) {
    const job = await this.prisma.driveZipExportJob.findFirst({
      where: { id: jobId, requestedById },
    });
    if (!job) throw new NotFoundException('ZIP export job was not found.');
    if (job.status !== 'QUEUED') {
      throw new BadRequestException('Only queued export jobs can be cancelled.');
    }
    const updated = await this.prisma.driveZipExportJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED', errorMessage: 'cancelled_by_user' },
    });
    await this.audit.log({
      entityType: DRIVE_ZIP_EXPORT_AUDIT_ENTITY,
      entityId: jobId,
      action: 'drive_zip_export.cancelled',
      userId: requestedById,
    });
    return jsonSafeForHttp(updated);
  }

  async processZipExportJob(jobId: string, actorId: string): Promise<void> {
    const job = await this.prisma.driveZipExportJob.findUnique({ where: { id: jobId } });
    if (!job || job.requestedById !== actorId) {
      this.logger.warn(`drive_zip_export_skip: job ${jobId} missing or actor mismatch`);
      return;
    }
    if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
      return;
    }
    await this.prisma.driveZipExportJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', startedAt: new Date(), errorMessage: null },
    });
    try {
      const ids = parseJobFileIds(job.fileIds);
      const access = snapshotToAccess(job.requestedById, parseAccessSnapshot(job.accessSnapshot));
      const manifestEntries: DriveZipManifestEntry[] = [];
      const zipParts: { pathInZip: string; body: Buffer }[] = [];
      const counts = new Map<string, number>();
      let rawTotal = 0;
      for (const fileId of ids) {
        const row = await this.driveService.getFileAsset(fileId, access, ['EXPORT']);
        const packed = await this.driveService.fetchR2CurrentObjectBuffer(fileId, access, [
          'EXPORT',
        ]);
        if (!packed) {
          manifestEntries.push({
            fileId,
            exportPath: '',
            purpose: typeof row.purpose === 'string' ? row.purpose : null,
            skippedReason: 'not_r2_or_no_bytes',
          });
          continue;
        }
        rawTotal += packed.buffer.byteLength;
        if (rawTotal > DRIVE_ZIP_EXPORT_MAX_RAW_BYTES) {
          throw new BadRequestException(
            'Selected files exceed the maximum uncompressed size for one ZIP.',
          );
        }
        const exportPath = disambiguatedZipEntryPath(packed.displayName, fileId, counts);
        manifestEntries.push({
          fileId,
          exportPath,
          purpose: typeof row.purpose === 'string' ? row.purpose : null,
        });
        zipParts.push({ pathInZip: exportPath, body: packed.buffer });
      }
      if (zipParts.length === 0) {
        throw new BadRequestException('No R2-backed files could be included in the ZIP.');
      }
      const generatedAt = new Date().toISOString();
      const snapshot = parseAccessSnapshot(job.accessSnapshot);
      const manifestPayload = buildDriveZipExportManifestPayload({
        jobId,
        requesterId: actorId,
        generatedAt,
        exportKind: snapshot.exportKind,
        entries: manifestEntries,
      });
      const manifestJson = JSON.stringify(manifestPayload, null, 2);
      const zipBuffer = await buildDriveZipBufferFromFiles(manifestJson, zipParts);
      const checksum = createHash('sha256').update(zipBuffer).digest('hex');
      const stamp = generatedAt.slice(0, 10);
      const storageKey = `${R2_DRIVE_PREFIX}_exports/drive-zip/${stamp}__selection__${jobId}.zip`;
      const displayName = `nbos-drive-export-${stamp}-${jobId.slice(0, 8)}.zip`;
      const created = await this.driveService.createGeneratedFileAsset({
        displayName,
        fileType: 'ARCHIVE',
        purpose: 'OTHER',
        sourceModule: 'DRIVE',
        createdById: actorId,
        visibility: 'RESTRICTED',
        confidentiality: 'CONFIDENTIAL',
        storageKey,
        content: zipBuffer,
        contentType: 'application/zip',
        mimeType: 'application/zip',
        checksum,
        link: {
          entityType: DRIVE_ZIP_EXPORT_AUDIT_ENTITY,
          entityId: jobId,
          linkType: 'OTHER',
          linkedById: actorId,
        },
      });
      const out = created as { id?: string };
      if (!out.id) {
        throw new BadRequestException('ZIP output file was not created.');
      }
      await this.completeJob(jobId, actorId, out.id);
    } catch (caught) {
      await this.failJob(jobId, actorId, errorMessage(caught));
    }
  }

  private async assertUnderActiveJobCap(requestedById: string) {
    const active = await this.prisma.driveZipExportJob.count({
      where: {
        requestedById,
        status: { in: ['QUEUED', 'PROCESSING'] },
      },
    });
    if (active >= DRIVE_ZIP_EXPORT_MAX_ACTIVE_PER_USER) {
      throw new ForbiddenException(
        `You already have ${DRIVE_ZIP_EXPORT_MAX_ACTIVE_PER_USER} Drive ZIP exports in progress. Wait for them to finish.`,
      );
    }
  }

  private async dispatchJob(jobId: string, actorId: string) {
    if (await this.queue.enqueue({ jobId, actorId })) return;
    if (process.env[DRIVE_ZIP_EXPORT_SYNC_FALLBACK_ENV] === 'true') {
      void this.processZipExportJob(jobId, actorId);
      return;
    }
    throw new ServiceUnavailableException(DRIVE_ZIP_EXPORT_DISPATCH_ERROR_MESSAGE);
  }

  private async completeJob(jobId: string, actorId: string, fileAssetId: string) {
    await this.prisma.driveZipExportJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        fileAssetId,
        completedAt: new Date(),
        errorMessage: null,
      },
    });
    await this.audit.log({
      entityType: DRIVE_ZIP_EXPORT_AUDIT_ENTITY,
      entityId: jobId,
      action: 'drive_zip_export.completed',
      userId: actorId,
      changes: { fileAssetId },
    });
  }

  private async failJob(jobId: string, actorId: string, message: string) {
    this.logger.warn(`drive_zip_export_failed job=${jobId}: ${message}`);
    await this.prisma.driveZipExportJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', failedAt: new Date(), errorMessage: message },
    });
    await this.audit.log({
      entityType: DRIVE_ZIP_EXPORT_AUDIT_ENTITY,
      entityId: jobId,
      action: 'drive_zip_export.failed',
      userId: actorId,
      changes: { errorMessage: message },
    });
  }
}
