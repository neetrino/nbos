import { WALLPAPER_SLOTS, type WallpaperSlot } from './constants';

export function isWallpaperSlot(value: string): value is WallpaperSlot {
  return (WALLPAPER_SLOTS as readonly string[]).includes(value);
}

export function parseWallpaperSlot(value: string): WallpaperSlot | null {
  return isWallpaperSlot(value) ? value : null;
}
