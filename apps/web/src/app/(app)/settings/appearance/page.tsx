import { AppearanceWallpaperPanel } from '@/features/settings/appearance/AppearanceWallpaperPanel';
import { fetchPlatformAppearance } from '@/lib/platform-appearance/fetch-platform-appearance';

export default async function SettingsAppearancePage() {
  const appearance = (await fetchPlatformAppearance()) ?? { light: null, dark: null };
  return <AppearanceWallpaperPanel initialAppearance={appearance} />;
}
