import type { Metadata } from 'next';
import { AppLayout } from '@/components/layout/AppLayout';
import { ModuleAccessGate } from '@/components/layout/ModuleAccessGate';
import { PlatformWallpaperStyle } from '@/components/layout/PlatformWallpaperStyle';
import { PWA_MAIN_ICON_CACHE } from '@/components/pwa/pwa-constants';
import { PermissionProvider } from '@/lib/permissions';
import { fetchPlatformAppearance } from '@/lib/platform-appearance/fetch-platform-appearance';
import { MessengerPersistProvider } from '@/features/messenger/persist/MessengerPersistProvider';
import { MessengerRealtimeProvider } from '@/features/messenger/realtime/MessengerRealtimeProvider';

/** Apple touch icon stays off the root layout so /quick/task does not inherit the NBOS N. */
export const metadata: Metadata = {
  icons: {
    apple: [{ url: `/icons/apple-touch-icon.png?v=${PWA_MAIN_ICON_CACHE}`, sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    title: 'NBOS',
    statusBarStyle: 'default',
    startupImage: [
      {
        url: `/icons/splash.png?v=${PWA_MAIN_ICON_CACHE}`,
        media: '(orientation: portrait)',
      },
      {
        url: `/icons/splash-ipad.png?v=${PWA_MAIN_ICON_CACHE}`,
        media: '(orientation: landscape)',
      },
    ],
  },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const appearance = await fetchPlatformAppearance();

  return (
    <PermissionProvider>
      <MessengerPersistProvider>
        <MessengerRealtimeProvider>
          <PlatformWallpaperStyle appearance={appearance} />
          <AppLayout>
            <ModuleAccessGate>{children}</ModuleAccessGate>
          </AppLayout>
        </MessengerRealtimeProvider>
      </MessengerPersistProvider>
    </PermissionProvider>
  );
}
