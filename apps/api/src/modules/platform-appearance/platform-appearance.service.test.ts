import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlatformAppearanceService } from './platform-appearance.service';

const EMPTY_ROW = {
  id: 'default',
  lightStorageKey: null,
  lightVersion: 0,
  lightOriginalFileName: null,
  lightBytes: null,
  lightWidth: null,
  lightHeight: null,
  darkStorageKey: null,
  darkVersion: 0,
  darkOriginalFileName: null,
  darkBytes: null,
  darkWidth: null,
  darkHeight: null,
};

function buildVp8x(width: number, height: number): Uint8Array {
  const payload = Buffer.alloc(10);
  writeU24Le(payload, 4, width - 1);
  writeU24Le(payload, 7, height - 1);
  const chunk = Buffer.alloc(18);
  chunk.write('VP8X', 0, 'ascii');
  chunk.writeUInt32LE(10, 4);
  payload.copy(chunk, 8);
  const body = Buffer.alloc(12 + chunk.length);
  body.write('RIFF', 0, 'ascii');
  body.writeUInt32LE(body.length - 8, 4);
  body.write('WEBP', 8, 'ascii');
  chunk.copy(body, 12);
  return body;
}

function writeU24Le(target: Buffer, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >> 8) & 0xff;
  target[offset + 2] = (value >> 16) & 0xff;
}

describe('PlatformAppearanceService', () => {
  const prisma = {
    platformAppearance: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
  };
  const storage = {
    buildKey: vi.fn((slot: string, version: number) => `key-${slot}-${version}`),
    putWallpaper: vi.fn(),
    getWallpaper: vi.fn(),
    deleteWallpaper: vi.fn(),
  };

  beforeEach(() => {
    prisma.platformAppearance.upsert.mockReset();
    prisma.platformAppearance.update.mockReset();
    storage.putWallpaper.mockReset();
    storage.getWallpaper.mockReset();
    storage.deleteWallpaper.mockReset();
    prisma.platformAppearance.upsert.mockResolvedValue(EMPTY_ROW);
  });

  it('uploads a valid still WebP and replaces the previous key', async () => {
    const uploaded = {
      ...EMPTY_ROW,
      lightStorageKey: 'key-light-1',
      lightVersion: 1,
      lightOriginalFileName: 'desk.webp',
      lightBytes: 30,
      lightWidth: 1920,
      lightHeight: 1280,
    };
    prisma.platformAppearance.upsert.mockResolvedValue({
      ...EMPTY_ROW,
      lightStorageKey: 'old-key',
      lightVersion: 0,
    });
    prisma.platformAppearance.update.mockResolvedValue(uploaded);
    const service = new PlatformAppearanceService(prisma as never, storage as never);
    const view = await service.uploadWallpaper(
      'light',
      { originalName: 'desk.webp', mimeType: 'image/webp', bytes: buildVp8x(1920, 1280) },
      'emp-1',
    );
    expect(storage.putWallpaper).toHaveBeenCalled();
    expect(storage.deleteWallpaper).toHaveBeenCalledWith('old-key');
    expect(view.light?.url).toBe('/api/v1/platform/appearance/wallpaper/light?v=1');
  });

  it('keeps a successful write if cleanup of the old key fails', async () => {
    prisma.platformAppearance.upsert.mockResolvedValue({
      ...EMPTY_ROW,
      lightStorageKey: 'old-key',
      lightVersion: 0,
    });
    prisma.platformAppearance.update.mockResolvedValue({
      ...EMPTY_ROW,
      lightStorageKey: 'key-light-1',
      lightVersion: 1,
      lightOriginalFileName: 'desk.webp',
      lightBytes: 30,
      lightWidth: 1920,
      lightHeight: 1280,
    });
    storage.deleteWallpaper.mockRejectedValue(new Error('r2 unavailable'));
    const service = new PlatformAppearanceService(prisma as never, storage as never);
    const view = await service.uploadWallpaper(
      'light',
      { originalName: 'desk.webp', mimeType: 'image/webp', bytes: buildVp8x(1920, 1280) },
      'emp-1',
    );
    expect(view.light?.version).toBe(1);
  });

  it('rejects a missing wallpaper file on read', async () => {
    const service = new PlatformAppearanceService(prisma as never, storage as never);
    await expect(service.readWallpaperBytes('dark')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an invalid upload before writing storage', async () => {
    const service = new PlatformAppearanceService(prisma as never, storage as never);
    await expect(
      service.uploadWallpaper(
        'light',
        { originalName: 'desk.jpg', mimeType: 'image/jpeg', bytes: buildVp8x(1920, 1280) },
        'emp-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.putWallpaper).not.toHaveBeenCalled();
  });
});
