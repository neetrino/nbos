import {
  MAX_WALLPAPER_BYTES,
  MAX_WALLPAPER_EDGE_PX,
  MIN_WALLPAPER_EDGE_PX,
  WALLPAPER_EXTENSION,
  WALLPAPER_MIME,
} from '@nbos/shared';

export async function validateWallpaperFile(file: File): Promise<string | null> {
  if (!file.name.toLowerCase().endsWith(WALLPAPER_EXTENSION) || file.type !== WALLPAPER_MIME) {
    return 'WebP only.';
  }
  if (file.size === 0 || file.size > MAX_WALLPAPER_BYTES) {
    return `File must be at most ${MAX_WALLPAPER_BYTES} bytes.`;
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return 'File is not a valid WebP image.';
  const longEdge = Math.max(bitmap.width, bitmap.height);
  const shortEdge = Math.min(bitmap.width, bitmap.height);
  bitmap.close();
  if (longEdge > MAX_WALLPAPER_EDGE_PX) {
    return `Long edge must be at most ${MAX_WALLPAPER_EDGE_PX}px.`;
  }
  if (shortEdge < MIN_WALLPAPER_EDGE_PX) {
    return `Short edge must be at least ${MIN_WALLPAPER_EDGE_PX}px.`;
  }
  return null;
}
