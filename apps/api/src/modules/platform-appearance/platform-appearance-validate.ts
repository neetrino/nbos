import { BadRequestException } from '@nestjs/common';
import {
  MAX_WALLPAPER_BYTES,
  MAX_WALLPAPER_EDGE_PX,
  MIN_WALLPAPER_EDGE_PX,
  WALLPAPER_EXTENSION,
  WALLPAPER_MIME,
} from '@nbos/shared';
import { sniffWebpImage, type WebpImageSize } from './platform-appearance-webp';

export type WallpaperUploadInput = {
  originalName: string;
  mimeType: string;
  bytes: Uint8Array;
};

export type ValidatedWallpaper = WebpImageSize & {
  bytes: Uint8Array;
  originalName: string;
};

export function validateWallpaperUpload(input: WallpaperUploadInput): ValidatedWallpaper {
  assertWebpFileName(input.originalName);
  if (input.mimeType !== WALLPAPER_MIME) {
    throw new BadRequestException('Wallpaper must be image/webp.');
  }
  if (input.bytes.byteLength === 0 || input.bytes.byteLength > MAX_WALLPAPER_BYTES) {
    throw new BadRequestException(
      `Wallpaper must be between 1 byte and ${MAX_WALLPAPER_BYTES} bytes.`,
    );
  }
  const size = sniffWebpImage(input.bytes);
  if (!size) {
    throw new BadRequestException('File is not a valid WebP image.');
  }
  if (size.animated) {
    throw new BadRequestException('Animated WebP is not allowed.');
  }
  assertWallpaperEdges(size.width, size.height);
  return { ...size, bytes: input.bytes, originalName: input.originalName };
}

function assertWebpFileName(fileName: string): void {
  if (!fileName.toLowerCase().endsWith(WALLPAPER_EXTENSION)) {
    throw new BadRequestException('Wallpaper file name must end with .webp.');
  }
}

function assertWallpaperEdges(width: number, height: number): void {
  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);
  if (longEdge > MAX_WALLPAPER_EDGE_PX) {
    throw new BadRequestException(
      `Wallpaper long edge must be at most ${MAX_WALLPAPER_EDGE_PX}px.`,
    );
  }
  if (shortEdge < MIN_WALLPAPER_EDGE_PX) {
    throw new BadRequestException(
      `Wallpaper short edge must be at least ${MIN_WALLPAPER_EDGE_PX}px.`,
    );
  }
}
