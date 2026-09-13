import { isSafeWallpaperPublicUrl } from '@nbos/shared';
import type { PlatformAppearanceView } from './types';

const WALLPAPER_CANVAS_SELECTOR = '.nbos-app-canvas';
const WALLPAPER_DARK_CANVAS_SELECTOR = '.dark .nbos-app-canvas';

export function wallpaperImageLayer(url: string | null | undefined): string {
  if (!url || !isSafeWallpaperPublicUrl(url)) return 'none';
  return `linear-gradient(var(--nbos-wallpaper-wash), var(--nbos-wallpaper-wash)), url("${url}")`;
}

export function buildWallpaperStyleText(appearance: PlatformAppearanceView | null): string {
  const light = wallpaperImageLayer(appearance?.light?.url);
  const dark = wallpaperImageLayer(appearance?.dark?.url);
  return `${WALLPAPER_CANVAS_SELECTOR}{--nbos-wallpaper-image:${light}}${WALLPAPER_DARK_CANVAS_SELECTOR}{--nbos-wallpaper-image:${dark}}`;
}
