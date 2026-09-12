import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PLATFORM_APPEARANCE_ID, type WallpaperSlot } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import { mapAppearanceView, slotStorageKey } from './platform-appearance-map';
import { PlatformAppearanceStorageService } from './platform-appearance-storage.service';
import type { ValidatedWallpaper } from './platform-appearance-validate';
import { validateWallpaperUpload } from './platform-appearance-validate';
import type { PlatformAppearanceView } from './platform-appearance.types';

@Injectable()
export class PlatformAppearanceService {
  private readonly logger = new Logger(PlatformAppearanceService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly storage: PlatformAppearanceStorageService,
  ) {}

  async getAppearance(): Promise<PlatformAppearanceView> {
    return mapAppearanceView(await this.ensureRow());
  }

  async uploadWallpaper(
    slot: WallpaperSlot,
    file: { originalName: string; mimeType: string; bytes: Uint8Array },
    actorId: string,
  ): Promise<PlatformAppearanceView> {
    const wallpaper = validateWallpaperUpload(file);
    const current = await this.ensureRow();
    const nextVersion = (slot === 'light' ? current.lightVersion : current.darkVersion) + 1;
    const nextKey = this.storage.buildKey(slot, nextVersion);
    await this.storage.putWallpaper(nextKey, wallpaper.bytes);
    const updated = await this.prisma.platformAppearance.update({
      where: { id: PLATFORM_APPEARANCE_ID },
      data: slotWriteData(slot, nextKey, nextVersion, wallpaper, actorId),
    });
    await this.deleteReplacedKey(slotStorageKey(current, slot));
    return mapAppearanceView(updated);
  }

  async clearWallpaper(slot: WallpaperSlot, actorId: string): Promise<PlatformAppearanceView> {
    const current = await this.ensureRow();
    const previousKey = slotStorageKey(current, slot);
    const updated = await this.prisma.platformAppearance.update({
      where: { id: PLATFORM_APPEARANCE_ID },
      data: slotClearData(slot, actorId),
    });
    await this.deleteReplacedKey(previousKey);
    return mapAppearanceView(updated);
  }

  async readWallpaperBytes(slot: WallpaperSlot): Promise<Buffer> {
    const key = slotStorageKey(await this.ensureRow(), slot);
    if (!key) {
      throw new NotFoundException('Wallpaper is not set.');
    }
    return this.storage.getWallpaper(key);
  }

  private async ensureRow() {
    return this.prisma.platformAppearance.upsert({
      where: { id: PLATFORM_APPEARANCE_ID },
      create: { id: PLATFORM_APPEARANCE_ID },
      update: {},
    });
  }

  private async deleteReplacedKey(key: string | null): Promise<void> {
    if (!key) return;
    try {
      await this.storage.deleteWallpaper(key);
    } catch (error) {
      this.logger.warn(
        `Superseded wallpaper ${key} was left in storage after a successful write.`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

function slotWriteData(
  slot: WallpaperSlot,
  storageKey: string,
  version: number,
  wallpaper: ValidatedWallpaper,
  actorId: string,
) {
  const shared = { updatedByEmployeeId: actorId };
  if (slot === 'light') {
    return {
      ...shared,
      lightStorageKey: storageKey,
      lightVersion: version,
      lightOriginalFileName: wallpaper.originalName,
      lightBytes: wallpaper.bytes.byteLength,
      lightWidth: wallpaper.width,
      lightHeight: wallpaper.height,
    };
  }
  return {
    ...shared,
    darkStorageKey: storageKey,
    darkVersion: version,
    darkOriginalFileName: wallpaper.originalName,
    darkBytes: wallpaper.bytes.byteLength,
    darkWidth: wallpaper.width,
    darkHeight: wallpaper.height,
  };
}

function slotClearData(slot: WallpaperSlot, actorId: string) {
  const shared = { updatedByEmployeeId: actorId };
  if (slot === 'light') {
    return {
      ...shared,
      lightStorageKey: null,
      lightOriginalFileName: null,
      lightBytes: null,
      lightWidth: null,
      lightHeight: null,
    };
  }
  return {
    ...shared,
    darkStorageKey: null,
    darkOriginalFileName: null,
    darkBytes: null,
    darkWidth: null,
    darkHeight: null,
  };
}
