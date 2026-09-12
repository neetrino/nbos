import { describe, expect, it } from 'vitest';
import { buildWallpaperStyleText, wallpaperImageLayer } from './wallpaper-css';

describe('wallpaper CSS', () => {
  it('emits a washed background only for same-origin wallpaper URLs', () => {
    const safe = '/api/v1/platform/appearance/wallpaper/light?v=4';
    expect(wallpaperImageLayer(safe)).toContain(`url("${safe}")`);
    expect(wallpaperImageLayer('https://evil.example/x.webp')).toBe('none');
  });

  it('writes light and dark custom properties', () => {
    const css = buildWallpaperStyleText({
      light: {
        slot: 'light',
        version: 2,
        url: '/api/v1/platform/appearance/wallpaper/light?v=2',
        originalFileName: 'day.webp',
        bytes: 12000,
        width: 1920,
        height: 1280,
      },
      dark: null,
    });
    expect(css).toContain('.nbos-app-canvas{--nbos-wallpaper-image:linear-gradient');
    expect(css).toContain('.dark .nbos-app-canvas{--nbos-wallpaper-image:none}');
  });
});
