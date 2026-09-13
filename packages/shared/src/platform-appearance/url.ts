import { WALLPAPER_PUBLIC_PATH_PREFIX, type WallpaperSlot } from './constants';
import { isWallpaperSlot } from './slots';

const WALLPAPER_URL_PATTERN = new RegExp(
  `^${WALLPAPER_PUBLIC_PATH_PREFIX.replaceAll('/', '\\/')}\\/(light|dark)\\?v=\\d+$`,
);

export function buildWallpaperPublicUrl(slot: WallpaperSlot, version: number): string {
  return `${WALLPAPER_PUBLIC_PATH_PREFIX}/${slot}?v=${version}`;
}

export function isSafeWallpaperPublicUrl(url: string): boolean {
  if (!WALLPAPER_URL_PATTERN.test(url)) return false;
  const slot = url.slice(WALLPAPER_PUBLIC_PATH_PREFIX.length + 1).split('?')[0];
  return isWallpaperSlot(slot ?? '');
}
