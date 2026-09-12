import { buildWallpaperStyleText } from '@/lib/platform-appearance/wallpaper-css';
import type { PlatformAppearanceView } from '@/lib/platform-appearance/types';

export function PlatformWallpaperStyle({
  appearance,
}: {
  appearance: PlatformAppearanceView | null;
}) {
  return <style id="nbos-platform-wallpaper">{buildWallpaperStyleText(appearance)}</style>;
}
