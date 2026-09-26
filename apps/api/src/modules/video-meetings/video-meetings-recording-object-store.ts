import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  R2_ACCESS_KEY_ID_ENV,
  R2_ACCOUNT_ID_ENV,
  R2_BUCKET_NAME_ENV,
  R2_SECRET_ACCESS_KEY_ENV,
  VIDEO_MEETINGS_RECORDING_STORAGE_ACCESS_KEY_ENV,
  VIDEO_MEETINGS_RECORDING_STORAGE_BUCKET_ENV,
  VIDEO_MEETINGS_RECORDING_STORAGE_ENDPOINT_ENV,
  VIDEO_MEETINGS_RECORDING_STORAGE_REGION_ENV,
  VIDEO_MEETINGS_RECORDING_STORAGE_SECRET_ENV,
} from './video-meetings-recording.constants';
import type {
  VideoMeetingObjectHeadResult,
  VideoMeetingsRecordingObjectStore,
  VideoMeetingsRecordingS3Config,
} from './video-meetings-egress.types';

/**
 * Private recording destination: dedicated S3-compatible env, or Drive R2 fallback.
 * S06 Drive finalize verifies via DriveArtifactStorageAdapter (same R2 bucket).
 * Prefer R2_* (or the same bucket as Drive) so egress keys are finalizable.
 */
@Injectable()
export class VideoMeetingsRecordingObjectStoreService implements VideoMeetingsRecordingObjectStore {
  private readonly logger = new Logger(VideoMeetingsRecordingObjectStoreService.name);
  private client: S3Client | null = null;
  private configCache: VideoMeetingsRecordingS3Config | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return this.readConfig() != null;
  }

  getS3Config(): VideoMeetingsRecordingS3Config {
    const cfg = this.readConfig();
    if (!cfg) {
      throw new Error('Recording object store is not configured');
    }
    return cfg;
  }

  async headObject(objectKey: string): Promise<VideoMeetingObjectHeadResult> {
    const cfg = this.readConfig();
    if (!cfg) {
      return { exists: false, sizeBytes: 0 };
    }
    try {
      const result = await this.getClient(cfg).send(
        new HeadObjectCommand({ Bucket: cfg.bucket, Key: objectKey }),
      );
      const sizeBytes = Number(result.ContentLength ?? 0);
      return { exists: true, sizeBytes };
    } catch (error) {
      this.logger.warn(`HeadObject failed for recording key (not READY): ${String(error)}`);
      return { exists: false, sizeBytes: 0 };
    }
  }

  private getClient(cfg: VideoMeetingsRecordingS3Config): S3Client {
    if (this.client) return this.client;
    this.client = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      forcePathStyle: cfg.forcePathStyle,
      credentials: {
        accessKeyId: cfg.accessKey,
        secretAccessKey: cfg.secret,
      },
    });
    return this.client;
  }

  private readConfig(): VideoMeetingsRecordingS3Config | null {
    if (this.configCache) return this.configCache;
    const dedicated = this.readDedicatedS3();
    if (dedicated) {
      this.configCache = dedicated;
      return dedicated;
    }
    const r2 = this.readR2Fallback();
    if (r2) {
      this.configCache = r2;
      return r2;
    }
    return null;
  }

  private readDedicatedS3(): VideoMeetingsRecordingS3Config | null {
    const endpoint = this.config.get<string>(VIDEO_MEETINGS_RECORDING_STORAGE_ENDPOINT_ENV)?.trim();
    const bucket = this.config.get<string>(VIDEO_MEETINGS_RECORDING_STORAGE_BUCKET_ENV)?.trim();
    const accessKey = this.config
      .get<string>(VIDEO_MEETINGS_RECORDING_STORAGE_ACCESS_KEY_ENV)
      ?.trim();
    const secret = this.config.get<string>(VIDEO_MEETINGS_RECORDING_STORAGE_SECRET_ENV)?.trim();
    if (!endpoint || !bucket || !accessKey || !secret) return null;
    const region =
      this.config.get<string>(VIDEO_MEETINGS_RECORDING_STORAGE_REGION_ENV)?.trim() || 'auto';
    return {
      accessKey,
      secret,
      bucket,
      endpoint,
      region,
      forcePathStyle: true,
    };
  }

  private readR2Fallback(): VideoMeetingsRecordingS3Config | null {
    const accountId = this.config.get<string>(R2_ACCOUNT_ID_ENV)?.trim();
    const accessKey = this.config.get<string>(R2_ACCESS_KEY_ID_ENV)?.trim();
    const secret = this.config.get<string>(R2_SECRET_ACCESS_KEY_ENV)?.trim();
    const bucket = this.config.get<string>(R2_BUCKET_NAME_ENV)?.trim();
    if (!accountId || !accessKey || !secret || !bucket) return null;
    return {
      accessKey,
      secret,
      bucket,
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      region: 'auto',
      forcePathStyle: true,
    };
  }
}
