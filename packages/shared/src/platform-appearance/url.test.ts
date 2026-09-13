import { describe, expect, it } from 'vitest';
import { buildWallpaperPublicUrl, isSafeWallpaperPublicUrl } from './url';

describe('wallpaper public URL', () => {
  it('builds a versioned same-origin path', () => {
    expect(buildWallpaperPublicUrl('light', 3)).toBe(
      '/api/v1/platform/appearance/wallpaper/light?v=3',
    );
  });

  it('accepts only the generated path shape', () => {
    expect(isSafeWallpaperPublicUrl('/api/v1/platform/appearance/wallpaper/dark?v=12')).toBe(true);
    expect(isSafeWallpaperPublicUrl('https://evil.example/x.webp')).toBe(false);
    expect(isSafeWallpaperPublicUrl('/api/v1/platform/appearance/wallpaper/light?v=1&x=1')).toBe(
      false,
    );
  });
});
