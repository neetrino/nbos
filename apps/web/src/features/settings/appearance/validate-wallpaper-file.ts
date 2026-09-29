import {
  MAX_WALLPAPER_BYTES,
  MAX_WALLPAPER_EDGE_PX,
  MIN_WALLPAPER_EDGE_PX,
  WALLPAPER_EXTENSION,
  WALLPAPER_MIME,
} from '@nbos/shared';

export type WallpaperFileIssue = 'format' | 'size' | 'unreadable' | 'longEdge' | 'shortEdge';

export async function validateWallpaperFile(file: File): Promise<WallpaperFileIssue | null> {
  if (!file.name.toLowerCase().endsWith(WALLPAPER_EXTENSION) || file.type !== WALLPAPER_MIME) {
    return 'format';
  }
  if (file.size === 0 || file.size > MAX_WALLPAPER_BYTES) return 'size';
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return 'unreadable';
  const longEdge = Math.max(bitmap.width, bitmap.height);
  const shortEdge = Math.min(bitmap.width, bitmap.height);
  bitmap.close();
  if (longEdge > MAX_WALLPAPER_EDGE_PX) return 'longEdge';
  if (shortEdge < MIN_WALLPAPER_EDGE_PX) return 'shortEdge';
  return null;
}
