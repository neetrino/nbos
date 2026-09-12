export const PLATFORM_APPEARANCE_ID = 'default';

export const WALLPAPER_SLOTS = ['light', 'dark'] as const;

export type WallpaperSlot = (typeof WALLPAPER_SLOTS)[number];

export const WALLPAPER_MIME = 'image/webp';

export const WALLPAPER_EXTENSION = '.webp';

export const MAX_WALLPAPER_BYTES = 400 * 1024;

export const MAX_WALLPAPER_EDGE_PX = 2560;

export const MIN_WALLPAPER_EDGE_PX = 1280;

export const WALLPAPER_PUBLIC_PATH_PREFIX = '/api/v1/platform/appearance/wallpaper';

export const WALLPAPER_CACHE_CONTROL = 'public, max-age=31536000, immutable';
