import { buildWallpaperPublicUrl, type WallpaperSlot } from '@nbos/shared';
import type { PlatformAppearanceView, WallpaperSlotView } from './platform-appearance.types';

export type AppearanceRow = {
  lightStorageKey: string | null;
  lightVersion: number;
  lightOriginalFileName: string | null;
  lightBytes: number | null;
  lightWidth: number | null;
  lightHeight: number | null;
  darkStorageKey: string | null;
  darkVersion: number;
  darkOriginalFileName: string | null;
  darkBytes: number | null;
  darkWidth: number | null;
  darkHeight: number | null;
};

export function mapAppearanceView(row: AppearanceRow): PlatformAppearanceView {
  return {
    light: mapSlotView('light', row),
    dark: mapSlotView('dark', row),
  };
}

function mapSlotView(slot: WallpaperSlot, row: AppearanceRow): WallpaperSlotView | null {
  const key = slot === 'light' ? row.lightStorageKey : row.darkStorageKey;
  const version = slot === 'light' ? row.lightVersion : row.darkVersion;
  const originalFileName = slot === 'light' ? row.lightOriginalFileName : row.darkOriginalFileName;
  const bytes = slot === 'light' ? row.lightBytes : row.darkBytes;
  const width = slot === 'light' ? row.lightWidth : row.darkWidth;
  const height = slot === 'light' ? row.lightHeight : row.darkHeight;
  if (!key || version < 1 || !originalFileName || !bytes || !width || !height) {
    return null;
  }
  return {
    slot,
    version,
    url: buildWallpaperPublicUrl(slot, version),
    originalFileName,
    bytes,
    width,
    height,
  };
}

export function slotStorageKey(row: AppearanceRow, slot: WallpaperSlot): string | null {
  return slot === 'light' ? row.lightStorageKey : row.darkStorageKey;
}
