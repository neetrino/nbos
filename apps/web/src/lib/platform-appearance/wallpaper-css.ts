import { isSafeWallpaperPublicUrl } from '@nbos/shared';
import type { PlatformAppearanceView } from './types';

export function wallpaperImageLayer(url: string | null | undefined): string {
  if (!url || !isSafeWallpaperPublicUrl(url)) return 'none';
  return `linear-gradient(var(--nbos-wallpaper-wash), var(--nbos-wallpaper-wash)), url("${url}")`;
}

export function buildWallpaperStyleText(appearance: PlatformAppearanceView | null): string {
  const light = wallpaperImageLayer(appearance?.light?.url);
  const dark = wallpaperImageLayer(appearance?.dark?.url);
  return `:root{--nbos-wallpaper-image:${light}}.dark{--nbos-wallpaper-image:${dark}}`;
}
