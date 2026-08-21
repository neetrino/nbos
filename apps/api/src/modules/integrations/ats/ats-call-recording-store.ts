import { createReadStream } from 'node:fs';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import type { ConfigService } from '@nestjs/config';
import type { PrismaClient } from '@nbos/database';
import { DriveR2Client } from '../../drive/drive-r2.client';
import { DriveService } from '../../drive/drive.service';
import { resolveStorageHomeContextWithPurpose } from '../../drive/drive-storage-home-resolver';
import { buildStorageHomeKey } from '../../drive/drive-storage-home-path';
import { readTenantOrganizationId } from '../../drive/drive-tenant';
import { sanitizeUploadBaseName } from '../../drive/drive-upload-path';
import {
  ATS_CALL_RECORDING_ENTITY_CALL,
  ATS_CALL_RECORDING_FILE_LINK_TYPE,
  ATS_CALL_RECORDING_SOURCE_MODULE,
} from './ats-call-recording.constants';
import { recordingExtensionForMime } from './ats-call-recording-http';
import type { AtsRecordingDownloadResult } from './ats-call-record.client';

type PrismaLike = InstanceType<typeof PrismaClient>;

export interface AtsCallRecordingStoreCall {
  id: string;
  uid: string;
  leadId: string | null;
  contactId: string | null;
  answeredEmployeeId: string | null;
  responsibleEmployeeId: string | null;
}

export async function storeAtsCallRecording(params: {
  prisma: PrismaLike;
  drive: DriveService;
  r2: DriveR2Client;
  config: ConfigService;
  call: AtsCallRecordingStoreCall;
  download: AtsRecordingDownloadResult;
}): Promise<string> {
  const existingId = await findExistingRecordingAssetId(params.prisma, params.call.id);
  if (existingId) {
    await ensureRecordingLinks(params.prisma, existingId, params.call);
    return existingId;
  }

  const storageKey = await buildRecordingStorageKey(params);
  const reused = await findAssetByStorageKey(params.prisma, storageKey);
  if (reused) {
    await ensureRecordingLinks(params.prisma, reused, params.call);
    return reused;
  }

  return createRecordingFileAsset(params, storageKey);
}

async function createRecordingFileAsset(
  params: {
    prisma: PrismaLike;
    drive: DriveService;
    r2: DriveR2Client;
    call: AtsCallRecordingStoreCall;
    download: AtsRecordingDownloadResult;
  },
  storageKey: string,
): Promise<string> {
  const mimeType = params.download.mimeType;
  const displayName = `call-${sanitizeUploadBaseName(params.call.uid)}-recording${recordingExtensionForMime(mimeType)}`;
  await params.r2.ensureS3().send(
    new PutObjectCommand({
      Bucket: params.r2.bucket,
      Key: storageKey,
      Body: createReadStream(params.download.tmpPath),
      ContentLength: params.download.sizeBytes,
      ContentType: mimeType,
    }),
  );

  const ownerId = params.call.answeredEmployeeId ?? params.call.responsibleEmployeeId ?? undefined;
  const created = await params.drive.createFileAsset({
    displayName,
    originalName: displayName,
    fileType: 'AUDIO',
    purpose: 'CALL_RECORDING',
    sourceModule: ATS_CALL_RECORDING_SOURCE_MODULE,
    ownerId,
    createdById: ownerId,
    visibility: 'RESTRICTED',
    confidentiality: 'CONFIDENTIAL',
    storageKey,
    mimeType,
    checksum: params.download.checksum,
    sizeBytes: params.download.sizeBytes,
    link: {
      entityType: ATS_CALL_RECORDING_ENTITY_CALL,
      entityId: params.call.id,
      linkType: ATS_CALL_RECORDING_FILE_LINK_TYPE,
      purposeOverride: 'CALL_RECORDING',
      isPrimary: true,
      linkedById: ownerId,
    },
  });
  const fileAssetId = (created as { id?: string }).id;
  if (!fileAssetId) {
    throw new Error('Drive FileAsset was not created for call recording');
  }
  await ensureRecordingLinks(params.prisma, fileAssetId, params.call);
  return fileAssetId;
}

async function buildRecordingStorageKey(params: {
  prisma: PrismaLike;
  config: ConfigService;
  call: AtsCallRecordingStoreCall;
  download: AtsRecordingDownloadResult;
}): Promise<string> {
  const orgId = readTenantOrganizationId(params.config);
  const ext = recordingExtensionForMime(params.download.mimeType);
  const fileName = sanitizeUploadBaseName(`call-${params.call.uid}-recording${ext}`);
  const context = await resolveRecordingContextPath(params.prisma, params.call);
  return buildStorageHomeKey(orgId, context, fileName);
}

async function resolveRecordingContextPath(
  prisma: PrismaLike,
  call: AtsCallRecordingStoreCall,
): Promise<string> {
  if (call.leadId) {
    return resolveStorageHomeContextWithPurpose(prisma, 'LEAD', call.leadId, 'CALL_RECORDING');
  }
  if (call.contactId) {
    return resolveStorageHomeContextWithPurpose(
      prisma,
      'CONTACT',
      call.contactId,
      'CALL_RECORDING',
    );
  }
  return `ats/calls/${call.id.slice(0, 8)}/recordings`;
}

async function findExistingRecordingAssetId(
  prisma: PrismaLike,
  callId: string,
): Promise<string | null> {
  const link = await prisma.fileLink.findFirst({
    where: {
      entityType: ATS_CALL_RECORDING_ENTITY_CALL,
      entityId: callId,
      unlinkedAt: null,
      fileAsset: { deletedAt: null, purpose: 'CALL_RECORDING' },
    },
    select: { fileAssetId: true },
  });
  return link?.fileAssetId ?? null;
}

async function findAssetByStorageKey(
  prisma: PrismaLike,
  storageKey: string,
): Promise<string | null> {
  const asset = await prisma.fileAsset.findFirst({
    where: { storageKey, purpose: 'CALL_RECORDING', deletedAt: null },
    select: { id: true },
  });
  return asset?.id ?? null;
}

async function ensureRecordingLinks(
  prisma: PrismaLike,
  fileAssetId: string,
  call: AtsCallRecordingStoreCall,
): Promise<void> {
  await ensureSingleLink(prisma, fileAssetId, ATS_CALL_RECORDING_ENTITY_CALL, call.id, true);
  if (call.leadId) {
    await ensureSingleLink(prisma, fileAssetId, 'LEAD', call.leadId, false);
  }
  if (call.contactId) {
    await ensureSingleLink(prisma, fileAssetId, 'CONTACT', call.contactId, false);
  }
}

async function ensureSingleLink(
  prisma: PrismaLike,
  fileAssetId: string,
  entityType: string,
  entityId: string,
  isPrimary: boolean,
): Promise<void> {
  const existing = await prisma.fileLink.findFirst({
    where: { fileAssetId, entityType, entityId, unlinkedAt: null },
    select: { id: true },
  });
  if (existing) return;
  await prisma.fileLink.create({
    data: {
      fileAssetId,
      entityType,
      entityId,
      linkType: ATS_CALL_RECORDING_FILE_LINK_TYPE,
      purposeOverride: 'CALL_RECORDING',
      isPrimary,
    },
  });
}
