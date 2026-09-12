import { toApiError } from '../api-errors';
import { api } from '../api';
import { parsePlatformAppearance } from '@/lib/platform-appearance/parse-platform-appearance';
import type { PlatformAppearanceView } from '@/lib/platform-appearance/types';
import type { WallpaperSlot } from '@nbos/shared';

export async function getPlatformAppearance(): Promise<PlatformAppearanceView> {
  const response = await api.get<PlatformAppearanceView>('/api/v1/platform/appearance');
  return response.data;
}

export async function uploadPlatformWallpaper(
  slot: WallpaperSlot,
  file: File,
): Promise<PlatformAppearanceView> {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`/api/v1/platform/appearance/wallpaper/${slot}`, {
    method: 'PUT',
    body,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw toApiError(payload, 'Wallpaper upload failed.');
  }
  const appearance = parsePlatformAppearance(payload);
  if (!appearance) {
    throw toApiError(payload, 'Wallpaper upload failed.');
  }
  return appearance;
}

export async function clearPlatformWallpaper(slot: WallpaperSlot): Promise<PlatformAppearanceView> {
  const response = await api.delete<PlatformAppearanceView>(
    `/api/v1/platform/appearance/wallpaper/${slot}`,
  );
  return response.data;
}
