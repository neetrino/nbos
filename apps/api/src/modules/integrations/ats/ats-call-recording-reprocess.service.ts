import { CopyObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { DriveR2Client } from '../../drive/drive-r2.client';
import {
  ATS_RECORDING_MIME_SNIFF_BYTES,
  recordingExtensionForMime,
  sniffAudioMime,
} from './ats-recording-mime';

const RECORDING_SELECT = {
  id: true,
  recordingStatus: true,
  recordingFileAssetId: true,
} as const;

const ASSET_SELECT = {
  id: true,
  displayName: true,
  originalName: true,
  mimeType: true,
  storageKey: true,
  purpose: true,
} as const;

export type RecordingMimeRepairResult =
  | { status: 'skipped'; reason: string }
  | { status: 'repaired'; mimeType: string };

@Injectable()
export class AtsCallRecordingReprocessService {
  private readonly logger = new Logger(AtsCallRecordingReprocessService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly r2: DriveR2Client,
  ) {}

  async repairStoredRecording(callId: string): Promise<RecordingMimeRepairResult> {
    const call = await this.prisma.atsCallEvent.findUnique({
      where: { id: callId },
      select: RECORDING_SELECT,
    });
    if (!call || call.recordingStatus !== 'READY' || !call.recordingFileAssetId) {
      return { status: 'skipped', reason: 'not_ready' };
    }
    const asset = await this.prisma.fileAsset.findFirst({
      where: { id: call.recordingFileAssetId, deletedAt: null, purpose: 'CALL_RECORDING' },
      select: ASSET_SELECT,
    });
    if (!asset?.storageKey) {
      return { status: 'skipped', reason: 'missing_asset' };
    }
    return this.repairAssetMetadata({
      id: asset.id,
      displayName: asset.displayName,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      storageKey: asset.storageKey,
    });
  }

  private async repairAssetMetadata(asset: {
    id: string;
    displayName: string;
    originalName: string | null;
    mimeType: string | null;
    storageKey: string;
  }): Promise<RecordingMimeRepairResult> {
    const prefix = await this.readPrefix(asset.storageKey);
    const sniffed = sniffAudioMime(prefix);
    if (!sniffed) {
      return { status: 'skipped', reason: 'unrecognized_media' };
    }
    const ext = recordingExtensionForMime(sniffed);
    const displayName = replaceNameExtension(asset.displayName, ext);
    const originalName = replaceNameExtension(asset.originalName ?? asset.displayName, ext);
    if (asset.mimeType === sniffed && asset.displayName === displayName) {
      return { status: 'skipped', reason: 'already_current' };
    }
    await this.replaceObjectContentType(asset.storageKey, sniffed);
    await this.prisma.fileAsset.update({
      where: { id: asset.id },
      data: { mimeType: sniffed, displayName, originalName },
    });
    this.logger.log({ event: 'ats_recording_mime_repaired', fileAssetId: asset.id, mimeType: sniffed });
    return { status: 'repaired', mimeType: sniffed };
  }

  private async readPrefix(storageKey: string): Promise<Uint8Array> {
    const object = await this.r2.ensureS3().send(
      new GetObjectCommand({
        Bucket: this.r2.bucket,
        Key: storageKey,
        Range: `bytes=0-${ATS_RECORDING_MIME_SNIFF_BYTES - 1}`,
      }),
    );
    const chunks: Buffer[] = [];
    if (object.Body) {
      for await (const chunk of object.Body as AsyncIterable<Buffer>) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
    }
    return new Uint8Array(Buffer.concat(chunks).subarray(0, ATS_RECORDING_MIME_SNIFF_BYTES));
  }

  private async replaceObjectContentType(storageKey: string, mimeType: string): Promise<void> {
    await this.r2.ensureS3().send(
      new CopyObjectCommand({
        Bucket: this.r2.bucket,
        Key: storageKey,
        CopySource: `${this.r2.bucket}/${encodeURIComponent(storageKey)}`,
        ContentType: mimeType,
        MetadataDirective: 'REPLACE',
      }),
    );
  }
}

export function replaceNameExtension(name: string, ext: string): string {
  const trimmed = name.trim();
  if (!trimmed) return `recording${ext}`;
  const dot = trimmed.lastIndexOf('.');
  const base = dot > 0 ? trimmed.slice(0, dot) : trimmed;
  return `${base}${ext}`;
}
