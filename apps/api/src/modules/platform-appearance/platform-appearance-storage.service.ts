import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { WALLPAPER_CACHE_CONTROL, WALLPAPER_MIME, type WallpaperSlot } from '@nbos/shared';
import { DriveR2Client } from '../drive/drive-r2.client';

@Injectable()
export class PlatformAppearanceStorageService {
  constructor(private readonly r2: DriveR2Client) {}

  buildKey(slot: WallpaperSlot, version: number): string {
    return `nbos/platform/chrome/wallpaper-${slot}-v${version}.webp`;
  }

  async putWallpaper(key: string, body: Uint8Array): Promise<void> {
    try {
      await this.r2.ensureS3().send(
        new PutObjectCommand({
          Bucket: this.r2.bucket,
          Key: key,
          Body: body,
          ContentType: WALLPAPER_MIME,
          CacheControl: WALLPAPER_CACHE_CONTROL,
        }),
      );
    } catch (error) {
      this.rethrowStorage(error, 'Wallpaper storage is not configured.');
    }
  }

  async getWallpaper(key: string): Promise<Buffer> {
    try {
      const response = await this.r2.ensureS3().send(
        new GetObjectCommand({
          Bucket: this.r2.bucket,
          Key: key,
        }),
      );
      const payload = await response.Body?.transformToByteArray();
      if (!payload?.byteLength) {
        throw new NotFoundException('Wallpaper file was not found.');
      }
      return Buffer.from(payload);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (isMissingObject(error)) {
        throw new NotFoundException('Wallpaper file was not found.');
      }
      this.rethrowStorage(error, 'Wallpaper storage is not configured.');
    }
  }

  async deleteWallpaper(key: string): Promise<void> {
    try {
      await this.r2.ensureS3().send(
        new DeleteObjectCommand({
          Bucket: this.r2.bucket,
          Key: key,
        }),
      );
    } catch (error) {
      this.rethrowStorage(error, 'Wallpaper storage is not configured.');
    }
  }

  private rethrowStorage(error: unknown, message: string): never {
    if (error instanceof NotFoundException) {
      throw new ServiceUnavailableException(message);
    }
    throw error;
  }
}

function isMissingObject(error: unknown): boolean {
  const name = error instanceof Error ? error.name : '';
  if (name === 'NotFound' || name === 'NoSuchKey') return true;
  const http = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
  return http === 404;
}
