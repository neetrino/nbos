import { buildWallpaperStyleText } from './wallpaper-css';
import type { PlatformAppearanceView } from './types';

const WALLPAPER_STYLE_ID = 'nbos-platform-wallpaper';

export function applyWallpaperCss(appearance: PlatformAppearanceView): void {
  const existing = document.getElementById(WALLPAPER_STYLE_ID);
  const style = existing instanceof HTMLStyleElement ? existing : document.createElement('style');
  style.id = WALLPAPER_STYLE_ID;
  style.textContent = buildWallpaperStyleText(appearance);
  if (!existing) {
    document.head.appendChild(style);
  }
}
