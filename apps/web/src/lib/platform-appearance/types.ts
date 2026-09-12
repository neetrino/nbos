import type { WallpaperSlot } from '@nbos/shared';

export type WallpaperSlotView = {
  slot: WallpaperSlot;
  version: number;
  url: string;
  originalFileName: string;
  bytes: number;
  width: number;
  height: number;
};

export type PlatformAppearanceView = {
  light: WallpaperSlotView | null;
  dark: WallpaperSlotView | null;
};
